# Keyboard Shortcuts

エピソードページで利用できるキーボードショートカット

## ⌨️ Available Shortcuts

### Cmd + Shift + E - Episode Info Modal

エピソードの情報（GUID、ハイライト、配信プラットフォーム URL）を表示するモーダルを開きます。

**内容:**

- Episode GUID（一意識別子）
- Highlights（エピソードのハイライト）
- Apple Podcasts URL
- Spotify URL
- YouTube URL
- Amazon Music URL

**使い方:**

1. Mac: `Cmd + Shift + E` を押す / Windows/Linux: `Ctrl + Shift + E` を押す
2. モーダルが開き、GUID、ハイライト、すべての URL が表示されます
3. GUID コピーボタンで GUID をクリップボードにコピー
4. 各ハイライトや URL をクリックしてコピーできます
5. "Copy Title" ボタンでエピソードタイトルをコピー
6. "Copy Urls" ボタンですべての URL を一度にコピー

**GUID の用途:**

- エピソード URL の更新: `npm run update-episode-urls <guid>`
- エピソードの文字起こし: `npm run transcribe <guid>`
- GitHub Actions でのワークフロー実行時の入力
- 各種スクリプトで特定のエピソードを指定する際の識別子

### Esc - Close Modal

開いているモーダルを閉じます。

## 💡 Tips

- モーダル外をクリックしても閉じることができます
- 各入力欄をクリックしてフォーカスすると、すぐに `Ctrl+C` / `Cmd+C` でコピーできます
- GUID は文字起こしや URL 更新などのスクリプトで使用する重要な識別子です
- ハイライトは AI が生成したエピソードの見どころです

## 🔧 Developer Notes

キーボードショートカットの実装は以下のコンポーネントにあります:

- `src/components/EpisodeUrlModal.astro` - Cmd/Ctrl + Shift + E（GUID、ハイライト、URL を統合表示）

新しいショートカットを追加する場合は、同じパターンに従ってください:

1. `e.metaKey` (Mac) または `e.ctrlKey` (Windows/Linux) と `e.shiftKey` を組み合わせて使用
2. `keydown` イベントで目的のキーと Tab の組み合わせを検知
3. `keyup` イベントで Tab キーのリリースをリセット
