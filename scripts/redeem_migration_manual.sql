
-- Run this SQL directly in Supabase Dashboard SQL Editor

-- Create redeem_codes table
CREATE TABLE IF NOT EXISTS public.redeem_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(16) UNIQUE NOT NULL,
    premium_days INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    created_by UUID REFERENCES public.users(id),
    redeemed_at TIMESTAMP WITH TIME ZONE,
    redeemed_by UUID REFERENCES public.users(id),
    expires_at TIMESTAMP WITH TIME ZONE,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_redeem_codes_code ON public.redeem_codes(code);
CREATE INDEX IF NOT EXISTS idx_redeem_codes_status ON public.redeem_codes(status);
CREATE INDEX IF NOT EXISTS idx_redeem_codes_created_by ON public.redeem_codes(created_by);
CREATE INDEX IF NOT EXISTS idx_redeem_codes_redeemed_by ON public.redeem_codes(redeemed_by);

-- Create redeem_history table
CREATE TABLE IF NOT EXISTS public.redeem_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code_id UUID REFERENCES public.redeem_codes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id),
    action VARCHAR(50) NOT NULL,
    premium_days_added INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for history
CREATE INDEX IF NOT EXISTS idx_redeem_history_user_id ON public.redeem_history(user_id);
CREATE INDEX IF NOT EXISTS idx_redeem_history_code_id ON public.redeem_history(code_id);

-- Enable RLS
ALTER TABLE public.redeem_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redeem_history ENABLE ROW LEVEL SECURITY;

-- Ensure 'Admin' value exists in user_role enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role' AND e.enumlabel = 'Admin'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'Admin';
  END IF;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage redeem codes" ON public.redeem_codes;
DROP POLICY IF EXISTS "Users can read active codes" ON public.redeem_codes;
DROP POLICY IF EXISTS "Admins can view all history" ON public.redeem_history;
DROP POLICY IF EXISTS "Users can view own history" ON public.redeem_history;

-- Policies for redeem_codes
CREATE POLICY "Admins can manage redeem codes" ON public.redeem_codes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'Admin'::user_role
        )
    );

CREATE POLICY "Users can read active codes" ON public.redeem_codes
    FOR SELECT USING (
        status = 'active'
    );

-- Policies for redeem_history
CREATE POLICY "Admins can view all history" ON public.redeem_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'Admin'::user_role
        )
    );

CREATE POLICY "Users can view own history" ON public.redeem_history
    FOR SELECT USING (
        user_id = auth.uid()
    );

-- Function to redeem a code
CREATE OR REPLACE FUNCTION public.redeem_code(
    p_code VARCHAR(16),
    p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_code_record RECORD;
    v_user_record RECORD;
    v_new_expiry TIMESTAMP WITH TIME ZONE;
    v_result JSON;
BEGIN
    -- Get code details with lock
    SELECT * INTO v_code_record
    FROM public.redeem_codes
    WHERE code = p_code
    FOR UPDATE;
    
    -- Check if code exists
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid code'
        );
    END IF;
    
    -- Check if code is active
    IF v_code_record.status != 'active' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Code has already been redeemed or expired'
        );
    END IF;
    
    -- Check if code has expired
    IF v_code_record.expires_at IS NOT NULL AND v_code_record.expires_at < NOW() THEN
        -- Update status to expired
        UPDATE public.redeem_codes
        SET status = 'expired'
        WHERE id = v_code_record.id;
        
        RETURN json_build_object(
            'success', false,
            'error', 'Code has expired'
        );
    END IF;
    
    -- Get user details
    SELECT * INTO v_user_record
    FROM public.users
    WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User not found'
        );
    END IF;
    
    -- Calculate new expiry date
    IF v_user_record.subscription_expires_at IS NULL OR v_user_record.subscription_expires_at < NOW() THEN
        -- No active subscription or expired, start from now
        v_new_expiry := NOW() + (v_code_record.premium_days || ' days')::INTERVAL;
    ELSE
        -- Add to existing subscription
        v_new_expiry := v_user_record.subscription_expires_at + (v_code_record.premium_days || ' days')::INTERVAL;
    END IF;
    
    -- Update user's premium status
    UPDATE public.users
    SET 
        subscription_expires_at = v_new_expiry
    WHERE id = p_user_id;
    
    -- Mark code as redeemed
    UPDATE public.redeem_codes
    SET 
        status = 'redeemed',
        redeemed_at = NOW(),
        redeemed_by = p_user_id
    WHERE id = v_code_record.id;
    
    -- Add to history
    INSERT INTO public.redeem_history (
        code_id,
        user_id,
        action,
        premium_days_added,
        metadata
    ) VALUES (
        v_code_record.id,
        p_user_id,
        'redeemed',
        v_code_record.premium_days,
        json_build_object(
            'code', v_code_record.code,
            'previous_expiry', v_user_record.subscription_expires_at,
            'new_expiry', v_new_expiry
        )
    );
    
    RETURN json_build_object(
        'success', true,
        'premium_days_added', v_code_record.premium_days,
        'new_expiry', v_new_expiry,
        'message', 'Code redeemed successfully'
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.redeem_code TO authenticated;

-- Create sample redeem codes for testing (optional)
/*
INSERT INTO public.redeem_codes (code, premium_days, description, created_by)
VALUES 
    ('TEST-1234-5678-9ABC', 30, 'Test code - 30 days premium', NULL),
    ('DEMO-ABCD-EFGH-IJKL', 7, 'Demo code - 7 days premium', NULL);
*/
        