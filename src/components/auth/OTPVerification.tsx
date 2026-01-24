import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2, Mail, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface OTPVerificationProps {
  email: string;
  onVerified: () => void;
  onCancel: () => void;
}

export const OTPVerification = ({ email, onVerified, onCancel }: OTPVerificationProps) => {
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast.error("Veuillez entrer le code complet");
      return;
    }

    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: { email, code: otp },
      });

      if (error || !data?.valid) {
        toast.error(data?.error || "Code invalide ou expiré");
        return;
      }

      toast.success("Email vérifié avec succès !");
      onVerified();
    } catch (error) {
      toast.error("Erreur lors de la vérification");
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const { error } = await supabase.functions.invoke("send-otp", {
        body: { email },
      });

      if (error) {
        toast.error("Erreur lors de l'envoi du code");
        return;
      }

      toast.success("Nouveau code envoyé !");
      setCountdown(60);
      setCanResend(false);
      setOtp("");
    } catch (error) {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Mail className="w-8 h-8 text-primary" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold">Vérification de l'email</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Un code à 6 chiffres a été envoyé à
        </p>
        <p className="text-sm font-medium text-primary">{email}</p>
      </div>

      <div className="flex justify-center">
        <InputOTP value={otp} onChange={setOtp} maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>

      <div className="space-y-2">
        <Button
          onClick={handleVerify}
          disabled={otp.length !== 6 || verifying}
          className="w-full"
        >
          {verifying ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Vérification...
            </>
          ) : (
            "Vérifier le code"
          )}
        </Button>

        <div className="flex items-center justify-center gap-2 text-sm">
          {canResend ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResend}
              disabled={resending}
            >
              {resending ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-1" />
              )}
              Renvoyer le code
            </Button>
          ) : (
            <span className="text-muted-foreground">
              Renvoyer dans {countdown}s
            </span>
          )}
        </div>

        <Button variant="link" onClick={onCancel} className="text-muted-foreground">
          Utiliser une autre adresse email
        </Button>
      </div>
    </div>
  );
};
