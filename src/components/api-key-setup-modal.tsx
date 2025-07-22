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
      setValidationError(t?.apiKeySetup?.errors?.required || 'API key là bắt buộc')
      return
    }

    if (!apiKey.startsWith('AIza')) {
      setValidationError(t?.apiKeySetup?.errors?.invalid || 'API key phải bắt đầu bằng "AIza"')
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
        // Save to localStorage
        localStorage.setItem('gemini_api_key', apiKey.trim())
        onApiKeySet(apiKey.trim())
        onClose()
      } else {
        setValidationError(t?.apiKeySetup?.errors?.testFailed || 'API key không hợp lệ hoặc đã hết hạn')
      }
    } catch (error) {
      setValidationError(t?.apiKeySetup?.errors?.networkError || 'Lỗi kết nối. Vui lòng thử lại.')
    } finally {
      setIsValidating(false)
    }
  }

  const handleSkip = () => {
    // Save empty key to localStorage to remember user choice
    localStorage.setItem('gemini_api_key_skipped', 'true')
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
            {t?.apiKeySetup?.title || 'Cài đặt API Key'}
          </DialogTitle>
          <DialogDescription>
            {t?.apiKeySetup?.description || 'Để sử dụng tính năng AI chat, bạn cần cung cấp Google Gemini API key'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Instructions */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="flex gap-3">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="font-medium text-blue-900">
                    {t?.apiKeySetup?.instructions?.title || 'Cách lấy API key:'}
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                    <li>{t?.apiKeySetup?.instructions?.step1 || 'Truy cập Google AI Studio'}</li>
                    <li>{t?.apiKeySetup?.instructions?.step2 || 'Đăng nhập với tài khoản Google'}</li>
                    <li>{t?.apiKeySetup?.instructions?.step3 || 'Click "Get API Key" → "Create API Key"'}</li>
                    <li>{t?.apiKeySetup?.instructions?.step4 || 'Copy và dán API key vào ô bên dưới'}</li>
                  </ol>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => window.open('https://aistudio.google.com/', '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    {t?.apiKeySetup?.openAIStudio || 'Mở AI Studio'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Key Input */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">
                {t?.apiKeySetup?.inputLabel || 'Google Gemini API Key'}
              </Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="AIzaSy..."
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
                    {t?.apiKeySetup?.validating || 'Đang kiểm tra...'}
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3 w-3 mr-2" />
                    {t?.apiKeySetup?.save || 'Lưu & Sử dụng'}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleSkip}
                disabled={isValidating}
              >
                {t?.apiKeySetup?.skip || 'Bỏ qua'}
              </Button>
            </div>
          </form>

          {/* Security Note */}
          <Card className="border-gray-200 bg-gray-50">
            <CardContent className="pt-3 pb-3">
              <div className="flex gap-2">
                <AlertCircle className="h-3 w-3 text-gray-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-700">
                  {t?.apiKeySetup?.securityNote || 'API key được lưu trữ an toàn trên thiết bị của bạn và không được chia sẻ với bên thứ ba.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
