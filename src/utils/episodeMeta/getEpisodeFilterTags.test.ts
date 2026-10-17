import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { EpisodeMeta } from '../../types';
import { getEpisodeFilterTags } from './getEpisodeFilterTags';

const meta: EpisodeMeta = {
  guests: [],
  roles: [],
  countries: ['canada'],
  cities: [],
  topics: ['visa'],
  reviewed: false,
};

describe('getEpisodeFilterTags', () => {
  it('adds `special` for a 特別回', () => {
    assert.deepEqual(getEpisodeFilterTags('【特別回】みんなで話す', meta), [
      'canada',
      'visa',
      'special',
    ]);
  });

  it('does not add it for a regular episode', () => {
    assert.deepEqual(getEpisodeFilterTags('逆転戦略（後半）#46', meta), [
      'canada',
      'visa',
    ]);
  });

  it('still marks a special episode that has no tags yet', () => {
    assert.deepEqual(getEpisodeFilterTags('【対談】テスト', undefined), [
      'special',
    ]);
  });
});
