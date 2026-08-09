-- Fix user_roles table: Add unique constraint on user_id alone
-- This allows each user to have only one role

-- First, remove any duplicate roles (keep only one per user - the highest priority)
DELETE FROM public.user_roles
WHERE id NOT IN (
  SELECT MIN(id)
  FROM public.user_roles
  GROUP BY user_id
);

-- Drop the composite unique constraint if it exists
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;

-- Add new unique constraint on user_id only
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);

-- Grant permission for authenticated users to manage user_roles 
-- This is needed for the RLS policies to work properly
GRANT UPDATE ON public.user_roles TO authenticated;
GRANT INSERT ON public.user_roles TO authenticated;
GRANT DELETE ON public.user_roles TO authenticated;

-- Drop existing restrictive policies and replace with permissive ones for authenticated users
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- New permissive policy: authenticated users can view any role (needed for admin dashboard)
CREATE POLICY "Authenticated users can view roles" ON public.user_roles
  FOR SELECT TO authenticated USING (true);

-- New policy: admin can do all operations
CREATE POLICY "Admin can manage all roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create a function that allows admin to update any user role
-- This bypasses RLS for admins
CREATE OR REPLACE FUNCTION public.admin_update_user_role(target_user_id UUID, new_role app_role)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can update user roles';
  END IF;
  
  -- Update or insert the role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, new_role)
  ON CONFLICT (user_id) DO UPDATE SET role = new_role;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_user_role TO authenticated;
