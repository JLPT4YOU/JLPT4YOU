/**
 * Security Badges Component
 */

import { Shield, Lock, Clock } from 'lucide-react';
import { useTranslations } from '@/hooks/use-translations';

export function SecurityBadges() {
  const { t } = useTranslations();
  
  return (
    <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
      <div className="flex items-center gap-1">
        <Shield className="w-3 h-3" />
        {t('pricing.trustIndicators.sslSecure')}
      </div>
      <div className="flex items-center gap-1">
        <Lock className="w-3 h-3" />
        {t('pricing.trustIndicators.encryption')}
      </div>
      <div className="flex items-center gap-1">
        <Clock className="w-3 h-3" />
        {t('pricing.trustIndicators.cancelAnytime')}
      </div>
    </div>
  );
}
