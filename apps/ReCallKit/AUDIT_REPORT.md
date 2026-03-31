# ReCallKit 全画面・コンポーネント監査レポート

**監査日:** 2026-03-31  
**対象ディレクトリ:** `apps/ReCallKit/src`  
**調査ファイル数:** 27 ファイル（.tsx / .ts）

---

## 1. ヘッダー欠損チェック

各 Stack ファイルの `options` 設定を精査した結果。

### ✅ 正常なスタック

| スタック | 画面 | title | headerLargeTitle | headerLeft |
|---|---|---|---|---|
| HomeStack.tsx | Home | `今日` | ✅ | ✅ HeaderHamburger |
| LibraryStack.tsx | Library | `ライブラリ` | ✅ | ✅ HeaderHamburger |
| MapStack.tsx | KnowledgeMap | `マップ` | ✅ | ✅ HeaderHamburger |
| JournalStack.tsx | Journal | `ジャーナル` | ✅ | ✅ HeaderHamburger |
| SettingsStack.tsx | Settings | `設定` | ✅ | ✅ HeaderHamburger |

---

### ❌ 問題あり

#### 問題 1 — ItemDetail のタイトルが空文字

| 項目 | 内容 |
|---|---|
| **問題** | `options={{ title: '' }}` でヘッダーが表示されるものの、タイトルが完全に空。バックボタンのみの空ヘッダーになる。 |
| **該当ファイル** | `src/navigation/stacks/LibraryStack.tsx:43–45` / `src/navigation/stacks/MapStack.tsx:42–44` |
| **推奨修正** | ItemDetailScreen 内で `navigation.setOptions({ title: item.title })` を呼び出し、アイテム名を動的に設定する。 |

---

#### 問題 2 — AddItem モーダルに明示的な「キャンセル」ボタンがない

| 項目 | 内容 |
|---|---|
| **問題** | `presentation: 'modal'` でモーダルとして表示されるが、`headerLeft` が未設定のため「キャンセル」ボタンが存在しない。iOS では swipe-to-dismiss が効くものの、Android では閉じる手段がナビゲーションジェスチャーに依存し UX が劣る。 |
| **該当ファイル** | `src/navigation/stacks/LibraryStack.tsx:48–54` |
| **推奨修正** | `options` に `headerLeft: () => <Pressable onPress={() => navigation.goBack()}><Text>キャンセル</Text></Pressable>` を追加する。 |

---

#### 参考 — ReviewStack の `headerShown: false` は意図的な設計

| 項目 | 内容 |
|---|---|
| **状況** | ReviewStack の Review・Quiz 両画面が `headerShown: false` + `presentation: 'fullScreenModal'` |
| **評価** | `ReviewScreen.tsx:128–142` に独自カスタムヘッダー（「閉じる」ボタン＋進捗テキスト）が実装済みのため、意図的な設計。問題なし。 |

---

## 2. サイドバー固定表示チェック

### ✅ ヘッダーはスクロールに追従しない（問題なし）

`DrawerContent.tsx` の構造：

```
<View style={styles.container}>          ← フレックスコンテナ
  <View style={styles.header}>           ← ヘッダー（ScrollView の外）
    <Text>ReCallKit</Text>
    <Pressable>閉じる</Pressable>
  </View>
  <ScrollView style={styles.scroll}>    ← スクロール領域（ヘッダーは含まない）
    ...ナビゲーション・フィルター・タグ・コレクション...
  </ScrollView>
  <View style={styles.footer}>           ← フッター（ScrollView の外）
    ...統計情報・設定リンク...
  </View>
</View>
```

- ヘッダー（アプリ名 + 閉じるボタン）は `ScrollView` の **外側**に配置されており、スクロールで隠れる問題はない。
- `SafeAreaView` は使用せず、`useSafeAreaInsets()` で `paddingTop: insets.top + 12` を手動計算（`DrawerContent.tsx:227`）。フッターにも `paddingBottom: insets.bottom` を適用済み（`DrawerContent.tsx:397`）。
- セーフエリア対応・ヘッダー固定ともに正常実装。

---

## 3. 実装漏れチェック

### ❌ 問題 1 — SettingsScreen がプレースホルダーのまま

| 項目 | 内容 |
|---|---|
| **問題** | 画面全体が「設定（実装予定）」のテキストのみ。設定機能は一切実装されていない。 |
| **該当ファイル** | `src/screens/settings/SettingsScreen.tsx:9` |
| **推奨修正** | `src/db/settingsRepository.ts` に `review_time` / `daily_review_count` / `theme` / `onboarding_completed` の読み書き関数が実装済みのため、これを使って実際の設定 UI（グループ化リスト）を構築する。 |

---

### ❌ 問題 2 — Collections セクションがモックデータ（ハードコード配列）

| 項目 | 内容 |
|---|---|
| **問題** | `MOCK_COLLECTIONS` として 3 件のコレクションがハードコードされている。DB には `collections` テーブルが存在しないため実データ連携不可。 |
| **該当ファイル** | `src/components/DrawerContent.tsx:31–35` |
| **コメント** | ファイル内に `// TODO: DB に collections テーブルが追加された際に実データへ切り替え` の注記あり。 |
| **推奨修正** | DB スキーマに `collections` テーブルを追加し、`useLibrary` または専用フックで取得するよう切り替える。それまではモックであることをコメントで明示しておく（既存コメントで対応済み）。 |

---

### ❌ 問題 3 — URL タイプ選択時の OGP 自動取得が未実装

| 項目 | 内容 |
|---|---|
| **問題** | タイプを「URL」に切り替えると `ソースURL` 入力フィールドが表示されるが、URL を入力しても OGP（タイトル・説明・画像）の自動取得は行われない。タイトルと内容を手入力する必要がある。 |
| **該当ファイル** | `src/screens/add/AddItemScreen.tsx:113–126` |
| **推奨修正** | URL 入力の `onBlur` または「取得」ボタンで OGP フェッチ（`og:title` / `og:description`）を実装し、`title` / `content` を自動補完する。サーバーサイドプロキシまたは expo-web-browser 経由での実装を検討する。 |

---

### ❌ 問題 4 — 共有シート（Share Extension）が未実装

| 項目 | 内容 |
|---|---|
| **問題** | `app.json` に Share Extension 用のプラグイン設定がない。ソースコード全体にも Share Extension 関連のコードが存在しない。Safari や他アプリからのURLシェア受け取りが不可。 |
| **該当ファイル** | `app.json`（全体） |
| **推奨修正** | Expo の Share Extension は公式サポート外のため、`expo-share-extension` (サードパーティ) や `expo-modules-core` を使ったカスタムネイティブモジュールの作成が必要。EAS Build 環境での実装が前提となる。 |

---

### ⚠️ 参考 — settingsRepository.ts は実装済みだが未使用

| 項目 | 内容 |
|---|---|
| **状況** | `src/db/settingsRepository.ts` は `getAllSettings` / `getSetting` / `setSetting` を実装済み。`app_settings` テーブルとの UPSERT 連携も完成している。 |
| **問題** | SettingsScreen がプレースホルダーのため、このリポジトリは一切呼び出されていない（問題 1 と連動）。 |

---

## 4. アイコンチェック

### 全使用アイコン一覧

| アイコン名 | 使用箇所 | ファイル:行番号 | 評価 |
|---|---|---|---|
| `menu` | ハンバーガーメニューボタン | `HeaderHamburger.tsx:20` | ✅ 適切 |
| `close` | サイドバー閉じるボタン | `DrawerContent.tsx:246` | ✅ 適切 |
| `calendar-outline` / `calendar` | Screen Nav「今日」 | `DrawerContent.tsx:41–42`（SCREEN_ITEMS） | ⚠️ 後述 |
| `library-outline` / `library` | Screen Nav「ライブラリ」 | `DrawerContent.tsx:49–50` | ✅ 適切 |
| `repeat-outline` / `repeat` | Screen Nav「復習」 | `DrawerContent.tsx:57–58` | ✅ 適切 |
| `map-outline` / `map` | Screen Nav「マップ」 | `DrawerContent.tsx:63–64` | ✅ 適切 |
| `book-outline` / `book` | Screen Nav「ジャーナル」 | `DrawerContent.tsx:69–70` | ✅ 適切 |
| `calendar-outline` | Smart Filter「今日の復習」 | `DrawerContent.tsx:300` | ❌ 後述 |
| `time-outline` | Smart Filter「期限切れ」 | `DrawerContent.tsx:318` | ✅ 適切 |
| `add-circle-outline` | Smart Filter「最近追加」 | `DrawerContent.tsx:336` | ❌ 後述 |
| `folder-outline` | Collections 各項目 | `DrawerContent.tsx:379` | ✅ 適切 |
| `settings-outline` | フッター設定リンク | `DrawerContent.tsx:419` | ✅ 適切 |
| `search` | 検索バー先頭アイコン | `LibraryScreen.tsx:265` | ✅ 適切 |
| `close-circle` | 検索クリアボタン | `LibraryScreen.tsx:276` | ✅ 適切 |
| `library-outline` | ライブラリ空状態アイコン | `LibraryScreen.tsx:325` | ✅ 適切 |
| `add` | FAB（新規追加ボタン） | `LibraryScreen.tsx:349` | ✅ 適切 |
| `journal-outline` | ジャーナル空状態アイコン | `JournalScreen.tsx:89` | ✅ 適切 |
| `trash-outline` | 削除ボタン | `JournalScreen.tsx:146` | ✅ 適切 |

---

### ❌ 問題 1 — `calendar-outline` が Screen Nav と Smart Filter で重複使用

| 項目 | 内容 |
|---|---|
| **問題** | Screen Navigation の「今日」と Smart Filter の「今日の復習」が同一アイコン（`calendar-outline`）を使用。サイドバー内で 2 箇所が同じ見た目になり、ユーザーが区別しにくい。 |
| **該当ファイル** | `DrawerContent.tsx:41`（SCREEN_ITEMS） / `DrawerContent.tsx:300`（Smart Filter） |
| **推奨修正** | Smart Filter「今日の復習」は `checkmark-circle-outline`（完了チェック）または `today-outline` に変更する。Screen Nav は画面の入口なのに対し、Smart Filter はデータの絞り込みであり、役割の違いをアイコンで表現すべき。 |

---

### ❌ 問題 2 — `add-circle-outline` が「最近追加」フィルターに不適切

| 項目 | 内容 |
|---|---|
| **問題** | `add-circle-outline`（「新しく追加する」ことを示すアイコン）が Smart Filter「最近追加」（最近追加されたアイテムを閲覧するフィルター）に使用されている。「追加するアクション」と「追加済みアイテムの閲覧」で意味が逆転している。 |
| **該当ファイル** | `DrawerContent.tsx:336` |
| **推奨修正** | `sparkles-outline`（新着・最新）または `clock-outline`（最近・時系列）に変更する。`time-outline` は「期限切れ」で既に使用されているため重複を避けること。 |

---

## 総括

| カテゴリ | 問題件数 | 重大度 |
|---|---|---|
| ヘッダー欠損 | 2件 | 低〜中 |
| サイドバー固定表示 | 0件（正常） | — |
| 実装漏れ | 4件（+ 参考 1件） | 高（SettingsScreen・Share Extension） / 中（OGP・Collections） |
| アイコン不適切 | 2件 | 低 |
| **合計** | **8件** | |

### 対応優先度

1. **高:** `SettingsScreen.tsx` の実装（`settingsRepository.ts` が待機中）
2. **高:** `AddItemScreen.tsx` モーダルのキャンセルボタン欠如
3. **中:** OGP 自動取得の実装（URL タイプの UX 向上）
4. **中:** `calendar-outline` の重複アイコン修正（視認性向上）
5. **低:** `add-circle-outline` → `sparkles-outline` のアイコン修正
6. **低:** ItemDetail の動的タイトル設定
7. **低:** Collections のモックデータ → DB 連携（スキーマ追加が前提）
8. **将来:** Share Extension 実装（ネイティブモジュール開発が必要）
