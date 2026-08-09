-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('appointment', 'availability', 'reminder', 'system')),
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create doctor availability table
CREATE TABLE public.doctor_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id TEXT NOT NULL,
  doctor_name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  next_available_slot TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;

-- Create policies - notifications are public for demo (in production, use auth.uid())
CREATE POLICY "Anyone can view notifications" 
ON public.notifications 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update notifications" 
ON public.notifications 
FOR UPDATE 
USING (true);

-- Doctor availability is publicly readable
CREATE POLICY "Anyone can view doctor availability" 
ON public.doctor_availability 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can update doctor availability" 
ON public.doctor_availability 
FOR ALL
USING (true);

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.doctor_availability;

-- Insert sample doctor availability data
INSERT INTO public.doctor_availability (doctor_id, doctor_name, specialty, is_available, next_available_slot)
VALUES 
  ('dr-1', 'Dr. Sarah Johnson', 'Cardiology', true, now() + interval '1 hour'),
  ('dr-2', 'Dr. Michael Chen', 'Neurology', false, now() + interval '3 hours'),
  ('dr-3', 'Dr. Emily Williams', 'Dermatology', true, now() + interval '30 minutes'),
  ('dr-4', 'Dr. James Wilson', 'Psychiatry', true, now() + interval '2 hours');