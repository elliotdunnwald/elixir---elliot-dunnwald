-- Create pending_roasters table to track roaster submissions from brew logs
CREATE TABLE IF NOT EXISTS pending_roasters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roaster_name text NOT NULL,
  city text,
  country text,
  state text,
  website text,
  submission_count integer DEFAULT 1,
  first_submitted_at timestamptz DEFAULT now(),
  last_submitted_at timestamptz DEFAULT now(),
  submitted_by_users text[] DEFAULT ARRAY[]::text[],
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_at timestamptz,
  approved_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Create unique index on roaster_name (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS pending_roasters_name_unique ON pending_roasters (LOWER(roaster_name));

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS pending_roasters_status_idx ON pending_roasters (status);

-- Create index for sorting by submission count
CREATE INDEX IF NOT EXISTS pending_roasters_count_idx ON pending_roasters (submission_count DESC);

-- Enable RLS
ALTER TABLE pending_roasters ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view pending roasters
CREATE POLICY "Anyone can view pending roasters"
  ON pending_roasters FOR SELECT
  USING (true);

-- Policy: System can insert/update pending roasters (handled via service)
CREATE POLICY "System can insert pending roasters"
  ON pending_roasters FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update pending roasters"
  ON pending_roasters FOR UPDATE
  USING (true);

-- Function to track roaster submissions
CREATE OR REPLACE FUNCTION track_roaster_submission(
  p_roaster_name text,
  p_user_id text,
  p_city text DEFAULT NULL,
  p_country text DEFAULT NULL,
  p_state text DEFAULT NULL,
  p_website text DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO pending_roasters (roaster_name, city, country, state, website, submission_count, submitted_by_users)
  VALUES (p_roaster_name, p_city, p_country, p_state, p_website, 1, ARRAY[p_user_id])
  ON CONFLICT (LOWER(roaster_name))
  DO UPDATE SET
    submission_count = pending_roasters.submission_count + 1,
    last_submitted_at = now(),
    submitted_by_users = array_append(pending_roasters.submitted_by_users, p_user_id),
    -- Update location/website if new submission has it and existing doesn't
    city = COALESCE(pending_roasters.city, p_city),
    country = COALESCE(pending_roasters.country, p_country),
    state = COALESCE(pending_roasters.state, p_state),
    website = COALESCE(pending_roasters.website, p_website);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION track_roaster_submission TO authenticated;
GRANT EXECUTE ON FUNCTION track_roaster_submission TO anon;
