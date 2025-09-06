/**
 * Coupon Table Component
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Copy,
  Check,
  Edit,
  Trash2,
  Percent,
  DollarSign,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Coupon, formatDiscount } from '@/lib/coupon-service';
import { CouponStatusBadge } from './coupon-status-badge';

interface CouponTableProps {
  coupons: Coupon[];
  loading: boolean;
  copiedCode: string | null;
  onCopyCode: (code: string) => void;
  onEdit: (coupon: Coupon) => void;
  onDelete: (id: string) => void;
}

export function CouponTable({
  coupons,
  loading,
  copiedCode,
  onCopyCode,
  onEdit,
  onDelete,
}: CouponTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã</TableHead>
              <TableHead>Mô tả</TableHead>
              <TableHead>Giảm giá</TableHead>
              <TableHead>Đơn tối thiểu</TableHead>
              <TableHead>Lượt dùng</TableHead>
              <TableHead>Hiệu lực</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : coupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Chưa có mã giảm giá nào
                </TableCell>
              </TableRow>
            ) : (
              coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="font-mono font-bold">{coupon.code}</code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onCopyCode(coupon.code)}
                      >
                        {copiedCode === coupon.code ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {coupon.description || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {coupon.discount_type === 'percentage' ? (
                        <Percent className="h-3 w-3" />
                      ) : (
                        <DollarSign className="h-3 w-3" />
                      )}
                      {formatDiscount(coupon.discount_type, coupon.discount_value)}
                      {coupon.max_discount_amount && (
                        <span className="text-xs text-muted-foreground">
                          (max ${(coupon.max_discount_amount / 1000).toFixed(2)})
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    ${(coupon.min_purchase_amount / 1000).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {coupon.usage_count}
                    {coupon.usage_limit && (
                      <span className="text-muted-foreground">
                        /{coupon.usage_limit}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      <div>Từ: {format(new Date(coupon.valid_from), 'dd/MM/yyyy', { locale: vi })}</div>
                      {coupon.valid_until && (
                        <div>Đến: {format(new Date(coupon.valid_until), 'dd/MM/yyyy', { locale: vi })}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <CouponStatusBadge coupon={coupon} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(coupon)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(coupon.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
