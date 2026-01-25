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
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="md:ml-64 min-h-screen">
        {shouldShowBackButton && (
          <div className="fixed top-4 left-20 md:left-[17rem] z-40">
            <BackButton className="bg-background/80 backdrop-blur-sm shadow-sm border" />
          </div>
        )}
        {children}
      </main>
    </div>
  );
};
