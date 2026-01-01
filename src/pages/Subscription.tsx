import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Star } from "lucide-react";

const plans = [
  {
    id: "free",
    name: "Freemium",
    price: "Gratuit",
    period: "",
    description: "Pour commencer",
    features: [
      "3 documents/mois",
      "10 quiz/mois",
      "20 flashcards max",
      "Chat IA limité",
    ],
    limitations: [
      "Pas de planning dynamique",
      "Pas de transcription audio",
      "Pas de mode hors ligne",
    ],
    color: "bg-muted",
    popular: false,
  },
  {
    id: "monthly",
    name: "Premium Mensuel",
    price: "6 USD",
    priceLocal: "4 150 FCFA",
    period: "/mois",
    description: "Accès complet",
    features: [
      "Documents illimités",
      "Quiz et flashcards illimités",
      "Transcription audio",
      "Planning dynamique",
      "Profil de compétences",
      "Mode hors ligne complet",
      "Support prioritaire",
    ],
    limitations: [],
    color: "bg-primary",
    popular: true,
  },
  {
    id: "yearly",
    name: "Premium Annuel",
    price: "60 USD",
    priceLocal: "41 500 FCFA",
    period: "/an",
    description: "Économisez 17%",
    features: [
      "Tous les avantages Premium",
      "2 mois gratuits",
      "Accès anticipé aux nouvelles fonctionnalités",
    ],
    limitations: [],
    color: "bg-gradient-to-r from-primary to-primary/80",
    popular: false,
  },
];

const Subscription = () => {
  const currentPlan = 'free';

  return (
    <MainLayout>
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-2">Abonnement</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Choisissez le plan qui correspond à vos besoins d'apprentissage
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative overflow-hidden ${
                plan.popular ? "border-primary shadow-lg scale-105" : "border-border"
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 text-xs font-medium rounded-bl-lg">
                  <Star className="w-3 h-3 inline mr-1" />
                  Populaire
                </div>
              )}
              <CardHeader>
                <div className={`w-12 h-12 rounded-xl ${plan.color} flex items-center justify-center mb-4`}>
                  {plan.id === 'free' ? (
                    <Zap className="w-6 h-6 text-foreground" />
                  ) : (
                    <Crown className="w-6 h-6 text-primary-foreground" />
                  )}
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                  {plan.priceLocal && (
                    <p className="text-sm text-muted-foreground mt-1">{plan.priceLocal}</p>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {plan.limitations.map((limitation, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="w-4 h-4 mt-0.5 flex-shrink-0 text-center">✕</span>
                      <span>{limitation}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  disabled={
                    (plan.id === 'free' && currentPlan === 'free') ||
                    (plan.id !== 'free' && currentPlan === 'premium')
                  }
                >
                  {currentPlan === 'premium' && plan.id !== 'free'
                    ? "Plan actuel"
                    : plan.id === 'free' && currentPlan === 'free'
                    ? "Plan actuel"
                    : plan.id === 'free'
                    ? "Rétrograder"
                    : "Choisir ce plan"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 text-center text-sm text-muted-foreground">
          <p>7 jours d'essai gratuit Premium pour les nouveaux utilisateurs</p>
          <p className="mt-1">Annulation possible à tout moment</p>
        </div>
      </div>
    </MainLayout>
  );
};

export default Subscription;
