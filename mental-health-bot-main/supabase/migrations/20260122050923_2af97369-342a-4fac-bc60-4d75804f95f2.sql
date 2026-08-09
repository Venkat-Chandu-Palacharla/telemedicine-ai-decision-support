-- SECURITY FIX: Update handle_new_user to always assign 'patient' role
-- This prevents role self-assignment attacks during signup

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile for the new user
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  
  -- SECURITY FIX: Always assign 'patient' role regardless of client input
  -- Role escalation to 'doctor' or 'admin' must go through proper approval workflow:
  -- - Doctors: signup creates pending doctor_profile, admin approves
  -- - Admins: must be manually assigned by existing admin
  -- Client-supplied role metadata is intentionally ignored
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'patient'::app_role);
  
  RETURN NEW;
END;
$$;

-- Add comment documenting the security approach  
COMMENT ON FUNCTION public.handle_new_user() IS 
  'SECURITY: Always assigns patient role. Client-supplied role is ignored. Role escalation requires admin approval through doctor_profiles.approval_status or direct admin update to user_roles.';