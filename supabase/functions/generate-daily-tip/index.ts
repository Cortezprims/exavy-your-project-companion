import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate Authorization header and extract user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Create client with user's auth context
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the JWT and get user
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getUser(token);
    
    if (claimsError || !claimsData?.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.user.id;
    
    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if user is admin (bypass premium check)
    const { data: isAdminResult } = await supabase.rpc('is_admin', { _user_id: userId });
    const isAdmin = isAdminResult === true;

    // Check if user has premium subscription (skip for admins)
    if (!isAdmin) {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan, status, expires_at')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      const isPremium = subscription && 
        (subscription.plan === 'monthly' || subscription.plan === 'yearly') &&
        (!subscription.expires_at || new Date(subscription.expires_at) > new Date());

      if (!isPremium) {
        return new Response(
          JSON.stringify({ error: 'Premium subscription required', isPremium: false }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get user's documents with content
    const { data: documents, error: docError } = await supabase
      .from('documents')
      .select('id, title, content, summary')
      .eq('user_id', userId)
      .not('content', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);

    if (docError || !documents || documents.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No documents found', hasDocuments: false }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get previously shown tips to avoid repetition
    const { data: shownTips } = await supabase
      .from('daily_tips_shown')
      .select('tip_hash')
      .eq('user_id', userId)
      .order('shown_at', { ascending: false })
      .limit(50);

    const shownHashes = shownTips?.map(t => t.tip_hash) || [];

    // Prepare document excerpts for AI
    const documentExcerpts = documents.map(doc => ({
      title: doc.title,
      content: (doc.content || '').substring(0, 2000),
      summary: doc.summary || ''
    }));

    // Generate unique tip using AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Tu es un assistant éducatif français expert. Génère UN conseil unique, une définition importante, ou une note de rappel basée sur les documents de l'utilisateur.

Le conseil doit être:
- UNIQUE et DIFFÉRENT à chaque fois
- Basé sur le contenu réel des documents
- Court (2-3 phrases maximum)
- Utile pour l'apprentissage
- Formulé de manière engageante

Types de conseils possibles:
1. "💡 Conseil du jour" - Une astuce d'étude basée sur le contenu
2. "📖 Définition à retenir" - Un concept clé extrait des documents
3. "🔔 Rappel" - Un point important à ne pas oublier
4. "🎯 Point clé" - Une notion fondamentale

IMPORTANT: Ne répète JAMAIS un conseil déjà donné. Voici les hashes des conseils précédents à éviter: ${shownHashes.slice(0, 10).join(', ')}

Réponds UNIQUEMENT en JSON:
{
  "type": "conseil|definition|rappel|point_cle",
  "emoji": "💡|📖|🔔|🎯",
  "title": "Titre court",
  "content": "Le conseil complet en 2-3 phrases.",
  "source_document": "Titre du document source"
}`
          },
          {
            role: 'user',
            content: `Génère un conseil unique basé sur ces documents:\n\n${JSON.stringify(documentExcerpts)}`
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error('AI request failed');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse JSON response
    let tip = null;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        tip = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('Failed to parse tip');
    }

    if (!tip) {
      throw new Error('No tip generated');
    }

    // Generate hash for this tip
    const tipHash = btoa(tip.title + tip.content).substring(0, 32);

    // Save shown tip to database (ignore if already exists)
    try {
      await supabase.from('daily_tips_shown').insert({
        user_id: userId,
        tip_hash: tipHash
      });
    } catch (insertErr) {
      // Ignore duplicate key errors
      console.log('Tip already shown or insert error:', insertErr);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        tip,
        isPremium: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating daily tip:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to generate tip' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
