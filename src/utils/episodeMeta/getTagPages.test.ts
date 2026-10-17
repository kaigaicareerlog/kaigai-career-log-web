import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { EpisodeMeta, EpisodeMetaMap, PodcastEpisode } from '../../types';
import { getTagPagePath, getTagPages } from './getTagPages';

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

const episodes = ['e5', 'e4', 'e3', 'e2', 'e1'].map(ep); // newest first
const map: EpisodeMetaMap = {
  e1: meta({ countries: ['canada'], topics: ['visa'] }),
  e2: meta({ countries: ['canada'], topics: ['visa', 'english'] }),
  e3: meta({ countries: ['canada'], topics: ['visa'], cities: ['vancouver'] }),
  e4: meta({ countries: ['usa'], topics: ['english'] }),
  e5: meta({ countries: ['canada'], cities: ['vancouver'] }),
};

describe('getTagPages', () => {
  const pages = getTagPages(episodes, map);

  it('only includes tags with enough episodes', () => {
    const slugs = pages.map((page) => page.slug);
    assert.ok(slugs.includes('canada'));
    assert.ok(slugs.includes('visa'));
    assert.equal(slugs.includes('usa'), false); // 1 episode
    assert.equal(slugs.includes('vancouver'), false); // 2 episodes
    assert.equal(slugs.includes('english'), false); // 2 episodes
  });

  it("lists each tag's episodes newest first", () => {
    const canada = pages.find((page) => page.slug === 'canada');
    assert.deepEqual(
      canada?.episodes.map((e) => e.guid),
      ['e5', 'e3', 'e2', 'e1']
    );
  });

  it('groups by kind in a fixed order', () => {
    assert.deepEqual(
      pages.map((page) => page.kind),
      ['country', 'topic']
    );
  });

  it('respects a different threshold', () => {
    const lower = getTagPages(episodes, map, 2).map((page) => page.slug);
    assert.ok(lower.includes('vancouver'));
    assert.ok(lower.includes('english'));
  });
});

describe('getTagPagePath', () => {
  it('builds the page URL', () => {
    assert.equal(getTagPagePath('visa'), '/tags/visa/');
  });
});
