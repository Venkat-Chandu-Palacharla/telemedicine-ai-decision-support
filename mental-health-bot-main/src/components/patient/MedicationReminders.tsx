import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import {
  ArrowLeft,
  Plus,
  Pill,
  Clock,
  Bell,
  BellOff,
  Trash2,
  Check,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface MedicationRemindersProps {
  onBack: () => void;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: 'once' | 'twice' | 'three' | 'four';
  times: string[];
  startDate: string;
  endDate?: string;
  notes?: string;
  enabled: boolean;
  takenToday: string[];
}

// Zod schema for validating localStorage data
const MedicationSchema = z.object({
  id: z.string(),
  name: z.string(),
  dosage: z.string(),
  frequency: z.enum(['once', 'twice', 'three', 'four']),
  times: z.array(z.string()),
  startDate: z.string(),
  endDate: z.string().optional(),
  notes: z.string().optional(),
  enabled: z.boolean(),
  takenToday: z.array(z.string())
});

const MedicationsArraySchema = z.array(MedicationSchema);

const defaultMedications: Medication[] = [
  {
    id: '1',
    name: 'Lisinopril',
    dosage: '10mg',
    frequency: 'once',
    times: ['08:00'],
    startDate: '2024-01-01',
    enabled: true,
    takenToday: []
  },
  {
    id: '2',
    name: 'Metformin',
    dosage: '500mg',
    frequency: 'twice',
    times: ['08:00', '20:00'],
    startDate: '2024-01-01',
    enabled: true,
    takenToday: []
  }
];

const frequencyOptions = [
  { value: 'once', label: 'Once daily', times: 1 },
  { value: 'twice', label: 'Twice daily', times: 2 },
  { value: 'three', label: 'Three times daily', times: 3 },
  { value: 'four', label: 'Four times daily', times: 4 }
];

// Safe localStorage parsing with Zod validation
function loadMedicationsFromStorage(): Medication[] {
  try {
    const saved = localStorage.getItem('medicationReminders');
    if (saved) {
      const parsed = JSON.parse(saved);
      const validated = MedicationsArraySchema.parse(parsed);
      return validated as Medication[];
    }
  } catch (error) {
    console.error('Invalid medication data in localStorage, resetting to defaults:', error);
    localStorage.removeItem('medicationReminders');
  }
  return defaultMedications;
}

export default function MedicationReminders({ onBack }: MedicationRemindersProps) {
  const { toast } = useToast();
  const [medications, setMedications] = useState<Medication[]>(() => loadMedicationsFromStorage());

  const [showAddForm, setShowAddForm] = useState(false);
  const [newMed, setNewMed] = useState<{
    name: string;
    dosage: string;
    frequency: Medication['frequency'];
    times: string[];
    startDate: string;
    endDate: string;
    notes: string;
  }>({
    name: '',
    dosage: '',
    frequency: 'once',
    times: ['08:00'],
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    notes: ''
  });

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Save medications to localStorage
  useEffect(() => {
    localStorage.setItem('medicationReminders', JSON.stringify(medications));
  }, [medications]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, []);

  // Check for medication reminders
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      medications.forEach(med => {
        if (med.enabled && med.times.includes(currentTime) && !med.takenToday.includes(currentTime)) {
          if (notificationsEnabled && 'Notification' in window) {
            new Notification('Medication Reminder', {
              body: `Time to take ${med.name} (${med.dosage})`,
              icon: '/favicon.ico'
            });
          }
          toast({
            title: "Medication Reminder",
            description: `Time to take ${med.name} (${med.dosage})`,
          });
        }
      });
    };

    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, [medications, notificationsEnabled, toast]);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
      if (permission === 'granted') {
        toast({
          title: "Notifications enabled",
          description: "You'll receive alerts for your medication reminders"
        });
      }
    }
  };

  const handleFrequencyChange = (frequency: string) => {
    const freq = frequencyOptions.find(f => f.value === frequency);
    const times = Array(freq?.times || 1).fill('08:00');
    setNewMed({ ...newMed, frequency: frequency as Medication['frequency'], times });
  };

  const handleTimeChange = (index: number, time: string) => {
    const newTimes = [...newMed.times];
    newTimes[index] = time;
    setNewMed({ ...newMed, times: newTimes });
  };

  const addMedication = () => {
    if (!newMed.name || !newMed.dosage) {
      toast({
        title: "Missing information",
        description: "Please enter medication name and dosage",
        variant: "destructive"
      });
      return;
    }

    const medication: Medication = {
      id: Date.now().toString(),
      name: newMed.name,
      dosage: newMed.dosage,
      frequency: newMed.frequency,
      times: newMed.times,
      startDate: newMed.startDate,
      endDate: newMed.endDate || undefined,
      notes: newMed.notes || undefined,
      enabled: true,
      takenToday: []
    };

    setMedications([...medications, medication]);
    setNewMed({
      name: '',
      dosage: '',
      frequency: 'once',
      times: ['08:00'],
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      notes: ''
    });
    setShowAddForm(false);
    toast({
      title: "Medication added",
      description: `${medication.name} has been added to your reminders`
    });
  };

  const deleteMedication = (id: string) => {
    setMedications(medications.filter(m => m.id !== id));
    toast({
      title: "Medication removed",
      description: "The medication has been removed from your reminders"
    });
  };

  const toggleMedication = (id: string) => {
    setMedications(medications.map(m => 
      m.id === id ? { ...m, enabled: !m.enabled } : m
    ));
  };

  const markAsTaken = (medId: string, time: string) => {
    setMedications(medications.map(m => 
      m.id === medId 
        ? { ...m, takenToday: [...m.takenToday, time] }
        : m
    ));
    toast({
      title: "Medication taken",
      description: "Great job staying on track with your medication!"
    });
  };

  const getNextDose = (med: Medication) => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    for (const time of med.times.sort()) {
      const [hours, minutes] = time.split(':').map(Number);
      const timeMinutes = hours * 60 + minutes;
      if (timeMinutes > currentMinutes && !med.takenToday.includes(time)) {
        return time;
      }
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Medication Reminders
            </h1>
            <p className="text-muted-foreground">
              Manage your prescriptions and never miss a dose
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant={notificationsEnabled ? "outline" : "default"}
              size="sm"
              onClick={requestNotificationPermission}
              disabled={notificationsEnabled}
            >
              {notificationsEnabled ? (
                <>
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications On
                </>
              ) : (
                <>
                  <BellOff className="w-4 h-4 mr-2" />
                  Enable Notifications
                </>
              )}
            </Button>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Medication
            </Button>
          </div>
        </div>

        {/* Add Medication Form */}
        {showAddForm && (
          <Card className="mb-8 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-primary" />
                Add New Medication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Medication Name</Label>
                  <Input
                    placeholder="e.g., Lisinopril"
                    value={newMed.name}
                    onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dosage</Label>
                  <Input
                    placeholder="e.g., 10mg"
                    value={newMed.dosage}
                    onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={newMed.frequency} onValueChange={handleFrequencyChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {frequencyOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Reminder Times</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {newMed.times.map((time, index) => (
                    <Input
                      key={index}
                      type="time"
                      value={time}
                      onChange={(e) => handleTimeChange(index, e.target.value)}
                    />
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={newMed.startDate}
                    onChange={(e) => setNewMed({ ...newMed, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date (Optional)</Label>
                  <Input
                    type="date"
                    value={newMed.endDate}
                    onChange={(e) => setNewMed({ ...newMed, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Input
                  placeholder="e.g., Take with food"
                  value={newMed.notes}
                  onChange={(e) => setNewMed({ ...newMed, notes: e.target.value })}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button onClick={addMedication}>
                  Add Medication
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Today's Schedule */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Today's Schedule
            </CardTitle>
            <CardDescription>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {medications.filter(m => m.enabled).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Pill className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No medications scheduled</p>
              </div>
            ) : (
              <div className="space-y-3">
                {medications
                  .filter(m => m.enabled)
                  .flatMap(med => med.times.map(time => ({ med, time })))
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map(({ med, time }) => {
                    const isTaken = med.takenToday.includes(time);
                    const now = new Date();
                    const [hours, minutes] = time.split(':').map(Number);
                    const scheduleTime = new Date();
                    scheduleTime.setHours(hours, minutes, 0, 0);
                    const isPast = scheduleTime < now;
                    const isOverdue = isPast && !isTaken;

                    return (
                      <div
                        key={`${med.id}-${time}`}
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                          isTaken 
                            ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800' 
                            : isOverdue
                            ? 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800'
                            : 'bg-muted/30 border-border'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            isTaken ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'
                          }`}>
                            {isTaken ? <Check className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{med.name}</p>
                            <p className="text-sm text-muted-foreground">{med.dosage} • {time}</p>
                            {med.notes && (
                              <p className="text-xs text-muted-foreground mt-1">{med.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isOverdue && (
                            <Badge variant="destructive" className="gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Overdue
                            </Badge>
                          )}
                          {isTaken ? (
                            <Badge variant="outline" className="text-green-600 border-green-300">
                              Taken
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => markAsTaken(med.id, time)}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Mark Taken
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Medications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-primary" />
              All Medications
            </CardTitle>
            <CardDescription>
              Manage your medication list and schedules
            </CardDescription>
          </CardHeader>
          <CardContent>
            {medications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No medications added yet</p>
                <Button className="mt-4" onClick={() => setShowAddForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Medication
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {medications.map(med => {
                  const nextDose = getNextDose(med);
                  return (
                    <div
                      key={med.id}
                      className={`p-4 rounded-lg border ${
                        med.enabled ? 'border-border' : 'border-border/50 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            med.enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                          }`}>
                            <Pill className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground">{med.name}</p>
                              <Badge variant="secondary">{med.dosage}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {frequencyOptions.find(f => f.value === med.frequency)?.label}
                              {' • '}
                              {med.times.join(', ')}
                            </p>
                            {nextDose && med.enabled && (
                              <p className="text-sm text-primary mt-1">
                                Next dose at {nextDose}
                              </p>
                            )}
                            {med.notes && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Note: {med.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={med.enabled}
                            onCheckedChange={() => toggleMedication(med.id)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => deleteMedication(med.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
