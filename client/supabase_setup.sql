-- Create profiles table with foreign key constraint
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL DEFAULT auth.uid(),
  email text NULL,
  name text NULL,
  country text NULL,
  dob date NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running this script)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy: Users can insert their own profile
-- This allows users to create their profile right after signup
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy: Allow service role to insert profiles (for trigger)
-- This is handled by SECURITY DEFINER, but we add this for clarity

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on row update
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create a profile when a user signs up
-- This function reads from user metadata and populates the profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, country, dob)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'country', NULL),
    CASE 
      WHEN NEW.raw_user_meta_data->>'dob' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'dob')::date 
      ELSE NULL 
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, profiles.name),
    country = COALESCE(EXCLUDED.country, profiles.country),
    dob = COALESCE(EXCLUDED.dob, profiles.dob),
    updated_at = now();
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions to the function
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated;
GRANT ALL ON public.profiles TO postgres;

-- Trigger to call the function when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Allow the trigger function to insert profiles (bypasses RLS)
-- This is safe because it only runs server-side when a user is created

-- Create itineraries table
CREATE TABLE IF NOT EXISTS public.itineraries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  location text NOT NULL,
  country text NULL,
  state text NULL,
  start_date date NULL,
  end_date date NULL,
  description text NULL,
  is_smart_planned boolean NOT NULL DEFAULT false,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamp with time zone NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT itineraries_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Create itinerary_items table
CREATE TABLE IF NOT EXISTS public.itinerary_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  itinerary_id uuid NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  site_id text NOT NULL,
  site_name text NOT NULL,
  site_description text NULL,
  site_address text NULL,
  site_category text NULL,
  site_heritage_type text NULL,
  site_rating numeric(3, 1) NULL,
  location_lat numeric(10, 7) NOT NULL,
  location_lng numeric(10, 7) NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  visit_date date NULL,
  visit_time time NULL,
  notes text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT itinerary_items_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Enable Row Level Security for itineraries
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own itineraries" ON public.itineraries;
DROP POLICY IF EXISTS "Users can insert own itineraries" ON public.itineraries;
DROP POLICY IF EXISTS "Users can update own itineraries" ON public.itineraries;
DROP POLICY IF EXISTS "Users can delete own itineraries" ON public.itineraries;

DROP POLICY IF EXISTS "Users can view own itinerary items" ON public.itinerary_items;
DROP POLICY IF EXISTS "Users can insert own itinerary items" ON public.itinerary_items;
DROP POLICY IF EXISTS "Users can update own itinerary items" ON public.itinerary_items;
DROP POLICY IF EXISTS "Users can delete own itinerary items" ON public.itinerary_items;

-- Policies for itineraries
CREATE POLICY "Users can view own itineraries" ON public.itineraries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own itineraries" ON public.itineraries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own itineraries" ON public.itineraries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own itineraries" ON public.itineraries
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for itinerary_items
CREATE POLICY "Users can view own itinerary items" ON public.itinerary_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.itineraries 
      WHERE itineraries.id = itinerary_items.itinerary_id 
      AND itineraries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own itinerary items" ON public.itinerary_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.itineraries 
      WHERE itineraries.id = itinerary_items.itinerary_id 
      AND itineraries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own itinerary items" ON public.itinerary_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.itineraries 
      WHERE itineraries.id = itinerary_items.itinerary_id 
      AND itineraries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own itinerary items" ON public.itinerary_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.itineraries 
      WHERE itineraries.id = itinerary_items.itinerary_id 
      AND itineraries.user_id = auth.uid()
    )
  );

-- Create trigger to update updated_at for itineraries
DROP TRIGGER IF EXISTS update_itineraries_updated_at ON public.itineraries;
CREATE TRIGGER update_itineraries_updated_at
  BEFORE UPDATE ON public.itineraries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to update updated_at for itinerary_items
DROP TRIGGER IF EXISTS update_itinerary_items_updated_at ON public.itinerary_items;
CREATE TRIGGER update_itinerary_items_updated_at
  BEFORE UPDATE ON public.itinerary_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_itineraries_user_id ON public.itineraries(user_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_created_at ON public.itineraries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_itinerary_id ON public.itinerary_items(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_order_index ON public.itinerary_items(itinerary_id, order_index);

-- Create travel_journal_entries table for Fog of War and Travel Journal
CREATE TABLE IF NOT EXISTS public.travel_journal_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_id text NULL,
  site_name text NOT NULL,
  location_lat numeric(10, 7) NOT NULL,
  location_lng numeric(10, 7) NOT NULL,
  location_name text NULL,
  country text NULL,
  visited_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text NULL,
  photos text[] NULL,
  ai_translations jsonb NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT travel_journal_entries_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Enable Row Level Security for travel_journal_entries
ALTER TABLE public.travel_journal_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own journal entries" ON public.travel_journal_entries;
DROP POLICY IF EXISTS "Users can insert own journal entries" ON public.travel_journal_entries;
DROP POLICY IF EXISTS "Users can update own journal entries" ON public.travel_journal_entries;
DROP POLICY IF EXISTS "Users can delete own journal entries" ON public.travel_journal_entries;

-- Policies for travel_journal_entries
CREATE POLICY "Users can view own journal entries" ON public.travel_journal_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal entries" ON public.travel_journal_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries" ON public.travel_journal_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries" ON public.travel_journal_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger to update updated_at for travel_journal_entries
DROP TRIGGER IF EXISTS update_travel_journal_entries_updated_at ON public.travel_journal_entries;
CREATE TRIGGER update_travel_journal_entries_updated_at
  BEFORE UPDATE ON public.travel_journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for travel_journal_entries
CREATE INDEX IF NOT EXISTS idx_travel_journal_entries_user_id ON public.travel_journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_journal_entries_visited_at ON public.travel_journal_entries(visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_travel_journal_entries_location ON public.travel_journal_entries(location_lat, location_lng);

-- Create community_discoveries table
CREATE TABLE IF NOT EXISTS public.community_discoveries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'discovery' CHECK (type IN ('discovery', 'post')),
  site_name text NOT NULL,
  location text NULL,
  location_lat numeric(10, 7) NULL,
  location_lng numeric(10, 7) NULL,
  original_text text NULL,
  translated_text text NULL,
  description text NULL,
  image_url text NULL,
  video_url text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT community_discoveries_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Create community_discovery_likes table for tracking likes
CREATE TABLE IF NOT EXISTS public.community_discovery_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  discovery_id uuid NOT NULL REFERENCES public.community_discoveries(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT community_discovery_likes_pkey PRIMARY KEY (id),
  CONSTRAINT community_discovery_likes_unique UNIQUE (discovery_id, user_id)
) TABLESPACE pg_default;

-- Create community_discovery_learned table for tracking learned status
CREATE TABLE IF NOT EXISTS public.community_discovery_learned (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  discovery_id uuid NOT NULL REFERENCES public.community_discoveries(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT community_discovery_learned_pkey PRIMARY KEY (id),
  CONSTRAINT community_discovery_learned_unique UNIQUE (discovery_id, user_id)
) TABLESPACE pg_default;

-- Enable Row Level Security for community_discoveries
ALTER TABLE public.community_discoveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_discovery_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_discovery_learned ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view community discoveries" ON public.community_discoveries;
DROP POLICY IF EXISTS "Users can insert own discoveries" ON public.community_discoveries;
DROP POLICY IF EXISTS "Users can update own discoveries" ON public.community_discoveries;
DROP POLICY IF EXISTS "Users can delete own discoveries" ON public.community_discoveries;

DROP POLICY IF EXISTS "Anyone can view discovery likes" ON public.community_discovery_likes;
DROP POLICY IF EXISTS "Users can insert own likes" ON public.community_discovery_likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON public.community_discovery_likes;

DROP POLICY IF EXISTS "Anyone can view discovery learned" ON public.community_discovery_learned;
DROP POLICY IF EXISTS "Users can insert own learned" ON public.community_discovery_learned;
DROP POLICY IF EXISTS "Users can delete own learned" ON public.community_discovery_learned;

-- Policies for community_discoveries - public read, authenticated write
CREATE POLICY "Anyone can view community discoveries" ON public.community_discoveries
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own discoveries" ON public.community_discoveries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own discoveries" ON public.community_discoveries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own discoveries" ON public.community_discoveries
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for community_discovery_likes
CREATE POLICY "Anyone can view discovery likes" ON public.community_discovery_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own likes" ON public.community_discovery_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" ON public.community_discovery_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for community_discovery_learned
CREATE POLICY "Anyone can view discovery learned" ON public.community_discovery_learned
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own learned" ON public.community_discovery_learned
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own learned" ON public.community_discovery_learned
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger to update updated_at for community_discoveries
DROP TRIGGER IF EXISTS update_community_discoveries_updated_at ON public.community_discoveries;
CREATE TRIGGER update_community_discoveries_updated_at
  BEFORE UPDATE ON public.community_discoveries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for community_discoveries
CREATE INDEX IF NOT EXISTS idx_community_discoveries_user_id ON public.community_discoveries(user_id);
CREATE INDEX IF NOT EXISTS idx_community_discoveries_created_at ON public.community_discoveries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_discoveries_type ON public.community_discoveries(type);
CREATE INDEX IF NOT EXISTS idx_community_discovery_likes_discovery_id ON public.community_discovery_likes(discovery_id);
CREATE INDEX IF NOT EXISTS idx_community_discovery_likes_user_id ON public.community_discovery_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_community_discovery_learned_discovery_id ON public.community_discovery_learned(discovery_id);
CREATE INDEX IF NOT EXISTS idx_community_discovery_learned_user_id ON public.community_discovery_learned(user_id);

-- Create badges table
CREATE TABLE IF NOT EXISTS public.badges (
  id text NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  rarity text NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  max_progress integer NOT NULL DEFAULT 1,
  badge_type text NOT NULL CHECK (badge_type IN ('decipher_count', 'visit_count', 'language_count', 'video_count', 'likes_count', 'country_count', 'ashokan_count')),
  badge_config jsonb NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT badges_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Create user_badges table to track which badges users have unlocked
CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id text NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  progress integer NOT NULL DEFAULT 0,
  unlocked boolean NOT NULL DEFAULT false,
  unlocked_at timestamp with time zone NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_badges_pkey PRIMARY KEY (id),
  CONSTRAINT user_badges_unique UNIQUE (user_id, badge_id)
) TABLESPACE pg_default;

-- Enable Row Level Security for badges
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view badges" ON public.badges;
DROP POLICY IF EXISTS "Users can view own badges" ON public.user_badges;
DROP POLICY IF EXISTS "Users can update own badges" ON public.user_badges;

-- Policies for badges (public read)
CREATE POLICY "Anyone can view badges" ON public.badges
  FOR SELECT USING (true);

-- Policies for user_badges
CREATE POLICY "Users can view own badges" ON public.user_badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own badges" ON public.user_badges
  FOR UPDATE USING (auth.uid() = user_id);

-- Create trigger to update updated_at for badges
DROP TRIGGER IF EXISTS update_badges_updated_at ON public.badges;
CREATE TRIGGER update_badges_updated_at
  BEFORE UPDATE ON public.badges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to update updated_at for user_badges
DROP TRIGGER IF EXISTS update_user_badges_updated_at ON public.user_badges;
CREATE TRIGGER update_user_badges_updated_at
  BEFORE UPDATE ON public.user_badges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for badges
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON public.user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_unlocked ON public.user_badges(user_id, unlocked);

-- Insert default badges
INSERT INTO public.badges (id, name, description, icon, rarity, max_progress, badge_type, badge_config) VALUES
  ('first-discovery', 'First Discovery', 'Decipher your first monument inscription', '🔍', 'common', 1, 'decipher_count', '{"threshold": 1}'::jsonb),
  ('mauryan-historian', 'Mauryan Historian', 'Translate 5 Ashokan Edicts', '📜', 'rare', 5, 'ashokan_count', '{"threshold": 5}'::jsonb),
  ('temple-explorer', 'Temple Explorer', 'Visit and decipher 10 temples', '🛕', 'rare', 10, 'visit_count', '{"threshold": 10}'::jsonb),
  ('script-master', 'Script Master', 'Decipher inscriptions in 5 different languages', '✍️', 'epic', 5, 'language_count', '{"threshold": 5}'::jsonb),
  ('heritage-scholar', 'Heritage Scholar', 'Decipher 25 monuments', '🎓', 'epic', 25, 'decipher_count', '{"threshold": 25}'::jsonb),
  ('time-traveler', 'Time Traveler', 'Generate video history for 10 monuments', '⏰', 'legendary', 10, 'video_count', '{"threshold": 10}'::jsonb),
  ('community-legend', 'Community Legend', 'Get 100 likes on your discoveries', '👑', 'legendary', 100, 'likes_count', '{"threshold": 100}'::jsonb),
  ('world-explorer', 'World Explorer', 'Visit monuments in 10 different countries', '🌍', 'epic', 10, 'country_count', '{"threshold": 10}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  rarity = EXCLUDED.rarity,
  max_progress = EXCLUDED.max_progress,
  badge_type = EXCLUDED.badge_type,
  badge_config = EXCLUDED.badge_config,
  updated_at = now();

