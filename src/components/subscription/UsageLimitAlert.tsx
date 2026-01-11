import { AlertCircle, Crown } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface UsageLimitAlertProps {
  resourceName: string;
  current: number;
  limit: number;
}

export function UsageLimitAlert({ resourceName, current, limit }: UsageLimitAlertProps) {
  const navigate = useNavigate();

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Limite atteinte</AlertTitle>
      <AlertDescription className="flex flex-col gap-3">
        <span>
          Vous avez utilisé {current}/{limit} {resourceName} ce mois-ci.
          Passez à Premium pour un accès illimité.
        </span>
        <Button
          size="sm"
          onClick={() => navigate('/subscription')}
          className="w-fit"
        >
          <Crown className="mr-2 h-4 w-4" />
          Passer à Premium
        </Button>
      </AlertDescription>
    </Alert>
  );
}
