import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  getSpeakerDisplayName,
  isUnresolvedSpeakerLabel,
} from './speakerLabel';

describe('getSpeakerDisplayName', () => {
  it('shows an unresolved letter as 話者A without picking a host', () => {
    assert.equal(getSpeakerDisplayName('A'), '話者A');
    assert.equal(getSpeakerDisplayName('C'), '話者C');
    assert.equal(isUnresolvedSpeakerLabel('B'), true);
    assert.notEqual(getSpeakerDisplayName('A'), 'Ryo');
  });

  it('shows speaker_N as 話者N and keeps the number that was stored', () => {
    assert.equal(getSpeakerDisplayName('speaker_3'), '話者3');
    assert.equal(getSpeakerDisplayName('speaker_03'), '話者03');
    assert.equal(isUnresolvedSpeakerLabel('speaker_3'), true);
  });

  it('keeps a known host name and any other real name', () => {
    assert.equal(getSpeakerDisplayName('Ryo'), 'Ryo');
    assert.equal(getSpeakerDisplayName('Mamoru'), 'Mamoru');
    assert.equal(isUnresolvedSpeakerLabel('Ryo'), false);
    assert.equal(isUnresolvedSpeakerLabel('Mamoru'), false);
  });
});
