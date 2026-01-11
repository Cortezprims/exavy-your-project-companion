import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Phone, CheckCircle2, AlertCircle } from "lucide-react";

interface CampayPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
  planName: string;
  amount: number;
  userId: string;
}

type PaymentStatus = 'idle' | 'pending' | 'checking' | 'success' | 'failed';

export function CampayPaymentDialog({
  open,
  onOpenChange,
  planId,
  planName,
  amount,
  userId,
}: CampayPaymentDialogProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [reference, setReference] = useState<string | null>(null);
  const [ussdCode, setUssdCode] = useState<string | null>(null);
  const { toast } = useToast();

  // Poll for payment status when we have a reference
  useEffect(() => {
    if (!reference || status !== 'pending') return;

    const interval = setInterval(async () => {
      setStatus('checking');
      try {
        const { data, error } = await supabase.functions.invoke('campay-payment', {
          body: { reference },
          headers: { 'Content-Type': 'application/json' },
        });

        // Parse action as query param workaround
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/campay-payment?action=status`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ reference }),
          }
        );

        const statusData = await response.json();

        if (statusData.status === 'SUCCESSFUL') {
          setStatus('success');
          toast({
            title: "Paiement réussi !",
            description: `Votre abonnement ${planName} est maintenant actif.`,
          });
        } else if (statusData.status === 'FAILED') {
          setStatus('failed');
          toast({
            variant: "destructive",
            title: "Paiement échoué",
            description: "Le paiement n'a pas pu être effectué.",
          });
        } else {
          setStatus('pending');
        }
      } catch (error) {
        console.error('Status check error:', error);
        setStatus('pending');
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [reference, status, planName, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber || phoneNumber.length < 9) {
      toast({
        variant: "destructive",
        title: "Numéro invalide",
        description: "Veuillez entrer un numéro de téléphone valide.",
      });
      return;
    }

    setStatus('pending');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/campay-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            amount,
            phoneNumber,
            planId,
            userId,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setReference(data.reference);
        setUssdCode(data.ussdCode);
        toast({
          title: "Demande envoyée",
          description: data.message,
        });
      } else {
        setStatus('failed');
        toast({
          variant: "destructive",
          title: "Erreur",
          description: data.error || "Une erreur est survenue.",
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
      setStatus('failed');
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'initier le paiement.",
      });
    }
  };

  const handleClose = () => {
    setStatus('idle');
    setReference(null);
    setUssdCode(null);
    setPhoneNumber("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Paiement Mobile Money</DialogTitle>
          <DialogDescription>
            Payez votre abonnement {planName} via Orange Money ou MTN Mobile Money
          </DialogDescription>
        </DialogHeader>

        {status === 'idle' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Numéro de téléphone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="6XXXXXXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Format: 6XXXXXXXX (Orange Money ou MTN MoMo)
              </p>
            </div>

            <div className="rounded-lg bg-muted p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Montant à payer</span>
                <span className="font-bold text-lg">{amount.toLocaleString()} FCFA</span>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={!phoneNumber}>
              Payer maintenant
            </Button>
          </form>
        )}

        {(status === 'pending' || status === 'checking') && (
          <div className="text-center py-6 space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <div>
              <p className="font-medium">En attente de confirmation...</p>
              <p className="text-sm text-muted-foreground mt-1">
                Veuillez confirmer le paiement sur votre téléphone
              </p>
            </div>
            {ussdCode && (
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">Code USSD</p>
                <p className="font-mono font-bold">{ussdCode}</p>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Référence: {reference}
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center py-6 space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-600">Paiement réussi !</p>
              <p className="text-sm text-muted-foreground mt-1">
                Votre abonnement {planName} est maintenant actif.
              </p>
            </div>
            <Button onClick={handleClose} className="w-full">
              Fermer
            </Button>
          </div>
        )}

        {status === 'failed' && (
          <div className="text-center py-6 space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <p className="font-medium text-destructive">Paiement échoué</p>
              <p className="text-sm text-muted-foreground mt-1">
                Le paiement n'a pas pu être effectué. Veuillez réessayer.
              </p>
            </div>
            <Button onClick={() => setStatus('idle')} variant="outline" className="w-full">
              Réessayer
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
