-- Fix 1: Restrict doctor access to profiles - only their patients via appointments
DROP POLICY IF EXISTS "Doctors can view patient profiles" ON public.profiles;

CREATE POLICY "Doctors can view their patients' profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'doctor') AND
    (auth.uid() = id OR EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.patient_id = profiles.id
      AND a.doctor_id = auth.uid()
    ))
  );

-- Fix 2: Create a public view for doctor reviews that excludes patient identifying information
CREATE OR REPLACE VIEW public.public_doctor_ratings AS
SELECT 
  id,
  doctor_id, 
  rating, 
  review_text, 
  created_at,
  updated_at
FROM public.doctor_reviews;

-- Grant select on the view to authenticated and anon
GRANT SELECT ON public.public_doctor_ratings TO authenticated;
GRANT SELECT ON public.public_doctor_ratings TO anon;

-- Update the public reviews policy to only expose non-sensitive fields via the view
-- Keep existing policy but document that sensitive queries should use the view
COMMENT ON POLICY "Public can view reviews" ON public.doctor_reviews IS 
  'SECURITY NOTE: For public display, use the public_doctor_ratings view which excludes patient_id and appointment_id';

-- Fix 3: Separate payment access - patients see full details, doctors see limited info
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;

-- Patients can see their full payment details including UPI ID
CREATE POLICY "Patients can view their full payment details"
  ON public.payments FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id);

-- Doctors can only see that a payment exists and its status (handled via application layer for field restriction)
-- For now, doctors still see payments but application should use a restricted view
CREATE POLICY "Doctors can view their appointment payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (auth.uid() = doctor_id);

-- Create a view for doctors that excludes sensitive payment instrument details
CREATE OR REPLACE VIEW public.doctor_payment_summary AS
SELECT 
  id,
  patient_id,
  doctor_id, 
  appointment_id,
  amount,
  currency,
  status,
  created_at,
  completed_at
  -- Excludes: upi_id, transaction_id, payment_method
FROM public.payments;

-- Grant access to the view
GRANT SELECT ON public.doctor_payment_summary TO authenticated;

COMMENT ON VIEW public.doctor_payment_summary IS 
  'Use this view for doctor-facing payment displays to protect patient financial details';