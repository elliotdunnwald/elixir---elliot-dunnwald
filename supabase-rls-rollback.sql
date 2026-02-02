-- ==============================================================================
-- ROLLBACK RLS CHANGES THAT BROKE THE APP
-- Run this immediately to restore functionality
-- ==============================================================================

-- DISABLE RLS on roasters - it was working before
ALTER TABLE IF EXISTS public.roasters DISABLE ROW LEVEL SECURITY;

-- DISABLE RLS on coffee_offerings - it was working before
ALTER TABLE IF EXISTS public.coffee_offerings DISABLE ROW LEVEL SECURITY;

-- Revert notifications policy to original (too restrictive now)
DROP POLICY IF EXISTS "Users can create notifications" ON public.notifications;
CREATE POLICY "Anyone can create notifications" ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- Revert pending_cafes policy to original
DROP POLICY IF EXISTS "Authenticated users can submit pending cafes" ON public.pending_cafes;
CREATE POLICY "Anyone can submit pending cafes" ON public.pending_cafes
  FOR INSERT
  WITH CHECK (true);

-- Revert pending_equipment policies to original
DROP POLICY IF EXISTS "Authenticated users can submit pending equipment" ON public.pending_equipment;
CREATE POLICY "System can insert pending equipment" ON public.pending_equipment
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update pending equipment" ON public.pending_equipment;
CREATE POLICY "System can update pending equipment" ON public.pending_equipment
  FOR UPDATE
  USING (true);

-- Revert pending_roasters policies to original
DROP POLICY IF EXISTS "Authenticated users can submit pending roasters" ON public.pending_roasters;
CREATE POLICY "System can insert pending roasters" ON public.pending_roasters
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update pending roasters" ON public.pending_roasters;
CREATE POLICY "System can update pending roasters" ON public.pending_roasters
  FOR UPDATE
  USING (true);

-- Keep the equipment policy change (admin-only is correct for equipment table)
-- Don't revert this one

-- ==============================================================================
-- INSTRUCTIONS
-- ==============================================================================
-- 1. Copy this entire file
-- 2. Go to Supabase Dashboard > SQL Editor
-- 3. Paste and run
-- 4. Refresh the app - 406 errors should be gone
-- 5. We'll implement proper security differently
