import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft, Home } from "lucide-react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-background flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Sparkles className="w-10 h-10 text-primary-foreground" />
          </div>
        </div>

        <h1 className="font-bold text-8xl text-foreground mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          404
        </h1>

        <h2 className="font-bold text-3xl text-foreground mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          Page introuvable
        </h2>

        <p className="text-lg text-muted-foreground mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          Oups ! La page que vous recherchez n'existe pas ou a été déplacée.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
          <Link to="/">
            <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80 hover:opacity-90">
              <Home className="mr-2 w-5 h-5" />
              Retour à l'accueil
            </Button>
          </Link>
          <Button size="lg" variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 w-5 h-5" />
            Page précédente
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
