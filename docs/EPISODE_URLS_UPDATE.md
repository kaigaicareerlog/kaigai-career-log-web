# Episode URLs Update Guide

このドキュメントでは、エピソードの URL（Spotify、YouTube、Apple Podcast、Amazon Music）を更新する方法を説明します。

## 方法 1: GitHub Actions で自動更新（推奨）

GitHub Actions の UI から、複数のプラットフォームの URL を自動的に取得して更新できます。

### 手順

1. GitHub リポジトリの「Actions」タブに移動
2. 左サイドバーから「Update Episode URLs」ワークフローを選択
3. 「Run workflow」ボタンをクリック
4. 以下の情報を入力：
   - **Episode GUID** (任意): 特定のエピソードのみ更新する場合は GUID を入力（空欄の場合は全エピソードを更新）
   - **Update Spotify URLs** (チェックボックス): Spotify URL を自動取得して更新
   - **Update YouTube URLs** (チェックボックス): YouTube URL を自動取得して更新
   - **Update Apple Podcast URLs** (チェックボックス): Apple Podcast URL を自動取得して更新（未実装）
   - **Update Amazon Music URLs** (チェックボックス): Amazon Music URL を自動取得して更新（未実装）
5. 「Run workflow」をクリック

### 特徴

- **複数プラットフォーム対応**: 複数のチェックボックスを選択して、一度に複数のプラットフォームの URL を更新できます
- **自動マッチング**: エピソードのタイトルを使って、各プラットフォームの URL を自動的に検索します
- **デフォルト選択**: Spotify と YouTube がデフォルトでチェックされています

### 必要な設定

#### Spotify URL の自動取得

- `SPOTIFY_CLIENT_ID`: Spotify アプリの Client ID
- `SPOTIFY_CLIENT_SECRET`: Spotify アプリの Client Secret

詳細は `SPOTIFY_SETUP_QUICKSTART.md` を参照してください。

#### YouTube URL の自動取得

- `YOUTUBE_API_KEY`: YouTube Data API v3 の API キー

YouTube API キーの取得方法：

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成（または既存のものを選択）
3. YouTube Data API v3 を有効化
4. 認証情報（API キー）を作成
5. GitHub リポジトリの Settings > Secrets に `YOUTUBE_API_KEY` として追加

### 例

**全エピソードの Spotify と YouTube URL を更新:**

```
Episode GUID: (空欄)
✅ Update Spotify URLs
✅ Update YouTube URLs
❌ Update Apple Podcast URLs
❌ Update Amazon Music URLs
```

**特定のエピソードの YouTube URL のみを更新:**

```
Episode GUID: 39cf6d7a-a8fc-4f4f-a0f7-3ad0e8e1bc7d
❌ Update Spotify URLs
✅ Update YouTube URLs
❌ Update Apple Podcast URLs
❌ Update Amazon Music URLs
```

## 方法 2: バッチ更新（複数エピソード一括更新）

複数のエピソードの URL を一度に更新する場合は、JSON ファイルを使用します。

### 手順

1. プロジェクトルートに `episode-urls-update.json` ファイルを作成
2. 以下の形式でエピソード情報を記述：

```json
[
  {
    "guid": "39cf6d7a-a8fc-4f4f-a0f7-3ad0e8e1bc7d",
    "spotifyUrl": "https://open.spotify.com/episode/...",
    "youtubeUrl": "https://youtu.be/...",
    "applePodcastUrl": "https://podcasts.apple.com/...",
    "amazonMusicUrl": "https://music.amazon.ca/..."
  },
  {
    "guid": "791bc8bd-01ce-408c-9583-2f1447ac9c6b",
    "spotifyUrl": "https://open.spotify.com/episode/...",
    "youtubeUrl": "https://youtu.be/..."
  }
]
```

3. ファイルをコミット＆プッシュ

```bash
git add episode-urls-update.json
git commit -m "Update episode URLs"
git push
```

4. GitHub Actions が自動的に実行され、URL が更新されます
5. 更新が完了すると、`episode-urls-update.json`ファイルは自動的に削除されます

### 参考ファイル

`episode-urls-update.example.json` を参照して、形式を確認できます。

## 方法 3: ローカルでスクリプトを実行

開発環境で直接スクリプトを実行することもできます。

### 自動 URL 取得

すべてのプラットフォーム（Spotify、YouTube、Apple Podcasts、Amazon Music）の URL を一度に取得できます：

```bash
# エピソードファイルを指定して実行
npm run update-new-episode-urls public/rss/[episodes-file].json
```

環境変数:

```bash
# 必須（各プラットフォームを使用する場合）
export SPOTIFY_CLIENT_ID="your_client_id"
export SPOTIFY_CLIENT_SECRET="your_client_secret"
export YOUTUBE_API_KEY="your_api_key"

# オプション（デフォルト値があります）
export SPOTIFY_SHOW_ID="0bj38cgbe71oCr5Q0emwvA"
export YOUTUBE_CHANNEL_ID="@kaigaicareerlog"
export APPLE_PODCAST_ID="1818019572"
export AMAZON_MUSIC_SHOW_ID="118b5e6b-1f97-4c62-97a5-754714381b40"
export AMAZON_MUSIC_REGION="co.jp"
```

注意：Apple Podcasts は API キー不要で動作します！

### 手動 URL 更新

特定の URL を手動で設定する場合:

```bash
npm run update-episode-urls <guid> [spotify_url] [youtube_url] [apple_podcast_url] [amazon_music_url]
```

例：

```bash
npm run update-episode-urls 39cf6d7a-a8fc-4f4f-a0f7-3ad0e8e1bc7d \
  "https://open.spotify.com/episode/..." \
  "https://youtu.be/..." \
  "https://podcasts.apple.com/..." \
  "https://music.amazon.ca/..."
```

## 注意事項

- GUID は必須です。各エピソードの一意の識別子として使用されます
- URL は任意項目です。更新したい URL のみ指定できます
- 空文字列を指定すると、その URL はクリアされます
- 最新の `YYYYMMDD-HHMM-episodes.json` ファイルが自動的に更新されます
- 更新後は自動的にコミット＆プッシュされます（GitHub Actions 経由の場合）

## GUID の確認方法

各エピソードの GUID は、`public/rss/[最新日付]-episodes.json` ファイルで確認できます。

```bash
# 最新のエピソードファイルを開く
code public/rss/$(ls -t public/rss/*-episodes.json | head -1)
```

または、VSCode などのエディタで直接ファイルを開いて確認してください。
