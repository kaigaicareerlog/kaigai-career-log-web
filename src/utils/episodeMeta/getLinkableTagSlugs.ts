import { getLatestEpisodes } from '../getLatestEpisodes';
import { readEpisodeMetaMap } from './episodeMetaFile';
import { getTagPages } from './getTagPages';

let cached: Promise<ReadonlySet<string>> | null = null;

/**
 * Slugs of the tags that have a page, so badges only link to pages that
 * exist. Computed once per build.
 */
export function getLinkableTagSlugs(): Promise<ReadonlySet<string>> {
  cached ??= getLatestEpisodes().then(
    ({ episodes }) =>
      new Set(
        getTagPages(episodes, readEpisodeMetaMap()).map((page) => page.slug)
      )
  );
  return cached;
}
