
-- Fix: Allow any authenticated user to insert their own doctor profile
-- The admin approval workflow prevents unauthorized access anyway
DROP POLICY IF EXISTS "Doctors can insert their own profile" ON public.doctor_profiles;

CREATE POLICY "Users can insert their own doctor profile"
ON public.doctor_profiles
FOR INSERT
WITH CHECK (auth.uid() = id);
