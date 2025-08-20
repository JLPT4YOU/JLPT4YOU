-- Optimize notifications system for better performance
-- This migration addresses the issue of frequent notification checks causing server overload

-- Add composite index for better performance on unread count queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON public.notifications(user_id, is_read) 
WHERE is_read = FALSE;

-- Add index for important notifications real-time subscriptions
CREATE INDEX IF NOT EXISTS idx_notifications_important 
ON public.notifications(user_id, is_important, created_at DESC) 
WHERE is_important = TRUE;

-- Add index for admin and system notifications
CREATE INDEX IF NOT EXISTS idx_notifications_priority_types 
ON public.notifications(user_id, type, created_at DESC) 
WHERE type IN ('admin_message', 'system', 'premium_upgrade');

-- Update the unread count function with better performance
CREATE OR REPLACE FUNCTION public.get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    count_result INTEGER;
BEGIN
    -- Use the optimized composite index
    SELECT COUNT(*)
    INTO count_result
    FROM public.notifications
    WHERE user_id = p_user_id
        AND is_read = FALSE
        AND (expires_at IS NULL OR expires_at > NOW());
    
    RETURN COALESCE(count_result, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create function to get only important notifications for real-time updates
CREATE OR REPLACE FUNCTION public.get_important_notifications(p_user_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    type VARCHAR(50),
    title TEXT,
    content TEXT,
    is_important BOOLEAN,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT n.id, n.type, n.title, n.content, n.is_important, n.created_at
    FROM public.notifications n
    WHERE n.user_id = p_user_id
        AND (n.is_important = TRUE OR n.type IN ('admin_message', 'system', 'premium_upgrade'))
        AND n.is_read = FALSE
        AND (n.expires_at IS NULL OR n.expires_at > NOW())
    ORDER BY n.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Add a function to clean up old read notifications (optional maintenance)
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete read notifications older than 30 days
    DELETE FROM public.notifications
    WHERE is_read = TRUE 
        AND read_at < NOW() - INTERVAL '30 days'
        AND type NOT IN ('admin_message', 'system'); -- Keep admin/system messages longer
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get notification statistics (for admin monitoring)
-- Using function instead of view to handle RLS properly
CREATE OR REPLACE FUNCTION public.get_notification_stats()
RETURNS TABLE (
    hour TIMESTAMPTZ,
    type VARCHAR(50),
    count BIGINT,
    read_count BIGINT,
    important_count BIGINT
) AS $$
BEGIN
    -- Check if user is admin
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
    END IF;

    RETURN QUERY
    SELECT
        DATE_TRUNC('hour', n.created_at) as hour,
        n.type,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE n.is_read = TRUE) as read_count,
        COUNT(*) FILTER (WHERE n.is_important = TRUE) as important_count
    FROM public.notifications n
    WHERE n.created_at >= NOW() - INTERVAL '24 hours'
    GROUP BY DATE_TRUNC('hour', n.created_at), n.type
    ORDER BY hour DESC, n.type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
