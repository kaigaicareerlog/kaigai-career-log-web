/** Font sizes to try, largest first */
const FONT_SIZES = [54, 50, 46, 42, 38];
const MAX_LINES = 3;

/**
 * Rough width of text in ems: full-width (Japanese) characters are 1em,
 * Latin letters, digits and ASCII punctuation about 0.6em in Noto Sans JP Bold.
 */
export function estimateEms(text: string): number {
  let ems = 0;
  for (const char of text) {
    ems += char.charCodeAt(0) < 0x2000 ? 0.6 : 1;
  }
  return ems;
}

/** How many lines the phrases take when wrapped only between phrases */
export function countLines(
  phrases: string[],
  fontSize: number,
  maxWidth: number
): number {
  let lines = 1;
  let used = 0;
  for (const phrase of phrases) {
    const width = estimateEms(phrase) * fontSize;
    if (used > 0 && used + width > maxWidth) {
      lines++;
      used = 0;
    }
    used += width;
  }
  return lines;
}

/**
 * The largest font size at which the title fits in three lines, wrapping
 * only between phrases. Falls back to the smallest size.
 */
export function fitTitleFontSize(phrases: string[], maxWidth: number): number {
  return (
    FONT_SIZES.find(
      (size) => countLines(phrases, size, maxWidth) <= MAX_LINES
    ) ?? FONT_SIZES[FONT_SIZES.length - 1]
  );
}
