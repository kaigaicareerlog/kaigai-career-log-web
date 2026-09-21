import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseEpisodeMeta } from './parseEpisodeMeta';

describe('parseEpisodeMeta', () => {
  it('maps labels and aliases to slugs and marks the result unreviewed', () => {
    const { meta, warnings } = parseEpisodeMeta({
      guests: [{ name: 'Naoya', position: 'SRE', company: 'Shopify' }],
      roles: ['SRE・インフラ', 'engineer'],
      countries: ['カナダ', 'Canada'],
      cities: ['Vancouver'],
      topics: ['ビザ・永住権', '英語'],
    });

    assert.deepEqual(meta.roles, ['sre-infra', 'engineer']);
    assert.deepEqual(meta.countries, ['canada']);
    assert.deepEqual(meta.cities, ['vancouver']);
    assert.deepEqual(meta.topics, ['visa', 'english']);
    assert.equal(meta.reviewed, false);
    assert.deepEqual(warnings, []);
  });

  it('drops values outside the vocabulary and reports them', () => {
    const { meta, warnings } = parseEpisodeMeta({
      guests: [],
      roles: ['宇宙飛行士'],
      countries: [],
      cities: [],
      topics: [],
      otherPlaces: ['ウォータールー大学'],
    });

    assert.deepEqual(meta.roles, []);
    assert.deepEqual(warnings, [
      'unknown role: 宇宙飛行士',
      'place not in vocabulary: ウォータールー大学',
    ]);
  });

  it('accepts slugs and ignores otherPlaces that are already in the vocabulary', () => {
    const { meta, warnings } = parseEpisodeMeta({
      roles: ['sre-infra'],
      countries: ['canada'],
      topics: ['job-change', 'no-experience'],
      otherPlaces: ['サンフランシスコ', 'Canada'],
    });

    assert.deepEqual(meta.roles, ['sre-infra']);
    assert.deepEqual(meta.topics, ['job-change', 'no-experience']);
    assert.deepEqual(warnings, []);
  });

  it('turns "unknown" style values into null and skips empty guests', () => {
    const { meta } = parseEpisodeMeta({
      guests: [
        { name: '不明', position: 'null', company: '' },
        { name: 'Aoi', position: 'グラフィックデザイナー', company: null },
      ],
    });

    assert.deepEqual(meta.guests, [
      { name: 'Aoi', position: 'グラフィックデザイナー', company: null },
    ]);
  });

  it('caps roles at two and de-duplicates guests', () => {
    const guest = { name: 'A', position: 'PM', company: 'X' };
    const { meta } = parseEpisodeMeta({
      guests: [guest, guest],
      roles: ['エンジニア', 'デザイナー', 'ビジネス職'],
    });

    assert.equal(meta.guests.length, 1);
    assert.equal(meta.roles.length, 2);
  });

  it('survives garbage input', () => {
    for (const bad of [null, undefined, 'text', 42, { guests: 'x' }]) {
      const { meta } = parseEpisodeMeta(bad);
      assert.deepEqual(meta.guests, []);
      assert.deepEqual(meta.topics, []);
    }
  });
});
