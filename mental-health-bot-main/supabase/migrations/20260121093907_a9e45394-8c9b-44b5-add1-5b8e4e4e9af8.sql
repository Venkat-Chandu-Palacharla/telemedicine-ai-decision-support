-- Fix overly permissive RLS policy on doctor_availability table

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Anyone can update doctor availability" ON public.doctor_availability;

-- Allow only doctors to manage their own availability
CREATE POLICY "Doctors can manage their own availability"
ON public.doctor_availability
FOR ALL
USING (
  auth.uid()::text = doctor_id AND 
  has_role(auth.uid(), 'doctor'::app_role)
)
WITH CHECK (
  auth.uid()::text = doctor_id AND 
  has_role(auth.uid(), 'doctor'::app_role)
);

-- Allow admins to manage all availability
CREATE POLICY "Admins can manage all availability"
ON public.doctor_availability
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));