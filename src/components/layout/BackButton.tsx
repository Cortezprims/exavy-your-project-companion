import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BackButtonProps {
  fallbackPath?: string;
  label?: string;
  className?: string;
}

export const BackButton = ({ fallbackPath = '/dashboard', label, className = '' }: BackButtonProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    // Check if there's history to go back to
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      // If no history, go to fallback path
      navigate(fallbackPath);
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleBack}
      className={`gap-2 ${className}`}
    >
      <ArrowLeft className="w-4 h-4" />
      {label || 'Retour'}
    </Button>
  );
};
