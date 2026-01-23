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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Phone, CheckCircle2, AlertCircle, Globe } from "lucide-react";

interface PawapayPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
  planName: string;
  amountUSD: number;
  userId: string;
}

type PaymentStatus = 'idle' | 'pending' | 'checking' | 'success' | 'failed';

interface Correspondent {
  correspondent: string;
  country: string;
  currency: string;
  operatorName: string;
}

// Common African mobile money providers
const DEFAULT_PROVIDERS: Correspondent[] = [
  { correspondent: 'MTN_MOMO_CMR', country: 'CMR', currency: 'XAF', operatorName: 'MTN Mobile Money Cameroun' },
  { correspondent: 'ORANGE_CMR', country: 'CMR', currency: 'XAF', operatorName: 'Orange Money Cameroun' },
  { correspondent: 'MTN_MOMO_CIV', country: 'CIV', currency: 'XOF', operatorName: 'MTN Mobile Money Côte d\'Ivoire' },
  { correspondent: 'ORANGE_CIV', country: 'CIV', currency: 'XOF', operatorName: 'Orange Money Côte d\'Ivoire' },
  { correspondent: 'MTN_MOMO_GHA', country: 'GHA', currency: 'GHS', operatorName: 'MTN Mobile Money Ghana' },
  { correspondent: 'AIRTEL_GHA', country: 'GHA', currency: 'GHS', operatorName: 'Airtel Money Ghana' },
  { correspondent: 'MTN_MOMO_UGA', country: 'UGA', currency: 'UGX', operatorName: 'MTN Mobile Money Uganda' },
  { correspondent: 'AIRTEL_UGA', country: 'UGA', currency: 'UGX', operatorName: 'Airtel Money Uganda' },
  { correspondent: 'MTN_MOMO_ZMB', country: 'ZMB', currency: 'ZMW', operatorName: 'MTN Mobile Money Zambia' },
  { correspondent: 'AIRTEL_ZMB', country: 'ZMB', currency: 'ZMW', operatorName: 'Airtel Money Zambia' },
];

export function PawapayPaymentDialog({
  open,
  onOpenChange,
  planId,
  planName,
  amountUSD,
  userId,
}: PawapayPaymentDialogProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [providers, setProviders] = useState<Correspondent[]>(DEFAULT_PROVIDERS);
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [depositId, setDepositId] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch available providers on mount
  useEffect(() => {
    if (open) {
      fetchProviders();
    }
  }, [open]);

  // Poll for payment status when we have a depositId
  useEffect(() => {
    if (!depositId || status !== 'pending') return;

    const interval = setInterval(async () => {
      setStatus('checking');
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pawapay-payment?action=status`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ depositId }),
          }
        );

        const statusData = await response.json();

        if (statusData.status === 'COMPLETED') {
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
            description: statusData.failureReason || "Le paiement n'a pas pu être effectué.",
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
  }, [depositId, status, planName, toast]);

  const fetchProviders = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pawapay-payment?action=providers`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );

      const data = await response.json();
      if (data.success && data.correspondents?.length > 0) {
        setProviders(data.correspondents);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
      // Keep default providers
    }
  };

  const getSelectedProviderInfo = () => {
    return providers.find(p => p.correspondent === selectedProvider);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber || phoneNumber.length < 9) {
      toast({
        variant: "destructive",
        title: "Numéro invalide",
        description: "Veuillez entrer un numéro de téléphone valide au format international.",
      });
      return;
    }

    if (!selectedProvider) {
      toast({
        variant: "destructive",
        title: "Opérateur requis",
        description: "Veuillez sélectionner votre opérateur mobile money.",
      });
      return;
    }

    setStatus('pending');

    const providerInfo = getSelectedProviderInfo();

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pawapay-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            amount: amountUSD,
            currency: providerInfo?.currency || 'USD',
            phoneNumber: phoneNumber.replace(/\s/g, ''),
            provider: selectedProvider,
            planId,
            userId,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setDepositId(data.depositId);
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
    setDepositId(null);
    setPhoneNumber("");
    setSelectedProvider("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Paiement PawaPay
          </DialogTitle>
          <DialogDescription>
            Payez votre abonnement {planName} via Mobile Money (MTN, Orange, Airtel...)
          </DialogDescription>
        </DialogHeader>

        {status === 'idle' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Opérateur Mobile Money</Label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez votre opérateur" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.correspondent} value={provider.correspondent}>
                      {provider.operatorName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Numéro de téléphone (format international)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="237XXXXXXXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Format : code pays + numéro (ex: 237612345678 pour le Cameroun)
              </p>
            </div>

            <div className="rounded-lg bg-muted p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Montant à payer</span>
                <div className="text-right">
                  <span className="font-bold text-lg">{amountUSD} USD</span>
                  {getSelectedProviderInfo()?.currency && getSelectedProviderInfo()?.currency !== 'USD' && (
                    <p className="text-xs text-muted-foreground">
                      Sera converti en {getSelectedProviderInfo()?.currency}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={!phoneNumber || !selectedProvider}>
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
                Veuillez entrer votre code PIN sur votre téléphone pour confirmer le paiement
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Référence: {depositId}
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
