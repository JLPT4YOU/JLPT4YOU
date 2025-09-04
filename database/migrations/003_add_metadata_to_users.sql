-- Add metadata column to users table for storing prompt configurations and AI settings
-- This column will store JSON data including:
-- - promptConfig: user's personalized AI prompt settings
-- - aiLanguage: selected AI communication language
-- - customAiLanguage: custom language if specified

-- Add metadata column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create index for better query performance on metadata column
CREATE INDEX IF NOT EXISTS idx_users_metadata ON public.users USING gin(metadata);

-- Add comment to document the column purpose
COMMENT ON COLUMN public.users.metadata IS 'Stores user preferences including AI prompt settings, language preferences, and other configuration data';
