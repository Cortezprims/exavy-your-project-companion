import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface DocumentProcessingProgressProps {
  status: string;
  progress?: number; // 0-100
}

const getProgressValue = (status: string, progress?: number): number => {
  if (progress !== undefined) return progress;
  
  switch (status) {
    case 'pending':
      return 0;
    case 'processing':
      return 50;
    case 'completed':
      return 100;
    case 'error':
      return 100;
    default:
      return 0;
  }
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'En attente';
    case 'processing':
      return 'Extraction en cours...';
    case 'completed':
      return 'Traitement terminé';
    case 'error':
      return 'Erreur de traitement';
    default:
      return 'En attente';
  }
};

export const DocumentProcessingProgress = ({ status, progress }: DocumentProcessingProgressProps) => {
  const progressValue = getProgressValue(status, progress);
  const isProcessing = status === 'processing';
  const isCompleted = status === 'completed';
  const isError = status === 'error';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          {isProcessing && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
          {isCompleted && <CheckCircle2 className="w-3 h-3 text-green-500" />}
          {isError && <AlertCircle className="w-3 h-3 text-destructive" />}
          <span className="text-muted-foreground">{getStatusLabel(status)}</span>
        </div>
        <span className="text-muted-foreground font-medium">{progressValue}%</span>
      </div>
      <Progress 
        value={progressValue} 
        className={`h-1.5 ${isError ? '[&>div]:bg-destructive' : isCompleted ? '[&>div]:bg-green-500' : ''}`}
      />
    </div>
  );
};
