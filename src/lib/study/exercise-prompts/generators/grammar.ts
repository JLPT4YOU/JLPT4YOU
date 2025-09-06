/**
 * Grammar exercise prompt generator
 */

import type { SpecializedPromptParams } from '../types';
import { QUESTION_TYPE_CONFIG } from '../config';
import { formatMaterials, getLanguageInstruction } from '../utils';

export function generateGrammarPrompt({
  level,
  count,
  difficulty,
  materials,
  explainLanguage,
  tags
}: SpecializedPromptParams): string {
  const materialsText = formatMaterials(materials, 'grammar');
  const languageInstruction = getLanguageInstruction(explainLanguage);
  const allowedQuestionTypes = QUESTION_TYPE_CONFIG.grammar;

  return `
You are an expert JLPT grammar exercise generator.
Create ${count} high-quality grammar questions for JLPT ${level.toUpperCase()} level.

REQUIREMENTS:
1. Level: ${level.toUpperCase()}
2. Difficulty: ${difficulty}
3. Type: Grammar
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
      "why_correct": "Grammar rule explanation",
      "wrong_answers": {
        "option_0": "Why wrong",
        "option_1": "Why wrong",
        "option_2": "Why wrong", 
        "option_3": "Why wrong"
      },
      "additional_notes": "Grammar tips and patterns",
      "example_usage": "1-2 example sentences showing correct usage"
    },
    "difficulty": "${difficulty}",
    "question_type": "one of: ${allowedQuestionTypes.join(', ')}"
  }
]

GRAMMAR-SPECIFIC RULES:
- Focus on particle usage, verb forms, and sentence patterns
- Test conjugations and transformations accurately
- Include contextual usage scenarios
- Ensure grammatical correctness in all options
- Randomize correct answer positions evenly across ${count} questions
- Test understanding of nuanced grammar differences
`;
}
