import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildEpisodePostIssueBody } from './buildEpisodePostIssueBody';

const episodePageUrl = 'https://kaigaicareerlog.com/episodes/abc/';

describe('buildEpisodePostIssueBody', () => {
  it('puts the main tweet and the reply in separate code blocks', () => {
    const body = buildEpisodePostIssueBody({
      episodePageUrl,
      mainTweetText: '🎧新エピソード公開\n\nタイトル',
      urlsTweetText: 'Spotify\nhttps://open.spotify.com/episode/1',
    });

    const codeBlocks = [...body.matchAll(/```\n([\s\S]*?)```/g)].map((match) =>
      match[1].replace(/\n$/, '')
    );

    assert.equal(codeBlocks?.length, 2);
    assert.equal(codeBlocks?.[0], '🎧新エピソード公開\n\nタイトル');
    assert.equal(
      codeBlocks?.[1],
      'Spotify\nhttps://open.spotify.com/episode/1'
    );
    assert.ok(body.includes(episodePageUrl));
  });

  it('includes a one-click intent link for the main tweet when it fits', () => {
    const body = buildEpisodePostIssueBody({
      episodePageUrl,
      mainTweetText: '短いツイート',
      urlsTweetText: null,
    });

    assert.ok(body.includes('](https://twitter.com/intent/tweet?text='));
  });

  it('omits the intent link and the reply section when there are no URLs', () => {
    const longMainTweet = 'a'.repeat(300);
    const body = buildEpisodePostIssueBody({
      episodePageUrl,
      mainTweetText: longMainTweet,
      urlsTweetText: null,
    });

    assert.equal(body.includes('twitter.com/intent/tweet'), false);
    assert.equal(body.includes('#### 2.'), false);
    assert.equal(body.includes('その投稿への返信として'), false);
  });

  it('tells the reader to post the reply when URLs exist', () => {
    const body = buildEpisodePostIssueBody({
      episodePageUrl,
      mainTweetText: 'メイン',
      urlsTweetText: 'URL一覧',
    });

    assert.ok(body.includes('その投稿への返信として2を投稿してください'));
  });
});
