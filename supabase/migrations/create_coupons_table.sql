-- Create coupons table for managing discount codes
CREATE TABLE IF NOT EXISTS coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
  min_purchase_amount DECIMAL(10,2) DEFAULT 0,
  max_discount_amount DECIMAL(10,2), -- For percentage discounts, cap the maximum discount
  usage_limit INTEGER DEFAULT NULL, -- NULL means unlimited
  usage_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_dates ON coupons(valid_from, valid_until);

-- Note: coupon_usage table is created in separate migration file

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
-- Idempotent trigger creation to avoid duplicate errors
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_coupons_updated_at'
  ) THEN
    CREATE TRIGGER update_coupons_updated_at
    BEFORE UPDATE ON coupons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;

-- Create function to validate coupon
CREATE OR REPLACE FUNCTION validate_coupon(
  p_code VARCHAR,
  p_user_id UUID,
  p_amount DECIMAL
)
RETURNS TABLE (
  is_valid BOOLEAN,
  discount_type VARCHAR,
  discount_value DECIMAL,
  max_discount_amount DECIMAL,
  message TEXT
) AS $$
DECLARE
  v_coupon RECORD;
  v_usage_count INTEGER;
BEGIN
  -- Get coupon details
  SELECT * INTO v_coupon
  FROM coupons
  WHERE UPPER(code) = UPPER(p_code)
  LIMIT 1;

  -- Check if coupon exists
  IF v_coupon.id IS NULL THEN
    RETURN QUERY SELECT 
      false::BOOLEAN,
      NULL::VARCHAR,
      NULL::DECIMAL,
      NULL::DECIMAL,
      'Mã giảm giá không tồn tại'::TEXT;
    RETURN;
  END IF;

  -- Check if coupon is active
  IF NOT v_coupon.is_active THEN
    RETURN QUERY SELECT 
      false::BOOLEAN,
      NULL::VARCHAR,
      NULL::DECIMAL,
      NULL::DECIMAL,
      'Mã giảm giá đã ngừng hoạt động'::TEXT;
    RETURN;
  END IF;

  -- Check validity dates
  IF NOW() < v_coupon.valid_from THEN
    RETURN QUERY SELECT 
      false::BOOLEAN,
      NULL::VARCHAR,
      NULL::DECIMAL,
      NULL::DECIMAL,
      'Mã giảm giá chưa có hiệu lực'::TEXT;
    RETURN;
  END IF;

  IF v_coupon.valid_until IS NOT NULL AND NOW() > v_coupon.valid_until THEN
    RETURN QUERY SELECT 
      false::BOOLEAN,
      NULL::VARCHAR,
      NULL::DECIMAL,
      NULL::DECIMAL,
      'Mã giảm giá đã hết hạn'::TEXT;
    RETURN;
  END IF;

  -- Check minimum purchase amount
  IF p_amount < v_coupon.min_purchase_amount THEN
    RETURN QUERY SELECT 
      false::BOOLEAN,
      NULL::VARCHAR,
      NULL::DECIMAL,
      NULL::DECIMAL,
      FORMAT('Đơn hàng phải có giá trị tối thiểu %s để sử dụng mã này', v_coupon.min_purchase_amount)::TEXT;
    RETURN;
  END IF;

  -- Check usage limit
  IF v_coupon.usage_limit IS NOT NULL THEN
    IF v_coupon.usage_count >= v_coupon.usage_limit THEN
      RETURN QUERY SELECT 
        false::BOOLEAN,
        NULL::VARCHAR,
        NULL::DECIMAL,
        NULL::DECIMAL,
        'Mã giảm giá đã hết lượt sử dụng'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- All validations passed
  RETURN QUERY SELECT 
    true::BOOLEAN,
    v_coupon.discount_type::VARCHAR,
    v_coupon.discount_value::DECIMAL,
    v_coupon.max_discount_amount::DECIMAL,
    'Mã giảm giá hợp lệ'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Insert some sample coupons for testing
INSERT INTO coupons (code, description, discount_type, discount_value, min_purchase_amount, max_discount_amount, usage_limit, valid_until)
VALUES 
  ('WELCOME10', 'Giảm 10% cho khách hàng mới', 'percentage', 10, 0, NULL, NULL, NOW() + INTERVAL '30 days'),
  ('SAVE5', 'Giảm $5 cho đơn hàng', 'fixed_amount', 5, 10, NULL, NULL, NOW() + INTERVAL '30 days'),
  ('PREMIUM20', 'Giảm 20% cho gói Premium', 'percentage', 20, 20, 10, 100, NOW() + INTERVAL '7 days')
ON CONFLICT (code) DO NOTHING;

-- Grant permissions
GRANT ALL ON coupons TO authenticated;
GRANT ALL ON coupon_usage TO authenticated;
GRANT EXECUTE ON FUNCTION validate_coupon TO authenticated;
