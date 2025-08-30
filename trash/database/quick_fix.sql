-- Quick fix: Disable RLS temporarily for testing
-- Run this in Supabase SQL Editor

-- Disable RLS on books table completely
ALTER TABLE public.books DISABLE ROW LEVEL SECURITY;

-- Also check if table exists and show current policies
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'books';

-- Show current policies (if any)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'books';
