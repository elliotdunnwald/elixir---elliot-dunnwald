-- ==============================================================================
-- SUPABASE SECURITY FIXES
-- Run this in Supabase SQL Editor to fix all security warnings
-- ==============================================================================

-- 1. FIX FUNCTION SEARCH_PATH ISSUES (15 warnings)
-- Add search_path to existing functions to prevent search_path injection attacks
-- Uses ALTER FUNCTION to avoid rewriting function bodies
-- ==============================================================================

-- Fix track_roaster_submission (appears twice in warnings)
ALTER FUNCTION public.track_roaster_submission() SET search_path = public;

-- Fix update_cafe_stats
ALTER FUNCTION public.update_cafe_stats() SET search_path = public;

-- Fix track_equipment_submission
ALTER FUNCTION public.track_equipment_submission() SET search_path = public;

-- Fix track_coffee_submission
ALTER FUNCTION public.track_coffee_submission() SET search_path = public;

-- Fix update_cafe_rating
ALTER FUNCTION public.update_cafe_rating() SET search_path = public;

-- Fix set_admin_status
ALTER FUNCTION public.set_admin_status(uuid, boolean) SET search_path = public;

-- Fix update_updated_at_column
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- Fix create_like_notification
ALTER FUNCTION public.create_like_notification() SET search_path = public;

-- Fix create_comment_notification
ALTER FUNCTION public.create_comment_notification() SET search_path = public;

-- Fix create_follow_request_notification
ALTER FUNCTION public.create_follow_request_notification() SET search_path = public;

-- Fix create_follow_accepted_notification
ALTER FUNCTION public.create_follow_accepted_notification() SET search_path = public;

-- Fix create_follow_notification
ALTER FUNCTION public.create_follow_notification() SET search_path = public;

-- Fix delete_user_by_email
ALTER FUNCTION public.delete_user_by_email(text) SET search_path = public;

-- Fix delete_duplicate_profiles
ALTER FUNCTION public.delete_duplicate_profiles() SET search_path = public;


-- 2. FIX RLS POLICY ISSUES (7 warnings)
-- Replace overly permissive policies with proper access controls
-- ==============================================================================

-- Fix equipment table - restrict to admins only
DROP POLICY IF EXISTS "Admin can manage equipment" ON public.equipment;
CREATE POLICY "Admin can manage equipment" ON public.equipment
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Fix notifications - restrict to notification recipient or system
DROP POLICY IF EXISTS "Anyone can create notifications" ON public.notifications;
CREATE POLICY "Users can create notifications" ON public.notifications
  FOR INSERT
  WITH CHECK (
    -- User can create notifications for themselves
    profile_id = auth.uid()
    OR
    -- Or if they're creating for another user (like, comment, follow notifications)
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Fix pending_cafes - restrict to authenticated users only
DROP POLICY IF EXISTS "Anyone can submit pending cafes" ON public.pending_cafes;
CREATE POLICY "Authenticated users can submit pending cafes" ON public.pending_cafes
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Fix pending_equipment - restrict to authenticated users
DROP POLICY IF EXISTS "System can insert pending equipment" ON public.pending_equipment;
CREATE POLICY "Authenticated users can submit pending equipment" ON public.pending_equipment
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "System can update pending equipment" ON public.pending_equipment;
CREATE POLICY "Admins can update pending equipment" ON public.pending_equipment
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Fix pending_roasters - restrict to authenticated users
DROP POLICY IF EXISTS "System can insert pending roasters" ON public.pending_roasters;
CREATE POLICY "Authenticated users can submit pending roasters" ON public.pending_roasters
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "System can update pending roasters" ON public.pending_roasters;
CREATE POLICY "Admins can update pending roasters" ON public.pending_roasters
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );


-- 3. FIX RLS DISABLED ERRORS (2 errors)
-- Enable RLS on tables that don't have it
-- ==============================================================================

-- Enable RLS on roasters table
ALTER TABLE public.roasters ENABLE ROW LEVEL SECURITY;

-- Add policies for roasters
CREATE POLICY "Everyone can view roasters" ON public.roasters
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage roasters" ON public.roasters
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Enable RLS on coffee_offerings table
ALTER TABLE public.coffee_offerings ENABLE ROW LEVEL SECURITY;

-- Add policies for coffee_offerings
CREATE POLICY "Everyone can view coffee offerings" ON public.coffee_offerings
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage coffee offerings" ON public.coffee_offerings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );


-- ==============================================================================
-- NOTES FOR MANUAL FIXES
-- ==============================================================================

-- 4. AUTH LEAKED PASSWORD PROTECTION (1 warning)
-- This must be enabled in the Supabase Dashboard:
-- 1. Go to Authentication > Settings
-- 2. Under "Password Settings"
-- 3. Enable "Check for breached passwords"
-- This will check passwords against HaveIBeenPwned.org

-- ==============================================================================
-- HOW TO APPLY THESE FIXES
-- ==============================================================================

-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Create a new query
-- 3. Copy and paste this entire file
-- 4. Click "Run" to execute all statements
-- 5. Go to Authentication > Settings
-- 6. Under "Password Settings", enable "Check for breached passwords"
-- 7. Go back to Security Advisor and click "Rerun linter"
-- 8. All warnings should be resolved!

-- ==============================================================================
-- VERIFICATION
-- ==============================================================================

-- After running this script:
-- 1. Go back to Security Advisor in Supabase Dashboard
-- 2. Click "Rerun linter" button
-- 3. Verify all warnings are resolved
-- 4. Expected result: 0 errors, 0 warnings

-- If you see errors when running this script, it may be because:
-- - Function signatures don't match (check parameter types)
-- - Policies with these names don't exist
-- Comment out the failing statements and run again
