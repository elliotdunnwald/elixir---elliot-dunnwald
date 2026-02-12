-- First, let's check what the profiles table's auth_user_id column is called
-- The issue is likely that user_id in saved_recipes needs to match profiles.auth_user_id, not auth.uid() directly

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own saved recipes" ON saved_recipes;
DROP POLICY IF EXISTS "Users can view their own saved recipes" ON saved_recipes;
DROP POLICY IF EXISTS "Users can update their own saved recipes" ON saved_recipes;
DROP POLICY IF EXISTS "Users can delete their own saved recipes" ON saved_recipes;

-- Enable RLS on saved_recipes table
ALTER TABLE saved_recipes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own saved recipes
-- Using a subquery to match the profile's UUID to the auth user
CREATE POLICY "Users can insert their own saved recipes"
ON saved_recipes
FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()
  )
);

-- Policy: Users can view their own saved recipes
CREATE POLICY "Users can view their own saved recipes"
ON saved_recipes
FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()
  )
);

-- Policy: Users can update their own saved recipes (for notes)
CREATE POLICY "Users can update their own saved recipes"
ON saved_recipes
FOR UPDATE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()
  )
);

-- Policy: Users can delete their own saved recipes
CREATE POLICY "Users can delete their own saved recipes"
ON saved_recipes
FOR DELETE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()
  )
);
