import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/hooks/useAdmin';
import { toast } from 'sonner';
import { Bell, X, MessageSquare, Clock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface NewTicket {
  id: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  status: string;
}

export const TicketNotification = () => {
  const { isAdmin } = useAdmin();
  const [notifications, setNotifications] = useState<NewTicket[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;

    // Fetch initial open tickets
    const fetchOpenTickets = async () => {
      const { data } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) {
        setNotifications(data);
        setUnreadCount(data.length);
      }
    };

    fetchOpenTickets();

    // Subscribe to new tickets in real-time
    const channel = supabase
      .channel('admin-ticket-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_tickets',
        },
        (payload) => {
          const newTicket = payload.new as NewTicket;
          
          // Add to notifications
          setNotifications(prev => [newTicket, ...prev.slice(0, 9)]);
          setUnreadCount(prev => prev + 1);

          // Show toast notification
          toast.success(
            <div className="flex flex-col gap-1">
              <span className="font-semibold">Nouveau ticket de support</span>
              <span className="text-sm text-muted-foreground">{newTicket.subject}</span>
              <span className="text-xs text-muted-foreground">De: {newTicket.email}</span>
            </div>,
            {
              duration: 10000,
              icon: <MessageSquare className="w-5 h-5 text-primary" />,
            }
          );

          // Play notification sound
          try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleAIAdJTa7caDJgALi8T07JFjAABso+z+pG8VAFSJ4/qQYxEAQoXl/55yGQA9i+7/m2kYADqH6vqcZRcAOoHn+phlFQA4fOX4lmQUADV86PmYYxQANnfk95VhEwAyc+H2k18TAC9v4PWRXRIALGrb8o1aEQApZ9nxiVcPACVk2e+GVA4AIWDa7oJQDQAdXNvtf0wLABpY2ux8SAoAF1TY6nhFCAAUUNfod0MHABFMzuRxPwYADkvO43A9BQALLM/jbTsEAAgnzeFsOQMACCXL4Ws3AwAIJsrgazUCAAckx95pMwEABiTG3WgxAQAFIsXcZy8BAAQhxNtlLQAABCDD2mQrAAADH8LZYykAAAIfwthiJwAAAh7B12AnAAACHsDWXyUAAAEdv9VeIwAAAR2+1F0hAAABHb3TXB8AAAEdvNJbHQAAAR270VoaAAAAHLrQWRgAAAAcudBYFgAAABy5z1cUAAAAHLjOVhIAAAAcuM5VEAAAABy3zVQOAAAAHLfNUwwAAAAct8xTCgAAABu2y1IJAAAAGrXLUQcAAAAatcpQBQAAABq0yU8DAAAAGrTJTwIAAAAatMlPAAAAABq0yU8AAAAAGbPITgAAAAA=');
            audio.volume = 0.5;
            audio.play().catch(() => {});
          } catch (e) {
            // Ignore audio errors
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'support_tickets',
        },
        (payload) => {
          const updatedTicket = payload.new as NewTicket;
          
          // If ticket is resolved, remove from notifications
          if (updatedTicket.status !== 'open') {
            setNotifications(prev => prev.filter(t => t.id !== updatedTicket.id));
            setUnreadCount(prev => Math.max(0, prev - 1));
          } else {
            // Update the notification
            setNotifications(prev => 
              prev.map(t => t.id === updatedTicket.id ? updatedTicket : t)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(t => t.id !== id));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  if (!isAdmin) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </h4>
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAll}>
              Tout effacer
            </Button>
          )}
        </div>
        
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((ticket) => (
                <Card key={ticket.id} className="border-0 rounded-none">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-sm truncate">{ticket.subject}</p>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 flex-shrink-0"
                            onClick={() => clearNotification(ticket.id)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">{ticket.email}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {format(new Date(ticket.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {ticket.message}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
          <div className="p-2 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => {
                setOpen(false);
                window.location.href = '/admin';
              }}
            >
              Voir tous les tickets
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
