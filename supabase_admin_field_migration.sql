-- Add is_admin field to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Create index for admin lookups
CREATE INDEX IF NOT EXISTS profiles_is_admin_idx ON profiles (is_admin);

-- Function to easily set admin status (run this with your user ID)
-- Example: SELECT set_admin_status('your-profile-id-here', true);
CREATE OR REPLACE FUNCTION set_admin_status(
  p_profile_id uuid,
  p_is_admin boolean
) RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET is_admin = p_is_admin
  WHERE id = p_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION set_admin_status TO authenticated;
