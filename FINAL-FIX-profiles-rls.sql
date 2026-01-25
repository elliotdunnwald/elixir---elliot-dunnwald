-- ============================================
-- COMPLETE FIX FOR PROFILES RLS POLICIES
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================

-- STEP 1: Drop ALL existing policies (handles any naming variations)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', r.policyname);
    END LOOP;
END $$;

-- STEP 2: Create clean, simple, non-recursive policies

-- Allow users to view their own profile
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = auth_user_id);

-- Allow anyone to view public profiles
CREATE POLICY "profiles_select_public"
  ON profiles FOR SELECT
  USING (is_private = false);

-- Allow users to create their own profile
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = auth_user_id);

-- Allow users to update their own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- Allow users to delete their own profile
CREATE POLICY "profiles_delete_own"
  ON profiles FOR DELETE
  USING (auth.uid() = auth_user_id);

-- STEP 3: Verify policies were created (should show 5 policies)
SELECT
  tablename,
  policyname,
  cmd as operation,
  CASE
    WHEN cmd = 'SELECT' THEN 'Read profiles'
    WHEN cmd = 'INSERT' THEN 'Create profile'
    WHEN cmd = 'UPDATE' THEN 'Edit profile'
    WHEN cmd = 'DELETE' THEN 'Delete profile'
  END as description
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;
