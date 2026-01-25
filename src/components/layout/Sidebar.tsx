import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { cn } from "@/lib/utils";
import {
  Home,
  FileText,
  Brain,
  MessageSquare,
  Calendar,
  User,
  CreditCard,
  Settings,
  LogOut,
  Sparkles,
  BookOpen,
  PenTool,
  Languages,
  Target,
  Menu,
  X,
  ClipboardList,
  Presentation,
  FolderKanban,
  GraduationCap,
  Shield,
  HelpCircle
} from "lucide-react";
import { TicketNotification } from "@/components/admin/TicketNotification";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const menuItems = [
  { icon: Home, label: "Tableau de bord", path: "/dashboard" },
  { icon: FileText, label: "Documents", path: "/documents" },
  { icon: Brain, label: "Quiz", path: "/quiz" },
  { icon: BookOpen, label: "Flashcards", path: "/flashcards" },
  { icon: Sparkles, label: "Mind Maps", path: "/mindmap" },
  { icon: MessageSquare, label: "Chat IA", path: "/chat" },
  { icon: PenTool, label: "Résumés", path: "/summaries" },
  { icon: ClipboardList, label: "Exercices", path: "/exercises" },
  { icon: GraduationCap, label: "Examens blancs", path: "/mock-exam" },
  { icon: Presentation, label: "Présentations", path: "/presentations" },
  { icon: FolderKanban, label: "Projets", path: "/projects" },
  { icon: Languages, label: "Reformulation", path: "/rephrase" },
  { icon: Calendar, label: "Planning", path: "/planning" },
  { icon: Target, label: "Compétences", path: "/skills" },
];

const bottomMenuItems = [
  { icon: User, label: "Profil", path: "/profile" },
  { icon: CreditCard, label: "Abonnement", path: "/subscription" },
  { icon: HelpCircle, label: "Aide", path: "/help" },
  { icon: Settings, label: "Paramètres", path: "/settings" },
];

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const NavItem = ({ icon: Icon, label, path }: { icon: any; label: string; path: string }) => {
    const isActive = location.pathname === path;
    return (
      <button
        onClick={() => {
          navigate(path);
          setIsOpen(false);
        }}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-primary text-primary-foreground shadow-md"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <Icon className="w-5 h-5" />
        <span>{label}</span>
      </button>
    );
  };

  return (
    <>
      {/* Mobile toggle - bigger and more visible */}
      <Button
        variant="default"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden h-12 w-12 rounded-xl shadow-lg bg-primary hover:bg-primary/90"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-64 bg-card border-r border-border z-50 flex flex-col transition-transform duration-300",
          "md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/exavy-logo.jpg" 
                alt="EXAVY Logo" 
                className="w-10 h-10 rounded-xl object-cover"
              />
              <span className="font-bold text-xl text-foreground">EXAVY</span>
            </div>
            <TicketNotification />
          </div>
        </div>

        {/* Main navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <NavItem key={item.path} {...item} />
          ))}
        </nav>

        {/* Bottom navigation */}
        <div className="p-4 border-t border-border space-y-1">
          {isAdmin && (
            <NavItem icon={Shield} label="Administration" path="/admin" />
          )}
          {bottomMenuItems.map((item) => (
            <NavItem key={item.path} {...item} />
          ))}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
};
