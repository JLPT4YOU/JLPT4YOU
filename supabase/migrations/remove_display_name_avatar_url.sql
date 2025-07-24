-- Migration script to remove display_name and avatar_url columns
-- Run this in Supabase SQL Editor

-- Drop display_name column if exists
ALTER TABLE public.users DROP COLUMN IF EXISTS display_name;

-- Drop avatar_url column if exists  
ALTER TABLE public.users DROP COLUMN IF EXISTS avatar_url;

-- Add comment to name column
COMMENT ON COLUMN public.users.name IS 'Tên người dùng dùng để hiển thị';

-- Update any null names to use email prefix as fallback
UPDATE public.users 
SET name = split_part(email, '@', 1) 
WHERE name IS NULL OR name = '';
