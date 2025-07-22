'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Key, CheckCircle, AlertCircle, Info, Brain, Zap } from 'lucide-react'
import { useTranslations } from '@/hooks/use-translations'
import { getAIProviderManager, type ProviderType } from '@/lib/ai-provider-manager'

interface MultiProviderApiKeyModalProps {
  isOpen: boolean
  onClose: () => void
  defaultProvider?: ProviderType
}

export function MultiProviderApiKeyModal({ 
  isOpen, 
  onClose, 
  defaultProvider = 'gemini' 
}: MultiProviderApiKeyModalProps) {
  const [activeTab, setActiveTab] = useState<ProviderType>(defaultProvider)
  const [apiKeys, setApiKeys] = useState<Record<ProviderType, string>>({
    gemini: '',
    groq: ''
  })
  const [isValidating, setIsValidating] = useState<Record<ProviderType, boolean>>({
    gemini: false,
    groq: false
  })
  const [validationErrors, setValidationErrors] = useState<Record<ProviderType, string>>({
    gemini: '',
    groq: ''
  })
  const [providerStatus, setProviderStatus] = useState<Record<ProviderType, boolean>>({
    gemini: false,
    groq: false
  })

  const { t } = useTranslations()
  const aiProviderManager = getAIProviderManager()

  // Load existing API keys and check status
  useEffect(() => {
    if (isOpen) {
      // Load existing keys from localStorage
      const geminiKey = localStorage.getItem('gemini_api_key') || ''
      const groqKey = localStorage.getItem('groq_api_key') || ''
      
      setApiKeys({
        gemini: geminiKey,
        groq: groqKey
      })

      // Check provider status
      const geminiConfigured = aiProviderManager.isProviderConfigured('gemini')
      const groqConfigured = aiProviderManager.isProviderConfigured('groq')
      
      setProviderStatus({
        gemini: geminiConfigured,
        groq: groqConfigured
      })
    }
  }, [isOpen])

  const validateApiKey = async (provider: ProviderType, apiKey: string): Promise<boolean> => {
    if (!apiKey.trim()) {
      setValidationErrors(prev => ({
        ...prev,
        [provider]: 'API key là bắt buộc'
      }))
      return false
    }

    // Provider-specific validation
    if (provider === 'gemini' && !apiKey.startsWith('AIza')) {
      setValidationErrors(prev => ({
        ...prev,
        [provider]: 'Gemini API key phải bắt đầu bằng "AIza"'
      }))
      return false
    }

    if (provider === 'groq' && !apiKey.startsWith('gsk_')) {
      setValidationErrors(prev => ({
        ...prev,
        [provider]: 'Groq API key phải bắt đầu bằng "gsk_"'
      }))
      return false
    }

    setIsValidating(prev => ({ ...prev, [provider]: true }))
    setValidationErrors(prev => ({ ...prev, [provider]: '' }))

    try {
      const isValid = await aiProviderManager.validateApiKey(provider, apiKey.trim())
      
      if (isValid) {
        // Configure the provider
        aiProviderManager.configureProvider(provider, apiKey.trim())
        
        // Update status
        setProviderStatus(prev => ({ ...prev, [provider]: true }))
        
        return true
      } else {
        setValidationErrors(prev => ({
          ...prev,
          [provider]: 'API key không hợp lệ hoặc không có quyền truy cập'
        }))
        return false
      }
    } catch (error) {
      console.error(`${provider} API key validation failed:`, error)
      setValidationErrors(prev => ({
        ...prev,
        [provider]: 'Không thể xác thực API key. Vui lòng thử lại.'
      }))
      return false
    } finally {
      setIsValidating(prev => ({ ...prev, [provider]: false }))
    }
  }

  const handleSubmit = async (provider: ProviderType) => {
    const apiKey = apiKeys[provider]
    const isValid = await validateApiKey(provider, apiKey)
    
    if (isValid) {
      // Show success message or close modal
      console.log(`${provider} API key configured successfully`)
    }
  }

  const getProviderInfo = (provider: ProviderType) => {
    switch (provider) {
      case 'gemini':
        return {
          name: 'Google Gemini',
          icon: <Brain className="h-5 w-5" />,
          description: 'Advanced AI with thinking mode, file support, and Google Search integration',
          features: ['Thinking Mode', 'File Upload', 'Google Search', 'Code Execution'],
          getKeyUrl: 'https://aistudio.google.com/app/apikey',
          keyFormat: 'AIza...',
          color: 'bg-blue-500'
        }
      case 'groq':
        return {
          name: 'Groq (Llama)',
          icon: <Zap className="h-5 w-5" />,
          description: 'Ultra-fast inference with Llama models, cost-effective and efficient',
          features: ['Ultra-fast Speed', 'Cost Effective', 'Llama Models', 'High Throughput'],
          getKeyUrl: 'https://console.groq.com/keys',
          keyFormat: 'gsk_...',
          color: 'bg-purple-500'
        }
      default:
        return null
    }
  }

  const renderProviderTab = (provider: ProviderType) => {
    const info = getProviderInfo(provider)
    if (!info) return null

    const isConfigured = providerStatus[provider]
    const isValidatingProvider = isValidating[provider]
    const error = validationErrors[provider]
    const apiKey = apiKeys[provider]

    return (
      <TabsContent value={provider} className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className={`p-2 rounded-lg ${info.color} text-white`}>
                {info.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">{info.name}</h3>
                  {isConfigured && (
                    <Badge variant="secondary" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Configured
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {info.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {info.features.map((feature) => (
                    <Badge key={feature} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Info className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <span className="font-medium">Get your API key: </span>
                  <a 
                    href={info.getKeyUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    {info.getKeyUrl}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${provider}-api-key`}>
                  API Key (format: {info.keyFormat})
                </Label>
                <Input
                  id={`${provider}-api-key`}
                  type="password"
                  placeholder={`Enter your ${info.name} API key`}
                  value={apiKey}
                  onChange={(e) => setApiKeys(prev => ({
                    ...prev,
                    [provider]: e.target.value
                  }))}
                  className={error ? 'border-destructive' : ''}
                />
                {error && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}
              </div>

              <Button
                onClick={() => handleSubmit(provider)}
                disabled={!apiKey.trim() || isValidatingProvider}
                className="w-full"
              >
                {isValidatingProvider ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Validating...
                  </>
                ) : isConfigured ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Update API Key
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Configure {info.name}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            AI Provider Configuration
          </DialogTitle>
          <DialogDescription>
            Configure your AI providers to start chatting. Each provider offers different capabilities and pricing.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ProviderType)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="gemini" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Gemini
              {providerStatus.gemini && <CheckCircle className="h-3 w-3 text-green-500" />}
            </TabsTrigger>
            <TabsTrigger value="groq" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Groq
              {providerStatus.groq && <CheckCircle className="h-3 w-3 text-green-500" />}
            </TabsTrigger>
          </TabsList>

          {renderProviderTab('gemini')}
          {renderProviderTab('groq')}
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
