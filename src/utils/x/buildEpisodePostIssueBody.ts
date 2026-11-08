import {
  EPISODE_GUID_PATTERN,
  X_POST_APPROVAL_LABEL,
  X_POST_INTENDED_ACCOUNT_URL,
} from '../../constants/xPost';
import { SITE_URL } from '../../constants/site';

export interface EpisodePostContent {
  guid: string;
  episodePageUrl: string;
  /** Shown for reference. This approval flow does not upload it. */
  shareImageUrl: string;
  mainTweetText: string;
  /** Platform links tweet, posted as a reply. Null means the issue cannot be approved. */
  urlsTweetText: string | null;
}

const MAIN_START = '<!-- x-post-main:start -->';
const MAIN_END = '<!-- x-post-main:end -->';
const REPLY_START = '<!-- x-post-reply:start -->';
const REPLY_END = '<!-- x-post-reply:end -->';

/**
 * Issue body for one new-episode announcement.
 * The HTML comments are the text the approval workflow reads.
 * The fenced copies are what the approver reads. They are the same strings.
 * There is no compose link, so approving cannot be confused with a manual post.
 */
export function buildEpisodePostIssueBody(content: EpisodePostContent): string {
  const { guid, episodePageUrl, shareImageUrl, urlsTweetText } = content;
  if (!EPISODE_GUID_PATTERN.test(guid)) throw new Error('Invalid episode guid');
  if (episodePageUrl !== `${SITE_URL}/episodes/${guid}/`) {
    throw new Error('Episode page URL does not match the guid');
  }
  const mainTweetText = assertEmbeddable(content.mainTweetText, 'Main tweet');
  const replyText =
    urlsTweetText === null
      ? null
      : assertEmbeddable(urlsTweetText, 'Reply tweet');

  const lines = [
    `**エピソードページ:** ${episodePageUrl}`,
    '',
    '### 承認すると公開される内容',
    `ラベル \`${X_POST_APPROVAL_LABEL}\` を付けると、下のメインツイートと返信ツイートだけが、この順でXに公開されます。`,
    'それ以外の操作では公開されません。本文を変えてからラベルを付けると、エピソードデータから作り直した文面と一致しない限り公開せず、再承認に戻します。',
    `承認できるのはリポジトリ変数 \`X_POST_APPROVER_LOGINS\` に登録されたGitHubアカウントだけです。未設定のときは、誰がラベルを付けても公開されません。`,
    '',
    '### 投稿アカウントの確認',
    '投稿に使われるのは GitHub Actions の secret `X_ACCESS_TOKEN`（OAuth 1.0a。対になる secret は `X_API_KEY`、`X_API_SECRET`、`X_ACCESS_TOKEN_SECRET`）のXアカウントです。',
    'コードはこのトークンのユーザー名を照合しません。',
    `サイトが案内している番組アカウントは ${X_POST_INTENDED_ACCOUNT_URL} です。`,
    'ラベルを付ける前に、Xの開発者ポータルで、トークンのユーザーがこのアカウントであることを確認してください。',
    '',
    '### 画像',
    'この承認フローは画像をアップロードしません。公開される投稿に画像は付きません。下の画像は確認用です。',
    '',
    `<!-- x-post-guid:${guid} -->`,
    '',
    '#### 1. メインツイート（この本文が公開されます）',
    MAIN_START,
    mainTweetText,
    MAIN_END,
    '```',
    mainTweetText,
    '```',
  ];

  if (replyText) {
    lines.push(
      '',
      '#### 2. 返信ツイート（この本文が公開されます）',
      REPLY_START,
      replyText,
      REPLY_END,
      '```',
      replyText,
      '```'
    );
  }

  lines.push(
    '',
    `🖼️ 参考画像（自動では添付されません）: [画像を開く](${shareImageUrl})`,
    '',
    `![シェア画像](${shareImageUrl})`,
    '',
    '---',
    replyText
      ? `内容を確認し、問題なければラベル \`${X_POST_APPROVAL_LABEL}\` を付けてください。メインと返信の両方が成功したときだけ、このIssueは自動で閉じます。失敗したときは開いたまま、コメントに状態と再開方法を残します。`
      : '返信ツイートがないため、このIssueは承認公開の対象外です。'
  );

  return lines.join('\n');
}

function assertEmbeddable(text: string, label: string): string {
  if (
    text.length === 0 ||
    text.includes('```') ||
    text.includes('<!-- x-post-') ||
    text.startsWith('\n') ||
    text.endsWith('\n')
  ) {
    throw new Error(`${label} cannot be embedded in the issue body`);
  }
  return text;
}
