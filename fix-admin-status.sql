-- Fix admin status for elliotdunnwald
UPDATE profiles
SET is_admin = true
WHERE username = 'elliotdunnwald';

-- Verify the update
SELECT username, is_admin, email
FROM profiles
WHERE username = 'elliotdunnwald';
