-- 🔧 FIX ADMIN DASHBOARD ACCESS
-- This script adds admin policies for dashboard access
-- Run this in Supabase SQL Editor

-- ============================================================================
-- PROBLEM: Admin users cannot access dashboard due to missing admin policies
-- SOLUTION: Add admin-specific policies for full access
-- ============================================================================

BEGIN;

-- Step 1: Add admin SELECT policy (can view all users)
CREATE POLICY "admin_select_all_users" ON public.users
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.id IN (
                SELECT id FROM public.users 
                WHERE role = 'Admin'
            )
        )
    );

-- Step 2: Add admin UPDATE policy (can update all users)
CREATE POLICY "admin_update_all_users" ON public.users
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.id IN (
                SELECT id FROM public.users 
                WHERE role = 'Admin'
            )
        )
    );

-- Step 3: Add admin DELETE policy (can delete users)
CREATE POLICY "admin_delete_users" ON public.users
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.id IN (
                SELECT id FROM public.users 
                WHERE role = 'Admin'
            )
        )
    );

-- Step 4: Grant DELETE permission to authenticated role
GRANT DELETE ON public.users TO authenticated;

-- Step 5: Update your user to Admin role (replace with your actual user ID)
-- First, let's find your user ID
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Find user by email (replace with your email)
    SELECT id INTO admin_user_id 
    FROM public.users 
    WHERE email = 'jlpt4you.owner@gmail.com';
    
    IF admin_user_id IS NOT NULL THEN
        -- Update role to Admin
        UPDATE public.users 
        SET role = 'Admin', updated_at = NOW()
        WHERE id = admin_user_id;
        
        RAISE NOTICE '✅ Updated user % to Admin role', admin_user_id;
    ELSE
        RAISE WARNING '❌ User with email jlpt4you.owner@gmail.com not found';
    END IF;
END $$;

-- Step 6: Verify admin policies are created
SELECT 
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'users' 
  AND schemaname = 'public'
  AND policyname LIKE 'admin_%'
ORDER BY policyname;

-- Step 7: Verify admin user
SELECT 
    id,
    email,
    role,
    updated_at
FROM public.users 
WHERE role = 'Admin';

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check all policies
SELECT 
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;

-- Check admin users
SELECT 
    'Admin users: ' || COUNT(*) as admin_count
FROM public.users 
WHERE role = 'Admin';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🚀 ADMIN ACCESS FIXED!';
    RAISE NOTICE '✅ Admin policies created for dashboard access';
    RAISE NOTICE '✅ User role updated to Admin';
    RAISE NOTICE '✅ Admin can now access all user data';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Next steps:';
    RAISE NOTICE '1. Logout and login again to refresh session';
    RAISE NOTICE '2. Test admin dashboard access';
    RAISE NOTICE '3. Verify all admin functions work';
    RAISE NOTICE '';
END $$;
