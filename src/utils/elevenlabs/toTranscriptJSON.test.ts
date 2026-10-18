import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { toTranscriptJSON } from './toTranscriptJSON';

describe('toTranscriptJSON', () => {
  it('keeps the stored format, applies corrections and drops empty utterances', () => {
    const json = toTranscriptJSON({
      result: {
        text: ' リードコードやってた ',
        utterances: [
          {
            speaker: 'speaker_0',
            text: 'リードコードやってた',
            start: 61000,
            end: 62000,
            words: [],
          },
          {
            speaker: 'speaker_1',
            text: ' ',
            start: 62000,
            end: 62100,
            words: [],
          },
        ],
        words: [],
        audio_duration: 62100,
      },
      episodeGuid: 'g',
      episodeTitle: 't',
      durationSeconds: 3924,
      corrections: [{ from: 'リードコード', to: 'LeetCode' }],
      transcribedAt: new Date('2026-10-18T00:00:00Z'),
    });

    assert.deepEqual(json, {
      episodeGuid: 'g',
      episodeTitle: 't',
      transcribedAt: '2026-10-18T00:00:00.000Z',
      transcriber: 'elevenlabs-scribe-v2',
      duration: 3924,
      fullText: 'LeetCodeやってた',
      utterances: [
        {
          speaker: 'speaker_0',
          text: 'LeetCodeやってた',
          start: 61000,
          end: 62000,
          timestamp: '01:01',
        },
      ],
    });
  });
});
