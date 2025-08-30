'use client';

import { useState, useEffect } from 'react';
import { dictService, type GrammarDetail as GrammarDetailType } from '@/lib/dict/dict-service';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

// Helper function to safely render string or object fields
const renderField = (field: any): string => {
  if (!field) return '';
  if (typeof field === 'string') return field;
  if (typeof field === 'object' && field?.name) return field.name;
  return String(field);
};

interface GrammarDetailProps {
  selectedItem: any;
}

export function GrammarDetail({ selectedItem }: GrammarDetailProps) {
  const [grammarDetail, setGrammarDetail] = useState<GrammarDetailType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedItem && selectedItem.type === 'grammar') {
      loadGrammarDetail(selectedItem.id);
    }
  }, [selectedItem]);

  const loadGrammarDetail = async (id: string | number) => {
    setLoading(true);
    setError(null);
    try {
      const detail = await dictService.getGrammarDetail(id);
      setGrammarDetail(detail);
    } catch (err: any) {
      setError(err.message || 'Không thể tải thông tin ngữ pháp');
      setGrammarDetail(null);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedItem || selectedItem.type !== 'grammar') {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Nhập từ khóa và chọn một mẫu ngữ pháp để xem chi tiết</p>
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

  if (!grammarDetail) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-lg border p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{renderField(grammarDetail.grammar)}</h2>
          </div>
          {grammarDetail.level && (
            <Badge variant="secondary" className="text-sm">
              {typeof grammarDetail.level === 'object' && grammarDetail.level.name
                ? grammarDetail.level.name
                : `JLPT ${renderField(grammarDetail.level)}`}
            </Badge>
          )}
        </div>
      </div>

      {/* Definition */}
      {grammarDetail.definition && (
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Định nghĩa</h3>
          <p className="text-base font-medium text-foreground leading-relaxed">{renderField(grammarDetail.definition)}</p>
        </div>
      )}

      {/* Usage */}
      {grammarDetail.usage && (
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Cách sử dụng</h3>
          <div className="bg-muted/30 rounded-lg p-4">
            <code className="text-lg font-mono font-medium">{renderField(grammarDetail.usage)}</code>
          </div>
        </div>
      )}

      {/* Context */}
      {grammarDetail.context && (
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Ngữ cảnh</h3>
          <p className="text-base font-medium text-foreground leading-relaxed">{renderField(grammarDetail.context)}</p>
        </div>
      )}

      {/* Examples */}
      {grammarDetail.examples && grammarDetail.examples.length > 0 && (
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Ví dụ</h3>
          <div className="space-y-3">
            {grammarDetail.examples.map((example, index) => (
              <div key={example.id || index} className="border-l-2 border-primary/30 pl-4">
                <p className="text-base font-medium mb-1">{renderField(example.content)}</p>
                <p className="text-base text-muted-foreground">{renderField(example.mean)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
