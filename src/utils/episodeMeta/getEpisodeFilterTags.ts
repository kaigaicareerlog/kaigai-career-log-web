import { SPECIAL_EPISODE_FILTER } from '../../constants/episodeFilters';
import type { EpisodeMeta } from '../../types';
import { isSpecialEpisode } from '../isSpecialEpisode';
import { getEpisodeTagSlugs } from './getEpisodeTagSlugs';

/**
 * Everything the filter chips can match on for one episode: its tag slugs
 * plus `special` when it is a 特別回. Rendered into each card's `data-tags`.
 */
export function getEpisodeFilterTags(
  title: string,
  meta: EpisodeMeta | undefined
): string[] {
  return [
    ...getEpisodeTagSlugs(meta),
    ...(isSpecialEpisode(title) ? [SPECIAL_EPISODE_FILTER.slug] : []),
  ];
}
