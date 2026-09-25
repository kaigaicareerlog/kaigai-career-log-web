import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { PodcastEpisode } from '../../types';
import { formatFullEpisodeXPost } from './formatFullEpisodeXPost';
import { formatNewEpisodeMainTweet } from './formatNewEpisodeMainTweet';
import { formatNewEpisodeUrlsTweet } from './formatNewEpisodeUrlsTweet';

const baseEpisode: PodcastEpisode = {
  title: 'テストエピソード #1',
  description: '説明',
  duration: '00:30:00',
  date: 'Sun, 01 Jan 2026 00:00:00 GMT',
  link: 'https://example.com',
  audioUrl: 'https://example.com/audio.mp3',
  guid: 'guid-1',
  spotifyUrl: 'https://open.spotify.com/episode/1',
};

describe('formatFullEpisodeXPost', () => {
  it('joins the announcement and the platform links with one blank line', () => {
    const main = formatNewEpisodeMainTweet(baseEpisode, '@togashi_ryo');
    const urls = formatNewEpisodeUrlsTweet(baseEpisode);

    assert.equal(
      formatFullEpisodeXPost(baseEpisode, '@togashi_ryo'),
      `${main}\n\n${urls}`
    );
  });

  it('is just the announcement when there are no platform links', () => {
    const episodeWithNoLinks = { ...baseEpisode, spotifyUrl: undefined };
    const main = formatNewEpisodeMainTweet(episodeWithNoLinks, '@togashi_ryo');

    assert.equal(
      formatFullEpisodeXPost(episodeWithNoLinks, '@togashi_ryo'),
      main
    );
  });
});
