import React, { useEffect, useMemo, useRef, useState } from 'react';
import { lookupDjCached } from './service';
import { parseDjFulltext } from './parseDj';
import { sanitizeHtml } from './sanitizer';
import { createKanjiAnimator, Animator } from './kanjiAnimator';
import { ModalOverlay } from './overlay';
import { dictService, type WordDetail } from '@/lib/dict/dict-service';
import { enhancedTranslateService, type TranslationResult } from '@/lib/translate/enhanced-translate-service';
import './styles.css';

export type DictionaryPopupProps = {
  query: string;
  anchorRect?: DOMRect; // optional when centered modal
  onClose: () => void;
};

export function DictionaryPopup({ query, anchorRect, onClose }: DictionaryPopupProps) {
  // J4YDict data state
  const [j4yData, setJ4yData] = useState<WordDetail | null>(null);
  const [j4yLoading, setJ4yLoading] = useState(true);
  const [j4yError, setJ4yError] = useState<string | null>(null);

  // Google Translate data state
  const [translateData, setTranslateData] = useState<TranslationResult | null>(null);
  const [translateLoading, setTranslateLoading] = useState(true);
  const [translateError, setTranslateError] = useState<string | null>(null);

  // TraCau data state
  const [htmlSections, setHtmlSections] = useState<{ key: string; label: string; html: string }[]>([]);
  const [svgs, setSvgs] = useState<{ char?: string; svg: string }[]>([]);
  const [kanjiContents, setKanjiContents] = useState<{ char: string; html: string }[]>([]);
  const [activeIdx, setActiveIdx] = useState(0); // tab index - J4YDict will be index 0
  const [kanjiIdx, setKanjiIdx] = useState(0); // selected kanji within Kanji tab
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // position - responsive modal positioning with resize listener
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // Initialize window size with throttling for performance
    let timeoutId: NodeJS.Timeout;
    const updateSize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      }, 16); // ~60fps throttling
    };

    updateSize(); // Set initial size
    window.addEventListener('resize', updateSize);
    window.addEventListener('orientationchange', updateSize); // Mobile orientation
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('orientationchange', updateSize);
    };
  }, []);

  const style = useMemo(() => {
    if (windowSize.width === 0) return { top: 0, left: 0, width: 0, height: 0 }; // Initial state

    // Responsive sizing with better mobile handling
    const minWidth = 320; // Minimum for mobile
    const maxWidth = 1000; // Tăng maxWidth để có thêm không gian
    const minHeight = 450; // Tăng minHeight để hiển thị nội dung tốt hơn
    const maxHeight = Math.min(windowSize.height * 0.9, 700); // Tăng maxHeight nhưng không quá 90% màn hình

    const padding = windowSize.width < 768 ? 16 : 32; // Giảm padding để có thêm không gian
    const width = Math.max(minWidth, Math.min(windowSize.width - padding, maxWidth));
    const height = Math.max(minHeight, Math.min(windowSize.height - padding, maxHeight));

    const top = Math.max(10, (windowSize.height - height) / 2); // Prevent negative positioning
    const left = Math.max(10, (windowSize.width - width) / 2);

    return { top, left, width, height } as const;
  }, [windowSize]);

  // Store individual Kanji data when fetched separately
  const [individualKanjiData, setIndividualKanjiData] = useState<Record<string, string>>({});
  const [loadingIndividual, setLoadingIndividual] = useState(false);

  // Fetch J4YDict data
  useEffect(() => {
    let cancelled = false;
    setJ4yLoading(true);
    setJ4yError(null);

    // Try to get word detail from J4YDict API first
    dictService.getSuggestions(query, 'word', 'start')
      .then(async (suggestions) => {
        if (cancelled) return;
        if (suggestions.length > 0) {
          // Get the first suggestion and fetch its details
          const firstSuggestion = suggestions[0];
          const wordDetail = await dictService.getWordDetail(firstSuggestion.slug || firstSuggestion.id, true);
          setJ4yData(wordDetail);
        } else {
          setJ4yError('Không tìm thấy từ trong J4YDict');
        }
      })
      .catch((e) => {
        if (!cancelled) {
          console.error('J4YDict error:', e);
          setJ4yError(e.message || 'Lỗi khi tải dữ liệu J4YDict');
        }
      })
      .finally(() => !cancelled && setJ4yLoading(false));

    return () => {
      cancelled = true;
    };
  }, [query]);

  // Fetch Google Translate data
  useEffect(() => {
    let cancelled = false;
    setTranslateLoading(true);
    setTranslateError(null);

    enhancedTranslateService.translate(query, 'auto', 'vi')
      .then((result) => {
        if (cancelled) return;
        setTranslateData(result);
      })
      .catch((e) => {
        if (!cancelled) {
          console.error('Google Translate error:', e);
          setTranslateError(e.message || 'Lỗi khi dịch');
        }
      })
      .finally(() => !cancelled && setTranslateLoading(false));

    return () => {
      cancelled = true;
    };
  }, [query]);

  // Fetch TraCau data
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    lookupDjCached(query)
      .then((res) => {
        if (cancelled) return;
        const parsed = parseDjFulltext(res.fulltext);
        const sections = parsed.sections.map((s) => ({ ...s, html: sanitizeHtml(s.html) }));
        setHtmlSections(sections);
        setSvgs(parsed.svgs);
        setKanjiContents(parsed.kanjiContents || []);
        setKanjiIdx(0);
      })
      .catch((e) => !cancelled && setError(e.message || 'Lỗi không xác định'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [query]);
  
  // Fetch individual Kanji when selected (for compound words)
  useEffect(() => {
    if (!svgs.length || kanjiIdx >= svgs.length) return;
    const selectedKanji = svgs[kanjiIdx].char;
    
    // Skip if already fetched or is the full query
    if (!selectedKanji || individualKanjiData[selectedKanji] || selectedKanji === query) return;
    
    // Only fetch individual if we have multiple Kanji
    if (svgs.length <= 1) return;
    
    let cancelled = false;
    setLoadingIndividual(true);
    
    lookupDjCached(selectedKanji)
      .then((res) => {
        if (cancelled) return;
        const parsed = parseDjFulltext(res.fulltext);
        const kanjiSection = parsed.sections.find(s => s.label.toLowerCase().includes('kanji'));
        if (kanjiSection) {
          setIndividualKanjiData(prev => ({
            ...prev,
            [selectedKanji]: sanitizeHtml(kanjiSection.html)
          }));
        }
      })
      .catch(console.error)
      .finally(() => !cancelled && setLoadingIndividual(false));
    
    return () => {
      cancelled = true;
    };
  }, [kanjiIdx, svgs, individualKanjiData, query]);

  // Helper function to safely render string or object fields
  const renderField = (field: any): string => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    if (typeof field === 'object' && field?.name) return field.name;
    return String(field);
  };

  // Render J4YDict content
  const renderJ4YContent = () => {
    if (j4yLoading) {
      return <div className="text-center py-4">Đang tải J4YDict...</div>;
    }

    if (j4yError) {
      return <div className="text-center py-4 text-red-500">{j4yError}</div>;
    }

    if (!j4yData) {
      return <div className="text-center py-4">Không có dữ liệu</div>;
    }

    return (
      <div className="j4y-content space-y-4">
        {/* Word Header */}
        <div className="border-b pb-3">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold text-red-600">{renderField(j4yData.word)}</h3>
            {j4yData.kana && (
              <span className="text-lg text-green-600">{renderField(j4yData.kana)}</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm">
            {j4yData.level && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                JLPT {renderField(j4yData.level)}
              </span>
            )}
            {j4yData.type && (
              <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">
                {renderField(j4yData.type)}
              </span>
            )}
          </div>
        </div>

        {/* Meanings */}
        {j4yData.meanings && j4yData.meanings.length > 0 && (
          <div>
            <h4 className="font-semibold text-red-600 mb-2">Nghĩa:</h4>
            <div className="space-y-2">
              {j4yData.meanings.map((meaning, index) => (
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
        {j4yData.kanjis && j4yData.kanjis.length > 0 && (
          <div>
            <h4 className="font-semibold text-red-600 mb-2">Thông tin Kanji:</h4>
            <div className="grid gap-3">
              {j4yData.kanjis.map((kanji, index) => (
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
        {j4yData.examples && j4yData.examples.length > 0 && (
          <div>
            <h4 className="font-semibold text-red-600 mb-2">Ví dụ:</h4>
            <div className="space-y-3">
              {j4yData.examples.map((example, index) => (
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
        {j4yData.related_words && j4yData.related_words.length > 0 && (
          <div>
            <h4 className="font-semibold text-red-600 mb-2">Từ liên quan:</h4>
            <div className="flex flex-wrap gap-2">
              {j4yData.related_words.map((word, index) => (
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
  };

  // Close on ESC & click outside (simplified)
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClick);
    };
  }, [onClose]);

  // Kanji animator lifecycle (single page per kanji)
  const animRef = useRef<{ el: HTMLDivElement | null; api: Animator | null }>({ el: null, api: null });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStroke, setCurrentStroke] = useState(0);
  useEffect(() => {
    // Only apply kanji animator for TraCau tabs (activeIdx > 1)
    const isKanji = activeIdx > 1 && htmlSections[activeIdx - 2]?.label?.toLowerCase().includes('kanji');
    if (!isKanji) return;

    // Reset previous animator
    animRef.current.api?.pause();
    animRef.current = { el: null, api: null };
    const slot = ref.current?.querySelector('[data-anim-slot]') as HTMLDivElement | null;
    const svg = svgs[kanjiIdx]?.svg;
    if (!slot || !svg) return;

    const api = createKanjiAnimator(slot, svg, { speed: 1 });
    // Set onFinish callback to auto-switch pause to play
    api.onFinish = () => {
      setIsPlaying(false);
    };
    animRef.current = { el: slot, api };
    // Don't auto-play, let user control
    setIsPlaying(false);
    setCurrentStroke(0);
  }, [activeIdx, htmlSections, svgs, kanjiIdx]);

  return (
    <>
      <ModalOverlay />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        className="fixed z-[9999] bg-white text-black rounded-2xl p-4 border border-[#e5e5e5] shadow-xl flex flex-col"
        style={{ top: style.top, left: style.left, width: style.width, height: style.height }}
      >
      <div className="flex items-center gap-3 border-b border-[#e5e5e5] pb-2 mb-2 flex-shrink-0">
        <div className="flex-1 flex flex-wrap gap-2">
          {/* J4YDict Tab - Always first */}
          <button
            className={`px-2 py-1 rounded-xl text-sm ${activeIdx === 0 ? 'bg-[#f2f2f2]' : 'bg-transparent hover:bg-[#f7f7f7]'}`}
            onClick={() => setActiveIdx(0)}
          >
            J4YDict
          </button>

          {/* Google Translate Tab - Always second */}
          <button
            className={`px-2 py-1 rounded-xl text-sm ${activeIdx === 1 ? 'bg-[#f2f2f2]' : 'bg-transparent hover:bg-[#f7f7f7]'}`}
            onClick={() => setActiveIdx(1)}
          >
            Google Dịch
          </button>

          {/* TraCau Tabs - shifted by +2 */}
          {htmlSections.map((s, i) => (
            <button
              key={s.key + i}
              className={`px-2 py-1 rounded-xl text-sm ${(i + 2) === activeIdx ? 'bg-[#f2f2f2]' : 'bg-transparent hover:bg-[#f7f7f7]'}`}
              onClick={() => setActiveIdx(i + 2)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Show loading state */}
      {(activeIdx === 0 ? j4yLoading : activeIdx === 1 ? translateLoading : loading) && (
        <div className="text-base opacity-80">
          {activeIdx === 0 ? 'Đang tải J4YDict...' : activeIdx === 1 ? 'Đang dịch...' : 'Đang tải…'}
        </div>
      )}

      {/* Show error state */}
      {(activeIdx === 0 ? j4yError : activeIdx === 1 ? translateError : error) && (
        <div className="text-base text-red-400">
          {activeIdx === 0 ? j4yError : activeIdx === 1 ? translateError : error}
        </div>
      )}

      {/* Show content */}
      {activeIdx === 0 ? (
        // J4YDict content
        !j4yLoading && !j4yError && (
          <div
            className="overflow-auto pr-2 flex-1 min-h-0"
            style={{
              maxHeight: `${style.height - 140}px`
            }}
          >
            {renderJ4YContent()}
          </div>
        )
      ) : activeIdx === 1 ? (
        // Google Translate content
        !translateLoading && !translateError && translateData && (
          <div
            className="overflow-auto pr-2 flex-1 min-h-0 space-y-3"
            style={{
              maxHeight: `${style.height - 140}px`
            }}
          >
            {/* Main Translation */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-600">Bản dịch:</div>
              <div className="text-lg font-medium">{translateData.translatedText}</div>
              {translateData.romanization && (
                <div className="text-sm text-gray-500">
                  <strong>Phiên âm:</strong> {translateData.romanization}
                </div>
              )}
            </div>

            {/* Language Detection */}
            {translateData.sourceLanguage && (
              <div className="text-xs text-gray-500">
                Phát hiện ngôn ngữ: {translateData.sourceLanguage.toUpperCase()}
              </div>
            )}

            {/* Alternative Translations */}
            {translateData.alternatives && translateData.alternatives.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-600">Các bản dịch khác:</div>
                <div className="space-y-2">
                  {translateData.alternatives.slice(0, 2).map((alt, index) => (
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
        )
      ) : (
        // TraCau content
        !loading && !error && htmlSections[activeIdx - 2] && (
        <div
          className="overflow-auto pr-2 flex-1 min-h-0"
          style={{
            maxHeight: `${style.height - 140}px` // Tăng thêm để tính cả border và padding
          }}
        >
          {htmlSections[activeIdx - 2].label.toLowerCase().includes('kanji') ? (
            <div
              className="relative"
              style={{
                ['--kanji-box' as any]: style.width < 600
                  ? `clamp(150px, ${Math.max(150, Math.min(windowSize.width * 0.3, style.width * 0.4))}px, 200px)` // Mobile: 150-200px
                  : `clamp(180px, ${Math.max(180, Math.min(windowSize.width * 0.28, style.width * 0.42))}px, 270px)`, // Desktop: 180-270px
                ['--popup-width' as any]: `${style.width}px`
              }}
            >
              {/* Floating Kanji box at top-right - always show but smaller on mobile */}
              <div className={`absolute top-1 right-1 z-10 flex flex-col ${style.width < 600 ? 'gap-0.5' : 'gap-1'}`}> {/* Smaller gap on mobile */}
                  {/* Kanji writing area with 4-square grid */}
                  <div className="relative">
                    <div className="relative bg-[#faf8f5] rounded-lg border-2 border-[#333] h-[var(--kanji-box)] w-[var(--kanji-box)] overflow-hidden">
                      {/* 4 squares grid - dashed gray lines */}
                      <div className="absolute top-0 bottom-0 left-1/2 w-0" style={{ borderLeft: '1px dashed #d1d5db' }} />
                      {/* Horizontal center line - dashed gray */}
                      <div className="absolute top-1/2 left-0 right-0 h-0" style={{ borderTop: '1px dashed #d1d5db' }} />
                      {/* Kanji animation slot */}
                      <div data-anim-slot className="absolute inset-0 flex items-center justify-center" />
                    </div>
                  </div>

                  {/* Control buttons - responsive sizing */}
                  <div
                    className="flex items-center justify-center"
                    style={{
                      gap: `clamp(2px, calc(var(--kanji-box, 240px) * 0.008), 6px)`
                    }}
                  >
                    <button
                      className="rounded-lg bg-white border border-[#e5e5e5] hover:bg-[#f7f7f7] transition-colors"
                      style={{
                        padding: `clamp(4px, calc(var(--kanji-box, 240px) * 0.025), 8px)`
                      }}
                      onClick={() => {
                        animRef.current.api?.previousStroke?.();
                        setCurrentStroke(Math.max(0, currentStroke - 1));
                      }}
                      title="Previous Stroke"
                    >
                      <svg
                        className="fill-none stroke-current"
                        viewBox="0 0 24 24"
                        style={{
                          width: `clamp(16px, calc(var(--kanji-box, 240px) * 0.08), 20px)`,
                          height: `clamp(16px, calc(var(--kanji-box, 240px) * 0.08), 20px)`
                        }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    <button
                      className="rounded-lg bg-white border border-[#e5e5e5] hover:bg-[#f7f7f7] transition-colors"
                      style={{
                        padding: `clamp(4px, calc(var(--kanji-box, 240px) * 0.025), 8px)`
                      }}
                      onClick={() => {
                        if (animRef.current.api?.isPlaying()) {
                          animRef.current.api?.pause();
                          setIsPlaying(false);
                        } else {
                          animRef.current.api?.play();
                          setIsPlaying(true);
                        }
                      }}
                      title={isPlaying ? "Pause" : "Play"}
                    >
                      {isPlaying ? (
                        <svg
                          className="fill-current"
                          viewBox="0 0 24 24"
                          style={{
                            width: `clamp(16px, calc(var(--kanji-box, 240px) * 0.08), 20px)`,
                            height: `clamp(16px, calc(var(--kanji-box, 240px) * 0.08), 20px)`
                          }}
                        >
                          <rect x="6" y="4" width="4" height="16" rx="1" />
                          <rect x="14" y="4" width="4" height="16" rx="1" />
                        </svg>
                      ) : (
                        <svg
                          className="fill-current"
                          viewBox="0 0 24 24"
                          style={{
                            width: `clamp(16px, calc(var(--kanji-box, 240px) * 0.08), 20px)`,
                            height: `clamp(16px, calc(var(--kanji-box, 240px) * 0.08), 20px)`
                          }}
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>

                    <button
                      className="rounded-lg bg-white border border-[#e5e5e5] hover:bg-[#f7f7f7] transition-colors"
                      style={{
                        padding: `clamp(4px, calc(var(--kanji-box, 240px) * 0.025), 8px)`
                      }}
                      onClick={() => {
                        animRef.current.api?.clear?.();
                        setIsPlaying(false);
                        setCurrentStroke(0);
                      }}
                      title="Clear"
                    >
                      <svg
                        className="fill-none stroke-current"
                        viewBox="0 0 24 24"
                        style={{
                          width: `clamp(16px, calc(var(--kanji-box, 240px) * 0.08), 20px)`,
                          height: `clamp(16px, calc(var(--kanji-box, 240px) * 0.08), 20px)`
                        }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
                      </svg>
                    </button>

                    <button
                      className="rounded-lg bg-white border border-[#e5e5e5] hover:bg-[#f7f7f7] transition-colors"
                      style={{
                        padding: `clamp(4px, calc(var(--kanji-box, 240px) * 0.025), 8px)`
                      }}
                      onClick={() => {
                        animRef.current.api?.nextStroke?.();
                        setCurrentStroke(currentStroke + 1);
                      }}
                      title="Next Stroke"
                    >
                      <svg
                        className="fill-none stroke-current"
                        viewBox="0 0 24 24"
                        style={{
                          width: `clamp(16px, calc(var(--kanji-box, 240px) * 0.08), 20px)`,
                          height: `clamp(16px, calc(var(--kanji-box, 240px) * 0.08), 20px)`
                        }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

              {/* Kanji index selector (pagination by kanji) */}
              {svgs.length > 1 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {svgs.map((k, i) => (
                    <button
                      key={i}
                      onClick={() => setKanjiIdx(i)}
                      className={`px-2 py-1 rounded border text-base ${i === kanjiIdx ? 'bg-[#f2f2f2]' : 'bg-transparent hover:bg-[#f7f7f7]'} border-[#e5e5e5]`}
                    >
                      {k.char || `#${i + 1}`}
                    </button>
                  ))}
                </div>
              )}

              {/* Display individual Kanji content if available, otherwise show compound content */}
              {loadingIndividual ? (
                <div className="text-center py-4">Đang tải thông tin chữ Hán...</div>
              ) : (() => {
                const htmlContent = svgs.length > 1 && svgs[kanjiIdx]?.char && individualKanjiData[svgs[kanjiIdx].char]
                  ? individualKanjiData[svgs[kanjiIdx].char]  // Use individual Kanji data
                  : (kanjiContents.length > 0 && kanjiIdx < kanjiContents.length
                      ? sanitizeHtml(kanjiContents[kanjiIdx].html)
                      : htmlSections[activeIdx - 2].html);

                // Parse HTML to separate basic info from "Nghĩa" onwards
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = htmlContent;
                const elements = Array.from(tempDiv.children);

                let nghiaIndex = -1;
                elements.forEach((child, index) => {
                  if (child.textContent?.includes('Nghĩa:') && nghiaIndex === -1) {
                    nghiaIndex = index;
                  }
                });

                const basicInfoElements = nghiaIndex >= 0 ? elements.slice(0, nghiaIndex) : elements;
                const fullWidthElements = nghiaIndex >= 0 ? elements.slice(nghiaIndex) : [];

                return (
                  <>
                    {/* Basic info with margin-right for kanji box */}
                    <div
                      className="dict-html"
                      style={{
                        marginRight: `calc(var(--kanji-box) + ${style.width < 600 ? '4px' : '8px'})` // Always reserve space for kanji box, smaller margin on mobile
                      }}
                      dangerouslySetInnerHTML={{
                        __html: basicInfoElements.map(el => el.outerHTML).join('')
                      }}
                    />

                    {/* Full width content (Nghĩa and examples) */}
                    {fullWidthElements.length > 0 && (
                      <div
                        className="dict-html"
                        dangerouslySetInnerHTML={{
                          __html: fullWidthElements.map(el => el.outerHTML).join('')
                        }}
                        ref={(el) => {
                          if (el) {
                            // Replace "Từ" with "Từ vựng" in table headers
                            const headers = el.querySelectorAll('th');
                            headers.forEach(header => {
                              if (header.textContent?.trim() === 'Từ') {
                                header.textContent = 'Từ vựng';
                              }
                            });
                          }
                        }}
                      />
                    )}
                  </>
                );
              })()}


            </div>
          ) : (
            <div className="dict-html" dangerouslySetInnerHTML={{ __html: htmlSections[activeIdx - 2].html }} />
          )}
        </div>
        )
      )}

      <div className="mt-2 pt-2 border-t border-[#e5e5e5] flex items-center justify-between text-xs opacity-80 flex-shrink-0">
        <a
          className="underline hover:opacity-100 transition-opacity"
          href={`/dict?q=${encodeURIComponent(query)}`}
        >
          Mở trên J4YDict
        </a>
        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded text-sm border border-[#e5e5e5] bg-white text-black hover:bg-[#f7f7f7] transition-colors flex-shrink-0"
        >
          Đóng
        </button>
      </div>
      </div>
    </>
  );
}

