-- Migration: Add state column to travel_journal_entries table
-- Run this in your Supabase SQL Editor

-- Add state column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'travel_journal_entries' 
    AND column_name = 'state'
  ) THEN
    ALTER TABLE public.travel_journal_entries 
    ADD COLUMN state text NULL;
  END IF;
END $$;

