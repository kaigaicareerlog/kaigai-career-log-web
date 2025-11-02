import type { PodcastEpisodeBase, PodcastEpisode } from '../../types';

/**
 * Generate episodes with metadata
 */
export function generateEpisodes(
  rssEpisodes: PodcastEpisodeBase[],
  existingEpisodes: Map<string, PodcastEpisode>
): PodcastEpisode[] {
  const episodes: PodcastEpisode[] = rssEpisodes.map((episode) => {
    const existing = existingEpisodes.get(episode.guid);

    if (existing) {
      // Keep existing episode with all its metadata
      return {
        ...episode,
        spotifyUrl: existing.spotifyUrl,
        youtubeUrl: existing.youtubeUrl,
        applePodcastUrl: existing.applePodcastUrl,
        amazonMusicUrl: existing.amazonMusicUrl,
        newEpisodeIntroPostedToX: existing.newEpisodeIntroPostedToX ?? false,
      };
    } else {
      // New episode - empty URLs and newEpisodeIntroPostedToX = false (not posted yet)
      const newEpisode: PodcastEpisode = {
        ...episode,
        spotifyUrl: '',
        youtubeUrl: '',
        applePodcastUrl: '',
        amazonMusicUrl: '',
        newEpisodeIntroPostedToX: false,
      };
      return newEpisode;
    }
  });

  // Return episodes in the order from RSS data (latest first)
  return episodes;
}
