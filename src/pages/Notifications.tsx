import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Bell, Check, CheckCheck, Trash2, Loader2, Gift, PartyPopper, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'welcome': return PartyPopper;
    case 'trial': return Gift;
    default: return Info;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'welcome': return 'bg-primary';
    case 'trial': return 'bg-secondary';
    default: return 'bg-accent';
  }
};

const Notifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (!error) {
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', unreadIds);

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast({ title: 'Toutes les notifications ont été marquées comme lues' });
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <MainLayout>
      <div className="p-6 md:p-8 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="ml-16 md:ml-0">
            <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Centre de notifications
            </p>
            <h1 className="text-3xl md:text-4xl font-black">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-3 inline-flex items-center justify-center px-3 py-1 text-sm font-bold bg-secondary text-secondary-foreground">
                  {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </h1>
          </div>
          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              variant="outline"
              className="gap-2 border-2 border-foreground"
            >
              <CheckCheck className="w-4 h-4" />
              Tout marquer comme lu
            </Button>
          )}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bento-card p-12 text-center">
            <div className="w-20 h-20 bg-muted flex items-center justify-center mx-auto mb-4">
              <Bell className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-lg">Aucune notification</h3>
            <p className="text-muted-foreground mt-2">
              Vous n'avez pas encore de notifications.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              const colorClass = getNotificationColor(notification.type);

              return (
                <div
                  key={notification.id}
                  className={cn(
                    "bento-card p-5 flex items-start gap-4 transition-all duration-200 cursor-pointer hover:-translate-y-0.5",
                    !notification.is_read && "border-l-4 border-l-secondary bg-secondary/5"
                  )}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                >
                  <div className={cn("w-10 h-10 flex-shrink-0 flex items-center justify-center", colorClass)}>
                    <Icon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm">{notification.title}</h4>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-secondary rounded-full flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                    <p className="text-xs text-muted-foreground/60 mt-2 font-medium">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Notifications;
