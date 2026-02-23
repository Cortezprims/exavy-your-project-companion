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
  <div className="flex flex-col items-center gap-4">
    <div className="relative w-16 h-16">
      {/* Outer spinning square */}
      <div className="absolute inset-0 border-4 border-primary/30 animate-spin" style={{ animationDuration: '2s' }} />
      {/* Inner pulsing circle */}
      <div className="absolute inset-2 bg-primary/20 rounded-full animate-pulse flex items-center justify-center">
        <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </div>
    </div>
    <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground animate-pulse">Chargement...</p>
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
