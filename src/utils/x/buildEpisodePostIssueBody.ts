import { buildTweetIntentUrl } from './buildTweetIntentUrl';

export interface EpisodePostContent {
  episodePageUrl: string;
  mainTweetText: string;
  /** Platform links tweet, posted as a reply to the main tweet. May be null. */
  urlsTweetText: string | null;
}

/**
 * Builds the GitHub issue body for a pending X post: the episode link, a
 * one-click "open X pre-filled" link for the main tweet when it's short
 * enough to fit, and the main tweet + reply each in their own code block
 * (GitHub renders a copy button per block) since together they're posted as
 * two tweets - a main post and a reply with the platform links.
 */
export function buildEpisodePostIssueBody(content: EpisodePostContent): string {
  const { episodePageUrl, mainTweetText, urlsTweetText } = content;
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
