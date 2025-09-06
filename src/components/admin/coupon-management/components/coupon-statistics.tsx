/**
 * Coupon Statistics Cards Component
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Check, Users, Calendar } from 'lucide-react';
import { Coupon } from '@/lib/coupon-service';

interface CouponStatisticsProps {
  coupons: Coupon[];
}

export function CouponStatistics({ coupons }: CouponStatisticsProps) {
  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter(c => c.is_active).length;
  const totalUsage = coupons.reduce((sum, c) => sum + c.usage_count, 0);
  const validCoupons = coupons.filter(c => {
    const now = new Date();
    const validUntil = c.valid_until ? new Date(c.valid_until) : null;
    return c.is_active && (!validUntil || now <= validUntil);
  }).length;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Tổng số mã
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCoupons}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Đang hoạt động
          </CardTitle>
          <Check className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeCoupons}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Tổng lượt dùng
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalUsage}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Còn hiệu lực
          </CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{validCoupons}</div>
        </CardContent>
      </Card>
    </div>
  );
}
