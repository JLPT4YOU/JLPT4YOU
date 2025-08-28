/**
 * Exercise Prompt Generator for JLPT Study
 * Generates structured prompts for Gemini AI to create exercises
 */

import { getAICommunicationLanguage } from '../prompt-storage';
import { mapLanguageInstruction } from '../shared/language-utils';


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

  // Map language to instruction text (shared)
  const languageInstruction = mapLanguageInstruction(explainLanguage);

  // Format materials for the prompt with better structure
  const materialsText = materials.slice(0, 20).map((m, index) => {
    const prefix = `${index + 1}.`;
    if (type === 'vocabulary') {
      return `${prefix} ${m.content.word} (${m.content.reading}): ${m.content.meaning}`;
    } else if (type === 'grammar') {
      return `${prefix} ${m.content.pattern}: ${m.content.meaning}`;
    } else if (type === 'reading') {
      // For reading, we have mixed vocabulary and grammar materials
      if (m.type === 'vocabulary') {
        return `${prefix} [VOCAB] ${m.content.word} (${m.content.reading}): ${m.content.meaning}`;
      } else if (m.type === 'grammar') {
        return `${prefix} [GRAMMAR] ${m.content.pattern}: ${m.content.meaning}`;
      }
    }
    return `${prefix} ${JSON.stringify(m.content)}`;
  }).join('\n');

  // Special handling for Reading Comprehension
  if (type === 'reading') {
    return generateReadingPrompt({ level, count, difficulty, materials, explainLanguage, tags });
  }

  // Create optimized prompt with system instruction and few-shot examples
  const prompt = `SYSTEM INSTRUCTION:
You are an expert JLPT exercise generator with 15+ years of experience creating authentic Japanese language assessments. Your expertise includes deep understanding of Japanese linguistics, pedagogy, and the official JLPT testing framework.

TASK:
Generate exactly ${count} high-quality ${type} questions for JLPT ${level.toUpperCase()} level.

CONSTRAINTS:
- Level: ${level.toUpperCase()} (strictly adhere to vocabulary and grammar complexity)
- Difficulty: ${difficulty}
- Question Type: ${type}
- Question Language: Japanese
- Explanation Language: ${languageInstruction}
- Output Format: Valid JSON array only

MATERIALS TO INCORPORATE:
${materialsText}

${tags && tags.length > 0 ? `FOCUS AREAS: ${tags.join(', ')}` : ''}

FEW-SHOT EXAMPLES:

Example 1 (Vocabulary Question - Context Usage):
Input Materials: 1. 食べる (たべる): to eat
Expected Output:
[
  {
    "id": "q1",
    "type": "multiple_choice",
    "question": "昨日、友達と一緒に美味しい料理を＿＿＿。",
    "options": ["食べました", "飲みました", "見ました", "聞きました"],
    "correct": 0,
    "explanation": {
      "correct_answer": "食べました is correct because the sentence talks about delicious food (美味しい料理), which you eat, not drink, see, or hear.",
      "translation": "Yesterday, I ate delicious food together with my friend.",
      "why_correct": "食べる (to eat) is the appropriate verb for food consumption. The past polite form 食べました fits the context.",
      "wrong_answers": {
        "option_0": "This is the correct answer",
        "option_1": "飲みました (drank) - incorrect because you don't drink food",
        "option_2": "見ました (saw/watched) - incorrect, doesn't make sense with food",
        "option_3": "聞きました (heard/listened) - incorrect, unrelated to food consumption"
      },
      "additional_notes": "食べる is one of the most basic verbs. Remember: 食べる (food), 飲む (drinks)",
      "example_usage": "朝ご飯を食べます。(I eat breakfast.)"
    },
    "difficulty": "easy",
    "question_type": "vocabulary_usage"
  }
]

Example 2 (Vocabulary Question - Word Meaning):
Input Materials: 1. 忙しい (いそがしい): busy
Expected Output:
[
  {
    "id": "q1",
    "type": "multiple_choice",
    "question": "田中さんは毎日とても＿＿＿です。仕事がたくさんあります。",
    "options": ["忙しい", "楽しい", "美しい", "新しい"],
    "correct": 0,
    "explanation": {
      "correct_answer": "忙しい (busy) fits the context because the second sentence mentions having a lot of work.",
      "translation": "Tanaka-san is very busy every day. He has a lot of work.",
      "why_correct": "The context clue '仕事がたくさんあります' (has a lot of work) indicates being busy.",
      "wrong_answers": {
        "option_0": "This is the correct answer",
        "option_1": "楽しい (fun/enjoyable) - doesn't match the work context",
        "option_2": "美しい (beautiful) - inappropriate for describing a person's state",
        "option_3": "新しい (new) - doesn't fit the context of having lots of work"
      },
      "additional_notes": "Look for context clues in the surrounding sentences to determine meaning.",
      "example_usage": "今日は忙しくて、昼ご飯を食べる時間がありません。(I'm so busy today that I don't have time to eat lunch.)"
    },
    "difficulty": "easy",
    "question_type": "vocabulary_meaning"
  }
]

Example 3 (Grammar Question - Te-form):
Input Materials: 1. ～ている: continuous/progressive form
Expected Output:
[
  {
    "id": "q1",
    "type": "multiple_choice",
    "question": "田中さんは今、本を＿＿＿います。",
    "options": ["読んで", "読み", "読ん", "読む"],
    "correct": 0,
    "explanation": {
      "correct_answer": "読んでいます indicates ongoing action - 'is reading' right now",
      "translation": "Tanaka-san is reading a book now.",
      "why_correct": "て-form + いる expresses continuous action. 読んで is the te-form of 読む",
      "wrong_answers": {
        "option_0": "This is the correct answer",
        "option_1": "読み is the stem form, grammatically incorrect here",
        "option_2": "読ん is incomplete, missing で",
        "option_3": "読む is dictionary form, doesn't work with います"
      },
      "additional_notes": "～ている pattern: verb te-form + いる for ongoing actions",
      "example_usage": "雨が降っています。(It is raining.)"
    },
    "difficulty": "medium",
    "question_type": "grammar_form"
  }
]

Example 4 (Grammar Question - Particle Usage):
Input Materials: 1. に: particle for time, direction, purpose
Expected Output:
[
  {
    "id": "q1",
    "type": "multiple_choice",
    "question": "毎朝七時＿＿起きます。",
    "options": ["に", "で", "を", "が"],
    "correct": 0,
    "explanation": {
      "correct_answer": "に is the correct particle for expressing specific time",
      "translation": "I wake up at 7 o'clock every morning.",
      "why_correct": "The particle に is used with specific times like 七時 (7 o'clock)",
      "wrong_answers": {
        "option_0": "This is the correct answer",
        "option_1": "で is used for location of action, not time",
        "option_2": "を marks direct objects, not time",
        "option_3": "が marks subjects, not time"
      },
      "additional_notes": "Use に with specific times: 三時に (at 3 o'clock), 月曜日に (on Monday)",
      "example_usage": "学校は八時に始まります。(School starts at 8 o'clock.)"
    },
    "difficulty": "easy",
    "question_type": "grammar_particle"
  }
]

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

CRITICAL VALIDATION RULES:
1. ✅ MUST return valid JSON array starting with [ and ending with ]
2. ✅ Each question MUST have exactly 4 options in the "options" array
3. ✅ "correct" field MUST be integer 0, 1, 2, or 3 (matching options array index)
4. ✅ All strings MUST be properly escaped for JSON (no unescaped quotes)
5. ✅ "explanation.wrong_answers" MUST have entries for ALL options (mark correct as "This is the correct answer")
6. ✅ Question text MUST use ＿＿ (double underscore) for blanks, not single _
7. ✅ NO additional text before or after the JSON array
8. ✅ Each question MUST incorporate at least 1 material from the provided list

QUALITY ASSURANCE CHECKLIST:
- [ ] Questions test practical usage, not just memorization
- [ ] Wrong answers are plausible but clearly incorrect
- [ ] Explanations are educational and thorough
- [ ] Difficulty matches the specified level
- [ ] Japanese text uses natural, native-like expressions
- [ ] All required JSON fields are present and correctly formatted

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

FINAL INSTRUCTIONS:
1. Generate exactly ${count} questions
2. Use materials from the provided list
3. Ensure progressive difficulty within the set
4. Return ONLY the JSON array, no other text
5. Double-check JSON syntax before responding

OUTPUT PREFIX: [`;

  return prompt;
}

/**
 * Generate optimized prompt for specific question types
 */
export function generateSpecificPrompt(
  level: string,
  questionType: 'vocabulary' | 'grammar' | 'reading' | 'kanji',
  subType: string,
  materials: any[],
  explanationLanguage?: string
): string {
  // Get explanation language from settings or use override
  const explainLanguage = explanationLanguage || getAICommunicationLanguage();
  const languageInstruction = mapLanguageInstruction(explainLanguage);

  // Enhanced prompt templates with specific instructions
  const promptTemplates: Record<string, Record<string, string>> = {
    vocabulary: {
      meaning: `SYSTEM: You are a JLPT vocabulary specialist. Create questions testing word meanings in context for ${level.toUpperCase()}.
FOCUS: Test understanding of word meanings through contextual usage, not just memorization.`,
      reading: `SYSTEM: You are a JLPT reading specialist. Create questions testing correct hiragana/katakana readings for ${level.toUpperCase()}.
FOCUS: Test pronunciation knowledge with realistic contexts where the word would appear.`,
      usage: `SYSTEM: You are a JLPT usage specialist. Create questions testing appropriate word usage in different contexts for ${level.toUpperCase()}.
FOCUS: Test practical application and nuanced usage differences between similar words.`,
      synonym: `SYSTEM: You are a JLPT vocabulary specialist. Create questions testing synonyms, antonyms, and related words for ${level.toUpperCase()}.
FOCUS: Test understanding of word relationships and subtle meaning differences.`
    },
    grammar: {
      particle: `SYSTEM: You are a JLPT grammar specialist. Create questions testing particle usage (は、が、を、に、で、と、から、まで、etc.) for ${level.toUpperCase()}.
FOCUS: Test understanding of particle functions and contextual appropriateness.`,
      conjugation: `SYSTEM: You are a JLPT grammar specialist. Create questions testing verb/adjective conjugation patterns for ${level.toUpperCase()}.
FOCUS: Test mastery of conjugation rules and their appropriate usage in context.`,
      pattern: `SYSTEM: You are a JLPT grammar specialist. Create questions testing sentence patterns and grammar structures for ${level.toUpperCase()}.
FOCUS: Test understanding of grammar patterns and their contextual applications.`,
      error: `SYSTEM: You are a JLPT grammar specialist. Create questions identifying grammatical errors for ${level.toUpperCase()}.
FOCUS: Test ability to recognize incorrect grammar usage and understand why it's wrong.`
    },
    reading: {
      comprehension: `SYSTEM: You are a JLPT reading specialist. Create reading comprehension questions for ${level.toUpperCase()}.
FOCUS: Test overall understanding of passages with varied question types.`,
      main_idea: `SYSTEM: You are a JLPT reading specialist. Create questions about main ideas and central themes for ${level.toUpperCase()}.
FOCUS: Test ability to identify and understand the central message of texts.`,
      detail: `SYSTEM: You are a JLPT reading specialist. Create detail-oriented reading questions for ${level.toUpperCase()}.
FOCUS: Test ability to locate and understand specific information within texts.`,
      inference: `SYSTEM: You are a JLPT reading specialist. Create inference-based reading questions for ${level.toUpperCase()}.
FOCUS: Test ability to understand implied meanings and draw logical conclusions.`
    },
    kanji: {
      reading: `SYSTEM: You are a JLPT kanji specialist. Create kanji reading (pronunciation) questions for ${level.toUpperCase()}.
FOCUS: Test knowledge of on-yomi and kun-yomi readings in appropriate contexts.`,
      meaning: `SYSTEM: You are a JLPT kanji specialist. Create kanji meaning questions for ${level.toUpperCase()}.
FOCUS: Test understanding of kanji meanings and their usage in compounds.`,
      writing: `SYSTEM: You are a JLPT kanji specialist. Create questions about kanji stroke order, radicals, and structure for ${level.toUpperCase()}.
FOCUS: Test knowledge of kanji composition and writing principles.`,
      compound: `SYSTEM: You are a JLPT kanji specialist. Create questions about kanji compounds and their meanings for ${level.toUpperCase()}.
FOCUS: Test understanding of how kanji combine to form words and their meanings.`
    }
  };

  const systemPrompt = promptTemplates[questionType]?.[subType] || promptTemplates.vocabulary.meaning;

  // Format materials with better structure
  const formattedMaterials = materials.slice(0, 10).map((m, index) => {
    return `${index + 1}. ${JSON.stringify(m.content)}`;
  }).join('\n');

  return `${systemPrompt}

TASK: Generate 1-3 high-quality questions using the provided materials.

MATERIALS:
${formattedMaterials}

CONSTRAINTS:
- Questions in Japanese, explanations in ${languageInstruction}
- Use natural, authentic Japanese expressions
- Create plausible wrong answers that test common mistakes
- Ensure clear, unambiguous questions

VALIDATION RULES:
✅ Valid JSON array format
✅ Exactly 4 options per question
✅ Correct answer index (0-3)
✅ Comprehensive explanations
✅ Proper JSON escaping

OUTPUT FORMAT:
[
  {
    "id": "q1",
    "type": "multiple_choice",
    "question": "Question in Japanese (use ＿＿ for blanks)",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "explanation": {
      "correct_answer": "Why this answer is correct",
      "translation": "Question + correct answer in ${explainLanguage}",
      "why_correct": "Detailed grammar/vocabulary explanation",
      "wrong_answers": {
        "option_0": "This is the correct answer",
        "option_1": "Why this is wrong",
        "option_2": "Why this is wrong",
        "option_3": "Why this is wrong"
      },
      "additional_notes": "Learning tips and common mistakes",
      "example_usage": "Additional example sentences"
    },
    "difficulty": "easy|medium|hard|extremely_hard",
    "question_type": "${questionType}_${subType}"
  }
]

OUTPUT PREFIX: [`;
}

/**
 * Enhanced validation for exercise prompt responses
 */
export function validateExerciseResponse(response: string): {
  isValid: boolean;
  data: any[] | null;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Step 1: Extract JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      errors.push('No JSON array found in response');
      return { isValid: false, data: null, errors, warnings };
    }

    // Step 2: Parse JSON
    let parsed: any;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      errors.push(`JSON parsing failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      return { isValid: false, data: null, errors, warnings };
    }

    // Step 3: Validate array structure
    if (!Array.isArray(parsed)) {
      errors.push('Response is not an array');
      return { isValid: false, data: null, errors, warnings };
    }

    if (parsed.length === 0) {
      errors.push('Response array is empty');
      return { isValid: false, data: null, errors, warnings };
    }

    // Step 4: Validate each question object
    const validatedQuestions = parsed.map((q, index) => {
      const questionErrors: string[] = [];
      const questionWarnings: string[] = [];

      // Required fields validation
      if (!q.id || typeof q.id !== 'string') {
        questionErrors.push(`Question ${index + 1}: Missing or invalid 'id' field`);
      }

      if (!q.question || typeof q.question !== 'string') {
        questionErrors.push(`Question ${index + 1}: Missing or invalid 'question' field`);
      }

      if (!Array.isArray(q.options)) {
        questionErrors.push(`Question ${index + 1}: 'options' must be an array`);
      } else {
        if (q.options.length !== 4) {
          questionErrors.push(`Question ${index + 1}: Must have exactly 4 options, found ${q.options.length}`);
        }

        // Check for duplicate options
        const uniqueOptions = new Set(q.options);
        if (uniqueOptions.size !== q.options.length) {
          questionWarnings.push(`Question ${index + 1}: Contains duplicate options`);
        }

        // Check for empty options
        if (q.options.some((opt: any) => !opt || typeof opt !== 'string' || opt.trim() === '')) {
          questionErrors.push(`Question ${index + 1}: Contains empty or invalid options`);
        }
      }

      if (typeof q.correct !== 'number' || q.correct < 0 || q.correct >= (q.options?.length || 0)) {
        questionErrors.push(`Question ${index + 1}: 'correct' must be a valid index (0-${(q.options?.length || 1) - 1})`);
      }

      // Explanation validation
      if (!q.explanation || typeof q.explanation !== 'object') {
        questionErrors.push(`Question ${index + 1}: Missing or invalid 'explanation' object`);
      } else {
        const requiredExplanationFields = ['correct_answer', 'translation', 'why_correct', 'wrong_answers'];
        requiredExplanationFields.forEach(field => {
          if (!q.explanation[field]) {
            questionWarnings.push(`Question ${index + 1}: Missing explanation field '${field}'`);
          }
        });

        // Validate wrong_answers structure
        if (q.explanation.wrong_answers && typeof q.explanation.wrong_answers === 'object') {
          for (let i = 0; i < (q.options?.length || 0); i++) {
            if (!q.explanation.wrong_answers[`option_${i}`]) {
              questionWarnings.push(`Question ${index + 1}: Missing wrong_answers explanation for option_${i}`);
            }
          }
        }
      }

      // Optional field validation
      if (q.difficulty && !['easy', 'medium', 'hard', 'extremely_hard'].includes(q.difficulty)) {
        questionWarnings.push(`Question ${index + 1}: Invalid difficulty level '${q.difficulty}'`);
      }

      // Content quality checks
      if (q.question && q.question.includes('_') && !q.question.includes('＿＿')) {
        questionWarnings.push(`Question ${index + 1}: Use ＿＿ (double underscore) for blanks, not single _`);
      }

      errors.push(...questionErrors);
      warnings.push(...questionWarnings);

      return {
        question: q,
        hasErrors: questionErrors.length > 0,
        errors: questionErrors,
        warnings: questionWarnings
      };
    });

    // Step 5: Final validation
    const hasAnyErrors = validatedQuestions.some(vq => vq.hasErrors);

    if (hasAnyErrors) {
      return { isValid: false, data: null, errors, warnings };
    }

    // Return validated data
    return {
      isValid: true,
      data: parsed,
      errors,
      warnings
    };

  } catch (error) {
    errors.push(`Unexpected validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { isValid: false, data: null, errors, warnings };
  }
}

/**
 * Legacy validation function for backward compatibility
 */
export function validateExerciseResponseLegacy(response: string): any[] | null {
  const result = validateExerciseResponse(response);
  return result.isValid ? result.data : null;
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

  return `SYSTEM INSTRUCTION:
You are an expert JLPT Reading Comprehension specialist with 20+ years of experience in Japanese language assessment. You excel at creating authentic, engaging passages that naturally incorporate target vocabulary and grammar while testing genuine comprehension skills.

TASK:
Create exactly ${count} reading comprehension exercises for JLPT ${level.toUpperCase()} level.

CONSTRAINTS:
- Each exercise = 1 passage + exactly 3 questions
- Total passages: ${count} (user requested maximum)
- Passage length: ${passageLength}
- Question language: Japanese
- Explanation language: ${explainLanguage}
- Must incorporate provided materials naturally

MATERIALS TO INCORPORATE:

VOCABULARY (use 3-5 per passage):
${vocabText}

GRAMMAR PATTERNS (use 2-3 per passage):
${grammarText}

${tags && tags.length > 0 ? `FOCUS AREAS: ${tags.join(', ')}` : ''}

FEW-SHOT EXAMPLE:

Input Materials:
1. [VOCAB] 旅行 (りょこう): travel
2. [GRAMMAR] ～たことがある: have experience of doing

Expected Output:
[
  {
    "id": "passage1_q1",
    "type": "reading_comprehension",
    "passage": "私は去年、初めて海外旅行をしたことがあります。フランスに行きました。とても楽しかったです。",
    "question": "この人は何をしましたか。",
    "options": ["海外旅行をしました", "国内旅行をしました", "仕事をしました", "勉強をしました"],
    "correct": 0,
    "explanation": {
      "correct_answer": "The passage clearly states '海外旅行をした' (did overseas travel)",
      "translation": "What did this person do? - They traveled overseas.",
      "why_correct": "The text explicitly mentions '海外旅行をしたことがあります' indicating overseas travel experience",
      "wrong_answers": {
        "option_0": "This is the correct answer",
        "option_1": "国内旅行 (domestic travel) - incorrect, the passage says 海外 (overseas)",
        "option_2": "仕事 (work) - not mentioned in the passage",
        "option_3": "勉強 (study) - not mentioned in the passage"
      },
      "passage_reference": "海外旅行をしたことがあります。フランスに行きました。"
    },
    "difficulty": "easy",
    "vocabulary_used": ["旅行"],
    "grammar_used": ["～たことがある"]
  }
]

PASSAGE REQUIREMENTS:
- Natural, coherent Japanese text appropriate for ${level.toUpperCase()} level
- Length: ${finalPassageLength}
- Difficulty: ${baseDifficulty || 'medium'}
- Incorporate 3-5 vocabulary words from the provided list
- Use 2-3 grammar patterns from the provided list
- Topics suitable for JLPT: daily life, work, school, travel, culture, etc.
- Progressive difficulty within the set
- Authentic Japanese expressions that natives would use
- Clear narrative flow with logical connections

QUESTION STRATEGY (3 questions per passage):
1. **Main Idea Question**: Test overall comprehension and central theme
2. **Detail Question**: Test specific information retrieval and factual understanding
3. **Inference Question**: Test deeper understanding, author's intention, or contextual meaning

CRITICAL VALIDATION RULES:
1. ✅ MUST return valid JSON array starting with [ and ending with ]
2. ✅ Each passage must generate exactly 3 question objects
3. ✅ All questions for same passage MUST have identical "passage" field
4. ✅ Question IDs must follow pattern: "passage1_q1", "passage1_q2", "passage1_q3", etc.
5. ✅ "vocabulary_used" and "grammar_used" arrays must list actual materials incorporated
6. ✅ "passage_reference" must quote relevant text supporting the correct answer
7. ✅ NO additional text before or after JSON array

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

FINAL INSTRUCTIONS:
1. Generate exactly ${count} reading passages with 3 questions each (total: ${count * 3} question objects)
2. Each passage should be engaging and educational
3. Incorporate materials naturally and authentically
4. Ensure questions test different comprehension levels
5. Return ONLY the JSON array, no other text

OUTPUT PREFIX: [`;
}
