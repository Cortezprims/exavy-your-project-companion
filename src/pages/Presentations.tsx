import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Presentation, 
  ChevronRight, 
  ChevronLeft,
  Download,
  Maximize2,
  Minimize2,
  Play,
  ArrowLeft,
  FileText,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { toPng } from 'html-to-image';
import { ModernSlide } from '@/components/presentations/ModernSlide';

interface Slide {
  id: number;
  type: string;
  title: string;
  subtitle?: string;
  content?: string[];
  image_suggestion?: string;
  layout?: string;
}

interface SpeakerNote {
  slide_id: number;
  notes: string;
}

interface PresentationData {
  id: string;
  title: string;
  theme: string;
  slides: Slide[];
  speaker_notes: SpeakerNote[];
  design_settings: any;
  created_at: string;
}

export default function Presentations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presentationId = searchParams.get('id');
  const slideRef = useRef<HTMLDivElement>(null);

  const [presentations, setPresentations] = useState<PresentationData[]>([]);
  const [currentPresentation, setCurrentPresentation] = useState<PresentationData | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      if (presentationId) {
        fetchPresentation(presentationId);
      } else {
        fetchPresentations();
      }
    }
  }, [user, presentationId]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentPresentation) return;
      
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'Escape') {
        setIsFullscreen(false);
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPresentation, currentSlideIndex]);

  const fetchPresentations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('presentations')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPresentations((data as unknown as PresentationData[]) || []);
    } catch (error) {
      console.error('Error fetching presentations:', error);
      toast.error('Erreur lors du chargement des présentations');
    } finally {
      setLoading(false);
    }
  };

  const fetchPresentation = async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('presentations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setCurrentPresentation(data as unknown as PresentationData);
    } catch (error) {
      console.error('Error fetching presentation:', error);
      toast.error('Présentation non trouvée');
      navigate('/presentations');
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    if (!currentPresentation) return;
    setCurrentSlideIndex(prev => 
      Math.min(currentPresentation.slides.length - 1, prev + 1)
    );
  };

  const prevSlide = () => {
    setCurrentSlideIndex(prev => Math.max(0, prev - 1));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const exportToPDF = async () => {
    if (!slideRef.current || !currentPresentation) return;
    
    toast.info('Export en cours...');
    
    try {
      // For now, export current slide as image
      const dataUrl = await toPng(slideRef.current, { quality: 1 });
      const link = document.createElement('a');
      link.download = `${currentPresentation.title}-slide-${currentSlideIndex + 1}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Slide exportée !');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erreur lors de l\'export');
    }
  };

  const getCurrentNote = (): string => {
    if (!currentPresentation) return '';
    const currentSlide = currentPresentation.slides[currentSlideIndex];
    const note = currentPresentation.speaker_notes?.find(
      (n: SpeakerNote) => n.slide_id === currentSlide?.id
    );
    return note?.notes || '';
  };

  const getSlideStyle = (slide: Slide) => {
    const settings = currentPresentation?.design_settings || {};
    return {
      backgroundColor: settings.backgroundColor || '#ffffff',
      color: settings.primaryColor || '#18181b',
      fontFamily: settings.fontFamily || 'Inter',
    };
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

  // Presentations list view
  if (!presentationId) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Presentation className="h-8 w-8 text-primary" />
                Mes Présentations
              </h1>
              <p className="text-muted-foreground mt-1">
                Visualisez et exportez vos présentations générées
              </p>
            </div>
          </div>

          {presentations.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Presentation className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune présentation</h3>
                <p className="text-muted-foreground mb-4">
                  Générez des présentations depuis vos documents
                </p>
                <Button onClick={() => navigate('/documents')}>
                  Voir mes documents
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {presentations.map((pres) => (
                <Card 
                  key={pres.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/presentations?id=${pres.id}`)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg line-clamp-2">
                      {pres.title}
                    </CardTitle>
                    <Badge variant="outline">{pres.theme}</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{pres.slides?.length || 0} slides</span>
                      <span>{new Date(pres.created_at).toLocaleDateString('fr-FR')}</span>
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

  // Presentation viewer
  if (!currentPresentation) return null;

  const currentSlide = currentPresentation.slides[currentSlideIndex];

  // Fullscreen view
  if (isFullscreen) {
    return (
      <div 
        className="fixed inset-0 bg-background z-50 flex items-center justify-center"
        onClick={(e) => {
          if (e.clientX > window.innerWidth / 2) {
            nextSlide();
          } else {
            prevSlide();
          }
        }}
      >
        <div 
          ref={slideRef}
          className="w-full max-w-6xl aspect-[16/9] rounded-xl overflow-hidden shadow-2xl"
        >
          <ModernSlide
            slide={currentSlide}
            slideIndex={currentSlideIndex}
            totalSlides={currentPresentation.slides.length}
            designSettings={currentPresentation.design_settings}
            isFullscreen={true}
          />
        </div>
        
        {/* Navigation arrows */}
        <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
          <Button
            variant="ghost"
            size="icon"
            className="w-12 h-12 rounded-full bg-background/20 backdrop-blur-sm text-foreground hover:bg-background/40 pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation();
              prevSlide();
            }}
            disabled={currentSlideIndex === 0}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-12 h-12 rounded-full bg-background/20 backdrop-blur-sm text-foreground hover:bg-background/40 pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation();
              nextSlide();
            }}
            disabled={currentSlideIndex === currentPresentation.slides.length - 1}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
        
        {/* Exit button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 bg-background/20 backdrop-blur-sm hover:bg-background/40"
          onClick={(e) => {
            e.stopPropagation();
            setIsFullscreen(false);
          }}
        >
          <Minimize2 className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/presentations')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{currentPresentation.title}</h1>
            <p className="text-sm text-muted-foreground">
              {currentPresentation.slides.length} slides • Thème : {currentPresentation.theme}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowNotes(!showNotes)}>
              {showNotes ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              Notes
            </Button>
            <Button variant="outline" onClick={exportToPDF}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={toggleFullscreen}>
              <Play className="h-4 w-4 mr-2" />
              Présenter
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Slide thumbnails */}
          <Card className="lg:col-span-1">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Slides</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <ScrollArea className="h-[500px]">
                <div className="space-y-2 p-1">
                  {currentPresentation.slides.map((slide, index) => (
                    <div
                      key={slide.id}
                      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                        index === currentSlideIndex 
                          ? 'bg-primary text-primary-foreground shadow-md scale-[1.02]' 
                          : 'bg-muted hover:bg-muted/80 hover:scale-[1.01]'
                      }`}
                      onClick={() => setCurrentSlideIndex(index)}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          index === currentSlideIndex ? 'bg-primary-foreground/20' : 'bg-primary/10 text-primary'
                        }`}>
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium line-clamp-1">{slide.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Main slide view */}
          <div className="lg:col-span-3 space-y-4">
            <Card className="overflow-hidden rounded-xl shadow-lg">
              <div 
                ref={slideRef}
                className="aspect-[16/9]"
              >
                <ModernSlide
                  slide={currentSlide}
                  slideIndex={currentSlideIndex}
                  totalSlides={currentPresentation.slides.length}
                  designSettings={currentPresentation.design_settings}
                  isFullscreen={false}
                />
              </div>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={prevSlide}
                disabled={currentSlideIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Précédent
              </Button>

              <span className="text-sm text-muted-foreground">
                {currentSlideIndex + 1} / {currentPresentation.slides.length}
              </span>

              <Button
                variant="outline"
                onClick={nextSlide}
                disabled={currentSlideIndex === currentPresentation.slides.length - 1}
              >
                Suivant
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            {/* Speaker notes */}
            {showNotes && getCurrentNote() && (
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Notes du présentateur
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {getCurrentNote()}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
