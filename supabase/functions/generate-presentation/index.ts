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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin (bypass premium check)
    const { data: isAdminResult } = await supabase.rpc('is_admin', { _user_id: user.id });
    const isAdmin = isAdminResult === true;

    // Check premium status if not admin
    if (!isAdmin) {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      const isPremium = subscription && 
        (subscription.plan === 'monthly' || subscription.plan === 'yearly') &&
        (!subscription.expires_at || new Date(subscription.expires_at) > new Date());

      if (!isPremium) {
        return new Response(JSON.stringify({ 
          error: 'Premium subscription required',
          isPremium: false 
        }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const { documentId, theme, slideCount, includeNotes, languageLevel, graphicStyle, contentDensity, additionalNotes } = await req.json();

    // Fetch document content
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single();

    if (docError || !document) {
      return new Response(JSON.stringify({ error: 'Document not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const themeStyles: Record<string, any> = {
      modern: {
        name: 'Moderne',
        primaryColor: '#6366f1',
        secondaryColor: '#8b5cf6',
        fontFamily: 'Inter',
        backgroundColor: '#ffffff'
      },
      professional: {
        name: 'Professionnel',
        primaryColor: '#1e40af',
        secondaryColor: '#3b82f6',
        fontFamily: 'Roboto',
        backgroundColor: '#f8fafc'
      },
      creative: {
        name: 'Créatif',
        primaryColor: '#ec4899',
        secondaryColor: '#f472b6',
        fontFamily: 'Poppins',
        backgroundColor: '#fdf4ff'
      },
      minimal: {
        name: 'Minimaliste',
        primaryColor: '#18181b',
        secondaryColor: '#52525b',
        fontFamily: 'SF Pro',
        backgroundColor: '#ffffff'
      },
      academic: {
        name: 'Académique',
        primaryColor: '#166534',
        secondaryColor: '#22c55e',
        fontFamily: 'Times New Roman',
        backgroundColor: '#f0fdf4'
      }
    };

    const selectedTheme = themeStyles[theme] || themeStyles.modern;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const languageLevelMap: Record<string, string> = {
      primary: 'Niveau Primaire : utilise un vocabulaire simple, des phrases courtes, des exemples concrets et ludiques',
      secondary: 'Niveau Secondaire : utilise un vocabulaire clair et structuré, avec des définitions et des exemples',
      university: 'Niveau Universitaire : utilise un vocabulaire technique et précis, avec des références académiques',
    };

    const graphicStyleMap: Record<string, string> = {
      professional: 'Style professionnel : suggère des graphiques, schémas et diagrammes',
      playful: 'Style ludique : suggère des icônes colorées, illustrations amusantes et visuels engageants',
      minimalist: 'Style minimaliste : très peu de suggestions d\'images, mise en avant du texte',
      infographic: 'Style infographie : suggère des visualisations de données, statistiques visuelles et comparatifs',
    };

    const contentDensityMap: Record<string, string> = {
      light: 'Contenu léger : maximum 3-4 points par slide, très aéré et espacé',
      balanced: 'Contenu équilibré : 5-6 points par slide',
      dense: 'Contenu dense : 7-8 points par slide avec beaucoup de détails',
    };

    const levelInstruction = languageLevelMap[languageLevel] || languageLevelMap.university;
    const styleInstruction = graphicStyleMap[graphicStyle] || graphicStyleMap.professional;
    const densityInstruction = contentDensityMap[contentDensity] || contentDensityMap.balanced;

    const systemPrompt = `Tu es un expert en création de présentations professionnelles.
Tu crées des slides claires, visuellement attrayantes et pédagogiques.

Style de présentation : ${selectedTheme.name}
${levelInstruction}
${styleInstruction}
${densityInstruction}
- Utilise des titres impactants
${includeNotes ? '- Génère des notes de présentation détaillées pour chaque slide' : ''}
${additionalNotes ? `\nInstructions supplémentaires de l'utilisateur : ${additionalNotes}` : ''}`;

    const userPrompt = `Crée une présentation de ${slideCount || 10} slides basée sur ce document :

Titre : ${document.title}
Contenu :
${document.content?.substring(0, 10000) || document.summary || 'Pas de contenu'}

Génère la présentation en format JSON avec cette structure exacte:
{
  "title": "Titre de la présentation",
  "slides": [
    {
      "id": 1,
      "type": "title" | "content" | "section" | "quote" | "comparison" | "conclusion",
      "title": "Titre de la slide",
      "subtitle": "Sous-titre (optionnel)",
      "content": ["Point 1", "Point 2"],
      "image_suggestion": "Description d'image suggérée",
      "layout": "centered" | "left" | "right" | "split"
    }
  ],
  "speaker_notes": [
    {
      "slide_id": 1,
      "notes": "Notes détaillées pour le présentateur..."
    }
  ]
}

Structure recommandée:
1. Slide de titre
2. Introduction/Objectifs
3-${(slideCount || 10) - 2}. Contenu principal
${slideCount || 10}. Conclusion/Récapitulatif

Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error('Failed to generate presentation');
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || '';

    // Parse JSON from response
    let presentationData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        presentationData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('Failed to parse presentation data');
    }

    // Save presentation to database
    const { data: presentation, error: insertError } = await supabase
      .from('presentations')
      .insert({
        user_id: user.id,
        document_id: documentId,
        title: presentationData.title || `Présentation - ${document.title}`,
        theme,
        slides: presentationData.slides || [],
        speaker_notes: presentationData.speaker_notes || [],
        design_settings: selectedTheme,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw new Error('Failed to save presentation');
    }

    return new Response(JSON.stringify({ presentation }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Generate presentation error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
