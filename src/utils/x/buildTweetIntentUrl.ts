const TWEET_INTENT_MAX_CHARS = 280;

/**
 * Builds a twitter.com "intent" URL that pre-fills the tweet compose box with
 * `text`, so a human can open the link and post with one click instead of
 * copy-pasting. Returns null when the text is too long for a single tweet
 * (the caller should fall back to copy/paste for it).
 */
export function buildTweetIntentUrl(text: string): string | null {
  if (text.length > TWEET_INTENT_MAX_CHARS) return null;
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}
