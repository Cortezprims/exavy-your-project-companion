import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
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
  RefreshCw
} from "lucide-react";

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface Quiz {
  id: string;
  title: string;
  questions: Question[];
}

const sampleQuestions: Question[] = [
  {
    question: "Quelle est la capitale de la France ?",
    options: ["Lyon", "Paris", "Marseille", "Bordeaux"],
    correctIndex: 1,
    explanation: "Paris est la capitale de la France depuis des siècles."
  },
  {
    question: "Combien de continents y a-t-il sur Terre ?",
    options: ["5", "6", "7", "8"],
    correctIndex: 2,
    explanation: "Il y a 7 continents : Afrique, Antarctique, Asie, Europe, Amérique du Nord, Océanie et Amérique du Sud."
  },
  {
    question: "Quel est le plus grand océan du monde ?",
    options: ["Atlantique", "Indien", "Arctique", "Pacifique"],
    correctIndex: 3,
    explanation: "L'océan Pacifique est le plus grand et le plus profond des océans."
  }
];

const Quiz = () => {
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateQuiz = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setActiveQuiz({
      id: Date.now().toString(),
      title: "Quiz Express",
      questions: sampleQuestions,
    });
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setAnswers([]);
    setIsGenerating(false);
  };

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    
    const isCorrect = index === activeQuiz?.questions[currentQuestionIndex].correctIndex;
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

  // Active quiz view
  if (activeQuiz) {
    if (showResult) {
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
                  <Button onClick={generateQuiz}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Nouveau quiz
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </MainLayout>
      );
    }

    const question = activeQuiz.questions[currentQuestionIndex];
    
    return (
      <MainLayout>
        <div className="p-6 md:p-8 max-w-2xl mx-auto">
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

              {selectedAnswer !== null && (
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Quiz</h1>
            <p className="text-muted-foreground">Testez vos connaissances avec des quiz générés par IA</p>
          </div>
          <Button onClick={generateQuiz} disabled={isGenerating}>
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Brain className="w-4 h-4 mr-2" />
            )}
            Quiz Express
          </Button>
        </div>

        {/* Documents to quiz */}
        <div className="mb-8">
          <h2 className="font-semibold text-lg mb-4">Générer depuis un document</h2>
          <Card className="text-center py-8">
            <CardContent>
              <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">Importez des documents pour générer des quiz personnalisés</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent results placeholder */}
        <div>
          <h2 className="font-semibold text-lg mb-4">Résultats récents</h2>
          <Card className="text-center py-8">
            <CardContent>
              <Trophy className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">Aucun quiz complété pour le moment</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Quiz;
