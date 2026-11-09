/**
 * Shared settings for the new-episode X announcement.
 * Publishing uses this hosts line so an approved issue can be checked against
 * a fresh render of the same episode.
 */

/** Hosts line embedded in the main announcement. */
export const X_POST_HOSTS = '@togashi_ryo, @onepercentdsgn, @Isobe_Hiroshi';

/** Label that asks the default-branch workflow to publish one issue. */
export const X_POST_APPROVAL_LABEL = 'x-post-approved';

/**
 * Show account linked from the site footer.
 * The OAuth token's user is not verified in code.
 */
export const X_POST_INTENDED_ACCOUNT_URL = 'https://x.com/kaigaicareerlog';

/** Ledger of issue creation and actual X publication. Relative to the repo root. */
export const X_POST_LEDGER_PATH = 'src/data/xPostLedger.json';

/** Episode ids in this catalog are UUIDs. */
export const EPISODE_GUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Numeric id returned by POST /2/tweets. */
export const TWEET_ID_PATTERN = /^[0-9]{1,30}$/;

/**
 * Media id from POST /2/media/upload.
 * Create Post accepts media_ids of 1 to 19 digits.
 */
export const MEDIA_ID_PATTERN = /^[0-9]{1,19}$/;

/** Lowercase hex SHA-256 of the PNG attached to the main post. */
export const SHARE_IMAGE_SHA256_PATTERN = /^[a-f0-9]{64}$/;
