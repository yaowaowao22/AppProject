# ReCallKit コードオーディット

作成日: 2026-04-01
対象ブランチ: main

---

## 1. ホーム画面 `src/screens/home/HomeScreen.tsx`

### 現状

`totalItems` の件数をロード後に評価し、`totalItems === 0` のとき 168–188 行で **早期 return** している。

```tsx
// L168–188
if (totalItems === 0) {
  return (
    <View style={[styles.center, ...]}>
      <Ionicons name="archive-outline" ... />
      <Text>まだアイテムがありません</Text>
      <Text>まずライブラリにアイテムを追加しましょう</Text>
      <Pressable onPress={() => navigate('Library')}>ライブラリへ</Pressable>
    </View>
  );
}
```

190 行以降の `<ScrollView>` 内のダッシュボードセクションは以下で構成されている。

| セクション | 行 |
|---|---|
| サイドバーフィルターバッジ | L196–213 |
| ヒーローカード（ストリークリング + 今日の復習件数 + スタートボタン） | L215–256 |
| URL解析導線カード (`handleOpenURLAnalysis`) | L258–281 |
| 統計セクション（今日完了 / 総アイテム / 連続日数） | L283–300 |
| 最近復習した内容 | L302–338 |
| ジャーナル導線 | L340–364 |

### 問題点

**アイテム 0 件時にダッシュボード全体が非表示になる**

- ストリークリング・URL 解析導線・統計カードはアイテムがなくても有用だが、早期 return によって一切表示されない。
- 特に「URLから学習カードを作成」導線（L258–281）が初回ユーザーに表示されないため、アイテム追加の動線が閉塞する。

### 修正方針

1. `totalItems === 0` の早期 return ブロック（L168–188）を削除する。
2. ヒーローカード内またはスクロール末尾に「アイテムがありません」メッセージをインラインで条件表示する（例: `dueItems.length === 0 && totalItems === 0` のとき空状態バナー表示）。
3. URL 解析導線・統計・ストリークリングは `totalItems` に関わらず常時表示する。

### 対象ファイル・行番号

| ファイル | 行 | 内容 |
|---|---|---|
| `HomeScreen.tsx` | L168–188 | 早期 return ブロック（削除対象） |
| `HomeScreen.tsx` | L215–256 | ヒーローカード（空状態バナー挿入候補） |

---

## 2. ライブラリ画面 `src/screens/library/LibraryScreen.tsx`

### 現状

検索バー・フィルターチップ・SectionList で構成されるリスト画面。複数選択削除モード（ロングプレスで起動）を持つ。

### 問題点 A — 検索欄がつぶれて表示される

**原因: `searchInput` に `height` が未指定**

```tsx
// L619–623
searchInput: {
  flex: 1,
  ...TypeScale.body,
  padding: 0,   // ← explicit 0 padding
},
```

- `searchBar` には `height: 36` が設定されているが（L609–618）、TextInput 側に `height` または `minHeight` の指定がない。
- React Native (iOS) では `flex: 1` だけでは TextInput が親 View の height を適切に継承しない場合がある。
- Android では `padding: 0` を設定しないとデフォルト padding が入り潰れることがある一方、iOS では `height` 未指定でタップ領域が縮小される。
- `URLAnalysisScreen.tsx` の同様 TextInput（`urlInput`）では `height: '100%'` を明示している（L301–305）。

**修正方針**

`searchInput` に `height: '100%'`（または `height: 36`）を追加して親 View に合わせる。

```tsx
searchInput: {
  flex: 1,
  ...TypeScale.body,
  padding: 0,
  height: '100%',  // 追加
},
```

### 問題点 B — 複数選択→削除が機能しない

**現状の実装確認**

| 機能 | 実装箇所 | 実装状況 |
|---|---|---|
| ロングプレスで選択モード開始 | `enterSelectionMode` L201–207 + `onLongPress` L282–285 | ✓ 実装済み |
| チェック UI（チェックサークル） | L290–300 | ✓ 実装済み |
| 選択トグル | `toggleItemSelection` L216–226 | ✓ 実装済み |
| 削除確認 Alert | `deleteSelected` L229–257 | ✓ 実装済み |
| ボトムバー（削除ボタン）| L562–588 | ✓ 実装済み |
| ヘッダーの削除ボタン | なし | **✗ 欠如** |

**潜在的バグ: `db` null チェック欠如**

`deleteSelected` (L243) で `db.runAsync(...)` を直接呼んでいるが、`useDB()` hook（L154）が初期化前に `null` を返す場合、実行時エラーになる可能性がある。

```tsx
// L241–246
const ids = Array.from(selectedIds);
const placeholders = ids.map(() => '?').join(',');
await db.runAsync(   // ← db が null の場合クラッシュ
  `UPDATE items SET archived = 1 ...`,
  ids
);
```

**修正方針**

1. ヘッダーへの削除ボタン追加は任意（ボトムバーに存在するため不要と判断する場合は除外可）。
2. `deleteSelected` 冒頭に `if (!db) return;` を追加して null ガードを設ける。
3. `searchInput` の `height: '100%'` 追加（問題 A と合わせて対応）。

### 対象ファイル・行番号

| ファイル | 行 | 内容 |
|---|---|---|
| `LibraryScreen.tsx` | L619–623 | `searchInput` スタイル（`height` 追加） |
| `LibraryScreen.tsx` | L229 | `deleteSelected` 開始（`if (!db) return;` 追加） |
| `LibraryScreen.tsx` | L243 | `db.runAsync` 呼び出し |

---

## 3. 復習画面 `src/screens/review/ReviewScreen.tsx`

### 現状

`ReviewStack.tsx` の設定:

```tsx
// ReviewStack.tsx L29–34
<Stack.Screen
  name="Review"
  component={ReviewScreen}
  options={{
    title: '復習',
    presentation: 'fullScreenModal',
    headerShown: false,   // ナビゲーターヘッダー非表示
  }}
/>
```

`ReviewScreen.tsx` 独自ヘッダー（L128–142）:

```tsx
<View style={styles.header}>
  <Pressable onPress={() => navigation.goBack()}>
    <Text style={{ color: colors.accent }}>閉じる</Text>
  </Pressable>
  <Text>{currentIndex + 1} / {items.length}</Text>
  <View style={styles.headerSide} />  {/* 右側スペーサー（空） */}
</View>
```

### 問題点

1. **サイドバーボタン（HeaderHamburger）が未実装**
   `fullScreenModal` プレゼンテーションのため、ドロワーナビゲーターのジェスチャーが無効化される。独自ヘッダーにハンバーガーアイコンも存在しない。

2. **ヘッダースタイルが他画面と非統一**
   他画面は `sharedScreenOptions` の `makeLargeTitleOptions` でスタイルを統一しているが、ReviewScreen は独自ヘッダーのみ。フォント・余白・セーフエリアの扱いが異なる。

3. **右側 `headerSide` が空の View**（L141）
   左の「閉じる」ボタンに対応する右要素がなく、視覚的に進捗テキストが左寄りになる。

### 修正方針

**方針 1（推奨）: `presentation` を通常スタック遷移に変更**

`fullScreenModal` をやめることでドロワースワイプが機能し、DrawerContent のサイドバーが利用可能になる。

```tsx
// ReviewStack.tsx
options={{
  presentation: 'card',  // 'fullScreenModal' → 'card'
  headerShown: false,
}}
```

**方針 2: モーダルのまま、独自ヘッダーにハンバーガー追加**

モーダル内からドロワーを開く場合は `navigation.getParent<DrawerNavigationProp<DrawerParamList>>()?.openDrawer()` を呼ぶ必要がある。ただし UX 的に違和感がある。

**共通: ヘッダースタイルの統一**

独自ヘッダーを `sharedScreenOptions.tsx` の `makeLargeTitleOptions` と同じ高さ・フォント・背景色に合わせる。

### 対象ファイル・行番号

| ファイル | 行 | 内容 |
|---|---|---|
| `ReviewStack.tsx` | L29–34 | `presentation: 'fullScreenModal'` |
| `ReviewScreen.tsx` | L128–142 | 独自ヘッダー実装 |
| `ReviewScreen.tsx` | L141 | 右側スペーサー（空 View） |

---

## 4. URL取込画面 `src/screens/add/URLAnalysisScreen.tsx` + `src/screens/add/QAPreviewScreen.tsx`

### 現状

`URLAnalysisScreen` → `QAPreviewScreen` の 2 ステップフロー。どちらも `LibraryStack` 内のスクリーン。

### 問題点 A — 保存後の遷移先が誤り

```tsx
// QAPreviewScreen.tsx L192–197
Alert.alert(
  '保存完了',
  `${targets.length}件のQ&Aをライブラリに追加しました`,
  [{ text: 'OK', onPress: () => navigation.popToTop() }],  // ← LibraryStack トップへ
);
```

`navigation.popToTop()` は `LibraryStack` の最上位スクリーン（`Library` 画面）に戻る。
期待される動作はホーム画面（`HomeScreen`）への遷移。

**修正方針**

`popToTop()` を `DrawerNavigator` の `Home` 画面への遷移に変更する。

```tsx
// NG: navigation.popToTop()
// OK:
navigation.getParent<DrawerNavigationProp<DrawerParamList>>()?.navigate('Home');
```

`DrawerNavigationProp` の import と `DrawerParamList` 型の追加が必要。

### 問題点 B — キャンセル時に確認ダイアログなし

```tsx
// QAPreviewScreen.tsx L206–208
const handleCancel = useCallback(() => {
  navigation.goBack();  // ← 確認なしで即 goBack
}, [navigation]);
```

Q&A を編集済みの場合も確認なしで破棄される。

**修正方針**

```tsx
const handleCancel = useCallback(() => {
  const hasEdits = editedQAs.some(
    (qa, i) => qa.question !== clippedPairs[i].question || qa.answer !== clippedPairs[i].answer
  );
  if (hasEdits) {
    Alert.alert(
      '編集を破棄しますか？',
      '変更内容は保存されません',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '破棄', style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
  } else {
    navigation.goBack();
  }
}, [navigation, editedQAs, clippedPairs]);
```

### 問題点 C — 保存後にタグ一覧が最新化されない

**原因の連鎖**

| レイヤー | 取得タイミング | 問題 |
|---|---|---|
| `useTags` (useLibrary.ts L209–238) | `useEffect` + `[fetchTags]` の初回マウント時のみ | `LibraryScreen` が再マウントされない限り再取得されない |
| `LibraryScreen.tsx` L170 | `useTags()` を呼ぶだけで `refresh` は未使用 | `useFocusEffect` で `refresh()` を呼んでいない |
| `DrawerContent.tsx` L167–171 | `drawerOpen` イベント時に `fetchData()` を実行 ✓ | ドロワーを開けば更新される（問題なし） |

`LibraryScreen` では `useItems` の `refresh` は `deleteSelected` で呼んでいるが、`useTags` の `refresh` はどこからも呼ばれていない。保存後に `LibraryScreen` にフォーカスが戻っても `useTags` は再実行されない。

**修正方針**

`LibraryScreen.tsx` で `useFocusEffect` を使い、画面フォーカス時に `refresh` を呼ぶ。

```tsx
import { useFocusEffect } from '@react-navigation/native';

const { tags, refresh: refreshTags } = useTags();

useFocusEffect(
  useCallback(() => {
    refreshTags();
  }, [refreshTags])
);
```

または `QAPreviewScreen` の保存完了後コールバックで遷移前に `LibraryScreen` の `useTags` を refresh するよう設計する（`route.params` にコールバック渡しは推奨しないため、`useFocusEffect` 方式が望ましい）。

### 問題点 D — MAX_ITEMS=25 の実装確認（**実装済み**）

```tsx
// QAPreviewScreen.tsx L37
const MAX_ITEMS = 25;  // ✓ 実装済み

// L87–90
const wasTruncated = rawPairs.length > MAX_ITEMS;
const clippedPairs = useMemo(
  () => rawPairs.slice(0, MAX_ITEMS),  // ✓ 先頭25件に切り捨て
  [rawPairs],
);
```

超過時は L251–258 でオレンジ色の警告バナーを表示。**修正不要。**

### 対象ファイル・行番号

| ファイル | 行 | 内容 |
|---|---|---|
| `QAPreviewScreen.tsx` | L192–197 | 保存後 `popToTop()` → `navigate('Home')` に変更 |
| `QAPreviewScreen.tsx` | L206–208 | `handleCancel` → 確認 Alert を追加 |
| `LibraryScreen.tsx` | L170 | `useTags()` の `refresh` 取得 + `useFocusEffect` 追加 |
| `useLibrary.ts` | L209–238 | `useTags` の `refresh` は公開済み（呼び出し側の問題） |

---

## 5. 追加調査まとめ

### DrawerContent.tsx — タグリフレッシュ機構

- `fetchData` (L104–160): タグ・コレクション・todayCount などを一括取得。
- **リフレッシュトリガー**:
  1. 初回マウント時 `useEffect` (L162–164)
  2. `drawerOpen` イベント時 (L167–171) ← ドロワーを開くたびに再取得 ✓
- 保存後にドロワーを開けばタグは更新される。ただし自動更新はなく、ユーザーがドロワー操作をしないと反映されない。

### useLibrary.ts — useTags の再取得トリガー

- `refresh: fetchTags` を返却しているが（L237）、`LibraryScreen` で呼ばれていない。
- `useFocusEffect` を `LibraryScreen` に追加する対応が最小コストで効果的。

### navigation/types.ts — 遷移型定義

- `LibraryStackParamList` (L39–52): `QAPreview` パラメータ型は定義済み ✓。
- 問題 A の修正で `QAPreviewScreen` から Drawer の `Home` へ遷移する場合、`DrawerNavigationProp<DrawerParamList>` のインポートが必要。型定義自体の変更は不要。

---

## 修正優先度サマリー

| # | 画面 | 問題 | 優先度 |
|---|---|---|---|
| 1 | ホーム | アイテム 0 件時にダッシュボード非表示 | **高** |
| 2 | URL取込 | 保存後にホームではなくライブラリに遷移 | **高** |
| 3 | ライブラリ | 検索欄がつぶれて表示される | **中** |
| 4 | ライブラリ | 保存後タグ一覧が更新されない | **中** |
| 5 | URL取込 | キャンセル時に確認ダイアログなし | **中** |
| 6 | ライブラリ | `deleteSelected` の `db` null ガード欠如 | **低** |
| 7 | 復習 | ハンバーガーボタン・ヘッダー統一 | **低** |
