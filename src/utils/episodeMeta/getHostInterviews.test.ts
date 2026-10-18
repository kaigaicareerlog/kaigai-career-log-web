import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { EpisodeMeta, PodcastEpisode } from '../../types';
import { getHostInterviews } from './getHostInterviews';

const ep = (guid: string): PodcastEpisode => ({
  guid,
  title: guid,
  description: '',
  duration: '00:30:00',
  date: '',
  link: '',
  audioUrl: '',
});
const meta = (name: string): EpisodeMeta => ({
  guests: [{ name, position: null, company: null }],
  roles: [],
  countries: [],
  cities: [],
  topics: [],
  reviewed: false,
});

describe('getHostInterviews', () => {
  it('returns the episodes where the host was the guest, oldest first', () => {
    // Newest first, like the episodes file
    const episodes = [ep('second'), ep('other'), ep('first'), ep('untagged')];
    const result = getHostInterviews('Ryo', episodes, {
      second: meta('Ryo'),
      other: meta('Kem'),
      first: meta('Ryo'),
    });
    assert.deepEqual(
      result.map((episode) => episode.guid),
      ['first', 'second']
    );
  });

  it('returns nothing for a host without an interview', () => {
    assert.deepEqual(
      getHostInterviews('Senna', [ep('a')], { a: meta('Ryo') }),
      []
    );
  });
});
