import {
  EPISODE_GUID_PATTERN,
  SHARE_IMAGE_SHA256_PATTERN,
  TWEET_ID_PATTERN,
} from '../../constants/xPost';
import type { TweetPublishResult } from './tweetPublishResult';

export type XPostStatus =
  | 'awaiting_approval'
  | 'main_in_flight'
  | 'reply_pending'
  | 'reply_in_flight'
  | 'published'
  | 'needs_review';

/**
 * One new-episode announcement.
 * `newEpisodeIntroPostedToX` stays the "issue was created" flag.
 * This entry is the publication record.
 */
export interface XPostLedgerEntry {
  guid: string;
  issueNumber: number;
  status: XPostStatus;
  mainText: string;
  replyText: string;
  postedMainText?: string;
  postedReplyText?: string;
  mainTweetId?: string;
  replyTweetId?: string;
  /** SHA-256 of the PNG uploaded with the main post. Not a media id. */
  shareImageSha256?: string;
  inFlightRunId?: string;
  needsReviewReason?: string;
  updatedAt: string;
}

export interface XPostLedger {
  version: 1;
  revision: number;
  entries: XPostLedgerEntry[];
}

const STATUSES = new Set<XPostStatus>([
  'awaiting_approval',
  'main_in_flight',
  'reply_pending',
  'reply_in_flight',
  'published',
  'needs_review',
]);

/**
 * Empty ledger used when the file has not been created yet.
 */
export function emptyXPostLedger(): XPostLedger {
  return { version: 1, revision: 0, entries: [] };
}

/**
 * Parses a ledger and rejects duplicate ids, unknown statuses, and bad tweet ids.
 */
export function parseXPostLedger(raw: unknown): XPostLedger {
  if (!raw || typeof raw !== 'object') {
    throw new Error('X post ledger is not an object');
  }
  const value = raw as Record<string, unknown>;
  if (value.version !== 1) throw new Error('Unsupported X post ledger version');
  if (!isRevision(value.revision))
    throw new Error('Invalid X post ledger revision');
  if (!Array.isArray(value.entries))
    throw new Error('X post ledger entries are missing');

  const entries = value.entries.map(parseEntry);
  const guids = new Set<string>();
  for (const entry of entries) {
    if (guids.has(entry.guid)) {
      throw new Error(`Duplicate X post ledger guid: ${entry.guid}`);
    }
    guids.add(entry.guid);
  }
  return { version: 1, revision: value.revision, entries };
}

/**
 * Adds an awaiting-approval row. Fails if the episode is already tracked.
 */
export function withAwaitingApprovalEntry(
  ledger: XPostLedger,
  input: {
    guid: string;
    issueNumber: number;
    mainText: string;
    replyText: string;
    updatedAt: string;
  }
): XPostLedger {
  if (!EPISODE_GUID_PATTERN.test(input.guid))
    throw new Error('Invalid episode guid');
  if (!isIssueNumber(input.issueNumber))
    throw new Error('Invalid issue number');
  if (ledger.entries.some((entry) => entry.guid === input.guid)) {
    throw new Error('X post ledger entry already exists');
  }
  const entry: XPostLedgerEntry = {
    guid: input.guid,
    issueNumber: input.issueNumber,
    status: 'awaiting_approval',
    mainText: input.mainText,
    replyText: input.replyText,
    updatedAt: input.updatedAt,
  };
  return {
    version: 1,
    revision: ledger.revision + 1,
    entries: [...ledger.entries, entry],
  };
}

/**
 * Returns a ledger with this entry replaced and the revision incremented by one.
 */
export function replaceLedgerEntry(
  ledger: XPostLedger,
  entry: XPostLedgerEntry
): XPostLedger {
  const index = ledger.entries.findIndex((item) => item.guid === entry.guid);
  if (index < 0) throw new Error('X post ledger entry was not found');
  const entries = ledger.entries.slice();
  entries[index] = entry;
  return { version: 1, revision: ledger.revision + 1, entries };
}

/**
 * Marks a publish attempt before the API call.
 * Returns null when the entry is not in the required status.
 */
export function claimPublish(
  entry: XPostLedgerEntry,
  phase: 'main' | 'reply',
  runId: string,
  now: string
): XPostLedgerEntry | null {
  if (!runId) return null;
  if (phase === 'main') {
    if (entry.status !== 'awaiting_approval') return null;
    if (entry.mainTweetId || entry.postedMainText) return null;
    return {
      ...entry,
      status: 'main_in_flight',
      inFlightRunId: runId,
      needsReviewReason: undefined,
      updatedAt: now,
    };
  }
  if (entry.status !== 'reply_pending') return null;
  if (!isTweetId(entry.mainTweetId) || !entry.postedMainText) return null;
  return {
    ...entry,
    status: 'reply_in_flight',
    inFlightRunId: runId,
    needsReviewReason: undefined,
    updatedAt: now,
  };
}

/**
 * Applies an API result.
 * A rejected call returns to a retryable status.
 * not_posted means the tweet endpoint was not called, so it is retryable too.
 * An ambiguous call sticks at needs_review so the main post is not sent again.
 */
export function applyPublishResult(
  entry: XPostLedgerEntry,
  phase: 'main' | 'reply',
  result: TweetPublishResult,
  now: string
): XPostLedgerEntry {
  const cleared: XPostLedgerEntry = {
    ...entry,
    inFlightRunId: undefined,
    updatedAt: now,
  };
  if (result.ok) {
    if (phase === 'main') {
      return {
        ...cleared,
        status: 'reply_pending',
        mainTweetId: result.tweetId,
        postedMainText: entry.mainText,
        shareImageSha256: isShareImageSha256(result.shareImageSha256)
          ? result.shareImageSha256
          : undefined,
        needsReviewReason: undefined,
      };
    }
    return {
      ...cleared,
      status: 'published',
      replyTweetId: result.tweetId,
      postedReplyText: entry.replyText,
      needsReviewReason: undefined,
    };
  }
  if (result.outcome === 'rejected' || result.outcome === 'not_posted') {
    if (phase === 'main') {
      return {
        ...cleared,
        status: 'awaiting_approval',
        needsReviewReason: undefined,
      };
    }
    return {
      ...cleared,
      status: 'reply_pending',
      needsReviewReason: undefined,
    };
  }
  return {
    ...cleared,
    status: 'needs_review',
    needsReviewReason: phase === 'main' ? 'main_ambiguous' : 'reply_ambiguous',
  };
}

/**
 * Records that a human must check X before anything is sent again.
 * An optional tweet id is kept so a confirmed main post is not lost.
 */
export function markNeedsReview(
  entry: XPostLedgerEntry,
  reason: string,
  now: string,
  tweetId?: string
): XPostLedgerEntry {
  const mainTweetId = entry.mainTweetId ?? tweetId;
  return {
    ...entry,
    status: 'needs_review',
    inFlightRunId: undefined,
    needsReviewReason: reason,
    updatedAt: now,
    mainTweetId,
    postedMainText:
      entry.postedMainText ?? (tweetId ? entry.mainText : undefined),
  };
}

/**
 * True when the value is a numeric tweet id.
 */
export function isTweetId(value: string | undefined): value is string {
  return typeof value === 'string' && TWEET_ID_PATTERN.test(value);
}

function parseEntry(raw: unknown): XPostLedgerEntry {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid ledger entry');
  const value = raw as Record<string, unknown>;
  if (
    typeof value.guid !== 'string' ||
    !EPISODE_GUID_PATTERN.test(value.guid)
  ) {
    throw new Error('Invalid ledger guid');
  }
  if (!isIssueNumber(value.issueNumber))
    throw new Error('Invalid ledger issue number');
  if (
    typeof value.status !== 'string' ||
    !STATUSES.has(value.status as XPostStatus)
  ) {
    throw new Error('Invalid ledger status');
  }
  if (
    typeof value.mainText !== 'string' ||
    typeof value.replyText !== 'string'
  ) {
    throw new Error('Invalid ledger text');
  }
  if (typeof value.updatedAt !== 'string' || value.updatedAt.length === 0) {
    throw new Error('Invalid ledger timestamp');
  }
  const entry: XPostLedgerEntry = {
    guid: value.guid,
    issueNumber: value.issueNumber,
    status: value.status as XPostStatus,
    mainText: value.mainText,
    replyText: value.replyText,
    updatedAt: value.updatedAt,
  };
  assignOptionalText(entry, 'postedMainText', value.postedMainText);
  assignOptionalText(entry, 'postedReplyText', value.postedReplyText);
  assignOptionalTweetId(entry, 'mainTweetId', value.mainTweetId);
  assignOptionalTweetId(entry, 'replyTweetId', value.replyTweetId);
  assignOptionalSha256(entry, value.shareImageSha256);
  assignOptionalText(entry, 'inFlightRunId', value.inFlightRunId);
  assignOptionalText(entry, 'needsReviewReason', value.needsReviewReason);
  return entry;
}

function assignOptionalText(
  entry: XPostLedgerEntry,
  key:
    | 'postedMainText'
    | 'postedReplyText'
    | 'inFlightRunId'
    | 'needsReviewReason',
  value: unknown
): void {
  if (value === undefined) return;
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Invalid ledger field ${key}`);
  }
  entry[key] = value;
}

function assignOptionalTweetId(
  entry: XPostLedgerEntry,
  key: 'mainTweetId' | 'replyTweetId',
  value: unknown
): void {
  if (value === undefined) return;
  if (typeof value !== 'string' || !TWEET_ID_PATTERN.test(value)) {
    throw new Error(`Invalid ledger field ${key}`);
  }
  entry[key] = value;
}

function assignOptionalSha256(entry: XPostLedgerEntry, value: unknown): void {
  if (value === undefined) return;
  if (!isShareImageSha256(value)) {
    throw new Error('Invalid ledger field shareImageSha256');
  }
  entry.shareImageSha256 = value;
}

function isShareImageSha256(value: unknown): value is string {
  return typeof value === 'string' && SHARE_IMAGE_SHA256_PATTERN.test(value);
}

function isRevision(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isIssueNumber(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value > 0 &&
    value <= 1_000_000_000
  );
}
