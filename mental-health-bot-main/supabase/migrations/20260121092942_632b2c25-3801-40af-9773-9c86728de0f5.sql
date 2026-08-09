-- Fix overly permissive RLS policies on notifications table
-- Drop existing permissive policies
DROP POLICY IF EXISTS "Anyone can view notifications" ON notifications;
DROP POLICY IF EXISTS "Anyone can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Anyone can update notifications" ON notifications;

-- Create secure policies that restrict access to own notifications
-- Note: user_id is TEXT type which is used in this application for flexible ID storage
-- We'll create policies that work with TEXT type

CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid()::text);

CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

-- Allow authenticated users to insert notifications for themselves only
CREATE POLICY "Users can insert own notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid()::text);

-- Allow service role (edge functions) to insert notifications for any user
-- This is needed for system-generated notifications like appointment reminders
CREATE POLICY "Service role can manage notifications"
ON notifications FOR ALL
TO service_role
USING (true)
WITH CHECK (true);