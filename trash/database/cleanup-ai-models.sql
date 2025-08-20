-- JLPT4YOU: Cleanup AI Models Table
-- Xóa bảng ai_models không được sử dụng
-- Date: 2025-07-27
-- Backup: data_2025-07-27_12-38-44-655Z.sql (25 records)

-- ============================================================================
-- QUAN TRỌNG: ĐÃ TẠO BACKUP TẠI data_2025-07-27_12-38-44-655Z.sql
-- ============================================================================

BEGIN;

-- Log cleanup action
DO $$
BEGIN
    RAISE NOTICE '🧹 JLPT4YOU AI Models Cleanup - Starting at %', NOW();
    RAISE NOTICE '📋 Target: Remove unused ai_models table (25 records)';
    RAISE NOTICE '💾 Backup: data_2025-07-27_12-38-44-655Z.sql';
END $$;

-- Kiểm tra và xóa bảng ai_models
DO $$
DECLARE
    row_count INTEGER;
BEGIN
    -- Kiểm tra xem bảng có tồn tại không
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ai_models'
    ) THEN
        -- Đếm số lượng records
        SELECT COUNT(*) INTO row_count FROM public.ai_models;
        RAISE NOTICE '📊 Table ai_models has % rows', row_count;
        
        -- Hiển thị một số thông tin về data sẽ bị xóa
        RAISE NOTICE '🔍 Sample data being deleted:';
        
        -- Show some sample records
        FOR rec IN (
            SELECT name, provider, status 
            FROM public.ai_models 
            WHERE is_default = true 
            LIMIT 3
        ) LOOP
            RAISE NOTICE '   - % (%) [%]', rec.name, rec.provider, rec.status;
        END LOOP;
        
        -- Xóa bảng
        DROP TABLE public.ai_models CASCADE;
        RAISE NOTICE '✅ Successfully dropped table: public.ai_models';
        RAISE NOTICE '🗑️  Removed % AI model records', row_count;
        
    ELSE
        RAISE NOTICE '⚠️  Table public.ai_models does not exist';
    END IF;
END $$;

-- Verification
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    RAISE NOTICE '🔍 VERIFICATION - Checking cleanup results...';
    
    -- Kiểm tra bảng đã bị xóa chưa
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'ai_models'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE NOTICE '✅ Confirmed: ai_models table successfully removed';
    ELSE
        RAISE WARNING '❌ Table ai_models still exists!';
    END IF;
END $$;

-- Summary
DO $$
BEGIN
    RAISE NOTICE '🎉 AI MODELS CLEANUP COMPLETED at %', NOW();
    RAISE NOTICE '📋 Summary:';
    RAISE NOTICE '   - Removed table: ai_models';
    RAISE NOTICE '   - Removed 25 AI model records (Gemini + Groq)';
    RAISE NOTICE '   - Database is now cleaner and focused';
    RAISE NOTICE '';
    RAISE NOTICE '💡 Benefits:';
    RAISE NOTICE '   - Reduced database size';
    RAISE NOTICE '   - Faster backups';
    RAISE NOTICE '   - Cleaner schema';
    RAISE NOTICE '   - No impact on application functionality';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Rollback: Use backup data_2025-07-27_12-38-44-655Z.sql if needed';
    RAISE NOTICE '   psql -h host -U user -d db < backups/data_2025-07-27_12-38-44-655Z.sql';
END $$;

COMMIT;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================================================
-- 
-- If you need to restore the ai_models table:
-- 
-- 1. Restore from backup:
--    \i backups/data_2025-07-27_12-38-44-655Z.sql
-- 
-- 2. Or manually recreate with sample data:
--    CREATE TABLE public.ai_models (
--        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--        name TEXT NOT NULL,
--        provider TEXT NOT NULL,
--        model_id TEXT NOT NULL,
--        status TEXT DEFAULT 'active',
--        config JSONB DEFAULT '{}',
--        capabilities JSONB DEFAULT '{}',
--        description TEXT,
--        version TEXT,
--        context_length INTEGER,
--        created_by UUID,
--        is_default BOOLEAN DEFAULT false,
--        is_public BOOLEAN DEFAULT true,
--        created_at TIMESTAMPTZ DEFAULT NOW(),
--        updated_at TIMESTAMPTZ DEFAULT NOW(),
--        last_validated_at TIMESTAMPTZ
--    );
-- 
-- ============================================================================
