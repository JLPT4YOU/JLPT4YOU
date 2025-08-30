-- Debug Admin Top-up Issues
-- Run these queries in Supabase SQL Editor to check system status

-- 1. Check if balance column exists in users table
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public' 
AND column_name = 'balance';

-- 2. Check if transactions table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'transactions' 
AND table_schema = 'public';

-- 3. Check if transaction_type enum exists
SELECT typname 
FROM pg_type 
WHERE typname = 'transaction_type';

-- 4. Check current user's role (replace with your user ID)
SELECT id, email, name, role, balance 
FROM public.users 
WHERE email = 'your-admin-email@example.com';

-- 5. Check all users and their roles
SELECT id, email, name, role, balance, subscription_expires_at 
FROM public.users 
ORDER BY created_at DESC;

-- 6. Test if Service Role Key works (should show all users including balance)
-- This query should work if migration ran successfully
SELECT COUNT(*) as total_users, 
       COUNT(CASE WHEN balance IS NOT NULL THEN 1 END) as users_with_balance,
       AVG(balance) as avg_balance
FROM public.users;
