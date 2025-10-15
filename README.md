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
- ⌨️ Keyboard shortcuts (Tab+E for URLs, Tab+L for GUID)
- 🎭 Abstracted modal system for easy reuse

## 📝 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run astro` - Run Astro CLI commands
- `npm run update-episode-urls` - Update episode URLs by GUID
- `npm run batch-update-urls` - Batch update multiple episode URLs
- `npm run transcribe <guid>` - Transcribe an episode using AssemblyAI

## 🤖 Automated Podcast Feed Updates

このプロジェクトは、GitHub Actions を使用してポッドキャストフィードを自動的に更新します。

### 更新スケジュール

- **自動実行**: 毎日午前 9 時（日本時間）/ UTC 0:00
- **手動実行**: GitHub Actions タブから「Update RSS Feed」ワークフローを手動で実行可能

### 仕組み

1. GitHub Actions が https://anchor.fm/s/105976b60/podcast/rss から最新の RSS フィードをダウンロード
2. タイムスタンプ付きの XML ファイル (`YYYYMMDD-HHMM-rss-file.xml`) を保存
3. XML を JSON に変換し、タイムスタンプ付きの JSON ファイル (`YYYYMMDD-HHMM-podcast-data.json`) を保存
4. `episodes.json` を生成（既存データとマージし、各エピソードに ID と URL 情報を付与）
5. 3 日より古いファイルは自動削除
6. Web サイトは最新の JSON ファイルを自動的に読み込む
7. 変更がプッシュされると、Cloudflare Pages が自動的に再デプロイ

### データフォーマット

- **XML ファイル**: `public/rss/YYYYMMDD-HHMM-rss-file.xml` (3 日間保持、バックアップ用)
- **JSON ファイル**: `public/rss/YYYYMMDD-HHMM-podcast-data.json` (3 日間保持、中間データ)
- **エピソードデータ**: `public/rss/YYYYMMDD-HHMM-episodes.json` (3 日間保持、Web サイトが最新を自動選択)

### 手動更新方法

GitHub リポジトリで:

1. 「Actions」タブを開く
2. 「Update RSS Feed」ワークフローを選択
3. 「Run workflow」をクリック

### ローカルで XML を JSON に変換

```bash
npx tsx scripts/xml-to-json.ts public/rss/latest.xml public/rss/podcast-data.json
```

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
# 個別更新
npm run update-episode-urls <guid> [spotify_url] [youtube_url] [apple_podcast_url] [amazon_music_url]

# バッチ更新
npm run batch-update-urls episode-urls-update.json
```

次回の自動更新時に、編集した URL 情報は新しいタイムスタンプのファイルに引き継がれます。

## 📝 エピソード文字起こし

AssemblyAI を使用してエピソードの自動文字起こしを生成できます。

### セットアップ

1. [AssemblyAI](https://www.assemblyai.com/) で API キーを取得
2. GitHub リポジトリの Secrets に `ASSEMBLYAI_API_KEY` を追加
3. GitHub Actions から「Transcribe Episode」ワークフローを実行

### 使い方

**GitHub Actions（推奨）:**

1. Actions タブ → Transcribe Episode を選択
2. Episode GUID を入力して実行
3. 自動的にプルリクエストが作成されます

**ローカル実行:**

```bash
export ASSEMBLYAI_API_KEY="your-api-key"
npm run transcribe <episode-guid>
```

詳細は [文字起こしガイド](docs/TRANSCRIPTION_GUIDE.md) を参照してください。

## ⌨️ Keyboard Shortcuts

エピソードページで便利なキーボードショートカットが利用できます。

- **Tab + E**: エピソード URL モーダルを開く（Spotify、Apple Podcasts、YouTube など）
- **Tab + L**: エピソード GUID モーダルを開く（URL 更新や文字起こしで使用）
- **Esc**: モーダルを閉じる

詳細は [キーボードショートカットガイド](docs/KEYBOARD_SHORTCUTS.md) を参照してください。

モーダルシステムの実装については [モーダルシステムドキュメント](docs/MODAL_SYSTEM.md) を参照してください。

## 📄 License

MIT
