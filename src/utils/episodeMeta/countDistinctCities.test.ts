import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { EpisodeMeta } from '../../types';
import { countDistinctCities } from './countDistinctCities';

const episode = (cities: string[]): EpisodeMeta => ({
  guests: [],
  roles: [],
  countries: [],
  cities,
  topics: [],
  reviewed: false,
});

describe('countDistinctCities', () => {
  it('counts each city once however many episodes mention it', () => {
    assert.equal(
      countDistinctCities({
        a: episode(['vancouver']),
        b: episode(['vancouver', 'toronto']),
        c: episode([]),
      }),
      2
    );
  });

  it('is zero when nothing is tagged', () => {
    assert.equal(countDistinctCities({}), 0);
  });
});
