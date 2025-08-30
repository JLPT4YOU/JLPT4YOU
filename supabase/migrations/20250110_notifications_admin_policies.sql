-- Notifications Admin Policies and Improvements
-- Ensure admins can insert notifications and system can broadcast
-- Also restrict normal users from inserting notifications

DO $$
BEGIN
  -- Create admin check function if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'is_admin'
  ) THEN
    CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
    RETURNS boolean
    LANGUAGE plpgsql
    STABLE
    AS $fn$
    BEGIN
      RETURN EXISTS (
        SELECT 1 FROM public.users WHERE id = uid AND role = 'Admin'
      );
    END;
    $fn$;
  END IF;

  -- RLS for notifications: keep existing user policies; add admin insert/select
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Admins can manage notifications'
  ) THEN
    CREATE POLICY "Admins can manage notifications"
      ON public.notifications
      FOR ALL
      USING (public.is_admin(auth.uid()))
      WITH CHECK (public.is_admin(auth.uid()));
  END IF;

  -- Remove overly-permissive legacy policy if exists
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'System can insert notifications'
  ) THEN
    DROP POLICY "System can insert notifications" ON public.notifications;
  END IF;

  -- Allow service role to insert (edge/admin)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Service role can insert notifications'
  ) THEN
    CREATE POLICY "Service role can insert notifications"
      ON public.notifications
      FOR INSERT
      WITH CHECK (current_setting('role', true) = 'service_role');
  END IF;

  -- Allow authenticated users to insert only self-targeted, whitelisted auto types
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can insert own auto notifications'
  ) THEN
    CREATE POLICY "Users can insert own auto notifications"
      ON public.notifications
      FOR INSERT
      WITH CHECK (
        auth.uid() IS NOT NULL
        AND auth.uid() = user_id
        AND type IN ('top_up_success','premium_upgrade','redeem_code')
      );
  END IF;
END $$;

-- Helpful index for unread per user
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

