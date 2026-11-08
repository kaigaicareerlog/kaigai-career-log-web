import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  applyPublishResult,
  claimPublish,
  emptyXPostLedger,
  parseXPostLedger,
  withAwaitingApprovalEntry,
  type XPostLedgerEntry,
} from './xPostLedger';

const guid = '11111111-1111-4111-8111-111111111111';

function entry(): XPostLedgerEntry {
  return withAwaitingApprovalEntry(emptyXPostLedger(), {
    guid,
    issueNumber: 10,
    mainText: 'main',
    replyText: 'reply',
    updatedAt: '2026-11-08T00:00:00.000Z',
  }).entries[0] as XPostLedgerEntry;
}

describe('xPostLedger', () => {
  it('rejects a duplicate guid', () => {
    const ledger = withAwaitingApprovalEntry(emptyXPostLedger(), {
      guid,
      issueNumber: 10,
      mainText: 'main',
      replyText: 'reply',
      updatedAt: '2026-11-08T00:00:00.000Z',
    });
    assert.throws(() =>
      parseXPostLedger({
        ...ledger,
        entries: [...ledger.entries, ...ledger.entries],
      })
    );
  });

  it('lets only one claim succeed and does not clear an ambiguous main', () => {
    const first = claimPublish(entry(), 'main', 'run-1', 't1');
    const second = claimPublish(
      first as XPostLedgerEntry,
      'main',
      'run-2',
      't2'
    );
    assert.equal(first?.status, 'main_in_flight');
    assert.equal(second, null);

    const ambiguous = applyPublishResult(
      first as XPostLedgerEntry,
      'main',
      { ok: false, outcome: 'ambiguous' },
      't3'
    );
    assert.equal(ambiguous.status, 'needs_review');
    assert.equal(ambiguous.mainTweetId, undefined);

    const rejected = applyPublishResult(
      first as XPostLedgerEntry,
      'main',
      { ok: false, outcome: 'rejected', status: 403 },
      't4'
    );
    assert.equal(rejected.status, 'awaiting_approval');

    const posted = applyPublishResult(
      first as XPostLedgerEntry,
      'main',
      { ok: true, tweetId: '555' },
      't5'
    );
    assert.equal(posted.status, 'reply_pending');
    assert.equal(posted.mainTweetId, '555');
    const retry = claimPublish(posted, 'reply', 'run-3', 't6');
    assert.equal(retry?.status, 'reply_in_flight');
    const replied = applyPublishResult(
      retry as XPostLedgerEntry,
      'reply',
      { ok: false, outcome: 'rejected', status: 400 },
      't7'
    );
    assert.equal(replied.status, 'reply_pending');
    assert.equal(replied.mainTweetId, '555');
  });
});
