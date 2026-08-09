import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Brain,
  Heart,
  MessageCircle,
  Activity,
  Calendar,
  FileText,
  LogOut,
  Stethoscope,
  ChevronRight,
  Video,
  Pill,
  User,
  FolderOpen,
  Star,
  Wallet,
  Shield,
  ArrowRight
} from 'lucide-react';
import DiseasePrediction from '@/components/patient/DiseasePrediction';
import MentalHealthAnalysis from '@/components/patient/MentalHealthAnalysis';
import MentalHealthChatbot from '@/components/patient/MentalHealthChatbot';
import HealthMonitoring from '@/components/patient/HealthMonitoring';
import AppointmentBooking from '@/components/patient/AppointmentBooking';
import ReportsSection from '@/components/patient/ReportsSection';
import VideoConsultation from '@/components/patient/VideoConsultation';
import MedicationReminders from '@/components/patient/MedicationReminders';
import NotificationCenter from '@/components/patient/NotificationCenter';
import ProfileEditor from '@/components/patient/ProfileEditor';
import PatientPrescriptions from '@/components/patient/PatientPrescriptions';
import MedicalRecords from '@/components/patient/MedicalRecords';
import DoctorReview from '@/components/patient/DoctorReview';
import UPIPayment from '@/components/payment/UPIPayment';
import DoctorApprovalStatus from '@/components/patient/DoctorApprovalStatus';
import LanguageSelector from '@/components/LanguageSelector';
import EmergencyAlert from '@/components/patient/EmergencyAlert';
import MedicineRecommendation from '@/components/patient/MedicineRecommendation';

type ActiveModule = 'dashboard' | 'prediction' | 'mental-health' | 'chatbot' | 'monitoring' | 'appointments' | 'reports' | 'video-consultation' | 'medications' | 'profile' | 'prescriptions' | 'medical-records' | 'reviews' | 'payments' | 'emergency' | 'medicine-rec';

const modules = [
  {
    id: 'prediction',
    title: 'AI Disease Prediction',
    description: 'Get AI-powered health risk analysis',
    icon: Brain,
    color: 'bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400'
  },
  {
    id: 'mental-health',
    title: 'Mental Health Check',
    description: 'Assess your mental wellness',
    icon: Heart,
    color: 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
  },
  {
    id: 'chatbot',
    title: 'Mental Health Chatbot',
    description: '24/7 AI emotional support',
    icon: MessageCircle,
    color: 'bg-teal-100 text-teal-600 dark:bg-teal-950 dark:text-teal-400'
  },
  {
    id: 'monitoring',
    title: 'Health Monitoring',
    description: 'Live vital signs tracking',
    icon: Activity,
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
  },
  {
    id: 'appointments',
    title: 'Book Appointment',
    description: 'Schedule doctor consultations',
    icon: Calendar,
    color: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
  },
  {
    id: 'reports',
    title: 'Reports & Prescriptions',
    description: 'View and download health reports',
    icon: FileText,
    color: 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400'
  },
  {
    id: 'video-consultation',
    title: 'Video Consultation',
    description: 'Connect with doctors via video call',
    icon: Video,
    color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
  },
  {
    id: 'medications',
    title: 'Medication Reminders',
    description: 'Schedule and track your medications',
    icon: Pill,
    color: 'bg-pink-100 text-pink-600 dark:bg-pink-950 dark:text-pink-400'
  },
  {
    id: 'prescriptions',
    title: 'My Prescriptions',
    description: 'View your medication history',
    icon: FileText,
    color: 'bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400'
  },
  {
    id: 'medical-records',
    title: 'Medical Records',
    description: 'Upload and manage health documents',
    icon: FolderOpen,
    color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
  },
  {
    id: 'reviews',
    title: 'Rate Doctors',
    description: 'Share your consultation experience',
    icon: Star,
    color: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
  },
{
    id: 'payments',
    title: 'UPI Payments',
    description: 'Pay for consultations via UPI',
    icon: Wallet,
    color: 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400'
  },
  {
    id: 'emergency',
    title: 'Emergency SOS',
    description: 'Quick emergency alert system',
    icon: Shield,
    color: 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400'
  },
  {
    id: 'medicine-rec',
    title: 'Medicine Advisor',
    description: 'Symptom-based medicine suggestions',
    icon: ArrowRight,
    color: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400'
  },
  {
    id: 'profile',
    title: 'Edit Profile',
    description: 'Update your personal information',
    icon: User,
    color: 'bg-slate-100 text-slate-600 dark:bg-slate-950 dark:text-slate-400'
  }
];

export default function PatientDashboard() {
  const [activeModule, setActiveModule] = useState<ActiveModule>('dashboard');
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const avatarUrl = profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`;

  const renderModule = () => {
    switch (activeModule) {
      case 'prediction':
        return <DiseasePrediction onBack={() => setActiveModule('dashboard')} />;
      case 'mental-health':
        return <MentalHealthAnalysis onBack={() => setActiveModule('dashboard')} />;
      case 'chatbot':
        return <MentalHealthChatbot onBack={() => setActiveModule('dashboard')} />;
      case 'monitoring':
        return <HealthMonitoring onBack={() => setActiveModule('dashboard')} />;
      case 'appointments':
        return <AppointmentBooking onBack={() => setActiveModule('dashboard')} />;
      case 'reports':
        return <ReportsSection onBack={() => setActiveModule('dashboard')} />;
      case 'video-consultation':
        return <VideoConsultation />;
      case 'medications':
        return <MedicationReminders onBack={() => setActiveModule('dashboard')} />;
      case 'prescriptions':
        return <PatientPrescriptions onBack={() => setActiveModule('dashboard')} />;
      case 'medical-records':
        return <MedicalRecords onBack={() => setActiveModule('dashboard')} />;
      case 'reviews':
        return <DoctorReview onBack={() => setActiveModule('dashboard')} />;
case 'payments':
        return <UPIPayment onBack={() => setActiveModule('dashboard')} />;
      case 'emergency':
        return <EmergencyAlert onBack={() => setActiveModule('dashboard')} />;
      case 'medicine-rec':
        return <MedicineRecommendation onBack={() => setActiveModule('dashboard')} />;
      case 'profile':
        return <ProfileEditor onBack={() => setActiveModule('dashboard')} />;
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
              <p className="text-xs text-muted-foreground">Patient Portal</p>
            </div>
          </div>
<div className="flex items-center gap-4">
            <LanguageSelector />
            <NotificationCenter userId={user?.id || ''} />
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={avatarUrl} />
                <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-foreground">{displayName}</p>
                <p className="text-xs text-muted-foreground">Patient</p>
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
            Welcome back, {displayName.split(' ')[0]}! 👋
          </h2>
          <p className="text-muted-foreground">
            Access all your health services from one place. What would you like to do today?
          </p>
        </div>

        {/* Doctor application status (only renders if user has a doctor_profile) */}
        <div className="mb-6">
          <DoctorApprovalStatus />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Last Checkup</p>
              <p className="text-lg font-semibold text-foreground">2 weeks ago</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Health Score</p>
              <p className="text-lg font-semibold text-green-600">85/100</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Appointments</p>
              <p className="text-lg font-semibold text-blue-600">2 upcoming</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Reports</p>
              <p className="text-lg font-semibold text-amber-600">5 available</p>
            </CardContent>
          </Card>
        </div>

        {/* Module Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      </main>
    </div>
  );
}
