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
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(fallbackPath);
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleBack}
      className={`gap-2 transition-all duration-200 hover:-translate-x-1 ${className}`}
      style={{ boxShadow: '3px 3px 0px hsl(var(--foreground))' }}
    >
      <ArrowLeft className="w-4 h-4" />
      {label || 'Retour'}
    </Button>
  );
};
