/**
 * Component for rendering J4YDict content
 */

import React from 'react';
import type { WordDetail } from '@/lib/dict/dict-service';

interface J4YContentProps {
  data: WordDetail | null;
  loading: boolean;
  error: string | null;
}

// Helper function to safely render string or object fields
const renderField = (field: any): string => {
  if (!field) return '';
  if (typeof field === 'string') return field;
  if (typeof field === 'object' && field?.name) return field.name;
  return String(field);
};

export function J4YContent({ data, loading, error }: J4YContentProps) {
  if (loading) {
    return <div className="text-center py-4">Đang tải J4YDict...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">{error}</div>;
  }

  if (!data) {
    return <div className="text-center py-4">Không có dữ liệu</div>;
  }

  return (
    <div className="j4y-content space-y-4">
      {/* Word Header */}
      <div className="border-b pb-3">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="text-xl font-bold text-red-600">{renderField(data.word)}</h3>
          {data.kana && (
            <span className="text-lg text-green-600">{renderField(data.kana)}</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm">
          {data.level && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
              JLPT {renderField(data.level)}
            </span>
          )}
          {data.type && (
            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">
              {renderField(data.type)}
            </span>
          )}
        </div>
      </div>

      {/* Meanings */}
      {data.meanings && data.meanings.length > 0 && (
        <div>
          <h4 className="font-semibold text-red-600 mb-2">Nghĩa:</h4>
          <div className="space-y-2">
            {data.meanings.map((meaning, index) => (
              <div key={meaning.id || index} className="border-l-3 border-red-200 pl-3">
                <div className="font-medium">{renderField(meaning.mean)}</div>
                {meaning.note && (
                  <div className="text-sm text-gray-600 mt-1">
                    Ghi chú: {renderField(meaning.note)}
                  </div>
                )}
                {meaning.kind && (
                  <div className="text-xs text-blue-600 mt-1">
                    ({renderField(meaning.kind)})
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kanji Details */}
      {data.kanjis && data.kanjis.length > 0 && (
        <div>
          <h4 className="font-semibold text-red-600 mb-2">Thông tin Kanji:</h4>
          <div className="grid gap-3">
            {data.kanjis.map((kanji, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded">
                <div className="text-lg font-bold mb-2">{renderField(kanji.kanji)}</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {kanji.hanviet && (
                    <div><strong>Hán Việt:</strong> {renderField(kanji.hanviet)}</div>
                  )}
                  {kanji.onyomi && (
                    <div><strong>Âm On:</strong> {renderField(kanji.onyomi)}</div>
                  )}
                  {kanji.kunyomi && (
                    <div><strong>Âm Kun:</strong> {renderField(kanji.kunyomi)}</div>
                  )}
                  {kanji.stroke && (
                    <div><strong>Số nét:</strong> {renderField(kanji.stroke)}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Examples */}
      {data.examples && data.examples.length > 0 && (
        <div>
          <h4 className="font-semibold text-red-600 mb-2">Ví dụ:</h4>
          <div className="space-y-3">
            {data.examples.map((example, index) => (
              <div key={example.id || index} className="bg-blue-50 p-3 rounded">
                <div className="font-medium text-blue-900 mb-1">
                  {renderField(example.content)}
                </div>
                <div className="text-sm text-gray-700">
                  {renderField(example.mean)}
                </div>
                {example.transcription && (
                  <div className="text-xs text-gray-500 mt-1">
                    {renderField(example.transcription)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Words */}
      {data.related_words && data.related_words.length > 0 && (
        <div>
          <h4 className="font-semibold text-red-600 mb-2">Từ liên quan:</h4>
          <div className="flex flex-wrap gap-2">
            {data.related_words.map((word, index) => (
              <button
                key={word.id || index}
                className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm hover:bg-green-200 transition-colors"
                onClick={() => {
                  // Could implement clicking to search related word
                  console.log('Related word clicked:', word);
                }}
              >
                {renderField(word.word)}
                {word.kana && ` (${renderField(word.kana)})`}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
