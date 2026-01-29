-- SQL: create a test table to store sample test-phase data
-- Run this in Supabase SQL editor or psql (connected to your project's DB)

-- Ensure pgcrypto for gen_random_uuid() is available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create table in public schema
CREATE TABLE IF NOT EXISTS public.test_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Optional: grant minimal privileges (adjust as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.test_items TO anon;
