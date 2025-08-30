-- Temporarily disable RLS for books table (for testing)
-- Run this in Supabase SQL Editor

-- Disable RLS on books table
ALTER TABLE public.books DISABLE ROW LEVEL SECURITY;

-- Note: This allows all operations on books table
-- Re-enable later with proper policies
