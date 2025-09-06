/**
 * Plan Selection Component
 */

import { motion } from 'framer-motion';
import { Crown, Sparkles, Check } from 'lucide-react';
import { DurationSelection } from './duration-selection';
import { DurationOption } from '../types';

interface PlanSelectionProps {
  billingPeriod: 'monthly' | 'yearly';
  selectedMonths: number;
  durationOptions: DurationOption[];
  onMonthsChange: (months: number) => Promise<void>;
  t: (key: string) => string;
}

export function PlanSelection({ 
  billingPeriod, 
  selectedMonths, 
  durationOptions, 
  onMonthsChange, 
  t 
}: PlanSelectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl p-6 border border-border/50"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Crown className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">{t('pages.payment.checkout.premiumPlan')}</h3>
          <p className="text-sm text-muted-foreground">
            {billingPeriod === 'yearly' 
              ? t('pages.payment.checkout.yearlyBilling') 
              : t('pages.payment.checkout.monthlyBilling')
            }
          </p>
        </div>
      </div>

      {/* Duration Selection (only show for monthly) */}
      {billingPeriod === 'monthly' && (
        <DurationSelection
          selectedMonths={selectedMonths}
          durationOptions={durationOptions}
          onMonthsChange={onMonthsChange}
          t={t}
        />
      )}

      {/* Features Reminder */}
      <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-primary mt-0.5" />
          <div className="space-y-2">
            <p className="text-sm font-medium">{t('pages.payment.checkout.youWillGet')}:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <Check className="w-3 h-3 text-green-500" />
                {t('pages.payment.checkout.unlimitedExams')}
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3 h-3 text-green-500" />
                {t('pages.payment.checkout.irinAiExplanations')}
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3 h-3 text-green-500" />
                {t('pages.payment.checkout.exclusiveMaterials')}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
