import fs from 'fs';
import type { PodcastEpisode } from '../types';
import { findLatestEpisodesFile } from './findLatestEpisodesFile';

export function findLatestEpisodes(rssDir?: string): PodcastEpisode[] {
  const latestFile = findLatestEpisodesFile(rssDir);
  const data: PodcastEpisode[] = JSON.parse(
    fs.readFileSync(latestFile, 'utf-8')
  );

  return data;
}
