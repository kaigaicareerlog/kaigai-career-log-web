import type { PodcastEpisode } from '../../types';
import { findLatestEpisodesFile } from '../findLatestEpisodesFile';
import fs from 'fs';
import path from 'path';

/**
 * Load existing episodes from the latest episodes file
 */
export function loadExistingEpisodes(): Map<string, PodcastEpisode> {
  const episodeMap = new Map<string, PodcastEpisode>();

  const latestFile = findLatestEpisodesFile();

  if (latestFile && fs.existsSync(latestFile)) {
    try {
      const existingData = JSON.parse(fs.readFileSync(latestFile, 'utf-8'));

      // Handle both old format (with channel) and new format (array only)
      const episodes = Array.isArray(existingData)
        ? existingData
        : existingData.episodes || [];

      episodes.forEach((episode: PodcastEpisode) => {
        episodeMap.set(episode.guid, episode);
      });
      console.log(
        `Loaded ${episodeMap.size} existing episodes from ${path.basename(
          latestFile
        )}`
      );
    } catch (error) {
      console.warn(
        'Could not load existing episodes file:',
        (error as Error).message
      );
    }
  } else {
    console.log('No existing episodes files found, creating new file');
  }

  return episodeMap;
}
