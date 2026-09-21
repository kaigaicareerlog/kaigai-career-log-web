import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { matchesTerms, normalizeSearchText, tokenizeQuery } from './searchText';

describe('normalizeSearchText', () => {
  it('unifies full-width forms, case and whitespace', () => {
    assert.equal(normalizeSearchText('  ＳＲＥ　Canada \n'), 'sre canada');
  });
});

describe('tokenizeQuery', () => {
  it('splits on half- and full-width spaces', () => {
    assert.deepEqual(tokenizeQuery('バンクーバー　エンジニア  Asana'), [
      'バンクーバー',
      'エンジニア',
      'asana',
    ]);
  });

  it('returns no terms for an empty query', () => {
    assert.deepEqual(tokenizeQuery('   '), []);
  });
});

describe('matchesTerms', () => {
  const text = normalizeSearchText('カナダ バンクーバー SRE Shopify');

  it('requires every term to match', () => {
    assert.equal(matchesTerms(text, ['バンクーバー', 'sre']), true);
    assert.equal(matchesTerms(text, ['バンクーバー', 'designer']), false);
  });

  it('matches everything when there are no terms', () => {
    assert.equal(matchesTerms(text, []), true);
  });
});
