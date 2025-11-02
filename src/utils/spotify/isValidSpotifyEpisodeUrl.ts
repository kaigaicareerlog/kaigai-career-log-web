/**
 * Checks if a given URL is a valid Spotify episode URL
 * @param url - URL to validate
 * @returns true if the URL is a valid Spotify episode URL
 */
export function isValidSpotifyEpisodeUrl(url: string | undefined): boolean {
  if (!url) return false;
  return /^https:\/\/open\.spotify\.com\/episode\/[a-zA-Z0-9]+/.test(url);
}

