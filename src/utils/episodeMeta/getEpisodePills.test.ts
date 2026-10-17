import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { EpisodeMeta } from '../../types';
import { getEpisodePills } from './getEpisodePills';

const meta: EpisodeMeta = {
  guests: [
    { name: 'Naoya', position: 'SRE', company: 'Shopify' },
    { name: 'Aoi', position: 'デザイナー', company: 'Shopify' },
  ],
  roles: ['sre-infra'],
  countries: ['canada', 'usa'],
  cities: ['vancouver', 'toronto'],
  topics: ['visa', 'english'],
  reviewed: true,
};

describe('getEpisodePills', () => {
  it('never exposes the guest name', () => {
    const all = getEpisodePills(meta, 'page').map((pill) => pill.label);
    assert.equal(all.includes('Naoya'), false);
    assert.equal(all.includes('Aoi'), false);
  });

  it('card variant shows one pill per kind, in order', () => {
    assert.deepEqual(getEpisodePills(meta, 'card'), [
      { kind: 'position', label: 'SRE' },
      { kind: 'company', label: 'Shopify' },
      { kind: 'place', label: 'バンクーバー', slug: 'vancouver' },
      { kind: 'place', label: 'カナダ', slug: 'canada' },
    ]);
  });

  it('gives place and topic pills their tag slug, but not position or company', () => {
    const pills = getEpisodePills(meta, 'page');
    const slugOf = (label: string) =>
      pills.find((p) => p.label === label)?.slug;
    assert.equal(slugOf('トロント'), 'toronto');
    assert.equal(slugOf('ビザ・永住権'), 'visa');
    assert.equal(slugOf('SRE'), undefined);
    assert.equal(slugOf('Shopify'), undefined);
  });

  it('page variant shows everything, de-duplicated, plus topics', () => {
    const labels = getEpisodePills(meta, 'page').map((pill) => pill.label);
    assert.deepEqual(labels, [
      'SRE',
      'デザイナー',
      'Shopify',
      'バンクーバー',
      'トロント',
      'カナダ',
      'アメリカ',
      'ビザ・永住権',
      '英語',
    ]);
  });

  it('returns nothing when the episode has no metadata', () => {
    assert.deepEqual(getEpisodePills(undefined, 'card'), []);
  });
});
