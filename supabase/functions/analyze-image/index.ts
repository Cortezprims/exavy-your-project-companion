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
    const { documentId, analysisType = 'full' } = await req.json();
    
    if (!documentId) {
      return new Response(
        JSON.stringify({ error: 'Document ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get document info
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      console.error('Document not found:', docError);
      return new Response(
        JSON.stringify({ error: 'Document not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (document.file_type !== 'image') {
      return new Response(
        JSON.stringify({ error: 'Document is not an image file' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update status to processing
    await supabase
      .from('documents')
      .update({ status: 'processing' })
      .eq('id', documentId);

    console.log('Analyzing image:', document.title);

    // Download image from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(document.file_path);

    if (downloadError) {
      console.error('Download error:', downloadError);
      await supabase
        .from('documents')
        .update({ status: 'error' })
        .eq('id', documentId);
      return new Response(
        JSON.stringify({ error: 'Failed to download image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let base64 = '';
    const chunkSize = 32768;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      base64 += String.fromCharCode(...chunk);
    }
    base64 = btoa(base64);

    // Build analysis prompt based on type
    let analysisPrompt = '';
    switch (analysisType) {
      case 'ocr':
        analysisPrompt = `Extrais TOUT le texte visible dans cette image (OCR). Retourne uniquement le texte extrait, en préservant la structure et la mise en page autant que possible.`;
        break;
      case 'description':
        analysisPrompt = `Décris cette image en détail. Inclus:
- Une description générale de l'image
- Les éléments principaux visibles
- Les couleurs et l'ambiance
- Tout texte visible
- Le contexte probable de cette image`;
        break;
      case 'full':
      default:
        analysisPrompt = `Analyse complète de cette image. Fournis:

1. **TEXTE EXTRAIT (OCR):**
Extrais tout le texte visible dans l'image.

2. **DESCRIPTION:**
Décris l'image en détail (éléments, couleurs, contexte).

3. **INFORMATIONS CLÉS:**
Liste les informations importantes extraites de cette image.

4. **DONNÉES STRUCTURÉES:**
Si l'image contient des tableaux, graphiques, ou données structurées, extrais-les sous forme de texte organisé.

Retourne le tout sous forme de texte clair et structuré.`;
        break;
    }

    // Use Lovable AI for image analysis
    const analyzeResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: analysisPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${document.mime_type};base64,${base64}`
                }
              }
            ]
          }
        ],
      }),
    });

    if (!analyzeResponse.ok) {
      const errorText = await analyzeResponse.text();
      console.error('Analysis error:', errorText);
      
      if (analyzeResponse.status === 429) {
        await supabase.from('documents').update({ status: 'error' }).eq('id', documentId);
        return new Response(
          JSON.stringify({ error: 'Limite de requêtes atteinte, réessayez plus tard.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error('Failed to analyze image');
    }

    const analyzeData = await analyzeResponse.json();
    const textContent = analyzeData.choices?.[0]?.message?.content || '';

    console.log('Analyzed content length:', textContent.length);

    // Generate summary
    let summary = '';
    if (textContent.length > 100) {
      const summaryResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
              content: 'Tu es un assistant qui crée des résumés concis. Résume en 2-3 phrases.'
            },
            {
              role: 'user',
              content: `Résume cette analyse d'image:\n\n${textContent.substring(0, 5000)}`
            }
          ],
        }),
      });

      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        summary = summaryData.choices?.[0]?.message?.content || '';
      }
    }

    // Update document with analyzed content
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        content: textContent,
        summary: summary,
        status: 'completed'
      })
      .eq('id', documentId);

    if (updateError) {
      console.error('Update error:', updateError);
      throw new Error('Failed to update document');
    }

    console.log('Image analysis completed successfully');

    return new Response(
      JSON.stringify({ success: true, contentLength: textContent.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error analyzing image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze image';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
