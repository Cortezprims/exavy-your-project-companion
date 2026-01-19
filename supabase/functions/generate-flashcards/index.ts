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
    const { documentId, cardCount = 15, focusArea = '', specificPart = '' } = await req.json();
    
    if (!documentId) {
      return new Response(
        JSON.stringify({ error: 'Document ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get document content - verify ownership
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('title, content')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single();

    if (docError || !document?.content) {
      console.error('Document not found or no content:', docError);
      return new Response(
        JSON.stringify({ error: 'Document not found or not processed yet' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating flashcards for:', document.title);

    // Build focus prompt if user specified a focus area or specific part
    let focusPrompt = '';
    if (focusArea) {
      focusPrompt += `\n\nFOCUS SPÉCIFIQUE: Concentre-toi sur le thème/concept: "${focusArea}". Les flashcards doivent principalement porter sur ce sujet.`;
    }
    if (specificPart) {
      focusPrompt += `\n\nPARTIE SPÉCIFIQUE: L'utilisateur veut des flashcards sur: "${specificPart}". Crée des cartes uniquement sur cette section.`;
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
            content: `Tu es un expert en création de flashcards éducatives. Crée des cartes mémoire efficaces en français.
Chaque carte doit avoir une question/terme au recto et une réponse/définition concise au verso.${focusPrompt}

Format de réponse STRICTEMENT en JSON:
{
  "cards": [
    {
      "front": "Question ou terme",
      "back": "Réponse ou définition",
      "difficulty": "easy|medium|hard"
    }
  ]
}`
          },
          {
            role: 'user',
            content: `Génère exactement ${cardCount} flashcards basées sur ce contenu:\n\n${document.content.substring(0, 15000)}`
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
      
      throw new Error('Failed to generate flashcards');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse JSON from response
    let cards = [];
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        cards = parsed.cards || [];
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('Failed to parse flashcards');
    }

    // Create deck
    const { data: deck, error: deckError } = await supabase
      .from('flashcard_decks')
      .insert({
        document_id: documentId,
        user_id: userId,
        title: `Flashcards: ${document.title}`
      })
      .select()
      .single();

    if (deckError) {
      console.error('Deck insert error:', deckError);
      throw new Error('Failed to create deck');
    }

    // Insert flashcards
    const flashcardsToInsert = cards.map((card: any) => ({
      deck_id: deck.id,
      user_id: userId,
      front: card.front,
      back: card.back,
      difficulty: card.difficulty || 'medium'
    }));

    const { error: cardsError } = await supabase
      .from('flashcards')
      .insert(flashcardsToInsert);

    if (cardsError) {
      console.error('Cards insert error:', cardsError);
      throw new Error('Failed to save flashcards');
    }

    console.log('Flashcards generated:', cards.length);

    return new Response(
      JSON.stringify({ success: true, deck, cardCount: cards.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating flashcards:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate flashcards';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
