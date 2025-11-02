/**
 * Extract show ID from Amazon Music URL
 * Example: https://music.amazon.co.jp/podcasts/118b5e6b-1f97-4c62-97a5-754714381b40
 * Returns: "118b5e6b-1f97-4c62-97a5-754714381b40"
 */
export function extractShowIdFromUrl(url: string): string | null {
  const match = url.match(/podcasts\/([a-zA-Z0-9-]+)/);
  return match ? match[1] : null;
}

