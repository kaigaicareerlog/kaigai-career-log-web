/**
 * Script to batch update episode URLs from a JSON file
 * Usage: tsx scripts/batch-update-urls.ts <updates-json-file>
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Episode {
  title: string;
  description: string;
  link: string;
  guid: string;
  date: string;
  duration: string;
  audioUrl: string;
  spotifyUrl: string;
  youtubeUrl: string;
  applePodcastUrl: string;
  amazonMusicUrl: string;
}

interface EpisodesData {
  channel: {
    title: string;
    description: string;
    link: string;
    language: string;
    image: string;
  };
  episodes: Episode[];
  lastUpdated: string;
}

interface EpisodeUpdate {
  guid: string;
  spotifyUrl?: string;
  youtubeUrl?: string;
  applePodcastUrl?: string;
  amazonMusicUrl?: string;
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
    throw new Error("No episodes files found");
  }

  return path.join(rssDir, episodesFiles[0]);
}

/**
 * Batch update episode URLs
 */
function batchUpdateUrls(updatesFile: string): void {
  const rssDir = path.join(__dirname, "..", "public", "rss");
  const latestFile = findLatestEpisodesFile(rssDir);

  console.log(`Reading episodes from: ${latestFile}`);
  const data: EpisodesData = JSON.parse(fs.readFileSync(latestFile, "utf-8"));

  console.log(`Reading updates from: ${updatesFile}`);
  const updates: EpisodeUpdate[] = JSON.parse(
    fs.readFileSync(updatesFile, "utf-8")
  );

  if (!Array.isArray(updates)) {
    throw new Error("Updates file must contain an array of episode updates");
  }

  let totalUpdated = 0;

  updates.forEach((update) => {
    if (!update.guid) {
      console.warn("Skipping update without GUID:", update);
      return;
    }

    const episode = data.episodes.find((ep) => ep.guid === update.guid);

    if (!episode) {
      console.warn(`Episode with GUID ${update.guid} not found`);
      return;
    }

    console.log(`\nUpdating episode: ${episode.title}`);

    let episodeUpdated = false;

    if (update.spotifyUrl !== undefined) {
      episode.spotifyUrl = update.spotifyUrl;
      console.log(`  ✓ Updated Spotify URL: ${update.spotifyUrl}`);
      episodeUpdated = true;
    }
    if (update.youtubeUrl !== undefined) {
      episode.youtubeUrl = update.youtubeUrl;
      console.log(`  ✓ Updated YouTube URL: ${update.youtubeUrl}`);
      episodeUpdated = true;
    }
    if (update.applePodcastUrl !== undefined) {
      episode.applePodcastUrl = update.applePodcastUrl;
      console.log(`  ✓ Updated Apple Podcast URL: ${update.applePodcastUrl}`);
      episodeUpdated = true;
    }
    if (update.amazonMusicUrl !== undefined) {
      episode.amazonMusicUrl = update.amazonMusicUrl;
      console.log(`  ✓ Updated Amazon Music URL: ${update.amazonMusicUrl}`);
      episodeUpdated = true;
    }

    if (episodeUpdated) {
      totalUpdated++;
    }
  });

  if (totalUpdated === 0) {
    console.log("\nNo episodes were updated");
    return;
  }

  // Update lastUpdated timestamp
  data.lastUpdated = new Date().toISOString();

  // Write back to file
  fs.writeFileSync(latestFile, JSON.stringify(data, null, 2), "utf-8");
  console.log(
    `\n✅ Successfully updated ${totalUpdated} episode(s) in ${path.basename(
      latestFile
    )}`
  );
}

// Main execution
const args = process.argv.slice(2);

if (args.length < 1) {
  console.error("Usage: tsx scripts/batch-update-urls.ts <updates-json-file>");
  process.exit(1);
}

const updatesFile = args[0];

try {
  batchUpdateUrls(updatesFile);
} catch (error) {
  console.error("❌ Error:", (error as Error).message);
  process.exit(1);
}
