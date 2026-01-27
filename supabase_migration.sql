-- Migration: Update rating constraint to allow 0-10 range
-- Run this in Supabase SQL Editor

-- Drop the old constraint
ALTER TABLE brew_activities
DROP CONSTRAINT IF EXISTS brew_activities_rating_check;

-- Add new constraint with 0-10 range
ALTER TABLE brew_activities
ADD CONSTRAINT brew_activities_rating_check
CHECK (rating >= 0 AND rating <= 10);
