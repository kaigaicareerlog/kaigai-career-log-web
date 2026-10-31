import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { PodcastEpisode } from '../../types';
import { buildEpisodeMarkdown } from './buildEpisodeMarkdown';

const episode: PodcastEpisode = {
  guid: 'g',
  title: 'バンクーバーで働くエンジニア #1',
  description: '概要です。',
  duration: '00:46:18',
  date: 'Sun, 11 Oct 2026 00:46:18 GMT',
  link: '',
  audioUrl: '',
  spotifyUrl: 'https://open.spotify.com/episode/x',
};

describe('buildEpisodeMarkdown', () => {
  const md = buildEpisodeMarkdown({
    episode,
    pageUrl: 'https://kaigaicareerlog.com/episodes/g/',
    guests: [
      { name: 'Yu', position: 'エンジニア', company: 'Telus' },
      { name: null, position: null, company: null },
    ],
    tags: ['カナダ', 'バンクーバー'],
    highlights: ['ハイライト1'],
    utterances: [
      { speaker: 'Ryo', text: ' こんにちは ', timestamp: '00:00' },
      { speaker: 'Yu', text: 'よろしくお願いします', timestamp: '00:05' },
    ],
  });

  it('starts with the title and the page URL', () => {
    assert.ok(md.startsWith('# バンクーバーで働くエンジニア #1\n'));
    assert.ok(md.includes('- ページ: https://kaigaicareerlog.com/episodes/g/'));
  });

  it('lists guests, tags and platforms', () => {
    assert.ok(md.includes('- ゲスト: Yu（Telus エンジニア）\n'));
    assert.ok(md.includes('- タグ: カナダ、バンクーバー'));
    assert.ok(
      md.includes('- 聴く: [Spotify](https://open.spotify.com/episode/x)')
    );
  });

  it('includes highlights, description and the transcript', () => {
    assert.ok(md.includes('## ハイライト\n\n- ハイライト1'));
    assert.ok(md.includes('## エピソード概要\n\n概要です。'));
    assert.ok(md.includes('**Ryo** (00:00): こんにちは\n\n**Yu** (00:05)'));
  });

  it('leaves out sections it has nothing for', () => {
    const bare = buildEpisodeMarkdown({ episode, pageUrl: 'u' });
    assert.equal(bare.includes('## ハイライト'), false);
    assert.equal(bare.includes('## 文字起こし'), false);
    assert.equal(bare.includes('- ゲスト'), false);
  });
});
