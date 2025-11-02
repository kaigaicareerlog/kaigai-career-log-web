#!/usr/bin/env node
/**
 * Script to automatically post episodes that haven't been posted to X yet
 * Finds the first episode with newEpisodeIntroPostedToX: false (or missing) and posts it
 * Usage: tsx scripts/auto-post-episode-to-x.ts <hosts>
 *
 * Example:
 *   tsx scripts/auto-post-episode-to-x.ts "@togashi_ryo, @onepercentdsgn"
 *
 * Environment Variables:
 *   X_API_KEY - Your X API Key (Consumer Key)
 *   X_API_SECRET - Your X API Secret (Consumer Secret)
 *   X_ACCESS_TOKEN - Your X Access Token (with Read and Write permissions)
 *   X_ACCESS_TOKEN_SECRET - Your X Access Token Secret
 */

import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { getLatestEpisodeToTweet } from '../src/utils/getLatestEpisodeToTweet';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: tsx scripts/auto-post-episode-to-x.ts <hosts>');
    console.error('\nExample:');
    console.error(
      '  tsx scripts/auto-post-episode-to-x.ts "@togashi_ryo, @onepercentdsgn"'
    );
    process.exit(1);
  }

  const hosts = args[0];

  // Get API credentials from environment
  const accessToken = process.env.X_ACCESS_TOKEN;
  const accessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET;
  const apiKey = process.env.X_API_KEY;
  const apiSecret = process.env.X_API_SECRET;

  if (!accessToken) {
    throw new Error('X_ACCESS_TOKEN environment variable is required');
  }
  if (!accessTokenSecret) {
    throw new Error('X_ACCESS_TOKEN_SECRET environment variable is required');
  }
  if (!apiKey) {
    throw new Error('X_API_KEY environment variable is required');
  }
  if (!apiSecret) {
    throw new Error('X_API_SECRET environment variable is required');
  }

  console.log('\n🔍 Looking for episodes to post...\n');

  // Find episode to post
  const episode = getLatestEpisodeToTweet();

  if (!episode) {
    console.log('✅ No episodes need to be posted to X');
    process.exit(0);
  }

  console.log(`📝 Found episode to post: ${episode.title}`);
  console.log(`   GUID: ${episode.guid}\n`);

  // Call the post-x-new-episode-intro script
  console.log('🐦 Posting to X...\n');
  try {
    execSync(
      `npx tsx scripts/post-x-new-episode-intro.ts "${episode.guid}" "${hosts}"`,
      {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit',
        env: {
          ...process.env,
          X_ACCESS_TOKEN: accessToken,
          X_ACCESS_TOKEN_SECRET: accessTokenSecret,
          X_API_KEY: apiKey,
          X_API_SECRET: apiSecret,
        },
      }
    );
    console.log('\n✅ Successfully posted to X and updated flag');
  } catch (error) {
    console.error('❌ Failed to post to X:', (error as Error).message);
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  });
