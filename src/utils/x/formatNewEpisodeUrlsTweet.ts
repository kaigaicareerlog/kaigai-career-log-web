import type { PodcastEpisode } from '../../types';

/**
 * Format reply tweet with URLs
 */
export function formatNewEpisodeUrlsTweet(
  episode: PodcastEpisode
): string | null {
  const lines: string[] = [];

  // Add URLs if they exist
  if (episode.applePodcastUrl) {
    lines.push('Apple');
    lines.push(episode.applePodcastUrl);
    lines.push('');
  }

  if (episode.spotifyUrl) {
    lines.push('Spotify');
    lines.push(episode.spotifyUrl);
    lines.push('');
  }

  if (episode.youtubeUrl) {
    lines.push('Youtube');
    lines.push(episode.youtubeUrl);
    lines.push('');
  }

  if (episode.amazonMusicUrl) {
    lines.push('Amazon Music');
    lines.push(episode.amazonMusicUrl);
  }

  const result = lines.join('\n').trim();
  return result ? result : null;
}
