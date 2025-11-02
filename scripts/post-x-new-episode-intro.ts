#!/usr/bin/env node
/**
 * Script to post episode announcement to X (Twitter)
 * Usage: tsx scripts/post-x-new-episode-intro.ts <guid> <hosts>
 *
 * Example:
 *   tsx scripts/post-x-new-episode-intro.ts "abc123" "@togashi_ryo, @onepercentdsgn"
 *
 * Environment Variables:
 *   X_API_KEY - Your X API Key (Consumer Key)
 *   X_API_SECRET - Your X API Secret (Consumer Secret)
 *   X_ACCESS_TOKEN - Your X Access Token (with Read and Write permissions)
 *   X_ACCESS_TOKEN_SECRET - Your X Access Token Secret
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';
import { formatNewEpisodeMainTweet } from '../src/utils/x/formatNewEpisodeMainTweet';
import type { PodcastEpisode } from '../src/types';
import { findLatestEpisodesFile } from '../src/utils/findLatestEpisodesFile';
import { getEpisodeByGuid } from '../src/utils/getEpisodeByGuid';
import { formatNewEpisodeUrlsTweet } from '../src/utils/x/formatNewEpisodeUrlsTweet';
import { postTweet } from '../src/utils/x/postTweet';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type EpisodesData = PodcastEpisode[];

/**
 * Post to X (Twitter) with main tweet and reply thread
 */
async function postToX(
  mainText: string,
  urlsText: string | null,
  apiKey: string,
  apiSecret: string,
  accessToken: string,
  accessTokenSecret: string
): Promise<void> {
  // Initialize OAuth 1.0a
  const oauth = new OAuth({
    consumer: { key: apiKey, secret: apiSecret },
    signature_method: 'HMAC-SHA1',
    hash_function(base_string, key) {
      return crypto
        .createHmac('sha1', key)
        .update(base_string)
        .digest('base64');
    },
  });

  const token = {
    key: accessToken,
    secret: accessTokenSecret,
  };

  // Post main tweet
  console.log('📤 Posting main tweet...');
  const mainTweetId = await postTweet(mainText, oauth, token);
  console.log(`✅ Main tweet posted! Tweet ID: ${mainTweetId}`);

  // Post URLs as reply if they exist
  if (urlsText) {
    console.log('📤 Posting URLs as reply...');
    const replyTweetId = await postTweet(urlsText, oauth, token, mainTweetId);
    console.log(`✅ Reply tweet posted! Tweet ID: ${replyTweetId}`);
  }

  console.log(
    `\nℹ️  Note: URLs are automatically shortened by X (Twitter) to t.co links`
  );
}

/**
 * Update episode's newEpisodeIntroPostedToX flag
 */
function updateNewEpisodeIntroPostedToX(filePath: string, guid: string): void {
  console.log(
    `\n📝 Updating newEpisodeIntroPostedToX flag for episode ${guid}...`
  );

  const data: EpisodesData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  const episodeIndex = data.findIndex((ep) => ep.guid === guid);

  if (episodeIndex === -1) {
    console.warn('⚠️  Episode not found, skipping update');
    return;
  }

  // Update the flag to true (episode has been posted)
  data[episodeIndex].newEpisodeIntroPostedToX = true;

  // Write back to file
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

  console.log('✅ newEpisodeIntroPostedToX flag updated to true');
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error(
      'Usage: tsx scripts/post-x-new-episode-intro.ts <guid> <hosts>'
    );
    console.error('\nExample:');
    console.error(
      '  tsx scripts/post-x-new-episode-intro.ts "abc123" "@togashi_ryo, @onepercentdsgn"'
    );
    process.exit(1);
  }

  const [guid, hosts] = args;

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

  console.log(`\n🔍 Finding episode: ${guid}\n`);

  // Get episode data
  const rssDir = path.join(__dirname, '..', 'public', 'rss');
  const filePath = findLatestEpisodesFile(rssDir);
  const episode = getEpisodeByGuid({ guid });

  if (!episode) {
    throw new Error(`Episode with GUID ${guid} not found`);
  }

  console.log(`📝 Episode: ${episode.title}\n`);

  // Format main tweet (without URLs)
  const mainTweetText = formatNewEpisodeMainTweet(episode, hosts);

  // Format URLs tweet (as reply)
  const urlsTweetText = formatNewEpisodeUrlsTweet(episode);

  console.log('📄 Main tweet content:');
  console.log('─'.repeat(50));
  console.log(mainTweetText);
  console.log('─'.repeat(50));
  console.log(`Character count: ${mainTweetText.length}\n`);

  if (urlsTweetText) {
    console.log('📄 Reply tweet content (URLs):');
    console.log('─'.repeat(50));
    console.log(urlsTweetText);
    console.log('─'.repeat(50));
    console.log(`Character count: ${urlsTweetText.length}\n`);

    // Count URLs for estimated length
    const urlCount =
      (episode.applePodcastUrl ? 1 : 0) +
      (episode.spotifyUrl ? 1 : 0) +
      (episode.youtubeUrl ? 1 : 0) +
      (episode.amazonMusicUrl ? 1 : 0);

    console.log(
      `ℹ️  URLs will be shortened: ${urlCount} URLs × ~23 chars = ~${urlCount * 23} chars\n`
    );
  }

  // Post to X
  console.log('🐦 Posting to X (as thread)...\n');
  await postToX(
    mainTweetText,
    urlsTweetText,
    apiKey,
    apiSecret,
    accessToken,
    accessTokenSecret
  );

  // Update newEpisodeIntroPostedToX flag
  updateNewEpisodeIntroPostedToX(filePath, guid);
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
