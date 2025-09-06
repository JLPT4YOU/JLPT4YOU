'use client';

import { useState, useEffect } from 'react';
import { dictService, type WordDetail as WordDetailType } from '@/lib/dict/dict-service';
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

interface WordDetailProps {
  selectedItem: any;
  translations?: TranslationData;
}

export function WordDetail({ selectedItem, translations }: WordDetailProps) {
  const [wordDetail, setWordDetail] = useState<WordDetailType | null>(null);
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
      setError(err.message || 'Không thể tải thông tin từ');
      setWordDetail(null);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedItem || selectedItem.type !== 'word') {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>{t('dict.messages.selectWord')}</p>
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

  if (!wordDetail) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-lg border p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-baseline gap-3">
            <h2 className="text-3xl font-bold text-foreground">{renderField(wordDetail.word)}</h2>
            {wordDetail.kana && (
              <p className="text-3xl text-muted-foreground">{renderField(wordDetail.kana)}</p>
            )}
          </div>
          <div className="flex gap-2">
            {wordDetail.level && (
              <Badge variant="secondary" className="text-sm">
                {typeof wordDetail.level === 'object' && wordDetail.level.name
                  ? wordDetail.level.name
                  : `JLPT ${renderField(wordDetail.level)}`}
              </Badge>
            )}
            {wordDetail.type && (
              <Badge variant="outline" className="text-sm">
                {typeof wordDetail.type === 'object' && wordDetail.type.name
                  ? wordDetail.type.name
                  : renderField(wordDetail.type)}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Meanings */}
      {wordDetail.meanings && wordDetail.meanings.length > 0 && (
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Nghĩa</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {wordDetail.meanings.map((meaning, index) => (
              <li key={meaning.id || index} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </span>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    {meaning.kind && (
                      <Badge variant="outline" className="text-xs">
                        {renderField(meaning.kind)}
                      </Badge>
                    )}
                    <span className="text-base font-medium">{renderField(meaning.mean)}</span>
                  </div>
                  {meaning.note && (
                    <p className="text-sm text-muted-foreground italic">
                      {renderField(meaning.note)}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Kanji Information */}
      {wordDetail.kanjis && wordDetail.kanjis.length > 0 && (
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Thông tin Kanji</h3>
          <div className="space-y-4">
            {wordDetail.kanjis.map((kanji, index) => (
              <div key={index} className="bg-muted/20 rounded-lg p-4 border">
                <div className="flex items-center gap-6">
                  {/* Large Kanji - Left Side */}
                  <div className="flex-shrink-0">
                    <div className="text-8xl font-bold text-primary leading-none">
                      {renderField(kanji.kanji)}
                    </div>
                  </div>

                  {/* Kanji Information - Right Side */}
                  <div className="flex-1 grid grid-cols-1 gap-3 text-base">
                    {kanji.hanviet && (
                      <div className="flex items-center">
                        <span className="font-medium text-muted-foreground w-20">Hán Việt:</span>
                        <span className="font-semibold">{renderField(kanji.hanviet)}</span>
                      </div>
                    )}
                    {kanji.onyomi && (
                      <div className="flex items-center">
                        <span className="font-medium text-muted-foreground w-20">Onyomi:</span>
                        <span className="font-medium">{renderField(kanji.onyomi)}</span>
                      </div>
                    )}
                    {kanji.kunyomi && (
                      <div className="flex items-center">
                        <span className="font-medium text-muted-foreground w-20">Kunyomi:</span>
                        <span className="font-medium">{renderField(kanji.kunyomi)}</span>
                      </div>
                    )}
                    {kanji.stroke && (
                      <div className="flex items-center">
                        <span className="font-medium text-muted-foreground w-20">Số nét:</span>
                        <span className="font-medium">{renderField(kanji.stroke)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Examples */}
      {wordDetail.examples && wordDetail.examples.length > 0 && (
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Ví dụ</h3>
          <div className="space-y-4">
            {wordDetail.examples.slice(0, 6).map((example, index) => (
              <div key={example.id || index} className="border-l-2 border-primary/30 pl-4">
                <p className="text-base font-medium mb-1">{renderField(example.content)}</p>
                {example.transcription && (
                  <p className="text-sm text-muted-foreground italic mb-1">
                    {renderField(example.transcription)}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">{renderField(example.mean)}</p>
              </div>
            ))}
            {wordDetail.examples.length > 6 && (
              <p className="text-sm text-muted-foreground text-center">
                và {wordDetail.examples.length - 6} ví dụ khác...
              </p>
            )}
          </div>
        </div>
      )}

      {/* Related Words */}
      {wordDetail.related_words && wordDetail.related_words.length > 0 && (
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Từ liên quan</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {wordDetail.related_words.slice(0, 10).map((word) => (
              <button
                key={word.id}
                onClick={() => {
                  const slugOrId = word.slug || word.id || renderField(word.word);
                  loadWordDetail(slugOrId);
                }}
                className="p-3 bg-muted/20 rounded-lg border hover:bg-muted/40 hover:border-primary/50 transition-colors text-left group"
              >
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium group-hover:text-primary transition-colors">
                      {renderField(word.word)}
                    </span>
                    {word.kana && (
                      <span className="text-sm text-muted-foreground">
                        {renderField(word.kana)}
                      </span>
                    )}
                  </div>
                  {word.suggest_mean && (
                    <p className="text-sm text-muted-foreground">
                      {renderField(word.suggest_mean)}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
          {wordDetail.related_words.length > 10 && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              {t('dict.wordDetail.moreWords').replace('{count}', String(wordDetail.related_words.length - 10))}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
