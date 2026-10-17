import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { EpisodeMeta, EpisodeMetaMap, PodcastEpisode } from '../../types';
import { sharePartnerTags } from './sharePartnerTags';

const ep = (guid: string, title: string): PodcastEpisode => ({
  guid,
  title,
  description: '',
  duration: '00:30:00',
  date: '',
  link: '',
  audioUrl: '',
});
const meta = (overrides: Partial<EpisodeMeta> = {}): EpisodeMeta => ({
  guests: [{ name: 'Kem', position: null, company: null }],
  roles: [],
  countries: [],
  cities: [],
  topics: [],
  reviewed: false,
  ...overrides,
});

// Newest first
const episodes = [
  ep('second', 'A（後半）#9'),
  ep('first', 'A（前半）#8'),
  ep('solo', 'ひとり回 #7'),
];

describe('sharePartnerTags', () => {
  it('copies city and country into a half that has none', () => {
    const map: EpisodeMetaMap = {
      first: meta({ cities: ['vancouver'], countries: ['canada'] }),
      second: meta({ topics: ['ai'] }),
    };
    const { map: result, changed } = sharePartnerTags(episodes, map);
    assert.deepEqual(result.second.cities, ['vancouver']);
    assert.deepEqual(result.second.countries, ['canada']);
    assert.deepEqual(result.second.topics, ['ai']);
    assert.deepEqual(changed, ['second']);
  });

  it('works the other way round (後半 to 前半)', () => {
    const map: EpisodeMetaMap = {
      first: meta(),
      second: meta({ cities: ['toronto'], countries: ['canada'] }),
    };
    const { map: result } = sharePartnerTags(episodes, map);
    assert.deepEqual(result.first.cities, ['toronto']);
  });

  it('never overwrites a half that already has a city or country', () => {
    const map: EpisodeMetaMap = {
      first: meta({ cities: ['vancouver'], countries: ['canada'] }),
      second: meta({ cities: ['seattle'], countries: ['usa'] }),
    };
    const { map: result, changed } = sharePartnerTags(episodes, map);
    assert.deepEqual(result.second.cities, ['seattle']);
    assert.deepEqual(result.first.countries, ['canada']);
    assert.deepEqual(changed, []);
  });

  it('shares the returnee tag both ways and keeps other topics', () => {
    const map: EpisodeMetaMap = {
      first: meta({ topics: ['ai', 'return-to-japan'] }),
      second: meta({ topics: ['career-change'] }),
    };
    const { map: result } = sharePartnerTags(episodes, map);
    assert.deepEqual(result.second.topics, [
      'career-change',
      'return-to-japan',
    ]);
    assert.deepEqual(result.first.topics, ['ai', 'return-to-japan']);
  });

  it('keeps the returnee tag within the topic limit', () => {
    const topics = ['a', 'b', 'c', 'd', 'e', 'f'];
    const map: EpisodeMetaMap = {
      first: meta({ topics: ['return-to-japan'] }),
      second: meta({ topics }),
    };
    const { map: result } = sharePartnerTags(episodes, map);
    assert.equal(result.second.topics.length, 6);
    assert.ok(result.second.topics.includes('return-to-japan'));
  });

  it('leaves reviewed entries alone', () => {
    const map: EpisodeMetaMap = {
      first: meta({ cities: ['vancouver'], countries: ['canada'] }),
      second: meta({ reviewed: true }),
    };
    const { map: result, changed } = sharePartnerTags(episodes, map);
    assert.deepEqual(result.second.cities, []);
    assert.deepEqual(changed, []);
  });

  it('does nothing for episodes without a partner or without metadata', () => {
    const map: EpisodeMetaMap = {
      solo: meta(),
      first: meta({ cities: ['vancouver'] }),
    };
    const { changed } = sharePartnerTags(episodes, map);
    assert.deepEqual(changed, []);
  });

  it('does not mutate the map it is given', () => {
    const map: EpisodeMetaMap = {
      first: meta({ cities: ['vancouver'] }),
      second: meta(),
    };
    sharePartnerTags(episodes, map);
    assert.deepEqual(map.second.cities, []);
  });
});
