/**
 * Duration Selection Component
 */

import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { DurationOption } from '../types';

interface DurationSelectionProps {
  selectedMonths: number;
  durationOptions: DurationOption[];
  onMonthsChange: (months: number) => Promise<void>;
  t: (key: string) => string;
}

export function DurationSelection({ 
  selectedMonths, 
  durationOptions, 
  onMonthsChange, 
  t 
}: DurationSelectionProps) {
  return (
    <div>
      <Label className="text-sm font-medium mb-3 block">
        {t('pages.payment.checkout.selectDuration')}
      </Label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {durationOptions.map((option) => (
          <button
            key={option.months}
            onClick={() => onMonthsChange(option.months)}
            className={cn(
              "relative rounded-lg p-3 text-center transition-all",
              "border-2 hover:border-primary/50",
              selectedMonths === option.months
                ? "border-primary bg-primary/10"
                : "border-border/50 bg-card"
            )}
          >
            {/* Show discount badge for options with discount */}
            {option.discount > 0 ? (
              <Badge 
                variant="secondary" 
                className="absolute -top-2 -right-2 text-[10px] px-2 py-0.5 bg-success text-success-foreground"
              >
                {t('pages.payment.checkout.savePercent').replace('{percent}', option.discount.toString())}
              </Badge>
            ) : option.badge && (
              <Badge 
                variant="secondary" 
                className="absolute -top-2 -right-2 text-[10px] px-2 py-0.5"
              >
                {option.badge}
              </Badge>
            )}
            <div className="font-semibold text-sm">{option.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
