-- Add milk and pod machine columns to brew_activities table

-- Milk fields
ALTER TABLE brew_activities
ADD COLUMN IF NOT EXISTS milk_type TEXT CHECK (milk_type IN ('none', 'steamed', 'cold'));

ALTER TABLE brew_activities
ADD COLUMN IF NOT EXISTS steamed_drink TEXT CHECK (steamed_drink IN ('macchiato', 'cortado', 'flatwhite', 'cappuccino', 'latte'));

ALTER TABLE brew_activities
ADD COLUMN IF NOT EXISTS drink_size INTEGER;

ALTER TABLE brew_activities
ADD COLUMN IF NOT EXISTS cold_milk_oz NUMERIC;

-- Pod machine fields
ALTER TABLE brew_activities
ADD COLUMN IF NOT EXISTS pod_size TEXT CHECK (pod_size IN ('small', 'medium', 'large'));

ALTER TABLE brew_activities
ADD COLUMN IF NOT EXISTS pod_name TEXT;

-- Create indexes for filtering
CREATE INDEX IF NOT EXISTS idx_brew_activities_milk_type ON brew_activities(milk_type);
CREATE INDEX IF NOT EXISTS idx_brew_activities_steamed_drink ON brew_activities(steamed_drink);
