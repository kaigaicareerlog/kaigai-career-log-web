/**
 * Helpers for the episode search box. Used at build time (to build each
 * card's search text) and in the browser (to normalize what the user types),
 * so both sides normalize identically.
 */

/**
 * Normalizes text for matching: full-width/half-width forms are unified (NFKC),
 * letters are lowercased and whitespace is collapsed.
 */
export function normalizeSearchText(text: string): string {
  return text.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Splits a search query into normalized terms (space or full-width space).
 */
export function tokenizeQuery(query: string): string[] {
  const normalized = normalizeSearchText(query);
  return normalized === '' ? [] : normalized.split(' ');
}

/**
 * True if every term is contained in the (already normalized) search text.
 * An empty term list matches everything.
 */
export function matchesTerms(
  normalizedSearchText: string,
  terms: readonly string[]
): boolean {
  return terms.every((term) => normalizedSearchText.includes(term));
}
