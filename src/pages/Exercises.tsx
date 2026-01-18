import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dumbbell, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  XCircle, 
  Lightbulb,
  Eye,
  EyeOff,
  RotateCcw,
  Trophy,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Exercise {
  id: string;
  title: string;
  subject: string | null;
  difficulty: string;
  exercise_type: string;
  questions: any[];
  solutions: any[];
  hints: any[];
  time_estimate_minutes: number;
  created_at: string;
}

interface UserAnswer {
  question_id: number;
  answer: string;
  isCorrect?: boolean;
}

export default function Exercises() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const exerciseId = searchParams.get('id');

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [showSolution, setShowSolution] = useState(false);
  const [showHints, setShowHints] = useState<number[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [startTime, setStartTime] = useState<Date | null>(null);

  useEffect(() => {
    if (user) {
      if (exerciseId) {
        fetchExercise(exerciseId);
      } else {
        fetchExercises();
      }
    }
  }, [user, exerciseId]);

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExercises((data as unknown as Exercise[]) || []);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      toast.error('Erreur lors du chargement des exercices');
    } finally {
      setLoading(false);
    }
  };

  const fetchExercise = async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setCurrentExercise(data as unknown as Exercise);
      setStartTime(new Date());
    } catch (error) {
      console.error('Error fetching exercise:', error);
      toast.error('Exercice non trouvé');
      navigate('/exercises');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId: number, answer: string) => {
    setUserAnswers(prev => {
      const existing = prev.findIndex(a => a.question_id === questionId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { question_id: questionId, answer };
        return updated;
      }
      return [...prev, { question_id: questionId, answer }];
    });
  };

  const getCurrentAnswer = (questionId: number): string => {
    return userAnswers.find(a => a.question_id === questionId)?.answer || '';
  };

  const toggleHint = (questionId: number) => {
    setShowHints(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const checkAnswers = () => {
    if (!currentExercise) return;

    const checkedAnswers = userAnswers.map(answer => {
      const solution = currentExercise.solutions.find(
        (s: any) => s.question_id === answer.question_id
      );
      const isCorrect = solution?.answer?.toLowerCase().trim() === 
        answer.answer?.toLowerCase().trim();
      return { ...answer, isCorrect };
    });

    setUserAnswers(checkedAnswers);
    setIsCompleted(true);
    setShowSolution(true);
  };

  const resetExercise = () => {
    setUserAnswers([]);
    setShowSolution(false);
    setShowHints([]);
    setIsCompleted(false);
    setCurrentQuestionIndex(0);
    setStartTime(new Date());
  };

  const getScore = () => {
    const correct = userAnswers.filter(a => a.isCorrect).length;
    const total = currentExercise?.questions.length || 0;
    return { correct, total, percentage: total > 0 ? (correct / total) * 100 : 0 };
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-orange-500';
      case 'expert': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Facile';
      case 'medium': return 'Moyen';
      case 'hard': return 'Difficile';
      case 'expert': return 'Expert';
      default: return difficulty;
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  // Exercise list view
  if (!exerciseId) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Dumbbell className="h-8 w-8 text-primary" />
                Mes Exercices
              </h1>
              <p className="text-muted-foreground mt-1">
                Entraînez-vous avec des exercices personnalisés
              </p>
            </div>
          </div>

          {exercises.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Dumbbell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun exercice</h3>
                <p className="text-muted-foreground mb-4">
                  Générez des exercices depuis vos documents
                </p>
                <Button onClick={() => navigate('/documents')}>
                  Voir mes documents
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exercises.map((exercise) => (
                <Card 
                  key={exercise.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/exercises?id=${exercise.id}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-2">
                        {exercise.title}
                      </CardTitle>
                      <Badge className={getDifficultyColor(exercise.difficulty)}>
                        {getDifficultyLabel(exercise.difficulty)}
                      </Badge>
                    </div>
                    {exercise.subject && (
                      <p className="text-sm text-muted-foreground">{exercise.subject}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{exercise.questions.length} questions</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {exercise.time_estimate_minutes} min
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </MainLayout>
    );
  }

  // Exercise practice view
  if (!currentExercise) return null;

  const currentQuestion = currentExercise.questions[currentQuestionIndex];
  const currentSolution = currentExercise.solutions.find(
    (s: any) => s.question_id === currentQuestion?.id
  );
  const currentHints = currentExercise.hints?.find(
    (h: any) => h.question_id === currentQuestion?.id
  )?.hints || [];
  const score = getScore();

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/exercises')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{currentExercise.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getDifficultyColor(currentExercise.difficulty)}>
                {getDifficultyLabel(currentExercise.difficulty)}
              </Badge>
              {currentExercise.subject && (
                <Badge variant="outline">{currentExercise.subject}</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Progress */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Question {currentQuestionIndex + 1} / {currentExercise.questions.length}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round((currentQuestionIndex + 1) / currentExercise.questions.length * 100)}%
              </span>
            </div>
            <Progress 
              value={(currentQuestionIndex + 1) / currentExercise.questions.length * 100} 
            />
          </CardContent>
        </Card>

        {/* Results Card */}
        {isCompleted && (
          <Card className="border-2 border-primary">
            <CardContent className="py-6 text-center">
              <Trophy className="h-16 w-16 mx-auto text-primary mb-4" />
              <h2 className="text-2xl font-bold mb-2">Exercice terminé !</h2>
              <p className="text-lg">
                Score : <span className="font-bold text-primary">{score.correct}</span> / {score.total}
                <span className="ml-2 text-muted-foreground">({Math.round(score.percentage)}%)</span>
              </p>
              <div className="flex justify-center gap-4 mt-6">
                <Button variant="outline" onClick={resetExercise}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Recommencer
                </Button>
                <Button onClick={() => navigate('/exercises')}>
                  Voir tous les exercices
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Question Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <Badge variant="outline" className="mb-2">
                  {currentQuestion?.type === 'open' ? 'Réponse libre' :
                   currentQuestion?.type === 'calculation' ? 'Calcul' :
                   currentQuestion?.type === 'multiple_choice' ? 'QCM' :
                   currentQuestion?.type === 'true_false' ? 'Vrai/Faux' : 'Question'}
                </Badge>
                <CardTitle className="text-lg">
                  {currentQuestion?.question}
                </CardTitle>
              </div>
              {currentQuestion?.points && (
                <Badge>{currentQuestion.points} pts</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Answer Input */}
            {currentQuestion?.type === 'multiple_choice' && currentQuestion.choices ? (
              <div className="space-y-2">
                {currentQuestion.choices.map((choice: string, index: number) => (
                  <Button
                    key={index}
                    variant={getCurrentAnswer(currentQuestion.id) === choice ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => handleAnswer(currentQuestion.id, choice)}
                    disabled={isCompleted}
                  >
                    {choice}
                  </Button>
                ))}
              </div>
            ) : currentQuestion?.type === 'true_false' ? (
              <div className="flex gap-4">
                <Button
                  variant={getCurrentAnswer(currentQuestion.id) === 'Vrai' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => handleAnswer(currentQuestion.id, 'Vrai')}
                  disabled={isCompleted}
                >
                  Vrai
                </Button>
                <Button
                  variant={getCurrentAnswer(currentQuestion.id) === 'Faux' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => handleAnswer(currentQuestion.id, 'Faux')}
                  disabled={isCompleted}
                >
                  Faux
                </Button>
              </div>
            ) : (
              <textarea
                className="w-full min-h-[120px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Votre réponse..."
                value={getCurrentAnswer(currentQuestion?.id)}
                onChange={(e) => handleAnswer(currentQuestion?.id, e.target.value)}
                disabled={isCompleted}
              />
            )}

            {/* Hints */}
            {currentHints.length > 0 && !isCompleted && (
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleHint(currentQuestion.id)}
                  className="text-amber-600"
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  {showHints.includes(currentQuestion.id) ? 'Masquer les indices' : 'Voir les indices'}
                </Button>
                {showHints.includes(currentQuestion.id) && (
                  <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
                    <ul className="list-disc list-inside space-y-1">
                      {currentHints.map((hint: string, index: number) => (
                        <li key={index} className="text-sm text-amber-800 dark:text-amber-200">
                          {hint}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Solution */}
            {showSolution && currentSolution && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Solution
                </h4>
                <p className="text-green-700 dark:text-green-300 mb-3">
                  <strong>Réponse :</strong> {currentSolution.answer}
                </p>
                {currentSolution.steps && currentSolution.steps.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-medium text-green-800 dark:text-green-200">Étapes de résolution :</p>
                    {currentSolution.steps.map((step: any, index: number) => (
                      <div key={index} className="pl-4 border-l-2 border-green-300 dark:border-green-700">
                        <p className="text-sm font-medium">Étape {step.step}</p>
                        <p className="text-sm text-green-700 dark:text-green-300">{step.explanation}</p>
                        {step.result && (
                          <p className="text-sm text-green-600 dark:text-green-400 italic">
                            → {step.result}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {currentSolution.common_mistakes && currentSolution.common_mistakes.length > 0 && (
                  <div className="mt-3 p-2 bg-red-50 dark:bg-red-950 rounded">
                    <p className="text-sm font-medium text-red-700 dark:text-red-300 flex items-center gap-1">
                      <XCircle className="h-4 w-4" />
                      Erreurs fréquentes :
                    </p>
                    <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-400 mt-1">
                      {currentSolution.common_mistakes.map((mistake: string, index: number) => (
                        <li key={index}>{mistake}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Précédent
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowSolution(!showSolution)}
            >
              {showSolution ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showSolution ? 'Masquer' : 'Solution'}
            </Button>

            {!isCompleted && currentQuestionIndex === currentExercise.questions.length - 1 && (
              <Button onClick={checkAnswers}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Terminer
              </Button>
            )}
          </div>

          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex(prev => 
              Math.min(currentExercise.questions.length - 1, prev + 1)
            )}
            disabled={currentQuestionIndex === currentExercise.questions.length - 1}
          >
            Suivant
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
