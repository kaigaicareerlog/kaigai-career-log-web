import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { TAG_DEFINITIONS } from './episodeVocabulary';

describe('episode vocabulary', () => {
  const all = Object.values(TAG_DEFINITIONS).flat();

  it('has a unique slug for every tag across all kinds (they become URLs)', () => {
    const slugs = all.map((tag) => tag.slug);
    assert.equal(new Set(slugs).size, slugs.length);
  });

  it('uses URL-safe slugs', () => {
    for (const tag of all) {
      assert.match(tag.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/, tag.slug);
    }
  });
});

describe('city and country coordinates', () => {
  const cities = [...TAG_DEFINITIONS.city, ...TAG_DEFINITIONS.country];

  it('gives every city a valid map position', () => {
    for (const city of cities) {
      assert.equal(typeof city.lat, 'number', `${city.slug} lat`);
      assert.equal(typeof city.lon, 'number', `${city.slug} lon`);
      assert.ok(Math.abs(city.lat!) <= 90, `${city.slug} lat range`);
      assert.ok(Math.abs(city.lon!) <= 180, `${city.slug} lon range`);
    }
  });
});
