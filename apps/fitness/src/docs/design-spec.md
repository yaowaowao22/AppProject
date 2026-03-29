# TANREN デザイン仕様書

> 策定日: 2026-03-29
> 対象: サイドバー（Drawer）・月別レポート・RM計算機・設定画面

---

## 1. デザイン哲学 — 鍛鉄の間（Tantetsu no Ma）

### Tension Profile

```
Structure [■■■□□□□□□□] Flow           : 3/10
Silence   [■■□□□□□□□□] Expression     : 2/10
Precision [■■□□□□□□□□] Imperfection   : 2/10
Universal [■■■■□□□□□□] Personal       : 4/10
Permanence[■■■□□□□□□□] Impermanence   : 3/10
```

- **Dominant Layers**: MA (間) + KOE (声)
- **Master References**: 安藤忠雄 × 原研哉 × Dieter Rams × 侘び寂び

### マニフェスト

鍛冶場に足を踏み入れるとき、最初に感じるのは闇の重さである。目が慣れる前に、炉の奥で鉄が赤く脈打つのが見える。それは闇があるからこそ見える光であり、静寂があるからこそ聞こえる槌音である。

「鍛鉄の間」は、この関係性——圧倒的な沈黙の中に、意図された最小限の声だけが響く——をデジタルインターフェースの設計原理として昇華させる。安藤忠雄がコンクリートの壁にスリットを穿ち光にかたちを与えたように、このUIは暗い表面に**画面あたり3箇所**だけの灼熱点を配置し、ユーザーの視線に道筋を刻む。

### 美学的制約

| 制約 | ルール |
|------|--------|
| カラー | 闇(#111113)〜極暗グレー(#222224)の3段階 + アクセント#FF6200は**画面あたり3箇所以内** |
| タイポグラフィ | 数値は大きく太く揺るぎなく。ラベルは極小・低コントラスト。階層は4段階以内 |
| 空間 | 8pxグリッド厳守。密なデータ表示の後には必ず余白の「呼気」 |
| 素材 | 影ではなく面の明度差で奥行き表現。アナログ模倣は行わない |

---

## 2. デザイントークン（既存・厳守）

### カラー

| トークン | 値 | 用途 |
|----------|-----|------|
| `background` | `#111113` | 鍛冶場の闇。全画面の基底背景 |
| `surface1` | `#191919` | カード・サイドバー・セクション背景 |
| `surface2` | `#222224` | 入力フィールド・チャートバー・テーブルヘッダー |
| `textPrimary` | `#F5F5F7` | 主要テキスト・数値 |
| `textSecondary` | `rgba(245,245,247,0.45)` | 副次テキスト・単位・非アクティブ項目 |
| `textTertiary` | `rgba(245,245,247,0.22)` | ラベル・キャプション・プレースホルダー |
| `accent` | `#FF6200` | 灼熱オレンジ。**画面あたり3箇所以内** |
| `accentDim` | `rgba(255,98,0,0.12)` | アクセント背景（バッジ・ハイライト行） |
| `success` | `#2DB55D` | セット完了・達成表示 |
| `separator` | `rgba(255,255,255,0.07)` | 区切り線。闇を「微かに裂く」程度 |
| `error` | `#FF453A` | 破壊的アクション（データ削除等） |

### スペーシング（8px グリッド）

| トークン | 値 | 用途 |
|----------|-----|------|
| `xs` | 4 | 微小間隔 |
| `sm` | 8 | カード間隔 |
| `md` | 16 | コンテンツマージン・カード内パディング |
| `lg` | 24 | セクション間 |
| `xl` | 32 | 大セクション間 |
| `contentMargin` | 16 | 左右マージン |
| `cardPadding` | 14 | カード内パディング |
| `cardGap` | 8 | カード間隔 |
| `sectionGap` | 20 | セクション間隔 |

### タイポグラフィ

| トークン | サイズ | ウェイト | 用途 |
|----------|--------|----------|------|
| `heroNumber` | 58 | 800 (heavy) | 重量・レップ数のヒーロー表示 |
| `screenTitle` | 26 | 700 (bold) | 画面タイトル |
| `exerciseName` | 20 | 700 (bold) | 種目名 |
| `body` | 16 | 600 (semiBold) | リスト項目・ナビリンク |
| `bodySmall` | 15 | 500 (regular) | テーブル値・副次テキスト |
| `caption` | 12 | 600 (semiBold) | セクションラベル・月表示 |
| `captionSmall` | 10 | 500 (regular) | 単位・日付・テーブルヘッダー |

### 角丸

| トークン | 値 | 用途 |
|----------|-----|------|
| `card` | 13 | カード・セクションカード |
| `button` | 16 | 標準ボタン・入力フィールド |
| `btnCTA` | 18 | 主CTA（計算ボタン等） |
| `chip` | 20 | クイックスタートチップ |
| `badge` | 4 | PRバッジ |
| `sheet` | 18 | ボトムシート上端 |

### ボタン高さ

| トークン | 値 | 用途 |
|----------|-----|------|
| `primary` | 60 | 主CTA |
| `secondary` | 50 | 副アクション |
| `icon` | 44 | アイコンボタン（タップターゲット最小値） |
| `iconSmall` | 32 | 戻るボタン表示サイズ |

---

## 3. ナビゲーション構造

### アーキテクチャ: ハイブリッドモデル

```
┌─────────────────────────────────────┐
│  Bottom Tab Bar（プライマリ）         │
│  ホーム / トレーニング / 履歴 / 進捗   │
└─────────────────────────────────────┘
        +
┌─────────────────────────────────────┐
│  Drawer（セカンダリ）                 │
│  月別レポート / RM計算機 / 設定       │
└─────────────────────────────────────┘
```

- **Bottom Tab**: 4タブ維持（ホーム/トレーニング/履歴/進捗）。主要機能はタブに残す
- **Drawer**: 低頻度機能（月別レポート・RM計算機）と設定をサイドバーに配置
- **起動**: 各タブ画面のヘッダー左上にハンバーガーアイコン（`menu-outline`）

### React Navigation 構成

```
DrawerNavigator
├── TabNavigator (Bottom Tab)
│   ├── Home (HomeScreen)
│   ├── WorkoutStack
│   │   ├── ExerciseSelect
│   │   └── ActiveWorkout
│   ├── History (HistoryScreen)
│   └── Progress (ProgressScreen)
├── MonthlyReport (MonthlyReportScreen)
├── RMCalculator (RMCalculatorScreen)
└── Settings (SettingsScreen)
```

---

## 4. サイドバー（Drawer）

### コンポーネント階層

```
DrawerContent
├── SafeAreaView (edges: ['top', 'bottom'])
│   ├── MiniDashboard
│   │   ├── SectionLabel "今週"
│   │   └── StatsRow
│   │       ├── StatItem { value: workoutCount, label: "トレーニング" }
│   │       ├── StatItem { value: totalVolume,  label: "kg ボリューム" }
│   │       └── StatItem { value: streakDays,   label: "日連続" }
│   ├── Separator
│   ├── NavSection (primary)
│   │   ├── NavRow { icon: barbell,     label: "ホーム" }
│   │   ├── NavRow { icon: fitness,     label: "トレーニング" }
│   │   ├── NavRow { icon: time,        label: "履歴" }
│   │   └── NavRow { icon: stats-chart, label: "進捗" }
│   ├── Separator (thin, indent)
│   ├── NavSection (secondary)
│   │   ├── NavRow { icon: calendar,   label: "月別レポート" }
│   │   └── NavRow { icon: calculator, label: "RM計算機" }
│   ├── Spacer (flex: 1)
│   └── NavRow { icon: settings, label: "設定" }
```

### レイアウト仕様

| プロパティ | 値 | トークン |
|-----------|-----|---------|
| Drawer幅 | 画面幅の75% | — |
| 背景色 | `#191919` | `surface1` |
| オーバーレイ | `rgba(0,0,0,0.5)` | — |
| 開閉アニメーション | slide, duration 300ms | restrained |

### MiniDashboard

| プロパティ | 値 | トークン |
|-----------|-----|---------|
| パディング | 水平16, 垂直16 | `contentMargin`, `md` |
| 数値フォント | 24, weight 800 | `heavy` |
| 数値色 | `#F5F5F7` | `textPrimary` |
| ラベルフォント | 10, weight 500 | `captionSmall`, `regular` |
| ラベル色 | `rgba(245,245,247,0.22)` | `textTertiary` |
| 項目間仕切り | 1px, `separator` | — |

### NavRow

| プロパティ | 値 | トークン |
|-----------|-----|---------|
| 高さ | 48pt | ≥ `icon` (44) |
| パディング水平 | 16 | `contentMargin` |
| アイコンサイズ | 22pt | — |
| アイコン〜ラベル間隔 | 12 | — |
| ラベルフォント | 16, weight 600 | `body`, `semiBold` |
| **アクティブ状態** | アイコン: `accent`, ラベル: `textPrimary` | |
| **非アクティブ状態** | アイコン: `textSecondary`, ラベル: `textSecondary` | |

### Ionicons アイコンマッピング

| リンク | 非選択 | 選択 |
|--------|--------|------|
| ホーム | `barbell-outline` | `barbell` |
| トレーニング | `fitness-outline` | `fitness` |
| 履歴 | `time-outline` | `time` |
| 進捗 | `stats-chart-outline` | `stats-chart` |
| 月別レポート | `calendar-outline` | `calendar` |
| RM計算機 | `calculator-outline` | `calculator` |
| 設定 | `settings-outline` | `settings` |

### アクセント使用（1/3箇所）

| # | 箇所 | 色 |
|---|------|-----|
| 1 | アクティブなナビリンクのアイコン | `accent` (#FF6200) |

---

## 5. 月別レポート画面（MonthlyReportScreen）

### コンポーネント階層

```
SafeAreaView (bg: background, edges: ['top'])
├── Header
│   ├── BackButton (icon: chevron-back, 44×44pt)
│   └── Title "月別レポート" (screenTitle: 26, bold)
├── ScrollView
│   ├── MonthSelector
│   │   ├── PrevButton "‹" (44×44pt)
│   │   ├── MonthLabel "2026年3月" (caption: 12, semiBold)
│   │   └── NextButton "›" (44×44pt)
│   │
│   ├── SummaryCards (horizontal row, 3列)
│   │   ├── StatCard { num: "12", unit: "回", label: "ワークアウト" }
│   │   ├── StatCard { num: "45.2k", unit: "kg", label: "総ボリューム" }
│   │   └── StatCard { num: "52", unit: "分", label: "平均時間" }
│   │
│   ├── SectionLabel "部位別ボリューム"
│   ├── BodyPartChart (surface1 card)
│   │   ├── BarRow { part: "胸",   volume: 12400, ratio: 0.85 }
│   │   ├── BarRow { part: "背中", volume: 14600, ratio: 1.00 } ← 最大値
│   │   ├── BarRow { part: "脚",   volume: 11200, ratio: 0.77 }
│   │   ├── BarRow { part: "肩",   volume: 6800,  ratio: 0.47 }
│   │   ├── BarRow { part: "腕",   volume: 5200,  ratio: 0.36 }
│   │   └── BarRow { part: "体幹", volume: 3100,  ratio: 0.21 }
│   │
│   ├── SectionLabel "週別推移"
│   └── WeeklyChart (chartBox style — ProgressScreen準拠)
│       └── BarColumns (4〜5本, 月内の各週)
```

### MonthSelector

| プロパティ | 値 | トークン |
|-----------|-----|---------|
| コンテナ | flexDirection: row, justifyContent: space-between, alignItems: center | — |
| マージン水平 | 16 | `contentMargin` |
| マージン下 | 20 | `sectionGap` |
| NavButton | 44×44pt, center aligned | `icon` |
| NavButton文字 | 22, `textSecondary` | — |
| MonthLabel | 12, semiBold, `textSecondary` | `caption` |

### SummaryCards

| プロパティ | 値 | トークン |
|-----------|-----|---------|
| レイアウト | flexDirection: row, gap: 8 | `cardGap` |
| マージン水平 | 16 | `contentMargin` |
| カード | flex: 1, bg: `surface1`, borderRadius: 13, padding: 14 | `card`, `cardPadding` |
| 数値 | 30, weight 800, `textPrimary`, letterSpacing: -1.2 | `heavy` |
| 単位 | 11, `textSecondary` | — |
| ラベル | 10, weight 500, `textTertiary` | `captionSmall`, `regular` |

### BodyPartChart（部位別ボリューム分布）

| プロパティ | 値 | トークン |
|-----------|-----|---------|
| コンテナ | bg: `surface1`, borderRadius: 13, padding: 16 | `card`, `md` |
| マージン水平 | 16 | `contentMargin` |
| BarRow高さ | 36pt | — |
| 部位ラベル | body(16), semiBold, `textPrimary`, 幅48 | — |
| バー高さ | 8pt, borderRadius: 4 | `badge` |
| 通常バー色 | `surface2` (#222224) | — |
| **最大値バー色** | `accentDim` (rgba(255,98,0,0.12)) | **アクセント箇所1** |
| ボリューム値 | caption(12), `textSecondary`, 右寄せ | — |

### WeeklyChart（週別推移）

ProgressScreen の `chartBox` スタイルを完全踏襲:

| プロパティ | 値 | トークン |
|-----------|-----|---------|
| コンテナ | bg: `surface1`, borderRadius: 13, padding: 14 | `card`, `cardPadding` |
| チャート高さ | 96pt（バー領域） | — |
| 通常バー | `surface2` | — |
| **当週バー** | `accent` (#FF6200) | **アクセント箇所2** |
| バー上部値 | 8, `textTertiary`（当週: `textPrimary`, semiBold） | — |
| バーラベル | 9, `textTertiary`（当週: `textPrimary`, semiBold） | — |

### アクセント使用（2/3箇所）

| # | 箇所 | 色 |
|---|------|-----|
| 1 | 最大値の部位バー背景 | `accentDim` |
| 2 | 当週の週別チャートバー | `accent` |

---

## 6. RM計算機画面（RMCalculatorScreen）

### コンポーネント階層

```
SafeAreaView (bg: background, edges: ['top'])
├── Header
│   ├── BackButton (icon: chevron-back, 44×44pt)
│   └── Title "RM計算機" (screenTitle: 26, bold)
├── ScrollView
│   ├── InputCard (surface1 card)
│   │   ├── InputGroup "重量"
│   │   │   ├── Label "重量 (kg)" (caption, semiBold, textTertiary, UPPERCASE)
│   │   │   └── TextInput (numeric, surface2 bg)
│   │   ├── InputGroup "レップ数"  (marginTop: sectionGap)
│   │   │   ├── Label "レップ数" (caption, semiBold, textTertiary, UPPERCASE)
│   │   │   └── TextInput (numeric, surface2 bg)
│   │   └── CalculateButton "計算する" (accent CTA)
│   │
│   ├── SectionLabel "推定RM"
│   └── RMTable (surface1 card)
│       ├── TableHeader [RM, Epley, Brzycki, Lander]
│       ├── TableRow (1RM) ← ハイライト行
│       ├── TableRow (2RM)
│       ├── TableRow (3RM)
│       ├── ...
│       └── TableRow (10RM)
```

### InputCard

| プロパティ | 値 | トークン |
|-----------|-----|---------|
| コンテナ | bg: `surface1`, borderRadius: 13, padding: 16 | `card`, `md` |
| マージン水平 | 16 | `contentMargin` |
| InputGroup間隔 | 20 | `sectionGap` |

### TextInput

| プロパティ | 値 | トークン |
|-----------|-----|---------|
| 高さ | 50pt | `secondary` |
| 背景 | `surface2` (#222224) | — |
| 角丸 | 16 | `button` |
| パディング水平 | 16 | `md` |
| フォント | 16, semiBold, `textPrimary` | `body` |
| プレースホルダー色 | `textTertiary` | — |
| キーボード | `numeric` | — |

### CalculateButton

| プロパティ | 値 | トークン |
|-----------|-----|---------|
| 高さ | 60pt | `primary` |
| 背景 | `accent` (#FF6200) | **アクセント箇所1（唯一）** |
| 角丸 | 18 | `btnCTA` |
| テキスト | 17, bold, #FFFFFF | — |
| マージン上 | 24 | `lg` |

### RMTable

| プロパティ | 値 | トークン |
|-----------|-----|---------|
| コンテナ | bg: `surface1`, borderRadius: 13, overflow: hidden | `card` |
| マージン水平 | 16 | `contentMargin` |

**TableHeader:**

| プロパティ | 値 |
|-----------|-----|
| 高さ | 40pt |
| 背景 | `surface2` |
| セルテキスト | 10, semiBold, `textTertiary`, UPPERCASE |
| セル配置 | 1列目左寄せ, 2〜4列目右寄せ |

**TableRow:**

| プロパティ | 値 |
|-----------|-----|
| 高さ | 44pt（タップターゲット確保） |
| 区切り | `separator` 下線 |
| RM列 | 16, semiBold, `textPrimary` |
| 値列 | 15, regular, `textSecondary` |
| **1RM行** | 全列 `textPrimary`（ハイライト） |
| セル配置 | 1列目左寄せ, 2〜4列目右寄せ |
| パディング水平 | 16（各セル内） |

### RM計算式

```
Epley:   1RM = weight × (1 + reps / 30)
Brzycki: 1RM = weight × (36 / (37 - reps))
Lander:  1RM = (100 × weight) / (101.3 - 2.67123 × reps)

n-RM推定: nRM = 1RM × (1 - 0.025 × (n - 1))  ※簡易線形近似
```

### アクセント使用（1/3箇所）

| # | 箇所 | 色 |
|---|------|-----|
| 1 | 計算ボタン背景 | `accent` |

> RM計算機は「精密計測器」——アクセント使用を1箇所に抑え、数値の正確さに集中させる。

---

## 7. 設定画面（SettingsScreen）

### コンポーネント階層

```
SafeAreaView (bg: background, edges: ['top'])
├── Header
│   ├── BackButton (icon: chevron-back, 44×44pt)
│   └── Title "設定" (screenTitle: 26, bold)
├── ScrollView
│   ├── SectionHeader "単位"
│   ├── SectionCard
│   │   └── SettingsRow
│   │       ├── Label "重量単位"
│   │       └── SegmentedControl [kg | lb]
│   │
│   ├── SectionHeader "データ"
│   ├── SectionCard
│   │   ├── SettingsRow { label: "データエクスポート", chevron: true }
│   │   ├── Separator (indent 16)
│   │   └── SettingsRow { label: "すべてのデータを削除", destructive: true }
│   │
│   ├── SectionHeader "アプリ情報"
│   └── SectionCard
│       ├── SettingsRow { label: "バージョン", detail: "1.0.0" }
│       ├── Separator (indent 16)
│       └── SettingsRow { label: "ライセンス", chevron: true }
```

### SectionHeader

| プロパティ | 値 | トークン |
|-----------|-----|---------|
| フォント | 12, semiBold, UPPERCASE | `caption`, `semiBold` |
| 色 | `textTertiary` | — |
| レタースペーシング | 0.9 | — |
| パディング水平 | 16 | `contentMargin` |
| マージン上 | 20 | `sectionGap` |
| マージン下 | 10 | — |

### SectionCard

| プロパティ | 値 | トークン |
|-----------|-----|---------|
| 背景 | `surface1` (#191919) | — |
| 角丸 | 13 | `card` |
| マージン水平 | 16 | `contentMargin` |

### SettingsRow

| プロパティ | 値 | トークン |
|-----------|-----|---------|
| 高さ | 48pt | ≥ 44pt |
| パディング水平 | 16 | `md` |
| ラベル | 16, semiBold, `textPrimary` | `body` |
| 詳細値 | 15, regular, `textSecondary`, 右寄せ | `bodySmall` |
| シェブロン | "›", 20, `textTertiary` | — |
| **破壊的アクション** | ラベル色: `error` (#FF453A) | — |
| Separator | `separator`, indent左16 | — |

### SegmentedControl（kg/lb切替）

| プロパティ | 値 |
|-----------|-----|
| 高さ | 32pt |
| 背景 | `surface2` |
| 選択状態背景 | `textPrimary` (#F5F5F7) |
| 選択状態テキスト | `background` (#111113) |
| 非選択テキスト | `textSecondary` |
| フォント | 12, semiBold |
| 角丸 | 8 |
| セグメント幅 | 各60pt |

### アクセント使用: なし（0/3箇所）

> 設定画面は「鍛冶場の奥の間」——最も静かな空間。アクセント色は一切使用しない。

---

## 8. 共通コンポーネント仕様

### ScreenHeader（全画面共通）

```
Header
├── BackButton (icon: chevron-back-outline, 44×44pt)
├── Title (screenTitle: 26, bold, textPrimary, letterSpacing: -0.5)
└── HamburgerButton (icon: menu-outline, 44×44pt) ← Tab画面のみ
```

| プロパティ | 値 |
|-----------|-----|
| 高さ | 44pt + paddingVertical 8 = 60pt |
| 背景 | `background` (透明でも可) |
| パディング水平 | `contentMargin` (16) |
| BackButton表示サイズ | 32pt（タップ44pt） |
| BackButtonアイコン色 | `textSecondary` |

### SectionLabel（全画面共通）

| プロパティ | 値 | トークン |
|-----------|-----|---------|
| フォント | 11, semiBold, UPPERCASE | — |
| 色 | `textTertiary` | — |
| レタースペーシング | 0.9 | — |
| パディング水平 | 16 | `contentMargin` |
| マージン上 | 16 | `md` |
| マージン下 | 10 | — |

---

## 9. アクセント使用サマリー

| 画面 | 箇所1 | 箇所2 | 箇所3 |
|------|-------|-------|-------|
| **ホーム** (既存) | CTAボタン背景 | — | — |
| **進捗** (既存) | PRカード上端線 | 当週チャートバー | カレンダードット |
| **サイドバー** | アクティブNavアイコン | — | — |
| **月別レポート** | 最大部位バー(accentDim) | 当週チャートバー | — |
| **RM計算機** | 計算ボタン背景 | — | — |
| **設定** | なし | — | — |

---

## 10. アニメーション指針

| アクション | 方式 | 備考 |
|-----------|------|------|
| Drawer開閉 | slide, 300ms, easeOut | bounce: 0（restrained） |
| 画面遷移 | React Navigation標準push/pop | 右→左スライド |
| ボタン押下 | activeOpacity: 0.88 | ハプティクス: Impact(light) |
| 月切替 | crossfade, 200ms | 数値のみ更新 |
| RM計算結果表示 | fade-in, 200ms | テーブル行を順次表示しない（一括） |

> `animation_character: restrained` — すべてのアニメーションは控えめで、ユーザーの作業を妨げない。

---

## 11. アクセシビリティ要件

| 項目 | 基準 |
|------|------|
| タップターゲット | 最小44×44pt（Apple HIG Tier S） |
| コントラスト比 | 通常テキスト 4.5:1以上、大テキスト 3:1以上（WCAG 2.2 AA） |
| VoiceOver | 全インタラクティブ要素に `accessibilityLabel` 設定 |
| accessibilityRole | ボタン: `"button"`, リンク: `"link"`, 入力: `"adjustable"` |
| Reduce Motion | アニメーションを `.none` にフォールバック |

### 主要な accessibilityLabel 例

```
サイドバーNavRow:  "ホーム" / "月別レポートを開く"
MonthSelector:    "前の月" / "次の月" / "2026年3月"
CalculateButton:  "RMを計算する"
SettingsRow:      "データエクスポート" / "すべてのデータを削除（元に戻せません）"
SegmentedControl: "重量単位、現在キログラム"
```

---

## 12. 実装ファイル構成（予定）

```
src/
├── navigation/
│   └── RootNavigator.tsx     ← DrawerNavigator追加
├── components/
│   ├── DrawerContent.tsx     ← サイドバーカスタムコンテンツ
│   ├── ScreenHeader.tsx      ← 共通ヘッダー
│   └── SettingsRow.tsx       ← 設定行コンポーネント
├── screens/
│   ├── MonthlyReportScreen.tsx
│   ├── RMCalculatorScreen.tsx
│   └── SettingsScreen.tsx
└── utils/
    └── rmCalculator.ts       ← Epley/Brzycki/Lander計算ロジック
```
