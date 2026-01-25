import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { BackButton } from "./BackButton";

interface MainLayoutProps {
  children: ReactNode;
  showBackButton?: boolean;
}

export const MainLayout = ({ children, showBackButton = true }: MainLayoutProps) => {
  const location = useLocation();
  
  // Don't show back button on dashboard (home page)
  const isHomePage = location.pathname === '/dashboard';
  const shouldShowBackButton = showBackButton && !isHomePage;
  
  return (
    <div className="min-h-screen bg-background grid-bauhaus">
      <Sidebar />
      <main className="md:ml-64 min-h-screen relative">
        {shouldShowBackButton && (
          <div className="fixed top-4 left-20 md:left-[17rem] z-40">
            <BackButton className="bg-background border-2 border-foreground font-bold uppercase text-xs tracking-wider" />
          </div>
        )}
        {children}
      </main>
    </div>
  );
};
