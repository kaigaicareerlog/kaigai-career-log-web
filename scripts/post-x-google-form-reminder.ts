#!/usr/bin/env node
/**
 * Script to post Google Form reminder to X (Twitter)
 * Usage: tsx scripts/post-x-google-form-reminder.ts
 *
 * Environment Variables:
 *   X_API_KEY - Your X API Key (Consumer Key)
 *   X_API_SECRET - Your X API Secret (Consumer Secret)
 *   X_ACCESS_TOKEN - Your X Access Token (with Read and Write permissions)
 *   X_ACCESS_TOKEN_SECRET - Your X Access Token Secret
 */

import 'dotenv/config';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';
import { formatGoogleFormReminderTweet } from '../src/utils/x/formatGoogleFormReminderTweet';
import { getXConfidentials } from '../src/utils/x/getXConfidentials';
import { postTweet } from '../src/utils/x/postTweet';

const GOOGLE_FORM_URL = 'https://forms.gle/pPThnBsCKX38MzT36';

/**
 * Main function
 */
async function main() {
  // Get API credentials from environment
  const { apiKey, apiSecret, accessToken, accessTokenSecret } =
    getXConfidentials();

  // Format the tweet
  const tweetText = formatGoogleFormReminderTweet(GOOGLE_FORM_URL);

  console.log('📄 Tweet content:');
  console.log('─'.repeat(50));
  console.log(tweetText);
  console.log('─'.repeat(50));
  console.log(`Character count: ${tweetText.length}\n`);

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

  // Post to X
  console.log('🐦 Posting to X...\n');
  const tweetId = await postTweet(tweetText, oauth, token);
  console.log(`✅ Tweet posted! Tweet ID: ${tweetId}`);
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
