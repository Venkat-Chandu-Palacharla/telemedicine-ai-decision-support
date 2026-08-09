import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  LogOut, 
  Stethoscope, 
  Calendar, 
  Users, 
  FileText, 
  Video,
  Building2,
  Clock,
  User,
  Pill,
  ChevronRight,
  FolderOpen
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import DoctorProfileEditor from '@/components/doctor/DoctorProfileEditor';
import PrescriptionManager from '@/components/doctor/PrescriptionManager';
import VideoConsultationRoom from '@/components/doctor/VideoConsultationRoom';
import PatientRecordsViewer from '@/components/doctor/PatientRecordsViewer';
import ScheduleManager from '@/components/doctor/ScheduleManager';

type ActiveModule = 'dashboard' | 'profile' | 'prescriptions' | 'video' | 'patient-records' | 'schedule';

const modules = [
  {
    id: 'video',
    title: 'Video Consultations',
    description: 'Start video calls with patients',
    icon: Video,
    color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
  },
  {
    id: 'prescriptions',
    title: 'Prescription Manager',
    description: 'Create and manage prescriptions',
    icon: Pill,
    color: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
  },
  {
    id: 'patient-records',
    title: 'Patient Records',
    description: 'View patient medical documents',
    icon: FolderOpen,
    color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
  },
  {
    id: 'schedule',
    title: 'Schedule Manager',
    description: 'Set your working hours',
    icon: Calendar,
    color: 'bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400'
  },
  {
    id: 'profile',
    title: 'Edit Profile',
    description: 'Update your professional info',
    icon: User,
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
  }
];

interface Appointment {
  id: string;
  patient_id: string;
  patient_name?: string;
  scheduled_at: string;
  type: string;
  status: string;
  reason?: string;
}

export default function DoctorDashboard() {
  const [activeModule, setActiveModule] = useState<ActiveModule>('dashboard');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState({ patients: 0, videoCalls: 0, prescriptions: 0 });
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Fetch appointments
      const { data: aptData } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', user.id)
        .eq('status', 'scheduled')
        .order('scheduled_at', { ascending: true });

      if (aptData) {
        // Enrich with patient names
        const enriched = await Promise.all(
          aptData.map(async (apt) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', apt.patient_id)
              .maybeSingle();
            return { ...apt, patient_name: profile?.full_name || 'Patient' };
          })
        );
        setAppointments(enriched);
      }

      // Fetch stats
      const { count: patientCount } = await supabase
        .from('appointments')
        .select('patient_id', { count: 'exact', head: true })
        .eq('doctor_id', user.id);

      const { count: videoCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', user.id)
        .eq('type', 'video');

      const { count: rxCount } = await supabase
        .from('prescriptions')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', user.id);

      setStats({
        patients: patientCount || 0,
        videoCalls: videoCount || 0,
        prescriptions: rxCount || 0
      });
    };

    fetchData();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Doctor';
  const avatarUrl = profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`;

  const todayAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.scheduled_at).toDateString();
    const today = new Date().toDateString();
    return aptDate === today;
  });

  const renderModule = () => {
    switch (activeModule) {
      case 'profile':
        return <DoctorProfileEditor onBack={() => setActiveModule('dashboard')} />;
      case 'prescriptions':
        return <PrescriptionManager onBack={() => setActiveModule('dashboard')} />;
      case 'video':
        return <VideoConsultationRoom onBack={() => setActiveModule('dashboard')} />;
      case 'patient-records':
        return <PatientRecordsViewer onBack={() => setActiveModule('dashboard')} />;
      case 'schedule':
        return <ScheduleManager onBack={() => setActiveModule('dashboard')} />;
      default:
        return null;
    }
  };

  if (activeModule !== 'dashboard') {
    return (
      <div className="min-h-screen bg-background">
        {renderModule()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">TeleMed AI</h1>
              <p className="text-xs text-muted-foreground">Doctor Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={avatarUrl} />
                <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-foreground">{displayName}</p>
                <p className="text-xs text-muted-foreground">Doctor</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Good morning, {displayName.split(' ').slice(0, 2).join(' ')}! 👨‍⚕️
          </h2>
          <p className="text-muted-foreground">
            Here's your schedule and patient overview for today.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <p className="text-sm text-muted-foreground">Today's Appointments</p>
              </div>
              <p className="text-2xl font-bold text-foreground mt-2">{todayAppointments.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                <p className="text-sm text-muted-foreground">Total Patients</p>
              </div>
              <p className="text-2xl font-bold text-green-600 mt-2">24</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-blue-600" />
                <p className="text-sm text-muted-foreground">Video Calls</p>
              </div>
              <p className="text-2xl font-bold text-blue-600 mt-2">3</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-600" />
                <p className="text-sm text-muted-foreground">Prescriptions</p>
              </div>
              <p className="text-2xl font-bold text-amber-600 mt-2">12</p>
            </CardContent>
          </Card>
        </div>

        {/* Module Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {modules.map((module) => (
            <Card 
              key={module.id}
              className="group cursor-pointer hover:shadow-elevated transition-all duration-300 border-border/50"
              onClick={() => setActiveModule(module.id as ActiveModule)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl ${module.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <module.icon className="w-6 h-6" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-lg mb-1">{module.title}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Today's Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
            <CardDescription>Manage your appointments and consultations</CardDescription>
          </CardHeader>
          <CardContent>
            {todayAppointments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No appointments scheduled for today</p>
            ) : (
              <div className="space-y-4">
                {todayAppointments.map(apt => (
                  <div key={apt.id} className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarFallback>{apt.patient_name?.charAt(0) || 'P'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{apt.patient_name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {new Date(apt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          <span className="mx-1">•</span>
                          {apt.type === 'video' ? (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Video className="w-3 h-3" />
                              Video
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              In-Person
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">View Report</Button>
                      <Button 
                        size="sm" 
                        className="gradient-primary text-white border-0"
                        onClick={() => apt.type === 'video' && setActiveModule('video')}
                      >
                        {apt.type === 'video' ? 'Start Call' : 'Check In'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
