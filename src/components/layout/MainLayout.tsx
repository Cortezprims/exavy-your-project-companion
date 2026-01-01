import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  FileText, 
  Brain, 
  BookOpen, 
  BarChart3, 
  Settings, 
  Sparkles,
  MessageSquare,
  RefreshCw,
  Crown,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: "/dashboard", label: "Tableau de bord", icon: Home },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/quiz", label: "Quiz", icon: Brain },
  { href: "/flashcards", label: "Flashcards", icon: BookOpen },
  { href: "/summaries", label: "Résumés", icon: Sparkles },
  { href: "/rephrase", label: "Reformulation", icon: RefreshCw },
  { href: "/chat", label: "Chat IA", icon: MessageSquare },
  { href: "/skills", label: "Compétences", icon: BarChart3 },
];

const bottomItems = [
  { href: "/subscription", label: "Abonnement", icon: Crown },
  { href: "/profile", label: "Profil", icon: User },
  { href: "/settings", label: "Paramètres", icon: Settings },
];

export const MainLayout = ({ children }: MainLayoutProps) => {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground">EXAVY</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border space-y-1">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};
