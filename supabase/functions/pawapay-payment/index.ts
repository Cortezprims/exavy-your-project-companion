import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// PRODUCTION API URL
const PAWAPAY_API_URL = 'https://api.pawapay.io';

interface PaymentRequest {
  amount: number;
  currency: string;
  phoneNumber: string;
  provider: string;
  planId: string;
  userId: string;
}

interface PawaPayDepositResponse {
  depositId: string;
  status: string;
  created: string;
}

// Generate UUIDv4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // Handle webhook/callback from PawaPay
    if (action === 'callback') {
      return handleCallback(req);
    }

    // Handle status check
    if (action === 'status') {
      const { depositId } = await req.json();
      return checkPaymentStatus(depositId);
    }

    // Handle get available providers
    if (action === 'providers') {
      return getAvailableProviders();
    }

    // Default: initiate payment (deposit)
    const { amount, currency, phoneNumber, provider, planId, userId } = await req.json() as PaymentRequest;

    if (!amount || !phoneNumber || !provider || !planId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: amount, phoneNumber, provider, planId, userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Initiating PawaPay payment for:', { amount, currency, phone: phoneNumber, provider, planId, userId });

    // Get PawaPay API token
    const apiToken = Deno.env.get('PAWAPAY_API_TOKEN');

    if (!apiToken) {
      console.error('Missing PawaPay API token');
      return new Response(
        JSON.stringify({ error: 'Payment service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique depositId (UUIDv4)
    const depositId = generateUUID();

    // Prepare the payload for PawaPay
    const payload = {
      depositId: depositId,
      amount: amount.toString(),
      currency: currency || 'USD',
      payer: {
        type: "MSISDN",
        address: {
          value: phoneNumber
        }
      },
      correspondent: provider,
      statementDescription: "EXAVY Premium",
      customerTimestamp: new Date().toISOString(),
      preAuthorisationCode: undefined
    };

    console.log('PawaPay request payload:', JSON.stringify(payload));

    // Initiate deposit request
    const depositResponse = await fetch(`${PAWAPAY_API_URL}/deposits`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await depositResponse.text();
    console.log('PawaPay response status:', depositResponse.status);
    console.log('PawaPay response body:', responseText);

    if (!depositResponse.ok) {
      console.error('Deposit initiation failed:', responseText);
      return new Response(
        JSON.stringify({ error: 'Failed to initiate payment', details: responseText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const depositData: PawaPayDepositResponse = JSON.parse(responseText);
    console.log('Deposit initiated:', depositData);

    // Store transaction in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store the pending transaction
    const { error: insertError } = await supabase
      .from('pawapay_transactions')
      .insert({
        deposit_id: depositId,
        user_id: userId,
        amount: amount.toString(),
        currency: currency || 'USD',
        phone_number: phoneNumber,
        provider: provider,
        subscription_plan: planId,
        status: depositData.status || 'ACCEPTED',
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error storing transaction:', insertError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        depositId: depositId,
        status: depositData.status,
        message: 'Veuillez confirmer le paiement sur votre téléphone en entrant votre code PIN',
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

async function getAvailableProviders() {
  try {
    const apiToken = Deno.env.get('PAWAPAY_API_TOKEN');

    const response = await fetch(`${PAWAPAY_API_URL}/active-conf`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log('Available providers:', data);

    return new Response(
      JSON.stringify({
        success: true,
        correspondents: data.correspondents || [],
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching providers:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch providers' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function checkPaymentStatus(depositId: string) {
  try {
    const apiToken = Deno.env.get('PAWAPAY_API_TOKEN');

    const statusResponse = await fetch(`${PAWAPAY_API_URL}/deposits/${depositId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    });

    const statusData = await statusResponse.json();
    console.log('Payment status:', statusData);

    // Update transaction in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (statusData.status) {
      await supabase
        .from('pawapay_transactions')
        .update({ 
          status: statusData.status,
          failure_reason: statusData.failureReason?.failureMessage || null,
          completed_at: ['COMPLETED', 'FAILED'].includes(statusData.status) ? new Date().toISOString() : null,
        })
        .eq('deposit_id', depositId);
    }

    return new Response(
      JSON.stringify({
        status: statusData.status,
        depositId: statusData.depositId,
        amount: statusData.amount,
        failureReason: statusData.failureReason?.failureMessage,
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

async function handleCallback(req: Request) {
  try {
    const body = await req.json();
    
    console.log('PawaPay callback received:', body);

    const { depositId, status, failureReason } = body;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the transaction
    const { data: transaction, error: fetchError } = await supabase
      .from('pawapay_transactions')
      .select('*')
      .eq('deposit_id', depositId)
      .single();

    if (fetchError || !transaction) {
      console.error(`Transaction ${depositId} not found`);
      return new Response(
        JSON.stringify({ error: 'Transaction not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update transaction status
    await supabase
      .from('pawapay_transactions')
      .update({
        status: status,
        failure_reason: failureReason?.failureMessage || null,
        completed_at: new Date().toISOString(),
        callback_received: true,
      })
      .eq('deposit_id', depositId);

    // If payment completed, activate subscription
    if (status === 'COMPLETED') {
      const userId = transaction.user_id;
      const planId = transaction.subscription_plan;

      // Calculate expiration date
      const now = new Date();
      let expiresAt: Date;
      if (planId === 'yearly') {
        expiresAt = new Date(now.setFullYear(now.getFullYear() + 1));
      } else {
        expiresAt = new Date(now.setMonth(now.getMonth() + 1));
      }

      // Upsert subscription
      const { error: subError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          plan: planId,
          status: 'active',
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          payment_reference: depositId,
          amount: parseFloat(transaction.amount),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (subError) {
        console.error('Error updating subscription:', subError);
      } else {
        console.log('Subscription activated for user:', userId, 'plan:', planId);
      }
    }

    // Respond with 200 OK (required by PawaPay)
    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Callback error:', error);
    return new Response(
      JSON.stringify({ error: 'Callback processing failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
