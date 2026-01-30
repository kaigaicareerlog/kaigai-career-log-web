#!/usr/bin/env node
/**
 * Script to post episode highlight to X (Twitter)
 * Usage: tsx scripts/post-x-episode-highlight.ts <guid> <highlightNumber>
 *
 * Example:
 *   tsx scripts/post-x-episode-highlight.ts "abc123" 1
 *
 * Environment Variables:
 *   X_API_KEY - Your X API Key (Consumer Key)
 *   X_API_SECRET - Your X API Secret (Consumer Secret)
 *   X_ACCESS_TOKEN - Your X Access Token (with Read and Write permissions)
 *   X_ACCESS_TOKEN_SECRET - Your X Access Token Secret
 */

import 'dotenv/config';
import crypto from 'crypto';
import OAuth from 'oauth-1.0a';
import { formatHighlightTweet } from '../src/utils/x/formatHighlightTweet';
import { formatNewEpisodeUrlsTweet } from '../src/utils/x/formatNewEpisodeUrlsTweet';
import { getEpisodeByGuid } from '../src/utils/getEpisodeByGuid';
import { getTranscriptByGuid } from '../src/utils/getTranscriptByGuid';
import { getXConfidentials } from '../src/utils/x/getXConfidentials';
import { postTweet } from '../src/utils/x/postTweet';

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error(
      'Usage: tsx scripts/post-x-episode-highlight.ts <guid> <highlightNumber>'
    );
    console.error('\nExample:');
    console.error(
      '  tsx scripts/post-x-episode-highlight.ts "1a7889de-76ea-4bf1-8eca-6aae3c089222" 1'
    );
    console.error('\nHighlight numbers: 1, 2, or 3');
    process.exit(1);
  }

  const [guid, highlightNumberStr] = args;
  const highlightNumber = parseInt(highlightNumberStr, 10);

  if (![1, 2, 3].includes(highlightNumber)) {
    console.error('Error: Highlight number must be 1, 2, or 3');
    process.exit(1);
  }

  // Get API credentials from environment
  const { apiKey, apiSecret, accessToken, accessTokenSecret } =
    getXConfidentials();

  console.log(`\n🔍 Finding episode: ${guid}\n`);

  // Get episode data
  const episode = getEpisodeByGuid({ guid });

  if (!episode) {
    throw new Error(`Episode with GUID ${guid} not found`);
  }

  console.log(`📝 Episode: ${episode.title}\n`);

  // Get transcript data
  const transcript = getTranscriptByGuid(guid);

  // Format highlight tweet
  const highlightTweetText = formatHighlightTweet(
    episode,
    transcript,
    highlightNumber as 1 | 2 | 3
  );

  // Format URLs tweet (as reply)
  const urlsTweetText = formatNewEpisodeUrlsTweet(episode);

  console.log('📄 Main tweet content (Highlight):');
  console.log('─'.repeat(50));
  console.log(highlightTweetText);
  console.log('─'.repeat(50));
  console.log(`Character count: ${highlightTweetText.length}\n`);

  if (urlsTweetText) {
    console.log('📄 Reply tweet content (URLs):');
    console.log('─'.repeat(50));
    console.log(urlsTweetText);
    console.log('─'.repeat(50));
    console.log(`Character count: ${urlsTweetText.length}\n`);
  }

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

  // Post main tweet (highlight)
  console.log('🐦 Posting highlight to X...\n');
  const mainTweetId = await postTweet(highlightTweetText, oauth, token);
  console.log(`✅ Main tweet posted! Tweet ID: ${mainTweetId}`);

  // Post URLs as reply if they exist
  if (urlsTweetText) {
    console.log('📤 Posting URLs as reply...');
    const replyTweetId = await postTweet(urlsTweetText, oauth, token, mainTweetId);
    console.log(`✅ Reply tweet posted! Tweet ID: ${replyTweetId}`);
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
