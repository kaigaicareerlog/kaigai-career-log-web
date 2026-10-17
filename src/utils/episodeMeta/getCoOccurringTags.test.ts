import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { PodcastEpisode } from '../../types';
import { getCoOccurringTags } from './getCoOccurringTags';
import type { TagPage } from './getTagPages';

const ep = (guid: string): PodcastEpisode => ({
  guid,
  title: guid,
  description: '',
  duration: '',
  date: '',
  link: '',
  audioUrl: '',
});
const page = (slug: string, guids: string[]): TagPage => ({
  kind: 'topic',
  slug,
  label: slug,
  episodes: guids.map(ep),
});

const visa = page('visa', ['a', 'b', 'c', 'd']);
const english = page('english', ['a', 'b', 'c']); // shares 3
const salary = page('salary', ['c', 'd', 'x']); // shares 2
const layoff = page('layoff', ['d', 'y', 'z']); // shares 1
const all = [visa, english, salary, layoff];

describe('getCoOccurringTags', () => {
  it('orders by shared episodes and skips the page itself', () => {
    assert.deepEqual(
      getCoOccurringTags(visa, all).map((p) => p.slug),
      ['english', 'salary']
    );
  });

  it('drops tags that overlap in only one episode', () => {
    assert.equal(
      getCoOccurringTags(visa, all).some((p) => p.slug === 'layoff'),
      false
    );
  });

  it('respects the limit', () => {
    assert.equal(getCoOccurringTags(visa, all, 1).length, 1);
  });
});
