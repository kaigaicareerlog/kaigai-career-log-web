import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { EpisodeMeta, PodcastEpisode } from '../../types';
import {
  getCompanies,
  getCompanyPages,
  getCompanySlug,
} from './getCompanyPages';

const ep = (guid: string): PodcastEpisode => ({
  guid,
  title: guid,
  description: '',
  duration: '00:30:00',
  date: '',
  link: '',
  audioUrl: '',
});
const meta = (
  name: string,
  company: string | null,
  position: string | null = null
): EpisodeMeta => ({
  guests: [{ name, position, company }],
  roles: [],
  countries: [],
  cities: [],
  topics: [],
  reviewed: false,
});

describe('getCompanySlug', () => {
  it('makes a lowercase, hyphenated slug', () => {
    assert.equal(getCompanySlug('Arista Networks'), 'arista-networks');
    assert.equal(getCompanySlug(' Match Group '), 'match-group');
  });

  it('uses overrides for names without Latin letters', () => {
    assert.equal(getCompanySlug('楽天'), 'rakuten');
    assert.equal(getCompanySlug('ソニー'), null);
  });
});

describe('getCompanies', () => {
  // Newest first, like the episodes file
  const episodes = [ep('second'), ep('first'), ep('other'), ep('none')];
  const map = {
    second: meta('Kodai', 'Affirm', 'シニアソフトウェアエンジニア'),
    first: meta('Kodai', 'affirm'),
    other: meta('Ken', 'AWS'),
    none: meta('Yu', null),
  };

  it('groups episodes by company, most episodes first', () => {
    const companies = getCompanies(episodes, map);
    assert.deepEqual(
      companies.map((c) => [c.slug, c.episodes.map((e) => e.guid)]),
      [
        ['affirm', ['second', 'first']],
        ['aws', ['other']],
      ]
    );
  });

  it('lists each guest once, with the position from the newest episode', () => {
    const [affirm] = getCompanies(episodes, map);
    assert.deepEqual(affirm.guests, [
      { name: 'Kodai', position: 'シニアソフトウェアエンジニア' },
    ]);
  });

  it('gives a page only to companies with enough episodes', () => {
    assert.deepEqual(
      getCompanyPages(episodes, map).map((c) => c.slug),
      ['affirm']
    );
  });
});
