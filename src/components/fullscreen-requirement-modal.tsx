"use client"

import { useState, useEffect } from 'react'

// Browser compatibility types for fullscreen APIs
interface DocumentWithFullscreen extends Document {
  webkitFullscreenEnabled?: boolean;
  mozFullScreenEnabled?: boolean;
  msFullscreenEnabled?: boolean;
  webkitFullscreenElement?: Element;
  mozFullScreenElement?: Element;
  msFullscreenElement?: Element;
}

interface ElementWithFullscreen extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
  mozRequestFullScreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
}
import { Button } from '@/components/ui/button'
import {
  Maximize,
  Shield,
  AlertTriangle,
  Monitor,
  Smartphone,
  CheckCircle
} from 'lucide-react'
import { TranslationData } from '@/lib/i18n'
import { useTranslation } from '@/lib/use-translation'

interface FullscreenRequirementModalProps {
  isOpen: boolean
  onFullscreenActivated: () => void
  onCancel: () => void
  translations: TranslationData
}

export function FullscreenRequirementModal({
  isOpen,
  onFullscreenActivated,
  onCancel,
  translations
}: FullscreenRequirementModalProps) {
  const { t } = useTranslation(translations);
  const [isFullscreenSupported, setIsFullscreenSupported] = useState(true)
  const [isActivating, setIsActivating] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check if fullscreen is supported
    const doc = document as DocumentWithFullscreen
    const isSupported = !!(
      document.fullscreenEnabled ||
      doc.webkitFullscreenEnabled ||
      doc.mozFullScreenEnabled ||
      doc.msFullscreenEnabled
    )
    setIsFullscreenSupported(isSupported)

    // Check if mobile device
    const checkMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    setIsMobile(checkMobile)
  }, [])

  const requestFullscreen = async () => {
    setIsActivating(true)
    
    try {
      const element = document.documentElement as ElementWithFullscreen

      if (element.requestFullscreen) {
        await element.requestFullscreen()
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen()
      } else if (element.mozRequestFullScreen) {
        await element.mozRequestFullScreen()
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen()
      }
      
      // Wait a bit for fullscreen to activate
      setTimeout(() => {
        const doc = document as DocumentWithFullscreen
        if (document.fullscreenElement ||
            doc.webkitFullscreenElement ||
            doc.mozFullScreenElement ||
            doc.msFullscreenElement) {
          onFullscreenActivated()
        } else {
          setIsActivating(false)
        }
      }, 500)
      
    } catch (error) {
      console.error('Failed to enter fullscreen:', error)
      setIsActivating(false)
    }
  }

  const handleMobileProceed = () => {
    // For mobile devices, we can't force fullscreen but we can proceed
    onFullscreenActivated()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto bg-background rounded-2xl">
        <div className="text-center border-b border-border/30 bg-muted/20 p-6 md:p-8 rounded-t-2xl">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-foreground">
            {t('exam.fullscreenModal.title')}
          </h1>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {/* Mobile Device Detection */}
          {isMobile ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-primary" />
              </div>
              
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {t('exam.fullscreenModal.mobile.detected')}
              </h3>

              <p className="text-sm text-muted-foreground mb-4">
                {t('exam.fullscreenModal.mobile.description')}
              </p>
              
              <div className="p-4 bg-card border border-red-300 dark:border-red-700 rounded-lg mb-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-sm font-bold text-red-700 dark:text-red-300">
                      {t('exam.fullscreenModal.mobile.importantNote')}
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {t('exam.fullscreenModal.mobile.warning')}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={onCancel}>
                  {t('exam.fullscreenModal.cancelButton')}
                </Button>
                <Button onClick={handleMobileProceed} className="px-6">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {t('exam.fullscreenModal.mobile.continueButton')}
                </Button>
              </div>
            </div>
          ) : (
            /* Desktop Fullscreen Requirement */
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Monitor className="w-8 h-8 text-primary" />
              </div>
              
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {t('exam.fullscreenModal.desktop.title')}
              </h3>

              <p className="text-sm text-muted-foreground mb-4">
                {t('exam.fullscreenModal.desktop.description')}
              </p>

              {/* Requirements List */}
              <div className="text-left mb-4">
                <h4 className="font-semibold text-foreground mb-2">
                  {t('exam.fullscreenModal.desktop.requirementsTitle')}
                </h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {t('exam.fullscreenModal.desktop.requirements').map((requirement: string, index: number) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <span>{requirement}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Warning */}
              <div className="p-4 bg-card border border-red-300 dark:border-red-700 rounded-lg mb-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-sm font-bold text-red-700 dark:text-red-300">
                      {t('exam.fullscreenModal.desktop.importantNote')}
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {t('exam.fullscreenModal.desktop.warningText')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {!isFullscreenSupported ? (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">
                    {t('exam.fullscreenModal.desktop.unsupportedBrowser')}
                  </p>
                </div>
              ) : (
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={onCancel} disabled={isActivating}>
                    {t('exam.fullscreenModal.cancelButton')}
                  </Button>
                  <Button
                    onClick={requestFullscreen}
                    disabled={isActivating}
                    className="px-6"
                  >
                    <Maximize className="w-4 h-4 mr-2" />
                    {isActivating
                      ? t('exam.fullscreenModal.desktop.activatingButton')
                      : t('exam.fullscreenModal.desktop.activateButton')
                    }
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
