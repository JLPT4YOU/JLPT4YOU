'use client';

import { useState, useEffect } from 'react';
import { dictService } from '@/lib/dict/dict-service';
import { Loader2 } from 'lucide-react';
import { TranslationData } from '@/lib/i18n';

// Helper function to safely render string or object fields
const renderField = (field: any): string => {
  if (!field) return '';
  if (typeof field === 'string') return field;
  if (typeof field === 'object' && field?.name) return field.name;
  return String(field);
};

interface ExamplesListProps {
  selectedItem: any;
  translations?: any;
}

export function ExamplesList({ selectedItem }: ExamplesListProps) {
  const [examples, setExamples] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedItem && selectedItem.type === 'word') {
      const slugOrId = selectedItem.slug || selectedItem.id || selectedItem.word;
      loadWordExamples(slugOrId);
    } else if (selectedItem && selectedItem.type === 'grammar') {
      loadGrammarExamples(selectedItem.id);
    }
  }, [selectedItem]);

  const loadWordExamples = async (slugOrId: string | number) => {
    setLoading(true);
    setError(null);
    try {
      const detail = await dictService.getWordDetail(slugOrId);
      setExamples(detail.examples || []);
    } catch (err: any) {
      setError(err.message || 'Không thể tải ví dụ');
      setExamples([]);
    } finally {
      setLoading(false);
    }
  };

  const loadGrammarExamples = async (id: string | number) => {
    setLoading(true);
    setError(null);
    try {
      const detail = await dictService.getGrammarDetail(id);
      setExamples(detail.examples || []);
    } catch (err: any) {
      setError(err.message || 'Không thể tải ví dụ');
      setExamples([]);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedItem) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Chọn một từ hoặc ngữ pháp để xem ví dụ</p>
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

  if (examples.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Không có ví dụ cho mục này</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-xl font-bold">Các câu ví dụ</h2>
        <p className="text-muted-foreground mt-1">
          Tìm thấy {examples.length} ví dụ
        </p>
      </div>

      {/* Examples List */}
      <div className="space-y-4">
        {examples.map((example, index) => (
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
      </div>
    </div>
  );
}
