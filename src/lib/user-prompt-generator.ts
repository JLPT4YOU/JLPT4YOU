/**
 * User Prompt Generator
 * Tạo prompt riêng biệt cho user không liên quan đến core iRIN
 * Sau đó kết hợp với core prompt
 */

import { GoogleGenAI } from '@google/genai';
import { GEMINI_MODELS } from './gemini-config';

export interface UserPromptInputs {
  preferredName: string;        // Tên gọi mong muốn
  desiredTraits: string;        // Đặc điểm mong muốn
  personalInfo: string;         // Thông tin cá nhân
  additionalRequests: string;   // Yêu cầu bổ sung
}

export interface UserPromptConfig {
  inputs: UserPromptInputs;
  generatedUserPrompt: string;
  createdAt: string;
  updatedAt: string;
}

// Storage keys riêng biệt
const USER_PROMPT_STORAGE_KEY = 'user_custom_prompt_config';

/**
 * Tạo prompt user thuần túy không có core identity
 */
export async function generateUserPrompt(inputs: UserPromptInputs): Promise<string> {
  try {
    // Validate inputs
    if (!inputs.preferredName.trim()) {
      throw new Error('Tên gọi mong muốn là bắt buộc');
    }

    // Tạo instruction tối ưu cho việc tạo prompt user
    const promptInstruction = `You are a professional Prompt Engineer. I need you to create a personalized communication prompt for an AI assistant.

Here is what the user wants:

1. "Please call me: ${inputs.preferredName}"
2. "I want you to have these characteristics: ${inputs.desiredTraits}"
3. "I want you to know about me: ${inputs.personalInfo}"
4. "I want you to pay attention to: ${inputs.additionalRequests}"

Based on this information, create a prompt that helps the AI understand who I am and what my needs are.

REQUIREMENTS:
- DO NOT mention AI identity or name (avoid "you are", "your name is")
- Focus on communication style and user preferences
- Maximum 250 words
- Use clear, direct instructions
- Structure it as guidance for how to communicate with this specific user

Create an optimized prompt that captures the user's identity and communication preferences.`;

    // Sử dụng Gemini trực tiếp (KHÔNG qua service để tránh inject core identity)
    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) {
      throw new Error('Cần cấu hình Gemini API key để tạo prompt');
    }

    const client = new GoogleGenAI({ apiKey });

    // Gọi trực tiếp API mà KHÔNG có systemInstruction
    const response = await client.models.generateContent({
      model: GEMINI_MODELS.FLASH_2_0,
      contents: [{
        role: 'user',
        parts: [{ text: promptInstruction }]
      }],
      config: {
        temperature: 0.8,
        maxOutputTokens: 400
        // QUAN TRỌNG: KHÔNG có systemInstruction để tránh inject core identity
      }
    });

    const generatedPrompt = response.text?.trim();
    if (!generatedPrompt) {
      throw new Error('Không thể tạo prompt. Vui lòng thử lại.');
    }

    return generatedPrompt;

  } catch (error) {
    console.error('Error generating user prompt:', error);
    throw new Error(`Lỗi tạo prompt: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Lưu user prompt config
 */
export function saveUserPromptConfig(config: UserPromptConfig): void {
  try {
    const configToSave = {
      ...config,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(USER_PROMPT_STORAGE_KEY, JSON.stringify(configToSave));
  } catch (error) {
    throw new Error('Không thể lưu cấu hình prompt');
  }
}

/**
 * Lấy user prompt config
 */
export function getUserPromptConfig(): UserPromptConfig | null {
  try {
    const stored = localStorage.getItem(USER_PROMPT_STORAGE_KEY);
    if (!stored) return null;

    const config = JSON.parse(stored);
    
    // Validate config structure
    if (!config.inputs || !config.generatedUserPrompt) {
      return null;
    }

    return config;
  } catch (error) {
    console.error('Error loading user prompt config:', error);
    return null;
  }
}

/**
 * Xóa user prompt config
 */
export function clearUserPromptConfig(): void {
  try {
    localStorage.removeItem(USER_PROMPT_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing user prompt config:', error);
  }
}

/**
 * Kết hợp core prompt với user prompt
 */
export function combinePrompts(corePrompt: string, userPrompt: string): string {
  if (!userPrompt.trim()) {
    return corePrompt;
  }

  // Kết hợp một cách tự nhiên
  return `${corePrompt}

${userPrompt}

Apply the above communication style in all conversations with the user.`;
}

/**
 * Tạo và lưu user prompt hoàn chỉnh
 */
export async function createAndSaveUserPrompt(inputs: UserPromptInputs): Promise<UserPromptConfig> {
  try {
    // Sanitize inputs
    const sanitizedInputs = {
      preferredName: sanitizeInput(inputs.preferredName),
      desiredTraits: sanitizeInput(inputs.desiredTraits),
      personalInfo: sanitizeInput(inputs.personalInfo),
      additionalRequests: sanitizeInput(inputs.additionalRequests)
    };

    // Generate prompt
    const generatedUserPrompt = await generateUserPrompt(sanitizedInputs);

    // Create config
    const config: UserPromptConfig = {
      inputs: sanitizedInputs,
      generatedUserPrompt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save config
    saveUserPromptConfig(config);

    return config;
  } catch (error) {
    console.error('Error creating and saving user prompt:', error);
    throw error;
  }
}

/**
 * Sanitize user input
 */
function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  // Remove potentially dangerous patterns
  const forbiddenPatterns = [
    /you are not/gi,
    /ignore previous/gi,
    /forget that/gi,
    /act as if/gi,
    /pretend to be/gi,
    /system\s*:/gi,
    /assistant\s*:/gi,
    /human\s*:/gi
  ];

  let sanitized = input;
  forbiddenPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[FILTERED]');
  });

  return sanitized.slice(0, 300).trim();
}

/**
 * Kiểm tra xem có user prompt config không
 */
export function hasUserPromptConfig(): boolean {
  return getUserPromptConfig() !== null;
}

/**
 * Lấy user prompt để kết hợp với core
 */
export function getUserPromptForCombination(): string {
  const config = getUserPromptConfig();
  return config?.generatedUserPrompt || '';
}

/**
 * Preview kết hợp prompt
 */
export function previewCombinedPrompt(corePrompt: string): string {
  const userPrompt = getUserPromptForCombination();
  return combinePrompts(corePrompt, userPrompt);
}
