import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Sparkles, Brain, Zap, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const features = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "IA Générative",
      description: "Génération automatique de quiz, flashcards et résumés à partir de vos documents"
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: "Répétition Espacée",
      description: "Algorithme SRS pour optimiser votre mémorisation selon la courbe d'oubli"
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Multi-formats",
      description: "Importez PDF, audio, images et notes textuelles en toute simplicité"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Planning Dynamique",
      description: "Créez des plans de révision intelligents adaptés à votre emploi du temps"
    }
  ];

  const plans = [
    {
      name: "Freemium",
      price: "0",
      currency: "FCFA",
      features: [
        "3 documents par mois",
        "10 quiz par mois",
        "20 flashcards maximum",
        "Résumés basiques"
      ],
      cta: "Commencer gratuitement",
      popular: false
    },
    {
      name: "Premium",
      price: "4 USD",
      priceLocal: "2 600 FCFA/mois",
      currency: "",
      features: [
        "Documents illimités",
        "Quiz et flashcards illimités",
        "Transcription audio",
        "Planning dynamique",
        "Profil de compétences",
        "Mode hors ligne",
        "Support prioritaire"
      ],
      cta: "Essai gratuit 7 jours",
      popular: true
    },
    {
      name: "Premium Annuel",
      price: "40 USD",
      priceLocal: "26 000 FCFA/an",
      currency: "",
      badge: "Économisez 17%",
      features: [
        "Tous les avantages Premium",
        "2 mois offerts",
        "Accès anticipé aux nouvelles fonctionnalités",
        "Badge exclusif"
      ],
      cta: "Essai gratuit 7 jours",
      popular: false
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <nav className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="/exavy-logo.jpg" 
              alt="EXAVY Logo" 
              className="w-8 h-8 rounded-lg object-cover"
            />
            <span className="font-bold text-xl text-foreground">EXAVY</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Connexion</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 transition-opacity">
                Commencer
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/50 text-accent-foreground mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">7 jours d'essai Premium gratuit</span>
          </div>
          
          <h1 className="font-bold text-5xl md:text-7xl text-foreground mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            Transformez vos documents
            <span className="block bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mt-2">
              en outils d'apprentissage IA
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            EXAVY utilise l'intelligence artificielle pour créer automatiquement des quiz, flashcards et résumés personnalisés à partir de vos PDF, notes et enregistrements audio.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 transition-opacity shadow-lg">
                Essayer gratuitement
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              Voir la démo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="font-bold text-4xl md:text-5xl text-foreground mb-4">
              Fonctionnalités puissantes
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Des outils intelligents pour maximiser votre apprentissage et votre productivité
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl bg-card border border-border hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-xl text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="font-bold text-4xl md:text-5xl text-foreground mb-4">
              Choisissez votre plan
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Commencez gratuitement ou profitez de 7 jours d'essai Premium sans engagement
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative p-8 rounded-3xl bg-card border-2 transition-all duration-300 hover:scale-105 animate-in fade-in slide-in-from-bottom-4 ${
                  plan.popular 
                    ? 'border-primary shadow-xl' 
                    : 'border-border hover:border-primary/50'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground text-sm font-medium">
                    Le plus populaire
                  </div>
                )}
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground text-sm font-medium">
                    {plan.badge}
                  </div>
                )}
                
                <h3 className="font-bold text-2xl text-foreground mb-2">
                  {plan.name}
                </h3>
                <div className="mb-6">
                  <span className="font-bold text-4xl text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground ml-2">{plan.currency}</span>
                  {plan.priceLocal && (
                    <p className="text-sm text-muted-foreground mt-1">{plan.priceLocal}</p>
                  )}
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-foreground">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Link to="/auth" className="block">
                  <Button 
                    className={`w-full ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-primary to-primary/80 hover:opacity-90' 
                        : ''
                    }`}
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="font-bold text-4xl md:text-5xl mb-6">
            Prêt à transformer votre apprentissage ?
          </h2>
          <p className="text-lg mb-10 opacity-90">
            Rejoignez des milliers d'étudiants et professionnels qui apprennent plus efficacement avec EXAVY
          </p>
          <Link to="/auth">
            <Button size="lg" variant="secondary" className="shadow-lg">
              Commencer l'essai gratuit
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-background border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <img 
                src="/exavy-logo.jpg" 
                alt="EXAVY Logo" 
                className="w-8 h-8 rounded-lg object-cover"
              />
              <span className="font-bold text-xl text-foreground">EXAVY</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2024 EXAVY. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
