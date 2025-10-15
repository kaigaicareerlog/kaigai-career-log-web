# YouTube Data API v3 Setup Guide

このガイドでは、YouTube URL の自動取得に必要な YouTube Data API v3 の設定方法を説明します。

## 概要

YouTube URL の自動取得機能は、YouTube Data API v3 を使用して、チャンネル内のすべての動画を検索し、エピソードタイトルに基づいて対応する動画 URL を自動的に見つけます。

## セットアップ手順

### 1. Google Cloud プロジェクトの作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 右上の「プロジェクトを選択」をクリック
3. 「新しいプロジェクト」をクリック
4. プロジェクト名を入力（例: "kaigai-career-log"）
5. 「作成」をクリック

### 2. YouTube Data API v3 の有効化

1. 左側のメニューから「API とサービス」>「ライブラリ」を選択
2. 検索バーに「YouTube Data API v3」と入力
3. 「YouTube Data API v3」をクリック
4. 「有効にする」ボタンをクリック

### 3. API キーの作成

1. 左側のメニューから「API とサービス」>「認証情報」を選択
2. 上部の「認証情報を作成」をクリック
3. 「API キー」を選択
4. API キーが生成されます
5. （推奨）「キーを制限」をクリックして、API キーを制限:
   - アプリケーションの制限: 「HTTP リファラー」または「IP アドレス」を選択
   - API の制限: 「キーを制限」を選択し、「YouTube Data API v3」のみを選択
6. 「保存」をクリック

### 4. 環境変数の設定

#### ローカル開発環境

プロジェクトのルートディレクトリに `.env` ファイルを作成（または既存のファイルに追加）:

```bash
YOUTUBE_API_KEY=your_api_key_here
YOUTUBE_CHANNEL_ID=@kaigaicareerlog  # オプション（デフォルト値が設定されています）
```

#### GitHub Actions

1. GitHub リポジトリの「Settings」タブに移動
2. 左側のメニューから「Secrets and variables」>「Actions」を選択
3. 「New repository secret」をクリック
4. 以下のシークレットを追加:
   - Name: `YOUTUBE_API_KEY`
   - Secret: （上記で取得した API キー）
5. 「Add secret」をクリック

## 使用方法

### GitHub Actions での使用

1. GitHub リポジトリの「Actions」タブに移動
2. 「Update Episode URLs」ワークフローを選択
3. 「Run workflow」をクリック
4. 「Update YouTube URLs」をチェック
5. 「Run workflow」をクリック

### ローカルでの使用

```bash
# 全エピソードの YouTube URL を更新
npm run update-youtube-urls

# 特定のエピソードの YouTube URL を更新
npm run update-youtube-urls <guid>
```

## 仕組み

1. **チャンネル情報の取得**: YouTube Channel ID または @handle からチャンネル情報を取得
2. **動画の検索**: チャンネル内のすべての動画を取得（最大 50 件ずつ、ページネーション対応）
3. **タイトルマッチング**: エピソードタイトルと動画タイトルを比較:
   - 完全一致を優先
   - 正規化した文字列での一致（余分な空白を削除）
   - 部分一致（どちらかが含まれる）
4. **URL の更新**: 見つかった動画の URL を `episodes.json` に保存

## API 使用制限

YouTube Data API v3 には無料枠の割り当てがあります:

- **デフォルトの割り当て**: 1 日あたり 10,000 ユニット
- **検索リクエスト**: 1 回あたり 100 ユニット
- **チャンネル情報取得**: 1 回あたり 1 ユニット

### 使用量の目安

- チャンネル情報取得: 1 ユニット
- 50 エピソードの検索: ~100 ユニット（ページネーションにより異なる）
- 合計: ~101 ユニット（1 回の実行あたり）

1 日に約 90 回実行可能です（通常は十分です）。

### 使用量の確認

1. Google Cloud Console の「API とサービス」>「ダッシュボード」に移動
2. 「YouTube Data API v3」をクリック
3. 「割り当て」タブで使用状況を確認

## トラブルシューティング

### API キーが無効

**エラー**: `YouTube API error: 400 Bad Request`

**解決策**:

- API キーが正しくコピーされているか確認
- API キーの制限設定を確認（制限が厳しすぎる可能性）
- YouTube Data API v3 が有効になっているか確認

### チャンネルが見つからない

**エラー**: `Channel not found for handle: @username`

**解決策**:

- チャンネル ID または @handle が正しいか確認
- `YOUTUBE_CHANNEL_ID` 環境変数を設定
- チャンネル URL から正しい ID を抽出:
  - `https://www.youtube.com/@kaigaicareerlog` → `@kaigaicareerlog`
  - `https://www.youtube.com/channel/UCxxxxx` → `UCxxxxx`

### 動画が見つからない

**問題**: エピソードに対応する YouTube 動画が見つからない

**原因**:

- タイトルが完全に一致していない
- 動画がまだアップロードされていない
- 動画が非公開または限定公開になっている

**解決策**:

- エピソードタイトルと YouTube 動画タイトルを一致させる
- 手動で URL を設定する: `npm run update-episode-urls <guid> "" "youtube_url"`

### 割り当て制限に達した

**エラー**: `YouTube API error: 403 Forbidden`

**解決策**:

- 翌日まで待つ（割り当ては毎日リセットされます）
- Google Cloud Console で割り当ての増加をリクエスト
- 不要な API 呼び出しを減らす（特定の GUID のみを更新）

## セキュリティのベストプラクティス

1. **API キーの制限**: API キーに適切な制限を設定
2. **シークレットの管理**: GitHub Secrets を使用し、コードに直接記述しない
3. **.gitignore**: `.env` ファイルを `.gitignore` に追加
4. **定期的な更新**: API キーを定期的にローテーション

## 参考リンク

- [YouTube Data API v3 ドキュメント](https://developers.google.com/youtube/v3)
- [Google Cloud Console](https://console.cloud.google.com/)
- [API キーの制限に関するベストプラクティス](https://cloud.google.com/docs/authentication/api-keys)
