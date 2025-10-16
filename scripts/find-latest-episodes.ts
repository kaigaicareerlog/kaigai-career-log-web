#!/usr/bin/env node
/**
 * Script to find the latest episodes.json file in the public/rss directory
 * This is used by GitHub Actions to determine which file to update
 *
 * Usage:
 *   npm run find-latest-episodes
 *
 * Output:
 *   Prints the path to the latest episodes.json file
 */

import { readdir } from "fs/promises";
import { resolve } from "path";

async function findLatestEpisodesFile(): Promise<string> {
  const rssDir = resolve(process.cwd(), "public/rss");

  try {
    const files = await readdir(rssDir);

    // Filter for episodes.json files with timestamp format: YYYYMMDD-HHMM-episodes.json
    const episodesFiles = files
      .filter((file) => file.match(/^\d{8}-\d{4}-episodes\.json$/))
      .sort()
      .reverse(); // Sort in descending order (latest first)

    if (episodesFiles.length === 0) {
      throw new Error("No episodes.json files found in public/rss directory");
    }

    const latestFile = resolve(rssDir, episodesFiles[0]);
    return latestFile;
  } catch (error) {
    throw new Error(
      `Failed to find episodes file: ${(error as Error).message}`
    );
  }
}

// Main execution
findLatestEpisodesFile()
  .then((latestFile) => {
    // Output just the file path (for GitHub Actions to capture)
    console.log(latestFile);
  })
  .catch((error) => {
    console.error(`Error: ${error.message}`, { stream: "stderr" });
    process.exit(1);
  });
