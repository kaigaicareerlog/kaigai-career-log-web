import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { EpisodeMeta } from '../../types';
import { getEpisodeTagSlugs } from './getEpisodeTagSlugs';

const meta: EpisodeMeta = {
  guests: [],
  roles: ['engineer'],
  countries: ['canada'],
  cities: ['vancouver'],
  topics: ['visa', 'english'],
  reviewed: false,
};

describe('getEpisodeTagSlugs', () => {
  it('lists every tag slug across all kinds', () => {
    assert.deepEqual(getEpisodeTagSlugs(meta), [
      'engineer',
      'canada',
      'vancouver',
      'visa',
      'english',
    ]);
  });

  it('returns an empty list for an untagged episode', () => {
    assert.deepEqual(getEpisodeTagSlugs(undefined), []);
  });
});
