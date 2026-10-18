import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildSpeakerExcerpt } from './buildSpeakerExcerpt';

describe('buildSpeakerExcerpt', () => {
  it('keeps the opening and samples every speaker later on', () => {
    const excerpt = buildSpeakerExcerpt([
      { speaker: 'speaker_0', text: 'FROGのSennaです。', start: 0 },
      { speaker: 'speaker_1', text: 'Ryoです。', start: 5000 },
      {
        speaker: 'speaker_2',
        text: 'ゲストの方が長めに話している発言です。ここで初めて登場します。',
        start: 10 * 60 * 1000,
      },
      { speaker: 'speaker_2', text: 'うん', start: 11 * 60 * 1000 },
    ]);

    assert.equal(
      excerpt,
      [
        'Opening:',
        '[speaker_0] FROGのSennaです。',
        '[speaker_1] Ryoです。',
        '',
        'Later lines:',
        '[speaker_2] ゲストの方が長めに話している発言です。ここで初めて登場します。',
      ].join('\n')
    );
  });
});
