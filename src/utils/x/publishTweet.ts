import crypto from 'crypto';
import OAuth from 'oauth-1.0a';
import { TWEET_ID_PATTERN } from '../../constants/xPost';
import type { TweetPublishResult } from './tweetPublishResult';

export interface XApiCredentials {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
}

const TWEETS_URL = 'https://api.twitter.com/2/tweets';

/**
 * Reads the four existing X OAuth 1.0a secret names.
 * Returns null when any of them is missing. Values are not logged.
 */
export function readXCredentials(
  env: NodeJS.ProcessEnv
): XApiCredentials | null {
  const apiKey = env.X_API_KEY ?? '';
  const apiSecret = env.X_API_SECRET ?? '';
  const accessToken = env.X_ACCESS_TOKEN ?? '';
  const accessTokenSecret = env.X_ACCESS_TOKEN_SECRET ?? '';
  if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) return null;
  return { apiKey, apiSecret, accessToken, accessTokenSecret };
}

/**
 * Classifies an HTTP result without keeping the response body.
 * 4xx is a definite rejection. Anything else that lacks a numeric tweet id is ambiguous.
 */
export function classifyTweetResponse(
  status: number,
  rawBody: string
): TweetPublishResult {
  if (status >= 200 && status < 300) {
    const tweetId = readTweetId(rawBody);
    if (tweetId) return { ok: true, tweetId };
    return { ok: false, outcome: 'ambiguous', status };
  }
  if (status >= 400 && status < 500) {
    return { ok: false, outcome: 'rejected', status };
  }
  return { ok: false, outcome: 'ambiguous', status };
}

/**
 * Posts one tweet with OAuth 1.0a user context.
 * Network and 5xx failures are ambiguous because the tweet may already exist.
 */
export async function publishTweet(options: {
  text: string;
  credentials: XApiCredentials;
  replyToTweetId?: string;
  fetchImpl?: typeof fetch;
}): Promise<TweetPublishResult> {
  if (
    options.replyToTweetId !== undefined &&
    !TWEET_ID_PATTERN.test(options.replyToTweetId)
  ) {
    return { ok: false, outcome: 'ambiguous' };
  }

  const oauth = new OAuth({
    consumer: {
      key: options.credentials.apiKey,
      secret: options.credentials.apiSecret,
    },
    signature_method: 'HMAC-SHA1',
    hash_function(baseString, key) {
      return crypto.createHmac('sha1', key).update(baseString).digest('base64');
    },
  });
  const payload: { text: string; reply?: { in_reply_to_tweet_id: string } } = {
    text: options.text,
  };
  if (options.replyToTweetId) {
    payload.reply = { in_reply_to_tweet_id: options.replyToTweetId };
  }
  const request = { url: TWEETS_URL, method: 'POST' };
  const authorization = oauth.toHeader(
    oauth.authorize(request, {
      key: options.credentials.accessToken,
      secret: options.credentials.accessTokenSecret,
    })
  );

  const fetchImpl = options.fetchImpl ?? fetch;
  let response: Response;
  try {
    response = await fetchImpl(TWEETS_URL, {
      method: 'POST',
      redirect: 'manual',
      headers: {
        'Content-Type': 'application/json',
        ...authorization,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    return { ok: false, outcome: 'ambiguous' };
  }

  if (response.status >= 300 && response.status < 400) {
    return { ok: false, outcome: 'ambiguous', status: response.status };
  }
  const rawBody = await response.text();
  return classifyTweetResponse(response.status, rawBody);
}

function readTweetId(rawBody: string): string | null {
  try {
    const parsed = JSON.parse(rawBody) as { data?: { id?: unknown } };
    const id = parsed.data?.id;
    if (typeof id === 'string' && TWEET_ID_PATTERN.test(id)) return id;
  } catch {
    return null;
  }
  return null;
}
