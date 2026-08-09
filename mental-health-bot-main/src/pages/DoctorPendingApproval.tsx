import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Clock, CheckCircle, XCircle, Stethoscope, LogOut, LogIn, Loader2 } from 'lucide-react';

interface DoctorProfileStatus {
  approval_status: string | null;
  specialty: string | null;
  rejection_reason: string | null;
}

export default function DoctorPendingApproval() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<DoctorProfileStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const previousStatus = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchStatus = async () => {
      const { data } = await supabase
        .from('doctor_profiles')
        .select('approval_status, specialty, rejection_reason')
        .eq('id', user.id)
        .maybeSingle();

      if (!data) {
        // Not a doctor at all → bounce
        navigate('/');
        return;
      }

      previousStatus.current = data.approval_status;
      setProfile(data);
      setLoading(false);
    };

    fetchStatus();

    const channel = supabase
      .channel(`doctor-pending-${user.id}`)
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

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const status = profile.approval_status || 'pending';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />

      <Card className="w-full max-w-md relative shadow-elevated border-border/50">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Doctor Application</CardTitle>
          <CardDescription>Specialty: {profile.specialty || 'Not specified'}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {status === 'pending' && (
            <div className="text-center space-y-4">
              <Badge variant="secondary" className="mx-auto">
                <Clock className="w-3 h-3 mr-1" />
                Pending Review
              </Badge>
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <p className="text-sm text-foreground">
                  Your application is being reviewed by our admin team. You'll be notified
                  here in real time as soon as it's approved — no need to refresh the page.
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                This usually takes 1–2 business days.
              </p>
            </div>
          )}

          {status === 'approved' && (
            <div className="text-center space-y-4">
              <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 mx-auto">
                <CheckCircle className="w-3 h-3 mr-1" />
                Approved
              </Badge>
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                <p className="text-sm text-foreground">
                  🎉 You're approved! Sign in again to unlock your doctor portal.
                </p>
              </div>
              <Button
                className="w-full gradient-primary text-white border-0"
                onClick={handleSignOut}
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign in as Doctor
              </Button>
            </div>
          )}

          {status === 'rejected' && (
            <div className="text-center space-y-4">
              <Badge variant="destructive" className="mx-auto">
                <XCircle className="w-3 h-3 mr-1" />
                Rejected
              </Badge>
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-left">
                <p className="text-sm font-medium text-foreground mb-1">
                  Your application was not approved.
                </p>
                {profile.rejection_reason && (
                  <p className="text-sm text-muted-foreground">
                    Reason: {profile.rejection_reason}
                  </p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Please contact support if you believe this is a mistake.
              </p>
            </div>
          )}

          {status !== 'approved' && (
            <Button variant="outline" className="w-full" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
