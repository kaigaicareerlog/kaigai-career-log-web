# Episode Transcription Guide

このガイドでは、ポッドキャストエピソードの文字起こしを自動生成する方法を説明します。

## 🎯 機能

- **自動文字起こし**: AssemblyAI を使用した高精度な文字起こし
- **話者識別**: 複数の話者を自動的に識別
- **日本語対応**: 日本語の音声に最適化
- **タイムスタンプ**: 各発言のタイムスタンプ付き
- **複数フォーマット**: Markdown と JSON の両方で出力

## 📋 前提条件

### 1. AssemblyAI API キーの取得

1. [AssemblyAI](https://www.assemblyai.com/) にアクセス
2. アカウントを作成（無料プランあり）
3. ダッシュボードから API キーを取得

### 2. GitHub Secrets の設定

1. GitHub リポジトリの **Settings** → **Secrets and variables** → **Actions** に移動
2. **New repository secret** をクリック
3. 以下のシークレットを追加：
   - **Name**: `ASSEMBLYAI_API_KEY`
   - **Value**: [AssemblyAI API キー]

**オプション**: OpenAI API を使用する場合

- **Name**: `OPENAI_API_KEY`
- **Value**: [OpenAI API キー]

### 3. GitHub Actions の権限設定

GitHub Actions がプルリクエストを作成できるように設定します：

**方法 1: リポジトリ設定を変更（推奨）**

1. GitHub リポジトリの **Settings** → **Actions** → **General** に移動
2. **Workflow permissions** セクションで：
   - ✅ "Read and write permissions" を選択
   - ✅ "Allow GitHub Actions to create and approve pull requests" にチェック
3. **Save** をクリック

**方法 2: Personal Access Token を使用**

リポジトリ設定を変更したくない場合：

1. GitHub プロフィール → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token" で `repo` と `workflow` スコープを持つトークンを作成
3. リポジトリの Secrets に追加：
   - **Name**: `PAT_TOKEN`
   - **Value**: [生成したトークン]

## 🚀 使用方法

### 方法 1: GitHub Actions（推奨）

1. GitHub リポジトリの **Actions** タブに移動
2. 左サイドバーから **Transcribe Episode** ワークフローを選択
3. **Run workflow** をクリック
4. **Episode GUID** を入力（例: `39cf6d7a-a8fc-4f4f-a0f7-3ad0e8e1bc7d`）
5. **Run workflow** をクリック

実行後、自動的にプルリクエストが作成されます。

### 方法 2: ローカルで実行

```bash
# 環境変数を設定
export ASSEMBLYAI_API_KEY="your-api-key"

# 文字起こし実行
npm run transcribe <episode-guid>
```

例：

```bash
npm run transcribe 39cf6d7a-a8fc-4f4f-a0f7-3ad0e8e1bc7d
```

## 📂 出力ファイル

文字起こしは `public/transcripts/` ディレクトリに保存されます：

```
public/transcripts/
├── {guid}.md         # Markdown形式（人が読みやすい）
└── {guid}.json       # JSON形式（プログラム処理用）
```

### Markdown 形式の例

```markdown
# Transcript

## Speakers

**Speaker A** [00:00]

こんにちは、今日は海外キャリアについてお話しします。

**Speaker B** [00:15]

よろしくお願いします！
```

### JSON 形式の例

```json
{
  "episodeGuid": "39cf6d7a-a8fc-4f4f-a0f7-3ad0e8e1bc7d",
  "episodeTitle": "エピソードタイトル",
  "transcribedAt": "2025-10-15T12:00:00.000Z",
  "duration": 3156000,
  "fullText": "全文のテキスト...",
  "utterances": [
    {
      "speaker": "A",
      "text": "こんにちは...",
      "start": 0,
      "end": 5000,
      "timestamp": "00:00"
    }
  ]
}
```

## 🔧 トラブルシューティング

### エラー: "ASSEMBLYAI_API_KEY environment variable is required"

- GitHub Secrets に `ASSEMBLYAI_API_KEY` が設定されているか確認
- ローカル実行の場合、環境変数が正しくエクスポートされているか確認

### エラー: "Episode with GUID xxx not found"

- 入力した GUID が正しいか確認
- 最新の episodes.json ファイルにそのエピソードが含まれているか確認

### 文字起こしがタイムアウトする

- AssemblyAI の処理には 5〜10 分かかることがあります
- 長いエピソード（1 時間以上）の場合、さらに時間がかかる可能性があります

## 💰 コスト

AssemblyAI の料金：

- **無料プラン**: 月 3 時間まで無料
- **有料プラン**: $0.00025/秒（約$0.015/分、$0.90/時間）

詳細: https://www.assemblyai.com/pricing

## 📚 参考

- [AssemblyAI Documentation](https://www.assemblyai.com/docs)
- [Speaker Diarization Guide](https://www.assemblyai.com/docs/audio-intelligence#speaker-diarization)
