/**
 * Dictionary Popup - Refactored to use modular architecture
 * Reduced from 763 lines to clean import structure
 */

import React from 'react';
import { DictionaryPopupInner } from './popup/components/dictionary-popup-inner';
import type { DictionaryPopupProps } from './popup/types';

export type { DictionaryPopupProps };

export function DictionaryPopup({ query, anchorRect, onClose }: DictionaryPopupProps) {
  return <DictionaryPopupInner query={query} anchorRect={anchorRect} onClose={onClose} />;
}
