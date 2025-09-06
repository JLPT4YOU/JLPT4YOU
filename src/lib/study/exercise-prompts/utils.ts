/**
 * Utility functions for exercise prompt generation
 */

import { mapLanguageInstruction } from '../../shared/language-utils';

export function formatMaterials(materials: any[], type: string): string {
  return materials.slice(0, 20).map(m => {
    if (type === 'vocabulary') {
      return `- ${m.content.word} (${m.content.reading}): ${m.content.meaning}`;
    } else if (type === 'grammar') {
      return `- ${m.content.pattern}: ${m.content.meaning}`;
    } else if (type === 'reading') {
      if (m.type === 'vocabulary') {
        return `- Vocabulary: ${m.content.word} (${m.content.reading}): ${m.content.meaning}`;
      } else if (m.type === 'grammar') {
        return `- Grammar: ${m.content.pattern}: ${m.content.meaning}`;
      }
    }
    return JSON.stringify(m.content);
  }).join('\n');
}

export function getLanguageInstruction(explainLanguage: string): string {
  return mapLanguageInstruction(explainLanguage);
}

export function validateExerciseResponse(response: string): any[] | null {
  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('No JSON array found in response');
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) {
      console.error('Response is not an array');
      return null;
    }

    return parsed;
  } catch (error) {
    console.error('Failed to parse exercise response:', error);
    return null;
  }
}
