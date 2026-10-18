import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { EpisodeMeta } from '../../types';
import { applyCorrections, buildKeyterms, type Glossary } from './glossary';

const glossary: Glossary = {
  keyterms: ['FROG', 'Asana'],
  corrections: [{ from: 'リードコード', to: 'LeetCode' }],
};
const meta = (guests: EpisodeMeta['guests']): EpisodeMeta => ({
  guests,
  roles: [],
  countries: [],
  cities: [],
  topics: [],
  reviewed: false,
});

describe('buildKeyterms', () => {
  it('puts guest names and companies first and drops duplicates', () => {
    const terms = buildKeyterms(
      glossary,
      meta([{ name: 'Ryo', position: null, company: 'Asana' }])
    );
    assert.deepEqual(terms, ['Ryo', 'Asana', 'FROG']);
  });

  it('skips empty values and terms Scribe rejects', () => {
    const terms = buildKeyterms(
      {
        keyterms: ['a'.repeat(50), 'one two three four five six', '[x]', 'ok'],
        corrections: [],
      },
      meta([{ name: null, position: null, company: ' ' }])
    );
    assert.deepEqual(terms, ['ok']);
  });

  it('works without episode metadata', () => {
    assert.deepEqual(buildKeyterms(glossary, undefined), ['FROG', 'Asana']);
  });
});

describe('applyCorrections', () => {
  it('replaces every occurrence', () => {
    assert.equal(
      applyCorrections('リードコードとリードコード', glossary.corrections),
      'LeetCodeとLeetCode'
    );
  });
});
