import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { PodcastEpisode } from '../../types';
import { countInterviews } from './countInterviews';

const ep = (guid: string, title: string): PodcastEpisode => ({
  guid,
  title,
  description: '',
  duration: '',
  date: '',
  link: '',
  audioUrl: '',
});

// Newest first: a single, a two-part interview, a special, another two-part
const episodes = [
  ep('s', 'ゲスト単発 #5'),
  ep('b2', 'B（後半）#4'),
  ep('b1', 'B（前半）#3'),
  ep('sp', '【特別回】みんなで話す'),
  ep('a2', 'A（後半）#2'),
  ep('a1', 'A（前半）#1'),
];

describe('countInterviews', () => {
  it('counts a two-part interview once and skips special episodes', () => {
    // single + B + A = 3 interviews from 5 regular episodes
    assert.equal(countInterviews(episodes, {}), 3);
  });

  it('counts an unpaired part as its own interview', () => {
    assert.equal(countInterviews([ep('x2', 'X（後半）#9')], {}), 1);
  });

  it('is zero without episodes', () => {
    assert.equal(countInterviews([], {}), 0);
  });
});
