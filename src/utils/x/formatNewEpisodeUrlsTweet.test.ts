import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { PodcastEpisode } from '../../types';
import { formatNewEpisodeUrlsTweet } from './formatNewEpisodeUrlsTweet';

const episode: PodcastEpisode = {
  guid: 'g',
  title: 't',
  description: '',
  duration: '00:30:00',
  date: '',
  link: '',
  audioUrl: '',
  spotifyUrl: 'https://open.spotify.com/episode/x',
  amazonMusicUrl: 'https://music.amazon.co.jp/x',
};
const pageUrl = 'https://kaigaicareerlog.com/episodes/g/';

describe('formatNewEpisodeUrlsTweet', () => {
  it('lists the platforms and ends with the episode page', () => {
    assert.equal(
      formatNewEpisodeUrlsTweet(episode, pageUrl),
      [
        'Spotify',
        'https://open.spotify.com/episode/x',
        '',
        'Amazon Music',
        'https://music.amazon.co.jp/x',
        '',
        '文字起こし・聴きどころ',
        pageUrl,
      ].join('\n')
    );
  });

  it('still links the episode page when no platform URL is known yet', () => {
    const text = formatNewEpisodeUrlsTweet(
      { ...episode, spotifyUrl: undefined, amazonMusicUrl: undefined },
      pageUrl
    );
    assert.equal(text, `文字起こし・聴きどころ\n${pageUrl}`);
  });
});
