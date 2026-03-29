# TANREN UIトークン改善仕様書

**策定日**: 2026-03-30
**ベース**: [ios-uiux-review.md](./ios-uiux-review.md)
**対象ファイル**: `src/theme.ts`、各画面 `src/screens/`、`src/components/`

---

## 総括

| カテゴリ | Must | Should | Nice-to-have |
|---|---|---|---|
| カラー（コントラスト） | 2件 | — | — |
| BUTTON_HEIGHT | — | 1件（命名） | 1件（新トークン） |
| SPACING | — | 2件 | 2件 |
| RADIUS | — | — | — |
| TYPOGRAPHY | — | 1件 | 2件 |
| 追加トークン | — | 3件 | 4件 |

---

## 1. BUTTON_HEIGHT 改善案

### 変更前/変更後 比較表

| トークン | 旧値 | 新値 | 変更理由 | 優先度 |
|---|---|---|---|---|
| `primary` | 60 | **60（変更なし）** | HIG 44pt 超過。OK | — |
| `secondary` | 50 | **50（変更なし）** | HIG 44pt 超過。OK | — |
| `icon` | 44 | **44（変更なし）** | HIG 最小値と一致 | — |
| `iconSmall` | 32 | **32（値変更なし）** | ※名称変更のみ推奨 | Should |
| `tab`（新規） | —（存在なし） | **44** | WorkoutScreen 部位タブの高さ（現在 h34 にハードコード）をトークン化 | Should |

### `iconSmall` 名称変更の根拠

`BUTTON_HEIGHT.iconSmall = 32` の値はコード上でタップ領域としては使われていない。
`ScreenHeader` の戻るアイコンは視覚サイズ 32pt だが、タップ領域は `BUTTON_HEIGHT.icon = 44pt` が別途指定されている。
**現状のまま残すと "32pt のタップ領域" と誤解を招く** ため、名称変更を推奨。

```ts
// 推奨変更
BUTTON_HEIGHT = {
  primary:      60,
  secondary:    50,
  icon:         44,   // タップ領域（HIG 最小値）
  iconDisplay:  32,   // アイコン表示サイズのみ（タップ領域ではない）
  tab:          44,   // 部位タブ・セグメントコントロール（新規追加）
}
```

### 各画面への影響箇所

| 影響箇所 | 現在の記述 | 対応内容 |
|---|---|---|
| `WorkoutScreen.tsx:703` | `tab: { height: 34 }` | `BUTTON_HEIGHT.tab` (44) に変更。`paddingHorizontal` を 16 維持、`borderRadius` を 22 に更新 |
| `ScreenHeader.tsx` | `iconBtn: { width: 44, height: 44 }` | `BUTTON_HEIGHT.icon` 参照に統一（値は変わらず） |
| `WorkoutScreen.tsx` backBtn 系 | 視覚サイズ 32pt | `BUTTON_HEIGHT.iconDisplay` 参照に変更（リファクタ） |

### 実装注意点

- `tab: 44` 追加は**破壊的変更ではない**（新規トークン追加のみ）
- `iconSmall` → `iconDisplay` のリネームは **破壊的変更**。`BUTTON_HEIGHT.iconSmall` を参照する箇所を全検索してから実施すること（現状 ScreenHeader 1箇所のみと推定）
- WorkoutScreen の `tab: { height: 34 }` を 44 に変更すると、タブバーの高さが 10pt 増加。`tabsWrap` の `paddingTop/Bottom` を微調整する必要あり（12/8 → 8/8 で総高さが近くなる）

---

## 2. SPACING 改善案

### 変更前/変更後 比較表

| トークン | 旧値 | 新値 | 変更理由 | 優先度 |
|---|---|---|---|---|
| `xs` | 4 | **4（変更なし）** | 0.5u、OK | — |
| `sm` | 8 | **8（変更なし）** | 1u、OK | — |
| `md` | 16 | **16（変更なし）** | 2u、OK | — |
| `lg` | 24 | **24（変更なし）** | 3u、OK | — |
| `xl` | 32 | **32（変更なし）** | 4u、OK | — |
| `xxl` | 48 | **48（変更なし）** | 6u、OK | — |
| `contentMargin` | 16 | **16（変更なし）** | 2u、OK | — |
| `cardPadding` | **14** | **16** | 8pt グリッド非準拠（14pt = 1.75u）。2u = 16pt で統一 | Nice-to-have |
| `cardGap` | 8 | **8（変更なし）** | 1u、OK | — |
| `sectionGap` | **20** | **24** | 8pt グリッド非準拠（20pt = 2.5u）。3u = 24pt = `SPACING.lg` と統一 | Nice-to-have |
| `tabGap`（新規） | —（6 にハードコード） | **8** | WorkoutScreen タブ間隔。HIG 推奨 8pt 以上 | Should |
| `navItemGap`（新規） | —（2 にハードコード） | **4** | Drawer ナビ項目間隔。画面高さ制約から 4pt を採用 | Should |

### 各画面への影響箇所

#### `cardPadding: 14 → 16`（Nice-to-have）

| 画面・コンポーネント | 参照スタイル | 影響内容 |
|---|---|---|
| `ProgressScreen.tsx:541` | `prCard: { padding: SPACING.cardPadding }` | PRカード内余白が 14→16 に拡大 |
| `ProgressScreen.tsx:581` | `pvCard: { padding: SPACING.cardPadding }` | 部位別カード内余白が拡大 |
| `ProgressScreen.tsx:622` | `chartBox: { padding: SPACING.cardPadding }` | チャートカード内余白が拡大 |
| `MonthlyReportScreen.tsx:532` | `chartBox: { padding: SPACING.cardPadding }` | 月間チャートカード余白が拡大 |
| `MonthlyReportScreen.tsx:449` | `summaryItem: { paddingVertical/Horizontal: SPACING.cardPadding }` | サマリーカードセル余白が拡大 |

**注意**: `cardPadding` は内側余白であり、カード外形サイズが若干増加する。全体レイアウトへの影響は小さいが、縦スクロールが長くなる可能性あり。

#### `sectionGap: 20 → 24`（Nice-to-have）

| 画面・コンポーネント | 参照スタイル | 影響内容 |
|---|---|---|
| `ProgressScreen.tsx:519,525` | `sectionLabel: { marginTop: SPACING.sectionGap }` | セクション間余白が 4pt 拡大 |
| `MonthlyReportScreen.tsx:425,429` | 同上 | 同上 |
| `MonthlyReportScreen.tsx:390` | `monthSelector: { marginBottom: SPACING.sectionGap }` | 月選択欄下余白が拡大 |

> `sectionGap: 24` = `SPACING.lg` と同値になるため、重複排除として `sectionGap` トークンを削除し `lg` で統一する選択肢もある（破壊的変更になるため要検討）。

#### `tabGap: 8`（Should）

| 影響箇所 | 現在の記述 | 対応内容 |
|---|---|---|
| `WorkoutScreen.tsx:700` | `tabsContent: { gap: 6 }` | `SPACING.tabGap` (8) に変更 |
| `WorkoutScreen.tsx:1123` | `histNote: { gap: 6 }` | **これは非タップ要素のため変更不要**（装飾的 gap） |

#### `navItemGap: 4`（Should）

| 影響箇所 | 現在の記述 | 対応内容 |
|---|---|---|
| `CustomDrawerContent.tsx:197` | `navItem: { marginBottom: 2 }` | `SPACING.navItemGap` (4) に変更 |

### 実装注意点

- `cardPadding` と `sectionGap` の変更は**破壊的変更ではない**が、全画面のレイアウトに影響する。スクリーンショット比較テストを推奨
- `tabGap` / `navItemGap` は新規トークン追加のみ。破壊的変更なし
- `sectionGap` を `SPACING.lg` に統合する場合は参照箇所を一括置換してから削除

---

## 3. RADIUS 改善案

### 評価結果

| トークン | 現在値 | iOS 推奨範囲 | 判定 | 変更 |
|---|---|---|---|---|
| `card` | 13 | 12–16pt | OK | 変更なし |
| `button` | 16 | — | OK | 変更なし |
| `btnCTA` | 18 | — | OK | 変更なし |
| `chip` | 20 | — | OK（丸みが高さの約半分、適切） | 変更なし |
| `badge` | 4 | — | OK | 変更なし |
| `sheet` | 18 | 12–20pt | OK | 変更なし |

**RADIUS に関する変更提案は不要。** 全トークンが iOS 標準範囲内かつアプリの設計思想と整合している。

追加検討事項（Nice-to-have）: ボトムタブバー実装（P0-NAV-1）時は `tabBar: 0`（角丸なし）を明示的に定義する。

---

## 4. TYPOGRAPHY 改善案

### 変更前/変更後 比較表

| トークン | 旧値 | 新値 | iOS 対応スタイル | 変更理由 | 優先度 |
|---|---|---|---|---|---|
| `heroNumber` | 58 | **58（変更なし）** | カスタム | アプリ固有の Hero 数値。変更不要 | — |
| `screenTitle` | 26 | **28** | Title 1 (28pt) | iOS 標準 Title 1 との 2pt 乖離を解消 | Nice-to-have |
| `exerciseName` | 20 | **20（変更なし）** | Title 3 (20pt) | iOS 標準と一致 | — |
| `body` | 16 | **17** | Body (17pt) | iOS 標準 Body との 1pt 乖離を解消。可読性向上 | Nice-to-have |
| `bodySmall` | 15 | **15（変更なし）** | Subheadline (15pt) | iOS 標準と一致 | — |
| `caption` | 12 | **12（変更なし）** | Caption 1 (12pt) | iOS 標準と一致 | — |
| `captionSmall` | 10 | **11** | Caption 2 (11pt) | iOS 最小推奨 11pt 未達。読みにくさの原因 | **Should** |

#### フォントウェイト評価

| トークン | 現在値 | 評価 |
|---|---|---|
| `heavy` | `'800'` | OK（HeroNumber / Bold Cards に適切） |
| `bold` | `'700'` | OK（タイトル・種目名） |
| `semiBold` | `'600'` | OK（body テキスト） |
| `regular` | `'500'` | **注意**: iOS の "Regular" は通常 `'400'`。`'500'` は "Medium" に相当。現アプリではキャプションに `'500'` を使用しており、やや重め。変更は任意（Nice-to-have） |

### 各画面への影響箇所

#### `captionSmall: 10 → 11`（Should）

| 影響画面 | 使用スタイル | 要素 |
|---|---|---|
| `ProgressScreen.tsx` | `prExName`, `prDate`, `pvDate` | PRカード種目名・日付 |
| `MonthlyReportScreen.tsx` | `summaryLabel`, `rankSets` | サマリーラベル・ランキングセット数 |
| `WorkoutScreen.tsx` | 多数の unit/caption 系 | 重量単位・セット数ラベル |
| `HomeScreen.tsx` | chip 系ラベル | クイックスタートチップテキスト |
| `HistoryScreen.tsx` | タグ・日付テキスト | 種目タグ・日付表示 |
| `SectionLabel.tsx` | セクションラベル | 全画面のセクションヘッダー |

**影響範囲が広い**が、`theme.ts` の 1 行変更で全画面に一括反映される。テキストの折り返しが発生しないか確認推奨。

#### `body: 16 → 17`（Nice-to-have）

影響箇所は `TYPOGRAPHY.body` を参照する全テキスト。リスト行テキスト・カード本文が対象。
1pt 増加でわずかにレイアウトが伸びる可能性あり。`numberOfLines` 制限をしているコンポーネントで確認が必要。

#### `screenTitle: 26 → 28`（Nice-to-have）

| 影響箇所 | 内容 |
|---|---|
| `ScreenHeader` コンポーネント | ヘッダータイトルが 2pt 増加 |
| `HomeScreen` の大タイトル | 画面タイトルが 2pt 増加 |

---

## 5. ライトテーマ・ダークテーマ共通トークン設計

### 現状の問題

現在 `TanrenThemeColors` は 11 トークンのみで構成されており、以下が未定義：

- **エレベーション（影）**: ダーク系は surface 色差で深度を表現できるが、ライトテーマでは影が必須
- **スクリム/オーバーレイ**: BottomSheet/Drawer のバックドロップが `rgba(0,0,0,0.6)` にハードコード
- **アクセント上のテキスト色**: タブアクティブテキストが `'#fff'` にハードコード
- **ボトムタブバー専用色**: P0-NAV-1 実装で必要になる

### 追加推奨トークン

#### `TanrenThemeColors` への追加（Should）

```ts
export interface TanrenThemeColors {
  // 既存 11トークン
  background:    string;
  surface1:      string;
  surface2:      string;
  textPrimary:   string;
  textSecondary: string;
  textTertiary:  string;
  accent:        string;
  accentDim:     string;
  success:       string;
  separator:     string;
  error:         string;

  // 追加推奨
  onAccent:      string;   // accent 背景上のテキスト/アイコン色（ダーク='#FFF', ライト='#FFF'）
  scrim:         string;   // モーダル・ドロワーのバックドロップ色
  tabBarBg:      string;   // ボトムタブバー背景（P0-NAV-1 実装用）
  tabBarBorder:  string;   // タブバー上端ボーダー（= separator と同値でもよい）
}
```

#### 全テーマへの追加値（Should）

| テーマ | `onAccent` | `scrim` | `tabBarBg` | `tabBarBorder` |
|---|---|---|---|---|
| 全テーマ共通 | `'#FFFFFF'` | `'rgba(0,0,0,0.55)'` | `surface1` と同値 | `separator` と同値 |

> `tabBarBg` と `tabBarBorder` は既存の `surface1` / `separator` と同値で構わないが、
> 将来ライトテーマを追加したときに値が diverge するため、明示的なトークンとして切り出しておく。

### エレベーション/シャドウ設計（Nice-to-have）

現在 `theme.ts` は `defaultShadows` を `@massapp/ui` から引き継いでいる。ライトテーマ追加時に備えた TANREN 固有の shadow トークンを `ELEVATION` として定義する案：

```ts
// 追加提案
export const ELEVATION = {
  card:   { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8,  shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  sheet:  { shadowColor: '#000', shadowOpacity: 0.20, shadowRadius: 16, shadowOffset: { width: 0, height: -4 }, elevation: 8 },
  fab:    { shadowColor: '#000', shadowOpacity: 0.24, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
} as const;
```

ダークテーマでは `shadowOpacity` を `0` に近づける（影が見えないため）ことで、ライト/ダーク兼用の値として機能させる。実装時は `Platform.select` または `ColorScheme` で分岐。

### ハードコード色の統一（Should）

以下の箇所が `TanrenThemeColors` トークン外の色を直接使用している。統一を推奨：

| ファイル | 現在の記述 | 推奨トークン |
|---|---|---|
| `WorkoutScreen.tsx` tabTextActive | `color: '#fff'` | `colors.onAccent` |
| `ProgressScreen.tsx` calDayTextToday | `color: c.background`（間接的に正しい） | OK（変更不要） |
| `BottomSheet.tsx` backdrop | `rgba(0,0,0,0.6)` ハードコード | `colors.scrim` |
| `WorkoutScreen.tsx` done/badge 系 | `'#FFFFFF'` | `colors.onAccent` |

---

## 6. カラートークン改善案（コントラスト修正）

これは `ios-uiux-review.md` の P0 項目であり、**Must** に分類される唯一のテーマ変更。

### 変更前/変更後 比較表（全テーマ共通）

| トークン | 旧 opacity | 新 opacity | コントラスト比（旧） | コントラスト比（新） | WCAG AA | 優先度 |
|---|---|---|---|---|---|---|
| `textSecondary` | **0.45** | **0.60** | 3.84:1（NG） | ≈5.2:1（OK） | 通常テキスト 4.5:1 達成 | **Must** |
| `textTertiary` | **0.22** | **0.38** | 1.69:1（NG） | ≈3.2:1（条件付きOK） | 大テキスト 3:1 達成 | **Must** |

> `textTertiary` は補助的・装飾的テキストが主用途のため、大テキスト基準（3:1）をターゲットとする。
> `textTertiary` を 12pt 以下の通常テキストに使用している箇所は `textSecondary` へ昇格させること。

### 各テーマ 変更一覧

| テーマ ID | `textSecondary` 旧値 | `textSecondary` 新値 | `textTertiary` 旧値 | `textTertiary` 新値 |
|---|---|---|---|---|
| `tanren` | `rgba(245,245,247,0.45)` | `rgba(245,245,247,0.60)` | `rgba(245,245,247,0.22)` | `rgba(245,245,247,0.38)` |
| `tamahagane` | `rgba(232,236,242,0.45)` | `rgba(232,236,242,0.60)` | `rgba(232,236,242,0.22)` | `rgba(232,236,242,0.38)` |
| `shuurushi` | `rgba(245,240,237,0.45)` | `rgba(245,240,237,0.60)` | `rgba(245,240,237,0.22)` | `rgba(245,240,237,0.38)` |
| `suiran` | `rgba(232,240,234,0.45)` | `rgba(232,240,234,0.60)` | `rgba(232,240,234,0.22)` | `rgba(232,240,234,0.38)` |
| `geppaku` | `rgba(232,236,244,0.45)` | `rgba(232,236,244,0.60)` | `rgba(232,236,244,0.22)` | `rgba(232,236,244,0.38)` |
| `shiden` | `rgba(240,236,245,0.45)` | `rgba(240,236,245,0.60)` | `rgba(240,236,245,0.22)` | `rgba(240,236,245,0.38)` |
| `sumizome` | `rgba(240,237,232,0.45)` | `rgba(240,237,232,0.60)` | `rgba(240,237,232,0.22)` | `rgba(240,237,232,0.38)` |
| `kuroshio` | `rgba(228,239,242,0.45)` | `rgba(228,239,242,0.60)` | `rgba(228,239,242,0.22)` | `rgba(228,239,242,0.38)` |

### 各画面への影響

`textSecondary` / `textTertiary` は全画面・全コンポーネントで使用されており、`theme.ts` 変更のみで全画面に自動反映される。
視覚的には「補助テキストが少し明るくなる」変化で、アプリの世界観への影響は最小限。

---

## 7. 実装優先度まとめ

### Must（必須 — App Store 審査・WCAG AA 基準）

| # | 変更内容 | ファイル | 変更難易度 | 破壊的変更 |
|---|---|---|---|---|
| M-1 | `textSecondary` opacity: 0.45 → 0.60（全8テーマ） | `theme.ts` | 低 | **なし** |
| M-2 | `textTertiary` opacity: 0.22 → 0.38（全8テーマ） | `theme.ts` | 低 | **なし** |

### Should（強く推奨 — HIG / UX 品質）

| # | 変更内容 | ファイル | 変更難易度 | 破壊的変更 |
|---|---|---|---|---|
| S-1 | `BUTTON_HEIGHT.tab: 44` 追加 + WorkoutScreen `tab: h34 → h44` | `theme.ts` + `WorkoutScreen.tsx` | 低 | **なし**（新規追加） |
| S-2 | `captionSmall: 10 → 11` | `theme.ts` | 低 | **なし** |
| S-3 | `SPACING.tabGap: 8` 追加 + WorkoutScreen `tabsContent.gap: 6 → 8` | `theme.ts` + `WorkoutScreen.tsx` | 低 | **なし** |
| S-4 | `SPACING.navItemGap: 4` 追加 + `CustomDrawerContent.navItem.marginBottom: 2 → 4` | `theme.ts` + `CustomDrawerContent.tsx` | 低 | **なし** |
| S-5 | `onAccent` / `scrim` / `tabBarBg` / `tabBarBorder` トークン追加 | `theme.ts`（全テーマ） | 中 | **なし**（型拡張） |
| S-6 | `BUTTON_HEIGHT.iconSmall` → `BUTTON_HEIGHT.iconDisplay` リネーム | `theme.ts` + 参照箇所 | 低 | **あり（リネーム）** |

### Nice-to-have（推奨 — デザイン品質向上）

| # | 変更内容 | ファイル | 変更難易度 | 破壊的変更 |
|---|---|---|---|---|
| N-1 | `cardPadding: 14 → 16` | `theme.ts` | 低 | **なし** |
| N-2 | `sectionGap: 20 → 24` | `theme.ts` | 低 | **なし** |
| N-3 | `body: 16 → 17` | `theme.ts` | 低 | **なし** |
| N-4 | `screenTitle: 26 → 28` | `theme.ts` | 低 | **なし** |
| N-5 | `TYPOGRAPHY.regular: '500' → '400'` | `theme.ts` + 参照確認 | 低 | 視覚変更あり |
| N-6 | `ELEVATION` トークン追加（ライトテーマ準備） | `theme.ts` | 低 | **なし** |
| N-7 | ハードコード色の `colors.onAccent` / `colors.scrim` への統一 | 各スクリーン | 中 | **なし** |

---

## 8. 破壊的変更一覧

以下の変更は **既存コードの変更が必要**であり、単純な `theme.ts` 修正だけでは完結しない：

| 変更 | 影響ファイル | 対応内容 |
|---|---|---|
| `BUTTON_HEIGHT.iconSmall` → `iconDisplay` リネーム | `ScreenHeader.tsx`、`WorkoutScreen.tsx`（推定） | 参照をすべて `iconDisplay` に置換 |
| `TanrenThemeColors` への新規プロパティ追加（`onAccent` 等） | `theme.ts` の全テーマ定義 | 全8テーマに新プロパティを追加しないとコンパイルエラー |
| `WorkoutScreen` `tab.height: 34 → 44` | `WorkoutScreen.tsx:703` | タブバー内の `paddingTop/Bottom` 微調整が必要 |

---

## 9. 推奨実装順序

1. **M-1, M-2** — `theme.ts` のみ変更（全テーマ textSecondary/Tertiary opacity 修正）
2. **S-2** — `theme.ts` のみ変更（captionSmall 10→11）
3. **S-1, S-3** — `theme.ts` へ tab/tabGap トークン追加 + WorkoutScreen 2行変更
4. **S-4** — `theme.ts` へ navItemGap 追加 + CustomDrawerContent 1行変更
5. **S-5** — `theme.ts` 全テーマへ onAccent/scrim/tabBar 追加（型安全のため全テーマ同時）
6. **S-6** — iconSmall → iconDisplay リネーム（grep で参照箇所を確認してから実施）
7. **N-1〜N-4** — theme.ts の数値変更のみ（まとめて1コミットでも可）
8. **N-7** — ハードコード色の整理（S-5 完了後に実施）

---

*策定基準: Apple HIG 2025 / WCAG 2.2 AA / ios-uiux Layer 2a スキル §1–§12*
