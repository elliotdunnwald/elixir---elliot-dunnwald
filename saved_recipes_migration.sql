-- =====================================================
-- Add Saved Recipes Table
-- =====================================================

-- Create saved_recipes table
CREATE TABLE IF NOT EXISTS saved_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  original_activity_id UUID,
  original_user_username TEXT NOT NULL,
  selected_fields JSONB NOT NULL,
  recipe_data JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_saved_recipes_user_id ON saved_recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_recipes_original_activity ON saved_recipes(original_activity_id);
CREATE INDEX IF NOT EXISTS idx_saved_recipes_created_at ON saved_recipes(created_at DESC);

-- Enable RLS
ALTER TABLE saved_recipes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own saved recipes
CREATE POLICY "Users can view their own saved recipes"
  ON saved_recipes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own saved recipes
CREATE POLICY "Users can save recipes"
  ON saved_recipes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own saved recipes
CREATE POLICY "Users can update their own saved recipes"
  ON saved_recipes
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own saved recipes
CREATE POLICY "Users can delete their own saved recipes"
  ON saved_recipes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Comments for documentation
COMMENT ON TABLE saved_recipes IS 'Stores recipes saved by users from other users brews';
COMMENT ON COLUMN saved_recipes.selected_fields IS 'Array of field names the user chose to save';
COMMENT ON COLUMN saved_recipes.recipe_data IS 'Full brew data from the original activity';
