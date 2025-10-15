# Episode URLs Update Guide

このドキュメントでは、エピソードの URL（Spotify、YouTube、Apple Podcast、Amazon Music）を更新する方法を説明します。

## 方法 1: GitHub Actions で個別更新

GitHub Actions の UI から、個別のエピソードの URL を更新できます。

### 手順

1. GitHub リポジトリの「Actions」タブに移動
2. 左サイドバーから「Update Episode URLs」ワークフローを選択
3. 「Run workflow」ボタンをクリック
4. 以下の情報を入力：
   - **Episode GUID** (必須): 更新したいエピソードの GUID
   - **Spotify URL** (任意): Spotify のエピソード URL
   - **YouTube URL** (任意): YouTube のエピソード URL
   - **Apple Podcast URL** (任意): Apple Podcast のエピソード URL
   - **Amazon Music URL** (任意): Amazon Music のエピソード URL
5. 「Run workflow」をクリック

### 例

```
Episode GUID: 39cf6d7a-a8fc-4f4f-a0f7-3ad0e8e1bc7d
Spotify URL: https://open.spotify.com/episode/1pCYF2Hh9auRtTCELuPK8e
YouTube URL: https://youtu.be/z0jJm4cqHbA
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

### 個別更新

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

### バッチ更新

```bash
npm run batch-update-urls episode-urls-update.json
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
