# ReCallKit ヘッダー構成・コンテンツ干渉 調査レポート

> 調査日: 2026-03-31
> 調査対象: `src/navigation/stacks/`, `src/components/`, `src/screens/` 配下

---

## 1. 画面ごとのヘッダー構成一覧

### Drawer画面（各Stack の root 画面）

| 画面 | Stackファイル:行 | headerLargeTitle | headerLeft | headerShown | contentStyle.bg | themeソース |
|---|---|---|---|---|---|---|
| HomeScreen | HomeStack.tsx:31–38 | ✅ true | `<HeaderHamburger />` | (既定=true) | `backgroundGrouped` | ❌ useColorScheme() 直接 |
| LibraryScreen | LibraryStack.tsx:31–39 | ✅ true | `<HeaderHamburger />` | (既定=true) | `backgroundGrouped` | ❌ useColorScheme() 直接 |
| ReviewScreen | ReviewStack.tsx:29–33 | — | — | ❌ false | `backgroundGrouped` | ❌ useColorScheme() 直接 |
| QuizScreen | ReviewStack.tsx:36–43 | — | — | ❌ false | `backgroundGrouped` | ❌ useColorScheme() 直接 |
| KnowledgeMapScreen | MapStack.tsx:28–39 | ✅ true | `<HeaderHamburger />` | (既定=true) | ⚠️ `background` | ❌ useColorScheme() 直接 |
| JournalScreen | JournalStack.tsx:29–39 | ✅ true | `<HeaderHamburger />` | (既定=true) | `backgroundGrouped` | ❌ useColorScheme() 直接 |
| SettingsScreen | SettingsStack.tsx:29–39 | ✅ true | `<HeaderHamburger />` | (既定=true) | `backgroundGrouped` | ❌ useColorScheme() 直接 |

### Push先 / モーダル画面

| 画面 | Stackファイル:行 | headerShown | title | presentation | その他 |
|---|---|---|---|---|---|
| ItemDetailScreen（LibraryStack） | LibraryStack.tsx:43–45 | (既定=true) | `''`（空） | — | タイトルは `navigation.setOptions` で動的設定 |
| ItemDetailScreen（MapStack） | MapStack.tsx:42–45 | (既定=true) | `''`（空） | — | 同上 |
| AddItemScreen | LibraryStack.tsx:47–64 | (既定=true) | `'追加'` | `'modal'` | headerLeft に「キャンセル」Pressable |

---

## 2. HeaderHamburger のサイズ・配置

**ファイル**: `src/components/HeaderHamburger.tsx:8–33`

| プロパティ | 値 | 備考 |
|---|---|---|
| width | 36pt | `NavBarLayout.hamburgerSize` と一致 |
| height | 36pt | HIG タップターゲット 44pt **未満**（✅ hitSlop指定なし） |
| borderRadius | 8pt | `Radius.s` |
| アイコンサイズ | 22pt | `Ionicons "menu"` |
| themeソース | `useTheme()` ✅ | ThemeContext 使用（各Stackと不整合あり） |

**問題**: `hitSlop` が未指定のため、実質タップ領域 36×36pt（HIG 推奨 44×44pt 未満）。

---

## 3. サイドバーボタンとタイトルが別行になっている箇所

`headerLargeTitle: true` の展開時（スクロール最上部）、iOS ネイティブ実装では：
- **上行（compact bar, h=44pt）**：`headerLeft` の HeaderHamburger が配置される
- **下行（large title row, h≒52pt）**：Large Title テキストが左寄せで表示される

この結果、ハンバーガーメニューボタンとページタイトルが **物理的に別行** に表示される。

| 画面 | Stack:行 | 症状 |
|---|---|---|
| HomeScreen「今日」 | HomeStack.tsx:31–38 | ハンバーガー（上行）と「今日」（下行）が分離 |
| LibraryScreen「ライブラリ」 | LibraryStack.tsx:31–39 | 同上 |
| KnowledgeMapScreen「マップ」 | MapStack.tsx:28–39 | 同上 |
| JournalScreen「ジャーナル」 | JournalStack.tsx:29–39 | 同上 |
| SettingsScreen「設定」 | SettingsStack.tsx:29–39 | 同上 |

**スクロール後（compact 折りたたみ時）は同行**になるため、操作性に一貫性がない。

---

## 4. コンテンツがヘッダーと干渉している箇所

### 4-a. LibraryScreen — FABとコンテンツの重なり

**ファイル**: `src/screens/library/LibraryScreen.tsx:350–362` / スタイル `L525–539`

```tsx
// LibraryScreen.tsx:525–539
fab: {
  position: 'absolute',
  right: Spacing.m,        // 16pt
  bottom: Spacing.l,       // 24pt ← 固定値
  width: 56,
  height: 56,
  ...
}
```

- `bottom: 24pt` は固定。iPhoneホームインジケーター（≒34pt）を考慮していない
- FABとSectionListの最後のカードが **視覚的に重なる**
- SectionListの `paddingBottom: 100` (L432) はコンテンツのはみ出し対策として設定されているが、FAB自体の位置は未修正

### 4-b. KnowledgeMapScreen — 選択カードのbottom重なり

**ファイル**: `src/screens/map/KnowledgeMapScreen.tsx:470–483`

```tsx
// 選択カード (L470–483)
paddingBottom: insets.bottom + Spacing.s,  // ← insets使用 ✅
```

選択カードは `useSafeAreaInsets()` を使って `insets.bottom` を加算しているため **対応済み**。

### 4-c. SettingsScreen — contentPaddingTopの二重適用疑念

**ファイル**: `src/screens/settings/SettingsScreen.tsx:360–367`

```tsx
content: {
  paddingTop: Spacing.m,  // 16pt ← 明示的
  paddingBottom: Spacing.xxl,
  paddingHorizontal: Spacing.m,
},
```

`headerLargeTitle: true` + NativeStack では、スクロールビューの `contentInsetAdjustmentBehavior`（default: `automatic`）がヘッダー分の inset を自動管理する。このため、`paddingTop: 16pt` が **二重余白**になる可能性がある（端末・OSバージョン依存）。

### 4-d. JournalScreen — stickyセクションヘッダーとLarge Title

**ファイル**: `src/screens/journal/JournalScreen.tsx:108`

```tsx
<SectionList stickySectionHeadersEnabled />
```

`stickySectionHeadersEnabled: true` でスクロール時にセクションヘッダーがスティッキーになるが、Large Titleのcompact折りたたみアニメーションとの同期が視覚的にずれる可能性がある（パディング干渉）。

---

## 5. SafeArea未対応箇所のリスト

| 箇所 | ファイル:行 | 問題 | 重大度 |
|---|---|---|---|
| **LibraryScreen FAB** | LibraryScreen.tsx:525–539 | `bottom: Spacing.l (24pt)` 固定。ホームインジケーター（34pt）に被る | 🔴 高 |
| **ReviewScreen ローディング状態** | ReviewScreen.tsx:88–92 | `<View>` をルートに使用、SafeAreaView なし。loading中は画面端に貼り付く | 🟡 中 |
| **QuizScreen ローディング状態** | QuizScreen.tsx:193–198 | 同上 | 🟡 中 |
| **KnowledgeMapScreen ルートView** | KnowledgeMapScreen.tsx:340 | `<View style={[styles.root, ...]}>` — SafeAreaView でなく View。ただし選択カードは `insets.bottom` で補正済み | 🟡 中 |
| **JournalScreen listContent** | JournalScreen.tsx:184–186 | `paddingBottom: Spacing.xxl (48pt)` のみ。ホームインジケーター（34pt）に対しては辛うじて通過するが保証なし | 🟢 低 |

---

## 6. テーマ参照の不整合箇所

### 問題の概要

ThemeContext (`src/theme/ThemeContext.tsx`) は `themePreference: 'system' | 'light' | 'dark'` をSQLite DBに永続化し、ユーザーが設定画面で「ライト固定」「ダーク固定」を選択できる仕組みを持つ。

しかし、各Stackの `screenOptions` では `useColorScheme()` （OSレベル）を直接使用しているため、**ユーザーのテーマ設定がナビゲーションヘッダーの色に反映されない**。

### 不整合箇所一覧

| ファイル | 行 | 問題コード | 影響 |
|---|---|---|---|
| HomeStack.tsx | 2, 12–14 | `useColorScheme()` → `isDark = scheme === 'dark'` | ヘッダー背景色・tintColorがOS設定に追従、ユーザー設定無視 |
| LibraryStack.tsx | 2, 14–16 | 同上 | 同上 |
| ReviewStack.tsx | 2, 12–14 | 同上 | ※Review/Quizはheader非表示だが、contentStyleに影響 |
| MapStack.tsx | 2, 13–15 | 同上 | ヘッダー色がOS設定に追従 |
| JournalStack.tsx | 2, 12–14 | 同上 | 同上 |
| SettingsStack.tsx | 2, 12–14 | 同上 | 同上 |

### 整合している箇所（参考）

| ファイル | テーマ参照 | 備考 |
|---|---|---|
| HeaderHamburger.tsx:6 | `useTheme()` ✅ | ThemeContext 使用 |
| DrawerContent.tsx:17 | `useTheme()` ✅ | ThemeContext 使用 |
| SettingsScreen.tsx:15 | `useTheme()` ✅ | ThemeContext 使用 |
| 全画面コンポーネント | `useTheme()` ✅ | ThemeContext 使用 |

> **再現シナリオ**: 設定画面で「ダーク固定」を選択 → アプリを再起動せずLibraryをスクロール → コンテンツはダーク表示だが、ナビゲーションバー（headerStyle）はOS設定（ライト）のままになる

---

## 7. DrawerContent — insets手動適用箇所

**ファイル**: `src/components/DrawerContent.tsx`

```tsx
// L246–253: ヘッダー paddingTop・height の手動計算
<View style={[
  styles.header,
  {
    paddingTop: insets.top + 12,      // ← +12pt はハードコード
    paddingBottom: SidebarLayout.headerPaddingBottom,  // 12pt
    height: insets.top + 64,           // ← 64pt はハードコード
  },
]}>
```

```tsx
// L424: フッター paddingBottom
<View style={[styles.footer, { borderTopColor: sc.separator, paddingBottom: insets.bottom }]}>
```

| 箇所 | 行 | 手法 | 評価 |
|---|---|---|---|
| ヘッダー paddingTop | 249 | `insets.top + 12` | ✅ 機能する。+12ptは視覚的余白だが、Dynamic Island機種での高さ計算（64pt固定）は要確認 |
| ヘッダー height | 251 | `insets.top + 64` | ⚠️ `insets.top` が大きい機種（Dynamic Island=59pt）では高さが 123pt になり意図より大きくなる可能性 |
| フッター paddingBottom | 424 | `insets.bottom` | ✅ 適切 |

---

## 8. 追加: MapStack の contentStyle 不整合

**ファイル**: `src/navigation/stacks/MapStack.tsx:24`

```tsx
contentStyle: { backgroundColor: colors.background },
```

他の5つのStackは全て `colors.backgroundGrouped` を使用しているが、MapStackのみ `colors.background` を使用。KnowledgeMapScreen本体も `colors.background` を使用しており内部整合はとれているが、設計上の意図（マップ画面は全面キャンバスなので白ではなくインク背景）が明示されていない。

---

## 9. 修正優先度付き推奨事項

### 🔴 優先度: 高（機能的バグ・即座の視覚的問題）

#### [P1] 全StackのuseColorScheme()をuseTheme()に置き換え

**影響ファイル**: HomeStack, LibraryStack, ReviewStack, MapStack, JournalStack, SettingsStack（各2〜16行）

```tsx
// 修正前（例: HomeStack.tsx）
import { useColorScheme } from 'react-native';
const scheme = useColorScheme();
const isDark = scheme === 'dark';
const colors = isDark ? DarkColors : LightColors;

// 修正後
import { useTheme } from '../../theme/ThemeContext';
const { colors, isDark } = useTheme();
```

**理由**: ユーザーが設定したテーマ（'light'/'dark'固定）がヘッダーに反映されない。アプリ全体の色設定の統一性が壊れている。

---

#### [P2] LibraryScreen FABの bottom を SafeArea対応

**影響ファイル**: `src/screens/library/LibraryScreen.tsx`

```tsx
// 修正前
fab: {
  position: 'absolute',
  right: Spacing.m,
  bottom: Spacing.l,  // 24pt 固定
  ...
}

// 修正後: useSafeAreaInsets() を使う
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const insets = useSafeAreaInsets();
// ...
<Pressable style={[styles.fab, { backgroundColor: colors.accent, bottom: insets.bottom + Spacing.m }]}>
```

**理由**: iPhoneホームインジケーター（34pt）と重なり、FABが隠れる・押しにくくなる。

---

### 🟡 優先度: 中（UX問題・不整合）

#### [P3] headerLargeTitle + headerLeft の別行問題の設計方針決定

**影響ファイル**: HomeStack, LibraryStack, MapStack, JournalStack, SettingsStack

iOS の headerLargeTitle 展開時にハンバーガーが上行、タイトルが下行に表示される問題。以下のいずれかの方針を選択する：

**方針A**: Large Titleを維持しハンバーガーを `headerRight` に移動（慣例的な配置）
```tsx
headerRight: () => <HeaderHamburger />,
headerLeft: undefined,
```

**方針B**: Large Titleを廃止し、compact headerのみにする（一貫したレイアウト）
```tsx
headerLargeTitle: false,
headerLeft: () => <HeaderHamburger />,
```

**方針C**: 現状維持（スクロールすればcompactになるため許容範囲と判断）

---

#### [P4] HeaderHamburgerのhitSlop追加

**影響ファイル**: `src/components/HeaderHamburger.tsx`

```tsx
// 修正: Pressable に hitSlop を追加
<Pressable
  hitSlop={{ top: 4, right: 4, bottom: 4, left: 4 }}
  ...
>
```

**理由**: 現在 36×36pt のタップ領域が HIG 推奨 44×44pt を下回っている。

---

#### [P5] SettingsScreen の contentPaddingTop 確認

**影響ファイル**: `src/screens/settings/SettingsScreen.tsx:363`

`paddingTop: Spacing.m` (16pt) を削除するか、実機確認後に調整する。`headerLargeTitle` + `NativeStack` では `contentInsetAdjustmentBehavior: 'automatic'` によりヘッダー分の inset が自動管理される。

---

### 🟢 優先度: 低（品質改善）

#### [P6] DrawerContent ヘッダー高さの動的計算

**影響ファイル**: `src/components/DrawerContent.tsx:251`

```tsx
// 現状: height: insets.top + 64（ハードコード）
// Dynamic Island機種では insets.top = 59pt → 合計 123pt と大きすぎる可能性

// 修正案: paddingTop/PaddingBottomのみで高さを決定し、固定heightを廃止
// height の指定を削除し、flexboxに委ねる
```

#### [P7] ReviewScreen / QuizScreen のローディング状態にSafeAreaを追加

**影響ファイル**: `ReviewScreen.tsx:88–93`, `QuizScreen.tsx:193–198`

ローディング中のルートViewを `SafeAreaView` に変更する（または `View` + `useSafeAreaInsets` で `paddingTop` を付与）。

#### [P8] MapStack の contentStyle 背景色にコメント追加

**影響ファイル**: `src/navigation/stacks/MapStack.tsx:24`

他Stackとの違いが意図的であることをコメントで明示する。

---

## 付録: 問題箇所早見表

```
src/navigation/stacks/
  HomeStack.tsx:2,12–14      ← useColorScheme()直接使用（P1）
  LibraryStack.tsx:2,14–16   ← useColorScheme()直接使用（P1）
  ReviewStack.tsx:2,12–14    ← useColorScheme()直接使用（P1）
  MapStack.tsx:2,13–15       ← useColorScheme()直接使用（P1）、background/backgroundGrouped差異（P8）
  JournalStack.tsx:2,12–14   ← useColorScheme()直接使用（P1）
  SettingsStack.tsx:2,12–14  ← useColorScheme()直接使用（P1）

src/screens/
  library/LibraryScreen.tsx:525–539  ← FAB SafeArea未対応（P2）
  settings/SettingsScreen.tsx:363    ← paddingTop二重余白疑念（P5）
  review/ReviewScreen.tsx:88–92      ← ローディング SafeArea未対応（P7）
  review/QuizScreen.tsx:193–198      ← ローディング SafeArea未対応（P7）
  map/KnowledgeMapScreen.tsx:340     ← ルートView SafeArea未使用（低影響）

src/components/
  HeaderHamburger.tsx:14     ← hitSlop未指定（P4）
  DrawerContent.tsx:251      ← header height ハードコード（P6）
```
