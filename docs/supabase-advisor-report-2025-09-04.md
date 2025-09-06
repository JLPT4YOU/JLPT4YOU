# Supabase Advisors Report – JLPT4YOU

Generated at: 2025-09-04T05:37:44.930Z (UTC)
Environment: Production project connected to this repository

Summary
- Purpose: Track current Supabase security/performance findings while development continues. Action items can be applied when product stabilizes.
- Scope: Row Level Security (RLS), database functions, auth settings, indexes, and policy performance.

Actions Already Taken (on 2025-09-04)
1) Coupons RLS and Admin access
   - Enabled RLS on public.coupons and added a consolidated policy "Admins manage coupons" to allow Admin CRUD.
2) Coupon validation function made safe
   - Recreated public.validate_coupon as SECURITY DEFINER and fixed search_path (public, pg_temp) so it can read coupons under RLS safely.
3) Schema alignment for coupon_usage usage logging
   - Client code updated to insert amount_discounted instead of discount_applied.
4) Create coupon payload alignment
   - Client code now sets is_active on insert to match the form.

Security Findings (from Supabase Advisors)
1) RLS enabled, no policy – public.coupon_usage
   - Level: INFO (but should be addressed)
   - Risk: Inserts/selects may be blocked or overly permissive depending on defaults. Define explicit policies.
   - Remediation guide: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
   - Suggested policies (example):
     - Enable RLS: `ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;`
     - Users view own usage: `CREATE POLICY "Users can view own coupon usage" ON public.coupon_usage FOR SELECT USING (auth.uid() = user_id);`
     - Users insert own usage: `CREATE POLICY "Users can insert own usage" ON public.coupon_usage FOR INSERT WITH CHECK (auth.uid() = user_id);`
     - Admin view all usage: `CREATE POLICY "Admin can view all coupon usage" ON public.coupon_usage FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin'));`

2) Functions with mutable search_path
   - Level: WARN
   - Affected functions (partial list): update_ai_models_updated_at, update_ai_provider_settings_updated_at, set_updated_at, decrypt_api_key, encrypt_api_key, get_notification_stats, get_notification_metrics, get_unread_notification_count, mark_notification_read, mark_all_notifications_read, is_admin, log_admin_action, redeem_code, update_updated_at_column, handle_new_user.
   - Risk: SECURITY DEFINER functions without a fixed search_path can resolve objects unexpectedly or be abused.
   - Remediation guide: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable
   - Suggested fix template:
     - `CREATE OR REPLACE FUNCTION public.fn_name(...) RETURNS ... AS $$ ... $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;`

3) Auth security configuration
   - OTP expiry longer than 1 hour
     - Level: WARN
     - Recommendation: Reduce OTP expiry to < 1 hour. Guide: https://supabase.com/docs/guides/platform/going-into-prod#security
   - Leaked Password Protection disabled
     - Level: WARN
     - Recommendation: Enable leaked password protection. Guide: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

Performance Findings (from Supabase Advisors)
1) Unindexed foreign keys
   - Level: INFO
   - Tables:
     - public.coupons: FK coupons_created_by_fkey (column created_by)
     - public.books: FK books_uploaded_by_fkey (column uploaded_by)
   - Impact: Slower joins/updates/deletes involving FK relationships.
   - Remediation guide: https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys
   - Suggested indexes:
     - `CREATE INDEX IF NOT EXISTS idx_coupons_created_by ON public.coupons(created_by);`
     - `CREATE INDEX IF NOT EXISTS idx_books_uploaded_by ON public.books(uploaded_by);`

2) RLS initplan overhead (auth_rls_initplan)
   - Level: WARN
   - Issue: Policies that reference `auth.uid()` directly are re-evaluated per row.
   - Fix: Wrap calls as `(select auth.uid())` in policy predicates to help Postgres optimize.
   - Remediation guide: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
   - Example rewrite:
     - `USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = (select auth.uid()) AND users.role = 'Admin'))`

3) Unused indexes
   - Level: INFO
   - Many indexes appear unused (e.g., idx_users_display_name, idx_users_active, idx_transactions_created_at, idx_coupons_active, idx_coupons_valid_dates, etc.).
   - Recommendation: Monitor usage over time (pg_stat_user_indexes). Only drop after confirming they remain unused under real traffic.
   - Remediation guide: https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index

4) Multiple permissive policies for same role/action
   - Level: WARN
   - Impact: Each policy is evaluated per row; multiple permissive policies can add overhead.
   - Recommendation: Consolidate policies per role/action where possible.
   - Remediation guide: https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies

Recommended Next Steps (deferred until product hardening)
- Priority 1 (Security/RLS correctness)
  1. Add explicit coupon_usage RLS policies as outlined above.
- Priority 2 (Function safety)
  2. Recreate the flagged functions with SECURITY DEFINER (if appropriate) and `SET search_path = public, pg_temp`.
- Priority 3 (Performance hygiene)
  3. Add indexes for FK columns: `coupons.created_by`, `books.uploaded_by`.
  4. Update RLS policies to use `(select auth.uid())` in predicates to reduce per-row re-evaluation.
- Priority 4 (Auth security)
  5. Reduce OTP expiry to < 1 hour.
  6. Enable leaked password protection in Auth settings.
- Priority 5 (Housekeeping)
  7. Audit and eventually drop confirmed-unused indexes after sufficient monitoring.
  8. Consolidate overlapping permissive policies where feasible.

Operational Notes
- The Admin dashboard coupon creation issue was caused by missing/insufficient RLS for coupons. This is now fixed by adding an Admin policy and securing validate_coupon.
- The code now aligns with the current database schema for coupon usage logging and coupon creation.

Appendix – Useful SQL Snippets
- Add index (examples):
  - `CREATE INDEX IF NOT EXISTS idx_coupons_created_by ON public.coupons(created_by);`
  - `CREATE INDEX IF NOT EXISTS idx_books_uploaded_by ON public.books(uploaded_by);`
- Example RLS policy using `(select auth.uid())`:
  - `CREATE POLICY "Admins manage coupons" ON public.coupons FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = (select auth.uid()) AND users.role = 'Admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE users.id = (select auth.uid()) AND users.role = 'Admin'));`

Change Log
- 2025-09-04: Initial report created and core coupon fixes applied.

