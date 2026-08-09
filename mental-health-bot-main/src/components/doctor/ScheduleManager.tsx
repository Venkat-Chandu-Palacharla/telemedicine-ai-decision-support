import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Calendar, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ScheduleManagerProps {
  onBack: () => void;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return [`${hour}:00`, `${hour}:30`];
}).flat();

interface ScheduleData {
  working_days: string[];
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  break_start: string;
  break_end: string;
  is_available: boolean;
}

export default function ScheduleManager({ onBack }: ScheduleManagerProps) {
  const [schedule, setSchedule] = useState<ScheduleData>({
    working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    start_time: '09:00',
    end_time: '17:00',
    slot_duration_minutes: 30,
    break_start: '12:00',
    break_end: '13:00',
    is_available: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { user, profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    const fetchSchedule = async () => {
      const { data, error } = await supabase
        .from('doctor_availability')
        .select('*')
        .eq('doctor_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching schedule:', error);
      }

      if (data) {
        setSchedule({
          working_days: data.working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          start_time: data.start_time?.substring(0, 5) || '09:00',
          end_time: data.end_time?.substring(0, 5) || '17:00',
          slot_duration_minutes: data.slot_duration_minutes || 30,
          break_start: data.break_start?.substring(0, 5) || '12:00',
          break_end: data.break_end?.substring(0, 5) || '13:00',
          is_available: data.is_available ?? true
        });
      }

      setIsLoading(false);
    };

    fetchSchedule();
  }, [user]);

  const toggleDay = (day: string) => {
    setSchedule(prev => ({
      ...prev,
      working_days: prev.working_days.includes(day)
        ? prev.working_days.filter(d => d !== day)
        : [...prev.working_days, day]
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);

    const { error } = await supabase
      .from('doctor_availability')
      .upsert({
        doctor_id: user.id,
        doctor_name: profile?.full_name || 'Doctor',
        specialty: 'General',
        working_days: schedule.working_days,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        slot_duration_minutes: schedule.slot_duration_minutes,
        break_start: schedule.break_start,
        break_end: schedule.break_end,
        is_available: schedule.is_available,
        updated_at: new Date().toISOString()
      }, { onConflict: 'doctor_id' });

    if (error) {
      console.error('Error saving schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to save schedule.',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Schedule Updated',
        description: 'Your availability schedule has been saved.'
      });
    }

    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Button variant="ghost" onClick={onBack} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400 flex items-center justify-center">
          <Calendar className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Schedule Manager</h1>
          <p className="text-muted-foreground">Set your working hours and availability</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Availability Toggle */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Available for Appointments</p>
                <p className="text-sm text-muted-foreground">
                  Toggle to show or hide your availability to patients
                </p>
              </div>
              <Switch
                checked={schedule.is_available}
                onCheckedChange={(checked) => setSchedule(prev => ({ ...prev, is_available: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Working Days */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Working Days
            </CardTitle>
            <CardDescription>Select the days you're available for consultations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map(day => (
                <Badge
                  key={day}
                  variant={schedule.working_days.includes(day) ? 'default' : 'outline'}
                  className="cursor-pointer px-4 py-2 text-sm"
                  onClick={() => toggleDay(day)}
                >
                  {day.substring(0, 3)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Working Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Working Hours
            </CardTitle>
            <CardDescription>Set your daily consultation hours</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Select
                  value={schedule.start_time}
                  onValueChange={(v) => setSchedule(prev => ({ ...prev, start_time: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map(time => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Select
                  value={schedule.end_time}
                  onValueChange={(v) => setSchedule(prev => ({ ...prev, end_time: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map(time => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Appointment Duration</Label>
              <Select
                value={schedule.slot_duration_minutes.toString()}
                onValueChange={(v) => setSchedule(prev => ({ ...prev, slot_duration_minutes: parseInt(v) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Break Time */}
        <Card>
          <CardHeader>
            <CardTitle>Break Time</CardTitle>
            <CardDescription>Set your daily break period (no appointments during this time)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Break Start</Label>
                <Select
                  value={schedule.break_start}
                  onValueChange={(v) => setSchedule(prev => ({ ...prev, break_start: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map(time => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Break End</Label>
                <Select
                  value={schedule.break_end}
                  onValueChange={(v) => setSchedule(prev => ({ ...prev, break_end: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map(time => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="gradient-primary text-white border-0"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Schedule
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
