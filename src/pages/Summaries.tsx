import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  FileText,
  Loader2,
  Sparkles,
  Copy,
  BookOpen,
  List,
  AlignLeft
} from "lucide-react";

interface Summary {
  short: string;
  long: string;
  keyPoints: string[];
}

const mockSummary: Summary = {
  short: "Ce document présente les concepts fondamentaux de l'apprentissage automatique. Il couvre les bases des algorithmes supervisés et non supervisés, avec des exemples pratiques.",
  long: "L'apprentissage automatique (Machine Learning) est une branche de l'intelligence artificielle qui permet aux systèmes d'apprendre et de s'améliorer à partir de l'expérience sans être explicitement programmés.\n\nLes algorithmes supervisés apprennent à partir de données étiquetées, tandis que les algorithmes non supervisés découvrent des patterns dans des données non étiquetées.\n\nLes applications sont nombreuses : reconnaissance d'images, traitement du langage naturel, systèmes de recommandation, et bien plus encore.",
  keyPoints: [
    "L'apprentissage automatique permet aux machines d'apprendre sans programmation explicite",
    "Il existe deux types principaux : supervisé et non supervisé",
    "Les applications pratiques sont très variées et en constante expansion"
  ]
};

const Summaries = () => {
  const [activeSummary, setActiveSummary] = useState<{ docId: string; content: Summary } | null>(null);
  const [summaryType, setSummaryType] = useState<'short' | 'long'>('short');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSummary = async (docTitle: string) => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setActiveSummary({ docId: '1', content: mockSummary });
    toast.success("Résumé généré avec succès");
    setIsGenerating(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copié dans le presse-papier");
  };

  if (activeSummary) {
    return (
      <MainLayout>
        <div className="p-6 md:p-8 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => setActiveSummary(null)}>
              ← Retour
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => copyToClipboard(
                summaryType === 'short' ? activeSummary.content.short : activeSummary.content.long
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
                    {activeSummary.content.short}
                  </p>
                </TabsContent>
                <TabsContent value="long" className="mt-0">
                  <p className="text-lg leading-relaxed whitespace-pre-wrap">
                    {activeSummary.content.long}
                  </p>
                </TabsContent>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <List className="w-5 h-5" />
                  Points clés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {activeSummary.content.keyPoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Badge variant="secondary" className="mt-0.5">{i + 1}</Badge>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </Tabs>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Résumés Intelligents</h1>
          <p className="text-muted-foreground">Générez des synthèses claires et structurées</p>
        </div>

        {/* Generate from documents */}
        <div>
          <h2 className="font-semibold text-lg mb-4">Générer depuis un document</h2>
          <Card className="text-center py-8">
            <CardContent>
              <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">Importez des documents pour créer des résumés</p>
              <Button onClick={() => generateSummary("Document exemple")} disabled={isGenerating}>
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Générer un exemple
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Summaries;
