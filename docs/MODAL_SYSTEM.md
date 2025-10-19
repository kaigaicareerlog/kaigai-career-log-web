# Modal System Documentation

このプロジェクトの再利用可能なモーダルシステムについて説明します。

## 📁 Architecture

モーダルシステムは以下のコンポーネントで構成されています：

### Base Component

- **`src/components/common/Modal.astro`** - 再利用可能なベースモーダルコンポーネント

### Utilities

- **`src/utils/modal.ts`** - モーダル操作のユーティリティ関数

### Modal Implementations

- **`src/components/EpisodeUrlModal.astro`** - エピソード URL 表示モーダル (Tab + E)
- **`src/components/EpisodeGuidModal.astro`** - エピソード GUID 表示モーダル (Tab + L)

## 🎨 Base Modal Component

### Usage

```astro
---
import Modal from './common/Modal.astro';
---

<Modal id="my-modal" title="My Modal Title">
  <!-- モーダルのメインコンテンツ -->
  <p>Your content here</p>

  <!-- フッタースロット (オプション) -->
  <div slot="footer">
    <button>Action</button>
  </div>
</Modal>
```

### Props

| Prop         | Type      | Default  | Description          |
| ------------ | --------- | -------- | -------------------- |
| `id`         | `string`  | required | モーダルの一意な ID  |
| `title`      | `string`  | optional | モーダルのタイトル   |
| `showFooter` | `boolean` | `true`   | フッターを表示するか |

### Slots

| Slot     | Description                    |
| -------- | ------------------------------ |
| default  | モーダルのメインコンテンツ     |
| `title`  | タイトルをカスタマイズする場合 |
| `footer` | フッターのカスタムコンテンツ   |

## 🛠️ Utility Functions

### `getModalElements(modalId: string)`

モーダルの要素を取得

```typescript
const { modal, closeBtn } = getModalElements('my-modal');
```

### `showModal(modal: HTMLElement | null)`

モーダルを表示

```typescript
showModal(modal);
```

### `hideModal(modal: HTMLElement | null)`

モーダルを閉じる

```typescript
hideModal(modal);
```

### `toggleModal(modal: HTMLElement | null)`

モーダルの表示/非表示を切り替え

```typescript
toggleModal(modal);
```

### `setupModalKeyboardShortcut(triggerKey: string, callback: () => void)`

キーボードショートカットを設定

```typescript
setupModalKeyboardShortcut('e', () => {
  showModal(modal);
});
```

### `setupModalOutsideClick(modal: HTMLElement | null, onClose: () => void)`

モーダル外クリックで閉じる処理を設定

```typescript
setupModalOutsideClick(modal, () => hideModal(modal));
```

### `copyToClipboard(text: string, feedbackElement?: HTMLElement | null)`

クリップボードにコピー＆フィードバック表示

```typescript
await copyToClipboard('text to copy', feedbackElement);
```

## 📝 Creating a New Modal

新しいモーダルを作成する手順：

### 1. モーダルコンポーネントを作成

```astro
---
// src/components/MyCustomModal.astro
import Modal from './common/Modal.astro';
---

<Modal id="my-custom-modal" title="My Custom Modal">
  <div class="my-content">
    <!-- Your custom content -->
  </div>

  <div slot="footer">
    <button id="my-action-btn">Action</button>
  </div>
</Modal>

<script>
  import {
    getModalElements,
    showModal,
    hideModal,
    setupModalOutsideClick,
  } from '../utils/modal';

  const { modal, closeBtn } = getModalElements('my-custom-modal');

  // Setup keyboard shortcut (e.g., Tab + M)
  let tabPressed = false;

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Tab') tabPressed = true;

    if ((e.key === 'm' || e.key === 'M') && tabPressed) {
      e.preventDefault();
      showModal(modal);
    }

    if (e.key === 'Escape') {
      hideModal(modal);
    }
  });

  document.addEventListener('keyup', (e: KeyboardEvent) => {
    if (e.key === 'Tab') tabPressed = false;
  });

  closeBtn?.addEventListener('click', () => hideModal(modal));
  setupModalOutsideClick(modal, () => hideModal(modal));
</script>

<style>
  .my-content {
    /* Your custom styles */
  }
</style>
```

### 2. ページに追加

```astro
---
// src/pages/episodes/[guid].astro
import MyCustomModal from '../../components/MyCustomModal.astro';
---

<BaseLayout>
  <!-- Page content -->

  <MyCustomModal />
</BaseLayout>
```

## 🎯 Best Practices

### 1. ID 命名規則

- モーダル ID は `{purpose}-modal` 形式にする
- 例: `episode-url-modal`, `episode-guid-modal`

### 2. キーボードショートカット

- `Tab + [キー]` の組み合わせを使用
- 既存のショートカット:
  - `Tab + E`: Episode URLs
  - `Tab + L`: Episode GUID
- `Escape` キーで必ず閉じられるようにする

### 3. アクセシビリティ

- 閉じるボタンには `aria-label` を付ける
- フォーカス管理を適切に行う
- キーボード操作を必ず提供する

### 4. スタイリング

- ベースモーダルのスタイルを上書きしない
- カスタムスタイルはモーダルコンテンツ内で定義
- CSS 変数を活用して統一感を保つ

### 5. エラーハンドリング

- モーダル要素の存在チェックを必ず行う
- `null` チェックを忘れない

## 🔧 Common Patterns

### パターン 1: フォーム送信モーダル

```astro
<Modal id="form-modal" title="Submit Form">
  <form id="my-form">
    <input type="text" name="field" />
  </form>

  <div slot="footer">
    <button type="submit" form="my-form">Submit</button>
  </div>
</Modal>
```

### パターン 2: 確認ダイアログ

```astro
<Modal id="confirm-modal" title="Are you sure?">
  <p>This action cannot be undone.</p>

  <div slot="footer">
    <button id="cancel-btn">Cancel</button>
    <button id="confirm-btn">Confirm</button>
  </div>
</Modal>
```

### パターン 3: 情報表示モーダル

```astro
<Modal id="info-modal" title="Information">
  <div class="info-content">
    <p>Important information here...</p>
  </div>
</Modal>
```

## 📚 Examples

実際の使用例については、以下のファイルを参照してください：

- `src/components/EpisodeUrlModal.astro` - 複数の URL を表示
- `src/components/EpisodeGuidModal.astro` - GUID をコピー可能な形式で表示

## 🐛 Troubleshooting

### モーダルが開かない

- モーダル ID が正しく設定されているか確認
- `showModal()` が呼ばれているか確認
- コンソールエラーをチェック

### キーボードショートカットが動作しない

- イベントリスナーが正しく設定されているか確認
- `tabPressed` フラグが正しく管理されているか確認
- 他のショートカットと競合していないか確認

### スタイルが適用されない

- CSS 変数が定義されているか確認
- スコープドスタイルが正しく書かれているか確認
- ブラウザの開発者ツールで要素を検証
