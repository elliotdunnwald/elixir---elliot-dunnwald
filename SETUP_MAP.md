# Map Setup Instructions

## Step 1: Run Database Migration

Open your Supabase SQL Editor and run this SQL:

```sql
-- Add latitude and longitude columns to cafes table
ALTER TABLE cafes
ADD COLUMN IF NOT EXISTS latitude numeric,
ADD COLUMN IF NOT EXISTS longitude numeric;

-- Add index for geospatial queries
CREATE INDEX IF NOT EXISTS idx_cafes_coordinates ON cafes(latitude, longitude);

-- Add comments for documentation
COMMENT ON COLUMN cafes.latitude IS 'Latitude coordinate for cafe location (decimal degrees)';
COMMENT ON COLUMN cafes.longitude IS 'Longitude coordinate for cafe location (decimal degrees)';
```

## Step 2: Geocode Existing SEY Cafe

Run this SQL to manually add coordinates for SEY cafe (if it already exists):

```sql
-- Update SEY cafe with coordinates (Williamsburg, Brooklyn)
UPDATE cafes
SET
  latitude = 40.7133,
  longitude = -73.9597
WHERE name ILIKE '%SEY%'
AND city ILIKE '%BROOKLYN%';
```

Or just re-approve it in Admin panel and it will auto-geocode!

## Step 3: Test the Map

1. Go to Explore → Cafes tab
2. You should see the map with SEY marked
3. Click the marker to see cafe details
4. Click "View Cafe" button to go to cafe profile

## Troubleshooting

### "Cafe not found" error
This happens if:
- The cafe ID in the URL doesn't match database
- Check browser console for errors
- Verify cafe exists: `SELECT * FROM cafes WHERE name ILIKE '%sey%';`

### Map shows "No cafes with location data"
- Migration not run yet
- Cafe doesn't have coordinates
- Run the UPDATE query above

### SEY doesn't show on map
- Check if coordinates exist:
```sql
SELECT name, city, latitude, longitude
FROM cafes
WHERE name ILIKE '%sey%';
```

If latitude/longitude are NULL, run the UPDATE query from Step 2.
