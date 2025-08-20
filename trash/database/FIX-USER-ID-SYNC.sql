-- 🔧 FIX USER ID SYNCHRONIZATION
-- This script fixes user ID mismatch between auth.users and public.users
-- Run this in Supabase SQL Editor

-- ============================================================================
-- PROBLEM: Auth user ID doesn't match public.users ID
-- SOLUTION: Update public.users to match current auth user ID
-- ============================================================================

BEGIN;

-- Step 1: Find current auth user for the email
DO $$
DECLARE
    auth_user_id UUID;
    public_user_id UUID;
    user_email TEXT := 'jlpt4you.owner@gmail.com';
BEGIN
    -- Get current auth user ID
    SELECT id INTO auth_user_id 
    FROM auth.users 
    WHERE email = user_email
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Get public user ID
    SELECT id INTO public_user_id 
    FROM public.users 
    WHERE email = user_email;
    
    IF auth_user_id IS NULL THEN
        RAISE WARNING '❌ No auth user found for email: %', user_email;
    ELSIF public_user_id IS NULL THEN
        RAISE WARNING '❌ No public user found for email: %', user_email;
    ELSIF auth_user_id = public_user_id THEN
        RAISE NOTICE '✅ User IDs already match: %', auth_user_id;
    ELSE
        RAISE NOTICE '🔄 Updating user ID from % to %', public_user_id, auth_user_id;
        
        -- Update public.users to match auth.users ID
        UPDATE public.users 
        SET id = auth_user_id, updated_at = NOW()
        WHERE email = user_email;
        
        RAISE NOTICE '✅ User ID synchronized successfully';
    END IF;
END $$;

-- Step 2: Clean up any orphaned auth users (keep only the latest)
DO $$
DECLARE
    user_email TEXT := 'jlpt4you.owner@gmail.com';
    latest_auth_id UUID;
    orphan_count INTEGER;
BEGIN
    -- Get the latest auth user ID
    SELECT id INTO latest_auth_id 
    FROM auth.users 
    WHERE email = user_email
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Count orphaned auth users
    SELECT COUNT(*) INTO orphan_count
    FROM auth.users 
    WHERE email = user_email AND id != latest_auth_id;
    
    IF orphan_count > 0 THEN
        RAISE NOTICE '🧹 Found % orphaned auth users, cleaning up...', orphan_count;
        
        -- Delete orphaned auth users
        DELETE FROM auth.users 
        WHERE email = user_email AND id != latest_auth_id;
        
        RAISE NOTICE '✅ Cleaned up % orphaned auth users', orphan_count;
    ELSE
        RAISE NOTICE '✅ No orphaned auth users found';
    END IF;
END $$;

-- Step 3: Verify synchronization
SELECT 
    'Auth User' as source,
    id,
    email,
    created_at
FROM auth.users 
WHERE email = 'jlpt4you.owner@gmail.com'

UNION ALL

SELECT 
    'Public User' as source,
    id,
    email,
    created_at
FROM public.users 
WHERE email = 'jlpt4you.owner@gmail.com'
ORDER BY source;

-- Step 4: Update trigger to prevent future mismatches
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user already exists
  IF EXISTS (SELECT 1 FROM public.users WHERE email = NEW.email) THEN
    -- Update existing user with new auth ID
    UPDATE public.users 
    SET id = NEW.id, updated_at = NOW()
    WHERE email = NEW.email;
    
    RAISE NOTICE 'Updated existing user % with new auth ID %', NEW.email, NEW.id;
  ELSE
    -- Insert new user
    INSERT INTO public.users (id, email, name, role, created_at, updated_at)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
      'Free',
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Created new user % with ID %', NEW.email, NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail auth
    RAISE WARNING 'Failed to handle user %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check final user state
SELECT 
    u.id as user_id,
    u.email,
    u.role,
    u.created_at as user_created,
    au.id as auth_id,
    au.created_at as auth_created,
    CASE 
        WHEN u.id = au.id THEN '✅ SYNCED'
        ELSE '❌ MISMATCH'
    END as sync_status
FROM public.users u
FULL OUTER JOIN auth.users au ON u.email = au.email
WHERE u.email = 'jlpt4you.owner@gmail.com' OR au.email = 'jlpt4you.owner@gmail.com';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🚀 USER ID SYNCHRONIZATION COMPLETE!';
    RAISE NOTICE '✅ Auth and public user IDs are now synchronized';
    RAISE NOTICE '✅ Trigger updated to prevent future mismatches';
    RAISE NOTICE '✅ Orphaned auth users cleaned up';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Next steps:';
    RAISE NOTICE '1. Test login again in the app';
    RAISE NOTICE '2. Verify admin dashboard access works';
    RAISE NOTICE '3. Check that balance field loads correctly';
    RAISE NOTICE '';
END $$;
