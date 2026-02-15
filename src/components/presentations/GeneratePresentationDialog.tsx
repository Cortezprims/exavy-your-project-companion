import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Presentation, Loader2, Palette, GraduationCap, Image, AlignLeft } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface GeneratePresentationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentTitle: string;
}

export const GeneratePresentationDialog = ({
  open,
  onOpenChange,
  documentId,
  documentTitle,
}: GeneratePresentationDialogProps) => {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [slideCount, setSlideCount] = useState(10);
  const [theme, setTheme] = useState('modern');
  const [languageLevel, setLanguageLevel] = useState('university');
  const [graphicStyle, setGraphicStyle] = useState('professional');
  const [contentDensity, setContentDensity] = useState('balanced');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const { data, error } = await supabase.functions.invoke('generate-presentation', {
        body: {
          documentId,
          theme,
          slideCount,
          includeNotes: true,
          languageLevel,
          graphicStyle,
          contentDensity,
          additionalNotes: additionalNotes.trim() || undefined,
        },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Présentation générée avec succès !');
      onOpenChange(false);
      navigate('/presentations');
    } catch (error: any) {
      console.error('Error generating presentation:', error);
      toast.error(error.message || 'Erreur lors de la génération');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Presentation className="w-5 h-5 text-primary" />
            Générer une Présentation
          </DialogTitle>
          <DialogDescription>
            Document : {documentTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Nombre de slides */}
          <div className="space-y-2">
            <Label className="flex items-center justify-between">
              <span>Nombre de slides</span>
              <span className="text-sm font-medium text-primary">{slideCount}</span>
            </Label>
            <Slider
              value={[slideCount]}
              onValueChange={([val]) => setSlideCount(val)}
              min={5}
              max={25}
              step={1}
            />
          </div>

          {/* Thème de couleur */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Thème de couleur
            </Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="modern">🎨 Moderne (Indigo & Violet)</SelectItem>
                <SelectItem value="professional">💼 Professionnel (Bleu)</SelectItem>
                <SelectItem value="creative">🌸 Créatif (Rose)</SelectItem>
                <SelectItem value="minimal">⬛ Minimaliste (Noir & Blanc)</SelectItem>
                <SelectItem value="academic">📗 Académique (Vert)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Niveau de langage */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Niveau de langage
            </Label>
            <Select value={languageLevel} onValueChange={setLanguageLevel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">🏫 Primaire (simple et illustré)</SelectItem>
                <SelectItem value="secondary">🏢 Secondaire (clair et structuré)</SelectItem>
                <SelectItem value="university">🎓 Universitaire (détaillé et technique)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Style graphique */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              Style graphique des illustrations
            </Label>
            <Select value={graphicStyle} onValueChange={setGraphicStyle}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">📊 Professionnel (graphiques & schémas)</SelectItem>
                <SelectItem value="playful">🎪 Ludique (icônes colorées & illustrations)</SelectItem>
                <SelectItem value="minimalist">✨ Minimaliste (épuré, peu d'images)</SelectItem>
                <SelectItem value="infographic">📈 Infographie (données visuelles)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quantité d'informations */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <AlignLeft className="w-4 h-4" />
              Quantité d'informations par slide
            </Label>
            <Select value={contentDensity} onValueChange={setContentDensity}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">💡 Léger (3-4 points, très aéré)</SelectItem>
                <SelectItem value="balanced">⚖️ Équilibré (5-6 points)</SelectItem>
                <SelectItem value="dense">📋 Dense (7-8 points, beaucoup de détails)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes additionnelles */}
          <div className="space-y-2">
            <Label>Instructions supplémentaires (optionnel)</Label>
            <Textarea
              placeholder="Ex: Mettre l'accent sur les exemples pratiques, ajouter une slide de bibliographie..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
            Annuler
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Presentation className="w-4 h-4 mr-2" />
                Générer
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
