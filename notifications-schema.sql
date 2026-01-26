-- Create follow_requests table for private profile follows
CREATE TABLE IF NOT EXISTS follow_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  requested_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(requester_id, requested_id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('like', 'comment', 'follow_request', 'follow_accepted', 'follow')),
  from_profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  activity_id uuid REFERENCES brew_activities(id) ON DELETE CASCADE,
  follow_request_id uuid REFERENCES follow_requests(id) ON DELETE CASCADE,
  comment_text text,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_follow_requests_requester ON follow_requests(requester_id);
CREATE INDEX idx_follow_requests_requested ON follow_requests(requested_id);
CREATE INDEX idx_follow_requests_status ON follow_requests(status);
CREATE INDEX idx_notifications_profile ON notifications(profile_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- RLS Policies for follow_requests
ALTER TABLE follow_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can see their own sent or received requests
CREATE POLICY "Users can view their follow requests"
  ON follow_requests FOR SELECT
  USING (
    requester_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
    OR requested_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
  );

-- Anyone can create a follow request
CREATE POLICY "Users can create follow requests"
  ON follow_requests FOR INSERT
  WITH CHECK (
    requester_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
  );

-- Only the requested user can update (accept/reject)
CREATE POLICY "Users can update their received requests"
  ON follow_requests FOR UPDATE
  USING (requested_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

-- Users can delete their own sent requests
CREATE POLICY "Users can delete their sent requests"
  ON follow_requests FOR DELETE
  USING (requester_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

-- RLS Policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can see their own notifications
CREATE POLICY "Users can view their notifications"
  ON notifications FOR SELECT
  USING (profile_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

-- System can create notifications (handled via database functions)
CREATE POLICY "Anyone can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their notifications"
  ON notifications FOR UPDATE
  USING (profile_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

-- Users can delete their own notifications
CREATE POLICY "Users can delete their notifications"
  ON notifications FOR DELETE
  USING (profile_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

-- Update profiles RLS to allow searching private profiles
DROP POLICY IF EXISTS "Private profiles viewable by followers" ON profiles;
CREATE POLICY "All profiles are searchable"
  ON profiles FOR SELECT
  USING (true);

-- Function to create notification on like
CREATE OR REPLACE FUNCTION create_like_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (profile_id, type, from_profile_id, activity_id)
  SELECT
    ba.profile_id,
    'like',
    NEW.profile_id,
    NEW.activity_id
  FROM brew_activities ba
  WHERE ba.id = NEW.activity_id
    AND ba.profile_id != NEW.profile_id; -- Don't notify if user likes their own post
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_like_created
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION create_like_notification();

-- Function to create notification on comment
CREATE OR REPLACE FUNCTION create_comment_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (profile_id, type, from_profile_id, activity_id, comment_text)
  SELECT
    ba.profile_id,
    'comment',
    NEW.profile_id,
    NEW.activity_id,
    NEW.text
  FROM brew_activities ba
  WHERE ba.id = NEW.activity_id
    AND ba.profile_id != NEW.profile_id; -- Don't notify if user comments on their own post
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_comment_created
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION create_comment_notification();

-- Function to create notification on follow request
CREATE OR REPLACE FUNCTION create_follow_request_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (profile_id, type, from_profile_id, follow_request_id)
  VALUES (NEW.requested_id, 'follow_request', NEW.requester_id, NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_follow_request_created
  AFTER INSERT ON follow_requests
  FOR EACH ROW
  EXECUTE FUNCTION create_follow_request_notification();

-- Function to create notification when follow request is accepted
CREATE OR REPLACE FUNCTION create_follow_accepted_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO notifications (profile_id, type, from_profile_id)
    VALUES (NEW.requester_id, 'follow_accepted', NEW.requested_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_follow_request_accepted
  AFTER UPDATE ON follow_requests
  FOR EACH ROW
  EXECUTE FUNCTION create_follow_accepted_notification();

-- Function to create notification on direct follow (public profiles)
CREATE OR REPLACE FUNCTION create_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (profile_id, type, from_profile_id)
  VALUES (NEW.following_id, 'follow', NEW.follower_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_follow_created
  AFTER INSERT ON follows
  FOR EACH ROW
  EXECUTE FUNCTION create_follow_notification();
