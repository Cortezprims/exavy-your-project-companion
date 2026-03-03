import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, FileCode, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { compileAllCode } from "@/utils/codeCompiler";

interface CodeExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CodeExportDialog = ({ open, onOpenChange }: CodeExportDialogProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [codeContent, setCodeContent] = useState<string | null>(null);

  const handleOpen = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (isOpen && !codeContent) {
      setCodeContent(compileAllCode());
    }
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const content = codeContent || compileAllCode();
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `EXAVY_Code_Source_Complet_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Document téléchargé avec succès !");
    } catch (error) {
      toast.error("Erreur lors du téléchargement");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-primary" />
            Export du Code Source Complet EXAVY
          </DialogTitle>
          <DialogDescription>
            Document contenant l'intégralité du code source de l'application.
            Ce document est strictement confidentiel et réservé à l'administrateur.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] border rounded-lg p-4 bg-muted/50">
          <pre className="text-xs font-mono whitespace-pre-wrap">
            {codeContent || "Chargement..."}
          </pre>
        </ScrollArea>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          <Button onClick={handleDownload} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Télécharger le code complet
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
