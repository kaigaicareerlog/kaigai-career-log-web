import type { EpisodeMeta, EpisodeMetaMap, PodcastEpisode } from '../../types';

// Topics say the most about what an episode is about. Almost every episode is
// in Canada and most in Vancouver, so places only break ties.
const WEIGHTS = { topics: 2, roles: 1, cities: 0.5, countries: 0.25 } as const;

function overlap(a: readonly string[], b: readonly string[]): number {
  return a.filter((tag) => b.includes(tag)).length;
}

function score(a: EpisodeMeta, b: EpisodeMeta): number {
  return (
    overlap(a.topics, b.topics) * WEIGHTS.topics +
    overlap(a.roles, b.roles) * WEIGHTS.roles +
    overlap(a.cities, b.cities) * WEIGHTS.cities +
    overlap(a.countries, b.countries) * WEIGHTS.countries
  );
}

/**
 * Episodes most similar to `episode` by shared tags, best first. Ties keep
 * the order of `episodes` (newest first). Episodes with no tags in common are
 * never returned.
 *
 * @param episodes All episodes, newest first
 * @param excludeGuids Episodes to leave out (e.g. the one being shown)
 */
export function getRelatedEpisodes(
  episode: PodcastEpisode,
  episodes: readonly PodcastEpisode[],
  map: EpisodeMetaMap,
  excludeGuids: readonly string[] = [],
  limit = 3
): PodcastEpisode[] {
  const meta = map[episode.guid];
  if (!meta) return [];

  const skip = new Set([episode.guid, ...excludeGuids]);

  return episodes
    .filter((candidate) => !skip.has(candidate.guid) && map[candidate.guid])
    .map((candidate) => ({
      candidate,
      score: score(meta, map[candidate.guid]),
    }))
    .filter(({ score: s }) => s > 0)
    .sort((x, y) => y.score - x.score) // sort is stable: ties stay newest-first
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}
