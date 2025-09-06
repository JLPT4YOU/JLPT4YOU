/**
 * Shared types for exercise prompt generation
 */

export interface ExercisePromptParams {
  level: string;
  type: string;
  count: number;
  difficulty?: string;
  materials: any[];
  tags?: string[];
  explanationLanguage?: string;
}

export interface SpecializedPromptParams {
  level: string;
  count: number;
  difficulty: string;
  materials: any[];
  explainLanguage: string;
  tags?: string[];
}

export type QuestionType = 'vocabulary' | 'grammar' | 'reading' | 'kanji';

export interface QuestionTypeConfig {
  allowedTypes: string[];
  schema: Record<string, any>;
}
