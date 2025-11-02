import fs from 'fs';
import path from 'path';
import type { PodcastEpisode } from '../types';
import { findLatestEpisodesFile } from './findLatestEpisodesFile';

/**
 * Find episode that needs to be posted to X
 */
export function getLatestEpisodeToTweet(): PodcastEpisode | null {
  const rssDir = path.join(process.cwd(), 'public', 'rss');
  const latestFile = findLatestEpisodesFile(rssDir);

  console.log(`Reading episodes from: ${latestFile}`);
  const data: PodcastEpisode[] = JSON.parse(
    fs.readFileSync(latestFile, 'utf-8')
  );

  // Find the first episode with newEpisodeIntroPostedToX: false (not posted yet)
  return data.find((ep) => ep.newEpisodeIntroPostedToX === false) || null;
}
