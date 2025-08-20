-- Align coupon_usage columns across environments
-- Goal: ensure column amount_discounted exists
-- Handle legacy schemas where discount_applied existed instead

DO $$
BEGIN
  -- If amount_discounted does not exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'coupon_usage'
      AND column_name = 'amount_discounted'
  ) THEN
    -- If legacy discount_applied exists, rename it
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'coupon_usage'
        AND column_name = 'discount_applied'
    ) THEN
      EXECUTE 'ALTER TABLE public.coupon_usage RENAME COLUMN discount_applied TO amount_discounted';
    ELSE
      -- Otherwise add a new column
      EXECUTE 'ALTER TABLE public.coupon_usage ADD COLUMN amount_discounted DECIMAL(10,2)';
    END IF;
  END IF;

  -- Optionally ensure order_id column exists (for compatibility)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'coupon_usage'
      AND column_name = 'order_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.coupon_usage ADD COLUMN order_id TEXT';
  END IF;
END
$$;
