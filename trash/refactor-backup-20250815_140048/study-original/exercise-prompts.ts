/**
 * Exercise Prompt Generator for JLPT Study
 * Generates structured prompts for Gemini AI to create exercises
 */

import { getAICommunicationLanguage } from '../prompt-storage';

interface ExercisePromptParams {
  level: string;
  type: string;
  count: number;
  difficulty?: string;
  materials: any[];
  tags?: string[];
  explanationLanguage?: string; // Optional override for explanation language
}

export function generateExercisePrompt(params: ExercisePromptParams): string {
  const { level, type, count, difficulty = 'medium', materials, tags, explanationLanguage } = params;

  // Get explanation language from settings or use override
  const explainLanguage = explanationLanguage || getAICommunicationLanguage();

  // Map language to instruction text
  const getLanguageInstruction = (lang: string): string => {
    if (lang.includes('English') || lang.toLowerCase().includes('english')) {
      return 'explanations in English';
    } else if (lang.includes('日本語') || lang.toLowerCase().includes('japanese')) {
      return 'explanations in Japanese (日本語)';
    } else if (lang.includes('Tiếng Việt') || lang.toLowerCase().includes('vietnamese')) {
      return 'explanations in Vietnamese (Tiếng Việt)';
    } else {
      // For custom languages, use the language name directly
      return `explanations in ${lang}`;
    }
  };

  const languageInstruction = getLanguageInstruction(explainLanguage);

  // Format materials for the prompt
  const materialsText = materials.slice(0, 20).map(m => {
    if (type === 'vocabulary') {
      return `- ${m.content.word} (${m.content.reading}): ${m.content.meaning}`;
    } else if (type === 'grammar') {
      return `- ${m.content.pattern}: ${m.content.meaning}`;
    } else if (type === 'reading') {
      // For reading, we have mixed vocabulary and grammar materials
      if (m.type === 'vocabulary') {
        return `- Vocabulary: ${m.content.word} (${m.content.reading}): ${m.content.meaning}`;
      } else if (m.type === 'grammar') {
        return `- Grammar: ${m.content.pattern}: ${m.content.meaning}`;
      }
    }
    return JSON.stringify(m.content);
  }).join('\n');

  // Special handling for Reading Comprehension
  if (type === 'reading') {
    return generateReadingPrompt({ level, count, difficulty, materials, explainLanguage, tags });
  }

  const prompt = `
You are an expert JLPT (Japanese Language Proficiency Test) exercise generator and Japanese language teacher.
Create ${count} high-quality ${type} questions for JLPT ${level.toUpperCase()} level.

REQUIREMENTS:
1. Questions must be appropriate for ${level.toUpperCase()} level
2. Difficulty: ${difficulty}
3. Type: ${type}
4. Language: Questions in Japanese, ${languageInstruction}
5. Format: JSON array of question objects

MATERIALS TO USE:
${materialsText}

${tags && tags.length > 0 ? `FOCUS AREAS: ${tags.join(', ')}` : ''}

OUTPUT FORMAT:
Return ONLY a JSON array with this exact structure:
[
  {
    "id": "q1",
    "type": "multiple_choice",
    "question": "Question text in Japanese (use ＿＿ for blanks)",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "explanation": {
      "correct_answer": "Detailed explanation of why the correct answer is right",
      "translation": "Complete sentence (question + correct answer) translated to ${explainLanguage}",
      "why_correct": "Deep explanation of grammar/vocabulary rules",
      "wrong_answers": {
        "option_0": "Why this option is wrong (if not correct)",
        "option_1": "Why this option is wrong (if not correct)",
        "option_2": "Why this option is wrong (if not correct)",
        "option_3": "Why this option is wrong (if not correct)"
      },
      "additional_notes": "Extra learning tips, similar patterns, or common mistakes to avoid",
      "example_usage": "Additional example sentences showing correct usage"
    },
    "difficulty": "${difficulty}",
    "question_type": "vocabulary_meaning|vocabulary_usage|grammar_form|grammar_composition|reading_comprehension|etc"
  }
]

QUESTION TYPES BY CATEGORY (Based on Official JLPT Structure):

For VOCABULARY (語彙):
- Word meaning in context (文脈規定): Choose the word that best fits the context
- Paraphrase (言い換え類義): Choose the word/phrase with similar meaning
- Usage (用法): Choose the correct usage of a word in different contexts
- Word formation (語形成): Choose the correct form of compound words or derivatives

For GRAMMAR (文法):
- Grammar form (文法形式の判断): Choose the correct grammatical form
- Sentence composition (文の組み立て): Arrange sentence parts in correct order
- Text grammar (文章の文法): Choose appropriate connectives and expressions for coherent text

For READING (読解):
- Short passages (短文): Understanding main points of short texts
- Medium passages (中文): Detailed comprehension of medium-length texts
- Long passages (長文): Complex analysis of longer texts with multiple questions
- Information retrieval (情報検索): Finding specific information from practical texts

SPECIFIC QUESTION FORMATS:
- Multiple choice (4 options: 1, 2, 3, 4)
- Fill-in-the-blank with word bank
- Sentence ordering/reconstruction
- True/False with explanation
- Matching exercises

LEVEL-SPECIFIC REQUIREMENTS:

N5 Level:
- Use basic vocabulary (800-1000 words) and simple grammar patterns
- Focus on everyday situations: family, food, shopping, time, weather
- Simple sentence structures with basic particles (は、を、に、で、と)
- Present/past tense, basic adjectives, numbers, counters

N4 Level:
- Intermediate vocabulary (1500-2000 words) and grammar patterns
- Situations: work, school, hobbies, travel, health
- Complex sentences with て-form, conditional forms, potential forms
- Keigo basics, more complex particles and expressions

N3 Level:
- Advanced vocabulary (3000-4000 words) and complex grammar
- Abstract topics: opinions, explanations, social issues
- Advanced grammar: causative, passive, honorific/humble forms
- Reading comprehension with longer texts and nuanced meanings

N2 Level:
- Extensive vocabulary (6000+ words) and sophisticated grammar
- Professional and academic contexts, news, literature
- Complex sentence structures, advanced keigo, formal expressions
- Critical thinking and inference questions

N1 Level:
- Native-level vocabulary (10000+ words) and advanced grammar
- Academic papers, business documents, literary works
- Subtle nuances, cultural references, specialized terminology
- Complex reasoning and analytical comprehension

DIFFICULTY LEVELS:
- easy: Basic level appropriate for beginners
- medium: Standard level for intermediate learners
- hard: Advanced level requiring deep understanding
- extremely_hard: Extremely advanced content including:
  * Archaic or classical Japanese expressions (古文・漢文)
  * Highly specialized technical terminology from specific fields
  * Subtle nuances in formal/literary language
  * Complex kanji compounds with multiple possible readings
  * Regional dialects or historical language variations
  * Advanced linguistic concepts that require academic knowledge
  * Ambiguous contexts requiring careful reasoning

EXPLANATION REQUIREMENTS (in ${explainLanguage}):
1. **Correct Answer**: Explain WHY the correct answer is right with specific grammar/vocabulary rules
2. **Wrong Answers**: For each incorrect option, explain WHY it's wrong and what makes it inappropriate
3. **Additional Notes**: Provide learning tips, similar patterns, common mistakes, or cultural context
4. **Example Usage**: Give 1-2 additional example sentences showing correct usage in different contexts
5. **Translation**: Combine the question with the correct answer to form a complete sentence, then translate this complete sentence into ${explainLanguage}. This helps users understand the full meaning and context.

QUESTION QUALITY STANDARDS:
- Make questions progressively challenging within the set
- Include variety in question formats and topics
- Ensure clear, unambiguous questions with realistic contexts
- Use natural Japanese expressions that natives would actually use
- Test practical usage and understanding, not just memorization
- Create plausible wrong answers that test common mistakes
- Ensure all options are grammatically possible but only one is contextually correct
- Do not reuse the exact same set of 4 options across different questions in this set
- Each question must have at least 2 options that are different from every previous question in the set


EXPLANATION LANGUAGE: All explanations must be in ${explainLanguage}. Be thorough and educational.

Generate exactly ${count} questions. Return ONLY the JSON array, no other text.`;

  return prompt;
}

/**
 * Generate prompt for specific question types
 */
export function generateSpecificPrompt(
  level: string,
  questionType: 'vocabulary' | 'grammar' | 'reading' | 'kanji',
  subType: string,
  materials: any[],
  explanationLanguage?: string
): string {
  const prompts: Record<string, Record<string, string>> = {
    vocabulary: {
      meaning: `Create vocabulary questions testing word meanings for JLPT ${level}`,
      reading: `Create vocabulary questions testing hiragana readings for JLPT ${level}`,
      usage: `Create vocabulary questions testing word usage in context for JLPT ${level}`,
      synonym: `Create vocabulary questions testing synonyms/antonyms for JLPT ${level}`
    },
    grammar: {
      particle: `Create grammar questions testing particle usage for JLPT ${level}`,
      conjugation: `Create grammar questions testing verb/adjective conjugation for JLPT ${level}`,
      pattern: `Create grammar questions testing sentence patterns for JLPT ${level}`,
      error: `Create grammar questions identifying errors for JLPT ${level}`
    },
    reading: {
      comprehension: `Create reading comprehension questions for JLPT ${level}`,
      main_idea: `Create questions about main ideas in passages for JLPT ${level}`,
      detail: `Create detail-oriented reading questions for JLPT ${level}`,
      inference: `Create inference-based reading questions for JLPT ${level}`
    },
    kanji: {
      reading: `Create kanji reading (pronunciation) questions for JLPT ${level}`,
      meaning: `Create kanji meaning questions for JLPT ${level}`,
      writing: `Create questions about kanji stroke order/radicals for JLPT ${level}`,
      compound: `Create questions about kanji compounds for JLPT ${level}`
    }
  };

  const basePrompt = prompts[questionType]?.[subType] || prompts.vocabulary.meaning;

  // Get explanation language from settings or use override
  const explainLanguage = explanationLanguage || getAICommunicationLanguage();

  return `${basePrompt}

Materials: ${JSON.stringify(materials.slice(0, 10))}

Return a JSON array of question objects with this structure:
[
  {
    "id": "string",
    "type": "multiple_choice",
    "question": "string",
    "options": ["string", "string", "string", "string"],
    "correct": number (0-3),
    "explanation": "string (${explainLanguage})",
    "difficulty": "easy|medium|hard|extremely_hard"
  }
]`;
}

/**
 * Validate exercise prompt response
 */
export function validateExerciseResponse(response: string): any[] | null {
  try {
    // Try to extract JSON array from response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate structure
    if (!Array.isArray(parsed)) return null;

    // Validate each question
    const valid = parsed.every(q =>
      q.question &&
      Array.isArray(q.options) &&
      q.options.length >= 2 &&
      typeof q.correct === 'number' &&
      q.correct >= 0 &&
      q.correct < q.options.length
    );

    return valid ? parsed : null;
  } catch (error) {
    console.error('Failed to validate exercise response:', error);
    return null;
  }
}

/**
 * Generate specialized prompt for Reading Comprehension
 */
function generateReadingPrompt({
  level,
  count,
  difficulty,
  materials,
  explainLanguage,
  tags
}: {
  level: string;
  count: number;
  difficulty?: string;
  materials: any[];
  explainLanguage: string;
  tags?: string[];
}): string {
  // Separate vocabulary and grammar materials
  const vocabMaterials = materials.filter(m => m.type === 'vocabulary').slice(0, 15);
  const grammarMaterials = materials.filter(m => m.type === 'grammar').slice(0, 10);

  const vocabText = vocabMaterials.map(m =>
    `- ${m.content.word} (${m.content.reading}): ${m.content.meaning}`
  ).join('\n');

  const grammarText = grammarMaterials.map(m =>
    `- ${m.content.pattern}: ${m.content.meaning}`
  ).join('\n');

  // Parse difficulty and passage length (format: "difficulty_passageLength")
  const [baseDifficulty, passageLength] = (difficulty || 'medium_medium').split('_');

  // Determine passage length based on level and length setting
  const getPassageLength = (level: string, lengthSetting: string) => {
    const levelNum = parseInt(level.replace('n', ''));

    if (lengthSetting === 'short') {
      if (levelNum >= 4) return '50-100 words'; // N5, N4
      if (levelNum === 3) return '100-150 words'; // N3
      if (levelNum === 2) return '150-250 words'; // N2
      return '200-350 words'; // N1
    } else if (lengthSetting === 'long') {
      if (levelNum >= 4) return '150-250 words'; // N5, N4
      if (levelNum === 3) return '300-500 words'; // N3
      if (levelNum === 2) return '500-700 words'; // N2
      return '700-1000 words'; // N1
    } else { // medium
      if (levelNum >= 4) return '100-200 words'; // N5, N4
      if (levelNum === 3) return '200-400 words'; // N3
      if (levelNum === 2) return '350-600 words'; // N2
      return '500-800 words'; // N1
    }
  };

  const finalPassageLength = getPassageLength(level, passageLength || 'medium');

  return `
You are an expert JLPT Reading Comprehension exercise generator and Japanese language teacher.
Create ${count} reading comprehension exercises for JLPT ${level.toUpperCase()} level.

IMPORTANT REQUIREMENTS:
1. Each exercise = 1 reading passage + exactly 3 multiple choice questions
2. Maximum ${count} reading passages total (user requested max 5)
3. Passage length: ${passageLength}
4. Questions in Japanese, explanations in ${explainLanguage}
5. Use provided vocabulary and grammar materials naturally in the passages

VOCABULARY TO INCORPORATE:
${vocabText}

GRAMMAR PATTERNS TO USE:
${grammarText}

${tags && tags.length > 0 ? `FOCUS AREAS: ${tags.join(', ')}` : ''}

PASSAGE REQUIREMENTS:
- Natural, coherent Japanese text appropriate for ${level.toUpperCase()} level
- Length: ${finalPassageLength}
- Difficulty: ${baseDifficulty || 'medium'}
- Incorporate 3-5 vocabulary words from the provided list
- Use 2-3 grammar patterns from the provided list
- Topics suitable for JLPT: daily life, work, school, travel, culture, etc.
- Progressive difficulty within the set

QUESTION TYPES (3 questions per passage):
1. Main idea / Overall comprehension
2. Specific detail / Information retrieval
3. Inference / Author's intention / Contextual meaning

OUTPUT FORMAT:
Return ONLY a JSON array with this exact structure (each passage creates 3 separate question objects):
[
  {
    "id": "passage1_q1",
    "type": "reading_comprehension",
    "passage": "Japanese reading passage text here...",
    "question": "Question 1 in Japanese",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "explanation": {
      "correct_answer": "Why this answer is correct",
      "translation": "Question + correct answer translated to ${explainLanguage}",
      "why_correct": "Detailed explanation referencing the passage",
      "wrong_answers": {
        "option_0": "Why this option is wrong (if not correct)",
        "option_1": "Why this option is wrong (if not correct)",
        "option_2": "Why this option is wrong (if not correct)",
        "option_3": "Why this option is wrong (if not correct)"
      },
      "passage_reference": "Quote the relevant part of the passage that supports the answer"
    },
    "difficulty": "${difficulty || 'medium'}",
    "vocabulary_used": ["word1", "word2", "word3"],
    "grammar_used": ["pattern1", "pattern2"]
  },
  {
    "id": "passage1_q2",
    "type": "reading_comprehension",
    "passage": "Japanese reading passage text here...", // Same passage
    "question": "Question 2 in Japanese",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 1,
    "explanation": { /* same structure as above */ },
    "difficulty": "${difficulty || 'medium'}",
    "vocabulary_used": ["word1", "word2", "word3"],
    "grammar_used": ["pattern1", "pattern2"]
  },
  {
    "id": "passage1_q3",
    "type": "reading_comprehension",
    "passage": "Japanese reading passage text here...", // Same passage
    "question": "Question 3 in Japanese",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 2,
    "explanation": { /* same structure as above */ },
    "difficulty": "${difficulty || 'medium'}",
    "vocabulary_used": ["word1", "word2", "word3"],
    "grammar_used": ["pattern1", "pattern2"]
  }
]

IMPORTANT: For ${count} passages, you must create exactly ${count * 3} question objects total (3 questions per passage).
Each set of 3 questions should share the same passage text but have different questions and answers.

LEVEL-SPECIFIC GUIDELINES:

N5: Simple daily situations, present/past tense, basic vocabulary
N4: Personal experiences, opinions, て-form, potential form
N3: Abstract topics, complex sentences, various grammar forms
N2: News, opinions, business contexts, advanced grammar
N1: Academic, literary, specialized topics, nuanced expressions

Generate exactly ${count} reading passages with 3 questions each (total: ${count * 3} question objects). Each passage should be engaging and educational.
`;
}
