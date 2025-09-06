/**
 * Modular dictionary popup component
 * Refactored from 763-line monolithic component
 */

import React, { useRef, useEffect, useState } from 'react';
import { ModalOverlay } from '../../overlay';
import { PopupTabs } from './popup-tabs';
import { J4YContent } from './j4y-content';
import { TranslateContent } from './translate-content';
import { TraCauContent } from './tracau-content';
import { useWindowSize } from '../hooks/use-window-size';
import { useJ4YData } from '../hooks/use-j4y-data';
import { useTranslateData } from '../hooks/use-translate-data';
import { useTraCauData } from '../hooks/use-tracau-data';
import { useKanjiAnimation } from '../hooks/use-kanji-animation';
import { useIndividualKanji } from '../hooks/use-individual-kanji';
import type { DictionaryPopupProps } from '../types';
import '../../styles.css';

export function DictionaryPopupInner({ query, onClose }: DictionaryPopupProps) {
  const [activeIdx, setActiveIdx] = useState(0); // tab index - J4YDict will be index 0
  const [kanjiIdx, setKanjiIdx] = useState(0); // selected kanji within Kanji tab
  const ref = useRef<HTMLDivElement>(null);

  // Data fetching hooks
  const { windowSize, style } = useWindowSize();
  const j4yData = useJ4YData(query);
  const translateData = useTranslateData(query);
  const traCauData = useTraCauData(query);
  const individualKanji = useIndividualKanji({ 
    kanjiIdx, 
    svgs: traCauData.svgs, 
    query 
  });

  // Kanji animation hook
  const kanjiAnimation = useKanjiAnimation({
    activeIdx,
    htmlSections: traCauData.htmlSections,
    svgs: traCauData.svgs,
    kanjiIdx,
    containerRef: ref as React.RefObject<HTMLDivElement>,
  });

  // Close on ESC & click outside
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

  // Get current loading and error states based on active tab
  const getCurrentLoadingState = () => {
    if (activeIdx === 0) return j4yData.loading;
    if (activeIdx === 1) return translateData.loading;
    return traCauData.loading;
  };

  const getCurrentErrorState = () => {
    if (activeIdx === 0) return j4yData.error;
    if (activeIdx === 1) return translateData.error;
    return traCauData.error;
  };

  const renderContent = () => {
    if (activeIdx === 0) {
      // J4YDict content
      return !j4yData.loading && !j4yData.error && (
        <div
          className="overflow-auto pr-2 flex-1 min-h-0"
          style={{
            maxHeight: `${style.height - 140}px`
          }}
        >
          <J4YContent 
            data={j4yData.data} 
            loading={j4yData.loading} 
            error={j4yData.error} 
          />
        </div>
      );
    } else if (activeIdx === 1) {
      // Google Translate content
      return !translateData.loading && !translateData.error && translateData.data && (
        <div
          className="overflow-auto pr-2 flex-1 min-h-0 space-y-3"
          style={{
            maxHeight: `${style.height - 140}px`
          }}
        >
          <TranslateContent 
            data={translateData.data} 
            loading={translateData.loading} 
            error={translateData.error} 
          />
        </div>
      );
    } else {
      // TraCau content
      return !traCauData.loading && !traCauData.error && traCauData.htmlSections[activeIdx - 2] && (
        <div
          className="overflow-auto pr-2 flex-1 min-h-0"
          style={{
            maxHeight: `${style.height - 140}px`
          }}
        >
          <TraCauContent
            htmlSections={traCauData.htmlSections}
            svgs={traCauData.svgs}
            kanjiContents={traCauData.kanjiContents}
            activeIdx={activeIdx}
            loading={traCauData.loading}
            error={traCauData.error}
            style={style}
            windowSize={windowSize}
            kanjiIdx={kanjiIdx}
            setKanjiIdx={setKanjiIdx}
            individualKanjiData={individualKanji.data}
            loadingIndividual={individualKanji.loading}
            query={query}
            isPlaying={kanjiAnimation.isPlaying}
            onPlay={kanjiAnimation.play}
            onPause={kanjiAnimation.pause}
            onClear={kanjiAnimation.clear}
            onPreviousStroke={kanjiAnimation.previousStroke}
            onNextStroke={kanjiAnimation.nextStroke}
          />
        </div>
      );
    }
  };

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
        <PopupTabs 
          activeIdx={activeIdx} 
          setActiveIdx={setActiveIdx} 
          htmlSections={traCauData.htmlSections} 
        />

        {/* Show loading state */}
        {getCurrentLoadingState() && (
          <div className="text-base opacity-80">
            {activeIdx === 0 ? 'Đang tải J4YDict...' : activeIdx === 1 ? 'Đang dịch...' : 'Đang tải…'}
          </div>
        )}

        {/* Show error state */}
        {getCurrentErrorState() && (
          <div className="text-base text-red-400">
            {getCurrentErrorState()}
          </div>
        )}

        {/* Show content */}
        {renderContent()}

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
