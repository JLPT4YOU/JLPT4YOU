/**
 * Base exercise prompt generator with common patterns
 */

import type { ExercisePromptParams, QuestionType } from '../types';
import { QUESTION_TYPE_CONFIG, DEFAULT_DIFFICULTY } from '../config';
import { formatMaterials, getLanguageInstruction } from '../utils';

export function generateBasePrompt(params: ExercisePromptParams): string {
  const { level, type, count, difficulty = DEFAULT_DIFFICULTY, materials, tags, explanationLanguage } = params;
  
  const explainLanguage = explanationLanguage || 'auto';
  const languageInstruction = getLanguageInstruction(explainLanguage);
  const materialsText = formatMaterials(materials, type);
  
  // Get allowed question types for this category
  const allowedQuestionTypes = QUESTION_TYPE_CONFIG[type as QuestionType] || [
    'vocabulary_meaning',
    'vocabulary_usage',
    'grammar_form', 
    'grammar_composition'
  ];

  return `
You are an expert JLPT (Japanese Language Proficiency Test) exercise generator and Japanese language teacher.
Create ${count} high-quality ${type} questions for JLPT ${level.toUpperCase()} level.

REQUIREMENTS:
1. Questions must be appropriate for ${level.toUpperCase()} level
2. Difficulty: ${difficulty}
3. Type: ${type}
4. Allowed question_type values: ${allowedQuestionTypes.join(', ')}
5. Language: Questions in Japanese, ${languageInstruction}
6. Format: JSON array of question objects

MATERIALS TO USE:
${materialsText}

${tags && tags.length > 0 ? `FOCUS AREAS: ${tags.join(', ')}` : ''}

OUTPUT FORMAT (STRICT):
- Return ONLY a JSON array. No prose, no markdown code fences, no comments, no trailing commas.
- Exactly ${count} items in the array.
- Each item MUST strictly match this schema:
[
  {
    "id": "q1",
    "type": "multiple_choice",
    "question": "Japanese text (use ＿＿ for blanks)",
    "options": ["A", "B", "C", "D"],
    "correct": 0,
    "explanation": {
      "correct_answer": "Why the correct option is right",
      "translation": "(Question + correct option) translated to ${explainLanguage}",
      "why_correct": "Rule-based explanation referencing grammar/vocabulary",
      "wrong_answers": {
        "option_0": "Why this option is wrong (if not correct)",
        "option_1": "Why this option is wrong (if not correct)", 
        "option_2": "Why this option is wrong (if not correct)",
        "option_3": "Why this option is wrong (if not correct)"
      },
      "additional_notes": "Tips, similar patterns, or common pitfalls",
      "example_usage": "1-2 example sentences showing correct usage"
    },
    "difficulty": "${difficulty}",
    "question_type": "one of: ${allowedQuestionTypes.join(', ')}"
  }
]

STRICT JSON OUTPUT RULES:
- Ensure options are four unique strings and exactly one is contextually correct
- Randomize correct answer positions (0,1,2,3) evenly across all ${count} questions
- Avoid repeating the same correct index in consecutive questions when possible
- Do not reuse the exact same set of 4 options across different questions
`;
}

export function generateSpecificPrompt(
  level: string,
  questionType: QuestionType,
  subType: string,
  count: number,
  difficulty: string,
  explainLanguage: string
): string {
  const languageInstruction = getLanguageInstruction(explainLanguage);
  const allowedQuestionTypes = QUESTION_TYPE_CONFIG[questionType];
  
  return `
You are an expert JLPT ${questionType} specialist.
Create ${count} focused ${subType} questions for JLPT ${level.toUpperCase()}.

SPECIFIC FOCUS: ${subType}
DIFFICULTY: ${difficulty}
ALLOWED TYPES: ${allowedQuestionTypes.join(', ')}
LANGUAGE: ${languageInstruction}

Generate exactly ${count} questions following the standard JSON schema.
Focus specifically on ${subType} patterns and usage.
`;
}
