-- ELIXR Supabase Database Schema
-- Run this script in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- 1. Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  username TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  pronouns TEXT,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Gear items table
CREATE TABLE gear_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles NOT NULL,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('brewer', 'grinder', 'espresso', 'accessory')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Brew activities table
CREATE TABLE brew_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  location_name TEXT NOT NULL,
  roaster TEXT NOT NULL,
  bean_origin TEXT NOT NULL,
  estate TEXT,
  varietal TEXT,
  process TEXT,
  brewer TEXT NOT NULL,
  grinder TEXT,
  grind_setting TEXT,
  ratio TEXT NOT NULL,
  grams_in NUMERIC NOT NULL,
  grams_out NUMERIC NOT NULL,
  brew_weight NUMERIC,
  temperature NUMERIC NOT NULL,
  temp_unit TEXT DEFAULT 'C' CHECK (temp_unit IN ('C', 'F')),
  brew_time TEXT NOT NULL,
  rating NUMERIC NOT NULL CHECK (rating >= 0 AND rating <= 5),
  tds NUMERIC,
  ey_percentage NUMERIC,
  show_parameters BOOLEAN DEFAULT true,
  is_private BOOLEAN DEFAULT false,
  is_cafe_log BOOLEAN DEFAULT false,
  cafe_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Follows table (social graph)
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES profiles NOT NULL,
  following_id UUID REFERENCES profiles NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- 5. Likes table
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles NOT NULL,
  activity_id UUID REFERENCES brew_activities NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id, activity_id)
);

-- 6. Comments table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID REFERENCES brew_activities NOT NULL,
  profile_id UUID REFERENCES profiles NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_activities_profile_created ON brew_activities(profile_id, created_at DESC);
CREATE INDEX idx_activities_created ON brew_activities(created_at DESC);
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
CREATE INDEX idx_likes_activity ON likes(activity_id);
CREATE INDEX idx_likes_profile ON likes(profile_id);
CREATE INDEX idx_comments_activity ON comments(activity_id, created_at ASC);
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_gear_profile ON gear_items(profile_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gear_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE brew_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
-- Anyone can view public profiles
CREATE POLICY "Public profiles viewable by everyone"
  ON profiles FOR SELECT
  USING (is_private = false);

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = auth_user_id);

-- Followers can view private profiles
CREATE POLICY "Followers can view private profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM follows
      WHERE follows.following_id = profiles.id
        AND follows.follower_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
    )
  );

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = auth_user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = auth_user_id);

-- Users can delete their own profile
CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = auth_user_id);

-- GEAR ITEMS POLICIES
-- Users can view gear for profiles they can see
CREATE POLICY "View gear for visible profiles"
  ON gear_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = gear_items.profile_id
        AND (
          profiles.is_private = false
          OR profiles.auth_user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM follows
            WHERE follows.following_id = profiles.id
              AND follows.follower_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
          )
        )
    )
  );

-- Users can manage their own gear
CREATE POLICY "Users manage own gear"
  ON gear_items FOR ALL
  USING (profile_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()))
  WITH CHECK (profile_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

-- BREW ACTIVITIES POLICIES
-- Anyone can view public activities
CREATE POLICY "Public activities viewable by everyone"
  ON brew_activities FOR SELECT
  USING (is_private = false);

-- Users can view their own activities
CREATE POLICY "Users can view own activities"
  ON brew_activities FOR SELECT
  USING (profile_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

-- Followers can view private activities
CREATE POLICY "Followers can view private activities"
  ON brew_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM follows
      WHERE follows.following_id = brew_activities.profile_id
        AND follows.follower_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
    )
  );

-- Users can create their own activities
CREATE POLICY "Users can create own activities"
  ON brew_activities FOR INSERT
  WITH CHECK (profile_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

-- Users can update their own activities
CREATE POLICY "Users can update own activities"
  ON brew_activities FOR UPDATE
  USING (profile_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

-- Users can delete their own activities
CREATE POLICY "Users can delete own activities"
  ON brew_activities FOR DELETE
  USING (profile_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

-- FOLLOWS POLICIES
-- Anyone can view follows (for follower counts and social graph)
CREATE POLICY "Anyone can view follows"
  ON follows FOR SELECT
  USING (true);

-- Users can follow others
CREATE POLICY "Users can follow others"
  ON follows FOR INSERT
  WITH CHECK (follower_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

-- Users can unfollow others
CREATE POLICY "Users can unfollow others"
  ON follows FOR DELETE
  USING (follower_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

-- LIKES POLICIES
-- Anyone can view likes
CREATE POLICY "Anyone can view likes"
  ON likes FOR SELECT
  USING (true);

-- Users can like activities they can see
CREATE POLICY "Users can like visible activities"
  ON likes FOR INSERT
  WITH CHECK (
    profile_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM brew_activities
      WHERE brew_activities.id = likes.activity_id
        AND (
          brew_activities.is_private = false
          OR brew_activities.profile_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
          OR EXISTS (
            SELECT 1 FROM follows
            WHERE follows.following_id = brew_activities.profile_id
              AND follows.follower_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
          )
        )
    )
  );

-- Users can unlike their own likes
CREATE POLICY "Users can unlike own likes"
  ON likes FOR DELETE
  USING (profile_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

-- COMMENTS POLICIES
-- Users can view comments on activities they can see
CREATE POLICY "View comments on visible activities"
  ON comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM brew_activities
      WHERE brew_activities.id = comments.activity_id
        AND (
          brew_activities.is_private = false
          OR brew_activities.profile_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
          OR EXISTS (
            SELECT 1 FROM follows
            WHERE follows.following_id = brew_activities.profile_id
              AND follows.follower_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
          )
        )
    )
  );

-- Users can comment on activities they can see
CREATE POLICY "Users can comment on visible activities"
  ON comments FOR INSERT
  WITH CHECK (
    profile_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM brew_activities
      WHERE brew_activities.id = comments.activity_id
        AND (
          brew_activities.is_private = false
          OR brew_activities.profile_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
          OR EXISTS (
            SELECT 1 FROM follows
            WHERE follows.following_id = brew_activities.profile_id
              AND follows.follower_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
          )
        )
    )
  );

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING (profile_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (profile_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brew_activities_updated_at
  BEFORE UPDATE ON brew_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STORAGE BUCKET SETUP
-- =====================================================
-- Note: Run these commands in the Supabase Storage UI or via SQL:
-- 1. Create bucket named 'brew-images'
-- 2. Set as public bucket
-- 3. Add policy for authenticated uploads:
--
-- CREATE POLICY "Authenticated users can upload brew images"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'brew-images' AND auth.role() = 'authenticated');
--
-- CREATE POLICY "Anyone can view brew images"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'brew-images');
--
-- CREATE POLICY "Users can update their own images"
--   ON storage.objects FOR UPDATE
--   USING (bucket_id = 'brew-images' AND auth.uid()::text = (storage.foldername(name))[1]);
--
-- CREATE POLICY "Users can delete their own images"
--   ON storage.objects FOR DELETE
--   USING (bucket_id = 'brew-images' AND auth.uid()::text = (storage.foldername(name))[1]);
