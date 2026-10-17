import type { EpisodeMetaMap } from '../../types';

/** Number of different cities tagged across all episodes */
export function countDistinctCities(map: EpisodeMetaMap): number {
  return new Set(Object.values(map).flatMap((meta) => meta.cities)).size;
}
