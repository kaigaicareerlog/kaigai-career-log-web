/**
 * iTunes Search API utilities for fetching Apple Podcasts episode URLs
 *
 * The iTunes Search API is free and doesn't require authentication!
 *
 * API Documentation:
 * https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/
 *
 * No API key required!
 */

export interface ApplePodcastEpisode {
  trackId: number;
  trackName: string;
  description: string;
  releaseDate: string;
  trackViewUrl: string;
  collectionId: number;
  collectionName: string;
}

/**
 * Extract podcast ID from Apple Podcasts URL
 * Example: https://podcasts.apple.com/ca/podcast/海外キャリアログ/id1818019572
 * Returns: "1818019572"
 */
export function extractPodcastIdFromUrl(url: string): string | null {
  const match = url.match(/id(\d+)/);
  return match ? match[1] : null;
}

/**
 * Get all episodes from an Apple Podcasts show using iTunes Search API
 * @param podcastId - The Apple Podcasts show ID (e.g., "1818019572")
 * @param limit - Maximum number of episodes to fetch (default: 200)
 */
export async function getApplePodcastEpisodes(
  podcastId: string,
  limit: number = 200
): Promise<ApplePodcastEpisode[]> {
  const url = new URL('https://itunes.apple.com/lookup');
  url.searchParams.append('id', podcastId);
  url.searchParams.append('entity', 'podcastEpisode');
  url.searchParams.append('limit', limit.toString());

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`iTunes API error: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error(`No episodes found for podcast ID: ${podcastId}`);
  }

  // First result is the podcast itself, rest are episodes
  const episodes = data.results.slice(1) as ApplePodcastEpisode[];

  return episodes;
}

/**
 * Find Apple Podcasts episode URL by matching title
 * Uses the same fuzzy matching logic as Spotify and YouTube
 */
export function findApplePodcastEpisodeByTitle(
  episodes: ApplePodcastEpisode[],
  title: string
): string | null {
  // Filter out any null/undefined episodes
  const validEpisodes = episodes.filter(
    (episode) => episode && episode.trackName
  );

  // Try exact match first
  const exactMatch = validEpisodes.find(
    (episode) => episode.trackName === title
  );
  if (exactMatch) {
    return exactMatch.trackViewUrl;
  }

  // Try normalized match (remove extra spaces, normalize characters)
  const normalizedTitle = title.trim().replace(/\s+/g, ' ');
  const normalizedMatch = validEpisodes.find(
    (episode) =>
      episode.trackName.trim().replace(/\s+/g, ' ') === normalizedTitle
  );
  if (normalizedMatch) {
    return normalizedMatch.trackViewUrl;
  }

  // Try partial match (title contains the search term or vice versa)
  const partialMatch = validEpisodes.find(
    (episode) =>
      episode.trackName.includes(title) || title.includes(episode.trackName)
  );
  if (partialMatch) {
    return partialMatch.trackViewUrl;
  }

  return null;
}

/**
 * Search for a podcast by name using iTunes Search API
 * Useful for finding the podcast ID if you don't have it
 */
export async function searchPodcastByName(
  podcastName: string,
  limit: number = 10
): Promise<
  Array<{
    collectionId: number;
    collectionName: string;
    artistName: string;
    collectionViewUrl: string;
  }>
> {
  const url = new URL('https://itunes.apple.com/search');
  url.searchParams.append('term', podcastName);
  url.searchParams.append('media', 'podcast');
  url.searchParams.append('entity', 'podcast');
  url.searchParams.append('limit', limit.toString());

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`iTunes API error: ${response.statusText}`);
  }

  const data = await response.json();

  return data.results || [];
}
