-- Create consultation_messages table for real-time chat during video calls
CREATE TABLE public.consultation_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('patient', 'doctor')),
  message TEXT,
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.consultation_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies: Only participants can view/send messages
CREATE POLICY "Participants can view messages" ON public.consultation_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = consultation_messages.appointment_id
      AND (a.patient_id = auth.uid() OR a.doctor_id = auth.uid())
    )
  );

CREATE POLICY "Participants can send messages" ON public.consultation_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = consultation_messages.appointment_id
      AND (a.patient_id = auth.uid() OR a.doctor_id = auth.uid())
    )
  );

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.consultation_messages;

-- Create medical_records table
CREATE TABLE public.medical_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  uploaded_by UUID NOT NULL,
  record_type TEXT NOT NULL CHECK (record_type IN ('lab_result', 'imaging', 'prescription', 'report', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

-- RLS: Patient can manage their own records
CREATE POLICY "Patients can view their records" ON public.medical_records
  FOR SELECT USING (patient_id = auth.uid());

CREATE POLICY "Patients can upload their records" ON public.medical_records
  FOR INSERT WITH CHECK (patient_id = auth.uid() AND uploaded_by = auth.uid());

CREATE POLICY "Patients can delete their records" ON public.medical_records
  FOR DELETE USING (patient_id = auth.uid());

-- RLS: Doctors can view records of patients they have appointments with
CREATE POLICY "Doctors can view patient records" ON public.medical_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.patient_id = medical_records.patient_id
      AND a.doctor_id = auth.uid()
    )
  );

-- Create storage bucket for medical records
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-records', 'medical-records', false);

-- Storage policies for medical records
CREATE POLICY "Patients upload own records" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'medical-records' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Patients view own records" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'medical-records' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Patients delete own records" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'medical-records' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Doctors view patient records" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'medical-records' AND
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.patient_id::text = (storage.foldername(name))[1]
      AND a.doctor_id = auth.uid()
    )
  );

-- Create storage bucket for consultation files (chat attachments)
INSERT INTO storage.buckets (id, name, public) VALUES ('consultation-files', 'consultation-files', false);

-- Storage policies for consultation files
CREATE POLICY "Participants upload consultation files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'consultation-files' AND
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id::text = (storage.foldername(name))[1]
      AND (a.patient_id = auth.uid() OR a.doctor_id = auth.uid())
    )
  );

CREATE POLICY "Participants view consultation files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'consultation-files' AND
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id::text = (storage.foldername(name))[1]
      AND (a.patient_id = auth.uid() OR a.doctor_id = auth.uid())
    )
  );