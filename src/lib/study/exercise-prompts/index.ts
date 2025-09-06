/**
 * Exercise Prompt Generator - Main Entry Point
 * Refactored from 928 lines to modular structure
 */

import type { ExercisePromptParams, QuestionType } from './types';
import { DEFAULT_DIFFICULTY } from './config';
import { validateExerciseResponse } from './utils';
import { generateBasePrompt, generateSpecificPrompt } from './generators/base';
import { generateVocabularyPrompt } from './generators/vocabulary';
import { generateGrammarPrompt } from './generators/grammar';
import { generateReadingPrompt } from './generators/reading';

// Re-export types for external use
export type { ExercisePromptParams, QuestionType };
export { validateExerciseResponse };

/**
 * Main exercise prompt generation function
 */
export function generateExercisePrompt(params: ExercisePromptParams): string {
  const { 
    level, 
    type, 
    count, 
    difficulty = DEFAULT_DIFFICULTY, 
    materials, 
    tags, 
    explanationLanguage 
  } = params;

  const explainLanguage = explanationLanguage || 'auto';
  console.log('[Exercise Prompt] Explanation language from server:', explainLanguage);

  const specializedParams = {
    level,
    count,
    difficulty,
    materials,
    explainLanguage,
    tags
  };

  // Route to specialized generators
  switch (type) {
    case 'reading':
      return generateReadingPrompt(specializedParams);
    case 'vocabulary':
      return generateVocabularyPrompt(specializedParams);
    case 'grammar':
      return generateGrammarPrompt(specializedParams);
    default:
      // Fallback to base generator for other types
      return generateBasePrompt(params);
  }
}

/**
 * Generate prompt for specific question types
 */
export function generateSpecificQuestionPrompt(
  level: string,
  questionType: QuestionType,
  subType: string,
  count: number,
  difficulty: string = DEFAULT_DIFFICULTY,
  explainLanguage: string = 'auto'
): string {
  return generateSpecificPrompt(level, questionType, subType, count, difficulty, explainLanguage);
}

// Legacy exports for backward compatibility
export { generateBasePrompt as generateGenericPrompt };
export { DEFAULT_DIFFICULTY as defaultDifficulty };
