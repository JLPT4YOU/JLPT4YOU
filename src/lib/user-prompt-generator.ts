/**
 * User Prompt Generator
 * Tạo prompt riêng biệt cho user không liên quan đến core iRIN
 * Sau đó kết hợp với core prompt
 *
 * QUAN TRỌNG: File này PHẢI sử dụng direct API call để tránh inject core iRIN identity
 * qua systemInstruction. Không được sử dụng AI service wrapper vì nó sẽ tự động
 * thêm getCurrentSystemPrompt() vào mọi request.
 */



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
 * HYBRID APPROACH: Sử dụng secure wrapper để lấy API key, nhưng gọi direct API
 * để tránh inject core iRIN identity qua systemInstruction
 */
export async function generateUserPrompt(inputs: UserPromptInputs): Promise<string> {
  try {
    // Validate inputs
    if (!inputs.preferredName?.trim()) {
      throw new Error('Tên gọi mong muốn là bắt buộc');
    }

    // Call secure backend to generate user-specific prompt (no core injection)
    const res = await fetch('/api/ai-proxy/generate-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inputs)
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Server error ${res.status}: ${txt}`);
    }

    const data = await res.json();
    const generatedPrompt = (data?.generatedPrompt || '').toString();

    if (!generatedPrompt.trim()) {
      throw new Error('Không thể tạo prompt. Vui lòng thử lại.');
    }

    return generatedPrompt.trim();
  } catch (error) {
    console.error('Error generating user prompt:', error);

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        throw new Error('Bạn cần đăng nhập để tạo prompt cá nhân hóa');
      }
      if (error.message.toLowerCase().includes('api key')) {
        throw new Error('Cần cấu hình Gemini API key trong Settings để tạo prompt');
      }
      throw new Error(`Lỗi tạo prompt: ${error.message}`);
    }
    throw new Error('Lỗi tạo prompt: Unknown error');
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
import { sanitizeText } from './shared/sanitize-utils'
function sanitizeInput(input: string): string {
  return sanitizeText(input, 300)
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
