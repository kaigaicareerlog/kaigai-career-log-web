import { buildTweetIntentUrl } from './buildTweetIntentUrl';

export interface EpisodePostContent {
  episodePageUrl: string;
  /** The episode's generated share image, to attach to the main tweet */
  shareImageUrl: string;
  mainTweetText: string;
  /** Platform links tweet, posted as a reply to the main tweet. May be null. */
  urlsTweetText: string | null;
}

/**
 * Builds the GitHub issue body for a pending X post: the episode link, the
 * episode's share image to attach to the main tweet (the main tweet has no
 * link, so X shows no card for it, and an attached image is shown reliably
 * whereas a link card is up to X), a one-click "open X pre-filled" link for the main tweet when it's short
 * enough to fit, and the main tweet + reply each in their own code block
 * (GitHub renders a copy button per block) since together they're posted as
 * two tweets - a main post and a reply with the platform links.
 */
export function buildEpisodePostIssueBody(content: EpisodePostContent): string {
  const { episodePageUrl, shareImageUrl, mainTweetText, urlsTweetText } =
    content;
  const intentUrl = buildTweetIntentUrl(mainTweetText);

  const lines = [
    `**エピソードページ:** ${episodePageUrl}`,
    '',
    ...(intentUrl
      ? [`[✏️ メインツイートの下書きをXで開く](${intentUrl})`, '']
      : []),
    '#### 1. メインツイート',
    '```',
    mainTweetText,
    '```',
    '',
    `🖼️ この画像を保存してメインツイートに添付してください（[画像を開く](${shareImageUrl})。サイトの更新が反映されるまで数分表示されないことがあります）`,
    '',
    `![シェア画像](${shareImageUrl})`,
  ];

  if (urlsTweetText) {
    lines.push('', '#### 2. 返信ツイート（URL）', '```', urlsTweetText, '```');
  }

  lines.push(
    '',
    '---',
    urlsTweetText
      ? '1を投稿し、その投稿への返信として2を投稿してください。投稿したらこのIssueをクローズしてください。'
      : '投稿したらこのIssueをクローズしてください。'
  );

  return lines.join('\n');
}
