/**
 * Refactored Coupon Management Component - Main Logic
 * Reduced from 712 lines using modular architecture
 */

"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Coupon } from '@/lib/coupon-service';

// Import modular components and hooks
import { useCouponData } from './hooks/use-coupon-data';
import { useCouponForm } from './hooks/use-coupon-form';
import { CouponStatistics } from './components/coupon-statistics';
import { CouponTable } from './components/coupon-table';
import { CouponDialog } from './components/coupon-dialog';

export function CouponManagementInner() {
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  // Data management hook
  const {
    coupons,
    loading,
    handleCreateCoupon,
    handleUpdateCoupon,
    handleDeleteCoupon,
  } = useCouponData();

  // Form management hook
  const {
    formData,
    updateFormData,
    resetForm,
    loadCouponToForm,
    handleCopyCode,
    copiedCode,
    validateForm,
  } = useCouponForm();

  // Event handlers
  const handleCreate = async () => {
    if (!validateForm()) return;
    
    const success = await handleCreateCoupon(formData);
    if (success) {
      setShowCreateDialog(false);
      resetForm();
    }
  };

  const handleUpdate = async () => {
    if (!selectedCoupon || !validateForm()) return;
    
    const success = await handleUpdateCoupon(selectedCoupon.id, formData);
    if (success) {
      setShowEditDialog(false);
      resetForm();
      setSelectedCoupon(null);
    }
  };

  const openEditDialog = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    loadCouponToForm(coupon);
    setShowEditDialog(true);
  };

  const handleCreateCancel = () => {
    setShowCreateDialog(false);
    resetForm();
  };

  const handleEditCancel = () => {
    setShowEditDialog(false);
    resetForm();
    setSelectedCoupon(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Quản lý mã giảm giá</h2>
          <p className="text-muted-foreground">
            Tạo và quản lý mã giảm giá cho người dùng
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tạo mã giảm giá
        </Button>
      </div>

      {/* Statistics Cards */}
      <CouponStatistics coupons={coupons} />

      {/* Coupons Table */}
      <CouponTable
        coupons={coupons}
        loading={loading}
        copiedCode={copiedCode}
        onCopyCode={handleCopyCode}
        onEdit={openEditDialog}
        onDelete={handleDeleteCoupon}
      />

      {/* Create Dialog */}
      <CouponDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreate}
        onCancel={handleCreateCancel}
        formData={formData}
        onFormChange={updateFormData}
        title="Tạo mã giảm giá mới"
        description="Điền thông tin để tạo mã giảm giá mới"
        submitLabel="Tạo mã giảm giá"
      />

      {/* Edit Dialog */}
      <CouponDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSubmit={handleUpdate}
        onCancel={handleEditCancel}
        formData={formData}
        onFormChange={updateFormData}
        title="Chỉnh sửa mã giảm giá"
        description="Cập nhật thông tin mã giảm giá"
        submitLabel="Cập nhật"
        isEdit={true}
      />
    </div>
  );
}
