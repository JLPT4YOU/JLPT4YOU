/**
 * Reusable Coupon Dialog Component
 */

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CouponForm } from './coupon-form';
import { CouponFormData } from '../types';

interface CouponDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  onCancel: () => void;
  formData: CouponFormData;
  onFormChange: (data: Partial<CouponFormData>) => void;
  title: string;
  description: string;
  submitLabel: string;
  isEdit?: boolean;
}

export function CouponDialog({
  open,
  onOpenChange,
  onSubmit,
  onCancel,
  formData,
  onFormChange,
  title,
  description,
  submitLabel,
  isEdit = false,
}: CouponDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <CouponForm
            formData={formData}
            onFormChange={onFormChange}
            idPrefix={isEdit ? 'edit' : ''}
          />
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Hủy
          </Button>
          <Button onClick={onSubmit}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
