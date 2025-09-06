/**
 * Coupon Status Badge Component
 */

import { Badge } from '@/components/ui/badge';
import { Coupon } from '@/lib/coupon-service';

interface CouponStatusBadgeProps {
  coupon: Coupon;
}

export function CouponStatusBadge({ coupon }: CouponStatusBadgeProps) {
  const now = new Date();
  const validFrom = new Date(coupon.valid_from);
  const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;

  if (!coupon.is_active) {
    return <Badge variant="secondary">Không hoạt động</Badge>;
  }
  if (now < validFrom) {
    return <Badge variant="outline">Chưa có hiệu lực</Badge>;
  }
  if (validUntil && now > validUntil) {
    return <Badge variant="destructive">Hết hạn</Badge>;
  }
  if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
    return <Badge variant="destructive">Hết lượt dùng</Badge>;
  }
  return <Badge variant="default">Đang hoạt động</Badge>;
}
