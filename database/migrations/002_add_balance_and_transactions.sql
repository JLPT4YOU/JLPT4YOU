-- Migration: Add balance and transactions support
-- Date: 2025-08-04  
-- Description: Add balance field to users table and create transactions table for payment history

-- Add balance field to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS balance DECIMAL(10,2) DEFAULT 0.00 NOT NULL;

-- Add constraint to ensure balance is non-negative (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'balance_non_negative' 
        AND table_name = 'users' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD CONSTRAINT balance_non_negative CHECK (balance >= 0);
    END IF;
END $$;

-- Add comment for the balance field
COMMENT ON COLUMN public.users.balance IS 'User account balance in USD for premium purchases';

-- Create transaction types enum (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
        CREATE TYPE transaction_type AS ENUM ('topup', 'purchase', 'refund');
    END IF;
END $$;

-- Create transactions table for payment history
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    type transaction_type NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT valid_amount CHECK (amount > 0)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);

-- Enable RLS for transactions table
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Transactions policies - users can only see their own transactions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'transactions' 
        AND policyname = 'Users can view own transactions'
    ) THEN
        CREATE POLICY "Users can view own transactions" ON public.transactions
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- Allow service role and authenticated users to insert transactions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'transactions' 
        AND policyname = 'Allow authenticated transaction inserts'
    ) THEN
        CREATE POLICY "Allow authenticated transaction inserts" ON public.transactions
            FOR INSERT WITH CHECK (
                -- Allow service role (for admin operations)
                current_setting('role') = 'service_role' OR
                -- Allow authenticated users to insert their own transactions
                (auth.uid() IS NOT NULL AND auth.uid() = user_id)
            );
    END IF;
END $$;

-- Drop the overly restrictive policy if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'transactions' 
        AND policyname = 'No direct user inserts on transactions'
    ) THEN
        DROP POLICY "No direct user inserts on transactions" ON public.transactions;
    END IF;
END $$;

-- No user updates/deletes on transactions (audit trail)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'transactions' 
        AND policyname = 'No user updates on transactions'
    ) THEN
        CREATE POLICY "No user updates on transactions" ON public.transactions
            FOR UPDATE USING (false);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'transactions' 
        AND policyname = 'No user deletes on transactions'
    ) THEN
        CREATE POLICY "No user deletes on transactions" ON public.transactions
            FOR DELETE USING (false);
    END IF;
END $$;

-- Initialize balance to 0 for existing users
UPDATE public.users SET balance = 0.00 WHERE balance IS NULL;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Balance and transactions migration completed successfully';
    RAISE NOTICE '📊 Added balance field to users table';
    RAISE NOTICE '📋 Created transactions table with RLS policies';
END $$;
