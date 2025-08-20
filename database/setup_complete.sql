-- Complete setup for books table and storage
-- Run this in Supabase SQL Editor

-- 1. Create books table
CREATE TABLE IF NOT EXISTS public.books (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('n1', 'n2', 'n3', 'n4', 'n5', 'other')),
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    pages INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_books_category ON public.books(category);
CREATE INDEX IF NOT EXISTS idx_books_status ON public.books(status);
CREATE INDEX IF NOT EXISTS idx_books_created_at ON public.books(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_books_uploaded_by ON public.books(uploaded_by);

-- 3. Enable RLS
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view published books" ON public.books;
DROP POLICY IF EXISTS "Admins can insert books" ON public.books;
DROP POLICY IF EXISTS "Admins can update books" ON public.books;
DROP POLICY IF EXISTS "Admins can delete books" ON public.books;

-- 5. Create RLS policies for books table
-- All users can view published books
CREATE POLICY "Anyone can view published books" ON public.books
    FOR SELECT USING (status = 'published');

-- Only admins can insert books
CREATE POLICY "Admins can insert books" ON public.books
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Only admins can update books
CREATE POLICY "Admins can update books" ON public.books
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Only admins can delete books
CREATE POLICY "Admins can delete books" ON public.books
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- 6. Create storage bucket for books
INSERT INTO storage.buckets (id, name, public)
VALUES ('books', 'books', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 8. Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Anyone can view book files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload book files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update book files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete book files" ON storage.objects;

-- 9. Create storage policies
-- Anyone can view published book files
CREATE POLICY "Anyone can view book files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'books' AND 
        EXISTS (
            SELECT 1 FROM public.books 
            WHERE file_url LIKE '%' || name AND status = 'published'
        )
    );

-- Only admins can upload book files
CREATE POLICY "Admins can upload book files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'books' AND
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Only admins can update book files
CREATE POLICY "Admins can update book files" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'books' AND
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Only admins can delete book files
CREATE POLICY "Admins can delete book files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'books' AND
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );
