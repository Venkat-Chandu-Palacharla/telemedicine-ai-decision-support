import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Pill, FileText, Loader2, Calendar, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PatientPrescriptionsProps {
  onBack: () => void;
}

interface Prescription {
  id: string;
  doctor_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string | null;
  instructions: string | null;
  is_active: boolean;
  prescribed_at: string;
  doctor_name?: string;
}

export default function PatientPrescriptions({ onBack }: PatientPrescriptionsProps) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    const fetchPrescriptions = async () => {
      const { data, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', user.id)
        .order('prescribed_at', { ascending: false });

      if (error) {
        console.error('Error fetching prescriptions:', error);
        toast({
          title: 'Error',
          description: 'Failed to load prescriptions.',
          variant: 'destructive'
        });
      } else {
        // Enrich with doctor names
        const enriched = await Promise.all(
          (data || []).map(async (presc) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', presc.doctor_id)
              .maybeSingle();
            
            return {
              ...presc,
              doctor_name: profile?.full_name || 'Doctor'
            };
          })
        );
        setPrescriptions(enriched);
      }

      setIsLoading(false);
    };

    fetchPrescriptions();

    // Realtime subscription
    const channel = supabase
      .channel('patient-prescriptions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prescriptions',
          filter: `patient_id=eq.${user.id}`
        },
        () => {
          fetchPrescriptions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  const activePrescriptions = prescriptions.filter(p => p.is_active);
  const pastPrescriptions = prescriptions.filter(p => !p.is_active);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button variant="ghost" onClick={onBack} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center">
          <Pill className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Prescriptions</h1>
          <p className="text-muted-foreground">View your medication history</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Active Prescriptions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="default">Active</Badge>
              Current Medications
            </CardTitle>
            <CardDescription>Medications you're currently taking</CardDescription>
          </CardHeader>
          <CardContent>
            {activePrescriptions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No active prescriptions
              </p>
            ) : (
              <div className="space-y-4">
                {activePrescriptions.map(presc => (
                  <div key={presc.id} className="p-4 rounded-lg border border-border bg-primary/5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mt-1">
                          <Pill className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{presc.medication_name}</h4>
                          <p className="text-sm text-muted-foreground">{presc.dosage}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              {presc.frequency}
                            </span>
                            {presc.duration && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                {presc.duration}
                              </span>
                            )}
                          </div>
                          {presc.instructions && (
                            <p className="mt-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                              <strong>Instructions:</strong> {presc.instructions}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{presc.doctor_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(presc.prescribed_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Past Prescriptions */}
        {pastPrescriptions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Prescription History
              </CardTitle>
              <CardDescription>Your past medications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pastPrescriptions.map(presc => (
                  <div key={presc.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                        <Pill className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{presc.medication_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {presc.dosage} - {presc.frequency}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">Completed</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(presc.prescribed_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
