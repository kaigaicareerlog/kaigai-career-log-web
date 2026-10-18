import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { checkGuestTalksMost } from './checkGuestTalksMost';

describe('checkGuestTalksMost', () => {
  const utterances = [
    { speaker: 'Senna', text: '質問です' },
    { speaker: 'Ryo', text: 'とても長い回答をしています' },
  ];

  it('is quiet when the guest talks the most', () => {
    assert.equal(checkGuestTalksMost(utterances, ['Ryo']), null);
  });

  it('warns when someone else talks more than the guest', () => {
    assert.match(
      checkGuestTalksMost(utterances, ['Senna']) ?? '',
      /（Senna）より Ryo/
    );
  });

  it('is quiet for episodes without a named guest in the transcript', () => {
    assert.equal(checkGuestTalksMost(utterances, []), null);
    assert.equal(checkGuestTalksMost(utterances, ['Yu']), null);
  });
});
