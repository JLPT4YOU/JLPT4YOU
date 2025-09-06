/**
 * Component for kanji animation controls
 */

import React from 'react';
import type { PopupStyle } from '../types';

interface KanjiAnimationControlsProps {
  style: PopupStyle;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onClear: () => void;
  onPreviousStroke: () => void;
  onNextStroke: () => void;
}

export function KanjiAnimationControls({
  style,
  isPlaying,
  onPlay,
  onPause,
  onClear,
  onPreviousStroke,
  onNextStroke,
}: KanjiAnimationControlsProps) {
  const togglePlayPause = () => {
    if (isPlaying) {
      onPause();
    } else {
      onPlay();
    }
  };

  return (
    <div className={`absolute top-1 right-1 z-10 flex flex-col ${style.width < 600 ? 'gap-0.5' : 'gap-1'}`}>
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
          onClick={onPreviousStroke}
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
          onClick={togglePlayPause}
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
          onClick={onClear}
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
          onClick={onNextStroke}
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
  );
}
