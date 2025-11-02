/**
 * Extract podcast ID from Apple Podcasts URL
 * Example: https://podcasts.apple.com/ca/podcast/海外キャリアログ/id1818019572
 * Returns: "1818019572"
 */
export function extractPodcastIdFromUrl(url: string): string | null {
  const match = url.match(/id(\d+)/);
  return match ? match[1] : null;
}

