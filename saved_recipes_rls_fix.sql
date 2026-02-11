-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own saved recipes" ON saved_recipes;
DROP POLICY IF EXISTS "Users can view their own saved recipes" ON saved_recipes;
DROP POLICY IF EXISTS "Users can update their own saved recipes" ON saved_recipes;
DROP POLICY IF EXISTS "Users can delete their own saved recipes" ON saved_recipes;

-- Enable RLS on saved_recipes table (if not already enabled)
ALTER TABLE saved_recipes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own saved recipes
CREATE POLICY "Users can insert their own saved recipes"
ON saved_recipes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own saved recipes
CREATE POLICY "Users can view their own saved recipes"
ON saved_recipes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can update their own saved recipes (for notes)
CREATE POLICY "Users can update their own saved recipes"
ON saved_recipes
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own saved recipes
CREATE POLICY "Users can delete their own saved recipes"
ON saved_recipes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
