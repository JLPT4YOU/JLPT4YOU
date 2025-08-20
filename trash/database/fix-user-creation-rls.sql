-- FIX USER CREATION RLS POLICIES
-- This script fixes the issue where authenticated users cannot create their own user records
-- Run this in Supabase SQL Editor

-- Step 1: Check current RLS status
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- Step 2: Check current policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';

-- Step 3: Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Step 4: Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 5: Create new policies with proper permissions
-- Allow users to select their own record
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT
    USING (auth.uid() = id);

-- Allow users to update their own record
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Allow users to insert their own record (THIS IS THE KEY FIX)
-- This policy was missing from the original template!
CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Allow admins to view all users (from original template)
CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Step 6: Grant necessary permissions to authenticated role
GRANT SELECT, UPDATE, INSERT ON public.users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Step 7: Verify the policies are created
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;

-- Step 8: Test query (replace with actual user ID)
-- SELECT * FROM public.users WHERE id = auth.uid();

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ User creation RLS policies have been fixed';
    RAISE NOTICE '📝 Users can now create, read, and update their own records';
    RAISE NOTICE '🔒 RLS is enabled and properly configured';
END $$;
