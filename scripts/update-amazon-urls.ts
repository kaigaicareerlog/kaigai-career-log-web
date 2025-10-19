#!/usr/bin/env node
/**
 * Script to update episodes.json with Amazon Music URLs
 *
 * Usage:
 *   npm run update-amazon-urls              # Update all episodes missing Amazon Music URLs
 *   npm run update-amazon-urls <guid>       # Update a specific episode by GUID
 *
 * Example:
 *   npm run update-amazon-urls
 *   npm run update-amazon-urls cc15a703-73c7-406b-8abc-ad7d0a192d05
 *
 * Environment Variables:
 *   AMAZON_MUSIC_SHOW_ID - Your Amazon Music Show ID (optional, defaults to hardcoded value)
 *   AMAZON_MUSIC_REGION - Amazon Music region (optional, defaults to 'co.jp')
 *
 * Note: This script uses Puppeteer for browser automation and may take 30-60 seconds to run.
 */

import 'dotenv/config';
import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';
import {
  getAmazonMusicEpisodes,
  findAmazonMusicEpisodeByTitle,
} from '../src/utils/amazon.ts';

interface Episode {
  guid: string;
  title: string;
  amazonMusicUrl?: string;
  [key: string]: any;
}

interface EpisodesData {
  channel: any;
  episodes: Episode[];
}

// Your Amazon Music Show ID
// Extract from: https://music.amazon.ca/podcasts/118b5e6b-1f97-4c62-97a5-754714381b40
const DEFAULT_SHOW_ID = '118b5e6b-1f97-4c62-97a5-754714381b40';
const DEFAULT_REGION = 'co.jp';

async function updateAmazonMusicUrls(specificGuid?: string): Promise<void> {
  // 1. Get environment variables
  const showId = process.env.AMAZON_MUSIC_SHOW_ID || DEFAULT_SHOW_ID;
  const region = process.env.AMAZON_MUSIC_REGION || DEFAULT_REGION;

  // 2. Load episodes.json
  const episodesPath = resolve(
    process.cwd(),
    'public/rss/20251015-1451-episodes.json'
  );
  const episodesContent = await readFile(episodesPath, 'utf-8');
  const episodesData: EpisodesData = JSON.parse(episodesContent);

  // 3. Find episodes that need Amazon Music URLs
  let episodesToUpdate: Episode[];

  if (specificGuid) {
    console.log(`🔍 Looking for episode with GUID: ${specificGuid}\n`);
    const episode = episodesData.episodes.find(
      (ep) => ep.guid === specificGuid
    );
    if (!episode) {
      throw new Error(`Episode with GUID "${specificGuid}" not found`);
    }
    episodesToUpdate = [episode];
  } else {
    episodesToUpdate = episodesData.episodes.filter(
      (ep) => !ep.amazonMusicUrl || ep.amazonMusicUrl === ''
    );
    console.log(
      `🔍 Found ${episodesToUpdate.length} episodes without Amazon Music URLs\n`
    );
  }

  if (episodesToUpdate.length === 0) {
    console.log('✅ All episodes already have Amazon Music URLs!');
    return;
  }

  // 4. Fetch all episodes from Amazon Music (using Puppeteer)
  console.log(`📦 Fetching all episodes from Amazon Music...`);
  console.log(`   Using browser automation (this may take a minute)...\n`);

  const amazonEpisodes = await getAmazonMusicEpisodes(showId, region);
  console.log(`✅ Found ${amazonEpisodes.length} episodes in Amazon Music\n`);

  // 5. Update episodes with Amazon Music URLs
  let updatedCount = 0;
  let notFoundCount = 0;

  for (const episode of episodesToUpdate) {
    console.log(`\n🔎 Processing: "${episode.title}"`);

    const amazonUrl = findAmazonMusicEpisodeByTitle(
      amazonEpisodes,
      episode.title
    );

    if (amazonUrl) {
      episode.amazonMusicUrl = amazonUrl;
      updatedCount++;
      console.log(`   ✅ Found: ${amazonUrl}`);
    } else {
      notFoundCount++;
      console.log(`   ❌ Not found in Amazon Music`);
    }
  }

  // 6. Save updated episodes.json
  if (updatedCount > 0) {
    await writeFile(
      episodesPath,
      JSON.stringify(episodesData, null, 2) + '\n',
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

updateAmazonMusicUrls(specificGuid).catch((error) => {
  console.error(`\n❌ Error: ${error.message}`);
  if (error.message?.includes('Puppeteer')) {
    console.log(`\n💡 Install Puppeteer with: npm install -D puppeteer`);
  }
  process.exit(1);
});
