-- Fix overly permissive doctor access to patient medical history

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Doctors can view patient medical history" ON public.patient_medical_history;

-- Create new policy that requires doctor-patient appointment relationship
CREATE POLICY "Doctors can view their patients' medical history"
  ON public.patient_medical_history FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'doctor') AND
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.patient_id = patient_medical_history.patient_id
      AND a.doctor_id = auth.uid()
    )
  );

-- Also fix the INSERT and UPDATE policies to require appointment relationship
DROP POLICY IF EXISTS "Doctors can add medical history" ON public.patient_medical_history;
DROP POLICY IF EXISTS "Doctors can update medical history" ON public.patient_medical_history;

CREATE POLICY "Doctors can add medical history for their patients"
  ON public.patient_medical_history FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'doctor') AND
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.patient_id = patient_medical_history.patient_id
      AND a.doctor_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can update medical history for their patients"
  ON public.patient_medical_history FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'doctor') AND
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.patient_id = patient_medical_history.patient_id
      AND a.doctor_id = auth.uid()
    )
  );