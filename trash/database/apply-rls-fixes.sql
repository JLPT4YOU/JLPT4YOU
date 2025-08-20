-- 🔧 CLEANUP DUPLICATE RLS POLICIES
-- Run this in Supabase SQL Editor to fix duplicate policies
-- Date: 2025-08-06

-- Step 1: Drop duplicate policies (the old ones with different names)
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
DROP POLICY IF EXISTS "users_insert_policy" ON public.users;
DROP POLICY IF EXISTS "users_update_policy" ON public.users;

-- Step 2: Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 3: Grant permissions to authenticated role (in case they're missing)
GRANT SELECT, UPDATE, INSERT ON public.users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Step 4: Verify the cleanup - should only see clean policies now
SELECT
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;

-- Step 5: Test that we can query the table (should work)
SELECT COUNT(*) as user_count FROM public.users;
