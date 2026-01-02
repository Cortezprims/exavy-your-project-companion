import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FileText, ExternalLink } from 'lucide-react';

interface TermsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
}

export const TermsDialog = ({ open, onOpenChange, onAccept }: TermsDialogProps) => {
  const [accepted, setAccepted] = useState(false);

  // Reset acceptance when dialog opens
  useEffect(() => {
    if (open) {
      setAccepted(false);
    }
  }, [open]);

  const handleAccept = () => {
    if (accepted) {
      onAccept();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Conditions Générales d'Utilisation
          </DialogTitle>
          <DialogDescription>
            Veuillez lire et accepter les conditions d'utilisation d'EXAVY pour continuer
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-bold text-base mb-2">I. CONDITIONS GÉNÉRALES D'UTILISATION (CGU)</h3>
              <p className="text-muted-foreground text-xs mb-3">Dernière mise à jour : 02 Janvier 2026</p>
              
              <h4 className="font-semibold mt-4 mb-2">1. PRÉSENTATION DE L'APPLICATION</h4>
              <p className="text-muted-foreground">
                L'application EXAVY (ci-après "l'Application") est une plateforme technologique d'assistance scolaire et universitaire exploitant l'intelligence artificielle (technologie Google Gemini). Elle est la propriété exclusive de AVY DIGITAL BUSINESS.
              </p>

              <h4 className="font-semibold mt-4 mb-2">2. ACCEPTATION DES CONDITIONS</h4>
              <p className="text-muted-foreground">
                L'accès et l'utilisation de l'Application sont soumis à l'acceptation pleine et entière des présentes CGU par l'Utilisateur. En créant un compte, l'Utilisateur reconnaît avoir lu, compris et accepté l'ensemble des clauses. En cas de désaccord, l'Utilisateur doit cesser immédiatement toute utilisation.
              </p>

              <h4 className="font-semibold mt-4 mb-2">3. ÉLIGIBILITÉ ET INSCRIPTION</h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li><strong>Âge :</strong> L'Application est destinée aux écoliers et étudiants. Les mineurs de moins de 13 ans doivent obtenir le consentement explicite de leurs parents ou tuteurs légaux avant toute création de compte.</li>
                <li><strong>Exactitude :</strong> L'Utilisateur s'engage à fournir des informations exactes (Nom, Prénom, Email, Niveau d'étude) lors de son inscription.</li>
                <li><strong>Sécurité :</strong> L'Utilisateur est seul responsable de la protection de ses identifiants. Toute activité effectuée depuis son compte est présumée être de son fait.</li>
              </ul>

              <h4 className="font-semibold mt-4 mb-2">4. DESCRIPTION DES SERVICES ET USAGE DE L'IA</h4>
              <p className="text-muted-foreground mb-2">EXAVY met à disposition :</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Un tuteur conversationnel basé sur le modèle Gemini de Google.</li>
                <li>Des outils d'analyse d'images (OCR) pour la résolution d'exercices.</li>
                <li>Des fonctions de résumé de documents (PDF, Audio).</li>
                <li>Des générateurs de quiz et de cartes mémoires (flashcards).</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                <strong>Avertissement sur l'Intelligence Artificielle :</strong> L'Utilisateur reconnaît que l'IA peut parfois produire des résultats erronés, imprécis ou biaisés (phénomène d'hallucination). EXAVY est un outil de soutien et ne doit en aucun cas être la source unique d'apprentissage.
              </p>

              <h4 className="font-semibold mt-4 mb-2">5. ÉTHIQUE ET INTÉGRITÉ ACADÉMIQUE</h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li><strong>Aide à la compréhension :</strong> L'objectif est de comprendre le "comment" et le "pourquoi" et non d'utiliser l'outil pour tricher lors d'évaluations officielles.</li>
                <li><strong>Plagiat :</strong> EXAVY ne pourra être tenu responsable si l'Utilisateur soumet des travaux générés par l'IA comme étant ses propres créations originales.</li>
              </ul>

              <h4 className="font-semibold mt-4 mb-2">6. PROPRIÉTÉ INTELLECTUELLE</h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li><strong>Contenu de l'App :</strong> Tous les textes, logos, designs, interfaces et codes sources sont la propriété de AVY DIGITAL BUSINESS.</li>
                <li><strong>Contenu Utilisateur :</strong> L'Utilisateur conserve la propriété des documents qu'il télécharge. Cependant, il concède à EXAVY une licence mondiale, non exclusive et gratuite pour traiter ces données via les serveurs afin de fournir le service.</li>
              </ul>

              <h4 className="font-semibold mt-4 mb-2">7. LIMITATION DE RESPONSABILITÉ</h4>
              <p className="text-muted-foreground">AVY DIGITAL BUSINESS ne saurait être tenue pour responsable :</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Des erreurs ou bugs techniques.</li>
                <li>De l'indisponibilité temporaire des services.</li>
                <li>Des conséquences directes ou indirectes d'une réponse erronée fournie par l'IA.</li>
                <li>De l'échec à un examen ou d'une baisse de notes de l'Utilisateur.</li>
              </ul>
            </section>

            <section className="border-t pt-4">
              <h3 className="font-bold text-base mb-2">II. POLITIQUE DE CONFIDENTIALITÉ</h3>
              <p className="text-muted-foreground text-xs mb-3">Dernière mise à jour : 02 Janvier 2026</p>
              
              <h4 className="font-semibold mt-4 mb-2">1. COLLECTE DES DONNÉES</h4>
              <p className="text-muted-foreground mb-2">Nous collectons les informations suivantes pour le bon fonctionnement d'EXAVY :</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Informations d'identité : Nom, prénom, adresse email.</li>
                <li>Informations académiques : Niveau d'étude, matières d'intérêt.</li>
                <li>Données de contenu : Historique des discussions avec l'IA, photos de devoirs, fichiers PDF téléchargés.</li>
                <li>Données techniques : Adresse IP, type d'appareil.</li>
              </ul>

              <h4 className="font-semibold mt-4 mb-2">2. UTILISATION DES DONNÉES</h4>
              <p className="text-muted-foreground">Vos données sont utilisées pour :</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Fournir les réponses personnalisées via l'IA.</li>
                <li>Sauvegarder votre progression et votre historique de révision.</li>
                <li>Améliorer nos services.</li>
              </ul>

              <h4 className="font-semibold mt-4 mb-2">3. VOS DROITS</h4>
              <p className="text-muted-foreground">
                Vous disposez des droits d'accès, de rectification, de suppression et de portabilité de vos données personnelles.
              </p>
            </section>
          </div>
        </ScrollArea>

        <div className="border-t pt-4 space-y-4">
          <a 
            href="/documents/EXAVY-CGU.pdf" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            Télécharger le document complet (PDF)
          </a>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="accept-terms"
              checked={accepted}
              onCheckedChange={(checked) => setAccepted(checked === true)}
            />
            <Label htmlFor="accept-terms" className="text-sm leading-relaxed cursor-pointer">
              J'ai lu et j'accepte les <strong>Conditions Générales d'Utilisation</strong> et la <strong>Politique de Confidentialité</strong> d'EXAVY
            </Label>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={handleAccept} disabled={!accepted}>
              Accepter et continuer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};