import { getLatestEpisodes } from '../getLatestEpisodes';
import { readEpisodeMetaMap } from './episodeMetaFile';
import { getCompanyPages } from './getCompanyPages';

let cached: Promise<ReadonlySet<string>> | null = null;

/**
 * Slugs of the companies that have a page, so company badges only link to
 * pages that exist. Computed once per build.
 */
export function getLinkableCompanySlugs(): Promise<ReadonlySet<string>> {
  cached ??= getLatestEpisodes().then(
    ({ episodes }) =>
      new Set(
        getCompanyPages(episodes, readEpisodeMetaMap()).map((page) => page.slug)
      )
  );
  return cached;
}
