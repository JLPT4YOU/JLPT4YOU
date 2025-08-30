-- 🧪 QUICK AUTHENTICATION TEST
-- Run this to verify authentication setup is working

-- Test 1: Check RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';

-- Test 2: Count policies (should be 4 clean policies)
SELECT 
    COUNT(*) as total_policies,
    COUNT(CASE WHEN policyname LIKE 'Users can %' THEN 1 END) as clean_policies,
    COUNT(CASE WHEN policyname LIKE 'users_%_policy' THEN 1 END) as duplicate_policies
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';

-- Test 3: List all policies
SELECT 
    policyname,
    cmd,
    CASE 
        WHEN policyname LIKE 'Users can %' THEN '✅ Clean'
        WHEN policyname LIKE 'users_%_policy' THEN '⚠️ Duplicate'
        ELSE '❓ Other'
    END as status
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;

-- Test 4: Check permissions for authenticated role
SELECT 
    table_schema,
    table_name,
    privilege_type,
    grantee
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'users' 
AND grantee = 'authenticated'
ORDER BY privilege_type;

-- Test 5: Check if we can query users (should work with service role)
SELECT 
    id,
    email,
    name,
    role,
    created_at
FROM public.users 
ORDER BY created_at DESC
LIMIT 3;
