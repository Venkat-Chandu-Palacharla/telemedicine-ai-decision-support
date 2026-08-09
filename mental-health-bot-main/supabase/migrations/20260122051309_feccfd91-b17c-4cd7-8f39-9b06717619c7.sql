-- Create a function to upgrade user role when doctor is approved
-- This is called when admin approves a doctor profile

CREATE OR REPLACE FUNCTION public.handle_doctor_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When doctor profile is approved, upgrade their role from patient to doctor
  IF NEW.approval_status = 'approved' AND OLD.approval_status != 'approved' THEN
    UPDATE public.user_roles
    SET role = 'doctor'::app_role
    WHERE user_id = NEW.id;
    
    -- Log the approval timestamp and approver
    NEW.approved_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to handle doctor approval
DROP TRIGGER IF EXISTS on_doctor_approval ON public.doctor_profiles;

CREATE TRIGGER on_doctor_approval
  BEFORE UPDATE ON public.doctor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_doctor_approval();

-- Add comment documenting the security approach
COMMENT ON FUNCTION public.handle_doctor_approval() IS 
  'SECURITY: Upgrades user role from patient to doctor only when admin approves doctor_profile. This is the only authorized way to become a doctor.';