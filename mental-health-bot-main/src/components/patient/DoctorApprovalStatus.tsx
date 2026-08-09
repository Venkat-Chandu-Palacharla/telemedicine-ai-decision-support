import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, XCircle, Stethoscope, LogIn } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface DoctorProfileStatus {
  approval_status: string | null;
  specialty: string | null;
  rejection_reason: string | null;
}

export default function DoctorApprovalStatus() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<DoctorProfileStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const previousStatus = useRef<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchStatus = async () => {
      const { data } = await supabase
        .from('doctor_profiles')
        .select('approval_status, specialty, rejection_reason')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        // Detect approval transition
        if (
          previousStatus.current &&
          previousStatus.current !== 'approved' &&
          data.approval_status === 'approved'
        ) {
          toast({
            title: '🎉 You have been approved!',
            description: 'Please sign in again to access your doctor portal.',
          });
          // Auto sign-out after a short delay so the user can read the toast
          setTimeout(async () => {
            await signOut();
            navigate('/auth');
          }, 2500);
        }
        previousStatus.current = data.approval_status;
        setProfile(data);
      }
      setLoading(false);
    };

    fetchStatus();

    // Realtime subscription
    const channel = supabase
      .channel(`doctor-status-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'doctor_profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const newRow = payload.new as DoctorProfileStatus;
          if (
            previousStatus.current &&
            previousStatus.current !== 'approved' &&
            newRow.approval_status === 'approved'
          ) {
            toast({
              title: '🎉 You have been approved!',
              description: 'Please sign in again to access your doctor portal.',
            });
            setTimeout(async () => {
              await signOut();
              navigate('/auth');
            }, 2500);
          }
          previousStatus.current = newRow.approval_status;
          setProfile(newRow);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate, signOut, toast]);

  if (loading || !profile) return null;

  const status = profile.approval_status || 'pending';

  const statusConfig = {
    pending: {
      icon: Clock,
      label: 'Pending Review',
      badge: <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>,
      message: 'Your doctor application is awaiting admin review.',
      cardClass: 'bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/30',
      iconClass: 'text-yellow-600',
    },
    approved: {
      icon: CheckCircle,
      label: 'Approved',
      badge: <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>,
      message: 'You have been approved! Sign in again to access the doctor portal.',
      cardClass: 'bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/30',
      iconClass: 'text-green-600',
    },
    rejected: {
      icon: XCircle,
      label: 'Rejected',
      badge: <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>,
      message: profile.rejection_reason
        ? `Reason: ${profile.rejection_reason}`
        : 'Your application was not approved. Please contact support.',
      cardClass: 'bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/30',
      iconClass: 'text-red-600',
    },
  }[status] || null;

  if (!statusConfig) return null;
  const Icon = statusConfig.icon;

  return (
    <Card className={statusConfig.cardClass}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-background/60 flex items-center justify-center shrink-0">
            <Stethoscope className={`w-5 h-5 ${statusConfig.iconClass}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="text-sm font-semibold text-foreground">Doctor Application</p>
              {statusConfig.badge}
            </div>
            <p className="text-xs text-muted-foreground mb-1">
              Specialty: {profile.specialty || 'Not specified'}
            </p>
            <p className="text-sm text-foreground">{statusConfig.message}</p>
            {status === 'approved' && (
              <Button
                size="sm"
                className="mt-3 gradient-primary text-white border-0"
                onClick={async () => {
                  await signOut();
                  navigate('/auth');
                }}
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign in as Doctor
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
