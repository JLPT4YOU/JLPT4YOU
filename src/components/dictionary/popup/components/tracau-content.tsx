/**
 * Component for rendering TraCau content with kanji animation
 */

import React from 'react';
import { sanitizeHtml } from '../../sanitizer';
import { KanjiAnimationControls } from './kanji-animation-controls';
import type { PopupStyle, WindowSize } from '../types';

interface TraCauContentProps {
  htmlSections: { key: string; label: string; html: string }[];
  svgs: { char?: string; svg: string }[];
  kanjiContents: { char: string; html: string }[];
  activeIdx: number;
  loading: boolean;
  error: string | null;
  style: PopupStyle;
  windowSize: WindowSize;
  kanjiIdx: number;
  setKanjiIdx: (idx: number) => void;
  individualKanjiData: Record<string, string>;
  loadingIndividual: boolean;
  query: string;
  // Animation controls
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onClear: () => void;
  onPreviousStroke: () => void;
  onNextStroke: () => void;
}

export function TraCauContent({
  htmlSections,
  svgs,
  kanjiContents,
  activeIdx,
  loading,
  error,
  style,
  windowSize,
  kanjiIdx,
  setKanjiIdx,
  individualKanjiData,
  loadingIndividual,
  query,
  isPlaying,
  onPlay,
  onPause,
  onClear,
  onPreviousStroke,
  onNextStroke,
}: TraCauContentProps) {
  if (loading) {
    return <div className="text-base opacity-80">Đang tải…</div>;
  }

  if (error) {
    return <div className="text-base text-red-400">{error}</div>;
  }

  if (!htmlSections[activeIdx - 2]) {
    return <div className="text-center py-4">Không có dữ liệu</div>;
  }

  const isKanjiSection = htmlSections[activeIdx - 2].label.toLowerCase().includes('kanji');

  if (isKanjiSection) {
    return (
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
        <KanjiAnimationControls
          style={style}
          isPlaying={isPlaying}
          onPlay={onPlay}
          onPause={onPause}
          onClear={onClear}
          onPreviousStroke={onPreviousStroke}
          onNextStroke={onNextStroke}
        />

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
    );
  } else {
    return (
      <div className="dict-html" dangerouslySetInnerHTML={{ __html: htmlSections[activeIdx - 2].html }} />
    );
  }
}
