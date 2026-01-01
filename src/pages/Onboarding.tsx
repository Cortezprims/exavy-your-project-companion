import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Briefcase, Sparkles, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";

type AccountType = "student" | "professional";

const Onboarding = () => {
  const [selectedType, setSelectedType] = useState<AccountType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const profileTypes = [
    {
      id: "student" as AccountType,
      title: "Académique",
      description: "Étudiant, enseignant ou chercheur",
      icon: GraduationCap,
      features: [
        "Quiz et flashcards intelligents",
        "Profil de compétences",
        "Suggestions d'orientation",
        "Planning de révision"
      ]
    },
    {
      id: "professional" as AccountType,
      title: "Professionnel",
      description: "Employé, entrepreneur ou indépendant",
      icon: Briefcase,
      features: [
        "Synthèse de réunions",
        "Rédaction d'emails",
        "Traduction multilingue",
        "Organisation documentaire"
      ]
    }
  ];

  const handleContinue = async () => {
    if (!selectedType) return;

    setIsLoading(true);
    
    // Simulate API call - will be connected to Supabase later
    await new Promise(resolve => setTimeout(resolve, 500));
    
    toast.success("Profil configuré avec succès !");
    navigate("/dashboard");
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Bienvenue sur EXAVY
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Choisissez votre profil pour personnaliser votre expérience
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {profileTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;
            
            return (
              <Card
                key={type.id}
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${
                  isSelected 
                    ? "border-primary bg-primary/5 shadow-lg" 
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => setSelectedType(type.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                      isSelected ? "bg-primary" : "bg-secondary"
                    }`}>
                      <Icon className={`w-7 h-7 ${isSelected ? "text-primary-foreground" : "text-foreground"}`} />
                    </div>
                    {isSelected && (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-5 h-5 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-xl mt-4">{type.title}</CardTitle>
                  <CardDescription className="text-base">{type.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {type.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3 text-sm text-muted-foreground">
                        <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-primary" : "bg-muted-foreground"}`} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-center">
          <Button
            size="lg"
            className="px-8"
            disabled={!selectedType || isLoading}
            onClick={handleContinue}
          >
            {isLoading ? "Configuration..." : "Continuer"}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Vous pourrez modifier ce choix à tout moment dans vos paramètres
        </p>
      </div>
    </div>
  );
};

export default Onboarding;
