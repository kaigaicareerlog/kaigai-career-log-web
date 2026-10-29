import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseEpisodeMeta, toPlaceSlug } from './parseEpisodeMeta';

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

  it('turns a new country or city from otherPlaces into a new tag', () => {
    const { meta, newPlaces, warnings } = parseEpisodeMeta({
      countries: [],
      cities: [],
      otherPlaces: [
        {
          kind: 'country',
          name: 'Australia',
          label: 'オーストラリア',
          lat: -25.27,
          lon: 133.77,
        },
        {
          kind: 'city',
          name: 'Melbourne',
          label: 'メルボルン',
          lat: -37.8136,
          lon: 144.9631,
        },
      ],
    });

    assert.deepEqual(meta.countries, ['australia']);
    assert.deepEqual(meta.cities, ['melbourne']);
    assert.deepEqual(
      newPlaces.map((p) => [p.kind, p.tag.slug, p.tag.label]),
      [
        ['country', 'australia', 'オーストラリア'],
        ['city', 'melbourne', 'メルボルン'],
      ]
    );
    assert.deepEqual(warnings, []);
  });

  it('uses the existing tag when an otherPlaces entry is already known', () => {
    const { meta, newPlaces } = parseEpisodeMeta({
      otherPlaces: [
        {
          kind: 'country',
          name: 'New Zealand',
          label: 'ニュージーランド',
          lat: -41,
          lon: 174,
        },
      ],
    });

    assert.deepEqual(meta.countries, ['new-zealand']);
    assert.deepEqual(newPlaces, []);
  });

  it('only reports new places without usable coordinates or labels', () => {
    const { meta, newPlaces, warnings } = parseEpisodeMeta({
      otherPlaces: [
        {
          kind: 'city',
          name: 'Sydney',
          label: 'シドニー',
          lat: 'south',
          lon: 151,
        },
        { kind: 'city', name: 'Perth', label: null, lat: -31.95, lon: 115.86 },
      ],
    });

    assert.deepEqual(meta.cities, []);
    assert.deepEqual(newPlaces, []);
    assert.deepEqual(warnings, [
      'place not in vocabulary: シドニー',
      'place not in vocabulary: Perth',
    ]);
  });

  it('makes URL-safe slugs from English names', () => {
    assert.equal(toPlaceSlug('New Zealand'), 'new-zealand');
    assert.equal(toPlaceSlug('São Paulo'), 'sao-paulo');
    assert.equal(toPlaceSlug('オークランド'), null);
  });
});
