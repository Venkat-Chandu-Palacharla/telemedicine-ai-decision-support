-- Create doctor reviews table
CREATE TABLE public.doctor_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(patient_id, appointment_id)
);

-- Enable RLS
ALTER TABLE public.doctor_reviews ENABLE ROW LEVEL SECURITY;

-- Patients can create reviews for their completed appointments
CREATE POLICY "Patients can create reviews"
ON public.doctor_reviews
FOR INSERT
WITH CHECK (
  auth.uid() = patient_id AND
  EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.id = appointment_id
    AND a.patient_id = auth.uid()
    AND a.status = 'completed'
  )
);

-- Patients can view their own reviews
CREATE POLICY "Patients can view their reviews"
ON public.doctor_reviews
FOR SELECT
USING (auth.uid() = patient_id);

-- Doctors can view reviews about them
CREATE POLICY "Doctors can view their reviews"
ON public.doctor_reviews
FOR SELECT
USING (auth.uid() = doctor_id);

-- Anyone can view doctor reviews (for public ratings)
CREATE POLICY "Public can view reviews"
ON public.doctor_reviews
FOR SELECT
USING (true);

-- Patients can update their own reviews
CREATE POLICY "Patients can update their reviews"
ON public.doctor_reviews
FOR UPDATE
USING (auth.uid() = patient_id);

-- Create trigger for updated_at
CREATE TRIGGER update_doctor_reviews_updated_at
BEFORE UPDATE ON public.doctor_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable pg_cron and pg_net extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;