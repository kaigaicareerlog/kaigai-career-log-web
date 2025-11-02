import type { AmazonMusicEpisode } from './types';

/**
 * Find Amazon Music episode URL by matching title
 * Uses the same fuzzy matching logic as other platforms
 */
export function findAmazonMusicEpisodeByTitle(
  episodes: AmazonMusicEpisode[],
  title: string
): string | null {
  // Filter out any null/undefined episodes
  const validEpisodes = episodes.filter((episode) => episode && episode.name);

  // Try exact match first
  const exactMatch = validEpisodes.find((episode) => episode.name === title);
  if (exactMatch) {
    return exactMatch.url;
  }

  // Try normalized match (remove extra spaces, normalize characters)
  const normalizedTitle = title.trim().replace(/\s+/g, ' ');
  const normalizedMatch = validEpisodes.find(
    (episode) => episode.name.trim().replace(/\s+/g, ' ') === normalizedTitle
  );
  if (normalizedMatch) {
    return normalizedMatch.url;
  }

  // Try partial match (title contains the search term or vice versa)
  const partialMatch = validEpisodes.find(
    (episode) => episode.name.includes(title) || title.includes(episode.name)
  );
  if (partialMatch) {
    return partialMatch.url;
  }

  return null;
}

