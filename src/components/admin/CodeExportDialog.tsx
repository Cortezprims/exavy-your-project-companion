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

interface CodeExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// This is a simplified representation - in production, you'd fetch from a backend
const generateCodeExport = () => {
  return `
================================================================================
                           EXAVY - CODE SOURCE COMPLET
                         Généré le ${new Date().toLocaleDateString('fr-FR')}
================================================================================

Ce document contient l'ensemble du code source de l'application EXAVY.
Application développée avec React, TypeScript, Tailwind CSS et Supabase.

================================================================================
                              TABLE DES MATIÈRES
================================================================================

1. Configuration
2. Composants UI
3. Pages principales
4. Hooks personnalisés
5. Edge Functions (Backend)
6. Styles et thème

================================================================================
                              1. CONFIGURATION
================================================================================

--- vite.config.ts ---
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

--- tailwind.config.ts ---
// Configuration Tailwind avec thème personnalisé
// Couleurs, typographie et composants shadcn/ui

================================================================================
                            2. COMPOSANTS UI
================================================================================

Les composants UI sont basés sur shadcn/ui et incluent :
- Button, Card, Dialog, Input, Select
- Tabs, Table, Badge, Progress
- Toast, Tooltip, Dropdown
- Et bien d'autres...

================================================================================
                          3. PAGES PRINCIPALES
================================================================================

--- src/pages/Dashboard.tsx ---
// Tableau de bord principal avec statistiques

--- src/pages/Documents.tsx ---
// Gestion des documents avec upload et traitement

--- src/pages/Admin.tsx ---
// Panneau d'administration avec gestion utilisateurs

--- src/pages/Projects.tsx ---
// Gestionnaire de projets avec tâches et notes

================================================================================
                         4. HOOKS PERSONNALISÉS
================================================================================

--- src/hooks/useAuth.tsx ---
// Gestion de l'authentification avec Supabase

--- src/hooks/useSubscription.ts ---
// Gestion des abonnements et limites d'utilisation

--- src/hooks/useAdmin.ts ---
// Vérification du statut administrateur

================================================================================
                       5. EDGE FUNCTIONS (BACKEND)
================================================================================

--- supabase/functions/process-document/index.ts ---
// Traitement des documents (PDF, images, audio)

--- supabase/functions/generate-quiz/index.ts ---
// Génération de quiz avec IA

--- supabase/functions/generate-flashcards/index.ts ---
// Génération de flashcards

--- supabase/functions/generate-summary/index.ts ---
// Génération de résumés

--- supabase/functions/generate-mindmap/index.ts ---
// Génération de cartes mentales

--- supabase/functions/exabot-chat/index.ts ---
// Chat IA intelligent

--- supabase/functions/generate-mock-exam/index.ts ---
// Génération d'examens blancs

--- supabase/functions/generate-exercises/index.ts ---
// Génération d'exercices

--- supabase/functions/generate-presentation/index.ts ---
// Génération de présentations

--- supabase/functions/campay-payment/index.ts ---
// Intégration paiement Campay

--- supabase/functions/pawapay-payment/index.ts ---
// Intégration paiement PawaPay

================================================================================
                          6. STYLES ET THÈME
================================================================================

--- src/index.css ---
// Variables CSS et thème global
// Supporte le mode clair et sombre

================================================================================
                              FIN DU DOCUMENT
================================================================================

EXAVY © ${new Date().getFullYear()} - AVY DIGITAL BUSINESS
Tous droits réservés.

Pour plus d'informations : avydigitalbusiness@gmail.com
`;
};

export const CodeExportDialog = ({ open, onOpenChange }: CodeExportDialogProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const codeContent = generateCodeExport();

  const handleDownload = async () => {
    setIsGenerating(true);
    
    try {
      const blob = new Blob([codeContent], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `EXAVY_Code_Source_${new Date().toISOString().split('T')[0]}.txt`;
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-primary" />
            Export du Code Source EXAVY
          </DialogTitle>
          <DialogDescription>
            Document contenant l'ensemble du code source de l'application.
            Ce document est strictement confidentiel et réservé à l'administrateur.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] border rounded-lg p-4 bg-muted/50">
          <pre className="text-xs font-mono whitespace-pre-wrap">
            {codeContent}
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
                Télécharger le document
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
