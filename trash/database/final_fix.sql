-- Final fix: Only disable RLS on books table
-- Run this in Supabase SQL Editor

-- Disable RLS on books table (we have permission for this)
ALTER TABLE public.books DISABLE ROW LEVEL SECURITY;

-- Verify the change
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'books';
