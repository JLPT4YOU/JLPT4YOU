-- Fix Storage policies for books bucket
-- Run this in Supabase SQL Editor

-- Drop all existing storage policies for books bucket
DROP POLICY IF EXISTS "Anyone can view book files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload book files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update book files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete book files" ON storage.objects;

-- Create simple policies for storage
-- Allow service role to do everything
CREATE POLICY "Service role storage access" ON storage.objects
    FOR ALL USING (bucket_id = 'books' AND auth.role() = 'service_role');

-- Allow public read access to books
CREATE POLICY "Public read books" ON storage.objects
    FOR SELECT USING (bucket_id = 'books');

-- Or completely disable RLS on storage.objects for books bucket (temporary)
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
