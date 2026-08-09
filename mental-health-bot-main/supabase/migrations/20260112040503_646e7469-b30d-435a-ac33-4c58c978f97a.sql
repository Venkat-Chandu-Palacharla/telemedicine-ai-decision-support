-- Add approval_status to doctor_profiles table for admin approval workflow
ALTER TABLE public.doctor_profiles 
ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Add approval metadata columns
ALTER TABLE public.doctor_profiles 
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS approved_by uuid,
ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Update RLS to only allow approved doctors to access doctor features
-- First drop the existing policy for doctor profile viewing
DROP POLICY IF EXISTS "Anyone can view doctor profiles" ON public.doctor_profiles;

-- Create a new policy that allows viewing only approved doctors publicly
CREATE POLICY "Anyone can view approved doctor profiles"
ON public.doctor_profiles
FOR SELECT
USING (approval_status = 'approved' OR auth.uid() = id);

-- Allow admins to view all doctor profiles
CREATE POLICY "Admins can view all doctor profiles"
ON public.doctor_profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update doctor approval status
CREATE POLICY "Admins can update doctor profiles"
ON public.doctor_profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));