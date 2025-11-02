#!/usr/bin/env node
/**
 * Script to update episodes.json with Apple Podcasts URLs
 *
 * Usage:
 *   npm run update-apple-urls              # Update all episodes missing Apple Podcasts URLs
 *   npm run update-apple-urls <guid>       # Update a specific episode by GUID
 *
 * Example:
 *   npm run update-apple-urls
 *   npm run update-apple-urls cc15a703-73c7-406b-8abc-ad7d0a192d05
 *
 * Environment Variables:
 *   APPLE_PODCAST_ID - Your Apple Podcasts Show ID (optional, defaults to hardcoded value)
 *
 * Note: Apple Podcasts uses iTunes Search API which is FREE and requires NO authentication! 🎉
 */

import 'dotenv/config';
import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';
import {
  getApplePodcastEpisodes,
  findApplePodcastEpisodeByTitle,
} from '../src/utils/apple.ts';

interface Episode {
  guid: string;
  title: string;
  applePodcastUrl?: string;
  [key: string]: any;
}

// Your Apple Podcasts Show ID
// Extract from: https://podcasts.apple.com/ca/podcast/id1818019572
const DEFAULT_PODCAST_ID = '1818019572';

async function updateAppleUrls(specificGuid?: string): Promise<void> {
  // 1. Get environment variables (optional - has default)
  const podcastId = process.env.APPLE_PODCAST_ID || DEFAULT_PODCAST_ID;

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

  // 3. Find episodes that need Apple Podcasts URLs
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
      (ep) => !ep.applePodcastUrl || ep.applePodcastUrl === ''
    );
    console.log(
      `🔍 Found ${episodesToUpdate.length} episodes without Apple Podcasts URLs\n`
    );
  }

  if (episodesToUpdate.length === 0) {
    console.log('✅ All episodes already have Apple Podcasts URLs!');
    return;
  }

  // 4. Fetch all episodes from Apple Podcasts
  console.log(`🍎 Fetching all episodes from Apple Podcasts...`);
  const applePodcastEpisodes = await getApplePodcastEpisodes(podcastId);
  console.log(
    `✅ Found ${applePodcastEpisodes.length} episodes in Apple Podcasts\n`
  );

  // 5. Update episodes with Apple Podcasts URLs
  let updatedCount = 0;
  let notFoundCount = 0;

  for (const episode of episodesToUpdate) {
    console.log(`\n🔎 Processing: "${episode.title}"`);

    const appleUrl = findApplePodcastEpisodeByTitle(
      applePodcastEpisodes,
      episode.title
    );

    if (appleUrl) {
      episode.applePodcastUrl = appleUrl;
      updatedCount++;
      console.log(`   ✅ Found: ${appleUrl}`);
    } else {
      notFoundCount++;
      console.log(`   ❌ Not found in Apple Podcasts`);
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

updateAppleUrls(specificGuid).catch((error) => {
  console.error(`\n❌ Error: ${error.message}`);
  process.exit(1);
});
