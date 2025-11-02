import type { SpotifyEpisode } from '../../types';

/**
 * Find Spotify episode URL by matching title
 */
export function findSpotifyEpisodeByTitle(
  episodes: SpotifyEpisode[],
  title: string
): string | null {
  // Filter out any null/undefined episodes and episodes without names
  const validEpisodes = episodes.filter((ep) => ep && ep.name);

  // Try exact match first
  const exactMatch = validEpisodes.find((ep) => ep.name === title);
  if (exactMatch) {
    return exactMatch.external_urls.spotify;
  }

  // Try normalized match (remove extra spaces, normalize characters)
  const normalizedTitle = title.trim().replace(/\s+/g, ' ');
  const normalizedMatch = validEpisodes.find(
    (ep) => ep.name.trim().replace(/\s+/g, ' ') === normalizedTitle
  );
  if (normalizedMatch) {
    return normalizedMatch.external_urls.spotify;
  }

  // Try partial match (title contains the search term or vice versa)
  const partialMatch = validEpisodes.find(
    (ep) => ep.name.includes(title) || title.includes(ep.name)
  );
  if (partialMatch) {
    return partialMatch.external_urls.spotify;
  }

  return null;
}

