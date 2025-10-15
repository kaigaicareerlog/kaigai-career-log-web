/**
 * Script to update episode URLs by GUID
 * Usage: node scripts/update-episode-urls.js <guid> [spotify_url] [youtube_url] [apple_podcast_url] [amazon_music_url]
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Find the latest episodes file
 */
function findLatestEpisodesFile(rssDir) {
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
 * Update episode URLs
 */
function updateEpisodeUrls(guid, spotifyUrl, youtubeUrl, applePodcastUrl, amazonMusicUrl) {
  const rssDir = path.join(__dirname, "..", "public", "rss");
  const latestFile = findLatestEpisodesFile(rssDir);

  console.log(`Reading episodes from: ${latestFile}`);
  const data = JSON.parse(fs.readFileSync(latestFile, "utf-8"));

  // Find episode by GUID
  const episode = data.episodes.find((ep) => ep.guid === guid);

  if (!episode) {
    throw new Error(`Episode with GUID ${guid} not found`);
  }

  console.log(`Found episode: ${episode.title}`);

  // Update URLs (only if provided)
  let updated = false;
  if (spotifyUrl) {
    episode.spotifyUrl = spotifyUrl;
    console.log(`  ✓ Updated Spotify URL`);
    updated = true;
  }
  if (youtubeUrl) {
    episode.youtubeUrl = youtubeUrl;
    console.log(`  ✓ Updated YouTube URL`);
    updated = true;
  }
  if (applePodcastUrl) {
    episode.applePodcastUrl = applePodcastUrl;
    console.log(`  ✓ Updated Apple Podcast URL`);
    updated = true;
  }
  if (amazonMusicUrl) {
    episode.amazonMusicUrl = amazonMusicUrl;
    console.log(`  ✓ Updated Amazon Music URL`);
    updated = true;
  }

  if (!updated) {
    console.log("No URLs provided to update");
    return;
  }

  // Update lastUpdated timestamp
  data.lastUpdated = new Date().toISOString();

  // Write back to file
  fs.writeFileSync(latestFile, JSON.stringify(data, null, 2), "utf-8");
  console.log(`✅ Successfully updated episode URLs in ${path.basename(latestFile)}`);
}

// Main execution
const args = process.argv.slice(2);

if (args.length < 1) {
  console.error(
    "Usage: node scripts/update-episode-urls.js <guid> [spotify_url] [youtube_url] [apple_podcast_url] [amazon_music_url]"
  );
  process.exit(1);
}

const [guid, spotifyUrl, youtubeUrl, applePodcastUrl, amazonMusicUrl] = args;

try {
  updateEpisodeUrls(
    guid,
    spotifyUrl || "",
    youtubeUrl || "",
    applePodcastUrl || "",
    amazonMusicUrl || ""
  );
} catch (error) {
  console.error("❌ Error:", error.message);
  process.exit(1);
}

