-- Create pending_equipment table to track equipment submissions
CREATE TABLE IF NOT EXISTS pending_equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_name text NOT NULL,
  equipment_type text NOT NULL CHECK (equipment_type IN ('brewer', 'grinder', 'filter', 'water', 'accessory')),
  brand text,
  description text,
  submission_count integer DEFAULT 1,
  first_submitted_at timestamptz DEFAULT now(),
  last_submitted_at timestamptz DEFAULT now(),
  submitted_by_users text[] DEFAULT ARRAY[]::text[],
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_at timestamptz,
  approved_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Create unique index on equipment_name + type (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS pending_equipment_name_type_unique
  ON pending_equipment (LOWER(equipment_name), equipment_type);

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS pending_equipment_status_idx ON pending_equipment (status);

-- Create index for sorting by submission count
CREATE INDEX IF NOT EXISTS pending_equipment_count_idx ON pending_equipment (submission_count DESC);

-- Enable RLS
ALTER TABLE pending_equipment ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view pending equipment
CREATE POLICY "Anyone can view pending equipment"
  ON pending_equipment FOR SELECT
  USING (true);

-- Policy: System can insert/update pending equipment
CREATE POLICY "System can insert pending equipment"
  ON pending_equipment FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update pending equipment"
  ON pending_equipment FOR UPDATE
  USING (true);

-- Function to track equipment submissions
CREATE OR REPLACE FUNCTION track_equipment_submission(
  p_equipment_name text,
  p_equipment_type text,
  p_brand text,
  p_description text,
  p_user_id text
) RETURNS void AS $$
BEGIN
  INSERT INTO pending_equipment (
    equipment_name,
    equipment_type,
    brand,
    description,
    submission_count,
    submitted_by_users
  )
  VALUES (
    p_equipment_name,
    p_equipment_type,
    p_brand,
    p_description,
    1,
    ARRAY[p_user_id]
  )
  ON CONFLICT (LOWER(equipment_name), equipment_type)
  DO UPDATE SET
    submission_count = pending_equipment.submission_count + 1,
    last_submitted_at = now(),
    submitted_by_users = array_append(pending_equipment.submitted_by_users, p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION track_equipment_submission TO authenticated;
GRANT EXECUTE ON FUNCTION track_equipment_submission TO anon;

-- Create equipment table for approved equipment
CREATE TABLE IF NOT EXISTS equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brand text NOT NULL,
  type text NOT NULL CHECK (type IN ('brewer', 'grinder', 'filter', 'water', 'accessory')),
  description text,
  image_url text,
  price numeric,
  website_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for type filtering
CREATE INDEX IF NOT EXISTS equipment_type_idx ON equipment (type);

-- Enable RLS
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view equipment
CREATE POLICY "Anyone can view equipment"
  ON equipment FOR SELECT
  USING (true);

-- Policy: Admin can insert/update/delete equipment
CREATE POLICY "Admin can manage equipment"
  ON equipment FOR ALL
  USING (true)
  WITH CHECK (true);
