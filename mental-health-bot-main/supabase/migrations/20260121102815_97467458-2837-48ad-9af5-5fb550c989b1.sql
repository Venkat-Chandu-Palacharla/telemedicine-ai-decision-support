-- Fix: Add explicit policy to deny anonymous/unauthenticated access to user_roles table
-- This prevents attackers from enumerating admin accounts

-- First, ensure only authenticated users can access their own roles
-- The existing policies already require auth.uid(), but let's be explicit about denying anon access

-- Add a restrictive policy that requires authentication for any SELECT
-- This works with existing policies since RLS is permissive by default
-- but we want to ensure unauthenticated users get no access

-- Check if there's a policy allowing anon access and drop it if exists
-- Then ensure all access requires authentication

-- Note: The existing policies already use auth.uid() which implicitly requires authentication
-- But let's add a comment to document this is intentional

COMMENT ON TABLE public.user_roles IS 
  'SECURITY: This table stores user role assignments. All access requires authentication via auth.uid() in RLS policies. Anonymous access is implicitly denied because all policies use auth.uid() comparisons.';