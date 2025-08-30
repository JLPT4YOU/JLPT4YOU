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

  // Specialized handling for Vocabulary and Grammar
  if (type === 'vocabulary') {
    return generateVocabularyPrompt({ level, count, difficulty, materials, explainLanguage, tags });
  }
  if (type === 'grammar') {
    return generateGrammarPrompt({ level, count, difficulty, materials, explainLanguage, tags });
  }


  // Derive allowed question_type values by category for stronger schema guidance
  const allowedQuestionTypes = (() => {
    switch (type) {
      case 'vocabulary':
        return [
          'vocabulary_meaning',
          'vocabulary_usage',
          'vocabulary_reading',
          'word_formation',
          'paraphrase'
        ];
      case 'grammar':
        return [
          'grammar_form',
          'grammar_composition',
          'text_grammar',
          'particle',
          'conjugation',
          'pattern',
          'error_detection'
        ];
      case 'kanji':
        return [
          'kanji_reading',
          'kanji_meaning',
          'kanji_compound',
          'kanji_structure'
        ];
      default:
        return [
          'vocabulary_meaning',
          'vocabulary_usage',
          'grammar_form',
          'grammar_composition'
        ];
    }
  })();

  const prompt = `
You are an expert JLPT (Japanese Language Proficiency Test) exercise generator and Japanese language teacher.
Create ${count} high-quality ${type} questions for JLPT ${level.toUpperCase()} level.

REQUIREMENTS:
1. Questions must be appropriate for ${level.toUpperCase()} level
2. Difficulty: ${difficulty}
3. Type: ${type}
	3.1 Allowed question_type values for this category: ${allowedQuestionTypes.join(', ')}
	3.2 If FOCUS AREAS are provided, ensure coverage: include at least one question targeting each focus area.


4. Language: Questions in Japanese, ${languageInstruction}
5. Format: JSON array of question objects

MATERIALS TO USE:
${materialsText}

${tags && tags.length > 0 ? `FOCUS AREAS: ${tags.join(', ')}` : ''}

OUTPUT FORMAT (STRICT):
- Return ONLY a JSON array. No prose, no markdown code fences, no comments, no trailing commas.
- Exactly ${count} items in the array.
- Each item MUST strictly match this schema:
[
  {
    "id": "q1",                      // unique per question within the set
    "type": "multiple_choice",       // fixed
    "question": "Japanese text (use ＿＿ for blanks)",
    "options": ["A", "B", "C", "D"], // exactly 4 unique strings
    "correct": 0,                     // integer index 0-3 that matches options
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
- Do NOT include any field outside the schema.
- Do NOT include inline comments in your actual output; comments above are for specification only.
- Ensure options are natural, grammatically valid, and only one is contextually correct.
- Ensure the correct index points to the truly correct option.

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


  // Derive a specific question_type value based on questionType and subType for stricter schema
  const specificQuestionType = (() => {
    if (questionType === 'vocabulary') {
      switch (subType) {
        case 'meaning':
          return 'vocabulary_meaning';
        case 'reading':
          return 'vocabulary_reading';
        case 'usage':
          return 'vocabulary_usage';
        case 'synonym':
          return 'paraphrase';
        default:
          return 'vocabulary_meaning';
      }
    }
    if (questionType === 'grammar') {
      switch (subType) {
        case 'particle':
          return 'particle';
        case 'conjugation':
          return 'conjugation';
        case 'pattern':
          return 'pattern';
        case 'error':
          return 'error_detection';
        default:
          return 'grammar_form';
      }
    }
    if (questionType === 'kanji') {
      switch (subType) {
        case 'reading':
          return 'kanji_reading';
        case 'meaning':
          return 'kanji_meaning';
        case 'writing':
          return 'kanji_structure';
        case 'compound':
          return 'kanji_compound';
        default:
          return 'kanji_reading';
      }
    }
    if (questionType === 'reading') {
      return 'reading_comprehension';
    }
    return 'vocabulary_meaning';
  })();

  return `${basePrompt}

Questions in Japanese. Explanations in ${explainLanguage}.
Use the provided materials naturally in questions and explanations when relevant.

Materials: ${JSON.stringify(materials.slice(0, 10))}

OUTPUT FORMAT (STRICT):
- Return ONLY a JSON array. No prose, no markdown code fences, no comments, no trailing commas.
- Each item MUST strictly match this schema:
[
  {
    "id": "q1",
    "type": "multiple_choice",
    "question": "Japanese question text (use ＿＿ for blanks if needed)",
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
    "difficulty": "easy|medium|hard|extremely_hard",
    "question_type": "${specificQuestionType}"
  }
]

STRICT JSON OUTPUT RULES:
- Do NOT include any field outside the schema.
- Ensure options are four unique strings and only one option is contextually correct.
- Ensure the correct index points to the truly correct option.
- Do NOT include inline comments in your actual output; comments above are for specification only.`;
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

EXAMPLE (Few-shot) — DO NOT COPY, CREATE NEW PASSAGES:
[
  {
    "id": "example_p1_q1",
    "type": "reading_comprehension",
    "passage": "私は毎朝、朝ごはんを食べてから、近くのバス停まで歩きます。バスが遅れるときは、会社に電話して状況を伝えます。昨日は雨だったので、少し早めに家を出ました。",
    "question": "この文章の主題として最も適切なものはどれですか。",
    "options": ["筆者の朝の通勤習慣", "会社の規則の説明", "雨の日の歩き方", "バスの料金"],


    "correct": 0,
    "explanation": {
      "correct_answer": "段落全体が『毎朝〜通勤』について述べているため『筆者の朝の通勤習慣』が適切。",
      "translation": "Chủ đề là thói quen đi làm buổi sáng của người viết.",
      "why_correct": "キーワード『毎朝』『バス停』『会社に電話』が通勤習慣を示す。",
      "wrong_answers": {
        "option_0": "",
        "option_1": "会社の規則には触れていない。",
        "option_2": "歩き方ではなく通勤全体の流れ。",
        "option_3": "料金の情報はない。"
      },
      "passage_reference": "私は毎朝…会社に電話して状況を伝えます。"
    },
    "difficulty": "${difficulty || 'medium'}",
    "vocabulary_used": ["朝ごはん", "バス停", "会社"],
    "grammar_used": ["〜てから", "〜とき"]
  },
  {
    "id": "example_p1_q2",
    "type": "reading_comprehension",
    "passage": "私は毎朝、朝ごはんを食べてから、近くのバス停まで歩きます。バスが遅れるときは、会社に電話して状況を伝えます。昨日は雨だったので、少し早めに家を出ました。",
    "question": "『少し早めに家を出ました』とあるが、その理由はどれですか。",
    "options": ["雨だったから", "朝ごはんを食べなかったから", "会社が遠いから", "バスの料金が高いから"],
    "correct": 0,
    "explanation": {
      "correct_answer": "文中の理由は『昨日は雨だったので』に対応。",
      "translation": "Vì hôm qua trời mưa nên tôi ra khỏi nhà sớm hơn một chút.",
      "why_correct": "接続表現『〜ので』が理由を明示。",
      "wrong_answers": {
        "option_0": "",
        "option_1": "本文にない。",
        "option_2": "本文にない。",
        "option_3": "本文にない。"
      },
      "passage_reference": "昨日は雨だったので、少し早めに家を出ました。"
    },
    "difficulty": "${difficulty || 'medium'}",
    "vocabulary_used": ["雨"],
    "grammar_used": ["〜ので"]
  },
  {
    "id": "example_p1_q3",
    "type": "reading_comprehension",
    "passage": "私は毎朝、朝ごはんを食べてから、近くのバス停まで歩きます。バスが遅れるときは、会社に電話して状況を伝えます。昨日は雨だったので、少し早めに家を出ました。",
    "question": "筆者はバスが遅れたらどうしますか。",
    "options": ["会社に電話する", "タクシーに乗る", "歩いて会社へ行く", "遅刻しても連絡しない"],
    "correct": 0,
    "explanation": {
      "correct_answer": "『バスが遅れるときは、会社に電話して状況を伝えます。』とある。",
      "translation": "Khi xe buýt trễ, tác giả gọi điện cho công ty để thông báo tình hình.",
      "why_correct": "本文の明示情報に基づく。",
      "wrong_answers": {
        "option_0": "",
        "option_1": "本文にない。",
        "option_2": "本文にない。",
        "option_3": "本文にない。"
      },
      "passage_reference": "会社に電話して状況を伝えます。"
    },
    "difficulty": "${difficulty || 'medium'}",
    "vocabulary_used": ["会社", "電話"],
    "grammar_used": []
  }
]


OUTPUT FORMAT:
Return ONLY a JSON array with this exact structure (each passage creates 3 separate question objects):
	STRICT RULES:
	- No prose, no markdown code fences, no comments, no trailing commas in output.
	- Exactly ${count * 3} items in the array.
	- Grouping: For each passage, produce exactly 3 question objects that share the identical "passage" text (IDs like passageN_q1..q3).
	- Ensure options are four unique strings and only one option is contextually correct.
		- Answer randomization: Randomize the correct index per question and distribute indices (0,1,2,3) roughly evenly across all ${count * 3} questions. Avoid repeating the same correct index in consecutive questions when possible. Shuffle option order per question while keeping options natural and distinct.


[
  {
    "id": "passage1_q1",
    "type": "reading_comprehension",
    "passage": "Japanese reading passage text here...",
    "question": "Question 1 in Japanese",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "explanation": {

EXPLANATION LANGUAGE:
- All explanation subfields (correct_answer, translation, why_correct, wrong_answers, additional_notes, example_usage) must be written in ${explainLanguage}.
- Do NOT use Japanese in explanation subfields. Japanese is only for the question and options text.
- The translation field must translate the combined question + correct option into ${explainLanguage}.

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
    "passage": "Japanese reading passage text here...",
    "question": "Question 2 in Japanese",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 1,
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
    "id": "passage1_q3",
    "type": "reading_comprehension",
    "passage": "Japanese reading passage text here...",
    "question": "Question 3 in Japanese",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 2,
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


/**
 * Generate specialized prompt for Vocabulary
 */
function generateVocabularyPrompt({
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
  const vocabMaterials = materials
    .filter((m) => m.type === 'vocabulary' || m?.content?.word)
    .slice(0, 20);

  const vocabText = vocabMaterials
    .map((m) => `- ${m.content.word} (${m.content.reading}): ${m.content.meaning}`)
    .join('\n');

  return `
You are an expert JLPT Vocabulary exercise generator and Japanese language teacher.
Create ${count} vocabulary questions for JLPT ${level.toUpperCase()} level.

REQUIREMENTS:
1. Level appropriateness: ${level.toUpperCase()} | Difficulty: ${difficulty || 'medium'}
2. Questions in Japanese, explanations in ${explainLanguage}
3. Use provided vocabulary naturally (at least one target word per question)
4. Vary question types across: vocabulary_meaning, vocabulary_usage, vocabulary_reading, word_formation, paraphrase
${tags && tags.length > 0 ? `5. FOCUS AREAS: include at least one question per: ${tags.join(', ')}` : ''}

TARGET VOCABULARY:
${vocabText}

EXAMPLES (Few-shot) — DO NOT COPY, CREATE NEW QUESTIONS:
[{
  "id": "ex1",
  "type": "multiple_choice",
  "question": "次の文脈に最も合う言葉を選んでください。昨日はとても＿＿＿ので、上着を持って行けばよかった。",
  "options": ["寒い", "楽しい", "遅い", "静か"],
  "correct": 0,
  "explanation": {
    "correct_answer": "文脈規定（語彙の意味）。『上着を持って行けばよかった』→『寒い』が適切。",
    "translation": "Hôm qua rất lạnh nên ước gì đã mang áo khoác.",
    "why_correct": "『寒い』は気温の低さを表す形容詞で、上着と連動する自然な文脈。",
    "wrong_answers": {
      "option_0": "",
      "option_1": "『楽しい』は感情で気温と関係がない。",
      "option_2": "『遅い』は速度に関する形容詞で不適切。",
      "option_3": "『静か』は音量に関する形容詞で不適切。"
    },
    "additional_notes": "文脈規定では前後の手掛かりを用いる。",
    "example_usage": "今日は寒いので、コートを着た。"
  },
  "difficulty": "${difficulty || 'medium'}",
  "question_type": "vocabulary_meaning"
}, {
  "id": "ex2",
  "type": "multiple_choice",
  "question": "下線部の語の読みを選んでください。『昨日、重要な会議の『資料』を忘れてしまいました。』",
  "options": ["しりょう", "ざいりょう", "しょりょう", "しょざい"],
  "correct": 0,
  "explanation": {
    "correct_answer": "『資料』の一般的な読みは『しりょう』。",
    "translation": "Hôm qua tôi quên tài liệu quan trọng của cuộc họp.",
    "why_correct": "N3〜N2で頻出の語彙で、読みは固定的。",
    "wrong_answers": {
      "option_0": "",
      "option_1": "『材料』の読みで意味が異なる。",
      "option_2": "一般的な語ではない／誤り。",
      "option_3": "語として不自然。"
    },


    "additional_notes": "同音異義語に注意。",
    "example_usage": "会議の資料をコピーする。"
  },
  "difficulty": "${difficulty || 'medium'}",
  "question_type": "vocabulary_reading"
}]

OUTPUT FORMAT (STRICT):
- Return ONLY a JSON array with exactly ${count} items. No prose/markdown/comments/trailing commas.
- Each item MUST match this schema:
[
  {
    "id": "q1",
    "type": "multiple_choice",
    "question": "Japanese text (use ＿＿ for blanks when needed)",
    "options": ["A", "B", "C", "D"],
    "correct": 0,
    "explanation": {
      "correct_answer": "Reason",
      "translation": "(Question + correct option) translated to ${explainLanguage}",
      "why_correct": "Rule-based explanation",
      "wrong_answers": {
        "option_0": "Why wrong",
        "option_1": "Why wrong",
        "option_2": "Why wrong",
        "option_3": "Why wrong"
      },
      "additional_notes": "Tips",
      "example_usage": "1-2 examples"
    },
    "difficulty": "${difficulty || 'medium'}",
    "question_type": "one of: vocabulary_meaning, vocabulary_usage, vocabulary_reading, word_formation, paraphrase"
  }
]
- Ensure options are four unique strings and exactly one is contextually correct.
- Do not reuse the exact same set of 4 options across different questions.
- Answer randomization: Randomize the correct index per question and distribute indices (0,1,2,3) roughly evenly across all ${count} questions. Avoid repeating the same correct index in consecutive questions when possible. Shuffle option order per question while keeping options natural and distinct.

`;

}

/**
 * Generate specialized prompt for Grammar
 */
function generateGrammarPrompt({
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
  const grammarMaterials = materials
    .filter((m) => m.type === 'grammar' || m?.content?.pattern)
    .slice(0, 20);

  const grammarText = grammarMaterials
    .map((m) => `- ${m.content.pattern}: ${m.content.meaning}`)
    .join('\n');

  return `
You are an expert JLPT Grammar exercise generator and Japanese language teacher.
Create ${count} grammar questions for JLPT ${level.toUpperCase()} level.

REQUIREMENTS:
1. Level appropriateness: ${level.toUpperCase()} | Difficulty: ${difficulty || 'medium'}
2. Questions in Japanese, explanations in ${explainLanguage}
3. Use provided grammar patterns naturally (at least one target pattern per question)
4. Vary question types across: grammar_form, grammar_composition, text_grammar, particle, conjugation, pattern, error_detection
${tags && tags.length > 0 ? `5. FOCUS AREAS: include at least one question per: ${tags.join(', ')}` : ''}

TARGET GRAMMAR:
${grammarText}

EXAMPLES (Few-shot) — DO NOT COPY, CREATE NEW QUESTIONS:
[{
  "id": "ex1",
  "type": "multiple_choice",
  "question": "（  ）に最も適切な助詞を入れてください。『駅（ ）友だち（ ）待ち合わせる。』",
  "options": ["で／と", "に／が", "へ／を", "を／に"],
  "correct": 0,
  "explanation": {
    "correct_answer": "『駅で待ち合わせる』場所＋『友だちと待ち合わせる』相手→『で／と』が自然。",
    "translation": "Hẹn gặp bạn tại nhà ga.",
    "why_correct": "助詞の用法（場所はで／相手はと）。",
    "wrong_answers": {
      "option_0": "",
      "option_1": "『に』は到達点の用法で不自然、主語の『が』も不適切。",
      "option_2": "『へ』は方向で『待ち合わせる』に不自然。『を』も不適切。",
      "option_3": "文型に合わない組み合わせ。"
    },
    "additional_notes": "待ち合わせる＋場所『で』／相手『と』は定番。",
    "example_usage": "明日、会社の前で同僚と待ち合わせる。"
  },
  "difficulty": "${difficulty || 'medium'}",
  "question_type": "particle"
}, {
  "id": "ex2",
  "type": "multiple_choice",
  "question": "次の文を完成させてください。『彼は日本に来て（  ）後に、留学を決めた。』",
  "options": ["間もない", "ように", "わけではない", "かわりに"],
  "correct": 0,
  "explanation": {
    "correct_answer": "『～て間もない』＝動作後の期間が短い。文脈と自然に合う。",
    "translation": "Anh ấy quyết định du học không lâu sau khi đến Nhật.",
    "why_correct": "文法形式の判断（文末と意味制約）。",
    "wrong_answers": {
      "option_0": "",
      "option_1": "『ように』は目的・例示などで本例に不適。",
      "option_2": "『わけではない』は否定的断定で文脈不一致。",
      "option_3": "『かわりに』は置換を表し不適。"
    },
    "additional_notes": "接続：Vて＋間もない。",
    "example_usage": "卒業して間もなく、就職した。"
  },
  "difficulty": "${difficulty || 'medium'}",
  "question_type": "grammar_form"
}]

OUTPUT FORMAT (STRICT):
- Return ONLY a JSON array with exactly ${count} items. No prose/markdown/comments/trailing commas.
- Each item MUST match this schema:
[
  {
    "id": "q1",
    "type": "multiple_choice",
    "question": "Japanese text (use ＿＿ for blanks when needed)",
    "options": ["A", "B", "C", "D"],
    "correct": 0,
    "explanation": {
      "correct_answer": "Reason",
      "translation": "(Question + correct option) translated to ${explainLanguage}",
      "why_correct": "Rule-based explanation",
      "wrong_answers": {
        "option_0": "Why wrong",
        "option_1": "Why wrong",
        "option_2": "Why wrong",
        "option_3": "Why wrong"
      },
      "additional_notes": "Tips",
      "example_usage": "1-2 examples"
    },
    "difficulty": "${difficulty || 'medium'}",
    "question_type": "one of: grammar_form, grammar_composition, text_grammar, particle, conjugation, pattern, error_detection"
  }
]
- Ensure options are four unique strings and exactly one is contextually correct.
- Answer randomization: Randomize the correct index per question and distribute indices (0,1,2,3) roughly evenly across all ${count} questions. Avoid repeating the same correct index in consecutive questions when possible. Shuffle option order per question while keeping options natural and distinct.

- Do not reuse the exact same set of 4 options across different questions.
`;
}

