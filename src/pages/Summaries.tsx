import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  FileText,
  Loader2,
  Sparkles,
  Copy,
  BookOpen,
  List,
  AlignLeft,
  ArrowLeft,
  Clock
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface SummaryData {
  id: string;
  short_summary: string | null;
  long_summary: string | null;
  key_concepts: string[] | null;
  document_id: string;
  created_at: string;
}

const Summaries = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [summaries, setSummaries] = useState<SummaryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSummary, setActiveSummary] = useState<SummaryData | null>(null);
  const [summaryType, setSummaryType] = useState<'short' | 'long'>('short');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (user) {
      if (documentId) {
        fetchSummaryForDocument();
      } else {
        fetchAllSummaries();
      }
    }
  }, [user, documentId]);

  const fetchAllSummaries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('summaries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const parsedSummaries = (data || []).map(s => ({
        ...s,
        key_concepts: Array.isArray(s.key_concepts) ? s.key_concepts as string[] : []
      }));

      setSummaries(parsedSummaries);
    } catch (error) {
      console.error('Error fetching summaries:', error);
      toast.error('Erreur lors du chargement des résumés');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummaryForDocument = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('summaries')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const summaryData = data[0];
        setActiveSummary({
          ...summaryData,
          key_concepts: Array.isArray(summaryData.key_concepts) ? summaryData.key_concepts as string[] : []
        });
      } else {
        // Generate summary if none exists
        await generateSummary();
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
      toast.error('Erreur lors du chargement du résumé');
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = async () => {
    if (!documentId || !user) return;
    
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-summary', {
        body: { documentId, userId: user.id }
      });

      if (error) throw error;

      if (data?.summary) {
        setActiveSummary({
          ...data.summary,
          key_concepts: Array.isArray(data.summary.key_concepts) ? data.summary.key_concepts : []
        });
        toast.success("Résumé généré avec succès");
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      toast.error('Erreur lors de la génération du résumé');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copié dans le presse-papier");
  };

  const viewSummary = (summary: SummaryData) => {
    setActiveSummary(summary);
  };

  const exitSummary = () => {
    setActiveSummary(null);
  };

  // Loading state
  if (loading || isGenerating) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">
            {isGenerating ? 'Génération du résumé...' : 'Chargement...'}
          </p>
        </div>
      </MainLayout>
    );
  }

  // Active summary view
  if (activeSummary) {
    return (
      <MainLayout>
        <div className="p-6 md:p-8 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={documentId ? () => navigate('/documents') : exitSummary}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {documentId ? 'Retour aux documents' : 'Retour aux résumés'}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => copyToClipboard(
                summaryType === 'short' ? (activeSummary.short_summary || '') : (activeSummary.long_summary || '')
              )}>
                <Copy className="w-4 h-4 mr-2" />
                Copier
              </Button>
            </div>
          </div>

          <Tabs value={summaryType} onValueChange={(v) => setSummaryType(v as 'short' | 'long')}>
            <TabsList className="mb-6">
              <TabsTrigger value="short">
                <AlignLeft className="w-4 h-4 mr-2" />
                Résumé court
              </TabsTrigger>
              <TabsTrigger value="long">
                <BookOpen className="w-4 h-4 mr-2" />
                Résumé détaillé
              </TabsTrigger>
            </TabsList>

            <Card className="mb-6">
              <CardContent className="p-6">
                <TabsContent value="short" className="mt-0">
                  <p className="text-lg leading-relaxed whitespace-pre-wrap">
                    {activeSummary.short_summary || 'Aucun résumé court disponible'}
                  </p>
                </TabsContent>
                <TabsContent value="long" className="mt-0">
                  <p className="text-lg leading-relaxed whitespace-pre-wrap">
                    {activeSummary.long_summary || 'Aucun résumé détaillé disponible'}
                  </p>
                </TabsContent>
              </CardContent>
            </Card>

            {activeSummary.key_concepts && activeSummary.key_concepts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <List className="w-5 h-5" />
                    Points clés
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {activeSummary.key_concepts.map((point, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Badge variant="secondary" className="mt-0.5">{i + 1}</Badge>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </Tabs>
        </div>
      </MainLayout>
    );
  }

  // Summary list view
  return (
    <MainLayout>
      <div className="p-6 md:p-8">
        <div className="ml-16 md:ml-0 flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Résumés Intelligents</h1>
            <p className="text-muted-foreground">Générez des synthèses claires et structurées</p>
          </div>
          <Button onClick={() => navigate('/documents')}>
            <FileText className="w-4 h-4 mr-2" />
            Générer depuis un document
          </Button>
        </div>

        {summaries.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold text-lg mb-2">Aucun résumé disponible</h3>
              <p className="text-muted-foreground mb-6">
                Importez un document pour générer votre premier résumé
              </p>
              <Button onClick={() => navigate('/documents')}>
                <FileText className="w-4 h-4 mr-2" />
                Aller aux documents
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {summaries.map((summary) => (
              <Card key={summary.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => viewSummary(summary)}>
                <CardHeader>
                  <CardTitle className="text-lg line-clamp-2">
                    Résumé #{summary.id.substring(0, 8)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {summary.short_summary || 'Aucun aperçu disponible'}
                  </p>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <List className="w-4 h-4" />
                      {summary.key_concepts?.length || 0} points clés
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDistanceToNow(new Date(summary.created_at), { addSuffix: true, locale: fr })}
                    </span>
                  </div>
                  <Button className="w-full mt-4" variant="outline">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Voir le résumé
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

export default Summaries;
