#!/usr/bin/env node
/**
 * Script to find new episodes by comparing podcast-data.json files
 * Usage: tsx scripts/find-episodes-without-transcripts.ts [podcast-data-file]
 *
 * Output: JSON array of new episode GUIDs that need transcription
 */

import fs from 'fs';
import path from 'path';

interface Episode {
  guid: string;
  title: string;
  [key: string]: any;
}

interface PodcastData {
  episodes: Episode[];
  [key: string]: any;
}

/**
 * Find podcast-data.json files sorted by timestamp (newest first)
 */
function findPodcastDataFiles(rssDir: string): string[] {
  if (!fs.existsSync(rssDir)) {
    throw new Error(`RSS directory not found: ${rssDir}`);
  }

  const files = fs.readdirSync(rssDir);
  const podcastDataFiles = files
    .filter((file) => file.match(/^\d{8}-\d{4}-podcast-data\.json$/))
    .sort()
    .reverse(); // Newest first

  return podcastDataFiles.map((file) => path.join(rssDir, file));
}

/**
 * Get GUIDs from a podcast data file
 */
function getGuidsFromFile(filePath: string): Set<string> {
  const data: PodcastData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return new Set(data.episodes.map((ep) => ep.guid));
}

async function main() {
  try {
    const rssDir = path.join(process.cwd(), 'public/rss');

    // Get new podcast data file path from argument or find latest
    const newPodcastDataPath =
      process.argv[2] || findPodcastDataFiles(rssDir)[0];

    if (!newPodcastDataPath || !fs.existsSync(newPodcastDataPath)) {
      throw new Error(`Podcast data file not found: ${newPodcastDataPath}`);
    }

    // Load new podcast data
    const newPodcastData: PodcastData = JSON.parse(
      fs.readFileSync(newPodcastDataPath, 'utf-8')
    );

    // Find all podcast-data files sorted by timestamp
    const allPodcastDataFiles = findPodcastDataFiles(rssDir);

    // Get the previous podcast-data file (second in the sorted list)
    let previousGuids = new Set<string>();

    if (allPodcastDataFiles.length >= 2) {
      // If the provided file is in the list, find its position
      const newFileIndex = allPodcastDataFiles.indexOf(newPodcastDataPath);
      const previousFileIndex =
        newFileIndex >= 0 ? newFileIndex + 1 : allPodcastDataFiles.length - 1;

      if (previousFileIndex < allPodcastDataFiles.length) {
        const previousFile = allPodcastDataFiles[previousFileIndex];
        previousGuids = getGuidsFromFile(previousFile);
        console.error(
          `Comparing with previous file: ${path.basename(previousFile)}`,
          { stream: 'stderr' }
        );
      }
    } else {
      console.error(
        'No previous podcast data file found. All episodes are new.',
        {
          stream: 'stderr',
        }
      );
    }

    // Find new episodes (present in new file but not in previous file)
    const newEpisodes = newPodcastData.episodes
      .filter((episode) => !previousGuids.has(episode.guid))
      .map((episode) => ({
        guid: episode.guid,
        title: episode.title,
      }));

    // Output as JSON for GitHub Actions (compact format for proper capture in bash)
    console.log(JSON.stringify(newEpisodes));

    process.exit(0);
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`, { stream: 'stderr' });
    process.exit(1);
  }
}

main();
