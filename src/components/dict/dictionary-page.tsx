'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { dictService, type SuggestItem, type SearchType, type KeywordPosition } from '@/lib/dict/dict-service';
import { debounce } from 'lodash';
import { Book, Type, BookOpen, FileText, Languages, PenTool } from 'lucide-react';
import { SearchBar } from './components/search-bar';
import { WordDetail } from './components/word-detail';
import { KanjiDetail } from './components/kanji-detail';
import { GrammarDetail } from './components/grammar-detail';
import { ExamplesList } from './components/examples-list';
import { TranslateDetail } from './components/translate-detail';
import { KanjiWritingDetail } from './components/kanji-writing-detail';
import { Language, TranslationData } from '@/lib/i18n';

export type TabType = 'word' | 'kanji' | 'grammar' | 'examples' | 'translate' | 'kanji-writing';

interface DictionaryPageProps {
  translations: TranslationData;
  language: Language;
  isAuthenticated: boolean;
}

export function DictionaryPage({ translations, language, isAuthenticated }: DictionaryPageProps) {
  return <DictionaryContent translations={translations} language={language} isAuthenticated={isAuthenticated} />;
}

function DictionaryContent({ translations, language, isAuthenticated }: DictionaryPageProps) {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('word');
  const [keywordPosition, setKeywordPosition] = useState<KeywordPosition>('start');
  const [suggestions, setSuggestions] = useState<SuggestItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('word');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Translation function
  const t = (key: string) => {
    const keys = key.split('.');
    let value: any = translations;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  // Initialize search query from URL parameter
  useEffect(() => {
    const queryParam = searchParams.get('q');
    if (queryParam) {
      setSearchQuery(queryParam);
      // Focus on search input after setting the query
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [searchParams]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string, type: SearchType, position: KeywordPosition) => {
      if (!query || query.length < 1) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setLoading(true);
      try {
        const results = await dictService.getSuggestions(query, type, position);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Search error:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 100),
    []
  );

  // Handle search input change
  useEffect(() => {
    debouncedSearch(searchQuery, searchType, keywordPosition);
  }, [searchQuery, searchType, keywordPosition, debouncedSearch]);

  // Handle suggestion click
  const handleSuggestionClick = async (item: SuggestItem) => {
    setShowSuggestions(false);
    setSelectedItem(item);
    
    // Set appropriate tab based on item type
    if (item.type === 'grammar') {
      setActiveTab('grammar');
    } else {
      setActiveTab('word');
    }
  };

  // Handle search submit
  const handleSearchSubmit = () => {
    if (suggestions.length > 0) {
      handleSuggestionClick(suggestions[0]);
    }
  };

  const tabs = [
    { id: 'word' as TabType, label: t('dict.tabs.word'), icon: Book },
    { id: 'kanji' as TabType, label: t('dict.tabs.kanji'), icon: Type },
    { id: 'kanji-writing' as TabType, label: t('dict.tabs.kanjiWriting'), icon: PenTool },
    { id: 'grammar' as TabType, label: t('dict.tabs.grammar'), icon: BookOpen },
    { id: 'examples' as TabType, label: t('dict.tabs.examples'), icon: FileText },
    { id: 'translate' as TabType, label: t('dict.tabs.translate'), icon: Languages },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3">
              <Book className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {t('dict.page.title')}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="w-full">
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchType={searchType}
            setSearchType={setSearchType}
            keywordPosition={keywordPosition}
            setKeywordPosition={setKeywordPosition}
            suggestions={suggestions}
            showSuggestions={showSuggestions}
            setShowSuggestions={setShowSuggestions}
            loading={loading}
            onSuggestionClick={handleSuggestionClick}
            onSearchSubmit={handleSearchSubmit}
            inputRef={searchInputRef}
            translations={translations}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="app-container">
        <div className="app-content max-w-6xl mx-auto">
          <div className="border-b border-border">
            <div className="flex gap-1 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap',
                      activeTab === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="py-6">
            {activeTab === 'word' && (
              <WordDetail selectedItem={selectedItem} translations={translations} />
            )}
            {activeTab === 'kanji' && (
              <KanjiDetail selectedItem={selectedItem} translations={translations} />
            )}
            {activeTab === 'grammar' && (
              <GrammarDetail selectedItem={selectedItem} translations={translations} />
            )}
            {activeTab === 'examples' && (
              <ExamplesList selectedItem={selectedItem} />
            )}
            {activeTab === 'translate' && (
              <TranslateDetail selectedItem={selectedItem} initialQuery={searchQuery} />
            )}
            {activeTab === 'kanji-writing' && (
              <KanjiWritingDetail selectedItem={selectedItem} searchQuery={searchQuery} />
            )}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
