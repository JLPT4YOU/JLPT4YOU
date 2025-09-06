/**
 * Vocabulary exercise prompt generator
 */

import type { SpecializedPromptParams } from '../types';
import { QUESTION_TYPE_CONFIG } from '../config';
import { formatMaterials, getLanguageInstruction } from '../utils';

export function generateVocabularyPrompt({
  level,
  count,
  difficulty,
  materials,
  explainLanguage,
  tags
}: SpecializedPromptParams): string {
  const materialsText = formatMaterials(materials, 'vocabulary');
  const languageInstruction = getLanguageInstruction(explainLanguage);
  const allowedQuestionTypes = QUESTION_TYPE_CONFIG.vocabulary;

  return `
You are an expert JLPT vocabulary exercise generator.
Create ${count} high-quality vocabulary questions for JLPT ${level.toUpperCase()} level.

REQUIREMENTS:
1. Level: ${level.toUpperCase()}
2. Difficulty: ${difficulty}
3. Type: Vocabulary
4. Allowed question_type values: ${allowedQuestionTypes.join(', ')}
5. Language: Questions in Japanese, ${languageInstruction}

MATERIALS TO USE:
${materialsText}

${tags && tags.length > 0 ? `FOCUS AREAS: ${tags.join(', ')}` : ''}

OUTPUT FORMAT (STRICT JSON):
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
      "why_correct": "Rule-based explanation",
      "wrong_answers": {
        "option_0": "Why wrong",
        "option_1": "Why wrong", 
        "option_2": "Why wrong",
        "option_3": "Why wrong"
      },
      "additional_notes": "Tips and common pitfalls",
      "example_usage": "1-2 example sentences"
    },
    "difficulty": "${difficulty}",
    "question_type": "one of: ${allowedQuestionTypes.join(', ')}"
  }
]

VOCABULARY-SPECIFIC RULES:
- Focus on word meaning, usage context, and reading accuracy
- Include kanji/hiragana variations where appropriate
- Test collocations and common expressions
- Ensure options are semantically distinct
- Randomize correct answer positions (0,1,2,3) evenly across ${count} questions
`;
}
