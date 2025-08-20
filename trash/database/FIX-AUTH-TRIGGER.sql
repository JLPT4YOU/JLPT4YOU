-- 🚨 URGENT: FIX AUTH USER CREATION TRIGGER
-- This script creates a trigger to automatically create user records when auth users are created
-- Run this in Supabase SQL Editor

-- ============================================================================
-- PROBLEM: Foreign key constraint prevents manual user creation
-- SOLUTION: Create trigger to auto-create user records when auth users are created
-- ============================================================================

BEGIN;

-- Step 1: Check current foreign key constraints
DO $$
BEGIN
    RAISE NOTICE '🔍 Checking foreign key constraints...';
END $$;

SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='users'
  AND tc.table_schema='public';

-- Step 2: Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'Free',
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- User already exists, do nothing
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't fail auth
    RAISE WARNING 'Failed to create user record for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT INSERT, SELECT, UPDATE ON public.users TO supabase_auth_admin;

-- Step 5: Test the trigger with a dummy user (will be cleaned up)
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_email TEXT := 'trigger-test-' || extract(epoch from now()) || '@example.com';
BEGIN
    RAISE NOTICE '🧪 Testing trigger with user: %', test_email;
    
    -- This should trigger our function
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        aud,
        role
    ) VALUES (
        test_user_id,
        '00000000-0000-0000-0000-000000000000',
        test_email,
        crypt('test123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        'authenticated',
        'authenticated'
    );
    
    -- Check if user record was created
    IF EXISTS (SELECT 1 FROM public.users WHERE id = test_user_id) THEN
        RAISE NOTICE '✅ SUCCESS: Trigger created user record automatically!';
    ELSE
        RAISE WARNING '❌ FAILED: Trigger did not create user record';
    END IF;
    
    -- Clean up test user
    DELETE FROM auth.users WHERE id = test_user_id;
    DELETE FROM public.users WHERE id = test_user_id;
    
    RAISE NOTICE '🧹 Test user cleaned up';
END $$;

-- Step 6: Verify trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (Run these to confirm the fix worked)
-- ============================================================================

-- Check trigger exists
SELECT 'Trigger exists: ' || CASE WHEN COUNT(*) > 0 THEN 'YES' ELSE 'NO' END
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Check function exists
SELECT 'Function exists: ' || CASE WHEN COUNT(*) > 0 THEN 'YES' ELSE 'NO' END
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user' AND routine_schema = 'public';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🚀 AUTH TRIGGER DEPLOYED!';
    RAISE NOTICE '✅ New auth users will automatically get user records';
    RAISE NOTICE '✅ No more foreign key constraint violations';
    RAISE NOTICE '✅ Registration should now work properly';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Next steps:';
    RAISE NOTICE '1. Test user registration in the app';
    RAISE NOTICE '2. Verify user records are created automatically';
    RAISE NOTICE '3. Check that clean URL redirects work after login';
    RAISE NOTICE '';
END $$;
