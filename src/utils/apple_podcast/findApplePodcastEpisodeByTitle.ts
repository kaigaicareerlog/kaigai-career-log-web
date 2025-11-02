import type { ApplePodcastEpisode } from './types';

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

