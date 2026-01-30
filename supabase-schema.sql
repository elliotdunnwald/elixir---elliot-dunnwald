-- =====================================================
-- ELIXR Database Schema - Complete Setup
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id uuid REFERENCES auth.users NOT NULL UNIQUE,
  username text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  pronouns text,
  city text NOT NULL,
  country text NOT NULL,
  avatar_url text,
  bio text,
  is_private boolean DEFAULT false,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Gear Items Table
CREATE TABLE IF NOT EXISTS gear_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  brand text NOT NULL,
  type text NOT NULL CHECK (type IN ('brewer', 'grinder', 'espresso', 'accessory')),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Brew Activities Table
CREATE TABLE IF NOT EXISTS brew_activities (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  image_url text,
  location_name text NOT NULL,
  roaster text NOT NULL,
  bean_origin text NOT NULL,
  estate text,
  lot text,
  varietal text,
  process text,
  brew_type text NOT NULL CHECK (brew_type IN ('espresso', 'filter')),
  brewer text NOT NULL,
  grinder text,
  grind_setting text,
  ratio text NOT NULL,
  grams_in numeric NOT NULL,
  grams_out numeric NOT NULL,
  brew_weight numeric,
  temperature numeric NOT NULL,
  temp_unit text DEFAULT 'C' CHECK (temp_unit IN ('C', 'F')),
  brew_time text NOT NULL,
  rating numeric NOT NULL CHECK (rating >= 0 AND rating <= 10),
  tds numeric,
  ey_percentage numeric,
  show_parameters boolean DEFAULT true,
  is_private boolean DEFAULT false,
  is_cafe_log boolean DEFAULT false,
  cafe_name text,
  cafe_city text,
  cafe_country text,
  cafe_address text,
  drink_ordered text,
  milk_type text CHECK (milk_type IN ('none', 'steamed', 'cold')),
  steamed_drink text CHECK (steamed_drink IN ('macchiato', 'cortado', 'flatwhite', 'cappuccino', 'latte')),
  drink_size integer,
  cold_milk_oz numeric,
  pod_size text CHECK (pod_size IN ('small', 'medium', 'large')),
  pod_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Follows Table
CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Likes Table
CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  activity_id uuid REFERENCES brew_activities(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(profile_id, activity_id)
);

-- Comments Table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id uuid REFERENCES brew_activities(id) ON DELETE CASCADE NOT NULL,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  text text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Cafes Table
CREATE TABLE IF NOT EXISTS cafes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  city text NOT NULL,
  country text NOT NULL,
  address text,
  visit_count integer DEFAULT 0,
  average_rating numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(name, city, country)
);

-- Roasters Table
CREATE TABLE IF NOT EXISTS roasters (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  city text NOT NULL,
  state text,
  country text NOT NULL,
  website text,
  founded_year integer,
  created_at timestamptz DEFAULT now()
);

-- Coffee Offerings Table (Optional)
CREATE TABLE IF NOT EXISTS coffee_offerings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  roaster_id uuid REFERENCES roasters(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  lot text NOT NULL,
  origin text NOT NULL,
  region text,
  estate text,
  varietals text[] NOT NULL,
  processing text NOT NULL,
  roast_level text,
  tasting_notes text[],
  elevation text,
  available boolean DEFAULT true,
  price numeric,
  size text,
  harvest_date date,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_brew_activities_profile_created ON brew_activities(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_brew_activities_created ON brew_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_brew_activities_cafe_log ON brew_activities(is_cafe_log) WHERE is_cafe_log = true;
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_likes_activity ON likes(activity_id);
CREATE INDEX IF NOT EXISTS idx_likes_profile ON likes(profile_id);
CREATE INDEX IF NOT EXISTS idx_comments_activity ON comments(activity_id);
CREATE INDEX IF NOT EXISTS idx_comments_profile ON comments(profile_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user ON profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_cafes_name ON cafes(name);
CREATE INDEX IF NOT EXISTS idx_cafes_city_country ON cafes(city, country);

-- =====================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brew_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE gear_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cafes ENABLE ROW LEVEL SECURITY;
ALTER TABLE roasters ENABLE ROW LEVEL SECURITY;
ALTER TABLE coffee_offerings ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can delete their own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = auth_user_id);

-- Brew Activities Policies
CREATE POLICY "Public brews are viewable by everyone"
  ON brew_activities FOR SELECT
  USING (
    is_private = false OR
    profile_id IN (
      SELECT id FROM profiles WHERE auth_user_id = auth.uid()
    ) OR
    profile_id IN (
      SELECT following_id FROM follows
      WHERE follower_id IN (
        SELECT id FROM profiles WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert their own activities"
  ON brew_activities FOR INSERT
  WITH CHECK (
    profile_id IN (
      SELECT id FROM profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own activities"
  ON brew_activities FOR UPDATE
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own activities"
  ON brew_activities FOR DELETE
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Follows Policies
CREATE POLICY "Follows are viewable by everyone"
  ON follows FOR SELECT
  USING (true);

CREATE POLICY "Users can follow anyone"
  ON follows FOR INSERT
  WITH CHECK (
    follower_id IN (
      SELECT id FROM profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE
  USING (
    follower_id IN (
      SELECT id FROM profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Likes Policies
CREATE POLICY "Likes are viewable by everyone"
  ON likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like activities"
  ON likes FOR INSERT
  WITH CHECK (
    profile_id IN (
      SELECT id FROM profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can unlike activities"
  ON likes FOR DELETE
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Comments Policies
CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Users can comment on activities"
  ON comments FOR INSERT
  WITH CHECK (
    profile_id IN (
      SELECT id FROM profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Gear Items Policies
CREATE POLICY "Gear items are viewable by everyone"
  ON gear_items FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own gear"
  ON gear_items FOR INSERT
  WITH CHECK (
    profile_id IN (
      SELECT id FROM profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own gear"
  ON gear_items FOR UPDATE
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own gear"
  ON gear_items FOR DELETE
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Cafes Policies
CREATE POLICY "Cafes are viewable by everyone"
  ON cafes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert cafes"
  ON cafes FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update cafes"
  ON cafes FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Roasters Policies
CREATE POLICY "Roasters are viewable by everyone"
  ON roasters FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert roasters"
  ON roasters FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE auth_user_id = auth.uid() AND is_admin = true
    )
  );

-- Coffee Offerings Policies
CREATE POLICY "Coffee offerings are viewable by everyone"
  ON coffee_offerings FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage coffee offerings"
  ON coffee_offerings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE auth_user_id = auth.uid() AND is_admin = true
    )
  );

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brew_activities_updated_at BEFORE UPDATE ON brew_activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cafes_updated_at BEFORE UPDATE ON cafes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STORAGE BUCKET SETUP
-- =====================================================

-- Create brew-images bucket (run this separately if needed)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('brew-images', 'brew-images', true);

-- Storage policies for brew-images bucket
-- CREATE POLICY "Public can view brew images"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'brew-images');

-- CREATE POLICY "Authenticated users can upload brew images"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'brew-images' AND
--     auth.uid() IS NOT NULL
--   );

-- CREATE POLICY "Users can update their own images"
--   ON storage.objects FOR UPDATE
--   USING (
--     bucket_id = 'brew-images' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- CREATE POLICY "Users can delete their own images"
--   ON storage.objects FOR DELETE
--   USING (
--     bucket_id = 'brew-images' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- =====================================================
-- NOTES
-- =====================================================
--
-- 1. This schema supports the full ELIXR social coffee logging app
-- 2. All tables have RLS enabled for security
-- 3. Indexes are optimized for common queries (feed, profiles, etc.)
-- 4. Storage bucket setup is commented out - run separately in Supabase dashboard
-- 5. Run this entire file in Supabase SQL Editor to set up the database
--
-- =====================================================
