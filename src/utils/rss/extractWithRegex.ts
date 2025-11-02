/**
 * Extract text content from CDATA or regular text
 */
export function extractText(text: string | undefined): string {
  if (!text) return '';

  // Remove CDATA wrapper
  const cdataMatch = text.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  if (cdataMatch) {
    return cdataMatch[1].trim();
  }

  return text.trim();
}

/**
 * Extract content using regex
 */
export function extractWithRegex(text: string, regex: RegExp): string {
  const match = text.match(regex);
  if (!match) return '';

  let content = match[1] || '';
  content = extractText(content);

  // Remove HTML tags
  content = content.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  content = content
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Remove "ゲスト：" and everything after it
  const guestIndex = content.indexOf('ゲスト：');
  if (guestIndex !== -1) {
    content = content.substring(0, guestIndex).trim();
  }

  return content;
}
