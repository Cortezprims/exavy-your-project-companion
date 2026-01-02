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
    const { documentId, userId, questionCount = 10, difficulty = 'medium' } = await req.json();
    
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

    console.log('Generating quiz for:', document.title);

    const difficultyMap: Record<string, string> = {
      easy: 'Les questions doivent être simples et directes, testant la compréhension basique.',
      medium: 'Les questions doivent être de difficulté moyenne, testant la compréhension et l\'application.',
      hard: 'Les questions doivent être difficiles, testant l\'analyse et la synthèse des concepts.'
    };
    const difficultyPrompt = difficultyMap[difficulty] || difficultyMap.medium;

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
            content: `Tu es un expert en création de quiz éducatifs. Crée des QCM en français basés sur le contenu fourni.
${difficultyPrompt}

Format de réponse STRICTEMENT en JSON:
{
  "questions": [
    {
      "question": "La question...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Explication de la bonne réponse..."
    }
  ]
}`
          },
          {
            role: 'user',
            content: `Génère exactement ${questionCount} questions QCM basées sur ce contenu:\n\n${document.content.substring(0, 15000)}`
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
      
      throw new Error('Failed to generate quiz');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse JSON from response
    let questions = [];
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        questions = parsed.questions || [];
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('Failed to parse quiz questions');
    }

    // Save quiz to database
    const { data: quiz, error: insertError } = await supabase
      .from('quizzes')
      .insert({
        document_id: documentId,
        user_id: userId,
        title: `Quiz: ${document.title}`,
        difficulty,
        questions
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw new Error('Failed to save quiz');
    }

    console.log('Quiz generated with', questions.length, 'questions');

    return new Response(
      JSON.stringify({ success: true, quiz }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating quiz:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate quiz';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
