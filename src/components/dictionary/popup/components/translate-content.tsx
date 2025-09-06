/**
 * Component for rendering Google Translate content
 */

import React from 'react';
import type { TranslationResult } from '@/lib/translate/enhanced-translate-service';

interface TranslateContentProps {
  data: TranslationResult | null;
  loading: boolean;
  error: string | null;
}

export function TranslateContent({ data, loading, error }: TranslateContentProps) {
  if (loading) {
    return <div className="text-center py-4">Đang dịch...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">{error}</div>;
  }

  if (!data) {
    return <div className="text-center py-4">Không có dữ liệu dịch</div>;
  }

  return (
    <div className="space-y-3">
      {/* Main Translation */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-600">Bản dịch:</div>
        <div className="text-lg font-medium">{data.translatedText}</div>
        {data.romanization && (
          <div className="text-sm text-gray-500">
            <strong>Phiên âm:</strong> {data.romanization}
          </div>
        )}
      </div>

      {/* Language Detection */}
      {data.sourceLanguage && (
        <div className="text-xs text-gray-500">
          Phát hiện ngôn ngữ: {data.sourceLanguage.toUpperCase()}
        </div>
      )}

      {/* Alternative Translations */}
      {data.alternatives && data.alternatives.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-600">Các bản dịch khác:</div>
          <div className="space-y-2">
            {data.alternatives.slice(0, 2).map((alt, index) => (
              <div key={index} className="text-sm">
                <div className="font-medium mb-1">{alt.src_phrase}</div>
                <div className="flex flex-wrap gap-1">
                  {alt.alternative?.slice(0, 3).map((option, optIndex) => (
                    <span
                      key={optIndex}
                      className="px-2 py-1 bg-gray-100 rounded text-xs"
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
  );
}
