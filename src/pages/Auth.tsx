import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { Sparkles, Mail, Lock, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { TermsDialog } from '@/components/auth/TermsDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, ExternalLink } from 'lucide-react';

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [showTermsReadOnly, setShowTermsReadOnly] = useState(false);
  const [pendingSignup, setPendingSignup] = useState<{ email: string; password: string } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginEmail || !loginPassword) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signIn(loginEmail, loginPassword);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email ou mot de passe incorrect');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Veuillez confirmer votre email');
        } else {
          toast.error(error.message);
        }
        return;
      }
      toast.success('Connexion réussie !');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signupEmail || !signupPassword) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    if (signupPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    // Store the signup data and show terms dialog
    setPendingSignup({ email: signupEmail, password: signupPassword });
    setShowTermsDialog(true);
  };

  const handleTermsAccepted = async () => {
    if (!pendingSignup) return;

    setLoading(true);
    try {
      const { error } = await signUp(pendingSignup.email, pendingSignup.password);
      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('Cet email est déjà utilisé');
        } else {
          toast.error(error.message);
        }
        return;
      }
      toast.success('Compte créé avec succès !');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error('Erreur lors de la création du compte');
    } finally {
      setLoading(false);
      setPendingSignup(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">EXAVY</CardTitle>
          <CardDescription>Votre assistant d'apprentissage intelligent</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Connexion</TabsTrigger>
              <TabsTrigger value="signup">Inscription</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="votre@email.com"
                      className="pl-10"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    'Se connecter'
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignupSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nom (optionnel)</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Votre nom"
                      className="pl-10"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="votre@email.com"
                      className="pl-10"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      minLength={6}
                      disabled={loading}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Minimum 6 caractères</p>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Création...
                    </>
                  ) : (
                    'Créer un compte'
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  En créant un compte, vous acceptez nos{' '}
                  <button 
                    type="button"
                    onClick={() => setShowTermsReadOnly(true)}
                    className="text-primary hover:underline font-medium"
                  >
                    conditions d'utilisation
                  </button>
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <TermsDialog
        open={showTermsDialog}
        onOpenChange={setShowTermsDialog}
        onAccept={handleTermsAccepted}
      />

      {/* Read-only Terms Dialog */}
      <Dialog open={showTermsReadOnly} onOpenChange={setShowTermsReadOnly}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Conditions Générales d'Utilisation
            </DialogTitle>
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
                  L'accès et l'utilisation de l'Application sont soumis à l'acceptation pleine et entière des présentes CGU par l'Utilisateur. En créant un compte, l'Utilisateur reconnaît avoir lu, compris et accepté l'ensemble des clauses.
                </p>

                <h4 className="font-semibold mt-4 mb-2">3. ÉLIGIBILITÉ ET INSCRIPTION</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li><strong>Âge :</strong> L'Application est destinée aux écoliers et étudiants. Les mineurs de moins de 13 ans doivent obtenir le consentement explicite de leurs parents.</li>
                  <li><strong>Exactitude :</strong> L'Utilisateur s'engage à fournir des informations exactes lors de son inscription.</li>
                  <li><strong>Sécurité :</strong> L'Utilisateur est seul responsable de la protection de ses identifiants.</li>
                </ul>

                <h4 className="font-semibold mt-4 mb-2">4. DESCRIPTION DES SERVICES</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Un tuteur conversationnel basé sur le modèle Gemini de Google.</li>
                  <li>Des outils d'analyse d'images (OCR) pour la résolution d'exercices.</li>
                  <li>Des fonctions de résumé de documents (PDF, Audio).</li>
                  <li>Des générateurs de quiz et de cartes mémoires (flashcards).</li>
                </ul>
              </section>

              <section className="border-t pt-4">
                <h3 className="font-bold text-base mb-2">II. POLITIQUE DE CONFIDENTIALITÉ</h3>
                
                <h4 className="font-semibold mt-4 mb-2">1. COLLECTE DES DONNÉES</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Informations d'identité : Nom, prénom, adresse email.</li>
                  <li>Informations académiques : Niveau d'étude, matières d'intérêt.</li>
                  <li>Données de contenu : Historique des discussions avec l'IA.</li>
                </ul>

                <h4 className="font-semibold mt-4 mb-2">2. VOS DROITS</h4>
                <p className="text-muted-foreground">
                  Vous disposez des droits d'accès, de rectification, de suppression et de portabilité de vos données personnelles.
                </p>
              </section>
            </div>
          </ScrollArea>

          <div className="border-t pt-4">
            <a 
              href="/documents/EXAVY-CGU.pdf" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              Télécharger le document complet (PDF)
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
