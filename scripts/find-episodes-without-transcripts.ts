#!/usr/bin/env node
/**
 * Script to find episodes that don't have transcripts yet
 * Usage: tsx scripts/find-episodes-without-transcripts.ts [episodes-file]
 *
 * Output: JSON array of episode GUIDs that need transcription
 */

import fs from 'fs';
import path from 'path';

interface Episode {
  guid: string;
  title: string;
  [key: string]: any;
}

interface EpisodesData {
  episodes: Episode[];
  [key: string]: any;
}

/**
 * Find the latest episodes file
 */
function findLatestEpisodesFile(rssDir: string): string {
  if (!fs.existsSync(rssDir)) {
    throw new Error(`RSS directory not found: ${rssDir}`);
  }

  const files = fs.readdirSync(rssDir);
  const episodesFiles = files
    .filter((file) => file.match(/^\d{8}-\d{4}-episodes\.json$/))
    .sort()
    .reverse();

  if (episodesFiles.length === 0) {
    throw new Error('No episodes files found');
  }

  return path.join(rssDir, episodesFiles[0]);
}

/**
 * Check if a transcript exists for an episode
 */
function hasTranscript(guid: string, transcriptsDir: string): boolean {
  const transcriptPath = path.join(transcriptsDir, `${guid}.json`);
  return fs.existsSync(transcriptPath);
}

async function main() {
  try {
    // Get episodes file path from argument or find latest
    const episodesFilePath =
      process.argv[2] ||
      findLatestEpisodesFile(path.join(process.cwd(), 'public/rss'));

    if (!fs.existsSync(episodesFilePath)) {
      throw new Error(`Episodes file not found: ${episodesFilePath}`);
    }

    // Load episodes data
    const episodesData: EpisodesData = JSON.parse(
      fs.readFileSync(episodesFilePath, 'utf-8')
    );

    const transcriptsDir = path.join(process.cwd(), 'public/transcripts');

    // Find episodes without transcripts
    const episodesWithoutTranscripts = episodesData.episodes
      .filter((episode) => !hasTranscript(episode.guid, transcriptsDir))
      .map((episode) => ({
        guid: episode.guid,
        title: episode.title,
      }));

    // Output as JSON for GitHub Actions
    console.log(JSON.stringify(episodesWithoutTranscripts, null, 2));

    // Exit with code 0 if no episodes need transcription, 1 if there are episodes
    process.exit(episodesWithoutTranscripts.length > 0 ? 0 : 0);
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`, { stream: 'stderr' });
    process.exit(1);
  }
}

main();
