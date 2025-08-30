-- Fix RLS policies for books table
-- Run this in Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view published books" ON public.books;
DROP POLICY IF EXISTS "Admins can insert books" ON public.books;
DROP POLICY IF EXISTS "Admins can update books" ON public.books;
DROP POLICY IF EXISTS "Admins can delete books" ON public.books;

-- Create new policies that work with service role
-- All users can view published books
CREATE POLICY "Anyone can view published books" ON public.books
    FOR SELECT USING (status = 'published');

-- Service role can do everything (for API operations)
CREATE POLICY "Service role full access" ON public.books
    FOR ALL USING (auth.role() = 'service_role');

-- Authenticated users with Admin role can do everything
CREATE POLICY "Admins can manage books" ON public.books
    FOR ALL USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );
