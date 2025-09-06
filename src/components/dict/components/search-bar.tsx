'use client';

import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type SuggestItem, type SearchType, type KeywordPosition } from '@/lib/dict/dict-service';
import { RefObject, KeyboardEvent } from 'react';
import { TranslationData } from '@/lib/i18n';

// Helper function to safely render string or object fields
const renderField = (field: any): string => {
  if (!field) return '';
  if (typeof field === 'string') return field;
  if (typeof field === 'object' && field?.name) return field.name;
  return String(field);
};

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchType: SearchType;
  setSearchType: (type: SearchType) => void;
  keywordPosition: KeywordPosition;
  setKeywordPosition: (position: KeywordPosition) => void;
  suggestions: SuggestItem[];
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  loading: boolean;
  onSuggestionClick: (item: SuggestItem) => void;
  onSearchSubmit: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
  translations: TranslationData;
}

export function SearchBar({
  searchQuery,
  setSearchQuery,
  searchType,
  setSearchType,
  keywordPosition,
  setKeywordPosition,
  suggestions,
  showSuggestions,
  setShowSuggestions,
  loading,
  onSuggestionClick,
  onSearchSubmit,
  inputRef,
  translations
}: SearchBarProps) {

  // Translation function
  const t = (key: string) => {
    const keys = key.split('.');
    let value: any = translations;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearchSubmit();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const positionOptions: { value: KeywordPosition; label: string }[] = [
    { value: 'start', label: t('dict.search.positions.start') },
    { value: 'middle', label: t('dict.search.positions.middle') },
    { value: 'end', label: t('dict.search.positions.end') },
  ];

  const typeOptions: { value: SearchType; label: string }[] = [
    { value: 'word', label: t('dict.search.types.word') },
    { value: 'grammar', label: t('dict.search.types.grammar') },
  ];

  return (
    <div className="relative">
      <div className="bg-card rounded-lg border shadow-sm p-4">
        {/* Search Input Row */}
        <div className="flex gap-3 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                // Show suggestions immediately when typing
                if (e.target.value.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                // Show suggestions on focus if there's a query and suggestions exist
                if (searchQuery.length > 0 && suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              placeholder={t('dict.search.placeholder')}
              className="w-full pl-10 pr-10 py-3 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowSuggestions(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
          
          <button
            onClick={onSearchSubmit}
            disabled={!searchQuery}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('dict.search.button')}
          </button>
        </div>

        {/* Options Row */}
        <div className="flex gap-4 mt-3 pt-3 border-t">
          {/* Type Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('dict.search.typeLabel')}</span>
            <div className="flex gap-1">
              {typeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSearchType(option.value)}
                  className={cn(
                    'px-3 py-1 text-sm rounded-md transition-colors',
                    searchType === option.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Position Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('dict.search.positionLabel')}</span>
            <div className="flex gap-1">
              {positionOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setKeywordPosition(option.value)}
                  className={cn(
                    'px-3 py-1 text-sm rounded-md transition-colors',
                    keywordPosition === option.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
          {loading && (
            <div className="p-4 text-center text-muted-foreground">
              {t('dict.search.loading')}
            </div>
          )}
          {!loading && suggestions.map((item, index) => (
            <button
              key={`${item.type}-${item.id}-${index}`}
              onClick={() => onSuggestionClick(item)}
              className="w-full px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b last:border-b-0"
            >
              {item.type === 'word' ? (
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-lg">{renderField(item.word)}</span>
                    {item.kana && (
                      <span className="text-muted-foreground">{renderField(item.kana)}</span>
                    )}
                  </div>
                  {item.suggest_mean && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {renderField(item.suggest_mean)}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="font-bold">{renderField(item.grammar)}</div>
                  {item.definition && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {renderField(item.definition)}
                    </div>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
