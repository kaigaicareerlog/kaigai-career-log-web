import type { EpisodeMeta } from '../../types';

/**
 * All tag slugs of an episode (roles, countries, cities, topics) in one
 * list. Rendered into each card's `data-tags` so the filter chips can match
 * on them in the browser.
 */
export function getEpisodeTagSlugs(meta: EpisodeMeta | undefined): string[] {
  if (!meta) return [];
  return [...meta.roles, ...meta.countries, ...meta.cities, ...meta.topics];
}
