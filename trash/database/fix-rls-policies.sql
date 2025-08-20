-- Fix RLS Policies for JLPT4YOU
-- This fixes 406 errors when fetching user data

-- 1. First, check current RLS status
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename = 'users';

-- 2. Create comprehensive RLS policies for users table
-- Note: These policies allow users to access their own data

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Service role can manage all users" ON public.users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable write access for users based on user_id" ON public.users;

-- Create new comprehensive policies
-- Policy 1: Users can SELECT their own record
CREATE POLICY "Users can view own profile" 
ON public.users 
FOR SELECT 
USING (auth.uid() = id);

-- Policy 2: Service role can do everything
CREATE POLICY "Service role full access" 
ON public.users 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- Policy 3: Users can UPDATE their own record
CREATE POLICY "Users can update own profile" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 4: Users can INSERT their own record (for initial creation)
CREATE POLICY "Users can insert own profile" 
ON public.users 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Policy 5: Allow authenticated users to check if user exists (for balance checks)
CREATE POLICY "Authenticated users can check user existence" 
ON public.users 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- 3. Ensure the trigger function has proper permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;

-- 4. Grant sequence permissions if needed
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 5. Verify policies are created
SELECT 
    pol.polname as policy_name,
    CASE pol.polcmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
    END as operation
FROM pg_policy pol
JOIN pg_class cls ON pol.polrelid = cls.oid
JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
WHERE nsp.nspname = 'public' 
AND cls.relname = 'users'
ORDER BY pol.polname;

-- Report
SELECT 'RLS policies updated successfully. Please test authentication again.' as status;
