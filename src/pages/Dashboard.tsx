import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
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
  Loader2,
  ArrowRight,
  Bell,
  Sun,
  Moon
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
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
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
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
      fetchUnreadCount();
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    if (!user) return;
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);
    setUnreadCount(count || 0);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
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

      setStats({
        documents: documentsRes.count || 0,
        quizzes: quizzesRes.count || 0,
        flashcards: flashcardsRes.count || 0,
        summaries: summariesRes.count || 0
      });

      const activities: RecentActivity[] = [];

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

      if (flashcardsRes.data && flashcardsRes.data.length > 0) {
        const latestFlashcard = flashcardsRes.data[0];
        activities.push({
          action: 'Flashcard créée',
          subject: latestFlashcard.front.substring(0, 50) + (latestFlashcard.front.length > 50 ? '...' : ''),
          time: formatDistanceToNow(new Date(latestFlashcard.created_at), { addSuffix: true, locale: fr }),
          type: 'flashcard'
        });
      }

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

      setRecentActivity(activities.slice(0, 5));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsDisplay = [
    { label: 'Documents', value: stats.documents, icon: FileText, bgColor: 'bg-primary', textColor: 'text-primary-foreground' },
    { label: 'Quiz créés', value: stats.quizzes, icon: Brain, bgColor: 'bg-secondary', textColor: 'text-secondary-foreground' },
    { label: 'Flashcards', value: stats.flashcards, icon: BookOpen, bgColor: 'bg-accent', textColor: 'text-accent-foreground' },
    { label: 'Résumés', value: stats.summaries, icon: Sparkles, bgColor: 'bg-foreground', textColor: 'text-background' },
  ];

  const quickActions = [
    { label: 'Nouveau Quiz', icon: Brain, path: '/quiz', color: 'bg-primary hover:bg-primary/90' },
    { label: 'Flashcards', icon: BookOpen, path: '/flashcards', color: 'bg-secondary hover:bg-secondary/90' },
    { label: 'Résumé IA', icon: Sparkles, path: '/summaries', color: 'bg-accent hover:bg-accent/90 text-accent-foreground' },
    { label: 'Chat IA', icon: FileText, path: '/chat', color: 'bg-foreground hover:bg-foreground/90 text-background' },
  ];

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'document': return 'bg-primary';
      case 'quiz': return 'bg-secondary';
      case 'flashcard': return 'bg-accent';
      case 'summary': return 'bg-foreground';
      default: return 'bg-muted-foreground';
    }
  };

  return (
    <MainLayout>
      <DailyTipDialog />
      <div className="p-6 md:p-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="ml-16 md:ml-0">
            <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Bienvenue
            </p>
            <h1 className="text-3xl md:text-4xl">
              {user?.email?.split('@')[0] || 'Étudiant'} 👋
            </h1>
            <p className="text-muted-foreground mt-2">
              Prêt à continuer votre apprentissage ?
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="h-10 w-10 border-2 border-border"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            {/* Notifications */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/notifications')}
              className="h-10 w-10 border-2 border-border relative"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-secondary text-secondary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
            <Button asChild className="btn-bauhaus bg-primary text-primary-foreground border-primary">
              <Link to="/documents" className="gap-2">
                <FileText className="w-4 h-4" />
                Ajouter un document
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid - Bento Style */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statsDisplay.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div 
                key={stat.label} 
                className={`bento-card p-6 animate-slide-up stagger-${index + 1}`}
              >
                <div className={`stat-bento-icon ${stat.bgColor} ${stat.textColor}`}>
                  <Icon className="w-6 h-6" />
                </div>
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                ) : (
                  <p className="text-4xl font-black">{stat.value}</p>
                )}
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mt-2">
                  {stat.label}
                </p>
                {/* Geometric accent */}
                <div className={`absolute top-0 right-0 w-4 h-4 ${stat.bgColor}`} />
              </div>
            );
          })}
        </div>

        {/* Progress and Activity */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Weekly Progress */}
          <div className="bento-card">
            <div className="p-6 border-b-2 border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary flex items-center justify-center">
                  <Target className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-bold">Votre progression</h3>
                  <p className="text-sm text-muted-foreground">Statistiques globales</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-3">
                  <span className="font-bold">
                    Total: {stats.documents + stats.quizzes + stats.summaries} éléments
                  </span>
                  <span className="text-muted-foreground">{stats.flashcards} flashcards</span>
                </div>
                <div className="progress-bauhaus">
                  <div 
                    style={{ width: `${Math.min(((stats.documents + stats.quizzes) / 10) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-muted border-l-4 border-secondary">
                <TrendingUp className="w-5 h-5 text-secondary" />
                <span className="font-medium">Continuez comme ça !</span>
              </div>
            </div>
            {/* Corner accents */}
            <div className="absolute bottom-0 left-0 w-6 h-6 bg-secondary" />
          </div>

          {/* Recent Activity */}
          <div className="bento-card">
            <div className="p-6 border-b-2 border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent flex items-center justify-center">
                  <Clock className="w-5 h-5 text-accent-foreground" />
                </div>
                <h3 className="font-bold">Activité récente</h3>
              </div>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-muted flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="font-bold">Aucune activité récente</p>
                  <p className="text-sm text-muted-foreground mt-1">Commencez par ajouter un document !</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-4 group hover-geo">
                      <div className={`w-3 h-3 mt-1.5 ${getActivityColor(activity.type)}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm">{activity.action}</p>
                        <p className="text-sm text-muted-foreground truncate">{activity.subject}</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">
                        {activity.time}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Corner accent */}
            <div className="absolute top-0 right-0 w-6 h-6 bg-accent" />
          </div>
        </div>

        {/* Quick Actions - Bento Grid */}
        <div className="bento-card">
          <div className="p-6 border-b-2 border-border flex items-center gap-3">
            <div className="w-10 h-10 bg-foreground flex items-center justify-center">
              <Zap className="w-5 h-5 text-background" />
            </div>
            <h3 className="font-bold">Actions rapides</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link 
                    key={action.path} 
                    to={action.path}
                    className={`relative p-6 flex flex-col items-center gap-3 text-center border-2 border-foreground transition-all duration-200 hover:-translate-x-1 hover:-translate-y-1 ${action.color} text-primary-foreground animate-scale-in stagger-${index + 1}`}
                    style={{ boxShadow: '4px 4px 0px hsl(var(--foreground))' }}
                  >
                    <Icon className="w-8 h-8" />
                    <span className="font-bold text-sm uppercase tracking-wide">{action.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
          {/* Geometric decoration */}
          <div className="absolute bottom-0 right-0 flex">
            <div className="w-4 h-4 bg-primary" />
            <div className="w-4 h-4 bg-secondary" />
            <div className="w-4 h-4 bg-accent" />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
