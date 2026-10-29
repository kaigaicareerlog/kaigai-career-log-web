import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveSpeakerMap } from './resolveSpeakerMap';

const base = {
  labels: ['speaker_0', 'speaker_1', 'speaker_2'],
  knownNames: ['Ryo', 'Senna', 'Hiroshi'],
  excerpt: 'FROGのSennaです。Junpeiです。Ryoさんの話。',
};

describe('resolveSpeakerMap', () => {
  it('maps confident guesses to known or mentioned names', () => {
    const { map, unresolved } = resolveSpeakerMap({
      ...base,
      guesses: [
        { label: 'speaker_0', name: 'senna', confidence: 'high' },
        { label: 'speaker_1', name: 'Junpei', confidence: 'high' },
        { label: 'speaker_2', name: 'Ryo', confidence: 'high' },
      ],
    });
    assert.deepEqual(map, {
      speaker_0: 'Senna',
      speaker_1: 'Junpei',
      speaker_2: 'Ryo',
    });
    assert.deepEqual(unresolved, []);
  });

  it('rejects a host name that never appears in the excerpt', () => {
    const { map, unresolved } = resolveSpeakerMap({
      ...base,
      guesses: [{ label: 'speaker_0', name: 'Hiroshi', confidence: 'high' }],
      labels: ['speaker_0'],
    });
    assert.deepEqual(map, {});
    assert.match(unresolved[0].reason, /not mentioned/);
  });

  it('leaves low-confidence, non-romaji and unknown names alone', () => {
    const { map, unresolved } = resolveSpeakerMap({
      ...base,
      guesses: [
        { label: 'speaker_0', name: 'Senna', confidence: 'low' },
        { label: 'speaker_1', name: '淳平', confidence: 'high' },
        { label: 'speaker_2', name: 'Taro', confidence: 'high' },
      ],
    });
    assert.deepEqual(map, {});
    assert.deepEqual(
      unresolved.map((u) => u.label),
      ['speaker_0', 'speaker_1', 'speaker_2']
    );
  });

  it('drops both labels when they claim the same person', () => {
    const { map, unresolved } = resolveSpeakerMap({
      ...base,
      guesses: [
        { label: 'speaker_0', name: 'Ryo', confidence: 'high' },
        { label: 'speaker_1', name: 'Ryo', confidence: 'high' },
        { label: 'speaker_2', name: 'Senna', confidence: 'high' },
      ],
    });
    assert.deepEqual(map, { speaker_2: 'Senna' });
    assert.equal(unresolved.length, 2);
  });

  it('names the one remaining speaker by elimination', () => {
    const { map, unresolved, byElimination } = resolveSpeakerMap({
      ...base,
      guesses: [
        { label: 'speaker_0', name: 'Senna', confidence: 'high' },
        { label: 'speaker_1', name: 'Junpei', confidence: 'high' },
        { label: 'speaker_2', name: null, confidence: 'low' },
      ],
    });
    assert.deepEqual(map, {
      speaker_0: 'Senna',
      speaker_1: 'Junpei',
      speaker_2: 'Ryo',
    });
    assert.deepEqual(unresolved, []);
    assert.deepEqual(byElimination, ['speaker_2']);
  });

  it('does not use elimination when more than one person is left', () => {
    const { map } = resolveSpeakerMap({
      ...base,
      excerpt: `${base.excerpt}Hiroshiさん`,
      guesses: [
        { label: 'speaker_0', name: 'Senna', confidence: 'high' },
        { label: 'speaker_1', name: 'Junpei', confidence: 'high' },
      ],
    });
    assert.deepEqual(map, { speaker_0: 'Senna', speaker_1: 'Junpei' });
  });

  it('does not use elimination when more than one speaker is unclear', () => {
    const { map } = resolveSpeakerMap({
      ...base,
      guesses: [
        { label: 'speaker_0', name: 'Senna', confidence: 'high' },
        { label: 'speaker_1', name: 'Hiroshi', confidence: 'low' },
        { label: 'speaker_2', name: 'Ryo', confidence: 'low' },
      ],
    });
    assert.deepEqual(map, { speaker_0: 'Senna' });
  });

  it('reports labels the model skipped', () => {
    const { unresolved } = resolveSpeakerMap({ ...base, guesses: [] });
    assert.equal(unresolved.length, 3);
  });

  it('accepts a host who is only mentioned by an alias', () => {
    const { map, unresolved, byElimination } = resolveSpeakerMap({
      ...base,
      aliases: { Ryo: ['Togashi'] },
      excerpt: 'ホストはTogashiと、FROGのSennaです。Mamoruです。',
      guesses: [
        { label: 'speaker_0', name: 'Ryo', confidence: 'high' },
        { label: 'speaker_1', name: 'Mamoru', confidence: 'high' },
        { label: 'speaker_2', name: null, confidence: 'low' },
      ],
    });
    assert.deepEqual(map, {
      speaker_0: 'Ryo',
      speaker_1: 'Mamoru',
      speaker_2: 'Senna',
    });
    assert.deepEqual(unresolved, []);
    assert.deepEqual(byElimination, ['speaker_2']);
  });

  it('saves a guessed alias under the known name', () => {
    const { map } = resolveSpeakerMap({
      ...base,
      aliases: { Ryo: ['Togashi'] },
      excerpt: 'Togashiです',
      labels: ['speaker_0'],
      guesses: [{ label: 'speaker_0', name: 'Togashi', confidence: 'high' }],
    });
    assert.deepEqual(map, { speaker_0: 'Ryo' });
  });
});
