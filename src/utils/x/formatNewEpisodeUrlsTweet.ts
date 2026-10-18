import type { PodcastEpisode } from '../../types';

/**
 * Format reply tweet with URLs. The episode page on our site goes last: X
 * builds the link card from the last URL, so the post shows the episode's
 * share image.
 */
export function formatNewEpisodeUrlsTweet(
  episode: PodcastEpisode,
  episodePageUrl: string
): string {
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
    lines.push('');
  }

  lines.push('文字起こし・聴きどころ');
  lines.push(episodePageUrl);

  return lines.join('\n').trim();
}
