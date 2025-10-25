#!/usr/bin/env node
/**
 * Script to post episode announcement to X (Twitter)
 * Usage: tsx scripts/post-x-new-episode-intro.ts <guid> <hosts>
 *
 * Example:
 *   tsx scripts/post-x-new-episode-intro.ts "abc123" "@togashi_ryo, @onepercentdsgn"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Episode {
  title: string;
  guid: string;
  spotifyUrl: string;
  youtubeUrl: string;
  applePodcastUrl: string;
  amazonMusicUrl: string;
  [key: string]: any;
}

interface EpisodesData {
  episodes: Episode[];
  [key: string]: any;
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
    throw new Error('No episodes files found');
  }

  return path.join(rssDir, episodesFiles[0]);
}

/**
 * Get episode by GUID
 */
function getEpisodeByGuid(guid: string): Episode {
  const rssDir = path.join(__dirname, '..', 'public', 'rss');
  const latestFile = findLatestEpisodesFile(rssDir);

  console.log(`Reading episodes from: ${latestFile}`);
  const data: EpisodesData = JSON.parse(fs.readFileSync(latestFile, 'utf-8'));

  const episode = data.episodes.find((ep) => ep.guid === guid);

  if (!episode) {
    throw new Error(`Episode with GUID ${guid} not found`);
  }

  return episode;
}

/**
 * Format main tweet text (without URLs)
 */
function formatMainTweet(episode: Episode, hosts: string): string {
  const lines: string[] = [];

  lines.push('🎧Podcast新エピソード公開');
  lines.push('');
  lines.push(episode.title);
  lines.push('');
  lines.push('Host');
  lines.push(hosts);
  lines.push('');
  lines.push('#海外 #海外就職 #キャリア');

  return lines.join('\n').trim();
}

/**
 * Format reply tweet with URLs
 */
function formatUrlsTweet(episode: Episode): string | null {
  const lines: string[] = [];

  // Add URLs if they exist
  if (episode.applePodcastUrl) {
    lines.push('Apple');
    lines.push(episode.applePodcastUrl);
    lines.push('');
  }

  if (episode.spotifyUrl) {
    lines.push('Spotify');
    lines.push(episode.spotifyUrl);
    lines.push('');
  }

  if (episode.youtubeUrl) {
    lines.push('Youtube');
    lines.push(episode.youtubeUrl);
    lines.push('');
  }

  if (episode.amazonMusicUrl) {
    lines.push('Amazon Music');
    lines.push(episode.amazonMusicUrl);
  }

  const result = lines.join('\n').trim();
  return result ? result : null;
}

/**
 * Post a tweet to X (Twitter) using API v2
 */
async function postTweet(
  text: string,
  accessToken: string,
  replyToTweetId?: string
): Promise<string> {
  const body: any = { text };

  // If replying to another tweet, add reply parameter
  if (replyToTweetId) {
    body.reply = {
      in_reply_to_tweet_id: replyToTweetId,
    };
  }

  const response = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`X API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  return result.data.id;
}

/**
 * Post to X (Twitter) with main tweet and reply thread
 */
async function postToX(
  mainText: string,
  urlsText: string | null,
  accessToken: string,
  apiKey: string,
  apiSecret: string
): Promise<void> {
  // Post main tweet
  console.log('📤 Posting main tweet...');
  const mainTweetId = await postTweet(mainText, accessToken);
  console.log(`✅ Main tweet posted! Tweet ID: ${mainTweetId}`);

  // Post URLs as reply if they exist
  if (urlsText) {
    console.log('📤 Posting URLs as reply...');
    const replyTweetId = await postTweet(urlsText, accessToken, mainTweetId);
    console.log(`✅ Reply tweet posted! Tweet ID: ${replyTweetId}`);
  }

  console.log(
    `\nℹ️  Note: URLs are automatically shortened by X (Twitter) to t.co links`
  );
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
  const episode = getEpisodeByGuid(guid);
  console.log(`📝 Episode: ${episode.title}\n`);

  // Format main tweet (without URLs)
  const mainTweetText = formatMainTweet(episode, hosts);

  // Format URLs tweet (as reply)
  const urlsTweetText = formatUrlsTweet(episode);

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
  await postToX(mainTweetText, urlsTweetText, accessToken, apiKey, apiSecret);
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
