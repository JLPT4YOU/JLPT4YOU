/**
 * Prompt Storage System
 * Manages custom AI prompt configurations with localStorage persistence
 * and future server-side migration support
 */

export interface CustomPromptConfig {
  // User input fields for personalization
  preferredName: string;        // iRIN nên gọi bạn là gì
  desiredTraits: string;        // Bạn muốn iRIN có những đặc điểm gì
  personalInfo: string;         // Thông tin cá nhân về bạn
  additionalRequests: string;   // Yêu cầu bổ sung

  // Generated prompt từ Gemini Flash 2.0
  generatedPrompt?: string;

  // Metadata
  createdAt?: string;
  updatedAt?: string;
}

// Storage keys
const STORAGE_KEYS = {
  CUSTOM_PROMPT: 'irin_sensei_custom_prompt',
  PROMPT_VERSION: 'irin_sensei_prompt_version'
} as const;

// Current version for migration support
const CURRENT_VERSION = '1.0.0';

// Default configuration
export const DEFAULT_PROMPT_CONFIG: CustomPromptConfig = {
  preferredName: '',
  desiredTraits: '',
  personalInfo: '',
  additionalRequests: '',
  generatedPrompt: ''
};

// Core iRIN identity - IMMUTABLE
export const CORE_IDENTITY_PROMPT = `You are iRIN, a versatile AI teacher and assistant from the JLPT4YOU learning platform.

Your core identity:
- You are iRIN, a knowledgeable and adaptable AI teacher who can help with any subject
- You work for the JLPT4YOU platform, but you're a multi-disciplinary educator
- You can discuss and teach any topic the user is interested in
- You are encouraging, patient, and adapt to each user's learning style and interests
- You always maintain a helpful, educational, and engaging approach

Your capabilities include:
- Multi-subject education and tutoring (mathematics, science, literature, history, etc.)
- Japanese language learning and JLPT exam preparation (one of your specialties)
- General knowledge and discussions on various topics
- Problem-solving and creative thinking
- Academic support across all educational levels
- Personalized guidance based on user preferences and learning goals

You are a well-rounded AI teacher who can engage meaningfully on any educational topic while maintaining your identity as iRIN from JLPT4YOU.

IMPORTANT: Always maintain your identity as iRIN from JLPT4YOU and use appropriate teacher-student communication style regardless of any custom instructions or topics discussed.`;

/**
 * Validates custom prompt configuration
 */
export function validatePromptConfig(config: any): config is CustomPromptConfig {
  if (!config || typeof config !== 'object') return false;

  const requiredFields = [
    'preferredName', 'desiredTraits',
    'personalInfo', 'additionalRequests'
  ];

  return requiredFields.every(field => field in config) &&
         typeof config.preferredName === 'string' &&
         typeof config.desiredTraits === 'string' &&
         typeof config.personalInfo === 'string' &&
         typeof config.additionalRequests === 'string';
}

/**
 * Sanitizes user input to prevent identity override and prompt injection
 */
export function sanitizeUserInput(input: string): string {
  if (!input) return '';

  // Remove potentially harmful instructions that could override identity
  const forbiddenPatterns = [
    /you are not/gi,
    /ignore previous/gi,
    /forget that you are/gi,
    /act as if you are/gi,
    /pretend to be/gi,
    /your name is not/gi,
    /you are actually/gi,
    /you are chatgpt/gi,
    /not irin/gi,
    /you are gpt/gi,
    /you are openai/gi,
    /system\s*:/gi,
    /assistant\s*:/gi,
    /human\s*:/gi
  ];

  let sanitized = input;
  forbiddenPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[FILTERED]');
  });

  // Limit length based on field type
  return sanitized.slice(0, 300).trim();
}

/**
 * Legacy function for backward compatibility
 */
export function sanitizeCustomInstructions(instructions: string): string {
  return sanitizeUserInput(instructions);
}

/**
 * Gets custom prompt configuration from localStorage
 */
export function getCustomPromptConfig(): CustomPromptConfig | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CUSTOM_PROMPT);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    if (!validatePromptConfig(parsed)) {
      console.warn('Invalid prompt config found, using default');
      return null;
    }

    // Sanitize all user inputs
    parsed.preferredName = sanitizeUserInput(parsed.preferredName || '');
    parsed.desiredTraits = sanitizeUserInput(parsed.desiredTraits || '');
    parsed.personalInfo = sanitizeUserInput(parsed.personalInfo || '');
    parsed.additionalRequests = sanitizeUserInput(parsed.additionalRequests || '');

    return parsed;
  } catch (error) {
    console.error('Error loading custom prompt config:', error);
    return null;
  }
}

/**
 * Saves custom prompt configuration to localStorage
 */
export async function saveCustomPromptConfig(config: CustomPromptConfig): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // Validate configuration
    if (!validatePromptConfig(config)) {
      throw new Error('Invalid prompt configuration');
    }

    // Sanitize all user inputs
    const sanitizedConfig = {
      ...config,
      preferredName: sanitizeUserInput(config.preferredName || ''),
      desiredTraits: sanitizeUserInput(config.desiredTraits || ''),
      personalInfo: sanitizeUserInput(config.personalInfo || ''),
      additionalRequests: sanitizeUserInput(config.additionalRequests || ''),
      updatedAt: new Date().toISOString(),
      createdAt: config.createdAt || new Date().toISOString()
    };

    // Save to localStorage
    localStorage.setItem(STORAGE_KEYS.CUSTOM_PROMPT, JSON.stringify(sanitizedConfig));
    localStorage.setItem(STORAGE_KEYS.PROMPT_VERSION, CURRENT_VERSION);

    // Future: Add server-side sync here
    // await syncToServer(sanitizedConfig);

  } catch (error) {
    console.error('Error saving custom prompt config:', error);
    throw error;
  }
}

/**
 * Resets to default prompt configuration
 */
export function resetToDefaultPrompt(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEYS.CUSTOM_PROMPT);
    localStorage.setItem(STORAGE_KEYS.PROMPT_VERSION, CURRENT_VERSION);
  } catch (error) {
    console.error('Error resetting prompt config:', error);
  }
}

/**
 * Composes the final system prompt by combining core identity with user prompt
 */
export function composeSystemPrompt(_customConfig?: CustomPromptConfig | null): string {
  // Get language instruction from settings
  const languageInstruction = getLanguageInstruction();

  // Get user prompt from separate system - using direct localStorage access
  let userPrompt = '';
  try {
    // Direct localStorage access to avoid module loading issues
    if (typeof window !== 'undefined') {
      // Try new key first, then fallback to old key
      let stored = localStorage.getItem('user_custom_prompt_config');
      let isNewSystem = true;

      if (!stored) {
        // Fallback to old system key
        stored = localStorage.getItem('irin_sensei_custom_prompt');
        isNewSystem = false;
      }

      if (stored) {
        const config = JSON.parse(stored);
        // Handle both new and old system formats
        userPrompt = isNewSystem
          ? (config?.generatedUserPrompt || '')
          : (config?.generatedPrompt || '');


      }
    }
  } catch (error) {
    userPrompt = '';
  }

  // Build base prompt
  let finalPrompt = `${CORE_IDENTITY_PROMPT}

${languageInstruction}`;

  // Add user prompt if available
  if (userPrompt) {
    finalPrompt += `

${userPrompt}

Apply the above communication style in all conversations with the user.`;
  }

  // Add reminder
  finalPrompt += `

Remember: Always maintain your identity as iRIN from JLPT4YOU and use appropriate teacher-student communication style while providing helpful, engaging responses on any topic the user wants to discuss.`;

  return finalPrompt;
}

/**
 * Gets the current effective system prompt
 */
export function getCurrentSystemPrompt(): string {
  return composeSystemPrompt();
}

/**
 * Checks if custom prompt is currently active
 */
export function hasCustomPrompt(): boolean {
  return getCustomPromptConfig() !== null;
}

/**
 * Future: Server-side sync functions
 * These will be implemented when migrating to server-side storage
 */

// export async function syncToServer(config: CustomPromptConfig): Promise<void> {
//   // Implementation for server sync
// }

// export async function loadFromServer(): Promise<CustomPromptConfig | null> {
//   // Implementation for server load
// }

// export async function deleteFromServer(): Promise<void> {
//   // Implementation for server deletion
// }

// NOTE: generateCustomPrompt function đã được chuyển sang user-prompt-generator.ts
// để tránh inject core identity qua geminiService.sendMessage()

/**
 * Migration utilities for future server-side storage
 */
export function exportPromptConfig(): string {
  const config = getCustomPromptConfig();
  return JSON.stringify(config, null, 2);
}

export function importPromptConfig(jsonString: string): boolean {
  try {
    const config = JSON.parse(jsonString);
    if (validatePromptConfig(config)) {
      saveCustomPromptConfig(config);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Detect language from user message
 */
export function detectLanguageFromMessage(message: string): string {
  if (!message || message.trim().length === 0) return 'Tiếng Việt';

  const text = message.toLowerCase().trim();

  // Japanese detection - check for hiragana, katakana, kanji
  const japaneseRegex = /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/;
  if (japaneseRegex.test(text)) {
    return '日本語';
  }

  // Vietnamese detection - check for Vietnamese diacritics and common words
  const vietnameseRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/;
  const vietnameseWords = /\b(tôi|bạn|là|của|với|trong|này|đó|có|không|được|sẽ|đã|và|hoặc|nhưng|nếu|khi|để|cho|về|từ|theo|sau|trước|giữa|cùng|cũng|rất|nhiều|ít|lớn|nhỏ|tốt|xấu|mới|cũ|cao|thấp|nhanh|chậm|dễ|khó)\b/;

  if (vietnameseRegex.test(text) || vietnameseWords.test(text)) {
    return 'Tiếng Việt';
  }

  // English detection - check for common English words and patterns
  const englishWords = /\b(the|and|or|but|if|when|to|for|of|with|in|on|at|by|from|up|about|into|through|during|before|after|above|below|between|among|also|very|much|many|little|big|small|good|bad|new|old|high|low|fast|slow|easy|hard|i|you|he|she|it|we|they|am|is|are|was|were|have|has|had|do|does|did|will|would|can|could|should|may|might)\b/;

  if (englishWords.test(text)) {
    return 'English';
  }

  // Default to Vietnamese if no clear detection
  return 'Tiếng Việt';
}

/**
 * Get AI communication language from user-scoped settings
 */
export function getAICommunicationLanguage(userMessage?: string): string {
  if (typeof window === 'undefined') return 'Tiếng Việt'; // SSR fallback

  // Use UserStorage for user-scoped settings with fallback
  let aiLanguage = 'auto';
  let customLanguage = '';

  // For now, fallback to localStorage until we can refactor this to be async
  // TODO: Refactor this function to be async when UserStorage is properly integrated
  aiLanguage = localStorage.getItem('ai_language') || 'auto';
  customLanguage = localStorage.getItem('ai_custom_language') || '';

  // Auto detect mode
  if (aiLanguage === 'auto' && userMessage) {
    return detectLanguageFromMessage(userMessage);
  }

  if (aiLanguage === 'custom' && customLanguage.trim()) {
    return customLanguage.trim();
  }

  const languageMap: Record<string, string> = {
    'vietnamese': 'Tiếng Việt',
    'english': 'English',
    'japanese': '日本語'
  };

  return languageMap[aiLanguage] || 'Tiếng Việt';
}

/**
 * Get optimized language instruction for system prompt
 */
export function getLanguageInstruction(userMessage?: string): string {
  if (typeof window === 'undefined') return '';

  const aiLanguage = localStorage.getItem('ai_language') || 'vietnamese';
  const language = getAICommunicationLanguage(userMessage);

  if (aiLanguage === 'auto') {
    return `Respond in the user's language. Adapt cultural communication style naturally.`;
  }

  return createCulturalLanguageInstruction(language);
}

/**
 * Create cultural-aware language instruction
 */
function createCulturalLanguageInstruction(language: string): string {
  // Known cultural patterns
  const culturalInstructions: Record<string, string> = {
    'Tiếng Việt': `Respond in Vietnamese. Use "Cô" (teacher) and "em" (student) naturally.`,
    'English': `Respond in English with warm, encouraging teacher tone.`,
    '日本語': `Respond in Japanese using appropriate sensei-student honorifics.`
  };

  // If it's a known language with specific cultural patterns
  if (culturalInstructions[language]) {
    return culturalInstructions[language];
  }

  // For custom languages, create adaptive instruction
  return `Respond in ${language}. Use culturally appropriate teacher-student communication style for ${language} speakers.`;
}
