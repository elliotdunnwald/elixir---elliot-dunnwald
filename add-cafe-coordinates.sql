-- Add latitude and longitude columns to cafes table for map integration
ALTER TABLE cafes
ADD COLUMN IF NOT EXISTS latitude numeric,
ADD COLUMN IF NOT EXISTS longitude numeric;

-- Add index for geospatial queries
CREATE INDEX IF NOT EXISTS idx_cafes_coordinates ON cafes(latitude, longitude);

-- Add comment for documentation
COMMENT ON COLUMN cafes.latitude IS 'Latitude coordinate for cafe location (decimal degrees)';
COMMENT ON COLUMN cafes.longitude IS 'Longitude coordinate for cafe location (decimal degrees)';
