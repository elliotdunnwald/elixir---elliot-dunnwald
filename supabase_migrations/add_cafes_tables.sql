-- Create cafes table
CREATE TABLE IF NOT EXISTS public.cafes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text NOT NULL,
  country text NOT NULL,
  address text,
  average_rating numeric DEFAULT 0,
  visit_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(name, city, country)
);

-- Create pending_cafes table
CREATE TABLE IF NOT EXISTS public.pending_cafes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_name text NOT NULL,
  city text NOT NULL,
  country text NOT NULL,
  address text,
  submitted_by uuid REFERENCES public.profiles(id) NOT NULL,
  submission_count integer DEFAULT 1,
  submitted_by_users uuid[] DEFAULT ARRAY[]::uuid[],
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by uuid REFERENCES public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(cafe_name, city, country, status)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_cafes_name ON public.cafes(name);
CREATE INDEX IF NOT EXISTS idx_cafes_city ON public.cafes(city);
CREATE INDEX IF NOT EXISTS idx_cafes_country ON public.cafes(country);
CREATE INDEX IF NOT EXISTS idx_cafes_rating ON public.cafes(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_cafes_visit_count ON public.cafes(visit_count DESC);

CREATE INDEX IF NOT EXISTS idx_pending_cafes_status ON public.pending_cafes(status);
CREATE INDEX IF NOT EXISTS idx_pending_cafes_submission_count ON public.pending_cafes(submission_count DESC);

-- Enable RLS
ALTER TABLE public.cafes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_cafes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cafes
CREATE POLICY "Cafes are viewable by everyone"
  ON public.cafes FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert cafes"
  ON public.cafes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
      AND is_admin = true
    )
  );

CREATE POLICY "Only admins can update cafes"
  ON public.cafes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
      AND is_admin = true
    )
  );

-- RLS Policies for pending_cafes
CREATE POLICY "Pending cafes viewable by everyone"
  ON public.pending_cafes FOR SELECT
  USING (true);

CREATE POLICY "Anyone can submit pending cafes"
  ON public.pending_cafes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Only admins can update pending cafes"
  ON public.pending_cafes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
      AND is_admin = true
    )
  );

-- Function to update cafe ratings when a cafe visit is logged
CREATE OR REPLACE FUNCTION update_cafe_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_cafe_log = true AND NEW.cafe_name IS NOT NULL THEN
    UPDATE public.cafes
    SET
      visit_count = visit_count + 1,
      average_rating = (
        SELECT AVG(rating)
        FROM public.brew_activities
        WHERE is_cafe_log = true
        AND cafe_name = NEW.cafe_name
      ),
      updated_at = now()
    WHERE name = NEW.cafe_name;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update cafe ratings
DROP TRIGGER IF EXISTS trigger_update_cafe_rating ON public.brew_activities;
CREATE TRIGGER trigger_update_cafe_rating
  AFTER INSERT OR UPDATE ON public.brew_activities
  FOR EACH ROW
  WHEN (NEW.is_cafe_log = true)
  EXECUTE FUNCTION update_cafe_rating();
