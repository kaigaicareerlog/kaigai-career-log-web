import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { EpisodeMeta } from '../../types';
import { buildEpisodeSearchText } from './buildEpisodeSearchText';
import { matchesTerms, tokenizeQuery } from './searchText';

const episode = { title: '#1 テスト回', description: 'ゲストが語る。' };
const meta: EpisodeMeta = {
  guests: [{ name: 'Naoya', position: 'SRE', company: 'Shopify' }],
  roles: ['sre-infra'],
  countries: ['canada'],
  cities: ['vancouver'],
  topics: ['visa'],
  reviewed: false,
};

const matches = (query: string) =>
  matchesTerms(buildEpisodeSearchText(episode, meta), tokenizeQuery(query));

describe('buildEpisodeSearchText', () => {
  it('finds the episode by position, company, city, country and name', () => {
    for (const query of ['sre', 'shopify', 'バンクーバー', 'カナダ', 'naoya']) {
      assert.equal(matches(query), true, query);
    }
  });

  it('finds it through aliases and combined terms', () => {
    assert.equal(matches('Canada'), true);
    assert.equal(matches('北米'), true);
    assert.equal(matches('ワーホリ'), true);
    assert.equal(matches('vancouver sre'), true);
  });

  it('does not match unrelated terms', () => {
    assert.equal(matches('トロント'), false);
    assert.equal(matches('sre designer'), false);
  });

  it('still works for episodes that have no metadata yet', () => {
    const text = buildEpisodeSearchText(episode, undefined);
    assert.equal(matchesTerms(text, tokenizeQuery('テスト')), true);
    assert.equal(matchesTerms(text, tokenizeQuery('shopify')), false);
  });
});
