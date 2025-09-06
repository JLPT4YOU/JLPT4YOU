/**
 * Balance Display Component
 */

import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PricingDetails } from '../types';

interface BalanceDisplayProps {
  userBalance: number;
  balanceLoading: boolean;
  hasInsufficientBalance: boolean;
  pricing: PricingDetails;
  t: (key: string) => string;
}

export function BalanceDisplay({ 
  userBalance, 
  balanceLoading, 
  hasInsufficientBalance, 
  pricing, 
  t 
}: BalanceDisplayProps) {
  return (
    <div className="mb-4 p-3 rounded-lg bg-muted/50">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{t('pages.payment.checkout.yourBalance')}:</span>
        {balanceLoading ? (
          <div className="w-16 h-4 bg-muted animate-pulse rounded" />
        ) : (
          <span className={cn(
            "font-semibold",
            hasInsufficientBalance ? "text-destructive" : "text-success"
          )}>
            ${userBalance.toFixed(2)}
          </span>
        )}
      </div>
      {!balanceLoading && hasInsufficientBalance && (
        <div className="mt-2 flex items-center gap-1 text-xs text-red-500">
          <AlertCircle className="w-3 h-3" />
          <span>
            {t('pages.payment.checkout.insufficientBalance')
              .replace('{amount}', (pricing.total - userBalance).toFixed(2))
            }
          </span>
        </div>
      )}
    </div>
  );
}
