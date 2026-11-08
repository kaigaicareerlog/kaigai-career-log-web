import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { X_POST_HOSTS } from '../../constants/xPost';
import type { PodcastEpisode } from '../../types';
import { parseCreatedIssueNumber } from './parseCreatedIssueNumber';
import { parseEpisodePostIssue } from './parseEpisodePostIssue';
import { planEpisodeIssueNotification } from './planEpisodeIssueNotification';
import { emptyXPostLedger, withAwaitingApprovalEntry } from './xPostLedger';

const guid = '11111111-1111-4111-8111-111111111111';

function episode(): PodcastEpisode {
  return {
    guid,
    title: '新しい回',
    description: '',
    duration: '00:30:00',
    date: '2026-11-08',
    link: '',
    audioUrl: '',
  };
}

describe('planEpisodeIssueNotification', () => {
  it('builds an issue whose parsed text matches the canonical hosts', () => {
    const plan = planEpisodeIssueNotification({
      episode: episode(),
      hosts: X_POST_HOSTS,
      ledger: emptyXPostLedger(),
    });
    assert.equal(plan.action, 'create');
    if (plan.action !== 'create') return;
    const parsed = parseEpisodePostIssue(plan.body);
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    assert.equal(parsed.mainText, plan.mainText);
    assert.equal(parsed.mainText.includes(X_POST_HOSTS), true);
    assert.equal(parsed.replyText, plan.replyText);
  });

  it('does not plan a second issue when the ledger already has the episode', () => {
    const ledger = withAwaitingApprovalEntry(emptyXPostLedger(), {
      guid,
      issueNumber: 4,
      mainText: 'main',
      replyText: 'reply',
      updatedAt: '2026-11-08T00:00:00.000Z',
    });
    const plan = planEpisodeIssueNotification({
      episode: episode(),
      hosts: X_POST_HOSTS,
      ledger,
    });
    assert.deepEqual(plan, { action: 'mark_flag_only', guid });
  });

  it('rejects a host list that would not match approval', () => {
    const plan = planEpisodeIssueNotification({
      episode: episode(),
      hosts: '@someone',
      ledger: emptyXPostLedger(),
    });
    assert.equal(plan.action, 'invalid_hosts');
  });
});

describe('parseCreatedIssueNumber', () => {
  it('reads only the issue number at the end of a gh URL', () => {
    assert.equal(
      parseCreatedIssueNumber(
        'https://github.com/kaigaicareerlog/kaigai-career-log-web/issues/70\n'
      ),
      70
    );
    assert.equal(
      parseCreatedIssueNumber('https://example.com/not-an-issue'),
      null
    );
  });
});
