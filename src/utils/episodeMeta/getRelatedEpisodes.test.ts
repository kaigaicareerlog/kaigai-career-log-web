import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { EpisodeMeta, EpisodeMetaMap, PodcastEpisode } from '../../types';
import { getRelatedEpisodes } from './getRelatedEpisodes';

const ep = (guid: string): PodcastEpisode => ({
  guid,
  title: guid,
  description: '',
  duration: '00:30:00',
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
const episodes = ['now', 'new', 'mid', 'old', 'untagged'].map(ep);
const map: EpisodeMetaMap = {
  now: meta({ topics: ['visa', 'salary'], cities: ['vancouver'] }),
  new: meta({ topics: ['salary'], cities: ['vancouver'] }),
  mid: meta({ topics: ['visa', 'salary'] }),
  old: meta({ topics: ['english'], cities: ['vancouver'] }),
};

describe('getRelatedEpisodes', () => {
  it('ranks by shared topics first, then places', () => {
    const guids = getRelatedEpisodes(episodes[0], episodes, map).map(
      (e) => e.guid
    );
    assert.deepEqual(guids, ['mid', 'new', 'old']);
  });

  it('never includes the episode itself or excluded ones', () => {
    const guids = getRelatedEpisodes(episodes[0], episodes, map, ['mid']).map(
      (e) => e.guid
    );
    assert.deepEqual(guids, ['new', 'old']);
  });

  it('breaks ties newest first', () => {
    const tied: EpisodeMetaMap = {
      now: meta({ topics: ['visa'] }),
      new: meta({ topics: ['visa'] }),
      mid: meta({ topics: ['visa'] }),
    };
    const guids = getRelatedEpisodes(episodes[0], episodes, tied).map(
      (e) => e.guid
    );
    assert.deepEqual(guids, ['new', 'mid']);
  });

  it('skips episodes with nothing in common and respects the limit', () => {
    assert.equal(
      getRelatedEpisodes(episodes[0], episodes, map, [], 1).length,
      1
    );
    const lonely: EpisodeMetaMap = {
      now: meta({ topics: ['layoff'] }),
      new: meta({ topics: ['visa'] }),
    };
    assert.deepEqual(getRelatedEpisodes(episodes[0], episodes, lonely), []);
  });

  it('returns nothing for an untagged episode', () => {
    assert.deepEqual(getRelatedEpisodes(episodes[4], episodes, map), []);
  });
});
