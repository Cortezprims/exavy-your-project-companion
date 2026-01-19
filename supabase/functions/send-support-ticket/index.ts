import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TicketRequest {
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Non autorisé" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
    
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Utilisateur non authentifié" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = userData.user.id;
    const { email, phone, subject, message }: TicketRequest = await req.json();

    // Use service role client to insert ticket
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert ticket into database
    const { data: ticket, error: ticketError } = await supabase
      .from("support_tickets")
      .insert({
        user_id: userId,
        email,
        phone,
        subject,
        message,
        status: "open"
      })
      .select()
      .single();

    if (ticketError) {
      console.error("Error creating ticket:", ticketError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la création du ticket" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send email notification if Resend is configured
    if (resendApiKey) {
      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${resendApiKey}`
          },
          body: JSON.stringify({
            from: "EXAVY Support <onboarding@resend.dev>",
            to: ["avydigitalbusiness@gmail.com"],
            subject: `[EXAVY Support] Nouveau ticket: ${subject}`,
            html: `
              <h1>Nouveau ticket de support</h1>
              <p><strong>De:</strong> ${email}</p>
              ${phone ? `<p><strong>Téléphone:</strong> ${phone}</p>` : ""}
              <p><strong>Sujet:</strong> ${subject}</p>
              <hr />
              <h2>Message:</h2>
              <p>${message.replace(/\n/g, "<br>")}</p>
              <hr />
              <p><small>ID du ticket: ${ticket.id}</small></p>
              <p><small>Date: ${new Date().toLocaleString("fr-FR")}</small></p>
            `,
          })
        });

        if (emailResponse.ok) {
          console.log("Email sent successfully");
        } else {
          console.error("Email API error:", await emailResponse.text());
        }
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        // Don't fail the request if email fails, ticket is already created
      }
    } else {
      console.log("RESEND_API_KEY not configured, skipping email");
    }

    return new Response(
      JSON.stringify({ success: true, ticketId: ticket.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-support-ticket:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});