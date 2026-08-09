-- ============================================
-- FIX DOCTOR APPROVAL WORKFLOW
-- 1. Create trigger to auto-create doctor_availability when doctor is approved
-- 2. Add function to delete users (for admin use)
-- ============================================

-- Function to create doctor availability when a doctor is approved
CREATE OR REPLACE FUNCTION public.handle_doctor_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- When a doctor is approved, create their availability record
  IF NEW.approval_status = 'approved' AND (OLD.approval_status IS NULL OR OLD.approval_status != 'approved') THEN
    -- Get the doctor's profile info
    INSERT INTO public.doctor_availability (
      doctor_id,
      doctor_name,
      specialty,
      is_available,
      start_time,
      end_time,
      break_start,
      break_end,
      slot_duration_minutes,
      working_days
    )
    SELECT 
      NEW.id::text,
      COALESCE(p.full_name, 'Doctor'),
      NEW.specialty,
      true,
      '09:00:00'::time,
      '17:00:00'::time,
      '12:00:00'::time,
      '13:00:00'::time,
      30,
      ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    FROM public.profiles p
    WHERE p.id = NEW.id
    ON CONFLICT (doctor_id) DO UPDATE SET
      doctor_name = EXCLUDED.doctor_name,
      specialty = EXCLUDED.specialty,
      is_available = true;
      
    -- Also ensure the user has doctor role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'doctor')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_doctor_approval ON public.doctor_profiles;

-- Create trigger for doctor approval
CREATE TRIGGER on_doctor_approval
  AFTER UPDATE ON public.doctor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_doctor_approval();

-- Add unique constraint on doctor_id in doctor_availability if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'doctor_availability_doctor_id_key'
  ) THEN
    ALTER TABLE public.doctor_availability ADD CONSTRAINT doctor_availability_doctor_id_key UNIQUE (doctor_id);
  END IF;
END $$;

-- Function to delete a user completely (for admin use)
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Check if caller is admin
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can delete users';
  END IF;

  -- Delete from all related tables first
  DELETE FROM public.notifications WHERE user_id = target_user_id::text;
  DELETE FROM public.prescriptions WHERE patient_id = target_user_id OR doctor_id = target_user_id;
  DELETE FROM public.payments WHERE patient_id = target_user_id OR doctor_id = target_user_id;
  DELETE FROM public.consultation_messages WHERE sender_id = target_user_id;
  DELETE FROM public.appointments WHERE patient_id = target_user_id OR doctor_id = target_user_id;
  DELETE FROM public.medical_records WHERE patient_id = target_user_id OR uploaded_by = target_user_id;
  DELETE FROM public.patient_medical_history WHERE patient_id = target_user_id;
  DELETE FROM public.doctor_reviews WHERE patient_id = target_user_id OR doctor_id = target_user_id;
  DELETE FROM public.doctor_availability WHERE doctor_id = target_user_id::text;
  DELETE FROM public.doctor_profiles WHERE id = target_user_id;
  DELETE FROM public.role_requests WHERE user_id = target_user_id;
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  DELETE FROM public.profiles WHERE id = target_user_id;
  
  -- Delete from auth.users (this will cascade to other auth tables)
  DELETE FROM auth.users WHERE id = target_user_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;

-- Comment on function
COMMENT ON FUNCTION public.admin_delete_user IS 'Allows admins to completely delete a user account, enabling re-registration with the same email';