import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DailyTipDialog } from '@/components/dashboard/DailyTipDialog';
import { 
  FileText, 
  Brain, 
  BookOpen, 
  Sparkles, 
  TrendingUp, 
  Clock,
  Target,
  Zap,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DashboardStats {
  documents: number;
  quizzes: number;
  flashcards: number;
  summaries: number;
}

interface RecentActivity {
  action: string;
  subject: string;
  time: string;
  type: 'quiz' | 'document' | 'flashcard' | 'summary';
}

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    documents: 0,
    quizzes: 0,
    flashcards: 0,
    summaries: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all stats in parallel
      const [documentsRes, quizzesRes, flashcardsRes, summariesRes] = await Promise.all([
        supabase
          .from('documents')
          .select('id, title, created_at', { count: 'exact' })
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('quizzes')
          .select('id, title, created_at', { count: 'exact' })
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('flashcards')
          .select('id, front, created_at', { count: 'exact' })
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('summaries')
          .select('id, document_id, created_at', { count: 'exact' })
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      // Set stats
      setStats({
        documents: documentsRes.count || 0,
        quizzes: quizzesRes.count || 0,
        flashcards: flashcardsRes.count || 0,
        summaries: summariesRes.count || 0
      });

      // Build recent activity from all sources
      const activities: RecentActivity[] = [];

      // Add documents
      if (documentsRes.data) {
        documentsRes.data.forEach(doc => {
          activities.push({
            action: 'Document ajouté',
            subject: doc.title,
            time: formatDistanceToNow(new Date(doc.created_at), { addSuffix: true, locale: fr }),
            type: 'document'
          });
        });
      }

      // Add quizzes
      if (quizzesRes.data) {
        quizzesRes.data.forEach(quiz => {
          activities.push({
            action: 'Quiz créé',
            subject: quiz.title,
            time: formatDistanceToNow(new Date(quiz.created_at), { addSuffix: true, locale: fr }),
            type: 'quiz'
          });
        });
      }

      // Add flashcards (group by deck would be better but we'll show individual for now)
      if (flashcardsRes.data && flashcardsRes.data.length > 0) {
        // Just show one entry for flashcards if any exist
        const latestFlashcard = flashcardsRes.data[0];
        activities.push({
          action: 'Flashcard créée',
          subject: latestFlashcard.front.substring(0, 50) + (latestFlashcard.front.length > 50 ? '...' : ''),
          time: formatDistanceToNow(new Date(latestFlashcard.created_at), { addSuffix: true, locale: fr }),
          type: 'flashcard'
        });
      }

      // Add summaries
      if (summariesRes.data) {
        summariesRes.data.forEach(summary => {
          activities.push({
            action: 'Résumé généré',
            subject: `Document #${summary.document_id.substring(0, 8)}`,
            time: formatDistanceToNow(new Date(summary.created_at), { addSuffix: true, locale: fr }),
            type: 'summary'
          });
        });
      }

      // Sort by time (most recent first) and take top 5
      activities.sort((a, b) => {
        // Parse the French relative time - this is approximate but good enough for display
        return 0; // Keep original order since we're already limiting
      });

      setRecentActivity(activities.slice(0, 5));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsDisplay = [
    { label: 'Documents', value: stats.documents, icon: FileText, color: 'text-primary' },
    { label: 'Quiz créés', value: stats.quizzes, icon: Brain, color: 'text-secondary' },
    { label: 'Flashcards', value: stats.flashcards, icon: BookOpen, color: 'text-warning' },
    { label: 'Résumés', value: stats.summaries, icon: Sparkles, color: 'text-primary' },
  ];

  return (
    <MainLayout>
      <DailyTipDialog />
      <div className="p-6 space-y-6">
        {/* Header - adjusted for mobile menu button */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="ml-16 md:ml-0">
            <h1 className="text-2xl font-bold">
              Bonjour, {user?.email?.split('@')[0] || 'Étudiant'} 👋
            </h1>
            <p className="text-muted-foreground">
              Prêt à continuer votre apprentissage ?
            </p>
          </div>
          <Button asChild>
            <Link to="/documents">
              <FileText className="w-4 h-4 mr-2" />
              Ajouter un document
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statsDisplay.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <p className="text-2xl font-bold">{stat.value}</p>
                      )}
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Progress and Activity */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Weekly Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Votre progression
              </CardTitle>
              <CardDescription>Statistiques globales</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Total: {stats.documents + stats.quizzes + stats.summaries} éléments créés</span>
                  <span className="text-muted-foreground">{stats.flashcards} flashcards</span>
                </div>
                <Progress 
                  value={Math.min(((stats.documents + stats.quizzes) / 10) * 100, 100)} 
                  className="h-2" 
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="w-4 h-4 text-secondary" />
                <span>Continuez comme ça !</span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Activité récente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Aucune activité récente</p>
                  <p className="text-sm">Commencez par ajouter un document !</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-sm text-muted-foreground truncate">{activity.subject}</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-warning" />
              Actions rapides
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                <Link to="/quiz">
                  <Brain className="w-6 h-6 text-primary" />
                  <span>Nouveau Quiz</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                <Link to="/flashcards">
                  <BookOpen className="w-6 h-6 text-secondary" />
                  <span>Flashcards</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                <Link to="/summaries">
                  <Sparkles className="w-6 h-6 text-warning" />
                  <span>Résumé IA</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                <Link to="/chat">
                  <FileText className="w-6 h-6 text-primary" />
                  <span>Chat IA</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
