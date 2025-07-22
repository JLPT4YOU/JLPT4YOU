/**
 * Test cases for thinking mode logic
 * Ensures only PRO_2_5 auto-enables thinking, others let user decide
 */

import { shouldAutoEnableThinking, supportsThinking, supportsCodeExecution, getRecommendedSettings } from '../model-utils';
import { GEMINI_MODELS } from '../gemini-config';

describe('Thinking Mode Logic', () => {
  describe('shouldAutoEnableThinking', () => {
    it('should return true only for PRO_2_5', () => {
      expect(shouldAutoEnableThinking(GEMINI_MODELS.PRO_2_5)).toBe(true);
    });

    it('should return false for other 2.5 models', () => {
      expect(shouldAutoEnableThinking(GEMINI_MODELS.FLASH_2_5)).toBe(false);
      expect(shouldAutoEnableThinking(GEMINI_MODELS.FLASH_LITE_2_5)).toBe(false);
      expect(shouldAutoEnableThinking(GEMINI_MODELS.FLASH_PREVIEW_2_5)).toBe(false);
    });

    it('should return false for non-2.5 models', () => {
      expect(shouldAutoEnableThinking(GEMINI_MODELS.FLASH_2_0)).toBe(false);
      expect(shouldAutoEnableThinking(GEMINI_MODELS.PRO_1_5)).toBe(false);
    });
  });

  describe('supportsThinking', () => {
    it('should return true for all 2.5 models', () => {
      expect(supportsThinking(GEMINI_MODELS.PRO_2_5)).toBe(true);
      expect(supportsThinking(GEMINI_MODELS.FLASH_2_5)).toBe(true);
      expect(supportsThinking(GEMINI_MODELS.FLASH_LITE_2_5)).toBe(true);
      expect(supportsThinking(GEMINI_MODELS.FLASH_PREVIEW_2_5)).toBe(true);
    });

    it('should return false for non-2.5 models', () => {
      expect(supportsThinking(GEMINI_MODELS.FLASH_2_0)).toBe(false);
      expect(supportsThinking(GEMINI_MODELS.PRO_1_5)).toBe(false);
    });
  });

  describe('supportsCodeExecution', () => {
    it('should return true for 2.5 models only', () => {
      expect(supportsCodeExecution(GEMINI_MODELS.PRO_2_5)).toBe(true);
      expect(supportsCodeExecution(GEMINI_MODELS.FLASH_2_5)).toBe(true);
      expect(supportsCodeExecution(GEMINI_MODELS.FLASH_LITE_2_5)).toBe(true);
      expect(supportsCodeExecution(GEMINI_MODELS.FLASH_PREVIEW_2_5)).toBe(true);
    });

    it('should return false for 2.0 models', () => {
      expect(supportsCodeExecution(GEMINI_MODELS.FLASH_2_0)).toBe(false);
      expect(supportsCodeExecution(GEMINI_MODELS.FLASH_LITE_2_0)).toBe(false);
      expect(supportsCodeExecution(GEMINI_MODELS.FLASH_EXP_2_0)).toBe(false);
    });

    it('should return false for older models', () => {
      expect(supportsCodeExecution(GEMINI_MODELS.PRO_1_5)).toBe(false);
    });
  });

  describe('getRecommendedSettings', () => {
    it('should auto-enable thinking only for PRO_2_5', () => {
      const pro25Settings = getRecommendedSettings(GEMINI_MODELS.PRO_2_5);
      expect(pro25Settings.enableThinking).toBe(true);
    });

    it('should NOT auto-enable thinking for other 2.5 models', () => {
      const flash25Settings = getRecommendedSettings(GEMINI_MODELS.FLASH_2_5);
      expect(flash25Settings.enableThinking).toBe(false);

      const flashLite25Settings = getRecommendedSettings(GEMINI_MODELS.FLASH_LITE_2_5);
      expect(flashLite25Settings.enableThinking).toBe(false);
    });

    it('should NOT auto-enable thinking for non-2.5 models', () => {
      const flash20Settings = getRecommendedSettings(GEMINI_MODELS.FLASH_2_0);
      expect(flash20Settings.enableThinking).toBe(false);

      const pro15Settings = getRecommendedSettings(GEMINI_MODELS.PRO_1_5);
      expect(pro15Settings.enableThinking).toBe(false);
    });
  });

  describe('Integration Test - Model Selection Flow', () => {
    it('should follow correct thinking mode behavior for each model', () => {
      const testCases = [
        {
          model: GEMINI_MODELS.PRO_2_5,
          supportsThinking: true,
          shouldAutoEnable: true,
          description: 'PRO_2_5 supports thinking and auto-enables'
        },
        {
          model: GEMINI_MODELS.FLASH_2_5,
          supportsThinking: true,
          shouldAutoEnable: false,
          description: 'FLASH_2_5 supports thinking but defaults to OFF (user decides)'
        },
        {
          model: GEMINI_MODELS.FLASH_LITE_2_5,
          supportsThinking: true,
          shouldAutoEnable: false,
          description: 'FLASH_LITE_2_5 supports thinking but defaults to OFF (user decides)'
        },
        {
          model: GEMINI_MODELS.FLASH_2_0,
          supportsThinking: false,
          shouldAutoEnable: false,
          description: 'FLASH_2_0 does not support thinking or code execution'
        },
        {
          model: GEMINI_MODELS.PRO_1_5,
          supportsThinking: false,
          shouldAutoEnable: false,
          description: 'PRO_1_5 does not support thinking'
        }
      ];

      testCases.forEach(({ model, supportsThinking: expectedSupport, shouldAutoEnable, description }) => {
        expect(supportsThinking(model)).toBe(expectedSupport);
        expect(shouldAutoEnableThinking(model)).toBe(shouldAutoEnable);
        
        const settings = getRecommendedSettings(model);
        expect(settings.enableThinking).toBe(shouldAutoEnable);
        
        console.log(`✓ ${description}`);
      });
    });
  });

  describe('Model Switching Behavior', () => {
    it('should reset thinking to OFF when switching to non-PRO_2_5 models', () => {
      // Simulate user switching from PRO_2_5 (thinking ON) to FLASH_2_5
      const pro25Settings = getRecommendedSettings(GEMINI_MODELS.PRO_2_5);
      expect(pro25Settings.enableThinking).toBe(true);

      // When switching to FLASH_2_5, thinking should reset to OFF
      const flash25Settings = getRecommendedSettings(GEMINI_MODELS.FLASH_2_5);
      expect(flash25Settings.enableThinking).toBe(false);

      console.log('✓ Thinking resets to OFF when switching from PRO_2_5 to FLASH_2_5');
    });

    it('should maintain OFF state when switching between non-PRO_2_5 models', () => {
      // Both should default to OFF
      const flash25Settings = getRecommendedSettings(GEMINI_MODELS.FLASH_2_5);
      const flashLite25Settings = getRecommendedSettings(GEMINI_MODELS.FLASH_LITE_2_5);

      expect(flash25Settings.enableThinking).toBe(false);
      expect(flashLite25Settings.enableThinking).toBe(false);

      console.log('✓ Both FLASH_2_5 and FLASH_LITE_2_5 default to OFF');
    });
  });
});
