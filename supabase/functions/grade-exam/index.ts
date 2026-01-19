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
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
    const { examId, answers } = await req.json();

    if (!examId || !answers) {
      return new Response(
        JSON.stringify({ error: 'examId and answers are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the exam - verify ownership
    const { data: exam, error: examError } = await supabase
      .from('mock_exams')
      .select('*')
      .eq('id', examId)
      .eq('user_id', userId)
      .single();

    if (examError || !exam) {
      return new Response(
        JSON.stringify({ error: 'Exam not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const questions = exam.questions as any[];
    
    // Auto-grade QCM and true/false questions
    let autoGradedScore = 0;
    const autoGradedFeedback: Record<string, any> = {};
    const questionsNeedingAI: any[] = [];

    for (const question of questions) {
      const userAnswer = answers[question.id];
      
      if (question.type === 'qcm' || question.type === 'true_false') {
        if (userAnswer === question.correctAnswer) {
          autoGradedScore += question.points;
          autoGradedFeedback[question.id] = {
            correct: true,
            score: question.points,
            maxScore: question.points,
            feedback: 'Bonne réponse !',
          };
        } else {
          autoGradedFeedback[question.id] = {
            correct: false,
            score: 0,
            maxScore: question.points,
            correctAnswer: question.correctAnswer,
            feedback: `La bonne réponse était: ${question.correctAnswer}`,
          };
        }
      } else {
        // Open questions need AI grading
        questionsNeedingAI.push({
          ...question,
          userAnswer,
        });
      }
    }

    // Use AI to grade open questions
    let aiGradedScore = 0;
    const aiGradedFeedback: Record<string, any> = {};

    if (questionsNeedingAI.length > 0) {
      const systemPrompt = `Tu es un correcteur d'examen professionnel et bienveillant.
Tu dois évaluer les réponses de l'étudiant de manière juste et constructive.
Pour chaque réponse, donne:
1. Une note sur le barème indiqué
2. Un feedback détaillé et encourageant
3. Des pistes d'amélioration si nécessaire

Réponds UNIQUEMENT avec un JSON valide.`;

      const userPrompt = `Évalue ces réponses d'examen:

${questionsNeedingAI.map(q => `
Question ${q.id} (${q.points} points):
"${q.question}"

Critères de notation: ${q.gradingCriteria || 'Évaluation standard'}

Réponse de l'étudiant:
"${q.userAnswer || '(Pas de réponse)'}"
`).join('\n---\n')}

Réponds avec ce format JSON:
{
  "grades": {
    "q1": {
      "score": 1.5,
      "maxScore": 2,
      "feedback": "Feedback détaillé...",
      "suggestions": "Suggestions d'amélioration..."
    }
  }
}`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      });

      if (response.ok) {
        const aiResponse = await response.json();
        const content = aiResponse.choices?.[0]?.message?.content;
        
        if (content) {
          try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const grades = JSON.parse(jsonMatch[0]);
              
              for (const [qId, grade] of Object.entries(grades.grades || {})) {
                const g = grade as any;
                aiGradedScore += g.score || 0;
                aiGradedFeedback[qId] = {
                  correct: g.score >= g.maxScore * 0.5,
                  score: g.score,
                  maxScore: g.maxScore,
                  feedback: g.feedback,
                  suggestions: g.suggestions,
                };
              }
            }
          } catch (parseError) {
            console.error('Parse error:', parseError);
          }
        }
      }
    }

    // Combine all feedback
    const allFeedback = { ...autoGradedFeedback, ...aiGradedFeedback };
    const totalScore = autoGradedScore + aiGradedScore;
    const percentage = (totalScore / exam.total_points) * 100;

    // Generate overall feedback
    let overallFeedback = '';
    if (percentage >= 80) {
      overallFeedback = '🎉 Excellent travail ! Tu maîtrises très bien ce sujet.';
    } else if (percentage >= 60) {
      overallFeedback = '👍 Bon travail ! Quelques points à approfondir mais tu es sur la bonne voie.';
    } else if (percentage >= 40) {
      overallFeedback = '📚 Des efforts à faire. Revois les points faibles et réessaie !';
    } else {
      overallFeedback = '💪 Ne te décourage pas ! Reprends les bases et progresse étape par étape.';
    }

    // Update exam with results
    const { error: updateError } = await supabase
      .from('mock_exams')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        user_score: totalScore,
        user_answers: answers,
        ai_feedback: {
          questionFeedback: allFeedback,
          overallFeedback,
          totalScore,
          maxScore: exam.total_points,
          percentage: Math.round(percentage * 10) / 10,
        },
      })
      .eq('id', examId);

    if (updateError) {
      console.error('Update error:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        results: {
          totalScore,
          maxScore: exam.total_points,
          percentage: Math.round(percentage * 10) / 10,
          overallFeedback,
          questionFeedback: allFeedback,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Grade exam error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
