import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, User, Loader2, Save, Camera, IndianRupee, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { specialties } from '@/data/mockData';

interface DoctorProfileEditorProps {
  onBack: () => void;
}

interface DoctorProfileData {
  specialty: string;
  bio: string;
  consultation_fee: number;
  years_of_experience: number;
  license_number: string;
  is_accepting_patients: boolean;
}

interface ProfileData {
  full_name: string;
  email: string;
  phone: string;
  avatar_url: string;
}

export default function DoctorProfileEditor({ onBack }: DoctorProfileEditorProps) {
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    email: '',
    phone: '',
    avatar_url: ''
  });
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfileData>({
    specialty: '',
    bio: '',
    consultation_fee: 100,
    years_of_experience: 0,
    license_number: '',
    is_accepting_patients: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { user, profile: authProfile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    const fetchProfiles = async () => {
      // Fetch basic profile
      if (authProfile) {
        setProfile({
          full_name: authProfile.full_name || '',
          email: authProfile.email || user.email || '',
          phone: authProfile.phone || '',
          avatar_url: authProfile.avatar_url || ''
        });
      }

      // Fetch doctor profile
      const { data: docProfile, error } = await supabase
        .from('doctor_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching doctor profile:', error);
      }

      if (docProfile) {
        setDoctorProfile({
          specialty: docProfile.specialty || '',
          bio: docProfile.bio || '',
          consultation_fee: docProfile.consultation_fee || 100,
          years_of_experience: docProfile.years_of_experience || 0,
          license_number: docProfile.license_number || '',
          is_accepting_patients: docProfile.is_accepting_patients ?? true
        });
      }

      setIsLoading(false);
    };

    fetchProfiles();
  }, [user, authProfile]);

  const handleProfileChange = (field: keyof ProfileData, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleDoctorProfileChange = (field: keyof DoctorProfileData, value: string | number | boolean) => {
    setDoctorProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);

    // Update basic profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
        avatar_url: profile.avatar_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      toast({
        title: 'Error',
        description: 'Failed to update profile.',
        variant: 'destructive'
      });
      setIsSaving(false);
      return;
    }

    // Upsert doctor profile
    const { error: doctorError } = await supabase
      .from('doctor_profiles')
      .upsert({
        id: user.id,
        specialty: doctorProfile.specialty,
        bio: doctorProfile.bio,
        consultation_fee: doctorProfile.consultation_fee,
        years_of_experience: doctorProfile.years_of_experience,
        license_number: doctorProfile.license_number,
        is_accepting_patients: doctorProfile.is_accepting_patients,
        updated_at: new Date().toISOString()
      });

    if (doctorError) {
      console.error('Error updating doctor profile:', doctorError);
      toast({
        title: 'Error',
        description: 'Failed to update doctor profile.',
        variant: 'destructive'
      });
      setIsSaving(false);
      return;
    }

    // Update doctor availability
    await supabase
      .from('doctor_availability')
      .upsert({
        doctor_id: user.id,
        doctor_name: profile.full_name,
        specialty: doctorProfile.specialty,
        is_available: doctorProfile.is_accepting_patients,
        updated_at: new Date().toISOString()
      }, { onConflict: 'doctor_id' });

    toast({
      title: 'Profile Updated',
      description: 'Your profile has been successfully updated.'
    });

    setIsSaving(false);
  };

  const generateRandomAvatar = () => {
    const seed = Math.random().toString(36).substring(7);
    setProfile(prev => ({
      ...prev,
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`
    }));
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
        <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
          <User className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit Profile</h1>
          <p className="text-muted-foreground">Update your professional information</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your basic profile details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-2xl">
                  {profile.full_name?.charAt(0) || 'D'}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Button variant="outline" size="sm" onClick={generateRandomAvatar}>
                  <Camera className="w-4 h-4 mr-2" />
                  Generate Avatar
                </Button>
                <p className="text-xs text-muted-foreground">Click to generate a new avatar</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={profile.full_name}
                  onChange={(e) => handleProfileChange('full_name', e.target.value)}
                  placeholder="Dr. John Smith"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => handleProfileChange('phone', e.target.value)}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="license">License Number</Label>
                <Input
                  id="license"
                  value={doctorProfile.license_number}
                  onChange={(e) => handleDoctorProfileChange('license_number', e.target.value)}
                  placeholder="MD-12345"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Professional Information</CardTitle>
            <CardDescription>Your specialty and experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="specialty">Specialty</Label>
                <Select 
                  value={doctorProfile.specialty} 
                  onValueChange={(v) => handleDoctorProfileChange('specialty', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialties.map(spec => (
                      <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience">Years of Experience</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="experience"
                    type="number"
                    min="0"
                    className="pl-10"
                    value={doctorProfile.years_of_experience}
                    onChange={(e) => handleDoctorProfileChange('years_of_experience', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={doctorProfile.bio}
                onChange={(e) => handleDoctorProfileChange('bio', e.target.value)}
                placeholder="Tell patients about your background, expertise, and approach to care..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Consultation Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle>Consultation Settings</CardTitle>
            <CardDescription>Manage your availability and fees</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fee">Consultation Fee (₹)</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="fee"
                    type="number"
                    min="0"
                    step="50"
                    className="pl-10"
                    value={doctorProfile.consultation_fee}
                    onChange={(e) => handleDoctorProfileChange('consultation_fee', parseFloat(e.target.value) || 0)}
                    placeholder="500"
                  />
                </div>
                <p className="text-xs text-muted-foreground">This fee will be displayed to patients during booking</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium text-foreground">Accepting New Patients</p>
                <p className="text-sm text-muted-foreground">
                  Toggle to show or hide your availability for new appointments
                </p>
              </div>
              <Switch
                checked={doctorProfile.is_accepting_patients}
                onCheckedChange={(checked) => handleDoctorProfileChange('is_accepting_patients', checked)}
              />
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
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
