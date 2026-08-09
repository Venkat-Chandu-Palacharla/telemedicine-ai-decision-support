import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Calendar as CalendarIcon, Video, Building2, Star, CheckCircle2, Loader2, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { specialties } from '@/data/mockData';

interface AppointmentBookingProps {
  onBack: () => void;
}

interface DoctorAvailability {
  id: string;
  doctor_id: string;
  doctor_name: string;
  specialty: string;
  is_available: boolean;
  next_available_slot: string | null;
  start_time: string;
  end_time: string;
  break_start: string;
  break_end: string;
  slot_duration_minutes: number;
  working_days: string[];
}

interface DoctorProfile {
  id: string;
  specialty: string;
  consultation_fee: number | null;
  years_of_experience: number | null;
}

interface Appointment {
  id: string;
  doctor_id: string;
  patient_id: string;
  scheduled_at: string;
  type: string;
  status: string;
  doctor_name?: string;
  specialty?: string;
}

type BookingStep = 'select' | 'confirmation';

export default function AppointmentBooking({ onBack }: AppointmentBookingProps) {
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [consultationType, setConsultationType] = useState<'video' | 'in-person'>('video');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [doctors, setDoctors] = useState<DoctorAvailability[]>([]);
  const [doctorProfiles, setDoctorProfiles] = useState<DoctorProfile[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [bookingStep, setBookingStep] = useState<BookingStep>('select');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch doctors and profiles from database
  useEffect(() => {
    const fetchDoctorsAndProfiles = async () => {
      setIsLoadingDoctors(true);
      
      const [availabilityRes, profilesRes] = await Promise.all([
        supabase.from('doctor_availability').select('*').order('doctor_name'),
        supabase.from('doctor_profiles').select('id, specialty, consultation_fee, years_of_experience')
      ]);

      if (availabilityRes.error) {
        console.error('Error fetching doctors:', availabilityRes.error);
        toast({
          title: 'Error',
          description: 'Failed to load doctors. Please try again.',
          variant: 'destructive'
        });
      } else {
        setDoctors(availabilityRes.data || []);
      }

      if (profilesRes.error) {
        console.error('Error fetching doctor profiles:', profilesRes.error);
      } else {
        setDoctorProfiles(profilesRes.data || []);
      }

      setIsLoadingDoctors(false);
    };

    fetchDoctorsAndProfiles();
  }, [toast]);

  const selectedDoctorData = doctors.find(d => d.id === selectedDoctor);

  // Generate available time slots based on doctor's schedule
  const availableTimeSlots = useMemo(() => {
    if (!selectedDoctorData || !selectedDate) return [];

    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    const workingDays = selectedDoctorData.working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    
    if (!workingDays.includes(dayName)) return [];

    const slots: string[] = [];
    const startTime = selectedDoctorData.start_time || '09:00:00';
    const endTime = selectedDoctorData.end_time || '17:00:00';
    const breakStart = selectedDoctorData.break_start || '12:00:00';
    const breakEnd = selectedDoctorData.break_end || '13:00:00';
    const slotDuration = selectedDoctorData.slot_duration_minutes || 30;

    const parseTime = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const formatTime = (minutes: number) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    };

    const startMinutes = parseTime(startTime);
    const endMinutes = parseTime(endTime);
    const breakStartMinutes = parseTime(breakStart);
    const breakEndMinutes = parseTime(breakEnd);

    for (let time = startMinutes; time + slotDuration <= endMinutes; time += slotDuration) {
      if (time >= breakStartMinutes && time < breakEndMinutes) continue;
      if (time + slotDuration > breakStartMinutes && time < breakEndMinutes) continue;
      
      const slotTime = formatTime(time);
      const slotDateTime = new Date(selectedDate);
      const [slotHours, slotMins] = slotTime.split(':').map(Number);
      slotDateTime.setHours(slotHours, slotMins, 0, 0);
      
      if (!bookedSlots.includes(slotDateTime.toISOString())) {
        slots.push(slotTime);
      }
    }

    return slots;
  }, [selectedDoctorData, selectedDate, bookedSlots]);

  // Fetch booked slots when doctor or date changes
  useEffect(() => {
    if (!selectedDoctor || !selectedDate) {
      setBookedSlots([]);
      return;
    }

    const fetchBookedSlots = async () => {
      const doctor = doctors.find(d => d.id === selectedDoctor);
      if (!doctor) return;

      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('appointments')
        .select('scheduled_at')
        .eq('doctor_id', doctor.doctor_id)
        .eq('status', 'scheduled')
        .gte('scheduled_at', startOfDay.toISOString())
        .lte('scheduled_at', endOfDay.toISOString());

      if (!error && data) {
        setBookedSlots(data.map(apt => apt.scheduled_at));
      }
    };

    fetchBookedSlots();
  }, [selectedDoctor, selectedDate, doctors]);

  // Fetch user appointments
  useEffect(() => {
    if (!user) return;

    const fetchAppointments = async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', user.id)
        .eq('status', 'scheduled')
        .order('scheduled_at', { ascending: true });

      if (error) {
        console.error('Error fetching appointments:', error);
      } else {
        const enrichedAppointments = await Promise.all(
          (data || []).map(async (apt) => {
            const doctor = doctors.find(d => d.doctor_id === apt.doctor_id);
            return {
              ...apt,
              doctor_name: doctor?.doctor_name || 'Doctor',
              specialty: doctor?.specialty || ''
            };
          })
        );
        setAppointments(enrichedAppointments);
      }
    };

    fetchAppointments();

    const channel = supabase
      .channel('appointments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `patient_id=eq.${user.id}`
        },
        () => {
          fetchAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, doctors]);

  const filteredDoctors = doctors.filter(
    doc => !selectedSpecialty || selectedSpecialty === 'all' || doc.specialty === selectedSpecialty
  );

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTimeSlot || !user) {
      toast({
        title: 'Missing Information',
        description: 'Please select a doctor, date, and time slot.',
        variant: 'destructive'
      });
      return;
    }

    const doctor = doctors.find(d => d.id === selectedDoctor);
    if (!doctor) return;

    if (!doctor.is_available) {
      toast({
        title: 'Doctor Unavailable',
        description: 'This doctor is currently not available for appointments.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const scheduledAt = new Date(selectedDate);
      const [hours, minutes] = selectedTimeSlot.split(':').map(Number);
      scheduledAt.setHours(hours, minutes, 0, 0);

      const doctorUserId = doctor.doctor_id;

      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          patient_id: user.id,
          doctor_id: doctorUserId,
          scheduled_at: scheduledAt.toISOString(),
          type: consultationType,
          status: 'scheduled',
          reason: `${consultationType} consultation with ${doctor.doctor_name}`
        });

      if (appointmentError) {
        console.error('Error booking appointment:', appointmentError);
        toast({
          title: 'Booking Failed',
          description: 'Failed to book appointment. Please try again.',
          variant: 'destructive'
        });
        setIsLoading(false);
        return;
      }

      setBookingStep('confirmation');
      toast({
        title: 'Appointment Booked!',
        description: `Your appointment with ${doctor.doctor_name} has been confirmed.`
      });

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive'
      });
    }

    setIsLoading(false);
  };

  const handleBookAnother = () => {
    setBookingStep('select');
    setSelectedDoctor('');
    setSelectedDate(undefined);
    setSelectedTimeSlot('');
  };

  // Confirmation Screen
  if (bookingStep === 'confirmation') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="text-center">
          <CardContent className="py-12">
            <div className="w-20 h-20 rounded-full bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Appointment Booked!</h2>
            <p className="text-muted-foreground mb-4">
              Your appointment has been successfully scheduled.
            </p>
            <div className="p-4 rounded-lg bg-muted mb-6 text-left max-w-sm mx-auto">
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Doctor</span>
                <span className="font-medium text-foreground">{selectedDoctorData?.doctor_name}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium text-foreground">{selectedDate?.toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Time</span>
                <span className="font-medium text-foreground">{selectedTimeSlot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium text-foreground capitalize">{consultationType}</span>
              </div>
            </div>
            <Button onClick={handleBookAnother}>
              Book Another Appointment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Selection Screen
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button variant="ghost" onClick={onBack} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center">
          <CalendarIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Book Appointment</h1>
          <p className="text-muted-foreground">Schedule a consultation with our doctors</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Specialty</label>
                  <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select specialty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Specialties</SelectItem>
                      {specialties.map(specialty => (
                        <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Consultation Type</label>
                  <div className="flex gap-2">
                    <Button
                      variant={consultationType === 'video' ? 'default' : 'outline'}
                      onClick={() => setConsultationType('video')}
                      className="flex-1"
                    >
                      <Video className="w-4 h-4 mr-2" />
                      Video
                    </Button>
                    <Button
                      variant={consultationType === 'in-person' ? 'default' : 'outline'}
                      onClick={() => setConsultationType('in-person')}
                      className="flex-1"
                    >
                      <Building2 className="w-4 h-4 mr-2" />
                      In-Person
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Select Date & Time</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  setSelectedTimeSlot('');
                }}
                disabled={(date) => {
                  if (date < new Date()) return true;
                  if (!selectedDoctorData) return date.getDay() === 0;
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                  const workingDays = selectedDoctorData.working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
                  return !workingDays.includes(dayName);
                }}
                className="rounded-md border mx-auto"
              />

              {selectedDate && selectedDoctor && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Available Time Slots
                  </Label>
                  {availableTimeSlots.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">
                      No available slots for this date. Please select another date.
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {availableTimeSlots.map((slot) => (
                        <Button
                          key={slot}
                          variant={selectedTimeSlot === slot ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedTimeSlot(slot)}
                          className="text-sm"
                        >
                          {slot}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Available Doctors</CardTitle>
              <CardDescription>Select a doctor for your consultation</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingDoctors ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : filteredDoctors.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No doctors available for the selected specialty.
                </p>
              ) : (
                <div className="space-y-4">
                  {filteredDoctors.map(doctor => (
                    <div
                      key={doctor.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedDoctor === doctor.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      } ${!doctor.is_available ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => doctor.is_available && setSelectedDoctor(doctor.id)}
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${doctor.doctor_name}`} />
                          <AvatarFallback>{doctor.doctor_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-foreground">{doctor.doctor_name}</h4>
                            {!doctor.is_available && <Badge variant="secondary">Unavailable</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="flex items-center gap-1 text-sm text-amber-600">
                              <Star className="w-4 h-4 fill-current" />
                              4.8
                            </span>
                          </div>
                        </div>
                        {selectedDoctor === doctor.id && (
                          <CheckCircle2 className="w-6 h-6 text-primary" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Button 
            className="w-full gradient-primary text-white border-0"
            onClick={handleBookAppointment}
            disabled={!selectedDoctor || !selectedDate || !selectedTimeSlot || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Booking...
              </>
            ) : (
              <>
                <CalendarIcon className="w-4 h-4 mr-2" />
                Book Appointment
              </>
            )}
          </Button>
        </div>

        {/* Upcoming Appointments */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No upcoming appointments
                </p>
              ) : (
                <div className="space-y-4">
                  {appointments.map(apt => (
                    <div key={apt.id} className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 mb-2">
                        {apt.type === 'video' ? (
                          <Video className="w-4 h-4 text-blue-500" />
                        ) : (
                          <Building2 className="w-4 h-4 text-green-500" />
                        )}
                        <span className="text-sm font-medium text-foreground">{apt.doctor_name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{apt.specialty}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(apt.scheduled_at).toLocaleDateString()} at{' '}
                        {new Date(apt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
