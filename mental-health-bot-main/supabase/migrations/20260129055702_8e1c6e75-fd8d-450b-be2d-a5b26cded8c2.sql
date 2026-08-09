-- ============================================
-- TIME-BASED ACCESS EXPIRY: 90 days after last appointment
-- Doctors can only view patient data if they have an appointment
-- within the last 90 days
-- ============================================

-- 1. Fix profiles table - doctors can view patient profiles only with recent appointments
DROP POLICY IF EXISTS "Doctors can view their patients' profiles" ON public.profiles;

CREATE POLICY "Doctors can view their patients' profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'doctor'::app_role) 
    AND (
      auth.uid() = id  -- Doctors can always view their own profile
      OR EXISTS (
        SELECT 1 FROM public.appointments a
        WHERE a.patient_id = profiles.id 
        AND a.doctor_id = auth.uid()
        AND a.scheduled_at >= (now() - interval '90 days')
      )
    )
  );

-- 2. Fix medical_records table - doctors can view records only with recent appointments
DROP POLICY IF EXISTS "Doctors can view patient records" ON public.medical_records;
DROP POLICY IF EXISTS "Doctors can view records of their patients" ON public.medical_records;

CREATE POLICY "Doctors can view patient records within 90 days"
  ON public.medical_records
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.patient_id = medical_records.patient_id 
      AND a.doctor_id = auth.uid()
      AND a.scheduled_at >= (now() - interval '90 days')
    )
  );

-- 3. Fix patient_medical_history table - SELECT policy with 90-day expiry
DROP POLICY IF EXISTS "Doctors can view their patients' medical history" ON public.patient_medical_history;

CREATE POLICY "Doctors can view patient history within 90 days"
  ON public.patient_medical_history
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'doctor'::app_role) 
    AND EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.patient_id = patient_medical_history.patient_id 
      AND a.doctor_id = auth.uid()
      AND a.scheduled_at >= (now() - interval '90 days')
    )
  );

-- 4. Fix patient_medical_history table - INSERT policy with 90-day expiry
DROP POLICY IF EXISTS "Doctors can add medical history for their patients" ON public.patient_medical_history;

CREATE POLICY "Doctors can add patient history within 90 days"
  ON public.patient_medical_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'doctor'::app_role) 
    AND EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.patient_id = patient_medical_history.patient_id 
      AND a.doctor_id = auth.uid()
      AND a.scheduled_at >= (now() - interval '90 days')
    )
  );

-- 5. Fix patient_medical_history table - UPDATE policy with 90-day expiry
DROP POLICY IF EXISTS "Doctors can update medical history for their patients" ON public.patient_medical_history;

CREATE POLICY "Doctors can update patient history within 90 days"
  ON public.patient_medical_history
  FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'doctor'::app_role) 
    AND EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.patient_id = patient_medical_history.patient_id 
      AND a.doctor_id = auth.uid()
      AND a.scheduled_at >= (now() - interval '90 days')
    )
  );

-- 6. Fix prescriptions table - doctors can view prescriptions they wrote (no change needed)
-- but ensure the policy uses proper authentication
DROP POLICY IF EXISTS "Doctors can view prescriptions they wrote" ON public.prescriptions;

CREATE POLICY "Doctors can view prescriptions they wrote"
  ON public.prescriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = doctor_id);

-- Add comments explaining the 90-day access policy
COMMENT ON POLICY "Doctors can view their patients' profiles" ON public.profiles IS 
  'SECURITY: Time-based access - doctors can only view patient profiles within 90 days of an appointment.';

COMMENT ON POLICY "Doctors can view patient records within 90 days" ON public.medical_records IS 
  'SECURITY: Time-based access - doctors can only view patient medical records within 90 days of an appointment.';

COMMENT ON POLICY "Doctors can view patient history within 90 days" ON public.patient_medical_history IS 
  'SECURITY: Time-based access - doctors can only view patient medical history within 90 days of an appointment.';