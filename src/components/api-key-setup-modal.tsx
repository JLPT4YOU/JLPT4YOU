'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { ExternalLink, Key, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { useTranslations } from '@/hooks/use-translations'

interface ApiKeySetupModalProps {
  isOpen: boolean
  onClose: () => void
  onApiKeySet: (apiKey: string) => void
}

export function ApiKeySetupModal({ isOpen, onClose, onApiKeySet }: ApiKeySetupModalProps) {
  const [apiKey, setApiKey] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [validationError, setValidationError] = useState('')
  const { t } = useTranslations()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!apiKey.trim()) {
      setValidationError(t('modals.apiKey.required'))
      return
    }

    if (!apiKey.startsWith('AIza')) {
      setValidationError(`${t('modals.apiKey.invalidFormat')} "AIza"`)
      return
    }

    setIsValidating(true)
    setValidationError('')

    try {
      // Test API key by making a simple request
      const response = await fetch('/api/gemini/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() })
      })

      if (response.ok) {
        // Call parent handler to persist key securely (server-side)
        onApiKeySet(apiKey.trim())
        onClose()
      } else {
        setValidationError(t('modals.apiKey.invalid'))
      }
    } catch (error) {
      setValidationError(t('modals.apiKey.connectionError'))
    } finally {
      setIsValidating(false)
    }
  }

  const handleSkip = () => {
    // Remember skip choice only in session (no localStorage)
    sessionStorage.setItem('gemini_api_key_skipped', 'true')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            {t('modals.apiKey.title')}
          </DialogTitle>
          <DialogDescription>
            {t('modals.apiKey.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Instructions */}
          <Card className="border-border bg-muted">
            <CardContent className="pt-4">
              <div className="flex gap-3">
                <Info className="h-4 w-4 text-foreground mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="font-medium text-foreground">
                    {t('modals.apiKey.instructions.title')}:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    <li>{t('modals.apiKey.instructions.step1')}</li>
                    <li>{t('modals.apiKey.instructions.step2')}</li>
                    <li>{t('modals.apiKey.instructions.step3')}</li>
                    <li>{t('modals.apiKey.instructions.step4')}</li>
                  </ol>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => window.open('https://aistudio.google.com/', '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    {t('modals.apiKey.openStudio')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Key Input */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">
                {t('modals.apiKey.label')}
              </Label>
              <Input
                id="apiKey"
                type="password"
                placeholder={t('modals.apiKey.placeholder')}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value)
                  setValidationError('')
                }}
                className={validationError ? 'border-red-500' : ''}
              />
              {validationError && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-3 w-3" />
                  {validationError}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                disabled={isValidating || !apiKey.trim()}
                className="flex-1"
              >
                {isValidating ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                    {t('modals.apiKey.validating')}
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3 w-3 mr-2" />
                    {t('modals.apiKey.validate')}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleSkip}
                disabled={isValidating}
              >
                {t('modals.apiKey.skip')}
              </Button>
            </div>
          </form>

          {/* Security Note */}
          <Card className="border-gray-200 bg-gray-50">
            <CardContent className="pt-3 pb-3">
              <div className="flex gap-2">
                <AlertCircle className="h-3 w-3 text-gray-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-700">
                  {t('modals.apiKey.security.note')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
