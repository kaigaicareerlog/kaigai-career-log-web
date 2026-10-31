import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { PodcastEpisode } from '../../types';
import { buildLlmsTxt } from './buildLlmsTxt';

const episode: PodcastEpisode = {
  guid: 'g',
  title: 'エピソード #1',
  description: '',
  duration: '00:10:00',
  date: 'Sun, 11 Oct 2026 00:46:18 GMT',
  link: '',
  audioUrl: '',
};

describe('buildLlmsTxt', () => {
  const txt = buildLlmsTxt({
    siteName: '海外キャリアログ',
    description: '説明',
    hosts: [
      {
        name: 'Ryo',
        bio: 'エンジニア\n詳しく',
        avatar: '',
        color: '',
        socialLinks: [],
      },
    ],
    pages: [{ name: 'トップ', url: '/', note: '最新' }],
    collections: [{ name: 'ビザ', url: '/tags/visa/', count: 3 }],
    episodes: [{ episode, summary: '要約' }],
  });

  it('follows the llms.txt layout: title, then a quoted summary', () => {
    assert.ok(txt.startsWith('# 海外キャリアログ\n\n> 説明\n'));
  });

  it('links each episode to its Markdown copy', () => {
    assert.match(
      txt,
      /- \[エピソード #1\]\(https:\/\/kaigaicareerlog\.com\/episodes\/g\.md\): .*配信。要約/
    );
  });

  it('lists hosts on one line each and pages with absolute URLs', () => {
    assert.ok(txt.includes('- Ryo: エンジニア 詳しく\n'));
    assert.ok(txt.includes('- [トップ](https://kaigaicareerlog.com/): 最新'));
    assert.ok(
      txt.includes('- [ビザ](https://kaigaicareerlog.com/tags/visa/): 3話')
    );
  });
});
