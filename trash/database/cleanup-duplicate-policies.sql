-- 🧹 CLEANUP DUPLICATE RLS POLICIES
-- Run this in Supabase SQL Editor with admin privileges
-- This will remove duplicate policies that are causing conflicts

-- Drop the old duplicate policies
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
DROP POLICY IF EXISTS "users_insert_policy" ON public.users; 
DROP POLICY IF EXISTS "users_update_policy" ON public.users;

-- Verify cleanup - should only see clean policies now
DO $$
DECLARE
    policy_record RECORD;
    policy_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🧹 CLEANUP RESULTS:';
    RAISE NOTICE '==================';
    
    FOR policy_record IN 
        SELECT policyname, cmd
        FROM pg_policies 
        WHERE tablename = 'users' AND schemaname = 'public'
        ORDER BY policyname
    LOOP
        policy_count := policy_count + 1;
        RAISE NOTICE '✅ Policy: % (%)', policy_record.policyname, policy_record.cmd;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 Total policies after cleanup: %', policy_count;
    
    -- Check for duplicates
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname LIKE 'users_%_policy') THEN
        RAISE NOTICE '⚠️  Still have old-style policies - manual cleanup needed';
    ELSE
        RAISE NOTICE '✅ No duplicate policies found - cleanup successful!';
    END IF;
    
    RAISE NOTICE '';
END $$;
