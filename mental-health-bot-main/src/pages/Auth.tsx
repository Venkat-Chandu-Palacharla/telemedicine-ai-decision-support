import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Stethoscope, 
  User, 
  UserCog, 
  ShieldCheck, 
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import { z } from 'zod';

// Google icon component
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="currentColor"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="currentColor"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="currentColor"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

type AppRole = 'patient' | 'doctor' | 'admin';

const specialties = [
  'General Practice',
  'Cardiology',
  'Dermatology',
  'Neurology',
  'Pediatrics',
  'Psychiatry',
  'Orthopedics',
  'Oncology',
  'Ophthalmology',
  'ENT (Ear, Nose, Throat)',
];

const roleInfo = {
  patient: {
    icon: User,
    title: 'Patient',
    description: 'Access AI predictions, mental health support, and consultations',
    color: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400'
  },
  doctor: {
    icon: UserCog,
    title: 'Doctor',
    description: 'Manage appointments, view patient reports, and prescriptions',
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
  }
};

// Validation schemas
const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const adminLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const signUpSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100, 'Name is too long'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: z.enum(['patient', 'doctor']),
  licenseNumber: z.string().optional(),
  specialty: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
}).refine((data) => {
  if (data.role === 'doctor') {
    return data.licenseNumber && data.licenseNumber.length >= 5;
  }
  return true;
}, {
  message: "License number is required for doctors (min 5 characters)",
  path: ["licenseNumber"]
}).refine((data) => {
  if (data.role === 'doctor') {
    return data.specialty && data.specialty.length > 0;
  }
  return true;
}, {
  message: "Specialty is required for doctors",
  path: ["specialty"]
});

export default function Auth() {
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'admin'>('signin');
  const [selectedRole, setSelectedRole] = useState<AppRole>('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [licenseNumber, setLicenseNumber] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { signIn, signUp, user, role, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth`
      }
    });

    if (error) {
      toast({
        title: 'Google Sign-In Failed',
        description: error.message,
        variant: 'destructive'
      });
      setIsGoogleLoading(false);
    }
  };

// Redirect if already authenticated
  useEffect(() => {
    if (!user || authLoading) return;

    const handleRedirect = async () => {
      // FIRST: Check if user has a doctor_profile (pending/rejected/approved)
      // This catches NEW doctors who just signed up but haven't been approved yet
      const { data: dp } = await supabase
        .from('doctor_profiles')
        .select('approval_status')
        .eq('id', user.id)
        .maybeSingle();

      // If doctor_profile exists with pending or rejected status, route to pending screen
      // This handles doctors who signed up but aren't approved yet
      if (dp && dp.approval_status !== 'approved') {
        // Even if role is 'patient' (default from trigger), show pending screen for doctors
        navigate('/doctor-pending');
        return;
      }

      // If no doctor_profile but they selected 'doctor' role during signup (requested_role in metadata)
      // Check if they just signed up - look at the metadata
      if (!dp) {
        const { data: { user: userData } } = await supabase.auth.getUser();
        const requestedRole = userData?.user_metadata?.requested_role;
        
        // If they requested doctor role but profile doesn't exist yet, something is wrong
        // This shouldn't normally happen as we create profile on signup
        if (requestedRole === 'doctor') {
          // Try to navigate to pending anyway
          navigate('/doctor-pending');
          return;
        }
      }

      // Now check the actual role from user_roles table
      switch (role) {
        case 'patient':
          navigate('/patient');
          break;
        case 'doctor':
          navigate('/doctor');
          break;
        case 'admin':
          navigate('/admin');
          break;
        default:
          // Fallback: if role is null, check if they have pending doctor status
          if (dp) {
            navigate('/doctor-pending');
          } else {
            navigate('/patient');
          }
      }
    };

    // Always call handleRedirect - it will check all conditions
    handleRedirect();
  }, [user, role, authLoading, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const result = signInSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    const { error } = await signIn(email, password);
    
    if (error) {
      let message = 'An error occurred during sign in';
      if (error.message.includes('Invalid login credentials')) {
        message = 'Invalid email or password. Please check your credentials.';
      } else if (error.message.includes('Email not confirmed')) {
        message = 'Please confirm your email address before signing in.';
      }
      
      toast({
        title: 'Sign In Failed',
        description: message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Welcome back!',
        description: 'Redirecting to your dashboard...',
      });
    }
    
    setIsLoading(false);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate only email and password - admin status verified server-side
    const result = adminLoginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: 'Admin Login Failed',
        description: error.message.includes('Invalid login credentials')
          ? 'Invalid email or password.'
          : 'Could not authenticate. Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    // Verify admin role after successful authentication
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    if (!userId) {
      await supabase.auth.signOut();
      toast({
        title: 'Admin Login Failed',
        description: 'Could not verify account. Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    const { data: isAdmin, error: roleError } = await supabase.rpc('has_role', {
      _user_id: userId,
      _role: 'admin',
    });

    if (roleError || !isAdmin) {
      await supabase.auth.signOut();
      toast({
        title: 'Admin Access Denied',
        description: 'Your account is not an admin.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    toast({
      title: 'Admin Access Granted',
      description: 'Redirecting to admin dashboard...',
    });

    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const result = signUpSchema.safeParse({ 
      fullName, 
      email, 
      password, 
      confirmPassword, 
      role: selectedRole,
      licenseNumber: selectedRole === 'doctor' ? licenseNumber : undefined,
      specialty: selectedRole === 'doctor' ? specialty : undefined,
    });
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    const { error, userId } = await signUp(email, password, fullName, selectedRole);
    
    if (error) {
      let message = 'An error occurred during sign up';
      if (error.message.includes('already registered')) {
        message = 'This email is already registered. Please sign in instead.';
      } else if (error.message.includes('Password')) {
        message = error.message;
      }
      
      toast({
        title: 'Sign Up Failed',
        description: message,
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    // If doctor, create doctor profile and route to pending screen
    if (selectedRole === 'doctor' && userId) {
      const { error: profileError } = await supabase
        .from('doctor_profiles')
        .insert({
          id: userId,
          specialty: specialty,
          license_number: licenseNumber,
          is_accepting_patients: true,
        });

      if (profileError) {
        console.error('Error creating doctor profile:', profileError);
        toast({
          title: 'Doctor Profile Error',
          description: 'Account created but professional profile failed to save. Please contact support.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      toast({
        title: 'Application Submitted!',
        description: 'Your doctor account is pending admin approval.',
      });

      // Stay signed in and route to the pending-approval screen.
      // Real-time updates there will prompt sign-in once approved.
      navigate('/doctor-pending');
    } else {
      toast({
        title: 'Account Created!',
        description: 'Welcome to TeleMed AI. Redirecting to your dashboard...',
      });
    }
    
    setIsLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />
      
      <div className="w-full max-w-md relative">
        {/* Back Button */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <Card className="shadow-elevated border-border/50">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
              <Stethoscope className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">
              {authMode === 'signin' ? 'Welcome Back' : authMode === 'admin' ? 'Admin Login' : 'Create Account'}
            </CardTitle>
            <CardDescription>
              {authMode === 'signin' 
                ? 'Sign in to access your dashboard' 
                : authMode === 'admin'
                ? 'Enter admin credentials to continue'
                : 'Sign up as a Patient or Doctor'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {/* Auth Mode Tabs */}
            <Tabs value={authMode} onValueChange={(v) => setAuthMode(v as 'signin' | 'signup' | 'admin')} className="mb-6">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
                <TabsTrigger value="admin" className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Admin
                </TabsTrigger>
              </TabsList>
              
              {/* Sign In Form */}
              <TabsContent value="signin" className="mt-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className={errors.email ? 'border-destructive' : ''}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        className={errors.password ? 'border-destructive' : ''}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password}</p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full gradient-primary text-white border-0"
                    disabled={isLoading || isGoogleLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading || isGoogleLoading}
                  >
                    {isGoogleLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <GoogleIcon />
                    )}
                    <span className="ml-2">Continue with Google</span>
                  </Button>
                </form>
              </TabsContent>
              
              {/* Sign Up Form - Only Patient and Doctor */}
              <TabsContent value="signup" className="mt-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                      className={errors.fullName ? 'border-destructive' : ''}
                    />
                    {errors.fullName && (
                      <p className="text-sm text-destructive">{errors.fullName}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className={errors.email ? 'border-destructive' : ''}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">I am a</Label>
                    <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(roleInfo) as AppRole[]).map((role) => {
                          const info = roleInfo[role];
                          return (
                            <SelectItem key={role} value={role}>
                              <div className="flex items-center gap-2">
                                <info.icon className="w-4 h-4" />
                                <span>{info.title}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <div className={`p-3 rounded-lg ${roleInfo[selectedRole].color} flex items-center gap-3`}>
                      {(() => {
                        const Icon = roleInfo[selectedRole].icon;
                        return <Icon className="w-5 h-5" />;
                      })()}
                      <p className="text-sm">{roleInfo[selectedRole].description}</p>
                    </div>
                  </div>

                  {/* Doctor-specific fields */}
                  {selectedRole === 'doctor' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="licenseNumber">Medical License Number *</Label>
                        <Input
                          id="licenseNumber"
                          type="text"
                          value={licenseNumber}
                          onChange={(e) => setLicenseNumber(e.target.value)}
                          placeholder="Enter your medical license number"
                          required
                          className={errors.licenseNumber ? 'border-destructive' : ''}
                        />
                        {errors.licenseNumber && (
                          <p className="text-sm text-destructive">{errors.licenseNumber}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="specialty">Specialty *</Label>
                        <Select value={specialty} onValueChange={setSpecialty}>
                          <SelectTrigger className={errors.specialty ? 'border-destructive' : ''}>
                            <SelectValue placeholder="Select your specialty" />
                          </SelectTrigger>
                          <SelectContent>
                            {specialties.map((spec) => (
                              <SelectItem key={spec} value={spec}>
                                {spec}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.specialty && (
                          <p className="text-sm text-destructive">{errors.specialty}</p>
                        )}
                      </div>
                    </>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a password"
                        required
                        className={errors.password ? 'border-destructive' : ''}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      required
                      className={errors.confirmPassword ? 'border-destructive' : ''}
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full gradient-primary text-white border-0"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      `Sign Up as ${roleInfo[selectedRole].title}`
                    )}
                  </Button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading || isGoogleLoading}
                  >
                    {isGoogleLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <GoogleIcon />
                    )}
                    <span className="ml-2">Continue with Google</span>
                  </Button>
                </form>
              </TabsContent>

              {/* Admin Login Form */}
              <TabsContent value="admin" className="mt-4">
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div className="p-3 rounded-lg bg-accent/20 text-foreground border border-border/50 flex items-center gap-3 mb-4">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    <p className="text-sm">Admin login - access is verified server-side</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin-email">Admin Email</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter admin email"
                      required
                      className={errors.email ? 'border-destructive' : ''}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="admin-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter admin password"
                        required
                        className={errors.password ? 'border-destructive' : ''}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password}</p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Authenticating...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        Admin Login
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
