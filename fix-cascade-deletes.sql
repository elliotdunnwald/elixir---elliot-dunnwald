-- Add CASCADE deletes to all foreign key constraints
-- This allows deleting a user to automatically delete all their related data

-- Drop existing foreign key constraints and recreate with CASCADE
-- Note: This will require dropping and recreating the constraints

-- brew_activities CASCADE
ALTER TABLE brew_activities DROP CONSTRAINT IF EXISTS brew_activities_profile_id_fkey;
ALTER TABLE brew_activities ADD CONSTRAINT brew_activities_profile_id_fkey
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- gear_items CASCADE
ALTER TABLE gear_items DROP CONSTRAINT IF EXISTS gear_items_profile_id_fkey;
ALTER TABLE gear_items ADD CONSTRAINT gear_items_profile_id_fkey
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- follows CASCADE (both directions)
ALTER TABLE follows DROP CONSTRAINT IF EXISTS follows_follower_id_fkey;
ALTER TABLE follows ADD CONSTRAINT follows_follower_id_fkey
  FOREIGN KEY (follower_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE follows DROP CONSTRAINT IF EXISTS follows_following_id_fkey;
ALTER TABLE follows ADD CONSTRAINT follows_following_id_fkey
  FOREIGN KEY (following_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- likes CASCADE
ALTER TABLE likes DROP CONSTRAINT IF EXISTS likes_profile_id_fkey;
ALTER TABLE likes ADD CONSTRAINT likes_profile_id_fkey
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE likes DROP CONSTRAINT IF EXISTS likes_activity_id_fkey;
ALTER TABLE likes ADD CONSTRAINT likes_activity_id_fkey
  FOREIGN KEY (activity_id) REFERENCES brew_activities(id) ON DELETE CASCADE;

-- comments CASCADE
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_profile_id_fkey;
ALTER TABLE comments ADD CONSTRAINT comments_profile_id_fkey
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_activity_id_fkey;
ALTER TABLE comments ADD CONSTRAINT comments_activity_id_fkey
  FOREIGN KEY (activity_id) REFERENCES brew_activities(id) ON DELETE CASCADE;

-- notifications CASCADE
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_profile_id_fkey;
ALTER TABLE notifications ADD CONSTRAINT notifications_profile_id_fkey
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_from_profile_id_fkey;
ALTER TABLE notifications ADD CONSTRAINT notifications_from_profile_id_fkey
  FOREIGN KEY (from_profile_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_activity_id_fkey;
ALTER TABLE notifications ADD CONSTRAINT notifications_activity_id_fkey
  FOREIGN KEY (activity_id) REFERENCES brew_activities(id) ON DELETE CASCADE;

-- follow_requests CASCADE
ALTER TABLE follow_requests DROP CONSTRAINT IF EXISTS follow_requests_requester_id_fkey;
ALTER TABLE follow_requests ADD CONSTRAINT follow_requests_requester_id_fkey
  FOREIGN KEY (requester_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE follow_requests DROP CONSTRAINT IF EXISTS follow_requests_requested_id_fkey;
ALTER TABLE follow_requests ADD CONSTRAINT follow_requests_requested_id_fkey
  FOREIGN KEY (requested_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Create a function to completely delete a user by email
CREATE OR REPLACE FUNCTION delete_user_by_email(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_auth_id UUID;
  user_profile_id UUID;
BEGIN
  -- Get the auth_user_id from profiles
  SELECT auth_user_id, id INTO user_auth_id, user_profile_id
  FROM profiles
  WHERE email = user_email
  LIMIT 1;

  IF user_auth_id IS NULL THEN
    RAISE NOTICE 'No user found with email: %', user_email;
    RETURN FALSE;
  END IF;

  -- Delete the profile (CASCADE will handle all related data)
  DELETE FROM profiles WHERE id = user_profile_id;

  -- Delete from auth.users (requires admin privileges)
  -- This part needs to be done via Supabase Dashboard or Admin API
  RAISE NOTICE 'Profile deleted. Now delete auth user: % from Authentication > Users', user_auth_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to delete duplicate profiles for the same email
CREATE OR REPLACE FUNCTION delete_duplicate_profiles(user_email TEXT)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  keeper_id UUID;
BEGIN
  -- Keep the most recent profile
  SELECT id INTO keeper_id
  FROM profiles
  WHERE email = user_email
  ORDER BY created_at DESC
  LIMIT 1;

  -- Delete all other profiles with same email
  DELETE FROM profiles
  WHERE email = user_email
    AND id != keeper_id;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RAISE NOTICE 'Deleted % duplicate profiles for email: %', deleted_count, user_email;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Usage examples (uncomment to run):
-- To delete all data for a user:
-- SELECT delete_user_by_email('elliotdunnwald@gmail.com');

-- To delete duplicate profiles but keep the newest one:
-- SELECT delete_duplicate_profiles('elliotdunnwald@gmail.com');
