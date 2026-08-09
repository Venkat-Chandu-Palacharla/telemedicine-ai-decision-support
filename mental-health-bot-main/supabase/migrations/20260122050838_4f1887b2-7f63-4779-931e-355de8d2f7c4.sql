-- =====================================================
-- SECURITY FIX: Create role_requests table for role change workflow
-- This enables proper role change tracking and approval
-- (The role column name was causing an issue - using user_current_role instead)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.role_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  requested_role app_role NOT NULL,
  user_current_role app_role NOT NULL DEFAULT 'patient',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reason TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on role_requests
ALTER TABLE public.role_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own role requests
CREATE POLICY "Users can view their own role requests"
  ON public.role_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create role requests for themselves (patient can request to become doctor)
CREATE POLICY "Users can request role changes"
  ON public.role_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Admins can manage all role requests
CREATE POLICY "Admins can manage role requests"
  ON public.role_requests FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add comment
COMMENT ON TABLE public.role_requests IS 
  'SECURITY: Audit trail for role change requests. Users must be patient by default and request role changes through this table. Admins review and approve/reject.';