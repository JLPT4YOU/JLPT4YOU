-- ================================
-- 🔄 COMPLETE AUTH RESET SCRIPT
-- Reset authentication to simple, clean state
-- ================================

-- Step 1: Drop ALL existing RLS policies for clean slate
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Service role full access" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.users;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON public.users;
DROP POLICY IF EXISTS "Service role can manage all users" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Service role has full access" ON public.users;

-- Step 2: Create SIMPLE RLS policies (only 2 needed!)
-- Policy 1: Users can see and update their own record
CREATE POLICY "users_own_record" ON public.users
  FOR ALL 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 2: Service role bypass (for API/admin)
CREATE POLICY "service_role_bypass" ON public.users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Step 3: Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 4: Create or update simple trigger for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.users.name);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Grant necessary permissions
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;

-- Step 6: Test query to verify setup
SELECT 
  'RLS Status' as check_type,
  CASE 
    WHEN relrowsecurity THEN '✅ RLS Enabled'
    ELSE '❌ RLS Disabled'
  END as status
FROM pg_class
WHERE relname = 'users' AND relnamespace = 'public'::regnamespace

UNION ALL

SELECT 
  'Policy Count' as check_type,
  COUNT(*)::text || ' policies active' as status
FROM pg_policies
WHERE tablename = 'users' AND schemaname = 'public';

-- ================================
-- ✅ AUTH RESET COMPLETE
-- Simple, clean authentication setup
-- Only 2 RLS policies needed!
-- ================================
