# 品質確認レポート

実施日: 2026-03-30
対象: TANRENフィットネスアプリ（ライトテーマ追加・UI改善後）

---

## 1. TypeScript 型チェック

```
npx tsc --noEmit
```

**結果: PASS ✅**
エラー0件。全テーマ追加・新トークン追加後も型整合性は保たれている。

---

## 2. ハードコーディング色の残存確認

### Grep パターン: `'#[0-9a-fA-F]` および `"#[0-9a-fA-F]`

**結果: 1件残存 ⚠️**

| ファイル | 行 | 内容 | 優先度 |
|---|---|---|---|
| `src/screens/WorkoutScreen.tsx` | 1001 | `color: '#fff'` | P2 |

- `theme.ts` 内の色定義はすべて正規（テーマトークン値として記述）
- `createThemeConfig()` 内の `warning: '#FFD60A'` / `info: '#64D2FF'` は @massapp/ui 向け静的マッピングのため許容範囲

**修正案:**
```tsx
// WorkoutScreen.tsx:1001
color: c.onAccent,  // '#fff' → テーマトークン
```

---

## 3. WCAG コントラスト比検証

### 計算方法
相対輝度 L = 0.2126R + 0.7152G + 0.0722B（sRGB linearized）
コントラスト比 CR = (L_lighter + 0.05) / (L_darker + 0.05)
WCAG AA 通常テキスト: CR ≥ 4.5:1 / 大テキスト(18pt+ or 14pt Bold): CR ≥ 3:1

---

### 3-1. ダークテーマ（既存8種 + 追加3種）

#### textPrimary on background

| テーマ | textPrimary | background | CR | AA |
|---|---|---|---|---|
| 鍛鉄 | #F5F5F7 | #111113 | 約 17.1:1 | ✅ AAA |
| 玉鋼 | #E8ECF2 | #0F1219 | 約 15.6:1 | ✅ AAA |
| 朱漆 | #F5F0ED | #141010 | 約 15.2:1 | ✅ AAA |
| 翠嵐 | #E8F0EA | #0E1210 | 約 15.8:1 | ✅ AAA |
| 月白 | #E8ECF4 | #101214 | 約 15.7:1 | ✅ AAA |
| 紫電 | #F0ECF5 | #110F15 | 約 15.5:1 | ✅ AAA |
| 墨染 | #F0EDE8 | #121110 | 約 15.3:1 | ✅ AAA |
| 黒潮 | #E4EFF2 | #0D1214 | 約 15.4:1 | ✅ AAA |
| 桜煙 | #F5EFF2 | #130F11 | 約 16.0:1 | ✅ AAA |
| 萌黄 | #EFF2E8 | #11130E | 約 15.9:1 | ✅ AAA |
| 曙光 | #F5F0EB | #14100E | 約 15.6:1 | ✅ AAA |

#### textSecondary on background（opacity 0.60 適用後の実効色）

全11ダークテーマで実効コントラスト比 **5.6〜6.5:1** → ✅ AA 合格

#### textTertiary on background（opacity 0.38 適用後の実効色）

| テーマ | 実効コントラスト比 | 通常テキスト AA | 大テキスト AA |
|---|---|---|---|
| 全ダークテーマ共通 | 約 3.1〜3.4:1 | ❌ 不合格(4.5:1未満) | ✅ 合格(3:1以上) |

> **問題 [P2]:** `textTertiary` は12ptキャプション等に使用される場合 WCAG AA 非準拠。
> 現状は「補助情報（日付・単位・ラベル補足）」専用として大テキスト基準(3:1)を満たすが、
> 将来的に小テキストへ使用する場合は opacity を **0.50 以上**に上げる必要がある。

---

### 3-2. ライトテーマ（新規5種）

#### textPrimary on background

| テーマ | textPrimary | background | CR | AA |
|---|---|---|---|---|
| 白妙 | #1C1B18 | #FAF8F5 | 約 18.3:1 | ✅ AAA |
| 白磁 | #171A21 | #F7F8FB | 約 19.2:1 | ✅ AAA |
| 花曇 | #1E171A | #FBF7F8 | 約 18.5:1 | ✅ AAA |
| 青磁 | #151C17 | #F5F9F6 | 約 19.0:1 | ✅ AAA |
| 薄藤 | #1A171E | #F9F7FB | 約 18.7:1 | ✅ AAA |

#### textSecondary on background

| テーマ | CR | AA |
|---|---|---|
| 白妙: #6B6560 on #FAF8F5 | 約 5.36:1 | ✅ AA |
| 白磁: #5C6478 on #F7F8FB | 約 5.24:1 | ✅ AA |
| 花曇: #74606A on #FBF7F8 | 約 5.15:1 | ✅ AA |
| 青磁: #546D5A on #F5F9F6 | 約 5.03:1 | ✅ AA |
| 薄藤: #68607A on #F9F7FB | 約 5.19:1 | ✅ AA |

#### textTertiary on background ⚠️

| テーマ | color | CR | 通常テキスト AA | 大テキスト AA |
|---|---|---|---|---|
| 白妙: #938A80 | on #FAF8F5 | 約 3.06:1 | ❌ | ✅ |
| 白磁: #838A9E | on #F7F8FB | 約 3.09:1 | ❌ | ✅ |
| 花曇: #988890 | on #FBF7F8 | 約 3.05:1 | ❌ | ✅ |
| **青磁: #7D9584** | **on #F5F9F6** | **約 2.94:1** | ❌ | **❌ 不合格** |
| 薄藤: #8D84A0 | on #F9F7FB | 約 3.15:1 | ❌ | ✅ |

> **問題 [P1] 青磁テーマ `textTertiary`:** CR 2.94:1 は大テキスト基準(3:1)も不合格。
> 修正案: `#7D9584` → `#6B8C72`（CR ≈ 3.5:1 → 大テキスト合格）または `#5A7A62`（CR ≈ 4.5:1 → AA完全合格）

#### accent on background（装飾・ボタン文字用）

| テーマ | CR | 大テキスト AA |
|---|---|---|
| 白妙: #A87A15 | 約 3.40:1 | ✅ |
| 白磁: #2D5AA0 | 約 6.11:1 | ✅ |
| 花曇: #B5446A | 約 4.86:1 | ✅ |
| 青磁: #2E7A50 | 約 4.66:1 | ✅ |
| 薄藤: #6E48A8 | 約 5.93:1 | ✅ |

> **白妙 accent** (#A87A15) CR 3.40:1 は通常テキスト AA 未達。ボタンラベル等に使用する場合は注意。

---

## 4. ボタン高さ 44pt 統一確認

### 4-1. 主要CTA・アクションボタン

| ファイル | スタイル | 高さ | HIG準拠 |
|---|---|---|---|
| HomeScreen.tsx:214 | `startBtn` | `BUTTON_HEIGHT.primary` (60pt) | ✅ |
| HomeScreen.tsx:264 | `quickChip` | `minHeight: 44` | ✅ |
| WorkoutScreen.tsx:799 | `doneBtn` | `BUTTON_HEIGHT.primary` (60pt) | ✅ |
| WorkoutScreen.tsx:874 | `backBtn` | `height: 44` | ✅ |
| WorkoutScreen.tsx:969-970 | `stepBtn` | `BUTTON_HEIGHT.icon` (44pt) | ✅ |
| WorkoutScreen.tsx:1143 | `addBtn` | `BUTTON_HEIGHT.secondary` (50pt) | ✅ |
| HistoryScreen.tsx:269 | `emptyBtn` | `BUTTON_HEIGHT.primary` (60pt) | ✅ |
| OrderConfirmScreen.tsx:224,235,252,260 | 各ボタン | `BUTTON_HEIGHT.*` | ✅ |
| RMCalculatorScreen.tsx:282,343 | 入力・CTA | `height: 44` | ✅ |
| MonthlyReportScreen.tsx:394,593 | タブ・ボタン | `height: 44` | ✅ |

### 4-2. 問題のあるタップターゲット

| ファイル | 行 | スタイル | 高さ | 問題 | 優先度 |
|---|---|---|---|---|---|
| WorkoutScreen.tsx | 703 | `tab`（部位フィルタータブ） | 34pt | タップターゲット不足 | **P2** |
| ProgressScreen.tsx | 753-755 | `calDayBtn`（カレンダー日付ボタン） | 34pt | タップターゲット不足 | **P2** |
| RMCalculatorScreen.tsx | 349 | `tableHeader`（表示ヘッダー行） | 40pt | **非タップ要素、許容** | - |
| MonthlyReportScreen.tsx | 490 | `bodyPartRow`（表示行） | 36pt | **非タップ要素、許容** | - |
| SettingsScreen.tsx | 273 | `swatch`（カラースウォッチ） | 32pt | **表示専用、許容** | - |

**修正案:**
```tsx
// WorkoutScreen.tsx - tab スタイル（line 702）
tab: {
  height: 44,          // 34 → 44
  minWidth: 56,
  paddingHorizontal: 16,
  borderRadius: 22,    // 17 → 22
  ...
}

// ProgressScreen.tsx - calDayBtn スタイル（line 753）
calDayBtn: {
  width: 40,           // 34 → 40（カレンダーグリッドの制約上40ptが現実的）
  height: 40,          // 34 → 40
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 20,
}
```

---

## 5. 残存問題 優先度付きリスト

### P1（修正必須）

| ID | 問題 | ファイル | 内容 |
|---|---|---|---|
| Q-1 | **青磁テーマ textTertiary WCAG AA 不合格** | theme.ts:356 | `#7D9584` CR 2.94:1 < 3:1（大テキスト基準も未達）|

### P2（推奨修正）

| ID | 問題 | ファイル | 内容 |
|---|---|---|---|
| Q-2 | ハードコーディング色残存 | WorkoutScreen.tsx:1001 | `color: '#fff'` → `c.onAccent` |
| Q-3 | 部位フィルタータブ タップ不足 | WorkoutScreen.tsx:703 | `height: 34` → `44` |
| Q-4 | カレンダー日付ボタン タップ不足 | ProgressScreen.tsx:755 | `height: 34` → `40` |

### P3（将来対応）

| ID | 問題 | 内容 |
|---|---|---|
| Q-5 | 全テーマ textTertiary 通常テキスト AA 未達 | opacity 0.38（実効 ~3.1-3.4:1）。12pt以下に使用する場合は要対応 |
| Q-6 | 白妙テーマ accent 通常テキスト AA 未達 | #A87A15 CR 3.40:1。ボタンラベル用途に限定して使用すること |
| Q-7 | SettingsScreen settingRow 固定高さ | `height: 48`（line 230）→ `minHeight: 48` に変更推奨（テキスト折返し対応）|

---

## 6. 総合評価

| チェック項目 | 結果 | 詳細 |
|---|---|---|
| TypeScript 型エラー | ✅ PASS | 0件 |
| ハードコーディング色 | ⚠️ 1件残存 | WorkoutScreen.tsx:1001 |
| textPrimary WCAG AA | ✅ 全テーマ合格 | CR 15:1以上 |
| textSecondary WCAG AA | ✅ 全テーマ合格 | CR 5:1以上 |
| textTertiary WCAG AA（大テキスト） | ⚠️ 青磁のみ不合格 | Q-1参照 |
| ボタン 44pt 統一 | ⚠️ 2箇所未達 | Q-3/Q-4参照 |
| テーマ型定義 | ✅ 完全 | 16テーマ全件 ThemeId / ThemeMeta 定義済み |
| 新規トークン（onAccent/scrim/tabBarBg/tabBarBorder） | ✅ 全テーマ実装 | 16テーマ全件追加済み |

**合計残存問題: P1×1件、P2×3件、P3×3件**
