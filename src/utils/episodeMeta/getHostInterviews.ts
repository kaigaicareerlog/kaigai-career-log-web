import type { EpisodeMetaMap, PodcastEpisode } from '../../types';

/**
 * Episodes where the host appeared as the guest (their own interview),
 * oldest first so the first half comes before the second.
 */
export function getHostInterviews(
  hostName: string,
  episodes: readonly PodcastEpisode[],
  metaMap: EpisodeMetaMap
): PodcastEpisode[] {
  return episodes
    .filter((episode) =>
      metaMap[episode.guid]?.guests.some((guest) => guest.name === hostName)
    )
    .reverse();
}
