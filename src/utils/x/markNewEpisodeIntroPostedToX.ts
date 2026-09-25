import fs from 'fs';
import type { PodcastEpisode } from '../../types';

/**
 * Marks an episode's `newEpisodeIntroPostedToX` flag as true in the given
 * episodes JSON file, so it is not picked up again by getLatestEpisodeToTweet.
 * Shared by the script that posts directly to X and the one that notifies via
 * a GitHub issue instead.
 */
export function markNewEpisodeIntroPostedToX(
  filePath: string,
  guid: string
): void {
  const episodes: PodcastEpisode[] = JSON.parse(
    fs.readFileSync(filePath, 'utf-8')
  );

  const episodeIndex = episodes.findIndex((episode) => episode.guid === guid);
  if (episodeIndex === -1) {
    console.warn(`⚠️  Episode ${guid} not found, skipping flag update`);
    return;
  }

  episodes[episodeIndex].newEpisodeIntroPostedToX = true;
  fs.writeFileSync(filePath, JSON.stringify(episodes, null, 2), 'utf-8');
}
