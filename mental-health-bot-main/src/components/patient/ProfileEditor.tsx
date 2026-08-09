import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, User, Loader2, Save, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ProfileEditorProps {
  onBack: () => void;
}

interface ProfileData {
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  address: string;
  avatar_url: string;
}

export default function ProfileEditor({ onBack }: ProfileEditorProps) {
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    address: '',
    avatar_url: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { user, profile: authProfile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (authProfile) {
      setProfile({
        full_name: authProfile.full_name || '',
        email: authProfile.email || user?.email || '',
        phone: authProfile.phone || '',
        date_of_birth: authProfile.date_of_birth || '',
        address: authProfile.address || '',
        avatar_url: authProfile.avatar_url || ''
      });
      setIsLoading(false);
    } else if (user) {
      // Fetch profile from database
      const fetchProfile = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile:', error);
          toast({
            title: 'Error',
            description: 'Failed to load profile.',
            variant: 'destructive'
          });
        } else if (data) {
          setProfile({
            full_name: data.full_name || '',
            email: data.email || user.email || '',
            phone: data.phone || '',
            date_of_birth: data.date_of_birth || '',
            address: data.address || '',
            avatar_url: data.avatar_url || ''
          });
        }
        setIsLoading(false);
      };

      fetchProfile();
    }
  }, [user, authProfile, toast]);

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
        date_of_birth: profile.date_of_birth || null,
        address: profile.address,
        avatar_url: profile.avatar_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.'
      });
    }

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
      <div className="container mx-auto px-4 py-8 max-w-2xl flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
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
          <p className="text-muted-foreground">Update your personal information</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Keep your profile information up to date for better healthcare services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-2xl">
                {profile.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Button variant="outline" size="sm" onClick={generateRandomAvatar}>
                <Camera className="w-4 h-4 mr-2" />
                Generate Avatar
              </Button>
              <p className="text-xs text-muted-foreground">
                Click to generate a new random avatar
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid gap-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={profile.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  placeholder="Enter your full name"
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
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={profile.date_of_birth}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={profile.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter your address"
                rows={3}
              />
            </div>
          </div>

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
        </CardContent>
      </Card>
    </div>
  );
}
