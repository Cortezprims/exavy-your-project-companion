import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { 
  FileText, 
  Brain, 
  BookOpen, 
  Sparkles, 
  TrendingUp, 
  Clock,
  Target,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();

  const stats = [
    { label: 'Documents', value: 12, icon: FileText, color: 'text-primary' },
    { label: 'Quiz complétés', value: 8, icon: Brain, color: 'text-secondary' },
    { label: 'Flashcards', value: 45, icon: BookOpen, color: 'text-warning' },
    { label: 'Résumés', value: 6, icon: Sparkles, color: 'text-primary' },
  ];

  const recentActivity = [
    { action: 'Quiz terminé', subject: 'Histoire - Chapitre 3', time: 'Il y a 2h' },
    { action: 'Document ajouté', subject: 'Mathématiques - Algèbre', time: 'Il y a 5h' },
    { action: 'Flashcards révisées', subject: 'Anglais - Vocabulaire', time: 'Hier' },
  ];

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
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
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
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
                Progression hebdomadaire
              </CardTitle>
              <CardDescription>Objectif : 5 heures d'étude</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>3h 45min</span>
                  <span className="text-muted-foreground">75%</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="w-4 h-4 text-secondary" />
                <span>+15% par rapport à la semaine dernière</span>
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
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.subject}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                ))}
              </div>
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
