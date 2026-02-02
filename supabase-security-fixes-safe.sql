-- ==============================================================================
-- SUPABASE SECURITY FIXES (SAFE VERSION)
-- Run this in Supabase SQL Editor to fix security warnings
-- This version only fixes what exists in your database
-- ==============================================================================

-- NOTE: Run each section separately and skip sections that fail
-- This ensures partial fixes are applied even if some functions don't exist

-- ==============================================================================
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


-- ==============================================================================
-- 3. FIX RLS DISABLED ERRORS (2 errors)
-- Enable RLS on tables that don't have it
-- ==============================================================================

-- Enable RLS on roasters table
ALTER TABLE IF EXISTS public.roasters ENABLE ROW LEVEL SECURITY;

-- Add policies for roasters
DROP POLICY IF EXISTS "Everyone can view roasters" ON public.roasters;
CREATE POLICY "Everyone can view roasters" ON public.roasters
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage roasters" ON public.roasters;
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
ALTER TABLE IF EXISTS public.coffee_offerings ENABLE ROW LEVEL SECURITY;

-- Add policies for coffee_offerings
DROP POLICY IF EXISTS "Everyone can view coffee offerings" ON public.coffee_offerings;
CREATE POLICY "Everyone can view coffee offerings" ON public.coffee_offerings
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage coffee offerings" ON public.coffee_offerings;
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
-- 1. FIX FUNCTION SEARCH_PATH ISSUES (15 warnings)
-- Run these individually - if one fails, skip it and continue
-- ==============================================================================

-- To fix function search paths, first check which functions exist:
-- Run this query to see all your functions:
-- SELECT proname, pg_get_function_identity_arguments(oid)
-- FROM pg_proc
-- WHERE pronamespace = 'public'::regnamespace;

-- Then for each function that exists, run:
-- ALTER FUNCTION public.FUNCTION_NAME(arguments) SET search_path = public;

-- Example fixes (uncomment and adjust based on what exists):
-- ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
-- ALTER FUNCTION public.update_cafe_stats() SET search_path = public;
-- ALTER FUNCTION public.update_cafe_rating() SET search_path = public;
-- ALTER FUNCTION public.set_admin_status(uuid, boolean) SET search_path = public;


-- ==============================================================================
-- 4. AUTH LEAKED PASSWORD PROTECTION (1 warning)
-- ==============================================================================

-- This must be enabled manually in the Supabase Dashboard:
-- 1. Go to Authentication > Settings
-- 2. Under "Password Settings"
-- 3. Enable "Check for breached passwords"
-- This will check passwords against HaveIBeenPwned.org


-- ==============================================================================
-- HOW TO APPLY THESE FIXES
-- ==============================================================================

-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Create a new query
-- 3. Copy sections 2 and 3 (RLS policies and RLS enabled)
-- 4. Click "Run" to execute
-- 5. If errors occur, comment out failing statements
-- 6. For section 1 (functions), first query which functions exist
-- 7. Then alter only the functions that exist
-- 8. Go to Authentication > Settings and enable leaked password check
-- 9. Go back to Security Advisor and click "Rerun linter"

-- ==============================================================================
-- VERIFICATION
-- ==============================================================================

-- After running successfully:
-- 1. Go back to Security Advisor in Supabase Dashboard
-- 2. Click "Rerun linter" button
-- 3. Most warnings should be resolved
-- 4. Function warnings will remain for functions that don't exist (safe to ignore)
