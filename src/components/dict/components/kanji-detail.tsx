'use client';

import { useState, useEffect } from 'react';
import { dictService, type WordDetail } from '@/lib/dict/dict-service';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { TranslationData } from '@/lib/i18n';

// Helper function to safely render string or object fields
const renderField = (field: any): string => {
  if (!field) return '';
  if (typeof field === 'string') return field;
  if (typeof field === 'object' && field?.name) return field.name;
  return String(field);
};

interface KanjiDetailProps {
  selectedItem: any;
  translations?: TranslationData;
}

export function KanjiDetail({ selectedItem, translations }: KanjiDetailProps) {
  const [wordDetail, setWordDetail] = useState<WordDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Translation function
  const t = (key: string) => {
    if (!translations) return key;
    const keys = key.split('.');
    let value: any = translations;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  useEffect(() => {
    if (selectedItem && selectedItem.type === 'word') {
      const slugOrId = selectedItem.slug || selectedItem.id || selectedItem.word;
      loadWordDetail(slugOrId);
    }
  }, [selectedItem]);

  const loadWordDetail = async (slugOrId: string | number) => {
    setLoading(true);
    setError(null);
    try {
      const detail = await dictService.getWordDetail(slugOrId);
      setWordDetail(detail);
    } catch (err: any) {
      setError(err.message || 'Không thể tải thông tin từ vựng');
      setWordDetail(null);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedItem || selectedItem.type !== 'word') {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>{t('dict.messages.selectKanji')}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (!wordDetail || !wordDetail.kanjis || wordDetail.kanjis.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>{t('dict.messages.noKanji')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Word Header */}
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-2xl font-bold">{renderField(wordDetail.word)}</h2>
        <p className="text-lg text-muted-foreground mt-1">{renderField(wordDetail.kana)}</p>
      </div>

      {/* Kanji Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {wordDetail.kanjis.map((kanji, index) => (
          <div key={index} className="bg-card rounded-lg border p-6 hover:shadow-lg transition-shadow">
            {/* Large Kanji Display */}
            <div className="text-center mb-6">
              <div className="text-6xl font-bold text-primary mb-2">{renderField(kanji.kanji)}</div>
              {kanji.stroke && (
                <p className="text-sm text-muted-foreground">
                  {renderField(kanji.stroke)} nét
                </p>
              )}
            </div>

            {/* Kanji Information */}
            <div className="space-y-3">
              {kanji.hanviet && (
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Hán Việt</p>
                  <p className="font-semibold text-lg">{renderField(kanji.hanviet)}</p>
                </div>
              )}

              {kanji.onyomi && (
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Onyomi (音読み)</p>
                  <p className="font-medium">{renderField(kanji.onyomi)}</p>
                </div>
              )}

              {kanji.kunyomi && (
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Kunyomi (訓読み)</p>
                  <p className="font-medium">{renderField(kanji.kunyomi)}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
