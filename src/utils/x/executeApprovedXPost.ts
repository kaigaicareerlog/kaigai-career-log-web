import { X_POST_APPROVAL_LABEL } from '../../constants/xPost';
import type { PodcastEpisode } from '../../types';
import { buildEpisodePostIssueBody } from './buildEpisodePostIssueBody';
import { buildNewEpisodePostTexts } from './buildNewEpisodePostTexts';
import { decideXPostAction, type ApprovalDecision } from './decideXPostAction';
import type { IssueGateway } from './githubIssueGateway';
import { parseApproverAllowlist } from './parseApproverAllowlist';
import { parseEpisodePostIssue } from './parseEpisodePostIssue';
import type { TweetPublishResult } from './tweetPublishResult';
import {
  ambiguousComment,
  allowlistEmptyComment,
  concurrentComment,
  notApproverComment,
  persistenceComment,
  publishedComment,
  rejectedComment,
  secretsMissingComment,
} from './xPostComments';
import {
  applyPublishResult,
  claimPublish,
  markNeedsReview,
  replaceLedgerEntry,
  type XPostLedger,
  type XPostLedgerEntry,
} from './xPostLedger';

export interface LedgerStore {
  read(): XPostLedger;
  compareAndSwap(expectedRevision: number, next: XPostLedger): boolean;
}

export interface XPostPublisher {
  postMain(text: string): Promise<TweetPublishResult>;
  postReply(
    text: string,
    inReplyToTweetId: string
  ): Promise<TweetPublishResult>;
}

export interface ExecuteApprovedXPostInput {
  issueNumber: number;
  issueBody: string;
  labelName: string;
  senderLogin: string;
  assigneeLogin: string | null;
  allowlistRaw: string | undefined;
  runId: string;
  now: () => string;
  loadEpisode: (guid: string) => PodcastEpisode | null;
  ledger: LedgerStore;
  publisher: XPostPublisher | null;
  issues: IssueGateway;
  log: (message: string) => void;
}

export interface ApprovalRunResult {
  outcome: string;
  postedMain: boolean;
  postedReply: boolean;
}

interface EpisodeRender {
  episodeFound: boolean;
  regeneratedMain: string | null;
  regeneratedReply: string | null;
  shareImageUrl: string | null;
}

/**
 * Handles one approval-label event.
 * Tweet text is published only when the approver, ledger, issue, and current
 * episode render all agree. Issue text is never passed to a shell.
 */
export async function executeApprovedXPost(
  input: ExecuteApprovedXPostInput
): Promise<ApprovalRunResult> {
  const allowlist = parseApproverAllowlist(input.allowlistRaw);
  let decision = decideFrom(input, allowlist, input.ledger.read());
  const posted = { main: false, reply: false };

  if (decision.kind === 'noop') {
    if (decision.reason !== 'not_approval_label') {
      notifyUnauthorized(input, decision.reason);
      removeLabel(input);
    }
    return { outcome: decision.reason, postedMain: false, postedReply: false };
  }

  if (decision.kind === 'stop') {
    comment(input, decision.comment);
    removeLabel(input);
    return { outcome: decision.reason, postedMain: false, postedReply: false };
  }

  if (decision.kind === 'mark_needs_review') {
    persistNeedsReview(input, decision.reason);
    comment(input, decision.comment);
    removeLabel(input);
    return { outcome: 'needs_review', postedMain: false, postedReply: false };
  }

  if (decision.kind === 'reapprove') {
    const saved = persistTextRefresh(input, decision);
    if (saved) {
      replaceIssueBody(
        input,
        decision.guid,
        decision.mainText,
        decision.replyText
      );
      comment(input, decision.comment);
    } else {
      comment(input, concurrentComment());
    }
    removeLabel(input);
    return { outcome: 'reapprove', postedMain: false, postedReply: false };
  }

  if (decision.kind === 'already_published') {
    comment(
      input,
      publishedComment(decision.mainTweetId, decision.replyTweetId)
    );
    closeIssue(input);
    return {
      outcome: 'already_published',
      postedMain: false,
      postedReply: false,
    };
  }

  if (!input.publisher) {
    comment(input, secretsMissingComment());
    removeLabel(input);
    return {
      outcome: 'secrets_missing',
      postedMain: false,
      postedReply: false,
    };
  }

  const publishDecision = decision;
  const claimed = persistClaim(input, publishDecision);
  if (!claimed) {
    comment(input, concurrentComment());
    removeLabel(input);
    return { outcome: 'concurrent', postedMain: false, postedReply: false };
  }

  const mainResult = await postPhase(input, input.publisher, publishDecision);
  if (publishDecision.phase === 'main' && mainResult.ok) posted.main = true;
  if (publishDecision.phase === 'reply' && mainResult.ok) posted.reply = true;

  const applied = applyOutcome(
    input,
    claimed.entry,
    publishDecision.phase,
    mainResult
  );
  if (!applied.saved) {
    if (mainResult.ok) comment(input, persistenceComment(mainResult.tweetId));
    else comment(input, '投稿結果を台帳へ保存できなかったため、続行しません。');
    removeLabel(input);
    return {
      outcome: 'persistence_uncertain',
      postedMain: posted.main,
      postedReply: posted.reply,
    };
  }

  if (!mainResult.ok) {
    comment(
      input,
      mainResult.outcome === 'rejected'
        ? rejectedComment(
            publishDecision.phase,
            mainResult.status,
            publishDecision.mainTweetId
          )
        : ambiguousComment(publishDecision.phase)
    );
    removeLabel(input);
    return {
      outcome: mainResult.outcome,
      postedMain: posted.main,
      postedReply: posted.reply,
    };
  }

  if (publishDecision.phase === 'reply') {
    if (!publishDecision.mainTweetId) {
      comment(input, ambiguousComment('reply'));
      removeLabel(input);
      return {
        outcome: 'reply_missing_main',
        postedMain: false,
        postedReply: true,
      };
    }
    comment(
      input,
      publishedComment(publishDecision.mainTweetId, mainResult.tweetId)
    );
    closeIssue(input);
    return { outcome: 'published', postedMain: false, postedReply: true };
  }

  decision = decideFrom(input, allowlist, input.ledger.read());
  if (
    decision.kind !== 'publish' ||
    decision.phase !== 'reply' ||
    !decision.mainTweetId
  ) {
    comment(
      input,
      'メインは保存しましたが、返信の再確認に失敗したため返信しません。'
    );
    removeLabel(input);
    return {
      outcome: 'reply_not_confirmed',
      postedMain: true,
      postedReply: false,
    };
  }

  const replyClaim = persistClaim(input, decision);
  if (!replyClaim) {
    comment(input, concurrentComment());
    removeLabel(input);
    return { outcome: 'concurrent', postedMain: true, postedReply: false };
  }
  const replyResult = await postPhase(input, input.publisher, decision);
  if (replyResult.ok) posted.reply = true;
  const replyApplied = applyOutcome(
    input,
    replyClaim.entry,
    'reply',
    replyResult
  );
  if (!replyApplied.saved) {
    if (replyResult.ok) comment(input, persistenceComment(replyResult.tweetId));
    else comment(input, '返信結果を台帳へ保存できなかったため、続行しません。');
    removeLabel(input);
    return {
      outcome: 'persistence_uncertain',
      postedMain: true,
      postedReply: posted.reply,
    };
  }
  if (!replyResult.ok) {
    comment(
      input,
      replyResult.outcome === 'rejected'
        ? rejectedComment('reply', replyResult.status, decision.mainTweetId)
        : ambiguousComment('reply')
    );
    removeLabel(input);
    return {
      outcome: replyResult.outcome,
      postedMain: true,
      postedReply: false,
    };
  }

  comment(input, publishedComment(decision.mainTweetId, replyResult.tweetId));
  closeIssue(input);
  return { outcome: 'published', postedMain: true, postedReply: true };
}

function decideFrom(
  input: ExecuteApprovedXPostInput,
  allowlist: ReadonlySet<string>,
  ledger: XPostLedger
): ApprovalDecision {
  const parsed =
    input.labelName === X_POST_APPROVAL_LABEL
      ? parseEpisodePostIssue(input.issueBody)
      : { ok: false as const, guid: null };
  const render = renderEpisode(input.loadEpisode, parsed.guid);
  const entry = parsed.guid
    ? (ledger.entries.find((item) => item.guid === parsed.guid) ?? null)
    : null;
  return decideXPostAction({
    labelName: input.labelName,
    senderLogin: input.senderLogin,
    allowlist,
    issueNumber: input.issueNumber,
    parsed,
    episodeFound: render.episodeFound,
    regeneratedMain: render.regeneratedMain,
    regeneratedReply: render.regeneratedReply,
    entry,
  });
}

function renderEpisode(
  loadEpisode: (guid: string) => PodcastEpisode | null,
  guid: string | null
): EpisodeRender {
  if (!guid) {
    return {
      episodeFound: false,
      regeneratedMain: null,
      regeneratedReply: null,
      shareImageUrl: null,
    };
  }
  const episode = loadEpisode(guid);
  if (!episode) {
    return {
      episodeFound: false,
      regeneratedMain: null,
      regeneratedReply: null,
      shareImageUrl: null,
    };
  }
  const texts = buildNewEpisodePostTexts(episode);
  return {
    episodeFound: true,
    regeneratedMain: texts.mainText,
    regeneratedReply: texts.replyText,
    shareImageUrl: texts.shareImageUrl,
  };
}

function persistClaim(
  input: ExecuteApprovedXPostInput,
  decision: Extract<ApprovalDecision, { kind: 'publish' }>
): { entry: XPostLedgerEntry } | null {
  const ledger = input.ledger.read();
  const again = decideFrom(
    input,
    parseApproverAllowlist(input.allowlistRaw),
    ledger
  );
  if (again.kind !== 'publish' || again.phase !== decision.phase) return null;
  const entry = ledger.entries.find((item) => item.guid === decision.guid);
  if (!entry) return null;
  const claimed = claimPublish(entry, decision.phase, input.runId, input.now());
  if (!claimed) return null;
  const next = replaceLedgerEntry(ledger, claimed);
  if (!input.ledger.compareAndSwap(ledger.revision, next)) return null;
  return { entry: claimed };
}

function applyOutcome(
  input: ExecuteApprovedXPostInput,
  claimed: XPostLedgerEntry,
  phase: 'main' | 'reply',
  result: TweetPublishResult
): { saved: boolean } {
  const ledger = input.ledger.read();
  const current =
    ledger.entries.find((item) => item.guid === claimed.guid) ?? claimed;
  const updated = applyPublishResult(current, phase, result, input.now());
  const next = replaceLedgerEntry(ledger, updated);
  if (input.ledger.compareAndSwap(ledger.revision, next))
    return { saved: true };
  if (result.ok && phase === 'main') {
    const latest = input.ledger.read();
    const stuck = latest.entries.find((item) => item.guid === claimed.guid);
    if (
      stuck &&
      (stuck.status === 'main_in_flight' || stuck.status === 'reply_in_flight')
    ) {
      const review = markNeedsReview(
        stuck,
        'persist_failed',
        input.now(),
        result.tweetId
      );
      input.ledger.compareAndSwap(
        latest.revision,
        replaceLedgerEntry(latest, review)
      );
    }
  }
  return { saved: false };
}

async function postPhase(
  input: ExecuteApprovedXPostInput,
  publisher: XPostPublisher,
  decision: Extract<ApprovalDecision, { kind: 'publish' }>
): Promise<TweetPublishResult> {
  try {
    if (decision.phase === 'main')
      return await publisher.postMain(decision.mainText);
    if (!decision.mainTweetId) return { ok: false, outcome: 'ambiguous' };
    return await publisher.postReply(decision.replyText, decision.mainTweetId);
  } catch (error) {
    input.log(
      `X request failed before a confirmed response: ${(error as Error).name}`
    );
    return { ok: false, outcome: 'ambiguous' };
  }
}

function persistNeedsReview(
  input: ExecuteApprovedXPostInput,
  reason: string
): void {
  const ledger = input.ledger.read();
  const parsed = parseEpisodePostIssue(input.issueBody);
  const entry = parsed.guid
    ? ledger.entries.find((item) => item.guid === parsed.guid)
    : undefined;
  if (!entry || entry.issueNumber !== input.issueNumber) return;
  if (entry.status === 'needs_review') return;
  const updated = markNeedsReview(entry, reason, input.now());
  input.ledger.compareAndSwap(
    ledger.revision,
    replaceLedgerEntry(ledger, updated)
  );
}

function persistTextRefresh(
  input: ExecuteApprovedXPostInput,
  decision: Extract<ApprovalDecision, { kind: 'reapprove' }>
): boolean {
  const ledger = input.ledger.read();
  const entry = ledger.entries.find((item) => item.guid === decision.guid);
  if (!entry || entry.issueNumber !== input.issueNumber) return false;
  const updated: XPostLedgerEntry = {
    ...entry,
    mainText: decision.mainText,
    replyText: decision.replyText,
    updatedAt: input.now(),
  };
  return input.ledger.compareAndSwap(
    ledger.revision,
    replaceLedgerEntry(ledger, updated)
  );
}

function replaceIssueBody(
  input: ExecuteApprovedXPostInput,
  guid: string,
  mainText: string,
  replyText: string
): void {
  const episode = input.loadEpisode(guid);
  if (!episode) return;
  const texts = buildNewEpisodePostTexts(episode);
  try {
    input.issues.replaceBody(
      input.issueNumber,
      buildEpisodePostIssueBody({
        guid,
        episodePageUrl: texts.episodePageUrl,
        shareImageUrl: texts.shareImageUrl,
        mainTweetText: mainText,
        urlsTweetText: replyText,
      })
    );
  } catch (error) {
    input.log(`Could not refresh the issue body: ${(error as Error).name}`);
  }
}

function notifyUnauthorized(
  input: ExecuteApprovedXPostInput,
  reason: 'allowlist_empty' | 'not_approver'
): void {
  const assignee = input.assigneeLogin?.trim().toLowerCase() ?? '';
  const sender = input.senderLogin.trim().toLowerCase();
  if (!assignee || assignee !== sender) return;
  comment(
    input,
    reason === 'allowlist_empty'
      ? allowlistEmptyComment()
      : notApproverComment()
  );
}

function comment(input: ExecuteApprovedXPostInput, body: string): void {
  try {
    input.issues.comment(input.issueNumber, body);
  } catch (error) {
    input.log(`Could not comment on the issue: ${(error as Error).name}`);
  }
}

function removeLabel(input: ExecuteApprovedXPostInput): void {
  try {
    input.issues.removeLabel(input.issueNumber, X_POST_APPROVAL_LABEL);
  } catch (error) {
    input.log(`Could not remove the approval label: ${(error as Error).name}`);
  }
}

function closeIssue(input: ExecuteApprovedXPostInput): void {
  try {
    input.issues.close(input.issueNumber);
  } catch (error) {
    input.log(`Could not close the issue: ${(error as Error).name}`);
  }
}
