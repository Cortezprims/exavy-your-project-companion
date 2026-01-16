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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get users with weekly reports enabled (premium only)
    const { data: premiumUsers } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('status', 'active')
      .in('plan', ['monthly', 'yearly']);

    if (!premiumUsers || premiumUsers.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No premium users to send reports to' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userIds = premiumUsers.map(u => u.user_id);

    // Calculate week dates
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setHours(23, 59, 59, 999);
    
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const reports = [];

    for (const userId of userIds) {
      try {
        // Get user email
        const { data: userData } = await supabase.auth.admin.getUserById(userId);
        if (!userData?.user?.email) continue;

        const userEmail = userData.user.email;

        // Get user preferences
        const { data: prefs } = await supabase
          .from('user_preferences')
          .select('weekly_reports_enabled')
          .eq('user_id', userId)
          .maybeSingle();

        if (prefs && !prefs.weekly_reports_enabled) continue;

        // Calculate weekly stats
        const [docsRes, quizzesRes, flashcardsRes, summariesRes, mindMapsRes] = await Promise.all([
          supabase
            .from('documents')
            .select('id', { count: 'exact' })
            .eq('user_id', userId)
            .gte('created_at', weekStart.toISOString())
            .lte('created_at', weekEnd.toISOString()),
          supabase
            .from('quizzes')
            .select('id', { count: 'exact' })
            .eq('user_id', userId)
            .gte('created_at', weekStart.toISOString())
            .lte('created_at', weekEnd.toISOString()),
          supabase
            .from('flashcards')
            .select('id', { count: 'exact' })
            .eq('user_id', userId)
            .gte('created_at', weekStart.toISOString())
            .lte('created_at', weekEnd.toISOString()),
          supabase
            .from('summaries')
            .select('id', { count: 'exact' })
            .eq('user_id', userId)
            .gte('created_at', weekStart.toISOString())
            .lte('created_at', weekEnd.toISOString()),
          supabase
            .from('mind_maps')
            .select('id', { count: 'exact' })
            .eq('user_id', userId)
            .gte('created_at', weekStart.toISOString())
            .lte('created_at', weekEnd.toISOString()),
        ]);

        const stats = {
          documents: docsRes.count || 0,
          quizzes: quizzesRes.count || 0,
          flashcards: flashcardsRes.count || 0,
          summaries: summariesRes.count || 0,
          mindMaps: mindMapsRes.count || 0,
        };

        const totalActivities = stats.documents + stats.quizzes + stats.flashcards + stats.summaries + stats.mindMaps;

        // Generate personalized action plan using AI
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
                content: `Tu es un coach d'études. Génère un plan d'action motivant pour la semaine suivante basé sur les statistiques. 
Réponds en JSON: { "message": "Message d'encouragement", "actions": ["Action 1", "Action 2", "Action 3"] }`
              },
              {
                role: 'user',
                content: `Statistiques de la semaine: ${JSON.stringify(stats)}. Total: ${totalActivities} activités.`
              }
            ],
          }),
        });

        let actionPlan = { message: "Continuez vos efforts !", actions: [] };
        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content || '';
          try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              actionPlan = JSON.parse(jsonMatch[0]);
            }
          } catch (e) {
            console.error('Failed to parse AI response:', e);
          }
        }

        // Save weekly stats
        await supabase.from('weekly_stats').upsert({
          user_id: userId,
          week_start: weekStart.toISOString().split('T')[0],
          week_end: weekEnd.toISOString().split('T')[0],
          documents_created: stats.documents,
          quizzes_created: stats.quizzes,
          flashcards_created: stats.flashcards,
          summaries_created: stats.summaries,
          mind_maps_created: stats.mindMaps,
        }, { onConflict: 'user_id,week_start' });

        // Generate email HTML
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; }
              .header { text-align: center; margin-bottom: 30px; }
              .header h1 { color: #7c3aed; margin: 0; }
              .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
              .stat { background: #f9f9f9; padding: 15px; border-radius: 8px; text-align: center; }
              .stat-value { font-size: 24px; font-weight: bold; color: #7c3aed; }
              .stat-label { color: #666; font-size: 14px; }
              .action-plan { background: #7c3aed; color: white; padding: 20px; border-radius: 8px; margin-top: 20px; }
              .action-plan h3 { margin-top: 0; }
              .action-plan ul { margin: 0; padding-left: 20px; }
              .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📊 Votre rapport hebdomadaire EXAVY</h1>
                <p>Semaine du ${weekStart.toLocaleDateString('fr-FR')} au ${weekEnd.toLocaleDateString('fr-FR')}</p>
              </div>
              
              <div class="stats">
                <div class="stat">
                  <div class="stat-value">${stats.documents}</div>
                  <div class="stat-label">📄 Documents</div>
                </div>
                <div class="stat">
                  <div class="stat-value">${stats.quizzes}</div>
                  <div class="stat-label">🧠 Quiz</div>
                </div>
                <div class="stat">
                  <div class="stat-value">${stats.flashcards}</div>
                  <div class="stat-label">📚 Flashcards</div>
                </div>
                <div class="stat">
                  <div class="stat-value">${stats.summaries}</div>
                  <div class="stat-label">✨ Résumés</div>
                </div>
              </div>
              
              <div class="action-plan">
                <h3>🎯 Plan d'action pour la semaine</h3>
                <p>${actionPlan.message}</p>
                ${actionPlan.actions?.length > 0 ? `<ul>${actionPlan.actions.map((a: string) => `<li>${a}</li>`).join('')}</ul>` : ''}
              </div>
              
              <div class="footer">
                <p>EXAVY - Votre assistant d'études intelligent</p>
                <p>Pour désactiver ces emails, allez dans Paramètres > Notifications</p>
              </div>
            </div>
          </body>
          </html>
        `;

        // Send email if Resend API key is configured
        if (resendApiKey) {
          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'EXAVY <noreply@exavy.com>',
              to: [userEmail],
              subject: `📊 Votre rapport hebdomadaire EXAVY - ${totalActivities} activités cette semaine`,
              html: emailHtml,
            }),
          });

          if (emailResponse.ok) {
            reports.push({ userId, email: userEmail, status: 'sent' });
          } else {
            reports.push({ userId, email: userEmail, status: 'failed', error: await emailResponse.text() });
          }
        } else {
          reports.push({ userId, email: userEmail, status: 'skipped', reason: 'No Resend API key' });
        }
      } catch (userError) {
        console.error(`Error processing user ${userId}:`, userError);
        reports.push({ userId, status: 'error', error: String(userError) });
      }
    }

    return new Response(
      JSON.stringify({ success: true, reports }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending weekly reports:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to send reports' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
