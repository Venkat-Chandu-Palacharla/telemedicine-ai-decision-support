import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  Bell,
  BellOff,
  Calendar,
  Clock,
  User,
  Check,
  X,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'appointment' | 'availability' | 'reminder' | 'system';
  read: boolean;
  created_at: string;
}

interface DoctorAvailability {
  id: string;
  doctor_id: string;
  doctor_name: string;
  specialty: string;
  is_available: boolean;
  next_available_slot: string | null;
  updated_at: string;
}

export default function NotificationCenter({ userId }: { userId: string }) {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [doctorAvailability, setDoctorAvailability] = useState<DoctorAvailability[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch notifications
      const { data: notifData, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (notifError) {
        console.error('Error fetching notifications:', notifError);
      } else if (notifData) {
        setNotifications(notifData as Notification[]);
      }

      // Fetch doctor availability
      const { data: availData, error: availError } = await supabase
        .from('doctor_availability')
        .select('*')
        .order('doctor_name');

      if (availError) {
        console.error('Error fetching availability:', availError);
      } else {
        setDoctorAvailability(availData || []);
      }

      setLoading(false);
    };

    fetchData();
  }, [userId]);

  // Set up realtime subscriptions
  useEffect(() => {
    // Subscribe to notifications
    const notificationChannel = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('New notification received:', payload);
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          
          // Show toast for new notification
          toast({
            title: newNotification.title,
            description: newNotification.message,
          });
        }
      )
      .subscribe();

    // Subscribe to doctor availability changes
    const availabilityChannel = supabase
      .channel('availability-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'doctor_availability'
        },
        (payload) => {
          console.log('Availability update:', payload);
          
          if (payload.eventType === 'UPDATE') {
            const updated = payload.new as DoctorAvailability;
            setDoctorAvailability(prev => 
              prev.map(d => d.id === updated.id ? updated : d)
            );
            
            // Show toast for availability change
            if (updated.is_available) {
              toast({
                title: "Doctor Available",
                description: `${updated.doctor_name} is now available for appointments`,
              });
            }
          } else if (payload.eventType === 'INSERT') {
            setDoctorAvailability(prev => [...prev, payload.new as DoctorAvailability]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationChannel);
      supabase.removeChannel(availabilityChannel);
    };
  }, [userId, toast]);

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (!error) {
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', unreadIds);

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'availability':
        return <User className="w-4 h-4 text-green-500" />;
      case 'reminder':
        return <Clock className="w-4 h-4 text-amber-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const formatSlot = (timestamp: string | null) => {
    if (!timestamp) return 'Not scheduled';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </SheetTitle>
          <SheetDescription>
            Stay updated with appointments and doctor availability
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Doctor Availability Section */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Doctor Availability
            </h3>
            <div className="space-y-2">
              {doctorAvailability.map(doctor => (
                <div
                  key={doctor.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
                >
                  <div>
                    <p className="font-medium text-sm text-foreground">{doctor.doctor_name}</p>
                    <p className="text-xs text-muted-foreground">{doctor.specialty}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={doctor.is_available ? "default" : "secondary"} className="gap-1">
                      {doctor.is_available ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          Available
                        </>
                      ) : (
                        <>
                          <X className="w-3 h-3" />
                          Busy
                        </>
                      )}
                    </Badge>
                    {doctor.next_available_slot && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Next: {formatSlot(doctor.next_available_slot)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notifications Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Recent Notifications
              </h3>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  Mark all read
                </Button>
              )}
            </div>
            
            <ScrollArea className="h-[300px]">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BellOff className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                        notification.read 
                          ? 'bg-background border-border' 
                          : 'bg-primary/5 border-primary/20'
                      }`}
                      onClick={() => !notification.read && markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-sm text-foreground truncate">
                              {notification.title}
                            </p>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatTime(notification.created_at)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}