"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  AlertTriangle,
  Shield,
  Clock,
  BookX,
  Smartphone,
  Trophy,
  X
} from "lucide-react"
import { TranslationData } from "@/lib/i18n/"
import { useTranslation } from "@/lib/use-translation"

interface ChallengeRulesPopupProps {
  onAccept: () => void
  onCancel: () => void
  translations: TranslationData
}

export function ChallengeRulesPopup({ onAccept, onCancel, translations }: ChallengeRulesPopupProps) {
  const { t } = useTranslation(translations)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Popup Content */}
      <div className="relative w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto bg-background rounded-2xl">
        <div className="text-center border-b border-border/30 bg-muted/20 p-6 md:p-8 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 justify-center">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <Trophy className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">
                {t('challenge.rules.title')}
              </h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {/* Warning Section */}
          <div className="flex items-start gap-3 p-4 md:p-5 bg-muted/50 rounded-xl border-l-4 border-primary">
            <AlertTriangle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                {t('challenge.rules.importantNote')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('challenge.rules.importantDescription')}
              </p>
            </div>
          </div>

          {/* Rules List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-3">
              <Shield className="w-5 h-5 text-primary" />
              {t('challenge.rules.rulesTitle')}
            </h3>

            <div className="space-y-3">
              {/* Rule 1 */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30">
                <BookX className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-foreground">{t('challenge.rules.rule1.title')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('challenge.rules.rule1.description')}
                  </p>
                </div>
              </div>

              {/* Rule 2 */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30">
                <Smartphone className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-foreground">{t('challenge.rules.rule2.title')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('challenge.rules.rule2.description')}
                  </p>
                </div>
              </div>

              {/* Rule 3 */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30">
                <Clock className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-foreground">{t('challenge.rules.rule3.title')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('challenge.rules.rule3.description')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Challenge Info */}
          <div className="p-4 md:p-5 bg-accent/20 rounded-xl">
            <h4 className="font-semibold text-foreground mb-3">
              {t('challenge.rules.aboutTitle')}
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('challenge.rules.aboutDescription')}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-6 border-t border-border/30">
            <Button
              variant="outline"
              onClick={onCancel}
              className="px-6 rounded-xl bg-muted/30 hover:bg-accent/50"
            >
              {t('challenge.rules.cancel')}
            </Button>
            <Button
              onClick={onAccept}
              className="px-6 font-semibold rounded-xl"
            >
              <Trophy className="w-4 h-4 mr-2" />
              {t('challenge.rules.accept')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
