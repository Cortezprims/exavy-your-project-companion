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
    const { documentId, userId } = await req.json();
    
    if (!documentId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Document ID and User ID are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get document content
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('title, content')
      .eq('id', documentId)
      .single();

    if (docError || !document?.content) {
      console.error('Document not found or no content:', docError);
      return new Response(
        JSON.stringify({ error: 'Document not found or not processed yet' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating summary for:', document.title);

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
            content: `Tu es un expert en synthèse de documents. Génère des résumés clairs et structurés en français.

Format de réponse STRICTEMENT en JSON:
{
  "shortSummary": "Résumé court en 2-3 phrases (max 250 mots)",
  "longSummary": "Résumé détaillé avec structure claire (500+ mots, utilise des bullet points)",
  "keyConcepts": [
    {
      "term": "Concept clé",
      "definition": "Définition concise"
    }
  ]
}`
          },
          {
            role: 'user',
            content: `Génère un résumé complet de ce document:\n\n${document.content.substring(0, 20000)}`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI error:', errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requêtes atteinte, réessayez plus tard.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error('Failed to generate summary');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse JSON from response
    let summaryData = { shortSummary: '', longSummary: '', keyConcepts: [] };
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        summaryData = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      // Fallback: use the raw content as long summary
      summaryData.longSummary = content;
    }

    // Save summary to database
    const { data: summary, error: insertError } = await supabase
      .from('summaries')
      .insert({
        document_id: documentId,
        user_id: userId,
        short_summary: summaryData.shortSummary,
        long_summary: summaryData.longSummary,
        key_concepts: summaryData.keyConcepts
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw new Error('Failed to save summary');
    }

    console.log('Summary generated successfully');

    return new Response(
      JSON.stringify({ success: true, summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating summary:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate summary';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
