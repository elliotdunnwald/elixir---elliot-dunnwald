-- =====================================================
-- Add Brew Preferences to Profiles Table
-- =====================================================

-- Add brew_preferences column to store user's customization settings
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS brew_preferences JSONB DEFAULT '{
  "brewsAtHome": true,
  "visitsCafes": true,
  "detailLevel": "balanced",
  "customFields": {
    "temperature": true,
    "brewTime": true,
    "grindSize": true,
    "coffeeDose": true,
    "waterAmount": true,
    "tds": false,
    "extractionYield": false,
    "description": true,
    "rating": true
  }
}'::jsonb;

-- Add onboarding_completed column to track if user finished onboarding
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed ON profiles(onboarding_completed);

-- Comment for documentation
COMMENT ON COLUMN profiles.brew_preferences IS 'User preferences for brew log fields and detail level';
COMMENT ON COLUMN profiles.onboarding_completed IS 'Whether user has completed the onboarding flow';
