/**
 * Script to update episode URLs by GUID
 * Usage: tsx scripts/update-episode-urls.ts <guid> [spotify_url] [youtube_url] [apple_podcast_url] [amazon_music_url]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { RSSChannel } from '../src/types';
import { findLatestEpisodesFile } from '../src/utils/findLatestEpisodesFile';

/**
 * Update episode URLs
 */
function updateEpisodeUrls(
  guid: string,
  spotifyUrl: string,
  youtubeUrl: string,
  applePodcastUrl: string,
  amazonMusicUrl: string
): void {
  const latestFile = findLatestEpisodesFile();

  console.log(`Reading episodes from: ${latestFile}`);
  const data: RSSChannel = JSON.parse(fs.readFileSync(latestFile, 'utf-8'));

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
    console.log('No URLs provided to update');
    return;
  }

  // Update lastUpdated timestamp
  data.lastUpdated = new Date().toISOString();

  // Write back to file
  fs.writeFileSync(latestFile, JSON.stringify(data, null, 2), 'utf-8');
  console.log(
    `✅ Successfully updated episode URLs in ${path.basename(latestFile)}`
  );
}

// Main execution
const args = process.argv.slice(2);

if (args.length < 1) {
  console.error(
    'Usage: tsx scripts/update-episode-urls.ts <guid> [spotify_url] [youtube_url] [apple_podcast_url] [amazon_music_url]'
  );
  process.exit(1);
}

const [guid, spotifyUrl, youtubeUrl, applePodcastUrl, amazonMusicUrl] = args;

try {
  updateEpisodeUrls(
    guid,
    spotifyUrl || '',
    youtubeUrl || '',
    applePodcastUrl || '',
    amazonMusicUrl || ''
  );
} catch (error) {
  console.error('❌ Error:', (error as Error).message);
  process.exit(1);
}
