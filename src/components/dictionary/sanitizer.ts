/*
 * DOMPurify-based sanitizer wrapper
 */

import DOMPurify from 'dompurify';

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p','div','span','ul','ol','li','b','i','strong','em','br','hr',
      'table','thead','tbody','tr','td','th','article','section','h1','h2','h3','h4','h5','h6','small','sup','sub','code','pre'
    ],
    ALLOWED_ATTR: ['class','id','lang','data-tab-name'],
    FORBID_TAGS: ['script','iframe','object','embed','link'],
    KEEP_CONTENT: true,
  });
}

