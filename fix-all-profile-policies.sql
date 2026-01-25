-- COMPLETE FIX for profile RLS policies
-- This removes ALL policies and creates clean, non-recursive ones
-- Run this in your Supabase SQL Editor

-- ============================================
-- STEP 1: Drop ALL existing policies on profiles
-- ============================================
DROP POLICY IF EXISTS "Public profiles viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Followers can view private profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;

-- ============================================
-- STEP 2: Create clean, simple policies
-- ============================================

-- SELECT policies (no recursion!)
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = auth_user_id);

CREATE POLICY "profiles_select_public"
  ON profiles FOR SELECT
  USING (is_private = false);

-- INSERT policy (users can create their own profile)
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = auth_user_id);

-- UPDATE policy (users can update their own profile)
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- DELETE policy (users can delete their own profile)
CREATE POLICY "profiles_delete_own"
  ON profiles FOR DELETE
  USING (auth.uid() = auth_user_id);

-- ============================================
-- STEP 3: Verify
-- ============================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;
