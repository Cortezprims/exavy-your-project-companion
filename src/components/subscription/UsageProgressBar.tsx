import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface UsageProgressBarProps {
  label: string;
  current: number;
  limit: number;
  className?: string;
}

export function UsageProgressBar({ label, current, limit, className }: UsageProgressBarProps) {
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : Math.min((current / limit) * 100, 100);
  const isNearLimit = !isUnlimited && percentage >= 80;
  const isAtLimit = !isUnlimited && percentage >= 100;

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn(
          "font-medium",
          isAtLimit && "text-destructive",
          isNearLimit && !isAtLimit && "text-yellow-600"
        )}>
          {isUnlimited ? (
            <span className="text-primary">Illimité</span>
          ) : (
            `${current}/${limit}`
          )}
        </span>
      </div>
      {!isUnlimited && (
        <Progress 
          value={percentage} 
          className={cn(
            "h-2",
            isAtLimit && "[&>div]:bg-destructive",
            isNearLimit && !isAtLimit && "[&>div]:bg-yellow-500"
          )}
        />
      )}
    </div>
  );
}
