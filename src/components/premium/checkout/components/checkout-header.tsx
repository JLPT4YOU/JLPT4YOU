/**
 * Checkout Header Component with Progress Steps
 */

import { Button } from '@/components/ui/button';
import { ArrowLeft, Check } from 'lucide-react';

interface CheckoutHeaderProps {
  onBack: () => void;
  t: (key: string) => string;
}

export function CheckoutHeader({ onBack, t }: CheckoutHeaderProps) {
  return (
    <div className="mb-8">

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
              <Check className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">{t('pages.payment.checkout.selectPlan')}</span>
          </div>
          <div className="w-16 h-[2px] bg-primary" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
              2
            </div>
            <span className="text-sm font-medium">{t('pages.payment.checkout.payment')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
