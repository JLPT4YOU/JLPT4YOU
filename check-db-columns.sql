-- Check if columns exist in users table
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check current user data
SELECT 
    id, 
    email, 
    name, 
    display_name, 
    avatar_icon,
    created_at,
    updated_at
FROM public.users 
LIMIT 5;
