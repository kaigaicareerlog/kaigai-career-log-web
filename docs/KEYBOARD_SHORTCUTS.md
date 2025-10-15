# Keyboard Shortcuts

エピソードページで利用できるキーボードショートカット

## ⌨️ Available Shortcuts

### Tab + E - Episode URLs Modal

エピソードの配信プラットフォーム URL を表示するモーダルを開きます。

**内容:**

- Apple Podcasts URL
- Spotify URL
- YouTube URL
- Amazon Music URL

**使い方:**

1. `Tab` キーを押したまま `E` を押す
2. モーダルが開き、すべての URL が表示されます
3. 各 URL をクリックしてコピーできます
4. "Copy All" ボタンですべての URL を一度にコピー

### Tab + L - Episode GUID Modal

エピソードの GUID（一意識別子）を表示するモーダルを開きます。

**内容:**

- Episode GUID
- GUID をコピーするボタン

**使い方:**

1. `Tab` キーを押したまま `L` を押す
2. モーダルが開き、GUID が自動選択されます
3. "Copy GUID" ボタンでクリップボードにコピー

**GUID の用途:**

- エピソード URL の更新: `npm run update-episode-urls <guid>`
- エピソードの文字起こし: `npm run transcribe <guid>`
- GitHub Actions でのワークフロー実行時の入力

### Esc - Close Modal

開いているモーダルを閉じます。

## 💡 Tips

- モーダル外をクリックしても閉じることができます
- GUID モーダルでは、開いた瞬間に GUID が自動選択されるので、すぐに `Ctrl+C` / `Cmd+C` でコピーできます
- URL モーダルでは、個別 URL の入力欄をクリックしてフォーカスすると、その URL だけをコピーできます

## 🔧 Developer Notes

キーボードショートカットの実装は以下のコンポーネントにあります:

- `src/components/EpisodeUrlModal.astro` - Tab + E
- `src/components/EpisodeGuidModal.astro` - Tab + L

新しいショートカットを追加する場合は、同じパターンに従ってください:

1. `tabPressed` フラグで Tab キーの状態を追跡
2. `keydown` イベントで目的のキーと Tab の組み合わせを検知
3. `keyup` イベントで Tab キーのリリースをリセット
