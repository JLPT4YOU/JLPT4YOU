/**
 * Reading comprehension exercise prompt generator
 */

import type { SpecializedPromptParams } from '../types';
import { QUESTION_TYPE_CONFIG } from '../config';
import { formatMaterials, getLanguageInstruction } from '../utils';

export function generateReadingPrompt({
  level,
  count,
  difficulty,
  materials,
  explainLanguage,
  tags
}: SpecializedPromptParams): string {
  const materialsText = formatMaterials(materials, 'reading');
  const languageInstruction = getLanguageInstruction(explainLanguage);
  const allowedQuestionTypes = QUESTION_TYPE_CONFIG.reading;

  return `
You are an expert JLPT reading comprehension exercise generator.
Create ${count} reading comprehension questions for JLPT ${level.toUpperCase()} level.

REQUIREMENTS:
1. Level: ${level.toUpperCase()}
2. Difficulty: ${difficulty}
3. Type: Reading Comprehension
4. Allowed question_type values: ${allowedQuestionTypes.join(', ')}
5. Language: Passages in Japanese, ${languageInstruction}

VOCABULARY AND GRAMMAR TO INCORPORATE:
${materialsText}

${tags && tags.length > 0 ? `FOCUS AREAS: ${tags.join(', ')}` : ''}

TASK:
1. Create 1-2 short Japanese reading passages (150-300 characters each for ${level.toUpperCase()})
2. Generate ${count} comprehension questions about the passages
3. Incorporate the provided vocabulary and grammar naturally

OUTPUT FORMAT (STRICT JSON):
[
  {
    "id": "q1",
    "type": "multiple_choice",
    "passage": "Japanese reading passage text",
    "question": "Question about the passage content",
    "options": ["A", "B", "C", "D"],
    "correct": 0,
    "explanation": {
      "correct_answer": "Why this answer is correct",
      "translation": "Passage + question + correct option translated to ${explainLanguage}",
      "why_correct": "Reading comprehension explanation",
      "wrong_answers": {
        "option_0": "Why wrong",
        "option_1": "Why wrong",
        "option_2": "Why wrong",
        "option_3": "Why wrong"
      },
      "additional_notes": "Reading strategies and tips",
      "key_vocabulary": "Important words from the passage"
    },
    "difficulty": "${difficulty}",
    "question_type": "one of: ${allowedQuestionTypes.join(', ')}"
  }
]

READING-SPECIFIC RULES:
- Passages should be authentic and natural Japanese
- Questions test comprehension, inference, and main ideas
- Include both explicit and implicit information questions
- Ensure cultural appropriateness for ${level.toUpperCase()} level
- Randomize correct answer positions evenly across ${count} questions
`;
}
