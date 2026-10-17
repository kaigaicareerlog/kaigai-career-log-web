import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { EpisodeMeta, EpisodeMetaMap, PodcastEpisode } from '../../types';
import { getMapEntries } from './getMapEntries';

const ep = (guid: string): PodcastEpisode => ({
  guid,
  title: guid,
  description: '',
  duration: '',
  date: '',
  link: '',
  audioUrl: '',
});
const meta = (partial: Partial<EpisodeMeta>): EpisodeMeta => ({
  guests: [],
  roles: [],
  countries: [],
  cities: [],
  topics: [],
  reviewed: false,
  ...partial,
});

// Newest first
const episodes = ['e6', 'e5', 'e4', 'e3', 'e2', 'e1'].map(ep);
const map: EpisodeMetaMap = {
  e1: meta({ cities: ['vancouver'] }),
  e2: meta({ cities: ['vancouver'], topics: ['return-to-japan'] }),
  e3: meta({ cities: ['vancouver'], topics: ['return-to-japan'] }),
  e4: meta({ cities: ['vancouver'] }),
  e5: meta({ cities: ['london'] }),
  e6: meta({ cities: ['toronto'], topics: ['return-to-japan'] }),
};

describe('getMapEntries', () => {
  const entries = getMapEntries(episodes, map);
  const byId = Object.fromEntries(entries.map((e) => [e.id, e]));

  it('has a pin for each city that has episodes, plus Tokyo for returnees', () => {
    assert.deepEqual(entries.map((e) => e.id).sort(), [
      'london',
      'tokyo',
      'toronto',
      'vancouver',
    ]);
  });

  it('orders pins by number of episodes', () => {
    assert.equal(entries[0].id, 'vancouver');
    assert.equal(entries[1].id, 'tokyo');
  });

  it('lists the latest episodes first, at most three', () => {
    assert.equal(byId.vancouver.count, 4);
    assert.deepEqual(
      byId.vancouver.episodes.map((e) => e.guid),
      ['e4', 'e3', 'e2']
    );
  });

  it('links to the tag page only when the city has enough episodes for one', () => {
    assert.equal(byId.vancouver.pagePath, '/tags/vancouver/');
    assert.equal(byId.tokyo.pagePath, '/tags/return-to-japan/');
    assert.equal(byId.london.pagePath, null);
  });

  it('marks the Tokyo pin as the returnee pin, with its own position', () => {
    assert.equal(byId.tokyo.kind, 'returnee');
    assert.equal(byId.tokyo.count, 3);
    assert.ok(byId.tokyo.lon > 130);
  });

  it('has no Tokyo pin without returnee episodes', () => {
    const none = getMapEntries(episodes, {
      e1: meta({ cities: ['vancouver'] }),
    });
    assert.equal(
      none.some((e) => e.id === 'tokyo'),
      false
    );
  });
});
