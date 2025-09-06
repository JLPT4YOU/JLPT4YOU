-- Create admin_actions table for audit trail
CREATE TABLE IF NOT EXISTS public.admin_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES public.users(id) NOT NULL,
    admin_email VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_user_id UUID REFERENCES public.users(id),
    target_user_email VARCHAR(255),
    details JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for performance
CREATE INDEX idx_admin_actions_admin_id ON public.admin_actions(admin_id);
CREATE INDEX idx_admin_actions_target_user_id ON public.admin_actions(target_user_id);
CREATE INDEX idx_admin_actions_action ON public.admin_actions(action);
CREATE INDEX idx_admin_actions_created_at ON public.admin_actions(created_at);

-- Enable RLS
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin actions
CREATE POLICY "Admins can view admin actions" ON public.admin_actions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'Admin'::user_role
        )
    );

-- Only authenticated users can insert (function will validate admin status)
CREATE POLICY "Authenticated users can insert admin actions" ON public.admin_actions
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- Function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
    p_admin_id UUID,
    p_admin_email VARCHAR(255),
    p_action VARCHAR(100),
    p_target_user_id UUID DEFAULT NULL,
    p_target_user_email VARCHAR(255) DEFAULT NULL,
    p_details JSONB DEFAULT '{}'::jsonb,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_action_id UUID;
    v_admin_record RECORD;
BEGIN
    -- Verify admin status
    SELECT * INTO v_admin_record
    FROM public.users
    WHERE id = p_admin_id AND role = 'Admin'::user_role;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User is not an admin';
    END IF;
    
    -- Insert admin action
    INSERT INTO public.admin_actions (
        admin_id,
        admin_email,
        action,
        target_user_id,
        target_user_email,
        details,
        ip_address,
        user_agent
    ) VALUES (
        p_admin_id,
        p_admin_email,
        p_action,
        p_target_user_id,
        p_target_user_email,
        p_details,
        p_ip_address,
        p_user_agent
    ) RETURNING id INTO v_action_id;
    
    RETURN v_action_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.log_admin_action TO authenticated;
