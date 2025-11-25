-- Migration: Add country, state, and completion fields to itineraries table
-- Run this in your Supabase SQL Editor if you haven't already run the updated supabase_setup.sql

-- Add country column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'itineraries' 
    AND column_name = 'country'
  ) THEN
    ALTER TABLE public.itineraries ADD COLUMN country text NULL;
  END IF;
END $$;

-- Add state column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'itineraries' 
    AND column_name = 'state'
  ) THEN
    ALTER TABLE public.itineraries ADD COLUMN state text NULL;
  END IF;
END $$;

-- Add is_completed column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'itineraries' 
    AND column_name = 'is_completed'
  ) THEN
    ALTER TABLE public.itineraries ADD COLUMN is_completed boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Add completed_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'itineraries' 
    AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE public.itineraries ADD COLUMN completed_at timestamp with time zone NULL;
  END IF;
END $$;

