import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { PodcastEpisode } from '../../types';
import { parseEpisodePostIssue } from './parseEpisodePostIssue';
import {
  describeManualApprovalRefusal,
  planManualApprovalIssue,
} from './planManualApprovalIssue';
import {
  emptyXPostLedger,
  withAwaitingApprovalEntry,
  type XPostLedger,
  type XPostStatus,
} from './xPostLedger';

const guid = 'e43ae872-c683-4586-ba40-06c1fd852fd9';

function episode(): PodcastEpisode {
  return {
    guid,
    title: '直談判でリファラル獲得',
    description: '',
    duration: '00:30:00',
    date: '2026-11-08',
    link: '',
    audioUrl: '',
    spotifyUrl: 'https://open.spotify.com/episode/abc',
    newEpisodeIntroPostedToX: true,
  };
}

function ledgerWithStatus(status: XPostStatus): XPostLedger {
  const ledger = withAwaitingApprovalEntry(emptyXPostLedger(), {
    guid,
    issueNumber: 59,
    mainText: 'main',
    replyText: 'reply',
    updatedAt: '2026-11-09T00:00:00.000Z',
  });
  const entry = ledger.entries[0];
  if (!entry) throw new Error('missing entry');
  entry.status = status;
  return ledger;
}

describe('planManualApprovalIssue', () => {
  it('builds a new-format issue even when the episode was already flagged', () => {
    const plan = planManualApprovalIssue({
      guid: `  ${guid.toUpperCase()}  `,
      episode: episode(),
      ledger: emptyXPostLedger(),
    });
    assert.equal(plan.action, 'create');
    if (plan.action !== 'create') return;
    assert.equal(plan.guid, guid);
    const parsed = parseEpisodePostIssue(plan.body);
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    assert.equal(parsed.guid, guid);
    assert.equal(parsed.mainText, plan.mainText);
    assert.equal(parsed.replyText, plan.replyText);
    assert.equal(plan.body.includes('メインツイートにだけ'), true);
    assert.equal(plan.body.includes('twitter.com/intent/tweet'), false);
    assert.equal(plan.body.includes('x-post-approved'), true);
  });

  it('rejects input that is not a bare UUID', () => {
    for (const value of [
      '',
      `${guid}; rm -rf /`,
      '$(id)',
      `https://evil.test/${guid}`,
      guid.slice(0, -1),
    ]) {
      const plan = planManualApprovalIssue({
        guid: value,
        episode: episode(),
        ledger: emptyXPostLedger(),
      });
      assert.equal(plan.action, 'invalid_guid', value);
      if (plan.action !== 'invalid_guid') continue;
      const message = describeManualApprovalRefusal(plan);
      if (value.length > 0) assert.equal(message.includes(value), false);
      assert.equal(message.includes('No issue was created'), true);
    }
  });

  it('refuses a second issue for an awaiting or published row', () => {
    for (const status of ['awaiting_approval', 'published'] as const) {
      const plan = planManualApprovalIssue({
        guid,
        episode: episode(),
        ledger: ledgerWithStatus(status),
      });
      assert.deepEqual(plan, { action: 'already_recorded', status });
    }
  });

  it('refuses every other recorded status too', () => {
    for (const status of [
      'main_in_flight',
      'reply_pending',
      'reply_in_flight',
      'needs_review',
    ] as const) {
      const plan = planManualApprovalIssue({
        guid,
        episode: episode(),
        ledger: ledgerWithStatus(status),
      });
      assert.equal(plan.action, 'already_recorded');
    }
  });

  it('does not plan an issue when the episode is missing', () => {
    const plan = planManualApprovalIssue({
      guid,
      episode: null,
      ledger: emptyXPostLedger(),
    });
    assert.equal(plan.action, 'episode_missing');
  });
});
