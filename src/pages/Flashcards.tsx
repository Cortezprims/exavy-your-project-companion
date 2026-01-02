import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Sparkles
} from 'lucide-react';

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const Flashcards = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState<string[]>([]);
  
  const flashcards: Flashcard[] = [
    { id: '1', question: "Quelle est la date de la prise de la Bastille ?", answer: "14 juillet 1789", category: "Histoire" },
    { id: '2', question: "Quelle est la formule de l'aire d'un cercle ?", answer: "πr² (pi fois le rayon au carré)", category: "Mathématiques" },
    { id: '3', question: "What is the past tense of 'go'?", answer: "Went", category: "Anglais" },
    { id: '4', question: "Quelle est la formule de la vitesse ?", answer: "v = d/t (distance divisée par le temps)", category: "Physique" },
    { id: '5', question: "Qui a écrit 'Les Misérables' ?", answer: "Victor Hugo", category: "Littérature" },
  ];

  const currentCard = flashcards[currentIndex];
  const progress = ((currentIndex + 1) / flashcards.length) * 100;

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleKnown = () => {
    if (!knownCards.includes(currentCard.id)) {
      setKnownCards([...knownCards, currentCard.id]);
    }
    handleNext();
  };

  const handleUnknown = () => {
    setKnownCards(knownCards.filter(id => id !== currentCard.id));
    handleNext();
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownCards([]);
  };

  return (
    <MainLayout>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            Flashcards
          </h1>
          <p className="text-muted-foreground">
            Révisez vos connaissances avec des cartes mémoire
          </p>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Carte {currentIndex + 1} sur {flashcards.length}</span>
            <span className="text-secondary">{knownCards.length} maîtrisées</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Flashcard */}
        <div 
          className="perspective-1000 cursor-pointer"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <Card 
            className={`min-h-[300px] transition-all duration-500 transform-style-3d ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
          >
            <CardHeader className="text-center pb-2">
              <CardDescription className="text-xs uppercase tracking-wide">
                {currentCard.category}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center p-8">
              <div className="text-center">
                {!isFlipped ? (
                  <>
                    <p className="text-lg font-medium mb-4">{currentCard.question}</p>
                    <p className="text-sm text-muted-foreground">Cliquez pour voir la réponse</p>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6 text-primary mx-auto mb-4" />
                    <p className="text-lg font-medium text-primary">{currentCard.answer}</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <Button 
            variant="outline" 
            className="text-destructive hover:text-destructive"
            onClick={handleUnknown}
          >
            <ThumbsDown className="w-4 h-4 mr-2" />
            À revoir
          </Button>
          
          <Button 
            variant="outline" 
            className="text-secondary hover:text-secondary"
            onClick={handleKnown}
          >
            <ThumbsUp className="w-4 h-4 mr-2" />
            Maîtrisée
          </Button>
          
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleNext}
            disabled={currentIndex === flashcards.length - 1}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Reset Button */}
        <div className="text-center">
          <Button variant="ghost" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Recommencer
          </Button>
        </div>

        {/* Stats */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{flashcards.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-secondary">{knownCards.length}</p>
                <p className="text-sm text-muted-foreground">Maîtrisées</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-warning">{flashcards.length - knownCards.length}</p>
                <p className="text-sm text-muted-foreground">À revoir</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Flashcards;
