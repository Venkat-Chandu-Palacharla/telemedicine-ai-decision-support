import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  UserCheck, 
  UserX, 
  Clock, 
  CheckCircle, 
  XCircle,
  Search,
  Loader2,
  User,
  Mail,
  Award,
  Stethoscope,
  Calendar,
  Wrench
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface DoctorProfile {
  id: string;
  specialty: string;
  license_number: string | null;
  bio: string | null;
  years_of_experience: number | null;
  consultation_fee: number | null;
  is_accepting_patients: boolean | null;
  approval_status: string | null;
  approved_at: string | null;
  approved_by: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  profile?: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

export default function DoctorApprovals() {
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const { toast } = useToast();
  const { user } = useAuth();

  const fetchDoctors = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('doctor_profiles')
        .select(`
          *,
          profile:profiles!doctor_profiles_id_fkey(full_name, email, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('approval_status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform the data to match our interface
      const transformedData = (data || []).map(doc => ({
        ...doc,
        profile: Array.isArray(doc.profile) ? doc.profile[0] : doc.profile
      }));

      setDoctors(transformedData);
    } catch (error: unknown) {
      console.error('Error fetching doctors:', error);
      toast({
        title: 'Error',
        description: 'Failed to load doctor profiles.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [filter, toast]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

// Function to fix role for a doctor - useful if role wasn't assigned properly before
  const fixDoctorRole = async (doctorId: string) => {
    try {
      // Use the RPC function to update role (bypasses RLS)
      const { error } = await supabase.rpc('admin_update_user_role', {
        target_user_id: doctorId,
        new_role: 'doctor'
      });

      if (error) throw error;

      toast({
        title: 'Role Fixed',
        description: 'Doctor role has been assigned. User should log out and log back in.'
      });
    } catch (error: unknown) {
      console.error('Fix role error:', error);
      toast({
        title: 'Error',
        description: 'Failed to fix role: ' + (error instanceof Error ? error.message : 'Unknown error'),
        variant: 'destructive'
      });
    }
  };

  const handleApprove = async (doctorId: string) => {
    setIsProcessing(true);
    try {
      // First, update the doctor_profiles table
      const { error: profileError } = await supabase
        .from('doctor_profiles')
        .update({
          approval_status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
          rejection_reason: null
        })
        .eq('id', doctorId);

      if (profileError) throw profileError;

      // CRITICAL: Also update the user_roles table to assign 'doctor' role
      // This is why doctors weren't showing as doctors in admin portal
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: doctorId,
          role: 'doctor'
        }, { onConflict: 'user_id' });

      if (roleError) {
        // Log but don't fail - the profile approval succeeded
        console.error('Role update error:', roleError);
      }

      toast({
        title: 'Doctor Approved',
        description: 'The doctor can now log in and access the doctor portal.'
      });

      await fetchDoctors();
    } catch (error: unknown) {
      console.error('Approval error:', error);
      toast({
        title: 'Approval Failed',
        description: error instanceof Error ? error.message : 'Failed to approve doctor.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedDoctor || !rejectionReason.trim()) {
      toast({
        title: 'Rejection Reason Required',
        description: 'Please provide a reason for rejection.',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('doctor_profiles')
        .update({
          approval_status: 'rejected',
          rejection_reason: rejectionReason,
          approved_by: user?.id
        })
        .eq('id', selectedDoctor.id);

      if (error) throw error;

      toast({
        title: 'Doctor Rejected',
        description: 'The rejection has been recorded.'
      });

      setRejectDialogOpen(false);
      setSelectedDoctor(null);
      setRejectionReason('');
      await fetchDoctors();
    } catch (error: unknown) {
      console.error('Rejection error:', error);
      toast({
        title: 'Rejection Failed',
        description: error instanceof Error ? error.message : 'Failed to reject doctor.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const openRejectDialog = (doctor: DoctorProfile) => {
    setSelectedDoctor(doctor);
    setRejectDialogOpen(true);
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'pending':
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const filteredDoctors = doctors.filter(doctor => {
    const name = doctor.profile?.full_name?.toLowerCase() || '';
    const email = doctor.profile?.email?.toLowerCase() || '';
    const specialty = doctor.specialty?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    
    return name.includes(query) || email.includes(query) || specialty.includes(query);
  });

  const stats = {
    pending: doctors.filter(d => d.approval_status === 'pending').length,
    approved: doctors.filter(d => d.approval_status === 'approved').length,
    rejected: doctors.filter(d => d.approval_status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card 
          className={`cursor-pointer transition-all ${filter === 'pending' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setFilter('pending')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all ${filter === 'approved' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setFilter('approved')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.approved}</p>
              <p className="text-sm text-muted-foreground">Approved</p>
            </div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all ${filter === 'rejected' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setFilter('rejected')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400 flex items-center justify-center">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.rejected}</p>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or specialty..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Doctor List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5" />
            Doctor Approvals
          </CardTitle>
          <CardDescription>
            {filter === 'all' ? 'All doctor applications' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} applications`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No doctor applications found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDoctors.map((doctor) => (
                <div 
                  key={doctor.id} 
                  className="p-4 rounded-lg border border-border bg-card"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        {doctor.profile?.avatar_url ? (
                          <img 
                            src={doctor.profile.avatar_url} 
                            alt={doctor.profile.full_name || ''} 
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{doctor.profile?.full_name || 'Unknown'}</h4>
                          {getStatusBadge(doctor.approval_status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {doctor.profile?.email || 'No email'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            {doctor.specialty}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {doctor.license_number && (
                            <span>License: {doctor.license_number}</span>
                          )}
                          {doctor.years_of_experience && (
                            <span>{doctor.years_of_experience} years exp.</span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Applied {format(new Date(doctor.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                        {doctor.rejection_reason && (
                          <p className="text-sm text-destructive mt-2">
                            Rejection reason: {doctor.rejection_reason}
                          </p>
                        )}
                      </div>
                    </div>
                    
<div className="flex gap-2">
                      {doctor.approval_status !== 'approved' && (
                        <Button
                          size="sm"
                          onClick={() => handleApprove(doctor.id)}
                          disabled={isProcessing}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <UserCheck className="w-4 h-4 mr-1" />
                              Approve
                            </>
                          )}
                        </Button>
                      )}
{doctor.approval_status === 'approved' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => fixDoctorRole(doctor.id)}
                          title="Fix doctor role"
                        >
                          <Wrench className="w-4 h-4 mr-1" />
                          Fix Role
                        </Button>
                      )}
                      {doctor.approval_status !== 'rejected' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openRejectDialog(doctor)}
                          disabled={isProcessing}
                        >
                          <UserX className="w-4 h-4 mr-1" />
                          {doctor.approval_status === 'approved' ? 'Revoke' : 'Reject'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Doctor Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting {selectedDoctor?.profile?.full_name}'s application.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter rejection reason..."
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={isProcessing || !rejectionReason.trim()}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
