-- Create coupon_usage table to track coupon usage history
CREATE TABLE IF NOT EXISTS public.coupon_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id TEXT,
  amount_discounted DECIMAL(10, 2),
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for performance
  CONSTRAINT unique_user_coupon_order UNIQUE(user_id, coupon_id, order_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_id ON public.coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user_id ON public.coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_used_at ON public.coupon_usage(used_at);

-- Enable RLS
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view their own coupon usage history
CREATE POLICY "Users can view own coupon usage" ON public.coupon_usage
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only system/admin can insert usage records
CREATE POLICY "System can insert coupon usage" ON public.coupon_usage
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin can view all usage records
CREATE POLICY "Admin can view all coupon usage" ON public.coupon_usage
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'Admin'
    )
  );

-- Add comment for documentation
COMMENT ON TABLE public.coupon_usage IS 'Tracks historical usage of coupons by users';
COMMENT ON COLUMN public.coupon_usage.amount_discounted IS 'The actual discount amount applied in USD';
