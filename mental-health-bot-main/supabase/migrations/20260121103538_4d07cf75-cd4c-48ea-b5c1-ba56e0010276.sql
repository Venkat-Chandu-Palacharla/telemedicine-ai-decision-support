-- Fix: Remove overly permissive public access to doctor_reviews table
-- The public_doctor_ratings view should be used for public displays instead

-- Drop the permissive public policy that exposes patient_id and appointment_id
DROP POLICY IF EXISTS "Public can view reviews" ON public.doctor_reviews;

-- Create a more restrictive policy for authenticated users only
-- Public access should go through the public_doctor_ratings view which excludes sensitive fields
CREATE POLICY "Authenticated users can view reviews"
  ON public.doctor_reviews FOR SELECT
  TO authenticated
  USING (true);

-- Add comment documenting the security approach
COMMENT ON TABLE public.doctor_reviews IS 
  'SECURITY: For public display of reviews, use the public_doctor_ratings view which excludes patient_id and appointment_id. Direct table access is restricted to authenticated users only.';