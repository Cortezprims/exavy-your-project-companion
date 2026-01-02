import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Brain,
  Play,
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  Loader2,
  FileText,
  RefreshCw,
  ArrowLeft
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface QuizData {
  id: string;
  title: string;
  questions: Question[];
  difficulty: string;
  created_at: string;
  document_id: string;
}

const Quiz = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [quizzes, setQuizzes] = useState<QuizData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeQuiz, setActiveQuiz] = useState<QuizData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (user) {
      if (documentId) {
        fetchQuizForDocument();
      } else {
        fetchAllQuizzes();
      }
    }
  }, [user, documentId]);

  const fetchAllQuizzes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const parsedQuizzes = (data || []).map(quiz => ({
        ...quiz,
        questions: Array.isArray(quiz.questions) ? quiz.questions as unknown as Question[] : []
      }));
      
      setQuizzes(parsedQuizzes);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      toast.error('Erreur lors du chargement des quiz');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizForDocument = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const parsedQuizzes = (data || []).map(quiz => ({
        ...quiz,
        questions: Array.isArray(quiz.questions) ? quiz.questions as unknown as Question[] : []
      }));
      
      setQuizzes(parsedQuizzes);
      
      // Auto-start the latest quiz if exists
      if (parsedQuizzes.length > 0) {
        startQuiz(parsedQuizzes[0]);
      }
    } catch (error) {
      console.error('Error fetching quiz:', error);
      toast.error('Erreur lors du chargement du quiz');
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = (quiz: QuizData) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setAnswers([]);
  };

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null || !activeQuiz) return;
    setSelectedAnswer(index);
    
    const isCorrect = index === activeQuiz.questions[currentQuestionIndex].correctIndex;
    if (isCorrect) setScore(s => s + 1);
    setAnswers(prev => [...prev, isCorrect]);
  };

  const nextQuestion = () => {
    if (!activeQuiz) return;

    if (currentQuestionIndex < activeQuiz.questions.length - 1) {
      setCurrentQuestionIndex(i => i + 1);
      setSelectedAnswer(null);
    } else {
      setShowResult(true);
    }
  };

  const resetQuiz = () => {
    setActiveQuiz(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setAnswers([]);
  };

  // Loading state
  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  // Active quiz - show result
  if (activeQuiz && showResult) {
    const percentage = Math.round((score / activeQuiz.questions.length) * 100);
    return (
      <MainLayout>
        <div className="p-6 md:p-8 max-w-2xl mx-auto">
          <Card className="text-center py-12">
            <CardContent>
              <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${
                percentage >= 70 ? 'bg-green-100' : percentage >= 50 ? 'bg-amber-100' : 'bg-red-100'
              }`}>
                <Trophy className={`w-10 h-10 ${
                  percentage >= 70 ? 'text-green-600' : percentage >= 50 ? 'text-amber-600' : 'text-red-600'
                }`} />
              </div>
              <h2 className="text-2xl font-bold mb-2">Quiz terminé !</h2>
              <p className="text-muted-foreground mb-6">{activeQuiz.title}</p>
              <div className="text-5xl font-bold text-foreground mb-4">{percentage}%</div>
              <p className="text-lg text-muted-foreground mb-8">
                {score} / {activeQuiz.questions.length} bonnes réponses
              </p>
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={resetQuiz}>
                  Retour aux quiz
                </Button>
                <Button onClick={() => startQuiz(activeQuiz)}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Recommencer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Active quiz - show question
  if (activeQuiz) {
    const question = activeQuiz.questions[currentQuestionIndex];
    
    return (
      <MainLayout>
        <div className="p-6 md:p-8 max-w-2xl mx-auto">
          <Button variant="ghost" onClick={resetQuiz} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quitter le quiz
          </Button>
          
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{activeQuiz.title}</span>
              <span className="text-sm font-medium">
                {currentQuestionIndex + 1} / {activeQuiz.questions.length}
              </span>
            </div>
            <Progress value={((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl leading-relaxed">{question.question}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {question.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrect = index === question.correctIndex;
                const showCorrect = selectedAnswer !== null && isCorrect;
                const showWrong = isSelected && !isCorrect;

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    disabled={selectedAnswer !== null}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      showCorrect
                        ? 'border-green-500 bg-green-50'
                        : showWrong
                        ? 'border-red-500 bg-red-50'
                        : isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-sm font-medium">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="flex-1">{option}</span>
                      {showCorrect && <CheckCircle className="w-5 h-5 text-green-600" />}
                      {showWrong && <XCircle className="w-5 h-5 text-red-600" />}
                    </div>
                  </button>
                );
              })}

              {selectedAnswer !== null && question.explanation && (
                <div className="mt-6 p-4 rounded-xl bg-muted">
                  <p className="text-sm font-medium mb-1">Explication</p>
                  <p className="text-sm text-muted-foreground">{question.explanation}</p>
                </div>
              )}

              {selectedAnswer !== null && (
                <Button onClick={nextQuestion} className="w-full mt-4">
                  {currentQuestionIndex < activeQuiz.questions.length - 1 ? (
                    <>
                      Question suivante
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Voir les résultats
                      <Trophy className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Quiz list view
  return (
    <MainLayout>
      <div className="p-6 md:p-8">
        <div className="ml-16 md:ml-0 flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Quiz</h1>
            <p className="text-muted-foreground">Testez vos connaissances avec des quiz générés par IA</p>
          </div>
          <Button onClick={() => navigate('/documents')}>
            <FileText className="w-4 h-4 mr-2" />
            Générer depuis un document
          </Button>
        </div>

        {quizzes.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold text-lg mb-2">Aucun quiz disponible</h3>
              <p className="text-muted-foreground mb-6">
                Importez un document pour générer votre premier quiz
              </p>
              <Button onClick={() => navigate('/documents')}>
                <FileText className="w-4 h-4 mr-2" />
                Aller aux documents
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((quiz) => (
              <Card key={quiz.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => startQuiz(quiz)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg line-clamp-2">{quiz.title}</CardTitle>
                    <Badge variant={quiz.difficulty === 'hard' ? 'destructive' : quiz.difficulty === 'medium' ? 'secondary' : 'default'}>
                      {quiz.difficulty === 'hard' ? 'Difficile' : quiz.difficulty === 'medium' ? 'Moyen' : 'Facile'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Brain className="w-4 h-4" />
                      {quiz.questions.length} questions
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDistanceToNow(new Date(quiz.created_at), { addSuffix: true, locale: fr })}
                    </span>
                  </div>
                  <Button className="w-full mt-4" variant="outline">
                    <Play className="w-4 h-4 mr-2" />
                    Commencer
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Quiz;
