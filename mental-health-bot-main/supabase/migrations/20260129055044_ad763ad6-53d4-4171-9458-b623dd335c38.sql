-- ============================================
-- SECURITY FIX: Tighten RLS policies that use USING(true)
-- These policies are meant for authenticated users but don't enforce auth check
-- ============================================

-- 1. Fix doctor_availability - the current policy uses USING(true) which doesn't enforce auth
-- First drop the restrictive policy
DROP POLICY IF EXISTS "Authenticated users can view doctor availability" ON public.doctor_availability;

-- Recreate with proper auth check
CREATE POLICY "Authenticated users can view doctor availability"
  ON public.doctor_availability
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- 2. Fix doctor_reviews - similar issue with USING(true)
DROP POLICY IF EXISTS "Authenticated users can view reviews" ON public.doctor_reviews;

CREATE POLICY "Authenticated users can view reviews"
  ON public.doctor_reviews
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- 3. Fix doctor_profiles - limit public access to approved profiles
-- The current policy allows anyone (including anon) to view approved profiles
DROP POLICY IF EXISTS "Anyone can view approved doctor profiles" ON public.doctor_profiles;

CREATE POLICY "Authenticated users can view approved doctor profiles"
  ON public.doctor_profiles
  FOR SELECT
  TO authenticated
  USING (approval_status = 'approved' OR auth.uid() = id);

-- Add security comments
COMMENT ON POLICY "Authenticated users can view doctor availability" ON public.doctor_availability IS 
  'SECURITY: Requires authentication. Uses auth.uid() IS NOT NULL to prevent anonymous access.';

COMMENT ON POLICY "Authenticated users can view reviews" ON public.doctor_reviews IS 
  'SECURITY: Requires authentication. Uses auth.uid() IS NOT NULL to prevent anonymous access.';

COMMENT ON POLICY "Authenticated users can view approved doctor profiles" ON public.doctor_profiles IS 
  'SECURITY: Requires authentication to prevent anonymous scraping of doctor license numbers.';