-- Create pending_coffee_offerings table
CREATE TABLE IF NOT EXISTS pending_coffee_offerings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roaster_name text NOT NULL,
  coffee_name text NOT NULL,
  origin text NOT NULL,
  estate text,
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

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_pending_coffees_status ON pending_coffee_offerings(status);
CREATE INDEX IF NOT EXISTS idx_pending_coffees_roaster ON pending_coffee_offerings(roaster_name);

-- RLS policies
ALTER TABLE pending_coffee_offerings ENABLE ROW LEVEL SECURITY;

-- Anyone can view pending coffees
CREATE POLICY "Anyone can view pending coffees"
  ON pending_coffee_offerings FOR SELECT
  USING (true);

-- Anyone authenticated can submit
CREATE POLICY "Authenticated users can submit coffees"
  ON pending_coffee_offerings FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Only admins can update
CREATE POLICY "Admins can update pending coffees"
  ON pending_coffee_offerings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE auth_user_id = auth.uid()
      AND is_admin = true
    )
  );

-- Function to track coffee submissions (similar to roaster tracking)
CREATE OR REPLACE FUNCTION track_coffee_submission(
  p_roaster_name text,
  p_coffee_name text,
  p_origin text,
  p_user_id uuid,
  p_estate text DEFAULT NULL,
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
      varietal,
      process,
      submitted_by_users
    ) VALUES (
      TRIM(p_roaster_name),
      TRIM(p_coffee_name),
      TRIM(p_origin),
      NULLIF(TRIM(p_estate), ''),
      NULLIF(TRIM(p_varietal), ''),
      NULLIF(TRIM(p_process), ''),
      ARRAY[p_user_id::text]
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION track_coffee_submission TO authenticated;
