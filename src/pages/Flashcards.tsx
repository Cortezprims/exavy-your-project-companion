import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Loader2,
  FileText,
  ArrowLeft,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  deck_id: string;
}

interface FlashcardDeck {
  id: string;
  title: string;
  created_at: string;
  document_id: string;
  flashcards?: Flashcard[];
}

const Flashcards = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      if (documentId) {
        fetchDeckForDocument();
      } else {
        fetchAllDecks();
      }
    }
  }, [user, documentId]);

  const fetchAllDecks = async () => {
    setLoading(true);
    try {
      const { data: decksData, error } = await supabase
        .from('flashcard_decks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch flashcard counts for each deck
      const decksWithCounts = await Promise.all(
        (decksData || []).map(async (deck) => {
          const { count } = await supabase
            .from('flashcards')
            .select('*', { count: 'exact', head: true })
            .eq('deck_id', deck.id);
          
          return { ...deck, cardCount: count || 0 };
        })
      );

      setDecks(decksWithCounts);
    } catch (error) {
      console.error('Error fetching decks:', error);
      toast.error('Erreur lors du chargement des decks');
    } finally {
      setLoading(false);
    }
  };

  const fetchDeckForDocument = async () => {
    setLoading(true);
    try {
      const { data: decksData, error } = await supabase
        .from('flashcard_decks')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (decksData && decksData.length > 0) {
        // Load the latest deck automatically
        await loadDeck(decksData[0]);
      }
      
      setDecks(decksData || []);
    } catch (error) {
      console.error('Error fetching deck:', error);
      toast.error('Erreur lors du chargement des flashcards');
    } finally {
      setLoading(false);
    }
  };

  const loadDeck = async (deck: FlashcardDeck) => {
    try {
      const { data: cardsData, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('deck_id', deck.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setActiveDeck(deck);
      setFlashcards(cardsData || []);
      setCurrentIndex(0);
      setIsFlipped(false);
      setKnownCards([]);
    } catch (error) {
      console.error('Error loading deck:', error);
      toast.error('Erreur lors du chargement des cartes');
    }
  };

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
    const currentCard = flashcards[currentIndex];
    if (!knownCards.includes(currentCard.id)) {
      setKnownCards([...knownCards, currentCard.id]);
    }
    handleNext();
  };

  const handleUnknown = () => {
    const currentCard = flashcards[currentIndex];
    setKnownCards(knownCards.filter(id => id !== currentCard.id));
    handleNext();
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownCards([]);
  };

  const exitDeck = () => {
    setActiveDeck(null);
    setFlashcards([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownCards([]);
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

  // Active deck view
  if (activeDeck && flashcards.length > 0) {
    const currentCard = flashcards[currentIndex];
    const progress = ((currentIndex + 1) / flashcards.length) * 100;

    return (
      <MainLayout>
        <div className="p-6 max-w-2xl mx-auto space-y-6">
          <Button variant="ghost" onClick={exitDeck}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux decks
          </Button>

          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" />
              {activeDeck.title}
            </h1>
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
            className="cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <Card className="min-h-[300px] transition-all duration-300">
              <CardContent className="flex items-center justify-center p-8 min-h-[300px]">
                <div className="text-center">
                  {!isFlipped ? (
                    <>
                      <p className="text-lg font-medium mb-4">{currentCard.front}</p>
                      <p className="text-sm text-muted-foreground">Cliquez pour voir la réponse</p>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6 text-primary mx-auto mb-4" />
                      <p className="text-lg font-medium text-primary">{currentCard.back}</p>
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
  }

  // Deck list view
  return (
    <MainLayout>
      <div className="p-6 md:p-8">
        <div className="ml-16 md:ml-0 flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Flashcards</h1>
            <p className="text-muted-foreground">Révisez vos connaissances avec des cartes mémoire</p>
          </div>
          <Button onClick={() => navigate('/documents')}>
            <FileText className="w-4 h-4 mr-2" />
            Générer depuis un document
          </Button>
        </div>

        {decks.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold text-lg mb-2">Aucun deck disponible</h3>
              <p className="text-muted-foreground mb-6">
                Importez un document pour générer vos premières flashcards
              </p>
              <Button onClick={() => navigate('/documents')}>
                <FileText className="w-4 h-4 mr-2" />
                Aller aux documents
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {decks.map((deck: any) => (
              <Card key={deck.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => loadDeck(deck)}>
                <CardHeader>
                  <CardTitle className="text-lg line-clamp-2">{deck.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      {deck.cardCount || 0} cartes
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDistanceToNow(new Date(deck.created_at), { addSuffix: true, locale: fr })}
                    </span>
                  </div>
                  <Button className="w-full" variant="outline">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Réviser
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

export default Flashcards;
