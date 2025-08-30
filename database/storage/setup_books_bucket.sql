-- Supabase Storage setup for books bucket
-- Run this in Supabase SQL Editor

-- Create books bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('books', 'books', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view published book files
CREATE POLICY "Anyone can view book files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'books' AND 
        EXISTS (
            SELECT 1 FROM public.books 
            WHERE file_url LIKE '%' || name AND status = 'published'
        )
    );

-- Policy: Only admins can upload book files
CREATE POLICY "Admins can upload book files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'books' AND
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Policy: Only admins can update book files
CREATE POLICY "Admins can update book files" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'books' AND
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Policy: Only admins can delete book files
CREATE POLICY "Admins can delete book files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'books' AND
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );
