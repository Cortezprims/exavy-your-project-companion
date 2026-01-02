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
    const { documentId } = await req.json();
    
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

    // Update status to processing
    await supabase
      .from('documents')
      .update({ status: 'processing' })
      .eq('id', documentId);

    console.log('Processing document:', document.title);

    // Download file from storage
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
        JSON.stringify({ error: 'Failed to download file' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let textContent = '';

    // Extract text based on file type
    if (document.file_type === 'pdf') {
      // For PDFs, we'll use base64 and send to Lovable AI for extraction
      const arrayBuffer = await fileData.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      const extractResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
                  text: 'Extract ALL the text content from this PDF document. Return ONLY the extracted text, nothing else. Preserve the structure and formatting as much as possible.'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:application/pdf;base64,${base64}`
                  }
                }
              ]
            }
          ],
        }),
      });

      if (!extractResponse.ok) {
        const errorText = await extractResponse.text();
        console.error('AI extraction error:', errorText);
        throw new Error('Failed to extract text from PDF');
      }

      const extractData = await extractResponse.json();
      textContent = extractData.choices?.[0]?.message?.content || '';
    } else if (document.file_type === 'image') {
      // For images, use OCR via Lovable AI
      const arrayBuffer = await fileData.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      const extractResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
                  text: 'Extract ALL the text visible in this image using OCR. Return ONLY the extracted text, nothing else.'
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

      if (!extractResponse.ok) {
        const errorText = await extractResponse.text();
        console.error('AI OCR error:', errorText);
        throw new Error('Failed to extract text from image');
      }

      const extractData = await extractResponse.json();
      textContent = extractData.choices?.[0]?.message?.content || '';
    } else if (document.file_type === 'audio') {
      // For audio, transcribe using Lovable AI
      textContent = 'Audio transcription is not yet supported.';
    }

    console.log('Extracted text length:', textContent.length);

    // Generate summary using Lovable AI
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
              content: 'Tu es un assistant qui crée des résumés concis et clairs en français. Résume le texte en 2-3 phrases.'
            },
            {
              role: 'user',
              content: `Résume ce texte:\n\n${textContent.substring(0, 10000)}`
            }
          ],
        }),
      });

      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        summary = summaryData.choices?.[0]?.message?.content || '';
      }
    }

    // Update document with extracted content
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

    console.log('Document processed successfully');

    return new Response(
      JSON.stringify({ success: true, contentLength: textContent.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing document:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process document';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
