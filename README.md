# Kaigai Career Log Web

A minimal website built with TypeScript and Astro for tracking international career journeys.

## 🚀 Quick Start

### Prerequisites

- Node.js 18.20.8+ or 20.3.0+ or 22.0.0+
- npm 9.6.5+

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The site will be available at `http://localhost:4321`

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🛠️ Tech Stack

- **Framework:** [Astro](https://astro.build) - Modern static site builder
- **Language:** TypeScript with strict mode
- **Styling:** Vanilla CSS with modern features
- **Build Tool:** Vite (via Astro)

## 📁 Project Structure

```
/
├── public/          # Static assets (favicon, images, etc.)
├── src/
│   ├── components/  # Reusable components
│   │   ├── common/  # Common components (Modal, etc.)
│   │   └── podcast/ # Podcast-specific components
│   ├── layouts/     # Reusable layout components
│   ├── pages/       # File-based routing
│   ├── utils/       # Utility functions (modal, formatters, etc.)
│   └── constants/   # Constants and configuration
├── scripts/         # Build and maintenance scripts
├── docs/            # Documentation
├── astro.config.mjs # Astro configuration
├── tsconfig.json    # TypeScript configuration (strict mode)
└── package.json     # Dependencies and scripts
```

## ✨ Features

- ⚡️ Fast build times with Astro
- 📱 Responsive design
- 🎨 Modern, clean UI with gradient effects
- 🌙 Dark mode support (automatic based on system preference)
- 📝 TypeScript with strict type checking
- 🔧 Minimal and maintainable codebase
- ⌨️ Keyboard shortcuts (Cmd+Shift+E for episode info modal)
- 🎭 Abstracted modal system for easy reuse

## 📝 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run astro` - Run Astro CLI commands
- `npm run update-episode-urls` - Update episode URLs by GUID
- `npm run transcribe <guid>` - Transcribe an episode using AssemblyAI
- `npm run tag-episodes` - Tag episodes with guest info and topics (see [docs/EPISODE_TAGGING.md](docs/EPISODE_TAGGING.md))
- `npm test` - Run unit tests
- `npm run update-new-episode-urls <file>` - Update platform URLs (Spotify, YouTube, Apple Podcasts, Amazon Music) in episodes file

## 🤖 Automated Podcast Feed Updates

このプロジェクトは、GitHub Actions を使用してポッドキャストフィードを自動的に更新します。

### 更新スケジュール

- **自動実行**: 毎日午前 9 時（日本時間）/ UTC 0:00
- **手動実行**: GitHub Actions タブから「Update RSS Feed」ワークフローを手動で実行可能

### 仕組み

1. GitHub Actions が https://anchor.fm/s/105976b60/podcast/rss から最新の RSS フィードをダウンロード
2. タイムスタンプ付きの XML ファイル (`YYYYMMDD-HHMM-rss-file.xml`) を保存
3. チャンネル情報を更新 (`channel-info.json`)
4. `episodes.json` を生成（既存データとマージし、各エピソードに URL 情報を付与）
5. プラットフォーム URL を自動更新（Spotify, YouTube, Apple Podcast, Amazon Music）
6. 3 日より古いファイルは自動削除
7. Web サイトは最新の JSON ファイルを自動的に読み込む
8. 変更がプッシュされると、Cloudflare Pages が自動的に再デプロイ

### データフォーマット

- **XML ファイル**: `public/rss/YYYYMMDD-HHMM-rss-file.xml` (最新のみ保持、バックアップ用)
- **エピソードデータ**: `public/rss/YYYYMMDD-HHMM-episodes.json` (3 日間保持、Web サイトが最新を自動選択)
- **チャンネル情報**: `public/rss/channel-info.json` (常に最新に更新)

### 手動更新方法

GitHub リポジトリで:

1. 「Actions」タブを開く
2. 「Update RSS Feed」ワークフローを選択
3. 「Run workflow」をクリック

### エピソードメタデータの管理

`episodes.json` には各エピソードに以下の追加情報が含まれます：

- `guid`: エピソードの一意識別子（RSS フィードから自動取得）
- `spotifyUrl`: Spotify エピソード URL（手動で追加）
- `youtubeUrl`: YouTube 動画 URL（手動で追加）
- `applePodcastUrl`: Apple Podcasts エピソード URL（手動で追加）
- `amazonMusicUrl`: Amazon Music エピソード URL（手動で追加）

新しいエピソードが追加されると、URL フィールドは空文字列として初期化されます。既存のエピソードのメタデータ（URL 情報）は `guid` をキーとして保持されます。

**URL を追加・更新する方法:**

複数の方法でエピソードの URL を更新できます。詳しくは [エピソード URL 更新ガイド](docs/EPISODE_URLS_UPDATE.md) を参照してください。

**方法 1: GitHub Actions で個別更新（推奨）**

1. GitHub リポジトリの「Actions」タブに移動
2. 「Update Episode URLs」ワークフローを選択
3. 「Run workflow」で GUID と各 URL を入力

**方法 2: バッチ更新（複数エピソード一括）**

1. `episode-urls-update.json` ファイルを作成（例: `episode-urls-update.example.json` 参照）
2. コミット＆プッシュすると自動的に更新

**方法 3: ローカルでスクリプト実行**

```bash
npm run update-episode-urls <guid> [spotify_url] [youtube_url] [apple_podcast_url] [amazon_music_url]
```

次回の自動更新時に、編集した URL 情報は新しいタイムスタンプのファイルに引き継がれます。

## 📝 エピソード文字起こし

AssemblyAI を使用してエピソードの自動文字起こしを生成できます。

### セットアップ

1. API キーを取得：
   - [AssemblyAI](https://www.assemblyai.com/) で API キーを取得
2. GitHub リポジトリの Secrets に追加：
   - `ASSEMBLYAI_API_KEY`
3. GitHub Actions から「Transcribe Episode」ワークフローを実行

### 使い方

**GitHub Actions（推奨）:**

1. Actions タブ → Transcribe Episode を選択
2. Episode GUID を入力
3. （オプション）"Generate highlights after transcription" にチェックを入れる
4. 実行 - 文字起こし + テキスト整形（+ ハイライト生成）が自動で完了！
5. 変更が自動的に main ブランチにコミットされます

**ローカル実行:**

```bash
# ステップ1: 文字起こし（音声→テキスト）
export ASSEMBLYAI_API_KEY="your-api-key"
npm run transcribe <episode-guid>

# ステップ2: テキスト整形（スペース削除）
npm run cleanup-transcript <episode-guid>
```

### テキスト整形

文字起こし後、テキストを自動整形します：

- すべてのスペースを削除
- ピリオド (.) を日本語の句点 (。) に変換
- 句点で改行を追加

### ハイライト生成

Groq AI を使用してエピソードから X (Twitter) 投稿用のハイライトを自動生成できます。

**セットアップ:**

1. [Groq](https://console.groq.com/) で API キーを取得
2. GitHub リポジトリの Secrets に追加：`GROQ_API_KEY`

**使い方:**

**GitHub Actions（推奨）:**

1. Actions タブ → Generate Episode Highlights を選択
2. Episode GUID を入力
3. （オプション）"Force regenerate even if highlights exist" にチェックを入れる
4. 実行 - ハイライトが自動生成され、main ブランチにコミットされます

**ローカル実行:**

```bash
# ハイライト生成
export GROQ_API_KEY="your-api-key"
npm run generate-highlights <episode-guid>

# 既存のハイライトを上書き
npm run generate-highlights <episode-guid> --force
```

**生成されるハイライト:**

- 140 文字以内の日本語
- バイラル最適化（衝撃的、数字入り、感情を引き起こす）
- X (Twitter) 投稿に最適化
- 海外キャリアに興味がある日本人向け
- 3 つのハイライトが `highlight1`, `highlight2`, `highlight3` として保存

### スピーカー名の更新 🎙️

文字起こし後、スピーカーラベル（A, B, C など）を実名に更新すると、エピソードページにアバターと名前が表示されます：

**GitHub Actions（推奨）:**

1. Actions タブ → Update Transcript Speakers を選択
2. 入力：
   - Episode GUID
   - Speaker A name（例: Ryo）
   - Speaker B name（例: Senna）
   - Speaker C name（例: John Smith）- オプション
   - Speaker D name（例: Ayaka）- オプション
3. 実行 → **すべてのスピーカーが一度に更新**され、変更が自動的に main ブランチにコミットされます

**ローカル実行:**

```bash
# すべてのスピーカーを一度に更新
npm run update-speakers <guid> Ryo Senna "John Smith" Ayaka

# 一部のスピーカーのみ更新（空文字列でスキップ）
npm run update-speakers <guid> Ryo Senna  # A と B のみ更新
npm run update-speakers <guid> "" Senna  # B のみ更新
```

詳細は [スピーカー更新ガイド](docs/UPDATE_SPEAKERS.md) を参照してください。

## 🎵 エピソード URL の自動取得

プラットフォーム（Spotify、YouTube など）の URL を自動的に取得・更新できます。

### セットアップ

1. [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) でアプリを作成
2. Client ID と Client Secret を取得
3. GitHub リポジトリの Secrets に以下を追加:
   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`

### 使い方

**GitHub Actions（手動実行）:**

- Actions タブ → Update Episode URLs
- プラットフォームを選択（現在は Spotify のみ対応）
- GUID を入力（空欄で全エピソード更新）

**ローカル実行:**

```bash
# すべてのプラットフォームの URL を更新
npm run update-new-episode-urls public/rss/[episodes-file].json
```

詳細は以下のドキュメントを参照:

- [Spotify URL Finder クイックスタート](SPOTIFY_SETUP_QUICKSTART.md)
- [Spotify URL Finder 詳細ガイド](docs/SPOTIFY_URL_FINDER.md)
- [GitHub Action 設定ガイド](docs/GITHUB_ACTION_SPOTIFY.md)

### 対応プラットフォーム

- ✅ **Spotify** - 完全対応
- 🔜 **YouTube** - 開発予定
- 🔜 **Apple Podcasts** - 開発予定
- 🔜 **Amazon Music** - 開発予定

## ⌨️ Keyboard Shortcuts

エピソードページで便利なキーボードショートカットが利用できます。

- **Cmd + Shift + E** (Mac) / **Ctrl + Shift + E** (Win/Linux): エピソード情報モーダルを開く
  - GUID（一意識別子）
  - ハイライト（AI 生成の見どころ）
  - 配信プラットフォーム URL（Spotify、Apple Podcasts、YouTube、Amazon Music）
- **Esc**: モーダルを閉じる

詳細は [キーボードショートカットガイド](docs/KEYBOARD_SHORTCUTS.md) を参照してください。

モーダルシステムの実装については [モーダルシステムドキュメント](docs/MODAL_SYSTEM.md) を参照してください。

## 📄 License

MIT
