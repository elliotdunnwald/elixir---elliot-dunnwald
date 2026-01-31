-- Add producer column to coffee_offerings table
ALTER TABLE coffee_offerings
ADD COLUMN IF NOT EXISTS producer TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_coffee_offerings_producer ON coffee_offerings(producer);
