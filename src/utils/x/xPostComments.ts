import { X_POST_APPROVAL_LABEL } from '../../constants/xPost';
import { isTweetId } from './xPostLedger';

/**
 * Public status URL that does not assume the posting account's handle.
 */
export function tweetStatusUrl(tweetId: string): string {
  if (!isTweetId(tweetId)) throw new Error('Invalid tweet id');
  return `https://x.com/i/web/status/${tweetId}`;
}

export function allowlistEmptyComment(): string {
  return [
    'リポジトリ変数 `X_POST_APPROVER_LOGINS` が未設定のため公開しません。',
    '設定されるまで、誰がラベルを付けても投稿されません。',
  ].join('\n');
}

export function notApproverComment(): string {
  return 'ラベルを付けたGitHubアカウントは承認者リストに含まれていないため公開しません。';
}

export function secretsMissingComment(): string {
  return 'X API の secret（X_API_KEY、X_API_SECRET、X_ACCESS_TOKEN、X_ACCESS_TOKEN_SECRET）が揃っていないため公開しません。secretの値は記録していません。';
}

export function concurrentComment(): string {
  return '別の実行が先に処理を進めたため、この実行では投稿しません。必要ならラベルを付け直してください。';
}

export function rejectedComment(
  phase: 'main' | 'reply',
  status: number,
  mainTweetId?: string
): string {
  if (phase === 'reply' && mainTweetId && isTweetId(mainTweetId)) {
    return [
      `メインは公開済みです: ${tweetStatusUrl(mainTweetId)}`,
      `返信はX APIに拒否されました（HTTP ${status}）。返信は公開されていません。`,
      `ラベル \`${X_POST_APPROVAL_LABEL}\` を付け直すと、保存済みのメインへの返信だけを再送します。メインは再送しません。`,
    ].join('\n');
  }
  return [
    `X APIが投稿を拒否しました（HTTP ${status}）。投稿は作成されていないものとして扱います。`,
    `設定を直したあと、ラベル \`${X_POST_APPROVAL_LABEL}\` を付け直すと最初からやり直せます。`,
  ].join('\n');
}

export function ambiguousComment(
  phase: 'main' | 'reply',
  tweetId?: string
): string {
  const lines = [
    phase === 'main'
      ? 'メイン投稿のリクエスト後に成否を確認できませんでした。自動ではメインを再送しません。'
      : '返信のリクエスト後に成否を確認できませんでした。自動では再送しません。',
  ];
  if (tweetId && isTweetId(tweetId)) {
    lines.push(`取得できた投稿ID: ${tweetStatusUrl(tweetId)}`);
  }
  lines.push(
    'Xのアカウントを確認し、台帳の status を手で直してからラベルを付け直してください。'
  );
  return lines.join('\n');
}

export function publishedComment(
  mainTweetId: string,
  replyTweetId: string
): string {
  return [
    'Xへの公開が完了しました。画像は添付していません。',
    `メイン: ${tweetStatusUrl(mainTweetId)}`,
    `返信: ${tweetStatusUrl(replyTweetId)}`,
  ].join('\n');
}

export function persistenceComment(tweetId: string): string {
  return [
    'X APIは投稿IDを返しましたが、そのIDを台帳へ保存できませんでした。',
    `投稿ID: ${tweetStatusUrl(tweetId)}`,
    '自動では再送しません。Xでこの投稿を確認し、台帳へIDを記録してください。',
  ].join('\n');
}
