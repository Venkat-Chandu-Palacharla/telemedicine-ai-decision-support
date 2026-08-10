import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Star, Loader2, Check, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface CompletedAppointment {
  id: string;
  scheduled_at: string;
  doctor_id: string;
  doctor_name: string;
  doctor_avatar?: string;
  specialty: string;
  has_review: boolean;
  existing_rating?: number;
  existing_review?: string;
}

interface DoctorReviewProps {
  onBack: () => void;
}

export default function DoctorReview({ onBack }: DoctorReviewProps) {
  const [appointments, setAppointments] = useState<CompletedAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<CompletedAppointment | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCompletedAppointments = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get completed appointments
      const { data: appointmentsData, error: aptError } = await supabase
        .from('appointments')
        .select('id, scheduled_at, doctor_id')
        .eq('patient_id', user!.id)
        .eq('status', 'completed')
        .order('scheduled_at', { ascending: false });

      if (aptError) throw aptError;

      if (!appointmentsData || appointmentsData.length === 0) {
        setAppointments([]);
        setIsLoading(false);
        return;
      }

      // Get doctor profiles
      const doctorIds = [...new Set(appointmentsData.map(a => a.doctor_id))];
      const { data: doctors, error: docError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', doctorIds);

      if (docError) throw docError;

      // Get doctor specialties
      const { data: doctorProfiles, error: specError } = await supabase
        .from('doctor_profiles')
        .select('id, specialty')
        .in('id', doctorIds);

      if (specError) throw specError;

      // Get existing reviews
      const { data: reviews, error: revError } = await supabase
        .from('doctor_reviews')
        .select('appointment_id, rating, review_text')
        .eq('patient_id', user!.id);

      if (revError) throw revError;

      const reviewMap = new Map(reviews?.map(r => [r.appointment_id, r]) || []);
      const doctorMap = new Map(doctors?.map(d => [d.id, d]) || []);
      const specialtyMap = new Map(doctorProfiles?.map(d => [d.id, d.specialty]) || []);

      const enrichedAppointments: CompletedAppointment[] = appointmentsData.map(apt => {
        const doctor = doctorMap.get(apt.doctor_id);
        const review = reviewMap.get(apt.id);
        return {
          id: apt.id,
          scheduled_at: apt.scheduled_at,
          doctor_id: apt.doctor_id,
          doctor_name: doctor?.full_name || 'Unknown Doctor',
          doctor_avatar: doctor?.avatar_url,
          specialty: specialtyMap.get(apt.doctor_id) || 'General Medicine',
          has_review: !!review,
          existing_rating: review?.rating,
          existing_review: review?.review_text
        };
      });

      setAppointments(enrichedAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load appointments.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, user]);

  useEffect(() => {
    if (!user) return;
    fetchCompletedAppointments();
  }, [fetchCompletedAppointments, user]);

  const handleOpenReview = (appointment: CompletedAppointment) => {
    setSelectedAppointment(appointment);
    setRating(appointment.existing_rating || 0);
    setReviewText(appointment.existing_review || '');
    setDialogOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedAppointment || rating === 0) {
      toast({
        title: 'Rating required',
        description: 'Please select a star rating.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedAppointment.has_review) {
        // Update existing review
        const { error } = await supabase
          .from('doctor_reviews')
          .update({
            rating,
            review_text: reviewText || null
          })
          .eq('appointment_id', selectedAppointment.id)
          .eq('patient_id', user!.id);

        if (error) throw error;
      } else {
        // Create new review
        const { error } = await supabase
          .from('doctor_reviews')
          .insert({
            doctor_id: selectedAppointment.doctor_id,
            patient_id: user!.id,
            appointment_id: selectedAppointment.id,
            rating,
            review_text: reviewText || null
          });

        if (error) throw error;
      }

      toast({
        title: 'Review submitted',
        description: 'Thank you for your feedback!'
      });

      setDialogOpen(false);
      fetchCompletedAppointments();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit review.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button variant="ghost" onClick={onBack} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
          <Star className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rate Your Doctors</h1>
          <p className="text-muted-foreground">Share your consultation experience</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : appointments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No completed appointments to review yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {appointments.map((apt) => (
            <Card key={apt.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={apt.doctor_avatar} />
                    <AvatarFallback>{apt.doctor_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">Dr. {apt.doctor_name}</h3>
                    <p className="text-sm text-muted-foreground">{apt.specialty}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(apt.scheduled_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  
                  {apt.has_review ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= (apt.existing_rating || 0)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-muted-foreground'
                            }`}
                          />
                        ))}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleOpenReview(apt)}>
                        Edit
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={() => handleOpenReview(apt)}>
                      <Star className="w-4 h-4 mr-2" />
                      Rate
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rate Your Experience</DialogTitle>
            <DialogDescription>
              {selectedAppointment && `How was your consultation with Dr. ${selectedAppointment.doctor_name}?`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Star Rating */}
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
            </div>
            
            <div className="text-center text-sm text-muted-foreground">
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </div>

            {/* Review Text */}
            <Textarea
              placeholder="Share details about your experience (optional)"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
            />

            <Button 
              onClick={handleSubmitReview} 
              disabled={isSubmitting || rating === 0}
              className="w-full"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Submit Review
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
