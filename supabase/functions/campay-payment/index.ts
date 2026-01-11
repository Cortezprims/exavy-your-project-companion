import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  amount: number;
  phoneNumber: string;
  planId: string;
  userId: string;
}

interface CampayPaymentResponse {
  reference: string;
  ussd_code?: string;
  operator?: string;
  status?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // Handle webhook from Campay
    if (action === 'webhook') {
      return handleWebhook(req);
    }

    // Handle status check
    if (action === 'status') {
      const { reference } = await req.json();
      return checkPaymentStatus(reference);
    }

    // Default: initiate payment
    const { amount, phoneNumber, planId, userId } = await req.json() as PaymentRequest;

    if (!amount || !phoneNumber || !planId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: amount, phoneNumber, planId, userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format phone number (remove spaces, ensure country code)
    const formattedPhone = formatPhoneNumber(phoneNumber);
    console.log('Initiating payment for:', { amount, phone: formattedPhone, planId, userId });

    // Get Campay credentials
    const username = Deno.env.get('CAMPAY_USERNAME');
    const password = Deno.env.get('CAMPAY_PASSWORD');
    const permanentToken = Deno.env.get('CAMPAY_API_TOKEN');

    if (!username || !password) {
      console.error('Missing Campay credentials');
      return new Response(
        JSON.stringify({ error: 'Payment service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get temporary access token from Campay
    console.log('Authenticating with Campay...');
    const tokenResponse = await fetch('https://demo.campay.net/api/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username,
        password: password,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Failed to get Campay token:', errorText);
      
      // Fallback to permanent token if available
      if (permanentToken) {
        console.log('Falling back to permanent token...');
      } else {
        return new Response(
          JSON.stringify({ error: 'Failed to authenticate with payment service', details: errorText }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    let accessToken: string;
    if (tokenResponse.ok) {
      const tokenData = await tokenResponse.json();
      accessToken = tokenData.token;
      console.log('Got temporary access token');
    } else if (permanentToken) {
      accessToken = permanentToken;
      console.log('Using permanent token as fallback');
    } else {
      return new Response(
        JSON.stringify({ error: 'No valid authentication available' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initiate payment request
    const paymentResponse = await fetch('https://demo.campay.net/api/collect/', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount.toString(),
        currency: 'XAF',
        from: formattedPhone,
        description: `Exavy - Abonnement ${planId}`,
        external_reference: `${userId}_${planId}_${Date.now()}`,
      }),
    });

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text();
      console.error('Payment initiation failed:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to initiate payment', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const paymentData: CampayPaymentResponse = await paymentResponse.json();
    console.log('Payment initiated:', paymentData);

    return new Response(
      JSON.stringify({
        success: true,
        reference: paymentData.reference,
        ussdCode: paymentData.ussd_code,
        operator: paymentData.operator,
        message: 'Veuillez confirmer le paiement sur votre téléphone',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Payment error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function checkPaymentStatus(reference: string) {
  try {
    // Use permanent access token
    const accessToken = Deno.env.get('CAMPAY_API_TOKEN');

    // Check transaction status
    const statusResponse = await fetch(`https://demo.campay.net/api/transaction/${reference}/`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const statusData = await statusResponse.json();
    console.log('Payment status:', statusData);

    return new Response(
      JSON.stringify({
        status: statusData.status,
        reference: statusData.reference,
        amount: statusData.amount,
        operator: statusData.operator,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Status check error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to check payment status' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleWebhook(req: Request) {
  try {
    const webhookSecret = Deno.env.get('CAMPAY_WEBHOOK_SECRET');
    const body = await req.json();
    
    console.log('Webhook received:', body);

    // Verify webhook signature if provided
    const signature = req.headers.get('x-campay-signature');
    if (webhookSecret && signature) {
      // Implement signature verification logic here if needed
      console.log('Webhook signature:', signature);
    }

    const { status, reference, external_reference, amount, operator } = body;

    if (status === 'SUCCESSFUL') {
      // Parse external_reference to get userId and planId
      const [userId, planId] = external_reference.split('_');
      
      // Update user subscription in database
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Here you could update a subscriptions table
      console.log('Payment successful for user:', userId, 'plan:', planId);

      // Log the transaction
      console.log('Transaction completed:', {
        reference,
        amount,
        operator,
        userId,
        planId,
        status: 'SUCCESSFUL',
      });
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If starts with 237, keep it; if starts with 6, add 237
  if (cleaned.startsWith('237')) {
    return cleaned;
  } else if (cleaned.startsWith('6')) {
    return '237' + cleaned;
  }
  
  return cleaned;
}
