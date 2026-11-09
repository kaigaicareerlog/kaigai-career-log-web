/**
 * Why a main post was not sent.
 * These happen before POST /2/tweets, so retrying later cannot duplicate a tweet.
 */
export type NotPostedReason =
  | 'image_fetch'
  | 'image_invalid'
  | 'image_upload'
  | 'image_auth'
  | 'image_processing'
  | 'media_id';

/**
 * Result of one POST /2/tweets attempt, or a refusal to call it.
 * The response body is not retained.
 */
export type TweetPublishResult =
  | { ok: true; tweetId: string; shareImageSha256?: string }
  | { ok: false; outcome: 'rejected'; status: number }
  | { ok: false; outcome: 'ambiguous'; status?: number }
  | {
      ok: false;
      outcome: 'not_posted';
      reason: NotPostedReason;
      status?: number;
    };
