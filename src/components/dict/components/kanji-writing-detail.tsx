'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { lookupDjCached } from '@/components/dictionary/service';
import { parseDjFulltext } from '@/components/dictionary/parseDj';
import { sanitizeHtml } from '@/components/dictionary/sanitizer';
import { createKanjiAnimator, type Animator } from '@/components/dictionary/kanjiAnimator';
import { PenTool, Play, Pause, RotateCcw, SkipForward, SkipBack, Search } from 'lucide-react';
import '@/components/dictionary/styles.css';

interface KanjiWritingDetailProps {
  selectedItem?: any;
  searchQuery?: string;
}

export function KanjiWritingDetail({ selectedItem, searchQuery = '' }: KanjiWritingDetailProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [svgs, setSvgs] = useState<{ char?: string; svg: string }[]>([]);
  const [kanjiContents, setKanjiContents] = useState<{ char: string; html: string }[]>([]);
  const [kanjiIdx, setKanjiIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStroke, setCurrentStroke] = useState(0);

  // Animation ref
  const animRef = useRef<{ el: HTMLDivElement | null; api: Animator | null }>({ el: null, api: null });
  const kanjiBoxRef = useRef<HTMLDivElement>(null);
  const kanjiInfoRef = useRef<HTMLDivElement>(null);

  // Get query from selectedItem or searchQuery prop
  const currentQuery = selectedItem?.word
    ? (typeof selectedItem.word === 'string' ? selectedItem.word : selectedItem.word.name)
    : searchQuery;

  // Bold labels before colons in kanji info
  useEffect(() => {
    if (kanjiInfoRef.current && kanjiContents.length > 0) {
      const container = kanjiInfoRef.current;
      const labels = ['Bộ:', '訓:', '音:', 'Số nét:', 'JLPT:', 'Nghĩa:', 'Ví dụ:'];

      // Find and bold text before colons
      const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        null
      );

      const textNodes: Text[] = [];
      let node;
      while (node = walker.nextNode()) {
        textNodes.push(node as Text);
      }

      textNodes.forEach(textNode => {
        let content = textNode.textContent || '';
        let hasChanges = false;

        labels.forEach(label => {
          if (content.includes(label)) {
            content = content.replace(label, `<strong>${label}</strong>`);
            hasChanges = true;
          }
        });

        if (hasChanges && textNode.parentNode) {
          const span = document.createElement('span');
          span.innerHTML = content;
          textNode.parentNode.replaceChild(span, textNode);
        }
      });
    }
  }, [kanjiContents, kanjiIdx]);

  // Search for kanji when query changes
  useEffect(() => {
    if (currentQuery.trim()) {
      handleSearch();
    } else {
      setSvgs([]);
      setKanjiContents([]);
      setError(null);
    }
  }, [currentQuery]);

  // Setup kanji animator when SVG data changes
  useEffect(() => {
    if (svgs.length === 0 || kanjiIdx >= svgs.length) return;

    // Reset previous animator
    animRef.current.api?.pause();
    animRef.current = { el: null, api: null };
    
    const slot = kanjiBoxRef.current?.querySelector('[data-anim-slot]') as HTMLDivElement | null;
    const svg = svgs[kanjiIdx]?.svg;
    
    if (!slot || !svg) return;

    const api = createKanjiAnimator(slot, svg, { speed: 1 });
    api.onFinish = () => {
      setIsPlaying(false);
    };
    
    animRef.current = { el: slot, api };
    setIsPlaying(false);
    setCurrentStroke(0);
  }, [svgs, kanjiIdx]);

  const handleSearch = async () => {
    if (!currentQuery.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await lookupDjCached(currentQuery);
      const parsed = parseDjFulltext(result.fulltext);
      const sections = parsed.sections.map((s) => ({ ...s, html: sanitizeHtml(s.html) }));

      setSvgs(parsed.svgs);
      setKanjiContents(parsed.kanjiContents || []);
      setKanjiIdx(0);

      if (parsed.svgs.length === 0) {
        setError('Không tìm thấy thông tin viết kanji cho từ này');
      }
    } catch (err) {
      console.error('Kanji search error:', err);
      setError(err instanceof Error ? err.message : 'Lỗi khi tìm kiếm kanji');
      setSvgs([]);
      setKanjiContents([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = () => {
    if (!animRef.current.api) return;
    
    if (isPlaying) {
      animRef.current.api.pause();
      setIsPlaying(false);
    } else {
      animRef.current.api.play();
      setIsPlaying(true);
    }
  };

  const handleReset = () => {
    if (!animRef.current.api) return;
    animRef.current.api.reset();
    setIsPlaying(false);
    setCurrentStroke(0);
  };

  const handleNextStroke = () => {
    if (!animRef.current.api) return;
    animRef.current.api.nextStroke();
    setCurrentStroke(prev => prev + 1);
  };

  const handlePrevStroke = () => {
    if (!animRef.current.api) return;
    animRef.current.api.previousStroke();
    setCurrentStroke(prev => Math.max(0, prev - 1));
  };

  const handleKanjiChange = (index: number) => {
    setKanjiIdx(index);
    setIsPlaying(false);
    setCurrentStroke(0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <PenTool className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-semibold">Viết kanji</h2>
      </div>

      {/* Current Query Display */}
      {currentQuery && (
        <div className="p-3 bg-muted/50 rounded-lg border border-border">
          <div className="text-sm text-muted-foreground">Đang học viết từ:</div>
          <div className="text-lg font-semibold">{currentQuery}</div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3">Đang tìm kiếm...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
          {error}
        </div>
      )}

      {/* Kanji Selection */}
      {svgs.length > 1 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium">Chọn kanji để học viết:</label>
          <div className="flex flex-wrap gap-2">
            {svgs.map((svg, index) => (
              <button
                key={index}
                onClick={() => handleKanjiChange(index)}
                className={cn(
                  "w-12 h-12 border-2 rounded-lg flex items-center justify-center text-xl font-bold transition-colors",
                  kanjiIdx === index
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                )}
              >
                {svg.char || '?'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Kanji Writing Area */}
      {svgs.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Học viết: {svgs[kanjiIdx]?.char || 'Kanji'}
            </h3>
            
            {/* Animation Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevStroke}
                className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
                title="Nét trước"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              
              <button
                onClick={handlePlay}
                className={cn(
                  "p-2 rounded-lg border border-border transition-colors",
                  isPlaying ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                )}
                title={isPlaying ? "Tạm dừng" : "Phát"}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              
              <button
                onClick={handleNextStroke}
                className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
                title="Nét tiếp theo"
              >
                <SkipForward className="w-4 h-4" />
              </button>
              
              <button
                onClick={handleReset}
                className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
                title="Đặt lại"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Kanji Writing Box */}
          <div className="flex justify-center">
            <div
              ref={kanjiBoxRef}
              className="relative bg-[#faf8f5] rounded-lg border-2 border-[#333] w-80 h-80 overflow-hidden"
            >
              {/* Grid lines */}
              <div className="absolute top-0 bottom-0 left-1/2 w-0" style={{ borderLeft: '1px dashed #d1d5db' }} />
              <div className="absolute top-1/2 left-0 right-0 h-0" style={{ borderTop: '1px dashed #d1d5db' }} />

              {/* Animation slot */}
              <div
                data-anim-slot
                className="absolute inset-0 flex items-center justify-center"
              />
            </div>
          </div>

          {/* Kanji Information */}
          {kanjiContents.length > 0 && kanjiIdx < kanjiContents.length && (
            <div className="space-y-3">
              <h4 className="text-lg font-semibold">Thông tin kanji:</h4>
              <div
                ref={kanjiInfoRef}
                className="bg-muted/50 p-4 rounded-lg kanji-info-table"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(kanjiContents[kanjiIdx].html)
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      {svgs.length === 0 && !loading && !error && !currentQuery && (
        <div className="text-center py-8 text-muted-foreground">
          <PenTool className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Sử dụng ô tìm kiếm phía trên để tìm từ hoặc kanji</p>
          <p className="text-sm mt-1">Sau đó chuyển sang tab này để học viết</p>
        </div>
      )}
    </div>
  );
}
