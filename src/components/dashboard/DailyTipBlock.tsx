import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, BookOpen, Bell, Target, Crown, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';

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

export const DailyTipBlock = () => {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const [tip, setTip] = useState<DailyTip | null>(null);
  const [loading, setLoading] = useState(false);

  const isPremium = subscription?.plan === 'monthly' || subscription?.plan === 'yearly';

  useEffect(() => {
    if (user && isPremium) {
      const lastShown = localStorage.getItem(`dailyTip_${user.id}`);
      const today = new Date().toDateString();
      if (lastShown !== today) {
        fetchDailyTip();
      } else {
        // Load cached tip
        const cached = localStorage.getItem(`dailyTipData_${user.id}`);
        if (cached) {
          try { setTip(JSON.parse(cached)); } catch {}
        }
      }
    }
  }, [user, isPremium]);

  const fetchDailyTip = async () => {
    if (!user || !isPremium) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-daily-tip', {
        body: { userId: user.id }
      });
      if (!error && data?.tip) {
        setTip(data.tip);
        localStorage.setItem(`dailyTip_${user.id}`, new Date().toDateString());
        localStorage.setItem(`dailyTipData_${user.id}`, JSON.stringify(data.tip));
      }
    } catch {}
    finally { setLoading(false); }
  };

  if (!isPremium) return null;

  const config = tip ? (typeConfig[tip.type] || typeConfig.conseil) : typeConfig.conseil;
  const Icon = config.icon;

  return (
    <div className="bento-card overflow-hidden">
      <div className="p-6 border-b-2 border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${tip ? config.color : 'bg-yellow-500'} flex items-center justify-center`}>
            {tip ? <Icon className="w-5 h-5 text-white" /> : <Lightbulb className="w-5 h-5 text-white" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold">{tip ? config.label : 'Conseil du jour'}</h3>
              <Badge variant="secondary" className="text-xs">
                <Crown className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchDailyTip} disabled={loading} className="h-8 w-8">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : tip ? (
          <div className="space-y-3">
            <h4 className="font-bold text-lg">{tip.emoji} {tip.title}</h4>
            <p className="text-foreground leading-relaxed">{tip.content}</p>
            {tip.source_document && (
              <p className="text-sm text-muted-foreground italic">📄 Source: {tip.source_document}</p>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <Lightbulb className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Ajoutez des documents pour recevoir des conseils personnalisés !</p>
          </div>
        )}
      </div>
      {/* Corner accents */}
      <div className="absolute top-0 right-0 w-6 h-6 bg-yellow-500" />
      <div className="absolute bottom-0 left-0 w-4 h-4 bg-primary" />
    </div>
  );
};
