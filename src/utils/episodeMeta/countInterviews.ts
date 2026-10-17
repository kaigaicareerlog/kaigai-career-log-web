import type { EpisodeMetaMap, PodcastEpisode } from '../../types';
import { isSpecialEpisode } from '../isSpecialEpisode';
import { getEpisodePartner } from './getEpisodePartner';

/**
 * Number of guest interviews. A two-part interview is published as two
 * episodes but counts once; special episodes (特別回) aren't interviews.
 *
 * @param episodes All episodes, newest first
 */
export function countInterviews(
  episodes: readonly PodcastEpisode[],
  map: EpisodeMetaMap
): number {
  const regular = episodes.filter(
    (episode) => !isSpecialEpisode(episode.title)
  );
  // A 後半 with a 前半 partner is the second half of an interview already
  // counted through its first half
  const secondHalves = regular.filter(
    (episode) => getEpisodePartner(episode, episodes, map)?.label === '前半'
  );
  return regular.length - secondHalves.length;
}
