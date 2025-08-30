-- Fix notification stats - remove view and use function instead
-- Views cannot have RLS policies, so we use a function with admin check

-- Drop the view if it exists
DROP VIEW IF EXISTS public.notification_stats;

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

-- Create additional admin functions for monitoring
CREATE OR REPLACE FUNCTION public.get_notification_metrics()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Check if user is admin
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
    END IF;

    SELECT json_build_object(
        'total_notifications_24h', (
            SELECT COUNT(*) 
            FROM public.notifications 
            WHERE created_at >= NOW() - INTERVAL '24 hours'
        ),
        'unread_notifications_24h', (
            SELECT COUNT(*) 
            FROM public.notifications 
            WHERE created_at >= NOW() - INTERVAL '24 hours' 
            AND is_read = FALSE
        ),
        'important_notifications_24h', (
            SELECT COUNT(*) 
            FROM public.notifications 
            WHERE created_at >= NOW() - INTERVAL '24 hours' 
            AND is_important = TRUE
        ),
        'notifications_last_hour', (
            SELECT COUNT(*) 
            FROM public.notifications 
            WHERE created_at >= NOW() - INTERVAL '1 hour'
        ),
        'type_frequency', (
            SELECT json_object_agg(type, count)
            FROM (
                SELECT type, COUNT(*) as count
                FROM public.notifications
                WHERE created_at >= NOW() - INTERVAL '24 hours'
                GROUP BY type
            ) t
        )
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
