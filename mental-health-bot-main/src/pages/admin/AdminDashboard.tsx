import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  LogOut, 
  Stethoscope, 
  Users,
  UserCog,
  Shield,
  Activity,
  TrendingUp,
  BarChart3,
  Brain,
  Mail
} from 'lucide-react';
import MLDatasetManager from '@/components/admin/MLDatasetManager';
import EmailNotifications from '@/components/admin/EmailNotifications';
import DoctorApprovals from '@/components/admin/DoctorApprovals';
import UserManagement from '@/components/admin/UserManagement';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Admin';
  const avatarUrl = profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`;

  const stats = [
    { label: 'Total Users', value: '156', icon: Users, color: 'text-primary', bg: 'from-primary/10 to-primary/5' },
    { label: 'Active Doctors', value: '12', icon: UserCog, color: 'text-blue-600', bg: 'from-blue-500/10 to-blue-500/5' },
    { label: 'AI Predictions', value: '1,234', icon: Activity, color: 'text-green-600', bg: 'from-green-500/10 to-green-500/5' },
    { label: 'Appointments', value: '89', icon: TrendingUp, color: 'text-amber-600', bg: 'from-amber-500/10 to-amber-500/5' },
  ];

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
              <p className="text-xs text-muted-foreground">Admin Portal</p>
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
                <p className="text-xs text-muted-foreground">Administrator</p>
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
            Admin Dashboard 🛡️
          </h2>
          <p className="text-muted-foreground">
            Manage users, approve doctors, and monitor system analytics.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className={`bg-gradient-to-br ${stat.bg} border-border/50`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
                <p className={`text-2xl font-bold ${stat.color} mt-2`}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="doctors">Doctor Approvals</TabsTrigger>
            <TabsTrigger value="ml">
              <Brain className="w-4 h-4 mr-1" />
              ML Datasets
            </TabsTrigger>
            <TabsTrigger value="emails">
              <Mail className="w-4 h-4 mr-1" />
              Email Logs
            </TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">System Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <UserManagement />
          </TabsContent>

          <TabsContent value="doctors" className="space-y-4">
            <DoctorApprovals />
          </TabsContent>

          <TabsContent value="ml" className="space-y-4">
            <MLDatasetManager />
          </TabsContent>

          <TabsContent value="emails" className="space-y-4">
            <EmailNotifications />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Platform Usage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">AI Predictions Today</span>
                      <span className="font-semibold text-foreground">48</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Mental Health Checks</span>
                      <span className="font-semibold text-foreground">23</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Chatbot Conversations</span>
                      <span className="font-semibold text-foreground">67</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Video Consultations</span>
                      <span className="font-semibold text-foreground">12</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Growth Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">New Users (This Week)</span>
                      <span className="font-semibold text-green-600">+24</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">User Retention</span>
                      <span className="font-semibold text-foreground">87%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Avg. Session Duration</span>
                      <span className="font-semibold text-foreground">12m 34s</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">AI Accuracy Rate</span>
                      <span className="font-semibold text-foreground">94.2%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  System Settings
                </CardTitle>
                <CardDescription>Configure platform settings and security options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div>
                    <p className="font-medium text-foreground">Enable New User Registration</p>
                    <p className="text-sm text-muted-foreground">Allow new patients to sign up</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div>
                    <p className="font-medium text-foreground">AI Predictions</p>
                    <p className="text-sm text-muted-foreground">Enable AI-powered health predictions</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div>
                    <p className="font-medium text-foreground">Mental Health Chatbot</p>
                    <p className="text-sm text-muted-foreground">Enable 24/7 AI chatbot support</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div>
                    <p className="font-medium text-foreground">Maintenance Mode</p>
                    <p className="text-sm text-muted-foreground">Temporarily disable platform access</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
