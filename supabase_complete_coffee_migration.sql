-- Complete Coffee Offerings Migration
-- This script handles everything: table creation, lot field, and cleanup

-- Step 1: Create pending_coffee_offerings table if it doesn't exist
CREATE TABLE IF NOT EXISTS pending_coffee_offerings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roaster_name text NOT NULL,
  coffee_name text NOT NULL,
  origin text NOT NULL,
  estate text,
  lot text,
  varietal text,
  process text,
  submission_count integer DEFAULT 1,
  first_submitted_at timestamptz DEFAULT now(),
  last_submitted_at timestamptz DEFAULT now(),
  submitted_by_users text[] DEFAULT '{}',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_at timestamptz,
  approved_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Step 2: Add lot field to brew_activities table
ALTER TABLE brew_activities
ADD COLUMN IF NOT EXISTS lot text;

-- Step 3: Add lot field to pending_coffee_offerings if missing
ALTER TABLE pending_coffee_offerings
ADD COLUMN IF NOT EXISTS lot text;

-- Step 4: Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_pending_coffees_status ON pending_coffee_offerings(status);
CREATE INDEX IF NOT EXISTS idx_pending_coffees_roaster ON pending_coffee_offerings(roaster_name);

-- Step 5: Enable RLS
ALTER TABLE pending_coffee_offerings ENABLE ROW LEVEL SECURITY;

-- Step 6: Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view pending coffees" ON pending_coffee_offerings;
DROP POLICY IF EXISTS "Authenticated users can submit coffees" ON pending_coffee_offerings;
DROP POLICY IF EXISTS "Admins can update pending coffees" ON pending_coffee_offerings;

-- Step 7: Create RLS policies
CREATE POLICY "Anyone can view pending coffees"
  ON pending_coffee_offerings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can submit coffees"
  ON pending_coffee_offerings FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update pending coffees"
  ON pending_coffee_offerings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE auth_user_id = auth.uid()
      AND is_admin = true
    )
  );

-- Step 8: Clear all pending coffees (for clean re-backfill with proper names)
DELETE FROM pending_coffee_offerings WHERE status = 'pending';

-- Step 9: Drop old function signature (without lot parameter)
DROP FUNCTION IF EXISTS track_coffee_submission(text, text, text, uuid, text, text, text);

-- Step 10: Create/update track_coffee_submission function with lot parameter
CREATE OR REPLACE FUNCTION track_coffee_submission(
  p_roaster_name text,
  p_coffee_name text,
  p_origin text,
  p_user_id uuid,
  p_estate text DEFAULT NULL,
  p_lot text DEFAULT NULL,
  p_varietal text DEFAULT NULL,
  p_process text DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_existing_id uuid;
BEGIN
  -- Check if this coffee is already pending
  SELECT id INTO v_existing_id
  FROM pending_coffee_offerings
  WHERE LOWER(TRIM(roaster_name)) = LOWER(TRIM(p_roaster_name))
    AND LOWER(TRIM(coffee_name)) = LOWER(TRIM(p_coffee_name))
    AND LOWER(TRIM(origin)) = LOWER(TRIM(p_origin))
    AND status = 'pending'
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    -- Update existing pending coffee
    UPDATE pending_coffee_offerings
    SET submission_count = submission_count + 1,
        last_submitted_at = now(),
        submitted_by_users = array_append(submitted_by_users, p_user_id::text),
        -- Update fields if they're null and new data provided
        estate = COALESCE(estate, p_estate),
        lot = COALESCE(lot, p_lot),
        varietal = COALESCE(varietal, p_varietal),
        process = COALESCE(process, p_process),
        updated_at = now()
    WHERE id = v_existing_id;
  ELSE
    -- Insert new pending coffee
    INSERT INTO pending_coffee_offerings (
      roaster_name,
      coffee_name,
      origin,
      estate,
      lot,
      varietal,
      process,
      submitted_by_users
    ) VALUES (
      TRIM(p_roaster_name),
      TRIM(p_coffee_name),
      TRIM(p_origin),
      NULLIF(TRIM(p_estate), ''),
      NULLIF(TRIM(p_lot), ''),
      NULLIF(TRIM(p_varietal), ''),
      NULLIF(TRIM(p_process), ''),
      ARRAY[p_user_id::text]
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 11: Grant execute permission
GRANT EXECUTE ON FUNCTION track_coffee_submission TO authenticated;

-- ✅ Done! Next steps:
-- 1. Go to Admin Coffees page in app
-- 2. Click "BACKFILL FROM LOGS" button
-- 3. Coffees will populate with proper names (Estate + Lot format, e.g., "Elida Estate Vuelta")
