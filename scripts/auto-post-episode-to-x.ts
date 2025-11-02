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
import { getXConfidentials } from '../src/utils/x/getXConfidentials';
import { createLogger } from '../src/utils/logger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Main function
 */
async function main() {
  const logger = createLogger({ verbose: process.env.VERBOSE === 'true' });
  const args = process.argv.slice(2);

  if (args.length < 1) {
    logger.error('Usage: tsx scripts/auto-post-episode-to-x.ts <hosts>');
    logger.section('\nExample:');
    logger.list(
      ['tsx scripts/auto-post-episode-to-x.ts "@togashi_ryo, @onepercentdsgn"'],
      1
    );
    process.exit(1);
  }

  const hosts = args[0];

  // Get API credentials from environment
  const { accessToken, accessTokenSecret, apiKey, apiSecret } =
    getXConfidentials();

  logger.section('');
  logger.info('Looking for episodes to post...');

  // Find episode to post
  const episode = getLatestEpisodeToTweet();

  if (!episode) {
    logger.section('');
    logger.success('No episodes need to be posted to X');
    process.exit(0);
  }

  logger.section('');
  logger.info(`Found episode to post: ${episode.title}`);
  logger.debug(`GUID: ${episode.guid}`, 1);

  // Call the post-x-new-episode-intro script
  logger.section('\n🐦 Posting to X...');
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
    logger.section('');
    logger.success('Successfully posted to X and updated flag');
  } catch (error) {
    logger.section('');
    logger.error(`Failed to post to X: ${(error as Error).message}`);
    process.exit(1);
  }
}

main()
  .then(() => {
    const logger = createLogger();
    logger.section('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    const logger = createLogger();
    logger.section('');
    logger.error(`Error: ${error.message}`);
    process.exit(1);
  });
