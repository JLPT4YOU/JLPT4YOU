-- Migration: Create books table for library management
-- Date: 2025-07-30

-- Books table for library management
CREATE TABLE IF NOT EXISTS public.books (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('n1', 'n2', 'n3', 'n4', 'n5', 'other')),
    file_url TEXT NOT NULL, -- Supabase Storage URL
    file_name TEXT NOT NULL, -- Original file name
    file_size BIGINT NOT NULL, -- File size in bytes
    pages INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_books_category ON public.books(category);
CREATE INDEX IF NOT EXISTS idx_books_status ON public.books(status);
CREATE INDEX IF NOT EXISTS idx_books_created_at ON public.books(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_books_uploaded_by ON public.books(uploaded_by);

-- Enable RLS
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Books policies
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
