import type { ApplePodcastEpisode } from './types';

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

