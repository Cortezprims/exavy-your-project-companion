import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2,
  Copy,
  RefreshCw,
  GraduationCap,
  BookOpen,
  Briefcase,
  Baby,
  School
} from "lucide-react";

const levels = [
  { id: 'primaire', label: 'Primaire', icon: Baby, description: 'Langage simple, phrases courtes' },
  { id: 'college', label: 'Collège', icon: School, description: 'Vocabulaire intermédiaire' },
  { id: 'lycee', label: 'Lycée', icon: BookOpen, description: 'Langage académique' },
  { id: 'universite', label: 'Université', icon: GraduationCap, description: 'Terminologie avancée' },
  { id: 'professionnel', label: 'Professionnel', icon: Briefcase, description: 'Jargon métier' },
];

const Rephrase = () => {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("lycee");
  const [isLoading, setIsLoading] = useState(false);

  const handleRephrase = async () => {
    if (!inputText.trim()) {
      toast.error("Veuillez entrer un texte à reformuler");
      return;
    }

    setIsLoading(true);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock response based on level
    const mockResponses: Record<string, string> = {
      primaire: "C'est une idée simple. On peut la comprendre facilement. Les mots sont faciles.",
      college: "Cette notion peut être expliquée de manière claire. Le concept central repose sur des principes fondamentaux.",
      lycee: "L'analyse de ce texte révèle des éléments structurels importants. La compréhension approfondie nécessite une lecture attentive.",
      universite: "La complexité inhérente à ce sujet requiert une analyse méthodologique rigoureuse. Les implications théoriques sont multiples.",
      professionnel: "Ce document présente les KPIs essentiels et les deliverables attendus. L'optimisation des process est primordiale.",
    };

    setOutputText(mockResponses[selectedLevel] || inputText);
    setIsLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(outputText);
    toast.success("Copié dans le presse-papier");
  };

  const swapTexts = () => {
    const temp = inputText;
    setInputText(outputText);
    setOutputText(temp);
  };

  return (
    <MainLayout>
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Reformulation Adaptative</h1>
          <p className="text-muted-foreground">Adaptez le niveau de vos textes selon votre audience</p>
        </div>

        {/* Level selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Niveau de reformulation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {levels.map((level) => {
                const Icon = level.icon;
                return (
                  <Button
                    key={level.id}
                    variant={selectedLevel === level.id ? "default" : "outline"}
                    className="flex items-center gap-2"
                    onClick={() => setSelectedLevel(level.id)}
                  >
                    <Icon className="w-4 h-4" />
                    {level.label}
                  </Button>
                );
              })}
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              {levels.find(l => l.id === selectedLevel)?.description}
            </p>
          </CardContent>
        </Card>

        {/* Text areas */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Texte original
                <Badge variant="secondary">{inputText.length} caractères</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Collez ou tapez votre texte ici..."
                className="min-h-[300px] resize-none"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Texte reformulé
                <div className="flex gap-2">
                  {outputText && (
                    <>
                      <Button variant="ghost" size="sm" onClick={swapTexts}>
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={outputText}
                readOnly
                placeholder="Le texte reformulé apparaîtra ici..."
                className="min-h-[300px] resize-none bg-muted/50"
              />
            </CardContent>
          </Card>
        </div>

        {/* Action button */}
        <div className="flex justify-center mt-6">
          <Button
            size="lg"
            onClick={handleRephrase}
            disabled={isLoading || !inputText.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Reformulation en cours...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5 mr-2" />
                Reformuler le texte
              </>
            )}
          </Button>
        </div>

        {/* Tips */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">Conseils d'utilisation</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Utilisez le niveau <strong>Primaire</strong> pour expliquer des concepts complexes simplement</li>
              <li>• Le niveau <strong>Professionnel</strong> est idéal pour des documents techniques</li>
              <li>• Vous pouvez reformuler le résultat en changeant de niveau</li>
              <li>• La longueur du texte peut varier selon le niveau choisi</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Rephrase;
