import 'dotenv/config';
import OAuth from 'oauth-1.0a';

/**
 * Post a tweet to X (Twitter) using API v2 with OAuth 1.0a
 */
export async function postTweet(
  text: string,
  oauth: OAuth,
  token: { key: string; secret: string },
  replyToTweetId?: string
): Promise<string> {
  const body: any = { text };

  // If replying to another tweet, add reply parameter
  if (replyToTweetId) {
    body.reply = {
      in_reply_to_tweet_id: replyToTweetId,
    };
  }

  const url = 'https://api.twitter.com/2/tweets';
  const requestData = {
    url,
    method: 'POST',
  };

  // Generate OAuth 1.0a authorization header
  const authHeader = oauth.toHeader(oauth.authorize(requestData, token));

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
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
