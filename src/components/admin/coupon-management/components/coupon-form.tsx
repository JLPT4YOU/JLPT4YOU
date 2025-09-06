/**
 * Reusable Coupon Form Component
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CouponFormData } from '../types';

interface CouponFormProps {
  formData: CouponFormData;
  onFormChange: (data: Partial<CouponFormData>) => void;
  idPrefix?: string;
}

export function CouponForm({ formData, onFormChange, idPrefix = '' }: CouponFormProps) {
  const id = (suffix: string) => idPrefix ? `${idPrefix}-${suffix}` : suffix;

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={id('code')}>Mã giảm giá *</Label>
          <Input
            id={id('code')}
            value={formData.code}
            onChange={(e) => onFormChange({ code: e.target.value.toUpperCase() })}
            placeholder="VD: WELCOME10"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={id('discount_type')}>Loại giảm giá *</Label>
          <Select
            value={formData.discount_type}
            onValueChange={(value: 'percentage' | 'fixed_amount') => 
              onFormChange({ discount_type: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Phần trăm (%)</SelectItem>
              <SelectItem value="fixed_amount">Số tiền cố định ($)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={id('description')}>Mô tả</Label>
        <Textarea
          id={id('description')}
          value={formData.description}
          onChange={(e) => onFormChange({ description: e.target.value })}
          placeholder="VD: Giảm giá cho khách hàng mới"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={id('discount_value')}>
            Giá trị giảm * {formData.discount_type === 'percentage' ? '(%)' : '($)'}
          </Label>
          <Input
            id={id('discount_value')}
            type="number"
            value={formData.discount_value}
            onChange={(e) => onFormChange({ discount_value: e.target.value })}
            placeholder={formData.discount_type === 'percentage' ? '10' : '5'}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={id('min_purchase_amount')}>Đơn hàng tối thiểu ($)</Label>
          <Input
            id={id('min_purchase_amount')}
            type="number"
            value={formData.min_purchase_amount}
            onChange={(e) => onFormChange({ min_purchase_amount: e.target.value })}
            placeholder="0"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={id('max_discount_amount')}>
            Giảm tối đa ($) {formData.discount_type === 'percentage' && '(cho giảm %)'}
          </Label>
          <Input
            id={id('max_discount_amount')}
            type="number"
            value={formData.max_discount_amount}
            onChange={(e) => onFormChange({ max_discount_amount: e.target.value })}
            placeholder="Không giới hạn"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={id('usage_limit')}>Giới hạn lượt dùng</Label>
          <Input
            id={id('usage_limit')}
            type="number"
            value={formData.usage_limit}
            onChange={(e) => onFormChange({ usage_limit: e.target.value })}
            placeholder="Không giới hạn"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={id('valid_from')}>Hiệu lực từ *</Label>
          <Input
            id={id('valid_from')}
            type="date"
            value={formData.valid_from}
            onChange={(e) => onFormChange({ valid_from: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={id('valid_until')}>Hiệu lực đến</Label>
          <Input
            id={id('valid_until')}
            type="date"
            value={formData.valid_until}
            onChange={(e) => onFormChange({ valid_until: e.target.value })}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id={id('is_active')}
          checked={formData.is_active}
          onCheckedChange={(checked) => onFormChange({ is_active: checked })}
        />
        <Label htmlFor={id('is_active')}>
          {idPrefix === 'edit' ? 'Kích hoạt' : 'Kích hoạt ngay'}
        </Label>
      </div>
    </div>
  );
}
