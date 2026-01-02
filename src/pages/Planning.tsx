import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { 
  CalendarDays, 
  Plus, 
  Clock,
  BookOpen,
  Brain,
  Target
} from 'lucide-react';

interface StudySession {
  id: string;
  title: string;
  subject: string;
  date: Date;
  duration: number;
  type: 'quiz' | 'flashcards' | 'review';
}

const Planning = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  const sessions: StudySession[] = [
    { id: '1', title: 'Révision Histoire', subject: 'Histoire', date: new Date(), duration: 30, type: 'review' },
    { id: '2', title: 'Quiz Mathématiques', subject: 'Mathématiques', date: new Date(), duration: 20, type: 'quiz' },
    { id: '3', title: 'Flashcards Anglais', subject: 'Anglais', date: new Date(), duration: 15, type: 'flashcards' },
  ];

  const getTypeIcon = (type: StudySession['type']) => {
    switch (type) {
      case 'quiz':
        return <Brain className="w-4 h-4" />;
      case 'flashcards':
        return <BookOpen className="w-4 h-4" />;
      case 'review':
        return <Target className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: StudySession['type']) => {
    switch (type) {
      case 'quiz':
        return 'bg-primary/10 text-primary';
      case 'flashcards':
        return 'bg-secondary/10 text-secondary';
      case 'review':
        return 'bg-warning/10 text-warning';
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-primary" />
              Planning
            </h1>
            <p className="text-muted-foreground">
              Organisez vos sessions d'étude
            </p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle session
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Calendrier</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          {/* Today's Sessions */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Sessions du jour</CardTitle>
              <CardDescription>
                {selectedDate?.toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${getTypeColor(session.type)}`}>
                      {getTypeIcon(session.type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{session.title}</h4>
                      <p className="text-sm text-muted-foreground">{session.subject}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{session.duration} min</span>
                    </div>
                    <Button variant="outline" size="sm">
                      Commencer
                    </Button>
                  </div>
                ))}

                {sessions.length === 0 && (
                  <div className="text-center py-8">
                    <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucune session prévue</p>
                    <Button variant="outline" className="mt-4">
                      <Plus className="w-4 h-4 mr-2" />
                      Planifier une session
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Résumé de la semaine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-3xl font-bold text-primary">5</p>
                <p className="text-sm text-muted-foreground">Sessions prévues</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-3xl font-bold text-secondary">2h30</p>
                <p className="text-sm text-muted-foreground">Temps d'étude</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-3xl font-bold text-warning">3</p>
                <p className="text-sm text-muted-foreground">Matières</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-3xl font-bold text-primary">85%</p>
                <p className="text-sm text-muted-foreground">Taux de complétion</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Planning;
