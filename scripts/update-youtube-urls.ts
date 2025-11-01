#!/usr/bin/env node
/**
 * Script to update episodes.json with YouTube URLs
 *
 * Usage:
 *   npm run update-youtube-urls              # Update all episodes missing YouTube URLs
 *   npm run update-youtube-urls <guid>       # Update a specific episode by GUID
 *
 * Example:
 *   npm run update-youtube-urls
 *   npm run update-youtube-urls cc15a703-73c7-406b-8abc-ad7d0a192d05
 *
 * Environment Variables:
 *   YOUTUBE_API_KEY - Your YouTube Data API v3 key
 *   YOUTUBE_CHANNEL_ID - Your YouTube Channel ID or @handle (optional, defaults to hardcoded value)
 */

import 'dotenv/config';
import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';
import {
  getYouTubeChannelVideos,
  findYouTubeVideoByTitle,
} from '../src/utils/youtube.ts';

interface Episode {
  guid: string;
  title: string;
  youtubeUrl?: string;
  [key: string]: any;
}

interface EpisodesData {
  channel: any;
  episodes: Episode[];
}

// Your YouTube Channel ID or @handle
// Extract from: https://www.youtube.com/@kaigaicareerlog
const DEFAULT_CHANNEL_ID = '@kaigaicareerlog';

async function updateYouTubeUrls(specificGuid?: string): Promise<void> {
  // 1. Get environment variables
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID || DEFAULT_CHANNEL_ID;

  if (!apiKey) {
    throw new Error('YOUTUBE_API_KEY environment variable is required');
  }

  // 2. Load episodes.json
  const episodesPath = resolve(
    process.cwd(),
    'public/rss/20251015-1451-episodes.json'
  );
  const episodesContent = await readFile(episodesPath, 'utf-8');
  const parsedData = JSON.parse(episodesContent);

  // Handle both old format (with channel) and new format (array only)
  const episodes: Episode[] = Array.isArray(parsedData)
    ? parsedData
    : parsedData.episodes || [];

  // 3. Find episodes that need YouTube URLs
  let episodesToUpdate: Episode[];

  if (specificGuid) {
    console.log(`🔍 Looking for episode with GUID: ${specificGuid}\n`);
    const episode = episodes.find((ep) => ep.guid === specificGuid);
    if (!episode) {
      throw new Error(`Episode with GUID "${specificGuid}" not found`);
    }
    episodesToUpdate = [episode];
  } else {
    episodesToUpdate = episodes.filter(
      (ep) => !ep.youtubeUrl || ep.youtubeUrl === ''
    );
    console.log(
      `🔍 Found ${episodesToUpdate.length} episodes without YouTube URLs\n`
    );
  }

  if (episodesToUpdate.length === 0) {
    console.log('✅ All episodes already have YouTube URLs!');
    return;
  }

  // 4. Fetch all videos from YouTube channel
  console.log(`🎥 Fetching all videos from YouTube channel...`);
  const youtubeVideos = await getYouTubeChannelVideos(channelId, apiKey);
  console.log(`✅ Found ${youtubeVideos.length} videos in YouTube\n`);

  // 5. Update episodes with YouTube URLs
  let updatedCount = 0;
  let notFoundCount = 0;

  for (const episode of episodesToUpdate) {
    console.log(`\n🔎 Processing: "${episode.title}"`);

    const youtubeUrl = findYouTubeVideoByTitle(youtubeVideos, episode.title);

    if (youtubeUrl) {
      episode.youtubeUrl = youtubeUrl;
      updatedCount++;
      console.log(`   ✅ Found: ${youtubeUrl}`);
    } else {
      notFoundCount++;
      console.log(`   ❌ Not found in YouTube`);
    }
  }

  // 6. Save updated episodes.json
  if (updatedCount > 0) {
    // Save as array format (new format)
    await writeFile(
      episodesPath,
      JSON.stringify(episodes, null, 2) + '\n',
      'utf-8'
    );
    console.log(
      `\n✅ Successfully updated ${updatedCount} episode(s) in ${episodesPath}`
    );
  }

  // 7. Summary
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Updated: ${updatedCount}`);
  console.log(`   ❌ Not found: ${notFoundCount}`);
  console.log(`   📝 Total processed: ${episodesToUpdate.length}`);
}

// Main execution
const specificGuid = process.argv[2];

updateYouTubeUrls(specificGuid).catch((error) => {
  console.error(`\n❌ Error: ${error.message}`);
  process.exit(1);
});
