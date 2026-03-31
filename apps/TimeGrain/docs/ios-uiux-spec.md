# TimeGrain iOS UI/UX Design Specification

> Generated: 2026-03-31
> Pipeline: Layer 2a（iOSプラットフォーム設計層）
> Input: DDP "Granular Silence（粒状の沈黙）" from Layer 1
> Platform: iOS (Expo/React Native implementation reference)

---

## 1. DDP → iOS変換サマリー

### Tension Profile変換

| 軸 | 値 | iOS設計パラメータ |
|---|---|---|
| Structure/Flow | 4 | 標準タブバー + グリッドレイアウト |
| Silence/Expression | 4 | ミニマルUI・余白重視・色数制限 |
| Precision/Imperfection | 3 | 厳密8ptグリッド・SF Pro標準 |
| Universal/Personal | 5 | ローカライズ対応・日本語幅考慮 |
| Permanence/Impermanence | 3 | 安定配色・控えめアニメーション |

### Layer Dominance

- **KOKYU（Primary）**: 砂粒落下のリズム、密度の波をアニメーション緩急で表現。Spring bounce 0.15の控えめな呼吸
- **MA（Secondary）**: 余白重視・コンテンツファースト。砂粒ビジュアライゼーションが画面の主役

---

## 2. ナビゲーション設計

### タブバー構成（3タブ）

```
┌─────────────────────────────────────┐
│                                     │
│         [コンテンツ領域]              │
│                                     │
├─────────┬───────────┬───────────────┤
│  ⏳     │  📊       │  ⚙️           │
│ Today   │ Summary   │ Settings      │
└─────────┴───────────┴───────────────┘
```

| タブ | SF Symbol | ラベル | 遷移先 |
|------|-----------|--------|--------|
| Today | `hourglass` (active: `hourglass.circle.fill`) | Today | ホーム画面 |
| Summary | `chart.bar` (active: `chart.bar.fill`) | サマリー | 週次サマリー画面 |
| Settings | `gearshape` (active: `gearshape.fill`) | 設定 | 設定画面 |

### ナビゲーション階層

```
Tab: Today
  └─ ホーム画面（砂粒ビジュアライゼーション + TimeScore）
       └─ [タップ] → 日次詳細画面（Navigation Push）
            └─ 24時間タイムライン + カテゴリ割当

Tab: Summary
  └─ 週次サマリー画面（チャート + インサイト）

Tab: Settings
  └─ 設定画面（カテゴリ管理 + 通知設定）
       ├─ [カテゴリ管理] → カテゴリ編集シート（Bottom Sheet .large）
       └─ [通知設定] → 通知設定画面（Navigation Push）
```

### ジェスチャー対応

| ジェスチャー | 動作 | 画面 |
|---|---|---|
| エッジスワイプ（左から右） | 前画面に戻る | 日次詳細→ホーム |
| 下スワイプ | シートを閉じる | カテゴリ編集シート |
| タブバータップ | タブ切替（クロスフェード） | 全画面 |
| 砂粒領域タップ | 日次詳細へ遷移 | ホーム画面 |

---

## 3. 画面設計仕様

### 3.1 ホーム画面（Today）

**役割**: アプリの顔。砂粒ビジュアライゼーションとTimeScoreを一画面で表示。「開いて3秒で今日の時間を把握できる」体験。

```
┌─────────────────────────────────┐
│ ← Safe Area (Dynamic Island)    │
├─────────────────────────────────┤
│                                 │
│  Today, 3月31日（月）     [73]  │  ← 日付 + TimeScoreバッジ
│                                 │
│  ┌─────────────────────────┐   │
│  │                         │   │
│  │    ╱╲                   │   │
│  │   ╱  ╲   ← 砂時計上半分 │   │
│  │  ╱ ●●●╲  （未来の粒）   │   │
│  │ ╱●●●●●●╲               │   │
│  │ ╲●●●●●●╱               │   │
│  │  ╲●●●●╱  ← 砂時計下半分 │   │
│  │   ╲●●╱   （経過した粒） │   │
│  │    ╲╱                   │   │
│  │                         │   │
│  └─────────────────────────┘   │
│                                 │
│  ■ 仕事 4h12m  ■ 休息 2h30m   │  ← カテゴリ凡例
│  ■ 移動 45m    ■ SNS 1h05m    │
│  ■ 未分類 3h28m               │
│                                 │
├─────────┬───────────┬───────────┤
│ ⏳ Today │ 📊 サマリー│ ⚙️ 設定  │
└─────────┴───────────┴───────────┘
```

**構成要素:**

| 要素 | 仕様 |
|---|---|
| **日付表示** | Large Title省略。Body Semibold 17pt。「Today, M月D日（曜）」形式 |
| **TimeScoreバッジ** | 右上配置。砂金色（#C9A96E）円形バッジ。スコア数値はSF Pro Display Bold 24pt |
| **砂粒エリア** | 画面中央。高さは画面の55〜60%を占有。1440粒のグリッド配置。砂時計シルエットをマスクとして適用 |
| **カテゴリ凡例** | 画面下部。2列グリッド。色ドット(8pt) + カテゴリ名 + 累積時間。Caption1 11pt |
| **余白（MA）** | 砂粒エリアの上下に最低24ptの余白。凡例との間に32pt |

**砂粒UI仕様:**

| パラメータ | 値 |
|---|---|
| 粒の総数 | 1440（1日=1440分） |
| 粒のサイズ | 5×5pt（画面幅に応じて動的調整。最小4pt、最大6pt） |
| 粒の間隔 | 1pt |
| 粒の角丸 | 1pt（微小な丸み。完全な正方形でも完全な円でもない） |
| グリッド列数 | 36列（40行 × 36列 = 1440） |
| 砂時計マスク | ベジエ曲線による砂時計シルエット。上半分=未来、下半分=過去。中央くびれ幅=グリッド幅の30% |
| 色分け | カテゴリ別に着色。時間軸順に上から下へ配置 |
| 未来の粒 | 暗い背景色（#1A1F2E）で「まだ来ていない時間」を表現 |
| TimeScore 80+の日 | 粒全体に微かな砂金色のグロー効果 |

**インタラクション:**

| 操作 | 動作 |
|---|---|
| 砂粒エリアタップ | 日次詳細画面へNavigation Push |
| TimeScoreバッジタップ | スコア内訳をBottom Sheet(.medium)で表示 |
| アプリ起動時 | 直近の粒が落下するアニメーション（0.6s、最新5粒のみ） |

---

### 3.2 週次サマリー画面

**役割**: 7日間の俯瞰。TimeScoreの推移とカテゴリ別時間配分を視覚化。

```
┌─────────────────────────────────┐
│ ← Safe Area                     │
├─────────────────────────────────┤
│                                 │
│  週次サマリー                    │  ← Title3 20pt Semibold
│  3/25（月）〜 3/31（月）         │  ← Caption1 11pt secondaryLabel
│                                 │
│  ┌─────────────────────────┐   │
│  │  TimeScore 推移          │   │
│  │                         │   │
│  │  80─         ●          │   │  ← 折れ線グラフ
│  │  60─  ●  ●     ●  ●    │   │     砂金色ライン
│  │  40─     ●              │   │
│  │     月 火 水 木 金 土 日  │   │
│  │                         │   │
│  │  週平均: 67   ▲+4       │   │  ← 砂金色で強調
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │  カテゴリ別（今週）       │   │
│  │                         │   │
│  │  仕事    ████████░░ 32h │   │  ← 水平棒グラフ
│  │  休息    █████░░░░░ 18h │   │     各カテゴリ色
│  │  移動    ██░░░░░░░░  6h │   │
│  │  SNS     ███░░░░░░░  8h │   │
│  │  未分類  ████░░░░░░ 12h │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │  💡 今週のインサイト       │   │  ← インサイトカード
│  │                         │   │
│  │  先週より深い仕事が       │   │
│  │  2.3時間増えました。      │   │
│  │  水曜のスコアが最高でした。│   │
│  └─────────────────────────┘   │
│                                 │
├─────────┬───────────┬───────────┤
│ ⏳ Today │ 📊 サマリー│ ⚙️ 設定  │
└─────────┴───────────┴───────────┘
```

**構成要素:**

| 要素 | 仕様 |
|---|---|
| **TimeScoreチャート** | カード内。折れ線グラフ。砂金色(#C9A96E)ライン。ドット直径8pt。背景はカード色 |
| **カテゴリ別棒グラフ** | 水平棒グラフ。各カテゴリ色使用。棒高さ24pt。ラベル右寄せで時間数表示 |
| **インサイトカード** | 自然言語テキスト。Body 17pt。左に💡アイコン（SF Symbol: `lightbulb`）。背景は`secondarySystemGroupedBackground`相当 |
| **週平均スコア** | チャート下部。Headline 17pt Semibold 砂金色。前週比の矢印付き |

**スクロール**: 縦スクロール。チャート→棒グラフ→インサイトの順。各セクション間32pt。

---

### 3.3 日次詳細画面

**役割**: 1日の時間をタイムラインで詳細表示。未分類時間のカテゴリ割当。

```
┌─────────────────────────────────┐
│ ← 戻る    3月31日（月）    [73] │  ← ナビゲーションバー
├─────────────────────────────────┤
│                                 │
│  00:00 ┃■■■■■■■■■■■■│ 睡眠    │  ← 24時間タイムライン
│  06:00 ┃■■■■■■■■■■■■│ 睡眠    │
│  07:00 ┃▓▓▓▓▓▓▓▓▓▓▓▓│ 移動    │
│  07:30 ┃████████████│ 仕事    │
│  09:00 ┃████████████│ 仕事    │
│  10:30 ┃░░░░░░░░░░░░│ 未分類  │  ← タップで割当
│  11:00 ┃████████████│ 仕事    │
│  12:00 ┃■■■■■■■■■■■■│ 休息    │
│  13:00 ┃████████████│ 仕事    │
│  15:00 ┃▒▒▒▒▒▒▒▒▒▒▒▒│ SNS     │
│  ...                            │
│                                 │
│  ┌─────────────────────────┐   │
│  │  未分類: 3h28m          │   │
│  │  タップしてカテゴリ割当   │   │  ← CTA
│  └─────────────────────────┘   │
│                                 │
├─────────┬───────────┬───────────┤
│ ⏳ Today │ 📊 サマリー│ ⚙️ 設定  │
└─────────┴───────────┴───────────┘
```

**構成要素:**

| 要素 | 仕様 |
|---|---|
| **タイムラインバー** | 左に時刻（Caption1 11pt）、中央にカテゴリ色バー（高さ=時間比例。最小16pt）、右にカテゴリ名 |
| **未分類ブロック** | グレー(#95A5A6)で表示。タップでカテゴリ選択Bottom Sheet表示 |
| **カテゴリ割当UI** | Bottom Sheet(.medium)。5カテゴリのボタン（44×44pt以上）を横一列で表示 |
| **未分類サマリー** | 画面下部固定。未分類の合計時間+CTAテキスト |

**インタラクション:**

| 操作 | 動作 |
|---|---|
| 未分類ブロックタップ | カテゴリ選択Bottom Sheet表示 |
| カテゴリボタンタップ | 即座にカテゴリ割当（楽観的UI更新）。Spring(0.3, bounce:0.15) |
| エッジスワイプ | ホーム画面に戻る |

---

### 3.4 設定画面

**役割**: 最小限の設定。iOS Settings形式を踏襲。

```
┌─────────────────────────────────┐
│ ← Safe Area                     │
├─────────────────────────────────┤
│                                 │
│  設定                            │  ← Large Title 34pt
│                                 │
│  カテゴリ管理                    │  ← セクションヘッダー
│  ┌─────────────────────────┐   │
│  │ ■ 仕事（深い集中）   ＞  │   │  ← Grouped List Row
│  │ ■ 休息・睡眠        ＞  │   │
│  │ ■ 移動             ＞  │   │
│  │ ■ SNS・娯楽        ＞  │   │
│  │ ■ 未分類           ＞  │   │
│  └─────────────────────────┘   │
│                                 │
│  通知                           │  ← セクションヘッダー
│  ┌─────────────────────────┐   │
│  │ 週次サマリー通知  [●───] │   │  ← Toggle
│  │ 通知時刻     日曜 20:00 │   │
│  └─────────────────────────┘   │
│                                 │
│  カレンダー                      │  ← セクションヘッダー
│  ┌─────────────────────────┐   │
│  │ カレンダー権限    許可済 │   │
│  │ 同期カレンダー   3件選択 │   │
│  └─────────────────────────┘   │
│                                 │
│  アプリについて                   │
│  ┌─────────────────────────┐   │
│  │ バージョン        1.0.0 │   │
│  │ プライバシーポリシー  ＞  │   │
│  └─────────────────────────┘   │
│                                 │
├─────────┬───────────┬───────────┤
│ ⏳ Today │ 📊 サマリー│ ⚙️ 設定  │
└─────────┴───────────┴───────────┘
```

**設定画面はiOS Grouped List Style を厳密に踏襲。** frontend-designの演出適用禁止領域。

**カテゴリ編集シート（タップで表示）:**

| 要素 | 仕様 |
|---|---|
| シートサイズ | Bottom Sheet (.large) |
| カテゴリ名編集 | TextField。30文字以内 |
| 色選択 | プリセット8色の丸ボタン（選択状態=チェックマーク） |
| アイコン選択 | SF Symbols 12個のグリッド。44×44pt各 |
| キーワード設定 | カレンダー予定名のマッチングキーワード。テキスト入力+チップ表示 |
| 保存 | 右上「保存」ボタン。楽観的UI更新 |

---

## 4. カラーシステム

### カラーパレット

| 用途 | Light Mode | Dark Mode（デフォルト） | セマンティック名 |
|---|---|---|---|
| **背景（Primary）** | #FFFFFF | **#0D1117** | `.systemBackground` override |
| **背景（Secondary）** | #F2F2F7 | **#161B22** | `.secondarySystemBackground` override |
| **背景（Tertiary）** | #E5E5EA | **#1C2128** | `.tertiarySystemBackground` override |
| **テキスト（Primary）** | #000000 | **#E6EDF3** | `.label` override |
| **テキスト（Secondary）** | #3C3C43/60% | **#8B949E** | `.secondaryLabel` override |
| **テキスト（Tertiary）** | #3C3C43/30% | **#484F58** | `.tertiaryLabel` override |

### カテゴリカラー

| カテゴリ | HEX | RGB | 用途 | コントラスト比（vs #0D1117） |
|---|---|---|---|---|
| **仕事（深い集中）** | #1E3A5F | 30, 58, 95 | 砂粒・チャート・凡例 | 2.1:1（粒のみ。テキストには不使用） |
| **仕事（テキスト用）** | #4A8FD4 | 74, 143, 212 | ラベル・テキスト表示 | 5.2:1 ✅ |
| **休息** | #2D7D46 | 45, 125, 70 | 砂粒・チャート・凡例 | 3.2:1（粒のみ） |
| **休息（テキスト用）** | #4CAF6E | 76, 175, 110 | ラベル・テキスト表示 | 5.1:1 ✅ |
| **移動** | #E07B39 | 224, 123, 57 | 砂粒・チャート・凡例 | 5.8:1 ✅ |
| **SNS/娯楽** | #C0392B | 192, 57, 43 | 砂粒・チャート・凡例 | 3.1:1（粒のみ） |
| **SNS（テキスト用）** | #E06050 | 224, 96, 80 | ラベル・テキスト表示 | 4.7:1 ✅ |
| **未分類** | #95A5A6 | 149, 165, 166 | 砂粒・チャート・凡例 | 6.1:1 ✅ |
| **アクセント（砂金色）** | #C9A96E | 201, 169, 110 | TimeScore・ハイライト | 6.4:1 ✅ |

> 砂粒は5×5ptの小要素であり、テキストではないため WCAG のテキストコントラスト比は直接適用されない。ただし認識性のため、粒同士の色差は十分に確保。テキスト表示が必要な場面（凡例ラベル等）では明度を調整したテキスト用カラーを使用。

### 特殊カラー

| 用途 | HEX | 説明 |
|---|---|---|
| 未来の粒（未到来時間） | #1A1F2E | 背景より僅かに明るい。「まだ来ていない」を表現 |
| TimeScore 80+ グロー | #C9A96E / 20% opacity | 砂金色の微かなグロー。粒全体にオーバーレイ |
| カード背景 | #161B22 | secondarySystemBackground相当 |
| セパレーター | #21262D | 極めて控えめなライン |

---

## 5. タイポグラフィ

### フォントシステム

| スタイル | フォント | サイズ | ウェイト | 用途 |
|---|---|---|---|---|
| Large Title | SF Pro Display | 34pt | Bold | 設定画面タイトルのみ |
| Title3 | SF Pro Display | 20pt | Semibold | セクション見出し（「週次サマリー」等） |
| Headline | SF Pro Text | 17pt | Semibold | カード内見出し、日付表示 |
| Body | SF Pro Text | 17pt | Regular | インサイトテキスト、設定項目ラベル |
| Callout | SF Pro Text | 16pt | Regular | カテゴリ名、時間表示 |
| Caption1 | SF Pro Text | 12pt | Regular | 副情報（日付範囲、チャート軸ラベル） |
| Caption2 | SF Pro Text | 11pt | Regular | 最小テキスト（フッター注釈） |

### 数値表現（特別仕様）

| 用途 | フォント | サイズ | ウェイト | 色 |
|---|---|---|---|---|
| **TimeScore（ホーム）** | SF Pro Display | 28pt | Bold | #C9A96E（砂金色） |
| **TimeScore（バッジ内）** | SF Pro Display | 24pt | Bold | #C9A96E |
| **TimeScore（チャート）** | SF Pro Display | 20pt | Semibold | #C9A96E |
| **時間数値** | SF Pro Text | 16pt | Medium | .label |
| **チャート軸数値** | SF Pro Text | 11pt | Regular | .secondaryLabel |

### Dynamic Type対応

すべてのテキスト要素は Dynamic Type 対応必須。固定ptサイズ指定禁止。レイアウトはテキストサイズの拡大に追従して伸縮。

---

## 6. アニメーション設計

### KOKYU（呼吸）の表現

DDPのPrimary Layer「KOKYU」に基づき、アニメーションは「呼吸」のリズムを表現する。ただしPlatform Hints `animation_character: restrained` に従い、控えめに設計。

| アニメーション | Duration | Spring | 用途 |
|---|---|---|---|
| **砂粒落下** | 0.6s | duration: 0.6, bounce: 0.1 | 新しい粒が砂時計上半分から下半分へ。起動時に直近5粒のみ再生 |
| **画面遷移（Push）** | 0.35s | duration: 0.35, bounce: 0.0 | Navigation Push。iOS標準に準拠 |
| **タブ切替** | 0.25s | crossFade | クロスフェード。iOS標準 |
| **カテゴリ割当** | 0.3s | duration: 0.3, bounce: 0.15 | 楽観的UI更新。グレー粒→カテゴリ色に変化 |
| **TimeScoreカウントアップ** | 1.2s | ease-out | 起動時にスコアが0→現在値にカウントアップ。砂金色 |
| **シート表示** | 0.3s | duration: 0.3, bounce: 0.0 | Bottom Sheet表示。iOS標準 |
| **スケルトンシマー** | 1.5s loop | linear | コンテンツ読み込み中。左→右のシマー |

### Reduce Motion対応（必須）

```swift
@Environment(\.accessibilityReduceMotion) var reduceMotion

// 砂粒落下
withAnimation(reduceMotion ? .none : .spring(duration: 0.6, bounce: 0.1)) {
    grainPosition = .bottom
}

// TimeScoreカウントアップ → Reduce Motion時は即時表示
if reduceMotion {
    displayedScore = currentScore
} else {
    // 1.2秒かけてカウントアップ
}
```

### 砂粒落下の詳細仕様

- 起動時: 直近5分間の粒のみ落下アニメーション再生（0.6s）。それ以前の粒は配置済み状態で表示
- リアルタイム: 1分経過ごとに1粒が落下。控えめな動き
- 一括更新: カレンダー同期後に複数粒が更新される場合、左上→右下の波状に0.3s間隔で順次着色（密度の波=KOKYU表現）

---

## 7. スペーシング・レイアウト

### 8ptグリッドシステム

| 要素 | 値 | 用途 |
|---|---|---|
| 画面左右マージン | 16pt | 全画面共通 |
| セクション間 | 32pt | 画面内のセクション区切り |
| カード内パディング | 16pt | カード内部の余白 |
| カード角丸 | 12pt | iOS標準下限値 |
| カード間 | 16pt | 縦方向のカード間隔 |
| リスト行高さ | 44pt | 最小タップターゲット保証 |
| タブバー高さ | 49pt + Safe Area | iOS標準 |
| ナビゲーションバー高さ | 44pt + Safe Area | iOS標準 |

### Safe Area Insets

| 領域 | サイズ | 対応 |
|---|---|---|
| Dynamic Island | 54pt top | コンテンツ配置禁止 |
| タブバー | 83pt bottom（Home Indicator含む） | タブバー+Home Indicator |
| ナビゲーションバー | 44pt（Large Title時: 96pt） | 上部ナビゲーション領域 |

### MA（間）の実装

DDPのSecondary Layer「MA」に基づき、以下の余白設計を特に重視:

| 余白箇所 | 値 | 意図 |
|---|---|---|
| 砂粒エリア上部 | 24pt | 日付表示との呼吸 |
| 砂粒エリア下部 | 32pt | 凡例との分離。砂粒が「浮いている」感覚 |
| インサイトカード周囲 | 24pt | 情報の独立性。読み手に一拍の間を与える |
| 設定セクション間 | 32pt | iOS Grouped Listの標準余白を尊重 |

---

## 8. コンポーネント仕様

### TimeScoreバッジ

```
┌──────────┐
│          │
│    73    │  ← SF Pro Display Bold 24pt, #C9A96E
│          │
└──────────┘
```

- 形状: 円形、直径56pt
- 背景: #C9A96E / 15% opacity
- ボーダー: #C9A96E / 30% opacity, 1pt
- テキスト: SF Pro Display Bold 24pt, #C9A96E
- 配置: ホーム画面右上、ナビゲーションバー内
- タップ: スコア内訳Bottom Sheet表示

### インサイトカード

- 背景: secondarySystemGroupedBackground (#161B22)
- 角丸: 12pt
- パディング: 16pt
- 左アイコン: SF Symbol `lightbulb` 20pt, #C9A96E
- テキスト: Body 17pt, .label
- 最大3行。それ以上は「もっと見る」で展開

### カテゴリ凡例

- レイアウト: 2列グリッド
- 色ドット: 8pt円形、カテゴリ色
- テキスト: Callout 16pt, .label
- 時間: Callout 16pt, .secondaryLabel
- 行高さ: 32pt
- 行間: 8pt

### カテゴリ選択ボタン（日次詳細）

- 形状: 角丸矩形（12pt角丸）
- サイズ: 64×64pt（44pt最小タップターゲットを超過）
- 構成: 上にカテゴリ色ドット(16pt) + 下にカテゴリ名(Caption1 11pt)
- 横一列5個。画面幅に均等配置
- 選択時: Spring(0.3, bounce:0.15)でスケール1.1x → 1.0x

---

## 9. アクセシビリティ

### WCAG 2.2 AA準拠

| 要件 | 対応 |
|---|---|
| テキストコントラスト比 | 通常テキスト 4.5:1以上、大テキスト 3:1以上 |
| VoiceOver | 全インタラクティブ要素にaccessibilityLabel設定 |
| Dynamic Type | 全テキスト要素が対応。レイアウト追従 |
| Reduce Motion | 砂粒アニメーション・カウントアップの無効化 |
| 色のみに依存しない | カテゴリはテキストラベル併記。チャートにはパターン併用可能 |

### VoiceOver ラベル設計

| 要素 | accessibilityLabel | accessibilityHint |
|---|---|---|
| TimeScoreバッジ | 「タイムスコア 73点」 | 「ダブルタップでスコアの内訳を表示します」 |
| 砂粒エリア | 「今日の時間の使い方。仕事4時間12分、休息2時間30分...」 | 「ダブルタップで詳細を表示します」 |
| カテゴリ凡例 | 「仕事、4時間12分」 | — |
| 未分類ブロック | 「未分類、10時30分から11時、30分間」 | 「ダブルタップでカテゴリを割り当てます」 |

---

## 10. パーミッション・オンボーディング

### カレンダー権限（Just-in-Time）

```
初回起動フロー:
1. ホーム画面表示（空状態: 砂時計シルエットのみ）
2. 画面中央に「カレンダーを連携する」ボタン表示
3. タップ → Pre-prompt画面
   「カレンダーの予定から、あなたの時間の使い方を自動で分析します。
    データはすべてこのデバイス内に保存され、外部に送信されることはありません。」
4. iOS標準パーミッションダイアログ表示
5. 許可 → カレンダー取得 → 砂粒生成アニメーション（KOKYU: 波状に着色）
6. 拒否 → 手動入力モード案内
```

### 空状態（Empty State）

- イラスト: 砂時計シルエット（200×200px内、#1A1F2E）。frontend_design_zone対象
- テキスト: 「カレンダーを連携して、時間を可視化しましょう」Body 17pt
- CTAボタン: 「カレンダーを連携する」. primaryAction style. 砂金色背景

---

## 11. ウィジェット設計

### ホーム画面ウィジェット

| サイズ | 表示内容 |
|---|---|
| `.systemSmall` (158×158pt) | 今日の砂粒UI（簡略版: 20×20グリッド=400粒に間引き）+ TimeScore |
| `.systemMedium` (338×158pt) | 砂粒UI + カテゴリ凡例上位3つ + TimeScore |

### ロック画面ウィジェット

| サイズ | 表示内容 |
|---|---|
| `.accessoryCircular` | TimeScore数値のみ（砂金色） |
| `.accessoryRectangular` | TimeScore + 「仕事 4h12m」最大カテゴリ |

### ウィジェットカラー

- iOS 18アクセントウィジェット対応: `@Environment(\.widgetRenderingMode)` で分岐
- `vibrant` モード: モノクロ+システムアクセントカラー
- `fullColor` モード: カスタムカラーパレット使用

---

## 12. iOS Design Spec YAML

```yaml
ios_design_spec:
  app_name: "TimeGrain"
  philosophy: "Granular Silence（粒状の沈黙）"
  ddp_tension:
    structure_flow: 4
    silence_expression: 4
    precision_imperfection: 3
    universal_personal: 5
    permanence_impermanence: 3
  ddp_layers:
    primary: KOKYU
    secondary: MA

  navigation:
    type: tab_bar
    tab_count: 3
    tabs:
      - icon: "hourglass"
        icon_active: "hourglass.circle.fill"
        label: "Today"
      - icon: "chart.bar"
        icon_active: "chart.bar.fill"
        label: "サマリー"
      - icon: "gearshape"
        icon_active: "gearshape.fill"
        label: "設定"
    drill_down:
      - from: "Today"
        to: "日次詳細"
        transition: "navigation_push"
    sheets:
      - trigger: "カテゴリ編集"
        type: "bottom_sheet"
        detent: ".large"
      - trigger: "TimeScore内訳"
        type: "bottom_sheet"
        detent: ".medium"
      - trigger: "カテゴリ割当"
        type: "bottom_sheet"
        detent: ".medium"

  screens:
    - name: "ホーム（Today）"
      role: "砂粒ビジュアライゼーション + TimeScore"
      primary_content: "砂粒グリッド（1440粒。砂時計シルエットマスク）"
      secondary_content: "カテゴリ凡例（2列グリッド）"
      key_interaction: "砂粒タップ → 日次詳細"
    - name: "週次サマリー"
      role: "7日間の俯瞰"
      primary_content: "TimeScore折れ線グラフ + カテゴリ別棒グラフ"
      secondary_content: "インサイトカード"
      key_interaction: "スクロール閲覧"
    - name: "日次詳細"
      role: "1日のタイムライン + カテゴリ割当"
      primary_content: "24時間タイムラインバー"
      secondary_content: "未分類サマリー + カテゴリ割当UI"
      key_interaction: "未分類タップ → カテゴリ選択"
    - name: "設定"
      role: "最小限の設定"
      primary_content: "iOS Grouped List"
      sections: ["カテゴリ管理", "通知", "カレンダー", "アプリについて"]
      key_interaction: "カテゴリ編集 → Bottom Sheet"

  components:
    cards:
      corner_radius: "12pt"
      padding: "16pt"
      style: "elevated"
      background: "#161B22"
    buttons:
      primary_style: "砂金色背景 + 暗色テキスト"
      min_target: "44x44pt"
      destructive: "systemRed + 確認ステップ"
    time_score_badge:
      shape: "circle"
      diameter: "56pt"
      background: "#C9A96E/15%"
      border: "#C9A96E/30%, 1pt"
      text: "SF Pro Display Bold 24pt #C9A96E"
    grain:
      size: "5x5pt (dynamic 4-6pt)"
      gap: "1pt"
      corner_radius: "1pt"
      grid_columns: 36
      grid_rows: 40
      mask: "hourglass bezier curve"

  colors:
    background_primary: "#0D1117"
    background_secondary: "#161B22"
    background_tertiary: "#1C2128"
    text_primary: "#E6EDF3"
    text_secondary: "#8B949E"
    text_tertiary: "#484F58"
    separator: "#21262D"
    accent: "#C9A96E"
    category_work: "#1E3A5F"
    category_work_text: "#4A8FD4"
    category_rest: "#2D7D46"
    category_rest_text: "#4CAF6E"
    category_travel: "#E07B39"
    category_sns: "#C0392B"
    category_sns_text: "#E06050"
    category_unclassified: "#95A5A6"
    future_grain: "#1A1F2E"
    glow_80plus: "#C9A96E/20%"
    dark_mode: "default (primary design)"

  typography:
    system: "SF_Pro"
    scale:
      large_title: "34pt Bold"
      title3: "20pt Semibold"
      headline: "17pt Semibold"
      body: "17pt Regular"
      callout: "16pt Regular"
      caption1: "12pt Regular"
      caption2: "11pt Regular"
    special:
      time_score_home: "SF Pro Display 28pt Bold #C9A96E"
      time_score_badge: "SF Pro Display 24pt Bold #C9A96E"
      time_score_chart: "SF Pro Display 20pt Semibold #C9A96E"
      time_values: "SF Pro Text 16pt Medium .label"
    dynamic_type: required

  animation:
    grain_fall:
      duration: "0.6s"
      spring: "duration: 0.6, bounce: 0.1"
      scope: "起動時直近5粒のみ"
    screen_push:
      duration: "0.35s"
      spring: "duration: 0.35, bounce: 0.0"
    tab_switch:
      duration: "0.25s"
      type: "crossFade"
    category_assign:
      duration: "0.3s"
      spring: "duration: 0.3, bounce: 0.15"
    time_score_count:
      duration: "1.2s"
      type: "ease-out"
    skeleton_shimmer:
      duration: "1.5s"
      type: "linear loop"
    reduce_motion: required

  accessibility:
    wcag_version: "2.2"
    level: "AA"
    voiceover: required
    dynamic_type: required
    reduce_motion: required
    contrast_normal: "4.5:1"
    contrast_large: "3:1"

  spacing:
    screen_margin: "16pt"
    section_gap: "32pt"
    card_padding: "16pt"
    card_gap: "16pt"
    card_corner_radius: "12pt"
    list_row_height: "44pt"
    tab_bar_height: "49pt + safe_area"
    nav_bar_height: "44pt + safe_area"

  frontend_design_zones:
    - zone: "splash_screen"
      constraints: "全画面自由。3秒以内に遷移"
    - zone: "onboarding_hero"
      constraints: "ページ上部50%まで。ナビゲーション要素に干渉しない"
    - zone: "empty_state_illustration"
      constraints: "200x200px領域内。装飾的要素のみ。砂時計シルエット"
    - zone: "marketing_cards"
      constraints: "カード内部のみ。44ptタップターゲット維持"
    - zone: "background_texture"
      constraints: "コンテンツ可読性を損なわない範囲"

  prohibited_zones:
    - "タブバー"
    - "ナビゲーションバー/バックボタン"
    - "フォーム入力/テキストフィールド"
    - "システムシート/アラート"
    - "設定画面"
    - "検索UI"
```

---

## 13. App Store審査チェックリスト

### HIG準拠
- [x] 標準タブバー（3タブ、ラベル付き）
- [x] タップ領域 44×44pt以上
- [x] バックボタン常時利用可能（日次詳細画面）
- [x] Safe Area Insets準拠

### アクセシビリティ
- [x] VoiceOver対応（全要素にラベル設計済み）
- [x] Dynamic Type対応
- [x] コントラスト比: テキスト用カラーで4.5:1以上確保
- [x] Reduce Motion対応

### パフォーマンス
- [ ] コールドスタート3秒以内
- [ ] 1440粒レンダリング 60fps
- [ ] メモリリークなし

### プライバシー
- [x] 全データローカル保存（サーバー通信なし）
- [ ] Privacy Manifest設定
- [ ] Required Reason APIs申告（expo-calendar使用）
