import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, FileText, Loader2, CheckCircle2, Pill } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PrescriptionManagerProps {
  onBack: () => void;
}

interface Prescription {
  id: string;
  patient_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string | null;
  instructions: string | null;
  is_active: boolean;
  prescribed_at: string;
  patient_name?: string;
}

interface Patient {
  id: string;
  full_name: string;
  email: string;
}

export default function PrescriptionManager({ onBack }: PrescriptionManagerProps) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    patient_id: '',
    medication_name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Fetch prescriptions written by this doctor
      const { data: prescData, error: prescError } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('doctor_id', user.id)
        .order('prescribed_at', { ascending: false });

      if (prescError) {
        console.error('Error fetching prescriptions:', prescError);
      } else {
        setPrescriptions(prescData || []);
      }

      // Fetch all patients (profiles with patient role)
      const { data: patientsData, error: patientsError } = await supabase
        .from('profiles')
        .select('id, full_name, email');

      if (patientsError) {
        console.error('Error fetching patients:', patientsError);
      } else {
        setPatients(patientsData || []);
      }

      setIsLoading(false);
    };

    fetchData();

    // Realtime subscription
    const channel = supabase
      .channel('prescriptions-doctor')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prescriptions',
          filter: `doctor_id=eq.${user.id}`
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleFormChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCreatePrescription = async () => {
    if (!user) return;

    if (!form.patient_id || !form.medication_name || !form.dosage || !form.frequency) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);

    const { error } = await supabase
      .from('prescriptions')
      .insert({
        doctor_id: user.id,
        patient_id: form.patient_id,
        medication_name: form.medication_name,
        dosage: form.dosage,
        frequency: form.frequency,
        duration: form.duration || null,
        instructions: form.instructions || null,
        is_active: true
      });

    if (error) {
      console.error('Error creating prescription:', error);
      toast({
        title: 'Error',
        description: 'Failed to create prescription.',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Prescription Created',
        description: 'The prescription has been saved successfully.'
      });
      setForm({
        patient_id: '',
        medication_name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: ''
      });
      setShowForm(false);
    }

    setIsSaving(false);
  };

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient?.full_name || patient?.email || 'Unknown Patient';
  };

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

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Prescription Manager</h1>
            <p className="text-muted-foreground">Create and manage patient prescriptions</p>
          </div>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="gradient-primary text-white border-0">
            <Plus className="w-4 h-4 mr-2" />
            New Prescription
          </Button>
        )}
      </div>

      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle>Create New Prescription</CardTitle>
            <CardDescription>Fill in the prescription details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patient">Patient *</Label>
                <Select value={form.patient_id} onValueChange={(v) => handleFormChange('patient_id', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map(patient => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.full_name || patient.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="medication">Medication Name *</Label>
                <Input
                  id="medication"
                  value={form.medication_name}
                  onChange={(e) => handleFormChange('medication_name', e.target.value)}
                  placeholder="e.g., Amoxicillin"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dosage">Dosage *</Label>
                <Input
                  id="dosage"
                  value={form.dosage}
                  onChange={(e) => handleFormChange('dosage', e.target.value)}
                  placeholder="e.g., 500mg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency *</Label>
                <Select value={form.frequency} onValueChange={(v) => handleFormChange('frequency', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once daily">Once daily</SelectItem>
                    <SelectItem value="twice daily">Twice daily</SelectItem>
                    <SelectItem value="three times daily">Three times daily</SelectItem>
                    <SelectItem value="four times daily">Four times daily</SelectItem>
                    <SelectItem value="every 4 hours">Every 4 hours</SelectItem>
                    <SelectItem value="every 6 hours">Every 6 hours</SelectItem>
                    <SelectItem value="every 8 hours">Every 8 hours</SelectItem>
                    <SelectItem value="as needed">As needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={form.duration}
                  onChange={(e) => handleFormChange('duration', e.target.value)}
                  placeholder="e.g., 7 days"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Special Instructions</Label>
              <Textarea
                id="instructions"
                value={form.instructions}
                onChange={(e) => handleFormChange('instructions', e.target.value)}
                placeholder="e.g., Take with food. Avoid alcohol."
                rows={3}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreatePrescription} 
                disabled={isSaving}
                className="gradient-primary text-white border-0"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Create Prescription
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Recent Prescriptions</CardTitle>
            <CardDescription>Prescriptions you've created</CardDescription>
          </CardHeader>
          <CardContent>
            {prescriptions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No prescriptions created yet
              </p>
            ) : (
              <div className="space-y-4">
                {prescriptions.map(presc => (
                  <div key={presc.id} className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{getPatientName(presc.patient_id)}</p>
                        <p className="text-sm text-muted-foreground">
                          {presc.medication_name} - {presc.dosage}, {presc.frequency}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={presc.is_active ? 'default' : 'secondary'}>
                        {presc.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        {new Date(presc.prescribed_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
