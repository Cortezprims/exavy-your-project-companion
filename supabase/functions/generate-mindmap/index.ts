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
    const { documentId, userId, focusPoints, clarification } = await req.json();
    
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

    console.log('Generating mind map for:', document.title);

    // Build custom instructions
    let customInstructions = '';
    if (focusPoints && focusPoints.length > 0) {
      customInstructions += `\n\nIMPORTANT: Mets particulièrement en avant ces points clés dans la carte mentale:\n${focusPoints.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n')}`;
    }
    if (clarification) {
      customInstructions += `\n\nL'utilisateur a besoin d'éclaircissements sur cette partie du document, développe-la davantage dans la carte mentale:\n"${clarification}"`;
    }

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
            content: `Tu es un expert en organisation visuelle de l'information. Crée une structure de carte mentale hiérarchique en français.${customInstructions}

Format de réponse STRICTEMENT en JSON:
{
  "title": "Titre principal du sujet",
  "nodes": [
    {
      "id": "1",
      "label": "Concept principal 1",
      "children": [
        {
          "id": "1.1",
          "label": "Sous-concept 1.1",
          "children": []
        },
        {
          "id": "1.2",
          "label": "Sous-concept 1.2",
          "children": []
        }
      ]
    }
  ]
}

Crée une structure avec 4-6 branches principales et 2-4 sous-branches chacune. Les labels doivent être courts et percutants.`
          },
          {
            role: 'user',
            content: `Génère une carte mentale pour ce document:\n\n${document.content.substring(0, 15000)}`
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
      
      throw new Error('Failed to generate mind map');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse JSON from response
    let mindMapData = { title: document.title, nodes: [] };
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        mindMapData = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('Failed to parse mind map');
    }

    // Save mind map to database
    const { data: mindMap, error: insertError } = await supabase
      .from('mind_maps')
      .insert({
        document_id: documentId,
        user_id: userId,
        title: mindMapData.title || `Mind Map: ${document.title}`,
        nodes: mindMapData.nodes
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw new Error('Failed to save mind map');
    }

    console.log('Mind map generated successfully');

    return new Response(
      JSON.stringify({ success: true, mindMap }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating mind map:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate mind map';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
