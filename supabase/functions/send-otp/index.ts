import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple email validation
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: "Email requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!isValidEmail(email)) {
      return new Response(
        JSON.stringify({ error: "Format d'email invalide" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Rate limiting: check how many OTPs were sent to this email in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recentOtps, error: rateError } = await supabase
      .from("otp_codes")
      .select("id")
      .eq("email", email)
      .gte("created_at", fiveMinutesAgo);

    if (!rateError && recentOtps && recentOtps.length >= 3) {
      return new Response(
        JSON.stringify({ error: "Trop de demandes. Veuillez réessayer dans quelques minutes." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cleanup: delete expired OTP codes for this email
    await supabase
      .from("otp_codes")
      .delete()
      .eq("email", email)
      .lt("expires_at", new Date().toISOString());

    // Delete any existing non-expired OTP for this email (only allow one active OTP)
    await supabase.from("otp_codes").delete().eq("email", email);

    // Generate 6-digit OTP code using crypto for better randomness
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const otpCode = (100000 + (array[0] % 900000)).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Insert new OTP
    const { error: insertError } = await supabase.from("otp_codes").insert({
      email,
      code: otpCode,
      expires_at: expiresAt.toISOString(),
      verified: false,
    });

    if (insertError) {
      console.error("Error inserting OTP:", insertError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la création du code" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send email with OTP
    if (resendApiKey) {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "EXAVY <onboarding@resend.dev>",
          to: [email],
          subject: "Votre code de vérification EXAVY",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #6366f1; margin: 0;">EXAVY</h1>
                <p style="color: #64748b; margin-top: 5px;">Votre assistant d'apprentissage intelligent</p>
              </div>
              
              <div style="background: #f8fafc; border-radius: 12px; padding: 30px; text-align: center;">
                <h2 style="color: #1e293b; margin-bottom: 10px;">Code de vérification</h2>
                <p style="color: #64748b; margin-bottom: 20px;">
                  Utilisez ce code pour vérifier votre adresse email :
                </p>
                <div style="background: #6366f1; color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 20px 40px; border-radius: 8px; display: inline-block;">
                  ${otpCode}
                </div>
                <p style="color: #94a3b8; margin-top: 20px; font-size: 14px;">
                  Ce code expire dans 10 minutes.
                </p>
              </div>
              
              <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 30px;">
                Si vous n'avez pas demandé ce code, ignorez cet email.
              </p>
            </div>
          `,
        }),
      });

      if (!emailResponse.ok) {
        console.error("Email send error:", await emailResponse.text());
      }
    } else {
      console.log("RESEND_API_KEY not configured, OTP code generated");
    }

    return new Response(
      JSON.stringify({ success: true, message: "Code envoyé par email" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-otp:", error);
    return new Response(
      JSON.stringify({ error: "Impossible de traiter la demande" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
