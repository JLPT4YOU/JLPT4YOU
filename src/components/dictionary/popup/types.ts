/**
 * Shared types for dictionary popup components
 */

import type { WordDetail } from '@/lib/dict/dict-service';
import type { TranslationResult } from '@/lib/translate/enhanced-translate-service';

export interface DictionaryPopupProps {
  query: string;
  anchorRect?: DOMRect;
  onClose: () => void;
}

export interface PopupStyle {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

export interface J4YDataState {
  data: WordDetail | null;
  loading: boolean;
  error: string | null;
}

export interface TranslateDataState {
  data: TranslationResult | null;
  loading: boolean;
  error: string | null;
}

export interface TraCauDataState {
  htmlSections: { key: string; label: string; html: string }[];
  svgs: { char?: string; svg: string }[];
  kanjiContents: { char: string; html: string }[];
  loading: boolean;
  error: string | null;
}

export interface KanjiAnimationState {
  isPlaying: boolean;
  currentStroke: number;
  kanjiIdx: number;
}

export interface IndividualKanjiState {
  data: Record<string, string>;
  loading: boolean;
}
