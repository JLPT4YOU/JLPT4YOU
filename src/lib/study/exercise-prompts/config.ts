/**
 * Configuration for exercise prompt generation
 */

import type { QuestionType } from './types';

export const QUESTION_TYPE_CONFIG: Record<QuestionType, string[]> = {
  vocabulary: [
    'vocabulary_meaning',
    'vocabulary_usage', 
    'vocabulary_reading',
    'word_formation',
    'paraphrase'
  ],
  grammar: [
    'grammar_form',
    'grammar_composition',
    'text_grammar', 
    'particle',
    'conjugation',
    'pattern',
    'error_detection'
  ],
  kanji: [
    'kanji_reading',
    'kanji_meaning',
    'kanji_compound',
    'kanji_structure'
  ],
  reading: [
    'reading_comprehension',
    'text_analysis',
    'inference',
    'main_idea'
  ]
};

export const DEFAULT_DIFFICULTY = 'medium';
export const MAX_MATERIALS = 20;
