import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { Sparkles, Mail, Lock, User, Loader2, Phone, Chrome } from 'lucide-react';
import { toast } from 'sonner';
import { TermsDialog } from '@/components/auth/TermsDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, ExternalLink } from 'lucide-react';
import { RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp';

const FirebaseAuth = () => {
  const navigate = useNavigate();
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, sendPhoneVerification, verifyPhoneCode, user, loading: authLoading } = useFirebaseAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  
  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  
  // Phone verification state
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  
  // Terms dialogs
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [showTermsReadOnly, setShowTermsReadOnly] = useState(false);
  const [pendingSignup, setPendingSignup] = useState<{ email: string; password: string; name: string; phone: string } | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  // Initialize reCAPTCHA verifier
  useEffect(() => {
    if (recaptchaContainerRef.current && !recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            // reCAPTCHA solved
          },
          'expired-callback': () => {
            toast.error('reCAPTCHA expiré, veuillez réessayer');
          }
        });
      } catch (error) {
        console.error('Error initializing reCAPTCHA:', error);
      }
    }

    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (e) {
          // Ignore cleanup errors
        }
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginEmail || !loginPassword) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signInWithEmail(loginEmail, loginPassword);
      if (error) {
        if (error.message.includes('auth/invalid-credential') || error.message.includes('auth/wrong-password')) {
          toast.error('Email ou mot de passe incorrect');
        } else if (error.message.includes('auth/user-not-found')) {
          toast.error('Aucun compte trouvé avec cet email');
        } else if (error.message.includes('auth/too-many-requests')) {
          toast.error('Trop de tentatives, veuillez réessayer plus tard');
        } else {
          toast.error('Erreur de connexion');
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

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        if (error.message.includes('popup-closed')) {
          toast.error('Connexion annulée');
        } else {
          toast.error('Erreur de connexion Google');
        }
        return;
      }
      toast.success('Connexion réussie !');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Google login error:', error);
      toast.error('Erreur de connexion Google');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signupEmail || !signupPassword || !signupPhone) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (signupPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(signupPhone)) {
      toast.error('Veuillez entrer un numéro de téléphone valide avec le code pays (ex: +33612345678)');
      return;
    }

    // Store the signup data and show terms dialog
    setPendingSignup({ email: signupEmail, password: signupPassword, name: signupName, phone: signupPhone });
    setShowTermsDialog(true);
  };

  const handleTermsAccepted = async () => {
    if (!pendingSignup) return;

    setLoading(true);
    try {
      // First create the account
      const { error } = await signUpWithEmail(pendingSignup.email, pendingSignup.password, pendingSignup.name);
      if (error) {
        if (error.message.includes('email-already-in-use')) {
          toast.error('Cet email est déjà utilisé');
        } else if (error.message.includes('weak-password')) {
          toast.error('Le mot de passe est trop faible');
        } else {
          toast.error(error.message);
        }
        setLoading(false);
        return;
      }

      // Send phone verification
      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible'
        });
      }

      const phoneResult = await sendPhoneVerification(pendingSignup.phone, recaptchaVerifierRef.current);
      if (phoneResult.error) {
        console.error('Phone verification error:', phoneResult.error);
        toast.error('Erreur lors de l\'envoi du code SMS. Votre compte a été créé, vous pouvez vous connecter.');
        navigate('/dashboard');
        return;
      }

      setConfirmationResult(phoneResult.confirmationResult!);
      setShowPhoneVerification(true);
      toast.success('Code SMS envoyé !');
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error('Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhone = async () => {
    if (!confirmationResult || verificationCode.length !== 6) {
      toast.error('Veuillez entrer le code à 6 chiffres');
      return;
    }

    setLoading(true);
    try {
      const { error } = await verifyPhoneCode(confirmationResult, verificationCode);
      if (error) {
        if (error.message.includes('invalid-verification-code')) {
          toast.error('Code incorrect');
        } else if (error.message.includes('code-expired')) {
          toast.error('Le code a expiré, veuillez réessayer');
        } else {
          toast.error('Erreur de vérification');
        }
        return;
      }
      toast.success('Compte créé et vérifié avec succès !');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Phone verification error:', error);
      toast.error('Erreur de vérification');
    } finally {
      setLoading(false);
      setPendingSignup(null);
      setShowPhoneVerification(false);
    }
  };

  const skipPhoneVerification = () => {
    setShowPhoneVerification(false);
    setPendingSignup(null);
    toast.success('Compte créé avec succès !');
    navigate('/dashboard');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      {/* Hidden reCAPTCHA container */}
      <div id="recaptcha-container" ref={recaptchaContainerRef} />

      {/* Phone Verification Modal */}
      <Dialog open={showPhoneVerification} onOpenChange={(open) => !loading && setShowPhoneVerification(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Vérification du téléphone
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Un code de vérification a été envoyé au {pendingSignup?.phone}
            </p>
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={verificationCode}
                onChange={setVerificationCode}
                disabled={loading}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={skipPhoneVerification} 
                disabled={loading}
                className="flex-1"
              >
                Passer
              </Button>
              <Button 
                onClick={handleVerifyPhone} 
                disabled={loading || verificationCode.length !== 6}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Vérification...
                  </>
                ) : (
                  'Vérifier'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
          {/* Google Sign In Button */}
          <Button 
            variant="outline" 
            className="w-full mb-4 gap-2" 
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <Chrome className="w-5 h-5" />
            Continuer avec Google
          </Button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Ou</span>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                  <Label htmlFor="signup-email">Email *</Label>
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
                  <Label htmlFor="signup-phone">Téléphone * (avec code pays)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-phone"
                      type="tel"
                      placeholder="+33612345678"
                      className="pl-10"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Format: +33 suivi du numéro sans le 0</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Mot de passe *</Label>
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

export default FirebaseAuth;
