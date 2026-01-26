-- Add brew_type column to brew_activities table
-- This allows tracking whether a brew is espresso or filter

ALTER TABLE brew_activities
ADD COLUMN IF NOT EXISTS brew_type TEXT CHECK (brew_type IN ('espresso', 'filter'));

-- Set default to 'filter' for existing records
UPDATE brew_activities
SET brew_type = 'filter'
WHERE brew_type IS NULL;

-- Create an index for faster filtering
CREATE INDEX IF NOT EXISTS idx_brew_activities_brew_type ON brew_activities(brew_type);
