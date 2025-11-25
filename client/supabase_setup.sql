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
  start_date date NULL,
  end_date date NULL,
  description text NULL,
  is_smart_planned boolean NOT NULL DEFAULT false,
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

