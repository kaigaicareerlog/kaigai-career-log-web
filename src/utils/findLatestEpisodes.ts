import type { PodcastEpisode } from '../types';
import {
  findLatestEpisodesFile,
  readEpisodeCatalog,
} from './findLatestEpisodesFile';

/**
 * Episodes from the newest catalog that is safe to publish.
 * See `chooseEpisodeCatalog` for when a newer file is skipped.
 */
export function findLatestEpisodes(rssDir?: string): PodcastEpisode[] {
  const latestFile = findLatestEpisodesFile(rssDir);
  const episodes = readEpisodeCatalog(latestFile);

  if (!episodes) {
    throw new Error(`Episodes file is not a catalog: ${latestFile}`);
  }

  return episodes;
}
