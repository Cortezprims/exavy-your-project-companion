import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Lightbulb, BookOpen, Bell, Target, Lock, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';

interface DailyTip {
  type: 'conseil' | 'definition' | 'rappel' | 'point_cle';
  emoji: string;
  title: string;
  content: string;
  source_document?: string;
}

const typeConfig = {
  conseil: { label: 'Conseil du jour', icon: Lightbulb, color: 'bg-yellow-500' },
  definition: { label: 'Définition à retenir', icon: BookOpen, color: 'bg-blue-500' },
  rappel: { label: 'Rappel', icon: Bell, color: 'bg-orange-500' },
  point_cle: { label: 'Point clé', icon: Target, color: 'bg-green-500' },
};

export const DailyTipDialog = () => {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [tip, setTip] = useState<DailyTip | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasShownToday, setHasShownToday] = useState(false);

  const isPremium = subscription?.plan === 'monthly' || subscription?.plan === 'yearly';

  useEffect(() => {
    // Only show for premium users with documents
    if (user && !hasShownToday && isPremium) {
      // Check if we've already shown a tip today
      const lastShown = localStorage.getItem(`dailyTip_${user.id}`);
      const today = new Date().toDateString();
      
      if (lastShown !== today) {
        fetchDailyTip();
      }
    }
  }, [user, hasShownToday, isPremium]);

  const fetchDailyTip = async () => {
    if (!user || !isPremium) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-daily-tip', {
        body: { userId: user.id }
      });

      if (error) {
        // Silently ignore "no documents" or 404 errors — user just hasn't uploaded docs yet
        return;
      }

      if (data?.tip) {
        setTip(data.tip);
        setOpen(true);
        // Mark as shown today
        localStorage.setItem(`dailyTip_${user.id}`, new Date().toDateString());
        setHasShownToday(true);
      }
    } catch (err) {
      // Silently ignore - tip is non-critical
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  if (!tip) return null;

  const config = typeConfig[tip.type] || typeConfig.conseil;
  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Fermer</span>
        </button>

        <DialogHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.color} text-white`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <Badge variant="secondary" className="mb-1">
                <Crown className="w-3 h-3 mr-1" />
                Premium
              </Badge>
              <DialogTitle className="text-lg">{tip.emoji} {tip.title}</DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <p className="text-foreground leading-relaxed">
            {tip.content}
          </p>

          {tip.source_document && (
            <p className="text-sm text-muted-foreground italic">
              📄 Source: {tip.source_document}
            </p>
          )}

          <div className="flex justify-end pt-2">
            <Button onClick={handleClose}>
              Compris !
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
