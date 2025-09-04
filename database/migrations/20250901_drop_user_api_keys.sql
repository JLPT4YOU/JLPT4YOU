-- Drop user_api_keys table (client-only API keys migration)
-- Created: 2025-09-01

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_api_keys'
  ) THEN
    EXECUTE 'DROP TABLE public.user_api_keys';
  END IF;
END $$;

