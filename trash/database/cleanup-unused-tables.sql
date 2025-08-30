-- JLPT4YOU Database Cleanup Script
-- Xóa các bảng và functions không sử dụng
-- Date: 2025-07-27
-- Backup: data_2025-07-27_12-25-07-476Z.sql

-- ============================================================================
-- QUAN TRỌNG: CHẠY BACKUP TRƯỚC KHI THỰC HIỆN SCRIPT NÀY
-- ============================================================================
-- npm run backup:create
-- Hoặc tạo backup manual trong Supabase Dashboard
-- ============================================================================

BEGIN;

-- Log cleanup action
DO $$
BEGIN
    RAISE NOTICE '🧹 JLPT4YOU Database Cleanup - Starting at %', NOW();
    RAISE NOTICE '📋 Target: Remove unused tables (study_sessions, ai_models) and related objects';
END $$;

-- ============================================================================
-- PHASE 1: XÓA INDEXES LIÊN QUAN ĐẾN STUDY_SESSIONS
-- ============================================================================

DO $$
BEGIN
    -- Xóa index cho study_sessions nếu tồn tại
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_study_sessions_user_id') THEN
        DROP INDEX idx_study_sessions_user_id;
        RAISE NOTICE '✅ Dropped index: idx_study_sessions_user_id';
    ELSE
        RAISE NOTICE '⚠️  Index idx_study_sessions_user_id does not exist';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_study_sessions_started_at') THEN
        DROP INDEX idx_study_sessions_started_at;
        RAISE NOTICE '✅ Dropped index: idx_study_sessions_started_at';
    ELSE
        RAISE NOTICE '⚠️  Index idx_study_sessions_started_at does not exist';
    END IF;
END $$;

-- ============================================================================
-- PHASE 2: XÓA ROW LEVEL SECURITY POLICIES
-- ============================================================================

DO $$
BEGIN
    -- Xóa policies cho study_sessions
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'study_sessions' 
        AND policyname = 'Users can view own study sessions'
    ) THEN
        DROP POLICY "Users can view own study sessions" ON public.study_sessions;
        RAISE NOTICE '✅ Dropped policy: Users can view own study sessions';
    ELSE
        RAISE NOTICE '⚠️  Policy "Users can view own study sessions" does not exist';
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'study_sessions' 
        AND policyname = 'Users can insert own study sessions'
    ) THEN
        DROP POLICY "Users can insert own study sessions" ON public.study_sessions;
        RAISE NOTICE '✅ Dropped policy: Users can insert own study sessions';
    ELSE
        RAISE NOTICE '⚠️  Policy "Users can insert own study sessions" does not exist';
    END IF;
END $$;

-- ============================================================================
-- PHASE 3: XÓA CÁC BẢNG KHÔNG SỬ DỤNG
-- ============================================================================

DO $$
BEGIN
    -- Kiểm tra xem bảng có tồn tại không
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'study_sessions'
    ) THEN
        -- Kiểm tra số lượng rows trước khi xóa
        DECLARE
            row_count INTEGER;
        BEGIN
            SELECT COUNT(*) INTO row_count FROM public.study_sessions;
            RAISE NOTICE '📊 Table study_sessions has % rows', row_count;
            
            IF row_count > 0 THEN
                RAISE WARNING '⚠️  Table study_sessions contains data! Consider backing up first.';
                -- Uncomment next line to prevent deletion if data exists
                -- RAISE EXCEPTION 'Aborting: Table contains data';
            END IF;
        END;

        -- Xóa bảng (CASCADE để xóa cả dependencies)
        DROP TABLE public.study_sessions CASCADE;
        RAISE NOTICE '✅ Dropped table: public.study_sessions';
    ELSE
        RAISE NOTICE '⚠️  Table public.study_sessions does not exist';
    END IF;
END $$;

-- Xóa bảng ai_models nếu tồn tại
DO $$
BEGIN
    -- Kiểm tra xem bảng có tồn tại không
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'ai_models'
    ) THEN
        -- Kiểm tra số lượng rows trước khi xóa
        DECLARE
            row_count INTEGER;
        BEGIN
            SELECT COUNT(*) INTO row_count FROM public.ai_models;
            RAISE NOTICE '📊 Table ai_models has % rows', row_count;

            IF row_count > 0 THEN
                RAISE WARNING '⚠️  Table ai_models contains data! Consider backing up first.';
                -- Uncomment next line to prevent deletion if data exists
                -- RAISE EXCEPTION 'Aborting: Table contains data';
            END IF;
        END;

        -- Xóa bảng (CASCADE để xóa cả dependencies)
        DROP TABLE public.ai_models CASCADE;
        RAISE NOTICE '✅ Dropped table: public.ai_models';
    ELSE
        RAISE NOTICE '⚠️  Table public.ai_models does not exist';
    END IF;
END $$;

-- ============================================================================
-- PHASE 4: XÓA FUNCTIONS KHÔNG SỬ DỤNG
-- ============================================================================

DO $$
BEGIN
    -- Xóa function update_user_progress_stats nếu tồn tại
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'update_user_progress_stats'
    ) THEN
        DROP FUNCTION public.update_user_progress_stats(UUID);
        RAISE NOTICE '✅ Dropped function: public.update_user_progress_stats(UUID)';
    ELSE
        RAISE NOTICE '⚠️  Function public.update_user_progress_stats(UUID) does not exist';
    END IF;
END $$;

-- ============================================================================
-- PHASE 5: VERIFICATION - KIỂM TRA KẾT QUẢ
-- ============================================================================

DO $$
DECLARE
    table_count INTEGER;
    ai_models_count INTEGER;
    function_count INTEGER;
    policy_count INTEGER;
    index_count INTEGER;
BEGIN
    RAISE NOTICE '🔍 VERIFICATION - Checking cleanup results...';

    -- Kiểm tra bảng study_sessions đã bị xóa chưa
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'study_sessions';

    IF table_count = 0 THEN
        RAISE NOTICE '✅ Confirmed: study_sessions table removed';
    ELSE
        RAISE WARNING '❌ Table study_sessions still exists!';
    END IF;

    -- Kiểm tra bảng ai_models đã bị xóa chưa
    SELECT COUNT(*) INTO ai_models_count
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'ai_models';

    IF ai_models_count = 0 THEN
        RAISE NOTICE '✅ Confirmed: ai_models table removed';
    ELSE
        RAISE WARNING '❌ Table ai_models still exists!';
    END IF;
    
    -- Kiểm tra function đã bị xóa chưa
    SELECT COUNT(*) INTO function_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'update_user_progress_stats';
    
    IF function_count = 0 THEN
        RAISE NOTICE '✅ Confirmed: update_user_progress_stats function removed';
    ELSE
        RAISE WARNING '❌ Function update_user_progress_stats still exists!';
    END IF;
    
    -- Kiểm tra policies đã bị xóa chưa
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'study_sessions';
    
    IF policy_count = 0 THEN
        RAISE NOTICE '✅ Confirmed: study_sessions policies removed';
    ELSE
        RAISE WARNING '❌ Some study_sessions policies still exist!';
    END IF;
    
    -- Kiểm tra indexes đã bị xóa chưa
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE indexname LIKE '%study_sessions%';
    
    IF index_count = 0 THEN
        RAISE NOTICE '✅ Confirmed: study_sessions indexes removed';
    ELSE
        RAISE WARNING '❌ Some study_sessions indexes still exist!';
    END IF;
END $$;

-- ============================================================================
-- PHASE 6: SUMMARY
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '🎉 CLEANUP COMPLETED at %', NOW();
    RAISE NOTICE '📋 Summary:';
    RAISE NOTICE '   - Removed table: study_sessions';
    RAISE NOTICE '   - Removed table: ai_models (25 AI model records)';
    RAISE NOTICE '   - Removed function: update_user_progress_stats';
    RAISE NOTICE '   - Removed related indexes and policies';
    RAISE NOTICE '   - Database is now cleaner and more focused';
    RAISE NOTICE '';
    RAISE NOTICE '💡 Next steps:';
    RAISE NOTICE '   1. Update database/schema.sql to remove study_sessions';
    RAISE NOTICE '   2. Update backup scripts if needed';
    RAISE NOTICE '   3. Test application functionality';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Rollback: Use backup data_2025-07-27_12-25-07-476Z.sql if needed';
END $$;

COMMIT;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================================================
-- 
-- If you need to rollback this cleanup:
-- 1. Restore from backup:
--    psql -h your-host -U postgres -d your-db < backups/schema_2025-07-27_12-25-07-476Z.sql
-- 
-- 2. Or manually recreate the table:
--    CREATE TABLE public.study_sessions (
--        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
--        user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
--        session_type TEXT NOT NULL,
--        duration INTEGER NOT NULL,
--        questions_answered INTEGER DEFAULT 0,
--        correct_answers INTEGER DEFAULT 0,
--        topics_covered TEXT[] DEFAULT '{}',
--        started_at TIMESTAMPTZ NOT NULL,
--        ended_at TIMESTAMPTZ NOT NULL,
--        metadata JSONB DEFAULT '{}'::jsonb
--    );
-- 
-- ============================================================================
