import { SITE_URL } from '../../constants/site';
import {
  EPISODE_GUID_PATTERN,
  X_POST_APPROVAL_LABEL,
  X_POST_INTENDED_ACCOUNT_URL,
} from '../../constants/xPost';
import { canonicalShareImageUrl } from './shareImage';

export interface EpisodePostContent {
  guid: string;
  episodePageUrl: string;
  /** Canonical episode PNG. The main post attaches the bytes served at approval time. */
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
  if (shareImageUrl !== canonicalShareImageUrl(guid)) {
    throw new Error('Share image URL is not the canonical episode PNG');
  }
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
    `ラベル \`${X_POST_APPROVAL_LABEL}\` を付けると、下のメインツイート（シェア画像付き）と返信ツイート（画像なし）だけが、この順でXに公開されます。`,
    'それ以外の操作では公開されません。本文を変えてからラベルを付けると、エピソードデータから作り直した文面と一致しない限り公開せず、再承認に戻します。',
    `承認できるのはリポジトリ変数 \`X_POST_APPROVER_LOGINS\` に登録されたGitHubアカウントだけです。未設定のときは、誰がラベルを付けても公開されません。`,
    '',
    '### 投稿アカウントの確認',
    '投稿に使われるのは GitHub Actions の secret `X_ACCESS_TOKEN`（OAuth 1.0a。対になる secret は `X_API_KEY`、`X_API_SECRET`、`X_ACCESS_TOKEN_SECRET`）のXアカウントです。',
    '画像のアップロードも同じ4つのsecretで署名します。トークンにメディアアップロードが許可されているかは、コードでは確認しません。',
    'コードはこのトークンのユーザー名を照合しません。',
    `サイトが案内している番組アカウントは ${X_POST_INTENDED_ACCOUNT_URL} です。`,
    'ラベルを付ける前に、Xの開発者ポータルで、トークンのユーザーがこのアカウントであることを確認してください。',
    '',
    '### 画像',
    'メインツイートにだけ、下のシェア画像を添付します。返信ツイートには画像を付けません。',
    '取得先は常に `https://kaigaicareerlog.com/og/episodes/<エピソードID>.png` です。Issue本文に書かれたURLは取得に使いません。表示用のリンクを書き換えても、添付される画像の取得先は変わりません。',
    'このPNGはサイトのビルド時に作られます（1200×630）。URLはエピソードIDで固定ですが、サイトを再ビルドすると同じURLの中身（バイト列）が変わることがあります。',
    'ワークフローは、ラベルを処理した時点でそのURLが返したPNGをアップロードします。Issueを開いた瞬間のバイト列は保存しません。',
    '画像の取得、PNGであることの確認、またはアップロードに失敗した場合は、テキストだけの投稿にはしません。何も投稿しません。',
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
    `🖼️ メインツイートに添付するシェア画像: [画像を開く](${shareImageUrl})`,
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
