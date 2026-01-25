import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, Monitor, CheckCircle, ArrowRight, Share2 } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
  };

  const features = [
    { icon: Smartphone, title: 'Accès hors ligne', description: 'Utilisez EXAVY même sans connexion internet' },
    { icon: Download, title: 'Notifications', description: 'Recevez des rappels et mises à jour importantes' },
    { icon: Monitor, title: 'Plein écran', description: 'Profitez d\'une expérience immersive sans barre de navigateur' },
  ];

  return (
    <MainLayout>
      <div className="p-6 md:p-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground font-bold text-sm uppercase tracking-wider mb-6">
            <Download className="w-4 h-4" />
            Installation
          </div>
          <h1 className="text-3xl md:text-4xl mb-4">Installez EXAVY</h1>
          <p className="text-muted-foreground text-lg">
            Transformez EXAVY en application native sur votre appareil pour une expérience optimale.
          </p>
        </div>

        {/* Status Card */}
        <div className="max-w-md mx-auto">
          {isInstalled ? (
            <Card className="border-success border-4">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-success flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-success-foreground" />
                </div>
                <h2 className="text-xl font-bold mb-2">Déjà installé !</h2>
                <p className="text-muted-foreground">
                  EXAVY est déjà installé sur votre appareil. Vous pouvez le trouver sur votre écran d'accueil.
                </p>
              </CardContent>
            </Card>
          ) : isIOS ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Share2 className="w-5 h-5 text-primary" />
                  Installation sur iOS
                </CardTitle>
                <CardDescription>Suivez ces étapes simples</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
                  <div>
                    <p className="font-bold">Appuyez sur le bouton Partager</p>
                    <p className="text-sm text-muted-foreground">En bas de Safari (icône carré avec flèche)</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-secondary text-secondary-foreground flex items-center justify-center font-bold">2</div>
                  <div>
                    <p className="font-bold">Faites défiler et sélectionnez</p>
                    <p className="text-sm text-muted-foreground">"Sur l'écran d'accueil"</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-accent text-accent-foreground flex items-center justify-center font-bold">3</div>
                  <div>
                    <p className="font-bold">Appuyez sur Ajouter</p>
                    <p className="text-sm text-muted-foreground">EXAVY apparaîtra sur votre écran d'accueil</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : deferredPrompt ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary flex items-center justify-center mx-auto mb-4">
                  <Download className="w-8 h-8 text-primary-foreground" />
                </div>
                <h2 className="text-xl font-bold mb-4">Prêt à installer</h2>
                <Button onClick={handleInstall} size="lg" className="w-full">
                  Installer EXAVY
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-muted flex items-center justify-center mx-auto mb-4">
                  <Monitor className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-bold mb-2">Utilisez Chrome ou Edge</h2>
                <p className="text-muted-foreground">
                  Pour installer EXAVY, ouvrez cette page dans Chrome, Edge ou un autre navigateur compatible.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className={`animate-slide-up stagger-${index + 1}`}>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
};

export default Install;
