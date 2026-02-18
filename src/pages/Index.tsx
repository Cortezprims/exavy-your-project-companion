import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Sparkles, Brain, Zap, CheckCircle2, Download, Star, Quote } from "lucide-react";
import { Link } from "react-router-dom";
import exavyLogo from '@/assets/exavy-logo.jpg';
import student1 from '@/assets/student-1.jpg';
import student2 from '@/assets/student-2.jpg';
import student3 from '@/assets/student-3.jpg';
import student4 from '@/assets/student-4.jpg';
import student5 from '@/assets/student-5.jpg';

const Index = () => {
  const testimonials = [
    {
      name: "Kofi Mensah",
      role: "Étudiant en Droit, Université de Lomé",
      avatar: student1,
      rating: 5,
      text: "EXAVY a complètement transformé ma façon de réviser. En quelques minutes, je génère des fiches de révision et des quiz à partir de mes cours de droit. J'ai réussi mes partiels avec mention grâce à cette application !"
    },
    {
      name: "Aminata Diallo",
      role: "Lycéenne, Terminale S — Dakar",
      avatar: student2,
      rating: 5,
      text: "Avant EXAVY, je passais des heures à faire des résumés. Maintenant, je charge mon PDF et en 30 secondes j'ai un résumé clair et des flashcards prêtes. Mon bac de philo ? Validé ! Je recommande à tous mes camarades."
    },
    {
      name: "Chloé Nguessan",
      role: "Étudiante en Médecine, Université d'Abidjan",
      avatar: student3,
      rating: 5,
      text: "Les cours de médecine sont énormes et il est impossible de tout retenir. EXAVY m'a aidée à créer des mind maps et des quiz sur l'anatomie. C'est comme avoir un tuteur personnel disponible 24h/24. Indispensable !"
    },
    {
      name: "Serge Akouele",
      role: "Master en Informatique, UCAD",
      avatar: student4,
      rating: 5,
      text: "En tant qu'étudiant en master, j'ai beaucoup d'articles et de documentation à assimiler. EXAVY me permet de synthétiser rapidement des sources complexes et de générer des examens blancs. Ma productivité a doublé !"
    },
    {
      name: "Fatou Camara",
      role: "Étudiante en Marketing, IUA Abidjan",
      avatar: student5,
      rating: 5,
      text: "J'utilisais EXAVY pour préparer mes exposés et mes présentations. L'IA génère des slides professionnelles en quelques secondes. Mes professeurs me demandent toujours comment je fais des présentations aussi bien structurées !"
    }
  ];

  const features = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "IA Générative",
      description: "Génération automatique de quiz, flashcards et résumés à partir de vos documents",
      color: "bg-primary"
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: "Répétition Espacée",
      description: "Algorithme SRS pour optimiser votre mémorisation selon la courbe d'oubli",
      color: "bg-secondary"
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Multi-formats",
      description: "Importez PDF, audio, images et notes textuelles en toute simplicité",
      color: "bg-accent text-accent-foreground"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Planning Dynamique",
      description: "Créez des plans de révision intelligents adaptés à votre emploi du temps",
      color: "bg-foreground text-background"
    }
  ];

  const plans = [
    {
      name: "Freemium",
      price: "0 FCFA",
      priceUSD: "",
      currency: "",
      features: [
        "3 documents par mois",
        "10 quiz par mois",
        "20 flashcards maximum",
        "Résumés basiques"
      ],
      cta: "Commencer gratuitement",
      popular: false,
      accent: "border-foreground"
    },
    {
      name: "Premium",
      price: "2 600 FCFA",
      priceUSD: "≈ 4 USD/mois",
      currency: "/mois",
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
      popular: true,
      accent: "border-primary"
    },
    {
      name: "Premium Annuel",
      price: "26 000 FCFA",
      priceUSD: "≈ 40 USD/an",
      currency: "/an",
      badge: "Économisez 17%",
      features: [
        "Tous les avantages Premium",
        "2 mois offerts",
        "Accès anticipé aux nouvelles fonctionnalités",
        "Badge exclusif"
      ],
      cta: "Essai gratuit 7 jours",
      popular: false,
      accent: "border-accent"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Bauhaus Style */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-foreground text-background">
        <nav className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={exavyLogo} alt="EXAVY" className="w-8 h-8 rounded-md object-cover" />
            <span className="font-black text-xl tracking-tight">EXAVY</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="text-background hover:text-background hover:bg-background/10">
                Connexion
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 border-0">
                Commencer
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </nav>
        {/* Geometric color bar */}
        <div className="flex h-1">
          <div className="flex-1 bg-primary" />
          <div className="flex-1 bg-secondary" />
          <div className="flex-1 bg-accent" />
        </div>
      </header>

      {/* Hero Section - Bauhaus Grid */}
      <section className="pt-24 pb-20 px-6 relative overflow-hidden">
        {/* Background geometric elements */}
        <div className="absolute top-20 right-10 w-32 h-32 bg-primary opacity-10" />
        <div className="absolute bottom-20 left-10 w-24 h-24 bg-secondary opacity-10" />
        <div className="absolute top-40 left-1/4 w-16 h-16 bg-accent opacity-20" />
        
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground font-bold text-sm uppercase tracking-wider mb-8">
                <Sparkles className="w-4 h-4" />
                7 jours d'essai gratuit
              </div>
              
              <h1 className="text-4xl md:text-6xl leading-none mb-6">
                Transformez vos documents en{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">outils IA</span>
                  <span className="absolute bottom-0 left-0 w-full h-3 bg-accent -z-0" />
                </span>
              </h1>
              
              <p className="text-lg text-muted-foreground mb-10 max-w-lg">
                EXAVY utilise l'intelligence artificielle pour créer automatiquement des quiz, flashcards et résumés personnalisés.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/auth">
                  <Button size="lg" className="btn-bauhaus bg-primary text-primary-foreground border-primary">
                    Essayer gratuitement
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/install">
                  <Button size="lg" variant="outline" className="btn-bauhaus">
                    <Download className="mr-2 w-5 h-5" />
                    Installer l'app
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Geometric illustration */}
            <div className="relative h-80 md:h-96 hidden md:block animate-scale-in">
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-secondary" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-accent" />
              <div className="absolute bottom-10 right-10 w-24 h-24 bg-foreground" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Bento Grid */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
              Fonctionnalités
            </p>
            <h2 className="text-3xl md:text-5xl">
              Des outils puissants
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`bento-card p-8 animate-slide-up stagger-${index + 1}`}
              >
                <div className={`w-14 h-14 ${feature.color} flex items-center justify-center text-primary-foreground mb-6`}>
                  {feature.icon}
                </div>
                <h3 className="font-bold text-xl mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
                {/* Corner accent */}
                <div className={`absolute bottom-0 right-0 w-4 h-4 ${feature.color}`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
              Tarifs
            </p>
            <h2 className="text-3xl md:text-5xl">
              Choisissez votre plan
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`bento-card border-4 ${plan.accent} animate-slide-up stagger-${index + 1}`}
              >
                {plan.popular && (
                  <div className="bg-primary text-primary-foreground px-4 py-2 font-bold text-sm uppercase tracking-wider text-center">
                    Le plus populaire
                  </div>
                )}
                {plan.badge && (
                  <div className="bg-secondary text-secondary-foreground px-4 py-2 font-bold text-sm uppercase tracking-wider text-center">
                    {plan.badge}
                  </div>
                )}
                
                <div className="p-8">
                  <h3 className="font-bold text-2xl mb-4">
                    {plan.name}
                  </h3>
                  <div className="mb-6">
                    <span className="font-black text-5xl">
                      {plan.price}
                    </span>
                    {plan.priceUSD && (
                      <p className="text-sm text-muted-foreground mt-1">{plan.priceUSD}</p>
                    )}
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-primary flex items-center justify-center mt-0.5">
                          <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link to="/auth" className="block">
                    <Button 
                      className={`w-full ${plan.popular ? '' : 'btn-bauhaus'}`}
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
              Témoignages
            </p>
            <h2 className="text-3xl md:text-5xl mb-4">
              Ils nous font confiance
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Des milliers d'étudiants africains boostent leurs résultats avec EXAVY
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.slice(0, 3).map((t, index) => (
              <div key={index} className={`bento-card p-6 flex flex-col gap-4 animate-slide-up stagger-${index + 1}`}>
                {/* Quote icon */}
                <div className="w-8 h-8 bg-primary flex items-center justify-center flex-shrink-0">
                  <Quote className="w-4 h-4 text-primary-foreground" />
                </div>
                {/* Stars */}
                <div className="flex gap-1">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                  ))}
                </div>
                {/* Text */}
                <p className="text-muted-foreground text-sm leading-relaxed flex-1">
                  "{t.text}"
                </p>
                {/* Author */}
                <div className="flex items-center gap-3 pt-2 border-t border-border">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
                  />
                  <div>
                    <p className="font-bold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom row — 2 cards centered */}
          <div className="grid md:grid-cols-2 gap-6 mt-6 max-w-3xl mx-auto">
            {testimonials.slice(3).map((t, index) => (
              <div key={index} className={`bento-card p-6 flex flex-col gap-4 animate-slide-up stagger-${index + 4}`}>
                <div className="w-8 h-8 bg-secondary flex items-center justify-center flex-shrink-0">
                  <Quote className="w-4 h-4 text-secondary-foreground" />
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed flex-1">
                  "{t.text}"
                </p>
                <div className="flex items-center gap-3 pt-2 border-t border-border">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-secondary/20"
                  />
                  <div>
                    <p className="font-bold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Global rating badge */}
          <div className="mt-12 flex justify-center">
            <div className="inline-flex items-center gap-4 bg-card border-2 border-accent px-8 py-4">
              <div className="flex gap-1">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                ))}
              </div>
              <div>
                <p className="font-black text-2xl">4.9 / 5</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Note moyenne · +2 000 avis</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-foreground text-background relative overflow-hidden">
        {/* Geometric accents */}
        <div className="absolute top-0 left-0 w-20 h-20 bg-primary" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-secondary" />
        <div className="absolute top-1/2 right-10 w-16 h-16 bg-accent" />
        
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <h2 className="text-3xl md:text-5xl mb-6">
            Prêt à transformer votre apprentissage ?
          </h2>
          <p className="text-lg mb-10 opacity-80">
            Rejoignez des milliers d'étudiants et professionnels qui apprennent plus efficacement avec EXAVY
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 border-0">
              Commencer l'essai gratuit
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-background border-t-4 border-foreground">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <img src={exavyLogo} alt="EXAVY" className="w-8 h-8 rounded-md object-cover" />
              <span className="font-black text-xl tracking-tight">EXAVY</span>
            </div>
            <div className="flex items-center gap-6">
              <Link to="/install" className="text-sm font-medium hover:text-primary transition-colors">
                Installer l'app
              </Link>
              <Link to="/help" className="text-sm font-medium hover:text-primary transition-colors">
                Aide
              </Link>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2025 EXAVY. Tous droits réservés.
            </p>
          </div>
        </div>
        {/* Bottom color bar */}
        <div className="flex h-2 mt-8">
          <div className="flex-1 bg-primary" />
          <div className="flex-1 bg-secondary" />
          <div className="flex-1 bg-accent" />
        </div>
      </footer>
    </div>
  );
};

export default Index;
