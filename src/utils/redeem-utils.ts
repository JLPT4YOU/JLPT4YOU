/**
 * Utility functions for redeem code management
 */

/**
 * Generate a secure random redeem code
 * Format: XXXX-XXXX-XXXX-XXXX (16 alphanumeric characters)
 */
export function generateRedeemCode(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = 4;
  const segmentLength = 4;
  const code: string[] = [];

  for (let i = 0; i < segments; i++) {
    let segment = '';
    for (let j = 0; j < segmentLength; j++) {
      segment += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    code.push(segment);
  }

  return code.join('-');
}

/**
 * Format a redeem code for display (add dashes if needed)
 */
export function formatRedeemCode(code: string): string {
  // Remove any existing dashes or spaces
  const cleanCode = code.replace(/[-\s]/g, '').toUpperCase();
  
  // If code is not 16 characters, return as is
  if (cleanCode.length !== 16) {
    return code;
  }
  
  // Format as XXXX-XXXX-XXXX-XXXX
  return cleanCode.match(/.{1,4}/g)?.join('-') || code;
}

/**
 * Validate redeem code format
 */
export function validateRedeemCode(code: string): boolean {
  // Remove dashes and spaces for validation
  const cleanCode = code.replace(/[-\s]/g, '');
  
  // Check if it's 16 alphanumeric characters
  return /^[A-Z0-9]{16}$/i.test(cleanCode);
}

/**
 * Clean redeem code for database storage (remove dashes)
 */
export function cleanRedeemCode(code: string): string {
  return code.replace(/[-\s]/g, '').toUpperCase();
}

/**
 * Generate batch of unique redeem codes
 */
export function generateBatchRedeemCodes(count: number): string[] {
  const codes = new Set<string>();
  
  while (codes.size < count) {
    const code = generateRedeemCode();
    codes.add(code);
  }
  
  return Array.from(codes);
}

/**
 * Calculate expiry date from premium days
 */
export function calculateExpiryDate(
  currentExpiry: string | null | undefined,
  premiumDays: number
): Date {
  const now = new Date();
  const baseDate = currentExpiry && new Date(currentExpiry) > now 
    ? new Date(currentExpiry) 
    : now;
  
  const expiryDate = new Date(baseDate);
  expiryDate.setDate(expiryDate.getDate() + premiumDays);
  
  return expiryDate;
}

// Translation function type
type TranslationFunction = (key: string, params?: Record<string, any>) => string

/**
 * Format premium days for display
 */
export function formatPremiumDays(days: number, t?: TranslationFunction): string {
  if (days === 1) return t?.('time.durations.oneDay') || '1 ngày';
  if (days === 7) return t?.('time.durations.oneWeek') || '1 tuần';
  if (days === 30) return t?.('time.durations.oneMonth') || '1 tháng';
  if (days === 90) return t?.('time.durations.threeMonths') || '3 tháng';
  if (days === 180) return t?.('time.durations.sixMonths') || '6 tháng';
  if (days === 365) return t?.('time.durations.oneYear') || '1 năm';

  const dayUnit = t?.('time.units.days') || 'ngày';
  return `${days} ${dayUnit}`;
}

/**
 * Common premium day options for admin
 * Note: These are hardcoded for admin interface (Vietnamese only as per requirements)
 */
export const PREMIUM_DAY_OPTIONS = [
  { value: 1, label: '1 ngày' },
  { value: 3, label: '3 ngày' },
  { value: 7, label: '1 tuần' },
  { value: 14, label: '2 tuần' },
  { value: 30, label: '1 tháng' },
  { value: 60, label: '2 tháng' },
  { value: 90, label: '3 tháng' },
  { value: 180, label: '6 tháng' },
  { value: 365, label: '1 năm' },
];

/**
 * Get premium day options with translation support
 */
export function getPremiumDayOptions(t?: TranslationFunction) {
  return [
    { value: 1, label: formatPremiumDays(1, t) },
    { value: 3, label: `3 ${t?.('time.units.days') || 'ngày'}` },
    { value: 7, label: formatPremiumDays(7, t) },
    { value: 14, label: `2 ${t?.('time.units.weeks') || 'tuần'}` },
    { value: 30, label: formatPremiumDays(30, t) },
    { value: 60, label: `2 ${t?.('time.units.months') || 'tháng'}` },
    { value: 90, label: formatPremiumDays(90, t) },
    { value: 180, label: formatPremiumDays(180, t) },
    { value: 365, label: formatPremiumDays(365, t) },
  ];
}
