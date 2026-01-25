-- Create Coffee Offerings Tables
-- Run this FIRST in Supabase SQL Editor (before add-coffee-offerings.sql)

-- Create roasters table
CREATE TABLE IF NOT EXISTS roasters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  country TEXT NOT NULL,
  website TEXT,
  founded_year INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create coffee_offerings table
CREATE TABLE IF NOT EXISTS coffee_offerings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roaster_id UUID REFERENCES roasters(id) NOT NULL,
  name TEXT NOT NULL,
  lot TEXT NOT NULL,
  origin TEXT NOT NULL,
  region TEXT,
  estate TEXT,
  varietals TEXT[] NOT NULL,
  processing TEXT NOT NULL,
  roast_level TEXT,
  tasting_notes TEXT[],
  elevation TEXT,
  available BOOLEAN DEFAULT true,
  price NUMERIC,
  size TEXT,
  harvest_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_coffee_offerings_roaster ON coffee_offerings(roaster_id);
CREATE INDEX IF NOT EXISTS idx_coffee_offerings_available ON coffee_offerings(available);
CREATE INDEX IF NOT EXISTS idx_roasters_name ON roasters(name);

-- Enable Row Level Security
ALTER TABLE roasters ENABLE ROW LEVEL SECURITY;
ALTER TABLE coffee_offerings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow public read access)
DROP POLICY IF EXISTS "Roasters are viewable by everyone" ON roasters;
CREATE POLICY "Roasters are viewable by everyone"
  ON roasters FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Coffee offerings are viewable by everyone" ON coffee_offerings;
CREATE POLICY "Coffee offerings are viewable by everyone"
  ON coffee_offerings FOR SELECT
  USING (true);
