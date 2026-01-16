import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Loader2, Download, Lock, RefreshCw, Plus, X, Lightbulb, HelpCircle, FileText, Clock, Brain } from 'lucide-react';
import { toast } from 'sonner';
import { toPng } from 'html-to-image';
import { InteractiveMindMap } from '@/components/mindmap/InteractiveMindMap';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface MindMapNode {
  id: string;
  label: string;
  children: MindMapNode[];
}

interface MindMapData {
  id: string;
  title: string;
  nodes: MindMapNode[];
  document_id: string;
  created_at: string;
}

const COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-cyan-500',
];

const MindMapViewer = ({ nodes, title }: { nodes: MindMapNode[]; title: string }) => {
  return (
    <div className="flex flex-col items-center p-8 min-w-max">
      {/* Central node */}
      <div className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold text-lg shadow-lg mb-8">
        {title}
      </div>
      
      {/* Branches */}
      <div className="flex flex-wrap justify-center gap-6">
        {nodes.map((node, index) => (
          <div key={node.id} className="flex flex-col items-center">
            {/* Connection line */}
            <div className="w-0.5 h-8 bg-border" />
            
            {/* Main branch */}
            <div className={`${COLORS[index % COLORS.length]} text-white px-4 py-2 rounded-lg font-medium shadow-md mb-4`}>
              {node.label}
            </div>
            
            {/* Sub-branches */}
            {node.children && node.children.length > 0 && (
              <div className="flex flex-col items-center gap-2">
                <div className="w-0.5 h-4 bg-border" />
                <div className="flex flex-wrap justify-center gap-3 max-w-xs">
                  {node.children.map((child) => (
                    <div key={child.id} className="flex flex-col items-center">
                      <div className="w-0.5 h-3 bg-border" />
                      <div className="bg-muted text-muted-foreground px-3 py-1.5 rounded-md text-sm border">
                        {child.label}
                      </div>
                      
                      {/* Third level */}
                      {child.children && child.children.length > 0 && (
                        <div className="flex flex-col items-center mt-2">
                          <div className="w-0.5 h-2 bg-border" />
                          <div className="flex flex-wrap gap-2 justify-center max-w-[200px]">
                            {child.children.map((grandChild) => (
                              <div
                                key={grandChild.id}
                                className="bg-background border border-border px-2 py-1 rounded text-xs"
                              >
                                {grandChild.label}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const MindMap = () => {
  const { user } = useAuth();
  const { documentId } = useParams();
  const navigate = useNavigate();
  const mindMapRef = useRef<HTMLDivElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [mindMaps, setMindMaps] = useState<MindMapData[]>([]);
  const [activeMindMap, setActiveMindMap] = useState<MindMapData | null>(null);
  const [documentTitle, setDocumentTitle] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  
  // Customization state
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [focusPoints, setFocusPoints] = useState<string[]>([]);
  const [newFocusPoint, setNewFocusPoint] = useState('');
  const [clarifyText, setClarifyText] = useState('');
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    if (user) {
      if (documentId) {
        fetchMindMapForDocument();
      } else {
        fetchAllMindMaps();
      }
    }
  }, [documentId, user]);

  const fetchAllMindMaps = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('mind_maps')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const parsedMindMaps = (data || []).map(mm => ({
        ...mm,
        nodes: Array.isArray(mm.nodes) ? mm.nodes as unknown as MindMapNode[] : []
      }));

      setMindMaps(parsedMindMaps);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur lors du chargement des cartes mentales');
    } finally {
      setLoading(false);
    }
  };

  const fetchMindMapForDocument = async () => {
    setLoading(true);
    try {
      // Get document title
      const { data: docData } = await supabase
        .from('documents')
        .select('title')
        .eq('id', documentId)
        .maybeSingle();
      
      if (docData) {
        setDocumentTitle(docData.title);
      }

      // Check if mind map already exists
      const { data: existingMindMap } = await supabase
        .from('mind_maps')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingMindMap) {
        const nodes = Array.isArray(existingMindMap.nodes) 
          ? existingMindMap.nodes as unknown as MindMapNode[]
          : [];
        setActiveMindMap({
          ...existingMindMap,
          nodes
        });
      } else {
        await generateMindMap();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur lors du chargement de la carte mentale');
    } finally {
      setLoading(false);
    }
  };

  const generateMindMap = async (customFocus?: string[], clarification?: string) => {
    if (!user || !documentId) return;
    
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-mindmap', {
        body: { 
          documentId, 
          userId: user.id,
          focusPoints: customFocus,
          clarification
        }
      });

      if (error) throw error;
      
      if (data?.mindMap) {
        const nodes = Array.isArray(data.mindMap.nodes) 
          ? data.mindMap.nodes as unknown as MindMapNode[]
          : [];
        setActiveMindMap({
          ...data.mindMap,
          nodes
        });
        toast.success('Carte mentale générée avec succès !');
      }
    } catch (error) {
      console.error('Error generating mind map:', error);
      toast.error('Erreur lors de la génération de la carte mentale');
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    setCustomizeOpen(false);
    
    try {
      if (activeMindMap) {
        await supabase.from('mind_maps').delete().eq('id', activeMindMap.id);
      }
      
      await generateMindMap(
        focusPoints.length > 0 ? focusPoints : undefined,
        clarifyText || undefined
      );
    } finally {
      setRegenerating(false);
      setFocusPoints([]);
      setClarifyText('');
    }
  };

  const addFocusPoint = () => {
    if (newFocusPoint.trim() && focusPoints.length < 5) {
      setFocusPoints([...focusPoints, newFocusPoint.trim()]);
      setNewFocusPoint('');
    }
  };

  const removeFocusPoint = (index: number) => {
    setFocusPoints(focusPoints.filter((_, i) => i !== index));
  };

  const handleDownload = async () => {
    if (!isPremium) {
      toast.error('Fonctionnalité disponible uniquement avec l\'abonnement Premium');
      return;
    }
    
    if (!mindMapRef.current) return;
    
    try {
      toast.loading('Génération de l\'image...');
      
      const dataUrl = await toPng(mindMapRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        quality: 1
      });
      
      const link = document.createElement('a');
      link.download = `mindmap-${documentTitle || 'export'}.png`;
      link.href = dataUrl;
      link.click();
      
      toast.dismiss();
      toast.success('Image téléchargée avec succès !');
    } catch (error) {
      console.error('Error downloading:', error);
      toast.dismiss();
      toast.error('Erreur lors du téléchargement');
    }
  };

  const viewMindMap = (mindMap: MindMapData) => {
    setActiveMindMap(mindMap);
  };

  const exitMindMap = () => {
    setActiveMindMap(null);
  };

  // Loading state
  if (loading || generating || regenerating) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">
            {generating || regenerating ? 'Génération de la carte mentale...' : 'Chargement...'}
          </p>
        </div>
      </MainLayout>
    );
  }

  // Active mind map view
  if (activeMindMap) {
    return (
      <MainLayout>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={documentId ? () => navigate('/documents') : exitMindMap}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {documentId ? 'Retour aux documents' : 'Retour aux cartes mentales'}
            </Button>
            
            <div className="flex gap-2">
              <Dialog open={customizeOpen} onOpenChange={setCustomizeOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Personnaliser
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Personnaliser la carte mentale</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-6 py-4">
                    <div className="space-y-3">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        Points clés à mettre en avant (max 5)
                      </label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Ex: Les causes principales..."
                          value={newFocusPoint}
                          onChange={(e) => setNewFocusPoint(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addFocusPoint()}
                          disabled={focusPoints.length >= 5}
                        />
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={addFocusPoint}
                          disabled={focusPoints.length >= 5}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      {focusPoints.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {focusPoints.map((point, index) => (
                            <Badge key={index} variant="secondary" className="pr-1">
                              {point}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 ml-1 hover:bg-transparent"
                                onClick={() => removeFocusPoint(index)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <HelpCircle className="w-4 h-4" />
                        Partie du document à éclaircir
                      </label>
                      <Textarea
                        placeholder="Décrivez une partie du document que vous n'avez pas bien comprise..."
                        value={clarifyText}
                        onChange={(e) => setClarifyText(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCustomizeOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleRegenerate}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Régénérer
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Button 
                variant={isPremium ? "default" : "outline"}
                onClick={handleDownload}
                className={!isPremium ? "opacity-75" : ""}
              >
                {isPremium ? (
                  <Download className="w-4 h-4 mr-2" />
                ) : (
                  <Lock className="w-4 h-4 mr-2" />
                )}
                Télécharger PNG
                {!isPremium && <Badge variant="secondary" className="ml-2 text-xs">Premium</Badge>}
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🧠</span>
                {activeMindMap.title || documentTitle}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div ref={mindMapRef}>
                <InteractiveMindMap nodes={activeMindMap.nodes} title={activeMindMap.title} />
              </div>
            </CardContent>
          </Card>

          {!isPremium && (
            <Card className="mt-6 border-primary/50 bg-primary/5">
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Passez à Premium
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Téléchargez vos cartes mentales en haute qualité
                  </p>
                </div>
                <Button onClick={() => navigate('/subscription')}>
                  Voir les offres
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </MainLayout>
    );
  }

  // Mind map list view
  return (
    <MainLayout>
      <div className="p-6 md:p-8">
        <div className="ml-16 md:ml-0 flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Cartes Mentales</h1>
            <p className="text-muted-foreground">Visualisez vos connaissances avec des cartes mentales</p>
          </div>
          <Button onClick={() => navigate('/documents')}>
            <FileText className="w-4 h-4 mr-2" />
            Générer depuis un document
          </Button>
        </div>

        {mindMaps.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold text-lg mb-2">Aucune carte mentale disponible</h3>
              <p className="text-muted-foreground mb-6">
                Importez un document pour générer votre première carte mentale
              </p>
              <Button onClick={() => navigate('/documents')}>
                <FileText className="w-4 h-4 mr-2" />
                Aller aux documents
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mindMaps.map((mindMap) => (
              <Card key={mindMap.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => viewMindMap(mindMap)}>
                <CardHeader>
                  <CardTitle className="text-lg line-clamp-2">{mindMap.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Brain className="w-4 h-4" />
                      {mindMap.nodes.length} branches
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDistanceToNow(new Date(mindMap.created_at), { addSuffix: true, locale: fr })}
                    </span>
                  </div>
                  <Button className="w-full" variant="outline">
                    Voir la carte
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

export default MindMap;
