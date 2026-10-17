import type { TagPage } from './getTagPages';

/**
 * Other tag pages that share the most episodes with `page`, most shared
 * first. Used for the "related topics" links on a tag page. Tags that only
 * overlap in a single episode are left out as coincidence.
 */
export function getCoOccurringTags(
  page: TagPage,
  allPages: readonly TagPage[],
  limit = 8,
  minShared = 2
): TagPage[] {
  const guids = new Set(page.episodes.map((episode) => episode.guid));

  return allPages
    .filter((other) => other.slug !== page.slug)
    .map((other) => ({
      other,
      shared: other.episodes.filter((episode) => guids.has(episode.guid))
        .length,
    }))
    .filter(({ shared }) => shared >= minShared)
    .sort((a, b) => b.shared - a.shared)
    .slice(0, limit)
    .map(({ other }) => other);
}
