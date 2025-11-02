/**
 * Extracts Spotify episode ID from a Spotify URL and returns the embed URL
 * @param url - Spotify episode URL (e.g., https://open.spotify.com/episode/1pCYF2Hh9auRtTCELuPK8e)
 * @returns Spotify embed URL or null if URL is invalid
 */
export function getSpotifyEmbedUrl(url: string | undefined): string | null {
  if (!url) return null;

  const match = url.match(/episode\/([a-zA-Z0-9]+)/);
  if (match && match[1]) {
    return `https://open.spotify.com/embed/episode/${match[1]}`;
  }

  return null;
}

