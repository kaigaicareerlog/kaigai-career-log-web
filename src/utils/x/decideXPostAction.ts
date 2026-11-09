import { X_POST_APPROVAL_LABEL } from '../../constants/xPost';
import { isAllowlisted } from './parseApproverAllowlist';
import type { EpisodePostParse } from './parseEpisodePostIssue';
import { isTweetId, type XPostLedgerEntry } from './xPostLedger';

export type ApprovalDecision =
  | {
      kind: 'noop';
      reason: 'not_approval_label' | 'allowlist_empty' | 'not_approver';
    }
  | {
      kind: 'stop';
      reason:
        | 'out_of_scope'
        | 'no_ledger'
        | 'issue_mismatch'
        | 'episode_missing'
        | 'needs_review';
      comment: string;
    }
  | { kind: 'mark_needs_review'; reason: string; comment: string }
  | {
      kind: 'reapprove';
      comment: string;
      guid: string;
      mainText: string;
      replyText: string;
    }
  | {
      kind: 'already_published';
      mainTweetId: string;
      replyTweetId: string;
      comment: string;
    }
  | {
      kind: 'publish';
      phase: 'main' | 'reply';
      guid: string;
      mainText: string;
      replyText: string;
      mainTweetId?: string;
    };

export interface DecideXPostActionInput {
  labelName: string;
  senderLogin: string;
  allowlist: ReadonlySet<string>;
  issueNumber: number;
  parsed: EpisodePostParse;
  episodeFound: boolean;
  regeneratedMain: string | null;
  regeneratedReply: string | null;
  entry: XPostLedgerEntry | null;
}

/**
 * Decides whether this label event may publish.
 * Fail closed: empty allowlist, unknown issue, drifted text, and an in-flight
 * attempt never produce a publish decision.
 */
export function decideXPostAction(
  input: DecideXPostActionInput
): ApprovalDecision {
  if (input.labelName !== X_POST_APPROVAL_LABEL) {
    return { kind: 'noop', reason: 'not_approval_label' };
  }
  if (input.allowlist.size === 0) {
    return { kind: 'noop', reason: 'allowlist_empty' };
  }
  if (!isAllowlisted(input.allowlist, input.senderLogin)) {
    return { kind: 'noop', reason: 'not_approver' };
  }

  const guid = input.parsed.guid;
  if (!guid) {
    return {
      kind: 'stop',
      reason: 'out_of_scope',
      comment:
        'このIssueは新着エピソードのX承認対象ではないため公開しません。ラベルを外しました。',
    };
  }
  if (!input.entry || input.entry.guid !== guid) {
    return {
      kind: 'stop',
      reason: 'no_ledger',
      comment:
        'このIssueに対応する承認待ち記録が台帳にないため公開しません。この仕組みの導入前に作られたIssueは、ラベルを付けても投稿されません。',
    };
  }
  if (input.entry.issueNumber !== input.issueNumber) {
    return {
      kind: 'stop',
      reason: 'issue_mismatch',
      comment:
        '台帳に記録されたIssue番号と一致しないため公開しません。ラベルを外しました。',
    };
  }

  if (
    input.entry.status === 'main_in_flight' ||
    input.entry.status === 'reply_in_flight'
  ) {
    return {
      kind: 'mark_needs_review',
      reason: 'in_flight',
      comment: needsReviewComment(),
    };
  }
  if (input.entry.status === 'needs_review') {
    return {
      kind: 'stop',
      reason: 'needs_review',
      comment: needsReviewComment(),
    };
  }
  if (input.entry.status === 'published') {
    if (
      isTweetId(input.entry.mainTweetId) &&
      isTweetId(input.entry.replyTweetId)
    ) {
      return {
        kind: 'already_published',
        mainTweetId: input.entry.mainTweetId,
        replyTweetId: input.entry.replyTweetId,
        comment: '',
      };
    }
    return {
      kind: 'mark_needs_review',
      reason: 'published_missing_id',
      comment: needsReviewComment(),
    };
  }

  if (
    !input.episodeFound ||
    input.regeneratedMain === null ||
    input.regeneratedReply === null
  ) {
    return {
      kind: 'stop',
      reason: 'episode_missing',
      comment:
        '台帳のエピソードが現在のカタログにないため公開しません。ラベルを外しました。',
    };
  }

  if (
    input.entry.status === 'awaiting_approval' &&
    (input.entry.mainTweetId || input.entry.postedMainText)
  ) {
    return {
      kind: 'mark_needs_review',
      reason: 'inconsistent_main',
      comment: needsReviewComment(),
    };
  }
  if (
    input.entry.status === 'reply_pending' &&
    (!isTweetId(input.entry.mainTweetId) || !input.entry.postedMainText)
  ) {
    return {
      kind: 'mark_needs_review',
      reason: 'reply_missing_main',
      comment: needsReviewComment(),
    };
  }

  const desired = desiredTexts(
    input.entry,
    input.regeneratedMain,
    input.regeneratedReply
  );
  const issueMatches =
    input.parsed.ok &&
    input.parsed.mainText === desired.main &&
    input.parsed.replyText === desired.reply;
  const ledgerMatches =
    input.entry.mainText === desired.main &&
    input.entry.replyText === desired.reply;
  if (!issueMatches || !ledgerMatches) {
    return {
      kind: 'reapprove',
      guid,
      mainText: desired.main,
      replyText: desired.reply,
      comment: input.entry.postedMainText
        ? 'メインは公開済みのため再送しません。本文が現在のエピソードデータと一致しないので、返信は公開せず再承認に戻しました。Issueを確認してラベルを付け直してください。'
        : '承認した本文と、現在のエピソードデータから作った本文が一致しないため公開しません。Issueを最新の文面に更新したので、確認してラベルを付け直してください。',
    };
  }

  if (input.entry.status === 'awaiting_approval') {
    return {
      kind: 'publish',
      phase: 'main',
      guid,
      mainText: desired.main,
      replyText: desired.reply,
    };
  }
  if (input.entry.status === 'reply_pending' && input.entry.mainTweetId) {
    return {
      kind: 'publish',
      phase: 'reply',
      guid,
      mainText: desired.main,
      replyText: desired.reply,
      mainTweetId: input.entry.mainTweetId,
    };
  }
  return {
    kind: 'mark_needs_review',
    reason: 'unexpected_status',
    comment: needsReviewComment(),
  };
}

function desiredTexts(
  entry: XPostLedgerEntry,
  regeneratedMain: string,
  regeneratedReply: string
): { main: string; reply: string } {
  if (entry.postedMainText) {
    return { main: entry.postedMainText, reply: regeneratedReply };
  }
  return { main: regeneratedMain, reply: regeneratedReply };
}

function needsReviewComment(): string {
  return [
    '前回の投稿試行の成否を確認できないため、自動では再送しません。',
    'Xのアカウントで、該当時刻の投稿があるかを確認してください。',
    '- メインが無い場合: `src/data/xPostLedger.json` のこの guid の status を `awaiting_approval` に戻し、`mainTweetId` と `postedMainText` と `inFlightRunId` を消してから、ラベルを付け直してください。',
    '- メインがあり返信が無い場合: `mainTweetId` にその投稿IDを入れ、`postedMainText` に公開した本文を入れ、status を `reply_pending` にしてから、ラベルを付け直してください。返信だけを送ります。',
    '- 両方ある場合: 両方の投稿IDを入れ、status を `published` にしてください。自動では何も送りません。',
  ].join('\n');
}
