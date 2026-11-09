import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { X_POST_APPROVAL_LABEL } from '../../constants/xPost';
import { buildEpisodePostIssueBody } from './buildEpisodePostIssueBody';
import { parseEpisodePostIssue } from './parseEpisodePostIssue';

const guid = '11111111-1111-4111-8111-111111111111';
const episodePageUrl = `https://kaigaicareerlog.com/episodes/${guid}/`;
const shareImageUrl = `https://kaigaicareerlog.com/og/episodes/${guid}.png`;

describe('buildEpisodePostIssueBody', () => {
  it('round-trips the main tweet and the reply', () => {
    const mainTweetText = '🎧新エピソード公開\n\nタイトル';
    const urlsTweetText = 'Spotify\nhttps://open.spotify.com/episode/1';
    const body = buildEpisodePostIssueBody({
      guid,
      episodePageUrl,
      shareImageUrl,
      mainTweetText,
      urlsTweetText,
    });
    const parsed = parseEpisodePostIssue(body);

    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    assert.equal(parsed.mainText, mainTweetText);
    assert.equal(parsed.replyText, urlsTweetText);
    assert.equal(body.includes('twitter.com/intent/tweet'), false);
    assert.ok(body.includes(X_POST_APPROVAL_LABEL));
    assert.ok(
      body.includes('メインツイートにだけ、下のシェア画像を添付します')
    );
    assert.ok(body.includes('返信ツイートには画像を付けません'));
    assert.ok(body.includes(`![シェア画像](${shareImageUrl})`));
    assert.equal(body.includes('画像をアップロードしません'), false);
    assert.equal(body.includes('自動では添付されません'), false);
    assert.ok(body.includes('X_ACCESS_TOKEN'));
    assert.ok(body.includes('https://x.com/kaigaicareerlog'));
  });

  it('is not approvable when the reply is missing', () => {
    const body = buildEpisodePostIssueBody({
      guid,
      episodePageUrl,
      shareImageUrl,
      mainTweetText: 'メイン',
      urlsTweetText: null,
    });

    assert.equal(parseEpisodePostIssue(body).ok, false);
    assert.equal(body.includes('twitter.com/intent/tweet'), false);
    assert.ok(body.includes('対象外'));
    assert.equal(body.includes('添付してください'), false);
  });

  it('rejects text that could break the markers', () => {
    assert.throws(() =>
      buildEpisodePostIssueBody({
        guid,
        episodePageUrl,
        shareImageUrl,
        mainTweetText: '```\n$(rm -rf /)',
        urlsTweetText: 'reply',
      })
    );
  });

  it('rejects a share image URL that is not the canonical PNG', () => {
    assert.throws(() =>
      buildEpisodePostIssueBody({
        guid,
        episodePageUrl,
        shareImageUrl: 'https://example.test/og/episodes/evil.png',
        mainTweetText: 'メイン',
        urlsTweetText: '返信',
      })
    );
    assert.throws(() =>
      buildEpisodePostIssueBody({
        guid,
        episodePageUrl,
        shareImageUrl: `https://kaigaicareerlog.com/og/episodes/${guid}.png?next=http://127.0.0.1`,
        mainTweetText: 'メイン',
        urlsTweetText: '返信',
      })
    );
  });
});
