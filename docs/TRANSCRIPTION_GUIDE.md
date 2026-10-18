# Episode Transcription Guide

このガイドでは、ポッドキャストエピソードの文字起こしを自動生成する方法を説明します。

## 🎯 機能

- **自動文字起こし**: ElevenLabs Scribe v2 による句読点付きの文字起こし
- **話者識別**: 複数の話者を自動的に識別（`speaker_0`, `speaker_1`, ...）
- **固有名詞の辞書**: `src/data/glossary.json` の語を Scribe に渡し、文字起こし後に表記を統一
- **予算ガード**: 月ごとの上限を超える文字起こしは、音声を送る前に止める
- **タイムスタンプ**: 各発言のタイムスタンプ付き

## 📋 前提条件

### 1. ElevenLabs 側の設定

1. [ElevenLabs](https://elevenlabs.io/) でアカウントを作成
2. **自動化専用の API キーを作成**（Developers → API Keys）
   - 権限は **Speech to Text だけ**を有効にする
   - キーに**クレジット上限**を設定する（使いすぎた時の最後の防衛線）
3. **課金の上限を設定**（どちらか）
   - サブスクリプション: Usage based billing をオフにするか、threshold を低めに設定
   - Pay as you go: Auto Top Up をオフにするか、月の上限（monthly spend cap）を設定

### 2. GitHub の設定

**Settings** → **Secrets and variables** → **Actions** で以下を追加します：

| 種類     | 名前                               | 値                             |
| -------- | ---------------------------------- | ------------------------------ |
| Secret   | `ELEVENLABS_API_KEY`               | 上で作った API キー            |
| Variable | `MONTHLY_TRANSCRIPTION_BUDGET_USD` | 月の上限（ドル、省略時は `5`） |
| Secret   | `GROQ_API_KEY`                     | ハイライト生成用（既存）       |

### 3. GitHub Actions の権限設定

GitHub Actions がコミットできるように設定します：

**方法 1: リポジトリ設定を変更（推奨）**

1. GitHub リポジトリの **Settings** → **Actions** → **General** に移動
2. **Workflow permissions** で "Read and write permissions" を選択
3. **Save** をクリック

**方法 2: Personal Access Token を使用**

1. GitHub プロフィール → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. `repo` と `workflow` スコープを持つトークンを作成
3. リポジトリの Secrets に `PAT_TOKEN` として追加

## 🚀 使用方法

**新エピソードは毎日自動で文字起こしされます**（`transcribe-new-episodes.yml`、01:00 UTC）。文字起こしがない回を新しい順に 1 回 1 件ずつ処理し、PR が開いている回は飛ばします。過去回をまとめて処理するときは、**Transcribe New Episodes** を手動実行して件数を指定してください（必要なら先に `MONTHLY_TRANSCRIPTION_BUDGET_USD` を上げる）。

1 回分だけ処理する場合は以下の手順です。

### 方法 1: GitHub Actions（推奨）

1. **Actions** タブ → **Transcribe Episode** を選択
2. **Run workflow** をクリック
3. 入力：
   - **Episode GUID**（例: `39cf6d7a-a8fc-4f4f-a0f7-3ad0e8e1bc7d`）
   - **Exact number of speakers**（任意）: 話者数が分かっていれば入れると話者分離が安定します
   - **Redo**（任意）: Scribe で文字起こし済みの回をやり直す時だけチェック
4. **Run workflow** をクリック

次の順に自動で進み、最後に **PR** が作られます：

1. 予算チェック → Scribe で文字起こし（使用量の記録はすぐ main にコミット）
2. ハイライト生成（既にある場合は残す）
3. 話者名の自動付与（下記）
4. 文字起こしの冒頭（ゲストの自己紹介）を使ってタグを付け直し、main に反映（レビュー済みのタグはそのまま）
5. 文字起こしの PR を作成。本文に話者名の結果と要確認の点が載るので、確認してマージするとサイトに公開されます

ハイライトや話者名（Groq）が失敗しても、文字起こしは PR に入ります。

### 方法 2: ローカルで実行

```bash
export ELEVENLABS_API_KEY="your-api-key"

npm run transcribe <episode-guid>
npm run transcribe <episode-guid> -- --speakers=3   # 話者数を指定
npm run transcribe <episode-guid> -- --force        # Scribe 済みの回をやり直す
```

## 🗣️ 話者名の自動付与

`npm run name-speakers <guid>` が、冒頭の自己紹介（「FROGのSennaです」など）から `speaker_0` などを名前に置き換えます（Groq）。間違った名前を付けるより残す方を優先しています：

- モデルが確信を持てた名前で、ローマ字で、**文字起こしの冒頭に実際に出てくる名前**だけを使います
- 1 人だけ残った場合は、まだ割り当てていない登場人物が 1 人ならその人にします（PR では「消去法・要確認」と表示）
- 2 つのラベルが同じ人になった場合は、どちらも付けません
- インタビュー回でゲストより他の人の発話が多い場合は、話者分離が混ざっている可能性として警告します

残ったラベルは [Update Speakers](UPDATE_SPEAKERS.md) で付けてください。Scribe の話者分離は回の後半でずれたり、2 人が 1 つのラベルに混ざったりすることがあるので、PR では後半の発言者も確認してください。

```bash
npm run name-speakers <episode-guid> -- --dry-run   # 保存せずに結果だけ見る
```

## 📖 固有名詞の辞書

`src/data/glossary.json` で管理します。人名はローマ字で書きます（ホストは Ryo, Senna, Hiroshi）。

- `keyterms`: Scribe に渡す語。その回の `episodeMeta.json` のゲスト名・会社名も自動で先頭に追加されます
- `corrections`: 文字起こし後に置き換える表記。**上から順に**適用するので、フルネームなど長い形を先に書きます

辞書を更新したら、既存の文字起こしに反映できます（API は呼びません）：

```bash
npm run apply-glossary <episode-guid>
npm run apply-glossary -- --all   # Scribe の文字起こし全部
```

このリポジトリは公開されています。辞書には、エピソードのタイトル・概要・文字起こしで既に公開されている名前だけを入れてください。

## 💰 コストと予算ガード

- Scribe v2: 約 $0.22〜0.27/時間、keyterms 使用で +20%（[公式の料金](https://elevenlabs.io/pricing/api)）
- 1 エピソード（約 1 時間）あたり約 $0.3

`scripts/transcribe-episode.ts` は音声を送る前に次を確認し、超える場合は止まります：

- その月の推定使用額 + 今回の推定額が `MONTHLY_TRANSCRIPTION_BUDGET_USD` を超えないか
- 音声が 2 時間を超えていないか
- Scribe で文字起こし済みでないか（`--force` 以外では二重課金しない）

使用量は `src/data/transcriptionUsage.json` に月ごとに記録され、ワークフローがコミットします。推定額は安全側の $0.27/時間で計算しています。

## 📂 出力ファイル

`public/transcripts/{guid}.json` に保存されます：

```json
{
  "episodeGuid": "39cf6d7a-a8fc-4f4f-a0f7-3ad0e8e1bc7d",
  "episodeTitle": "エピソードタイトル",
  "transcribedAt": "2026-10-18T12:00:00.000Z",
  "transcriber": "elevenlabs-scribe-v2",
  "duration": 3156,
  "fullText": "全文のテキスト...",
  "utterances": [
    {
      "speaker": "speaker_0",
      "text": "こんにちは。",
      "start": 0,
      "end": 5000,
      "timestamp": "00:00"
    }
  ]
}
```

`duration` は秒、`start` / `end` はミリ秒です。`transcriber` がない文字起こしは、以前の AssemblyAI のものです。

話者名は自動で付けられ（上記）、`speakerMap` に元のラベルとの対応が残ります。手で直す場合は [Update Speakers](UPDATE_SPEAKERS.md) を使います（例: `speaker_0` → `Senna`）。

## 🔧 トラブルシューティング

### "ELEVENLABS_API_KEY environment variable is required"

GitHub Secrets（ローカルなら環境変数）に `ELEVENLABS_API_KEY` があるか確認してください。

### "Monthly transcription budget exceeded"

その月の上限に達しています。翌月まで待つか、`MONTHLY_TRANSCRIPTION_BUDGET_USD` を上げてください。

### "ElevenLabs transcription failed: 401 / 402 / 429"

- 401: API キーが無効、または Speech to Text の権限がない
- 402 など: ElevenLabs 側のクレジット上限・残高切れ
- 429: 同時実行の上限。少し待って再実行

### "Episode not found"

- GUID が正しいか確認
- 最新の episodes.json にそのエピソードが含まれているか確認

## 📚 参考

- [ElevenLabs Speech to Text API](https://elevenlabs.io/docs/api-reference/speech-to-text/convert)
- 比較用: `npm run compare-transcription <guid>` で既存の文字起こしと Scribe を並べたレポートを作れます
