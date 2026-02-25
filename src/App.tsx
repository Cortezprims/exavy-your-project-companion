import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { ThemeProvider } from "@/hooks/useTheme";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";
import Quiz from "./pages/Quiz";
import Flashcards from "./pages/Flashcards";
import ChatAI from "./pages/ChatAI";
import Summaries from "./pages/Summaries";
import MindMap from "./pages/MindMap";
import Rephrase from "./pages/Rephrase";
import Planning from "./pages/Planning";
import Skills from "./pages/Skills";
import Profile from "./pages/Profile";
import Subscription from "./pages/Subscription";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import MockExam from "./pages/MockExam";
import Exercises from "./pages/Exercises";
import Presentations from "./pages/Presentations";
import Projects from "./pages/Projects";
import Admin from "./pages/Admin";
import Help from "./pages/Help";
import Contact from "./pages/Contact";
import Install from "./pages/Install";
import Notifications from "./pages/Notifications";

const queryClient = new QueryClient();

const LoadingSpinner = () => (
  <div className="flex flex-col items-center gap-6">
    <div className="relative w-20 h-20">
      {/* Orbiting dots - Bauhaus primary colors */}
      <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-primary" />
      </div>
      <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s', animationDelay: '1s' }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-secondary" />
      </div>
      <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s', animationDelay: '2s' }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-accent" />
      </div>
      {/* Central book icon */}
      <div className="absolute inset-3 bg-card rounded-xl shadow-card flex items-center justify-center animate-pulse">
        <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      </div>
    </div>
    <div className="flex flex-col items-center gap-1">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-foreground">Chargement</p>
      <div className="flex gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0s' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-bounce" style={{ animationDelay: '0.15s' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0.3s' }} />
      </div>
    </div>
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { needsOnboarding, loading: profileLoading } = useProfile();

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner />
    </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

const OnboardingRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { needsOnboarding, loading: profileLoading } = useProfile();

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If onboarding already done, go to dashboard
  if (!needsOnboarding) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<PublicRoute><Index /></PublicRoute>} />
              <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
              <Route path="/onboarding" element={<OnboardingRoute><Onboarding /></OnboardingRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
              <Route path="/quiz" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
              <Route path="/quiz/:documentId" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
              <Route path="/flashcards" element={<ProtectedRoute><Flashcards /></ProtectedRoute>} />
              <Route path="/flashcards/:documentId" element={<ProtectedRoute><Flashcards /></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><ChatAI /></ProtectedRoute>} />
              <Route path="/summaries" element={<ProtectedRoute><Summaries /></ProtectedRoute>} />
              <Route path="/summaries/:documentId" element={<ProtectedRoute><Summaries /></ProtectedRoute>} />
              <Route path="/mindmap" element={<ProtectedRoute><MindMap /></ProtectedRoute>} />
              <Route path="/mindmap/:documentId" element={<ProtectedRoute><MindMap /></ProtectedRoute>} />
              <Route path="/rephrase" element={<ProtectedRoute><Rephrase /></ProtectedRoute>} />
              <Route path="/planning" element={<ProtectedRoute><Planning /></ProtectedRoute>} />
              <Route path="/skills" element={<ProtectedRoute><Skills /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/mock-exam" element={<ProtectedRoute><MockExam /></ProtectedRoute>} />
              <Route path="/mock-exam/:examId" element={<ProtectedRoute><MockExam /></ProtectedRoute>} />
              <Route path="/exercises" element={<ProtectedRoute><Exercises /></ProtectedRoute>} />
              <Route path="/presentations" element={<ProtectedRoute><Presentations /></ProtectedRoute>} />
              <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
              <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
              <Route path="/contact" element={<ProtectedRoute><Contact /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/install" element={<Install />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
