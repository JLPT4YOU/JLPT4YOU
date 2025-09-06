/**
 * Payment Notice Component
 */

import { motion } from 'framer-motion';
import { CreditCard } from 'lucide-react';

interface PaymentNoticeProps {
  t: (key: string) => string;
}

export function PaymentNotice({ t }: PaymentNoticeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-muted/50 rounded-xl p-4 border border-border/50"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{t('pages.payment.checkout.balancePayment')}</p>
          <p className="text-xs text-muted-foreground">
            {t('pages.payment.checkout.balanceDescription')}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
