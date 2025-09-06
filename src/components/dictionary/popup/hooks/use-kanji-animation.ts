/**
 * Hook for managing kanji animation state and controls
 */

import { useState, useEffect, useRef } from 'react';
import { createKanjiAnimator, Animator } from '../../kanjiAnimator';
import type { KanjiAnimationState } from '../types';

interface UseKanjiAnimationProps {
  activeIdx: number;
  htmlSections: { key: string; label: string; html: string }[];
  svgs: { char?: string; svg: string }[];
  kanjiIdx: number;
  containerRef: React.RefObject<HTMLDivElement>;
}

export function useKanjiAnimation({
  activeIdx,
  htmlSections,
  svgs,
  kanjiIdx,
  containerRef
}: UseKanjiAnimationProps): KanjiAnimationState & {
  animRef: React.MutableRefObject<{ el: HTMLDivElement | null; api: Animator | null }>;
  play: () => void;
  pause: () => void;
  clear: () => void;
  previousStroke: () => void;
  nextStroke: () => void;
} {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStroke, setCurrentStroke] = useState(0);
  const animRef = useRef<{ el: HTMLDivElement | null; api: Animator | null }>({ el: null, api: null });

  // Initialize kanji animator when conditions change
  useEffect(() => {
    // Only apply kanji animator for TraCau tabs (activeIdx > 1)
    const isKanji = activeIdx > 1 && htmlSections[activeIdx - 2]?.label?.toLowerCase().includes('kanji');
    if (!isKanji) return;

    // Reset previous animator
    animRef.current.api?.pause();
    animRef.current = { el: null, api: null };
    const slot = containerRef.current?.querySelector('[data-anim-slot]') as HTMLDivElement | null;
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
  }, [activeIdx, htmlSections, svgs, kanjiIdx, containerRef]);

  const play = () => {
    animRef.current.api?.play();
    setIsPlaying(true);
  };

  const pause = () => {
    animRef.current.api?.pause();
    setIsPlaying(false);
  };

  const clear = () => {
    animRef.current.api?.clear?.();
    setIsPlaying(false);
    setCurrentStroke(0);
  };

  const previousStroke = () => {
    animRef.current.api?.previousStroke?.();
    setCurrentStroke(Math.max(0, currentStroke - 1));
  };

  const nextStroke = () => {
    animRef.current.api?.nextStroke?.();
    setCurrentStroke(currentStroke + 1);
  };

  return {
    isPlaying,
    currentStroke,
    kanjiIdx,
    animRef,
    play,
    pause,
    clear,
    previousStroke,
    nextStroke,
  };
}
