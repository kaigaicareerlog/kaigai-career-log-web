import type { PodcastEpisode } from '../types';
import { findLatestEpisodes } from './findLatestEpisodes';

export function getEpisodeByGuid({
  guid,
  episodes,
}: {
  guid: string;
  episodes?: PodcastEpisode[];
}): PodcastEpisode | null {
  if (!episodes) {
    episodes = findLatestEpisodes();
  }

  const episode = episodes.find((ep) => ep.guid === guid);

  return episode || null;
}
