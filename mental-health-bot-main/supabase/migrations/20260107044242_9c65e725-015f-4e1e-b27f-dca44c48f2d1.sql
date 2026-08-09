-- Add schedule/working hours columns to doctor_availability
ALTER TABLE public.doctor_availability 
ADD COLUMN IF NOT EXISTS working_days text[] DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
ADD COLUMN IF NOT EXISTS start_time time DEFAULT '09:00:00',
ADD COLUMN IF NOT EXISTS end_time time DEFAULT '17:00:00',
ADD COLUMN IF NOT EXISTS slot_duration_minutes integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS break_start time DEFAULT '12:00:00',
ADD COLUMN IF NOT EXISTS break_end time DEFAULT '13:00:00';

-- Create ML datasets table for training
CREATE TABLE IF NOT EXISTS public.ml_datasets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  disease_type TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  record_count INTEGER DEFAULT 0,
  features TEXT[],
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'trained', 'error'))
);

-- Create ML model training runs
CREATE TABLE IF NOT EXISTS public.ml_training_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dataset_id UUID REFERENCES public.ml_datasets(id) ON DELETE CASCADE,
  disease_type TEXT NOT NULL,
  model_type TEXT NOT NULL DEFAULT 'random_forest',
  accuracy DECIMAL(5,2),
  precision_score DECIMAL(5,2),
  recall_score DECIMAL(5,2),
  f1_score DECIMAL(5,2),
  training_params JSONB,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed'))
);

-- Create payments table for UPI
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES auth.users(id),
  doctor_id UUID NOT NULL REFERENCES auth.users(id),
  appointment_id UUID REFERENCES public.appointments(id),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  payment_method TEXT DEFAULT 'upi',
  upi_id TEXT,
  transaction_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create email logs table
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id UUID REFERENCES auth.users(id),
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,
  template_type TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  error_message TEXT
);

-- Enable RLS
ALTER TABLE public.ml_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_training_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- ML datasets policies (admins can manage, doctors can view)
CREATE POLICY "Admins can manage datasets" ON public.ml_datasets
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Doctors can view datasets" ON public.ml_datasets
  FOR SELECT USING (public.has_role(auth.uid(), 'doctor'));

-- ML training runs policies
CREATE POLICY "Admins can manage training runs" ON public.ml_training_runs
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Doctors can view training runs" ON public.ml_training_runs
  FOR SELECT USING (public.has_role(auth.uid(), 'doctor'));

-- Payments policies
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (auth.uid() = patient_id OR auth.uid() = doctor_id);

CREATE POLICY "Patients can create payments" ON public.payments
  FOR INSERT WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "System can update payments" ON public.payments
  FOR UPDATE USING (auth.uid() = patient_id OR auth.uid() = doctor_id);

-- Email logs policies (admins only)
CREATE POLICY "Admins can view email logs" ON public.email_logs
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own emails" ON public.email_logs
  FOR SELECT USING (auth.uid() = recipient_id);