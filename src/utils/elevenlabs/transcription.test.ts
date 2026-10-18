import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { groupWordsIntoUtterances } from './transcription';

describe('groupWordsIntoUtterances', () => {
  it('starts a new utterance when the speaker changes', () => {
    const utterances = groupWordsIntoUtterances([
      { text: 'こんにちは', start: 0, end: 1, type: 'word', speaker_id: 'speaker_0' },
      { text: '。', start: 1, end: 1.1, type: 'word', speaker_id: 'speaker_0' },
      { text: 'はい', start: 1.5, end: 2, type: 'word', speaker_id: 'speaker_1' },
    ]);

    assert.equal(utterances.length, 2);
    assert.equal(utterances[0].text, 'こんにちは。');
    assert.equal(utterances[1].speaker, 'speaker_1');
    assert.equal(utterances[1].start, 1500);
  });

  it('keeps spacing and ignores audio events', () => {
    const utterances = groupWordsIntoUtterances([
      { text: 'I', start: 0, end: 0.2, type: 'word', speaker_id: 'speaker_0' },
      { text: ' ', type: 'spacing' },
      { text: '(laughter)', start: 0.2, end: 0.5, type: 'audio_event' },
      { text: 'see', start: 0.5, end: 0.8, type: 'word', speaker_id: 'speaker_0' },
    ]);

    assert.equal(utterances.length, 1);
    assert.equal(utterances[0].text, 'I see');
  });
});
