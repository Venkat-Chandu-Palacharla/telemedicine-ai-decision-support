-- Fix doctor_availability: Require authentication to view schedules
DROP POLICY IF EXISTS "Anyone can view doctor availability" ON public.doctor_availability;

CREATE POLICY "Authenticated users can view doctor availability"
  ON public.doctor_availability
  FOR SELECT
  TO authenticated
  USING (true);

-- Add comment explaining the security decision
COMMENT ON POLICY "Authenticated users can view doctor availability" ON public.doctor_availability IS 
  'SECURITY: Doctor schedules only visible to authenticated users to prevent scraping and impersonation attacks.';