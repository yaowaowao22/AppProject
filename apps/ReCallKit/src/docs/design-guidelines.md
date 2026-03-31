# ReCallKit ホワイトベーステーマ 設計指針

> バージョン: 1.0
> 作成日: 2026-04-01
> 対象: ReCallKit（Expo + React Native 復習アプリ）
> 参照スキル: ios-uiux (Layer 2a) + ma-no-kozo-design (Layer 1)

---

## 設計哲学の統合

### Ma no Kozo — DDP（Design Direction Package）

本設計指針は、以下の哲学テンションプロファイルに基づいている。

```
── Tension Profile ──────────────────────────
Structure [■■■□□□□□□□] Flow           : 3/10
Silence   [■■■■■■■□□□] Expression     : 7/10
Precision [■■■■□□□□□□] Imperfection   : 4/10
Universal [■■■□□□□□□□] Personal       : 3/10
Permanence[■■■■■■■□□□] Impermanence   : 3/10
─────────────────────────────────────────────
Dominant layers : KOKKAKU (骨格) + MA (間)
```

**哲学マニフェスト（Amber Quietude）**

記憶とは光の当たり方で変わる。ReCallは「思い出す行為」そのものをデザインする。
白という空白は終わりではなく、次の記憶が宿る器だ。Recall Amber の温かみは、
知識の灯台として画面の中に静かに灯り続ける。

骨格（KOKKAKU）が先に立つ——8ptグリッドという不可視の秩序が、コンテンツを
正確な場所へ導く。間（MA）が次にくる——余白は怠惰ではなく、集中の場所だ。
Müller-Brockmann の格子が構造を支え、Kenya Hara の空虚の哲学がその格子の
あいだに呼吸を吹き込む。

Recall Amber（#C47F17）は、装飾ではなく灯台だ。使いすぎず、消えもせず、
ユーザーが「次にすべきこと」を見つける一点として機能する。その周囲の白は
沈黙であり、強調である。

---

## 1. カラーパレット

iOS HIG のセマンティックカラー体系に準拠した、ライトモード専用トークン。

### 1.1 ベースカラー

| トークン | 値 | 用途 |
|---|---|---|
| `background` | `#FFFFFF` | 主背景（systemBackground） |
| `backgroundSecondary` | `#F2F2F7` | グループ背景・インセットリスト（secondarySystemBackground） |
| `backgroundGrouped` | `#F2F2F7` | グループ化テーブルビュー背景（systemGroupedBackground） |
| `navBarBackground` | `rgba(249,249,249,0.94)` | ナビゲーションバー背景（ブラーの基調） |

**ルール**: 背景色は必ずこの3段階を使い分ける。`#FFFFFF` と `#F2F2F7` の差は微小だが、コンテンツの「乗り物」を定義する重要な構造だ。

### 1.2 テキスト色

| トークン | 値 | 用途 | 対応 iOS セマンティック |
|---|---|---|---|
| `label` | `#000000` | 主テキスト・見出し | `.label` |
| `labelSecondary` | `rgba(60,60,67,0.60)` | サブテキスト・補足情報 | `.secondaryLabel` |
| `labelTertiary` | `rgba(60,60,67,0.30)` | プレースホルダー・無効状態 | `.tertiaryLabel` |

**コントラスト確認**（WCAG 2.2 AA）:
- `#000000` on `#FFFFFF`: 21:1 ✅
- `rgba(60,60,67,0.60)` ≈ `#636366` on `#FFFFFF`: 約5.9:1 ✅
- `rgba(60,60,67,0.30)` は装飾用のみ。情報伝達テキストには使用禁止。

### 1.3 アクセントカラー（Recall Amber）

| トークン | 値 | 用途 |
|---|---|---|
| `accent` | `#C47F17` | プライマリボタン・アクティブ状態・CTA |
| `filterBadgeBg` | `rgba(196,127,23,0.12)` | フィルターバッジ背景・選択チップ背景 |
| `filterBadgeText` | `#C47F17` | フィルターバッジテキスト |

**ルール**: Amber は「灯台」として機能する。1画面に使うアクセント要素は最大3箇所まで。多用すると緊急性・重要性の信号が失われる。

### 1.4 セカンダリ・システムカラー

| トークン | 値 | 用途 |
|---|---|---|
| `success` | `#30D158` | ストリーク・正解・完了 |
| `warning` | `#FF9F0A` | 復習遅延・要注意 |
| `error` | `#FF3B30` | 不正解・削除・エラー |
| `info` | `#0A84FF` | リンク・情報・ヒント |

これらは `SystemColors` から直接参照すること。ハードコード禁止。

### 1.5 セパレータ色

| トークン | 値 | 用途 |
|---|---|---|
| `separator` | `rgba(60,60,67,0.29)` | 行区切り・コンテナ境界（`.separator`） |
| `navBarBorder` | `rgba(60,60,67,0.12)` | ナビゲーションバー下線（薄め） |

**ルール**: `headerShadowVisible: false`（`sharedScreenOptions.tsx` 参照）を維持し、代わりに `navBarBorder` の薄い線のみを使う。iOS 的な「空気感のある区切り」を保つ。

---

## 2. ボタンデザイン

最小タップ領域 **44×44pt**（HIG Tier S 必須）を厳守。

### 2.1 プライマリボタン

```
背景色    : accent (#C47F17)
テキスト色 : #FFFFFF
角丸      : Radius.m = 12pt
高さ      : 50pt（44pt以上を確保しつつ余裕を持たせる）
水平パディング : Spacing.l = 24pt
影        : なし（フラットデザイン維持）
フォント   : TypeScale.headline（17pt Semibold）
```

**使用基準**: 画面内に1つのみ。「学習開始」「保存」「確認」など、次のステップに進む最も重要なアクション。

**無効状態**: `opacity: 0.4`、押下不可。

### 2.2 セカンダリボタン

```
背景色    : transparent
枠線     : 1.5pt solid accent (#C47F17)
テキスト色 : accent (#C47F17)
角丸      : Radius.m = 12pt
高さ      : 50pt
水平パディング : Spacing.l = 24pt
影        : なし
フォント   : TypeScale.headline（17pt Semibold）
```

**使用基準**: プライマリと並置する「キャンセル」「後でやる」など。重みをプライマリより下げる。

### 2.3 デストラクティブボタン

```
背景色    : error (#FF3B30) または transparent
テキスト色 : #FFFFFF（塗りつぶし時）/ error（アウトライン時）
角丸      : Radius.m = 12pt
高さ      : 50pt（デストラクティブはさらに大きく44pt必達）
```

**必須ルール**:
- 他のボタンから `Spacing.l (24pt)` 以上の間隔を確保する
- 確認アクション（Alert）を必ずはさむ（`.destructive` 1タップ実行禁止）
- アクションシートで提示する場合は iOS 標準 `.destructive` スタイルを使用

### 2.4 テキストボタン / アイコンボタン

```
最小タップ領域 : 44×44pt（hitSlop で補完）
アイコンボタンの見た目 : 36×36pt（HeaderHamburger 参照）
hitSlop    : { top:4, right:4, bottom:4, left:4 } で44pt確保
角丸       : Radius.s = 8pt
プレス背景  : rgba(142,142,147,0.12)
```

---

## 3. カード / コンテナ

### 3.1 標準カード

```
背景色       : card (#FFFFFF)
角丸         : Radius.m = 12pt
内部パディング : Spacing.m = 16pt（上下左右）
影           : CardShadow
  shadowColor   : #000000
  shadowOffset  : { width:0, height:1 }
  shadowOpacity : 0.08
  shadowRadius  : 3
  elevation     : 2（Android）
```

カードは `backgroundSecondary (#F2F2F7)` の上に置く。白 on 白にしない。白いカードを白い背景に乗せると影が浮き上がり、構造が明確になる。

### 3.2 強調カード（PR バッジ・ハイライト）

```
影           : CardShadowStrong
  shadowOffset  : { width:0, height:4 }
  shadowOpacity : 0.14
  shadowRadius  : 10
  elevation     : 5
```

画面内での使用は最大2枚まで。影の濃さで視覚的優先度を表現する。

### 3.3 グループ化リスト（設定・フォーム）

```
背景        : backgroundGrouped (#F2F2F7)
セル背景    : card (#FFFFFF)
角丸        : Radius.m = 12pt（グループの外側のみ）
セル内パディング : 水平 Spacing.m(16pt)、垂直 Spacing.s(8pt) ≥ 44pt 確保
区切り線    : separator（左端 Spacing.m=16pt インセット）
```

---

## 4. ナビゲーション

### 4.1 ヘッダー基本設計

```
headerStyle.backgroundColor : colors.background (#FFFFFF)
headerTitleStyle.color      : colors.label (#000000)
headerTintColor             : colors.accent (#C47F17)
headerShadowVisible         : false（下線は navBarBorder で代替）
```

`makeNavigatorOptions()` と `makeLargeTitleOptions()` をスタックごとに使い分ける（`sharedScreenOptions.tsx` 参照）。

### 4.2 HeaderHamburger の配置ルール

```
位置        : headerLeft（左端）
ボタンサイズ : 36×36pt（hitSlop で 44pt 確保）
アイコン    : Ionicons "menu"、サイズ 22pt
アイコン色  : labelSecondary（rgba(60,60,67,0.60)）
プレス背景  : rgba(142,142,147,0.12)
角丸        : Radius.s = 8pt
```

**配置ルール**:
- ハンバーガーは常に **headerLeft** に配置する。
- 戻るボタンが必要な画面（ネスト画面）では、React Navigation 標準の戻るボタンが headerLeft を自動置換する。ハンバーガーとの同一行共存は避ける。
- ルート画面 = ハンバーガー、サブ画面 = 戻るボタン（自動）という構造を維持する。

### 4.3 ドロワー（サイドバー）ナビゲーション

ハイブリッドモデルを採用している（ボトムタブバー廃止・ドロワー主体）。

```
ドロワー幅        : 280pt（SidebarLayout.width）
背景             : rgba(234,234,239,0.92)（和紙の透過感）
アクティブ背景    : rgba(196,127,23,0.12)（Amber 12%）
アクティブテキスト : accent (#C47F17)
非アクティブテキスト : rgba(60,60,67,0.60)
区切り線          : rgba(60,60,67,0.12)
アイテム高さ      : 48pt（44pt 以上を確保）
```

---

## 5. 余白・間隔（8pt グリッド）

`Spacing` トークンを必ず使用。マジックナンバー禁止。

| トークン | 値 | 典型的な使用場所 |
|---|---|---|
| `Spacing.xs` = 4pt | アイコンとラベルの間、バッジ内パディング |
| `Spacing.s` = 8pt | セル内垂直パディング、インライン要素間 |
| `Spacing.m` = 16pt | 標準左右マージン、カード内パディング、ヘッダー左右 |
| `Spacing.l` = 24pt | カード間間隔、セクション内余白、ボタン水平パディング |
| `Spacing.xl` = 32pt | セクション間間隔、大きな区切り |
| `Spacing.xxl` = 48pt | ページ上部余白、大セクション間 |

### 5.1 適用ガイド

**画面の左右マージン**: `Spacing.m = 16pt`（iOS HIG 標準）

**カード間の縦間隔**: `Spacing.l = 24pt`

**カード内コンテンツ間隔**:
- テキスト階層の間（タイトル→サブテキスト）: `Spacing.xs = 4pt`
- 論理グループ間（テキスト→ボタン）: `Spacing.m = 16pt`

**セクション間（スクロールビュー内）**: `Spacing.xl = 32pt`

**ボタン群の垂直間隔**: `Spacing.m = 16pt`（プライマリとセカンダリの間）

### 5.2 ボーダー半径ガイド

| トークン | 値 | 適用場所 |
|---|---|---|
| `Radius.xs` = 4pt | インラインバッジ、小チップ |
| `Radius.s` = 8pt | アイコンボタン、タグ背景 |
| `Radius.m` = 12pt | カード、プライマリボタン、入力フィールド |
| `Radius.l` = 16pt | ボトムシート、モーダルカード |
| `Radius.xl` = 20pt | ヒーローカード |
| `Radius.full` = 9999pt | タグチップ、ピル型バッジ |

---

## 6. タイポグラフィ

`TypeScale` を常に使用。ハードコードの `fontSize` 指定禁止。

### 6.1 タイプスケール一覧

| キー | fontSize | weight | 用途 |
|---|---|---|---|
| `largeTitle` | 34pt | Bold(700) | ホーム画面の大見出し（ほぼ未使用） |
| `title1` | 28pt | Bold(700) | セクション大見出し |
| `title2` | 22pt | Bold(700) | カード見出し・モーダルタイトル |
| `title3` | 20pt | Semibold(600) | インラインヘッダータイトル（`makeLargeTitleOptions` 参照） |
| `headline` | 17pt | Semibold(600) | ボタンテキスト・強調ラベル |
| `body` | 17pt | Regular(400) | 本文・カード本文 |
| `bodyJA` | 17pt / lh28pt | Regular(400) | 日本語本文（行間1.6倍） |
| `callout` | 16pt | Regular(400) | サブコンテンツ・コールアウト |
| `subheadline` | 15pt | Regular(400) | セカンダリ説明文 |
| `footnote` | 13pt | Regular(400) | 注釈・メタデータ |
| `caption1` | 12pt | Regular(400) | タイムスタンプ・補足ラベル |
| `caption2` | 11pt | Regular(400) | 最小補足情報・バッジ内テキスト |

### 6.2 組み合わせ指針

**カードの基本構成**:
```
title2 (22pt Bold)     — カードメインタイトル
bodyJA (17pt / lh28)   — 日本語本文
caption1 (12pt)        — タイムスタンプ・タグ
```

**ヘッダー**:
```
title3 (20pt Semibold)  — インラインヘッダータイトル（現実装）
```

**ボタン**:
```
headline (17pt Semibold) — プライマリ・セカンダリボタン
body (17pt Regular)      — テキストボタン
```

**日本語テキストの注意点**:
- 日本語コンテンツには `bodyJA`（行間 1.6 倍）を使う。`body` では行詰まりが読みにくい。
- 日本語見出しは `letterSpacing: 0` が基本（`bodyJA` 参照）。英語見出しの負のトラッキングは日本語には不自然。

### 6.3 アクセシビリティ

Dynamic Type に対応するため、`fontSize` は固定 pt を直接渡さず、`TypeScale` 経由で参照する。iOS 標準の `preferredFont(forTextStyle:)` に相当する動作を Expo / React Native の `Text` コンポーネントで維持すること。

---

## 7. コンポーネント参照マップ

| 要素 | 参照先ファイル | トークン |
|---|---|---|
| カラーシステム | `src/theme/colors.ts` | `LightColors`, `RecallAmber`, `SystemColors` |
| テーマ全体 | `src/theme/themes.ts` | `ColorScheme`, `ThemeEntry` |
| タイポグラフィ | `src/theme/typography.ts` | `TypeScale` |
| 余白・影 | `src/theme/spacing.ts` | `Spacing`, `Radius`, `CardShadow`, `CardShadowStrong` |
| ハンバーガー | `src/components/HeaderHamburger.tsx` | — |
| ナビ共通設定 | `src/navigation/sharedScreenOptions.tsx` | `makeNavigatorOptions`, `makeLargeTitleOptions` |

---

## 8. チェックリスト（実装時確認）

### UI 実装前
- [ ] タップターゲットが 44×44pt 以上か（hitSlop 含む）
- [ ] カラーはセマンティックトークン（`LightColors.*`）経由か
- [ ] フォントサイズは `TypeScale.*` 経由か
- [ ] 余白・角丸は `Spacing.*` / `Radius.*` か

### ホワイトテーマ固有
- [ ] 白背景 on 白背景になっていないか（カードは `backgroundSecondary` の上）
- [ ] アクセントカラー（Amber）は1画面3箇所以内か
- [ ] デストラクティブアクションは確認ダイアログ付きか
- [ ] 日本語本文に `bodyJA`（lh28）を使っているか

### アクセシビリティ
- [ ] `accessibilityLabel` を設定しているか（Pressable・アイコンボタン）
- [ ] コントラスト比: 通常テキスト 4.5:1 以上、大テキスト 3:1 以上
- [ ] 装飾アイコンに `accessibilityHidden={true}` を設定しているか

---

*本ドキュメントは iOS HIG（Apple Human Interface Guidelines）+ Ma no Kozo 設計哲学（Amber Quietude）を統合した ReCallKit 固有の設計指針である。*
