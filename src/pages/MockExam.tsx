import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  FileText, 
  Clock, 
  Play, 
  CheckCircle2, 
  XCircle,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertTriangle,
  Trophy,
  Target
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Question {
  id: string;
  type: 'qcm' | 'open' | 'calculation' | 'essay' | 'true_false';
  question: string;
  points: number;
  options?: string[];
  correctAnswer?: string;
  gradingCriteria?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface MockExam {
  id: string;
  title: string;
  exam_type: string;
  subject: string;
  duration_minutes: number;
  total_points: number;
  questions: Question[];
  instructions: string;
  status: 'draft' | 'in_progress' | 'completed';
  started_at: string | null;
  user_score: number | null;
  user_answers: Record<string, string>;
  ai_feedback: any;
}

const MockExam = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exam, setExam] = useState<MockExam | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (examId && user) {
      fetchExam();
    }
  }, [examId, user]);

  // Timer
  useEffect(() => {
    if (exam?.status === 'in_progress' && timeRemaining !== null && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 0) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [exam?.status, timeRemaining]);

  const fetchExam = async () => {
    const { data, error } = await supabase
      .from('mock_exams')
      .select('*')
      .eq('id', examId)
      .single();

    if (error) {
      toast.error('Examen non trouvé');
      navigate('/documents');
      return;
    }

    const examData = data as unknown as MockExam;
    setExam(examData);
    
    if (examData.user_answers) {
      setAnswers(examData.user_answers);
    }

    if (examData.status === 'in_progress' && examData.started_at) {
      const elapsed = Math.floor((Date.now() - new Date(examData.started_at).getTime()) / 1000);
      const remaining = examData.duration_minutes * 60 - elapsed;
      setTimeRemaining(Math.max(0, remaining));
    }

    if (examData.status === 'completed') {
      setShowResults(true);
    }

    setLoading(false);
  };

  const startExam = async () => {
    if (!exam) return;

    const { error } = await supabase
      .from('mock_exams')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .eq('id', exam.id);

    if (error) {
      toast.error('Erreur lors du démarrage');
      return;
    }

    setExam({ ...exam, status: 'in_progress', started_at: new Date().toISOString() });
    setTimeRemaining(exam.duration_minutes * 60);
    setShowStartDialog(false);
    toast.success("C'est parti ! Bonne chance 🍀");
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const saveProgress = async () => {
    if (!exam) return;

    await supabase
      .from('mock_exams')
      .update({ user_answers: answers })
      .eq('id', exam.id);
  };

  const handleSubmit = async () => {
    if (!exam || !user) return;

    setIsSubmitting(true);
    await saveProgress();

    try {
      const response = await supabase.functions.invoke('grade-exam', {
        body: {
          examId: exam.id,
          userId: user.id,
          answers,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Refresh exam data
      await fetchExam();
      setShowResults(true);
      toast.success('Examen corrigé !');
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Erreur lors de la correction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) {
      return `${h}h ${m.toString().padStart(2, '0')}m`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!exam) return null;

  const currentQuestion = exam.questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).filter(k => answers[k]?.trim()).length;
  const progress = (answeredCount / exam.questions.length) * 100;

  // Results view
  if (showResults && exam.ai_feedback) {
    const feedback = exam.ai_feedback;
    const percentage = feedback.percentage || 0;

    return (
      <MainLayout>
        <div className="container max-w-4xl mx-auto p-6">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Trophy className={`w-8 h-8 ${percentage >= 50 ? 'text-yellow-500' : 'text-muted-foreground'}`} />
              </div>
              <CardTitle className="text-2xl">Résultats de l'examen</CardTitle>
              <CardDescription>{exam.title}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Score summary */}
              <div className="text-center p-6 bg-muted rounded-lg">
                <div className="text-5xl font-bold text-primary mb-2">
                  {feedback.totalScore}/{feedback.maxScore}
                </div>
                <div className="text-xl text-muted-foreground">
                  {percentage}%
                </div>
                <p className="mt-4 text-lg">{feedback.overallFeedback}</p>
              </div>

              <Separator />

              {/* Detailed feedback */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Détail par question
                </h3>
                <ScrollArea className="h-[400px]">
                  {exam.questions.map((question, index) => {
                    const qFeedback = feedback.questionFeedback?.[question.id];
                    const isCorrect = qFeedback?.correct;

                    return (
                      <div key={question.id} className="p-4 border rounded-lg mb-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {isCorrect ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-500" />
                              )}
                              <span className="font-medium">Question {index + 1}</span>
                              <Badge variant="outline">
                                {qFeedback?.score || 0}/{qFeedback?.maxScore || question.points} pts
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{question.question}</p>
                            
                            <div className="text-sm">
                              <p><strong>Votre réponse:</strong> {answers[question.id] || '(Pas de réponse)'}</p>
                              {!isCorrect && qFeedback?.correctAnswer && (
                                <p className="text-green-600">
                                  <strong>Bonne réponse:</strong> {qFeedback.correctAnswer}
                                </p>
                              )}
                            </div>
                            
                            {qFeedback?.feedback && (
                              <p className="mt-2 text-sm bg-muted p-2 rounded">
                                💡 {qFeedback.feedback}
                              </p>
                            )}
                            
                            {qFeedback?.suggestions && (
                              <p className="mt-1 text-sm text-muted-foreground">
                                📝 {qFeedback.suggestions}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </ScrollArea>
              </div>

              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={() => navigate('/documents')}>
                  Retour aux documents
                </Button>
                <Button onClick={() => navigate('/quiz')}>
                  Voir mes quiz
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container max-w-4xl mx-auto p-6">
        {/* Start Dialog */}
        <AlertDialog open={showStartDialog} onOpenChange={setShowStartDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Commencer l'examen ?</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p><strong>{exam.title}</strong></p>
                <p>Durée: {exam.duration_minutes} minutes</p>
                <p>Questions: {exam.questions.length}</p>
                <p>Total: {exam.total_points} points</p>
                <p className="text-destructive flex items-center gap-2 mt-4">
                  <AlertTriangle className="w-4 h-4" />
                  Une fois commencé, le chronomètre ne peut pas être arrêté.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={startExam}>
                <Play className="w-4 h-4 mr-2" />
                Commencer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {exam.title}
                </CardTitle>
                <CardDescription className="flex items-center gap-4 mt-2">
                  <Badge>{exam.exam_type.toUpperCase()}</Badge>
                  <span>{exam.questions.length} questions</span>
                  <span>{exam.total_points} points</span>
                </CardDescription>
              </div>
              
              {exam.status === 'in_progress' && timeRemaining !== null && (
                <div className={`text-2xl font-mono font-bold ${timeRemaining < 300 ? 'text-destructive animate-pulse' : ''}`}>
                  <Clock className="w-5 h-5 inline mr-2" />
                  {formatTime(timeRemaining)}
                </div>
              )}
            </div>

            {exam.status === 'in_progress' && (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progression</span>
                  <span>{answeredCount}/{exam.questions.length} réponses</span>
                </div>
                <Progress value={progress} />
              </div>
            )}
          </CardHeader>
        </Card>

        {/* Exam not started */}
        {exam.status === 'draft' && (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Examen prêt</h2>
              <p className="text-muted-foreground mb-6">{exam.instructions}</p>
              <Button size="lg" onClick={() => setShowStartDialog(true)}>
                <Play className="w-4 h-4 mr-2" />
                Commencer l'examen
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Exam in progress */}
        {exam.status === 'in_progress' && currentQuestion && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="outline">
                  Question {currentQuestionIndex + 1}/{exam.questions.length}
                </Badge>
                <Badge>
                  {currentQuestion.points} point{currentQuestion.points > 1 ? 's' : ''}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg">{currentQuestion.question}</p>

              {/* QCM or True/False */}
              {(currentQuestion.type === 'qcm' || currentQuestion.type === 'true_false') && currentQuestion.options && (
                <RadioGroup
                  value={answers[currentQuestion.id] || ''}
                  onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                >
                  {currentQuestion.options.map((option, i) => (
                    <div key={i} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                      <RadioGroupItem value={option} id={`option-${i}`} />
                      <Label htmlFor={`option-${i}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {/* Open questions */}
              {(currentQuestion.type === 'open' || currentQuestion.type === 'essay' || currentQuestion.type === 'calculation') && (
                <Textarea
                  placeholder="Votre réponse..."
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  rows={currentQuestion.type === 'essay' ? 10 : 5}
                />
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                  disabled={currentQuestionIndex === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Précédent
                </Button>

                <div className="flex gap-1">
                  {exam.questions.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentQuestionIndex(i)}
                      className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                        i === currentQuestionIndex
                          ? 'bg-primary text-primary-foreground'
                          : answers[exam.questions[i].id]
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : 'bg-muted hover:bg-accent'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                {currentQuestionIndex < exam.questions.length - 1 ? (
                  <Button
                    onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                  >
                    Suivant
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? (
                      <>Correction...</>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Terminer
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default MockExam;
