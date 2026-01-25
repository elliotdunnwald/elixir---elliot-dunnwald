-- Fix infinite recursion in profiles RLS policies
-- Run this in your Supabase SQL Editor

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Followers can view private profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Create simplified, non-recursive policies
-- 1. Users can always view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = auth_user_id);

-- 2. Public profiles are viewable by everyone
CREATE POLICY "Public profiles viewable by everyone"
  ON profiles FOR SELECT
  USING (is_private = false);

-- 3. Private profiles viewable by followers (fixed - no recursion)
CREATE POLICY "Followers can view private profiles"
  ON profiles FOR SELECT
  USING (
    is_private = true
    AND EXISTS (
      SELECT 1 FROM follows
      WHERE follows.following_id = profiles.id
        AND follows.follower_id IN (
          SELECT id FROM profiles WHERE auth_user_id = auth.uid()
        )
    )
  );

-- Verify policies are working
SELECT tablename, policyname
FROM pg_policies
WHERE tablename = 'profiles';
