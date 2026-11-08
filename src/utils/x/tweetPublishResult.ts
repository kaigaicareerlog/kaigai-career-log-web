/** Result of one POST /2/tweets attempt. The response body is not retained. */
export type TweetPublishResult =
  | { ok: true; tweetId: string }
  | { ok: false; outcome: 'rejected'; status: number }
  | { ok: false; outcome: 'ambiguous'; status?: number };
