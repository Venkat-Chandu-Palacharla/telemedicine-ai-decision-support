-- Fix SECURITY DEFINER view issues by recreating views with SECURITY INVOKER

-- Drop and recreate public_doctor_ratings view with SECURITY INVOKER
DROP VIEW IF EXISTS public.public_doctor_ratings;
CREATE VIEW public.public_doctor_ratings 
WITH (security_invoker = true)
AS
SELECT 
  id,
  doctor_id, 
  rating, 
  review_text, 
  created_at,
  updated_at
FROM public.doctor_reviews;

-- Grant select on the view
GRANT SELECT ON public.public_doctor_ratings TO authenticated;
GRANT SELECT ON public.public_doctor_ratings TO anon;

-- Drop and recreate doctor_payment_summary view with SECURITY INVOKER
DROP VIEW IF EXISTS public.doctor_payment_summary;
CREATE VIEW public.doctor_payment_summary 
WITH (security_invoker = true)
AS
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
FROM public.payments;

-- Grant access to the view
GRANT SELECT ON public.doctor_payment_summary TO authenticated;

COMMENT ON VIEW public.doctor_payment_summary IS 
  'Use this view for doctor-facing payment displays to protect patient financial details';