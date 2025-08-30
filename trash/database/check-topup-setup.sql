-- ========================================
-- CHECK TOP-UP SETUP IN DATABASE
-- Run these queries in Supabase SQL Editor
-- ========================================

-- 1. Check if balance column exists in users table
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
    AND table_schema = 'public' 
    AND column_name = 'balance';

-- Expected: Should return 1 row with balance column details
-- If empty, run: ALTER TABLE public.users ADD COLUMN balance DECIMAL(10,2) DEFAULT 0;

-- ========================================

-- 2. Check if transactions table exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'transactions' 
    AND table_schema = 'public';

-- Expected: Should return 1 row
-- If empty, need to create transactions table

-- ========================================

-- 3. Check transactions table structure (if exists)
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'transactions' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Expected columns: id, user_id, type, amount, description, metadata, created_at

-- ========================================

-- 4. Check RLS policies on users table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'users'
    AND schemaname = 'public';

-- Service Role Key should bypass all RLS

-- ========================================

-- 5. Test query - Get all users with balance
SELECT 
    id,
    email,
    name,
    role,
    balance,
    created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 10;

-- ========================================

-- 6. If balance column is missing, add it:
-- ALTER TABLE public.users 
-- ADD COLUMN IF NOT EXISTS balance DECIMAL(10,2) DEFAULT 0;

-- ========================================

-- 7. If transactions table is missing, create it:
/*
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_id 
ON public.transactions(user_id);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see their own transactions
CREATE POLICY "Users can view own transactions" 
ON public.transactions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Service role bypasses RLS automatically
*/

-- ========================================

-- 8. Test top-up manually (replace with actual user_id)
/*
-- Get a test user
SELECT id, email, balance FROM public.users LIMIT 1;

-- Update balance (replace 'user-id-here' with actual ID)
UPDATE public.users 
SET balance = balance + 10.00,
    updated_at = NOW()
WHERE id = 'user-id-here'
RETURNING id, email, balance;

-- Add transaction record
INSERT INTO public.transactions (
    user_id,
    type,
    amount,
    description,
    metadata
) VALUES (
    'user-id-here',
    'topup',
    10.00,
    'Manual test top-up',
    '{"admin_test": true}'::jsonb
);
*/
