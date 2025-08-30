'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { enhancedTranslateService, type TranslationResult, SUPPORTED_LANGUAGES } from '@/lib/translate/enhanced-translate-service';
import { Languages, ArrowRightLeft, Volume2, Copy, Check } from 'lucide-react';

interface TranslateDetailProps {
  selectedItem?: any;
  initialQuery?: string;
}

export function TranslateDetail({ selectedItem, initialQuery }: TranslateDetailProps) {
  const [sourceText, setSourceText] = useState('');
  const [targetText, setTargetText] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('ja');
  const [targetLanguage, setTargetLanguage] = useState('vi');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Initialize with selectedItem or initialQuery
  useEffect(() => {
    if (selectedItem?.word) {
      setSourceText(selectedItem.word);
    } else if (initialQuery) {
      setSourceText(initialQuery);
    }
  }, [selectedItem, initialQuery]);

  // Auto translate when source text changes
  useEffect(() => {
    if (sourceText.trim()) {
      handleTranslate();
    } else {
      setTargetText('');
      setTranslationResult(null);
    }
  }, [sourceText, sourceLanguage, targetLanguage]);

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await enhancedTranslateService.translate(
        sourceText,
        sourceLanguage === 'auto' ? 'auto' : sourceLanguage,
        targetLanguage
      );
      
      setTranslationResult(result);
      setTargetText(result.translatedText);
    } catch (err) {
      console.error('Translation error:', err);
      setError(err instanceof Error ? err.message : 'Lỗi dịch thuật');
      setTargetText('');
      setTranslationResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSwapLanguages = () => {
    if (sourceLanguage === 'auto') return; // Cannot swap with auto-detect
    
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
    setSourceText(targetText);
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const speakText = (text: string, lang: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'ja' ? 'ja-JP' : lang === 'vi' ? 'vi-VN' : 'en-US';
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Languages className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-semibold">Google Translate</h2>
      </div>

      {/* Language Selection */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">Từ ngôn ngữ</label>
          <select
            value={sourceLanguage}
            onChange={(e) => setSourceLanguage(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="auto">Tự động phát hiện</option>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeName} ({lang.name})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSwapLanguages}
          disabled={sourceLanguage === 'auto'}
          className={cn(
            "p-2 rounded-lg border border-border transition-colors",
            sourceLanguage === 'auto' 
              ? "opacity-50 cursor-not-allowed" 
              : "hover:bg-muted"
          )}
          title="Hoán đổi ngôn ngữ"
        >
          <ArrowRightLeft className="w-4 h-4" />
        </button>

        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">Sang ngôn ngữ</label>
          <select
            value={targetLanguage}
            onChange={(e) => setTargetLanguage(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeName} ({lang.name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Translation Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Source Text */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Văn bản gốc</label>
            {sourceText && (
              <button
                onClick={() => speakText(sourceText, sourceLanguage)}
                className="p-1 hover:bg-muted rounded"
                title="Phát âm"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="Nhập văn bản cần dịch..."
            className="w-full h-32 px-3 py-2 border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {translationResult?.romanization && (
            <div className="text-sm text-muted-foreground">
              <strong>Phiên âm:</strong> {translationResult.romanization}
            </div>
          )}
        </div>

        {/* Target Text */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Bản dịch</label>
            <div className="flex items-center gap-1">
              {targetText && (
                <>
                  <button
                    onClick={() => speakText(targetText, targetLanguage)}
                    className="p-1 hover:bg-muted rounded"
                    title="Phát âm"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleCopy(targetText)}
                    className="p-1 hover:bg-muted rounded"
                    title="Sao chép"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="relative">
            <textarea
              value={targetText}
              readOnly
              placeholder={loading ? "Đang dịch..." : "Bản dịch sẽ hiển thị ở đây"}
              className="w-full h-32 px-3 py-2 border border-border rounded-lg bg-muted/50 resize-none focus:outline-none"
            />
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Translation Info */}
      {translationResult && (
        <div className="space-y-4">
          {/* Detected Language */}
          {sourceLanguage === 'auto' && translationResult.sourceLanguage && (
            <div className="text-sm text-muted-foreground">
              <strong>Ngôn ngữ phát hiện:</strong> {
                SUPPORTED_LANGUAGES.find(lang => lang.code === translationResult.sourceLanguage)?.nativeName || 
                translationResult.sourceLanguage
              }
            </div>
          )}

          {/* Alternative Translations */}
          {translationResult.alternatives && translationResult.alternatives.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Các bản dịch khác:</h3>
              <div className="space-y-2">
                {translationResult.alternatives.slice(0, 3).map((alt, index) => (
                  <div key={index} className="p-3 bg-muted/50 rounded-lg">
                    <div className="font-medium text-sm mb-1">{alt.src_phrase}</div>
                    <div className="flex flex-wrap gap-2">
                      {alt.alternative?.slice(0, 5).map((option, optIndex) => (
                        <span
                          key={optIndex}
                          className="px-2 py-1 bg-background border border-border rounded text-xs cursor-pointer hover:bg-muted"
                          onClick={() => setTargetText(option.word_postproc)}
                        >
                          {option.word_postproc}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
