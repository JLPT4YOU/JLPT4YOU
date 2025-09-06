/**
 * Coupon Management Module Exports
 */

export { CouponManagementInner } from './coupon-management-inner';
export type { CouponFormData, CouponStatistics as CouponStatisticsType, CouponDialogProps } from './types';

// Component exports
export { CouponStatistics } from './components/coupon-statistics';
export { CouponTable } from './components/coupon-table';
export { CouponForm } from './components/coupon-form';
export { CouponDialog } from './components/coupon-dialog';
export { CouponStatusBadge } from './components/coupon-status-badge';

// Hook exports
export { useCouponData } from './hooks/use-coupon-data';
export { useCouponForm } from './hooks/use-coupon-form';
