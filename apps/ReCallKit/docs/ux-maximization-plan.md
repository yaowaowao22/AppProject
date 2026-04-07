# ReCallKit — UX Maximization 改善計画

> 作成日: 2026-04-07
> 前提ドキュメント: `uiux-improvement-plan.md`（2026-04-06）の上位互換
> UIモック: `prompts/home-mockup.html`（承認済みデザイン）
> 分析軸: 7軸（取り込み/ホーム/復習/進捗可視化/ライブラリ/通知/オンボーディング）
> 設計言語: **Google Calendar クリーン美学**（白背景、1pxボーダー、SVGアイコン、Blue/Amber/Green 3色アクセント）

---

## 0. 構造的課題の総括

### 0-A. コアバリューチェーンと摩擦マップ

```
Discover → Ingest → AI Analysis → Save → Review → Retention
           ↑摩擦A   ↑摩擦B       ↑摩擦C  ↑摩擦D   ↑摩擦E
```

| ID | 摩擦 | 現状ステップ数 | 深刻度 | 影響範囲 |
|----|------|-------------|--------|---------|
| A | URL入力→解析開始の画面遷移が多い | 3ステップ2遷移 | 高 | 全ユーザー毎回 |
| B | QAPreviewScreenがメインフローから孤立 | 到達不可 | **致命的** | 全ユーザー |
| C | 解析完了→復習開始のパスがない | 7+ステップ | 高 | 全ユーザー毎回 |
| D | ReviewSelectScreenが毎回1タップ余分 | +1ステップ | 中 | 全ユーザー毎日 |
| E | 学習進捗・マスタリーの可視化がゼロ | — | 高 | 継続率に直結 |
| F | ホーム画面の情報密度が低い | — | 中 | 毎日の第一印象 |
| G | 空状態が全画面で「死んでいる」 | — | 高 | 新規ユーザー離脱 |
| H | StreakRingが計算されるがUIに未表示 | — | 中 | 実装済み機能の無駄 |

### 0-B. 致命的設計負債（即時対応）

1. **QAPreviewScreenの孤立**: スワイプ選別・編集・除外・50件制限・カテゴリ検出が完成済みなのに、URLImportListScreenからの遷移パスがゼロ。ユーザーにとっては「存在しない機能」
2. **StreakRingの非表示**: `useWidgetData`でstreak日数を計算しているが、HomeScreen UIにバインドされていない。Widget用データがアプリ本体に反映されていない
3. **URLAnalysisScreenのback動作**: スタート後に自動backするが、URLImportListScreenへの導線が暗黙的。処理状況の確認先をユーザーが自力で発見する必要がある

### 0-C. モックアップで確定済みのデザイン方針

`prompts/home-mockup.html` で以下のUI設計が承認済み。実装はこの仕様に準拠する。

| 決定事項 | モックアップの仕様 | 解決する摩擦ID |
|---------|-----------------|-------------|
| デザイン言語 | Google Calendar風クリーン美学。`--blue:#1A73E8`, `--accent:#E8A000`, `--green:#1E8E3E` | — |
| フォント | Google Sans + Noto Sans JP | — |
| ホーム3層設計 | 日付ヘッダー→復習CTA→Stats→週間ドット→Recently Added→Mastery→Shortcuts | E, F |
| 1タップ復習 | Home「復習を始める」→ 直接reviewSession（ReviewSelect不経由） | D |
| QAPreview統合 | URLImportList完了ジョブに「プレビュー」ボタン → QAPreview画面 | B |
| Stats行 | 「12日連続 / 38習得済み / 124カード」の3カラム | E, H |
| 週間アクティビティ | Mon-Today のドットマップ（done/strong/today-ring 3状態） | E |
| カテゴリ別Mastery | Programming 68% / Design 45% / Infrastructure 82% のバー表示 | E |
| Recently Added | 横スクロールカード（カテゴリドット + 質問テキスト + 相対時刻） | F |
| ドロワーヘッダー | 「124 cards · 31% mastered」 | E |
| URL残回数表示 | URLAnalysisScreenに「本日の残り回数 2/3」カード | — |
| 学習履歴 | StreakRing + 4統計ボックス（今日完了/総カード/習得済み/正答率） | E, H |

---

## 1. URL取り込み → 学習開始（Axis 1）

### 現状フロー（7ステップ、4遷移）

```
Home → URL解析カード(tap)
  → URLAnalysisScreen(URL入力+スタート)
    → 自動back（URLImportListScreenへの導線なし）
      → URLImportListScreen(手動遷移)
        → ジョブ完了待ち(2秒ポーリング)
          → "ライブラリで見る"(tap) → ItemDetail
            → 戻る → ReviewSelectScreen → スタート → Review
```

QAPreviewScreenは到達不可。

### 1-1. QAPreview統合フロー ★P0 — モック確定済み

**モックアップで確定した設計:**

URLImportListScreenの完了ジョブに**2つのCTA**が並ぶ:
```html
<button class="btn btn-outline" onclick="nav('qaPreview')">プレビュー</button>
<button class="btn btn-primary" onclick="nav('library')">ライブラリで見る</button>
```

**目標フロー（2パターン）:**

```
パターンA: プレビュー経由（推奨）
Home → URLAnalysis(URL入力+スタート)
  → URLImportList(進捗確認)
    → 完了「プレビュー」→ QAPreview(選別・編集)
      → 「すべて保存」→ Library

パターンB: 直接保存
Home → URLAnalysis → URLImportList → 完了「ライブラリで見る」→ Library
```

**Before/After:**

| 指標 | Before | After | 削減 |
|------|--------|-------|------|
| QAPreview到達 | 不可能 | 1タップ（完了ジョブの「プレビュー」） | ∞→1 |
| 画面遷移 | 不定（迷子） | URLAnalysis→ImportList→QAPreview（明確） | 明確化 |

**追加実装（モックにまだないもの）:**

1. **QAPreviewScreen「保存して復習開始」ボタン**: 現在のモックは「すべて保存 (5件)」のみ。横に「保存して復習開始」を追加
2. **URLAnalysisScreen → URLImportListScreen自動遷移**: スタート後に自動でImportListに遷移（現在のback動作を廃止）

**実装内容:**

| 変更 | ファイル | 内容 |
|------|---------|------|
| ImportList→QAPreview導線 | `URLImportListScreen.tsx` | 完了ジョブに「プレビュー」ボタン追加。job.item_id群をparamsで渡す |
| QAPreview→Review導線 | `QAPreviewScreen.tsx` | 「保存して復習開始」ボタン追加。保存後にReviewScreenをmodal表示 |
| URLAnalysis遷移修正 | `URLAnalysisScreen.tsx` | スタート後→ImportListScreenへreplace遷移（backではなく） |
| ルート追加 | `src/navigation/` | QAPreview→ReviewSession、ImportList→QAPreviewのルート |

**⚠️ トレードオフ:**
- バックグラウンド一括処理（複数URL連続投入）の利便性とプレビュー確認の両立が必要
- 対策: ImportListScreenから複数ジョブを個別にプレビュー可能。一括保存ボタンも残す

### 1-2. URLAnalysisScreenのインライン進捗 ★P1

**モックアップの現状:** URLAnalysisScreenは入力+スタートのみ。残回数表示あり。

**追加設計:**
- スタート後、同一画面内にプログレスインジケーター表示
- 完了時に「Q&Aを確認する」ボタンをアニメーション表示 → QAPreviewへ直接遷移
- ImportListScreenへの遷移は「取り込み一覧を見る」リンクとして残す

```
URLAnalysisScreen（スタート後の状態）:
┌──────────────────────────────┐
│ ← URL解析                    │
│                              │
│ 解析するURL                   │
│ [https://react.dev/blog/...] │
│                              │
│ 本日の残り回数: 1 / 3         │
│                              │
│ ┌────────────────────────┐   │
│ │ 🔍 解析中...            │   │  ← スタート後に表示
│ │ [████████░░░░] 65%      │   │
│ │ AIがQ&Aを生成しています  │   │
│ └────────────────────────┘   │
│                              │
│ [Q&Aを確認する]  ← 完了時表示  │
│ 取り込み一覧を見る ›          │
└──────────────────────────────┘
```

**影響ファイル:**
- `src/screens/add/URLAnalysisScreen.tsx` — インラインプログレス追加

**実装複雑度:** Medium

### 1-3. エラー回復のコンテキスト保持 ★P1

**モックアップで確定済み:** 失敗ジョブに赤バッジ + エラーメッセージ + 「再試行」ボタン

```html
<!-- モックアップの失敗ジョブ表示 -->
<span class="pill pill-red">失敗</span>
<div style="color:var(--red)">タイムアウト: サーバーに接続できませんでした</div>
<button class="btn btn-danger">再試行</button>
```

**追加実装:** エラー種別に応じた回復アクション分岐

| エラー条件 | 表示メッセージ | 回復アクション |
|-----------|-------------|-------------|
| fetch失敗（ネットワーク） | "接続エラー" | 「再試行」ボタン |
| URL無効（404等） | "ページが見つかりません" | 「URLを修正」→URLAnalysisScreenに戻す |
| コンテンツ抽出失敗 | "内容を読み取れませんでした" | 「手動で追加」→AddItemScreen |
| AI制限超過（3/3） | "本日の解析枠を使い切りました" | 残り時間表示 + 「広告を見て追加」 |
| Bedrock API エラー | "AI解析に失敗しました" | 「再試行」ボタン |

**影響ファイル:**
- `src/screens/add/URLImportListScreen.tsx` — エラー種別判定 + 回復UI

**実装複雑度:** Low

### 1-4. Share Extension → 自動キュー登録 ★P3

**Before:** Share → アイテム保存（Q&A生成なし）→ 手動でURL解析画面を開いて再入力

**After:** Share → 自動でurl_import_job登録 → バックグラウンド解析 → 完了通知 → QAPreview

**影響ファイル:**
- `src/services/shareReceiver.ts` — url_import_jobs登録に変更
- `src/services/notificationService.ts` — 完了通知追加

**実装複雑度:** Medium-High（iOSバックグラウンド実行制限の考慮が必要）

---

## 2. ホーム画面の情報アーキテクチャ（Axis 2）

### モックアップ確定仕様

ホーム画面は以下の7セクション構成で**確定済み**:

```
[1] ヘッダー: ☰ ReCallKit
[2] 日付行: 曜日の丸アイコン(日付) + "8件の復習が待っています"
[3] 復習CTAカード:
    - イラスト帯（カード3枚のSVG + キャラクター）
    - "今日の復習 8件" / "推定4分 · Programming, Design"
    - "期限切れ 3件"（赤テキスト）
    - [▶ 復習を始める] ← Primary CTA → 直接reviewSession
[4] Stats: 12日連続 | 38習得済み | 124カード
[5] 週間アクティビティ:
    - Mon〜Today ドットグリッド（strong=blue塗り, done=blue枠, today-ring=枠のみ）
    - "今週 5/7日 · 42枚復習済み"
[6] Recently Added:
    - 横スクロールカード（カテゴリドット + 質問3行 + 相対時間）
[7] カテゴリ別Mastery:
    - Programming 68% / Design 45% / Infrastructure 82%
[8] Shortcuts:
    - URLから学習カードを作成 › → URLAnalysis
    - 手動でカードを作成 ›
```

### 2-1. モックアップ→React Native実装 ★P0

**現在のHomeScreen.tsxとの差分:**

| モックの要素 | 現HomeScreen | 実装作業 |
|------------|-------------|---------|
| 日付行（曜日丸+復習件数） | なし | 新規追加 |
| イラスト帯 | なし | SVG or ImageコンポーネントをReanimatedで実装 |
| 復習CTA→直接Review | ReviewSelectScreen経由 | navigation先をReviewScreenに変更 |
| 推定時間・カテゴリ表示 | なし | dueItems集計からカテゴリ抽出 + 平均時間計算 |
| 期限切れ件数（赤） | overdueBadge（簡易） | overdueの件数を赤テキストで明示表示 |
| Stats 3カラム | なし | 新規: streak日数(useWidgetData) + 習得済み(query) + 総カード(query) |
| 週間ドットグリッド | なし | 新規: WeeklyActivity.tsx |
| Recently Added横スクロール | なし | 新規: RecentCards.tsx (FlatList horizontal) |
| Mastery bars | なし | 新規: CategoryMastery.tsx |
| Shortcuts | URL解析カード + ジャーナルカード | リスト形式に変更、ジャーナルをShortcutsに統合 |

**影響ファイル:**
- `src/screens/home/HomeScreen.tsx` — **全面再設計**
- 新規: `src/components/home/DateHeader.tsx`
- 新規: `src/components/home/ReviewHero.tsx` — イラスト + CTA
- 新規: `src/components/home/StatsRow.tsx` — 3カラム統計
- 新規: `src/components/home/WeeklyActivity.tsx` — ドットグリッド
- 新規: `src/components/home/RecentCards.tsx` — 横スクロール
- 新規: `src/components/home/CategoryMastery.tsx` — マスタリーバー
- 新規: `src/components/home/Shortcuts.tsx` — ショートカットリスト
- `src/db/queries.ts` — マスタリー集計・週間アクティビティ・カテゴリ別集計クエリ

**カラーシステムの注意:**

モックアップはGoogle Calendar風の3色アクセント:
```
--blue:   #1A73E8  （主要アクション、プログレス）
--accent: #E8A000  （Amber、FABアクセント）
--green:  #1E8E3E  （成功、Infrastructure）
--red:    #D93025  （エラー、期限切れ）
--orange: #F29900  （警告、難しかった）
```

現在のアプリは `RecallAmber (#C47F17/#F5A623)` をAccentとして使用。モックアップではBlueが主要アクション色に昇格しており、**カラーシステムの移行が必要**。

⚠️ **判断ポイント:** 既存テーマシステム（30テーマ）との整合性。モック準拠でBlue主体に移行するか、Amber主体を維持してモックのBlue部分をAmberに置換するか。

**実装複雑度:** High（ホーム画面全面書き換え + 新規コンポーネント7つ + クエリ追加）

### 2-2. 状態適応型レイアウト ★P2

| 状態 | カード数 | ホーム画面の適応 |
|------|---------|---------------|
| Empty (0) | 0 | URL入力フィールド直埋め込み + サンプルURL提示。Stats/Weekly/Mastery非表示 |
| Sparse (1-10) | 少数 | Stats表示開始。Mastery非表示（カテゴリ少数で無意味）。URL追加CTAを大きく |
| Moderate (11-100) | 適量 | モック通りの全セクション表示 |
| Heavy (100+) | 大量 | Mastery + 「要注意カード」セクション追加 |

**影響ファイル:**
- `src/screens/home/HomeScreen.tsx` — 条件分岐レイアウト

**実装複雑度:** Medium

### 2-3. 復習完了後の価値ある状態 ★P1

**現在のモック:** 復習完了後のホーム表示は未定義。

**追加設計:**
```
✅ 本日の復習完了！

今日: 12件 | 正答率 83%

今週: ● ● ● ● ○ ○ ○  (4/7日)  ← 既存WeeklyActivityを流用
      Mon Tue Wed Thu Fri Sat Today

[追加学習を始める]  ← Secondary CTA
[新しいURLを追加する]
```

**影響ファイル:**
- `src/screens/home/HomeScreen.tsx` — 復習完了状態のレンダリング分岐

**実装複雑度:** Low

---

## 3. 復習体験のセッション最適化（Axis 3）

### モックアップ確定仕様

**ReviewSession画面構成:**
```
[×] 復習セッション [   ]   ← 閉じるボタン（×アイコン）
[████████░░░░░░░░] 1 / 8   ← プログレスバー + カウント

┌──────────────────────┐
│ QUESTION              │
│                       │
│ React Server Components│
│ がクライアントコンポーネント│
│ と異なる点は？         │
│                       │
│    タップしてめくる     │  ← フリップ前ヒント
└──────────────────────┘

[ めくった後 → 4ボタン表示 ]
[もう一度] [難しい] [良い] [簡単]
 (忘れた)  (苦労)  (迷い) (完璧)
 ● 赤     ● 橙   ● 青   ● 緑
```

**完了画面（モック確定）:**
```
🎉 復習完了！
8件の復習を完了しました

● 簡単 3  ● 良い 3  ● 難しい 1  ● もう一度 1

[ホームに戻る]
```

### 3-1. 1タップ復習 ★P0 — モック確定済み

**モックアップで確定:** Home「復習を始める」→ 直接`nav('reviewSession')`

```javascript
// モックアップのコード
<button class="btn btn-primary" onclick="nav('reviewSession')">復習を始める</button>
```

**Before:** Home → ReviewSelectScreen → スタート = 3タップ、2遷移
**After:** Home → ReviewSession = 1タップ、1遷移

**実装:**
- HomeScreenの復習CTAからReviewScreenを直接fullScreenModal表示
- ReviewSelectScreenはドロワー「復習」メニューからのみアクセス（グループ選択用）

**影響ファイル:**
- `src/screens/home/HomeScreen.tsx` — 遷移先をReviewScreenに変更
- ナビゲーション設定 — HomeStack→ReviewScreenの直接ルート追加

**実装複雑度:** Low

### 3-2. セッション内フィードバック強化 ★P1

**モックの現状:** プログレスバー + 「1 / 8」カウントのみ

**追加設計:**
```
[████████░░░░░░░░] 5/8  |  正答率 75%  |  残り約1分
```

**追加要素:**
1. **正答率**: quality >= 3 の割合をリアルタイム計算
2. **予想残り時間**: 平均評価時間 × 残りカード数
3. **残り3枚以下**: バーを`--green`に変色

**影響ファイル:**
- `src/components/ReviewProgressBar.tsx`
- `src/screens/review/ReviewScreen.tsx`

**実装複雑度:** Low

### 3-3. セッション完了サマリー強化 ★P1

**モックの現状:** 絵文字 + 件数 + 4色ドットの1行サマリー + 「ホームに戻る」

**追加要素（モックを拡張）:**
```
🎉 復習完了！ 8件 | 正答率 87%

  簡単      ████████  3枚
  良い      ████████  3枚
  難しい     ██        1枚
  もう一度   █         1枚

📈 2件が「習得済み」に昇格しました
⚠️ 1件が注意カード（苦手）です

次回の復習: 明日 6件

[新しいURLを追加する]  [ホームに戻る]
```

**追加データ:**
- 正答率: (quality >= 3の件数) / 全件数
- 習得昇格数: セッション前後でinterval_days >= 21 に到達したカード数
- 注意カード数: EF < 1.8 のカード数
- 次回復習件数: 翌日のdueカウント

**影響ファイル:**
- `src/screens/review/ReviewScreen.tsx` — 完了画面拡張

**実装複雑度:** Low（既存データから計算可能）

### 3-4. ミニレビューモード（5枚） ★P2

**設計:**
- ホーム画面に「クイック復習 (5枚)」ボタン追加（Shortcuts内）
- 期限超過カードを優先選出
- 完了後:「続ける？残りX件」のCTA

**エントリーポイント:**
1. ホーム画面Shortcuts「クイック5」
2. 通知タップ → ミニレビュー
3. ウィジェットタップ
4. QAPreview保存後 →「今すぐ復習？」

**影響ファイル:**
- `src/screens/review/ReviewScreen.tsx` — items配列slice対応
- `src/screens/home/HomeScreen.tsx` — Shortcutsにエントリ追加

**実装複雑度:** Low

---

## 4. 進捗可視化とモチベーション（Axis 4）

### モックアップ確定仕様

**ホーム画面のStats行:**
```
12日連続 | 38習得済み | 124カード
```

**ホーム画面のWeekly Activity:**
```
Mon  Tue  Wed  Thu  Fri  Sat  Today
 ✓    ✓    ✓    ○    ✓    ✓    ◎

今週 5 / 7日    42枚 復習済み
```

ドットの3状態:
- `wdot strong` = blue塗り + 白チェック（充実した日）
- `wdot done` = blue枠 + blueチェック（実施済み）
- `wdot today-ring` = blue枠のみ（今日・未実施）
- `wdot`（空） = 未実施の過去日

**ホーム画面のMastery:**
```
Programming     [████████░░] 68%
Design          [████░░░░░░] 45%
Infrastructure  [████████░░] 82%
```

**History画面:**
```
StreakRing(SVG) + 4ボックス:
[今日完了: 8] [総カード: 124] [習得済み: 38] [正答率: 87%]
```

### 4-1. マスタリー率の定量定義 ★P1

**SM-2データに基づくレベル定義（全画面で統一使用）:**

```
Level 0 未学習:    repetitions = 0
Level 1 学習中:    repetitions >= 1 AND interval_days < 7
Level 2 定着中:    interval_days >= 7 AND interval_days < 21
Level 3 習得済み:  interval_days >= 21 AND easiness_factor >= 2.0
Level 4 完全習得:  interval_days >= 60 AND easiness_factor >= 2.5
⚠️ 要注意:        easiness_factor < 1.8 OR (repetitions > 3 AND interval_days < 3)

習得率 = (Level 3 + Level 4) / 全カード数 × 100%
```

**使用箇所:**
- ホーム Stats行「38習得済み」= Level 3 + Level 4 の合計
- ドロワーヘッダー「31% mastered」= 習得率
- History「習得済み: 38」= Level 3 + Level 4
- カテゴリ別Mastery = カテゴリごとの習得率

**集計クエリ:**
```sql
SELECT
  CASE
    WHEN r.repetitions = 0 THEN 'new'
    WHEN r.interval_days < 7 THEN 'learning'
    WHEN r.interval_days < 21 THEN 'reviewing'
    WHEN r.interval_days >= 60 AND r.easiness_factor >= 2.5 THEN 'deep_mastered'
    WHEN r.interval_days >= 21 AND r.easiness_factor >= 2.0 THEN 'mastered'
    ELSE 'learning'
  END as level,
  COUNT(*) as count
FROM reviews r
JOIN items i ON r.item_id = i.id
WHERE i.archived = 0
GROUP BY level;
```

**影響ファイル:**
- `src/db/queries.ts` — マスタリー集計クエリ追加

**実装複雑度:** Low

### 4-2. マスタリーダッシュボード（History画面強化） ★P1

**モック確定の基本構成に、マスタリー分布を追加:**

```
History画面:
[StreakRing] [今日完了:8] [総カード:124] [習得済み:38] [正答率:87%]

━━ マスタリー分布 ━━━━━━━━━━━━━  ← 新規追加
■ 完全習得  42件 (17%)  ████████
■ 習得済み  126件 (51%) ████████████████████
■ 定着中    38件 (15%)  ██████
■ 学習中    29件 (12%)  █████
■ 未学習    12件 (5%)   ██

⚠️ 要注意: 8件  [確認する →]  ← タップでLibraryの要注意ソート

━━ Recent Reviews ━━━━━━━━━━━━━
[既存の復習履歴リスト — モック通り]
```

**影響ファイル:**
- `src/screens/history/HistoryScreen.tsx` — マスタリー分布セクション追加
- 新規: `src/components/MasteryDistribution.tsx`

**実装複雑度:** Medium

### 4-3. 週間アクティビティ（フル版ヒートマップ） ★P2

**ホーム画面:** モック確定の7日ドットマップ

**History画面に12週分フル版を追加:**
```
     Mon Tue Wed Thu Fri Sat Sun
W-4  □   ■   □   ■   □   □   □
W-3  ■   ■   □   ■   ■   □   □
W-2  ■   ■   ■   □   ■   □   □
W-1  ■   ■   □   ■   ■   □   □
Now  ■   ■   ■   ■   □   □   □

■ 色の濃さ = レビュー件数
```

**データソース:**
```sql
SELECT DATE(last_reviewed_at) as review_date, COUNT(*) as count
FROM reviews
WHERE last_reviewed_at >= DATE('now', '-84 days')
GROUP BY review_date;
```

**影響ファイル:**
- 新規: `src/components/home/WeeklyActivity.tsx` — ミニ版（モック仕様準拠）
- 新規: `src/components/ActivityHeatmap.tsx` — フル版（History用）

**実装複雑度:** Medium

### 4-4. ポイントシステム可視化 ★P3

**追加UI:**
1. ホーム画面にポイント表示（Stats行の下、控えめに）
2. 復習完了時に「+10pt」フロートアップ
3. マイルストーンバッジ:

| バッジ | 条件 | ポイント |
|--------|------|---------|
| 🎯 初回復習 | 初回復習完了 | +50 |
| 📚 カード50 | 50件カード追加 | +100 |
| 🔥 7日連続 | 7日ストリーク | +200 |
| 🏆 習得率50% | マスタリー50%達成 | +300 |
| 💎 100件習得 | Level 3+が100件 | +500 |

**実装複雑度:** Medium

---

## 5. ライブラリの閲覧性と管理（Axis 5）

### モックアップ確定仕様

**Library画面:**
```
☰ ライブラリ [+]

[🔍 検索...]

[すべて] [Programming] [Design] [Infrastructure] [新規] [期限切れ]
  ↑ active=blue塗り、他=border

─── アイテムリスト ───
● Programming · 2時間前
  React Server Componentsが〜

● Design · 昨日
  ゲシュタルトの法則における〜
...
```

**特徴:**
- フィルタチップ: `.filter-chip.active` = blue塗り白文字
- リストアイテム: カテゴリドット + タイトル + メタ（カテゴリ名 · 相対時間）
- ヘッダー右に [+] ボタン → URLAnalysis

### 5-1. 表示モード切り替え ★P2

**モックはリスト表示のみ。カード/コンパクト表示を追加:**

```
ヘッダーに [リスト | カード | コンパクト] トグル

カード（新規）:
┌────────────┐ ┌────────────┐
│ ● Programming│ │ ● Design   │
│ React Server│ │ ゲシュタルト│
│ Componentsが│ │ の法則に   │
│ クライアント│ │ おける     │
│ 2時間前     │ │ 昨日       │
└────────────┘ └────────────┘

コンパクト（新規）:
● React Server Componentsが〜       2時間前
● ゲシュタルトの法則における〜       昨日
● CDNのエッジキャッシュと〜         3日前
```

**影響ファイル:**
- `src/screens/library/LibraryScreen.tsx` — 表示モードstate + レンダラー切替
- 新規: `src/components/library/LibraryCardView.tsx`
- 新規: `src/components/library/LibraryCompactView.tsx`

**実装複雑度:** Medium

### 5-2. スマートソート + 要注意サーフェス ★P1

**モックのフィルタチップに「期限切れ」が含まれているが、ソートオプションが未実装。**

**追加:**
```
ソート: [最新 | 復習予定日 | 難易度 | 要注意]

「要注意」ソート:
  1. EF < 1.8 のカード（苦手バッジ表示）
  2. quality_historyでreset 3回以上
  3. flaggedカード
  4. 期限超過カード
```

**影響ファイル:**
- `src/screens/library/LibraryScreen.tsx` — ソートロジック + UI追加

**実装複雑度:** Low

### 5-3. バルク操作拡張 ★P2

**Before:** 選択 → 削除のみ

**After:** 選択モードのアクションバーを拡張
```
[タグ付け]  [グループ追加]  [アーカイブ]  [削除]
```

**影響ファイル:**
- `src/screens/library/LibraryScreen.tsx`

**実装複雑度:** Low-Medium

### 5-4. コンテキストメニュー + インライン編集 ★P2

**Before:** 長押し → 選択モード

**After:**
- 1件長押し → コンテキストメニュー [編集 | タグ | グループ | アーカイブ | 削除]
- 「編集」→ ボトムシートでインライン編集
- 2件目タップ → 選択モード（既存挙動維持）

**影響ファイル:**
- `src/screens/library/LibraryScreen.tsx`
- 新規: `src/components/ItemEditSheet.tsx`

**実装複雑度:** Low

---

## 6. 通知とリエンゲージメント（Axis 6）

### 6-1. コンテキスト依存型通知 ★P1

**Before:** 毎日同じ「復習の時間です」

**After:**

| 状態 | 通知テンプレート |
|------|---------------|
| 通常日 | "今日の復習: 12件 \| 🔥 15日連続を維持しましょう" |
| 期限超過あり | "期限超過 5件 \| 早めの復習で記憶を強化" |
| ストリーク危機（夕方未復習） | "🔥 14日連続のストリークが今日で途切れます" |
| 復習完了済み | 通知なし |
| 復習件数少（3件以下） | "今日はたった3件！1分で完了します" |

**制約:** 1日最大2通（朝リマインダー + 夕方ストリーク警告）

**影響ファイル:**
- `src/services/notificationService.ts` — テンプレート分岐
- `src/db/queries.ts` — due件数・ストリーク状態クエリ

**実装複雑度:** Medium

### 6-2. インポート完了通知 ★P2

```
完了時 (background): "Q&A生成完了 — 'React Hooks入門'から5件" → タップ→QAPreview
完了時 (foreground): in-app toast バナー
失敗時: "URL解析失敗 — タップして詳細を確認" → タップ→URLImportList
```

**影響ファイル:**
- `src/screens/add/URLImportListScreen.tsx` — 完了トリガー
- `src/services/notificationService.ts`

**実装複雑度:** Low

### 6-3. 段階的リエンゲージメント ★P3

| 不在期間 | 通知 | アプリ起動時 |
|---------|------|------------|
| 3日 | "3日間の復習を逃しました。5分で追いつけます" | — |
| 7日 | "ミニ復習(5枚)で再開しませんか？" | ミニレビュー直接提案 |
| 14日 | "ReCallKitを開いて確認しましょう" | 「おかえりなさい」画面 + マスタリー状況 |
| 30日+ | 通知停止 | 期限超過を今日のキューに追加提案 |

**実装複雑度:** Medium-High

### 6-4. 無料枠リセット通知 ★P3

翌日リセット通知のみ（枠カウントダウンは送らない）。
モックの「本日の残り回数 2/3」UIと連動。

**実装複雑度:** Low

---

## 7. オンボーディングと空状態（Axis 7）

### 7-1. 空状態CTAの設計 ★P0

**モックアップのemptyクラス仕様:**
```css
.empty { display:flex; flex-direction:column; align-items:center;
         justify-content:center; padding:60px 40px; text-align:center }
.empty svg { width:48px; height:48px; color:var(--text-3); margin-bottom:16px }
.empty-title { font-size:16px; color:var(--text-2) }
.empty-sub { font-size:13px; color:var(--text-3); line-height:1.5 }
```

**全画面の空状態を「次のアクション」に変換:**

| 画面 | Before | After |
|------|--------|-------|
| Home (0件) | 空メッセージ | 🔗アイコン + "最初のURLを追加して学習を始めましょう" + URL入力埋め込み |
| Library (0件) | 「アイテムがありません」 | 📚アイコン + "URLを追加するとAIがQ&Aを自動生成します" + [+ カードを追加] ボタン |
| Library (検索0件) | 「見つかりませんでした」 | 🔍アイコン + "見つかりませんでした" + [フィルタをクリア] |
| Review (0件) | 「今日の復習はありません」 | ✅アイコン + "復習するカードを追加しましょう" + [URLを追加] |
| History (0件) | 「最近の復習履歴がありません」 | 📊アイコン + "復習を始めると学習履歴がここに表示されます" + [復習を始める] |
| Journal (0件) | 「記録されていません」 | 📝アイコン + "復習中にメモを追加するとここに表示されます" |
| Map (0件) | 「アイテムがありません」 | 🗺アイコン + "カードが5件以上で知識の地図が自動生成されます" |
| Groups (0件) | 「グループはありません」 | 📁アイコン + "グループを作成して効率的に復習" + [作成] |
| Trash (0件) | 「ゴミ箱は空です」 | そのまま |

**影響ファイル:** 各画面の空状態セクション

**実装複雑度:** Low（最もROIが高い施策）

### 7-2. ガイド付き初回インポート体験 ★P3

```
Step 1: ようこそ
  "ReCallKit — URLから自動でフラッシュカードを作成"
  [体験してみる（30秒）]  [すぐに始める]

Step 2: 体験デモ（サンプルURL → プリコンパイルQ&A 3枚プレビュー → 3枚復習体験）

Step 3: 初回CTA
  "あなたのURLを追加して学習を始めましょう"
```

**⚠️ 重要:** サンプルデータはプリコンパイル済み（AI呼び出しなし、無料枠消費なし）

**影響ファイル:**
- `src/screens/onboarding/OnboardingScreen.tsx` — 大幅拡張
- 新規: `src/data/sampleCards.ts`

**実装複雑度:** High

### 7-3. スワイプヒントの自然な学習 ★P1

1. **初回フリップ時:** 裏面下部にゴーストヒント（opacity 0.3、1回のみ）
   ```
   ← もう一度  |  良い ↑  |  簡単 →
   ```
2. **3枚連続ボタンのみ:** トースト「ヒント: スワイプでも評価できます」（1回のみ）

**影響ファイル:**
- `src/screens/review/ReviewScreen.tsx`
- `src/components/ReviewCard.tsx`

**実装複雑度:** Low

### 7-4. 初週リテンション戦略 ★P2

| Day | 目標 | 施策 |
|-----|------|------|
| 1 | aha moment到達 + 3枚保有 | ガイド or 空状態CTA |
| 2 | 初回復習完了 | 通知「3件を復習しましょう」 |
| 3 | 3日連続ストリーク | 通知「1分で完了します」 |
| 7 | 1週間達成 | 「🎉 1週間達成！」+ 週間サマリー |

**実装複雑度:** Medium

---

## 8. 実装ロードマップ

### Phase 1: コア体験の修復 ★ 最優先（4-5日）

> モックアップの基本構造を実装。QAPreview接続・1タップ復習・空状態。

| # | タスク | 主要ファイル | 複雑度 | モック対応 |
|---|--------|------------|--------|----------|
| 1-1 | QAPreview統合フロー | URLImportListScreen, QAPreviewScreen, navigation | Medium | ✅ モック確定 |
| 3-1 | 1タップ復習 | HomeScreen, navigation | Low | ✅ モック確定 |
| 7-1 | 空状態CTA（全画面） | 各Screen | Low | ✅ モックCSS確定 |
| — | カラーシステム移行判断 | theme/colors.ts | — | ⚠️ 要判断 |

### Phase 2: ホーム画面全面再設計（5-6日）

> モックアップのホーム画面を忠実にReact Nativeで再現。

| # | タスク | 主要ファイル | 複雑度 | モック対応 |
|---|--------|------------|--------|----------|
| 2-1 | ホーム7セクション実装 | HomeScreen (全面書換), 7新規コンポーネント | High | ✅ モック確定 |
| 2-3 | 復習完了後の状態 | HomeScreen | Low | 追加設計 |
| 4-1 | マスタリー定義+クエリ | queries.ts | Low | ✅ モックに数値あり |

### Phase 3: 復習体験+進捗可視化（3-4日）

| # | タスク | 主要ファイル | 複雑度 | モック対応 |
|---|--------|------------|--------|----------|
| 3-2 | セッション内フィードバック | ReviewProgressBar, ReviewScreen | Low | 追加設計 |
| 3-3 | 完了サマリー強化 | ReviewScreen | Low | ✅ モック基本あり+拡張 |
| 4-2 | History画面マスタリー分布 | HistoryScreen, MasteryDistribution | Medium | ✅ モック基本あり+拡張 |
| 5-2 | スマートソート | LibraryScreen | Low | 追加設計 |
| 7-3 | スワイプヒント | ReviewScreen, ReviewCard | Low | 追加設計 |

### Phase 4: 通知+ライブラリ強化（3-4日）

| # | タスク | 主要ファイル | 複雑度 | モック対応 |
|---|--------|------------|--------|----------|
| 6-1 | コンテキスト依存型通知 | notificationService, queries.ts | Medium | 追加設計 |
| 6-2 | インポート完了通知 | URLImportListScreen, notificationService | Low | 追加設計 |
| 1-2 | URLAnalysisインライン進捗 | URLAnalysisScreen | Medium | 追加設計 |
| 1-3 | エラー回復コンテキスト | URLImportListScreen | Low | ✅ モック基本あり |

### Phase 5: 拡張機能（別スプリント）

| # | タスク | 複雑度 | モック対応 |
|---|--------|--------|----------|
| 5-1 | 表示モード切り替え | Medium | 追加設計 |
| 5-3 | バルク操作拡張 | Low-Medium | 追加設計 |
| 5-4 | コンテキストメニュー | Low | 追加設計 |
| 3-4 | ミニレビューモード | Low | 追加設計 |
| 4-3 | フルヒートマップ | Medium | 追加設計 |
| 7-2 | ガイド付きオンボーディング | High | 追加設計 |
| 1-4 | Share Extension強化 | Medium-High | 追加設計 |
| 6-3 | 段階的リエンゲージメント | Medium-High | 追加設計 |
| 4-4 | ポイント可視化 | Medium | 追加設計 |
| 2-2 | 状態適応型レイアウト | Medium | 追加設計 |

---

## 9. 優先度マトリクス（全施策横断）

| 優先度 | 施策 | 効果 | コスト | モック | Axis |
|--------|------|------|--------|--------|------|
| **P0** | 空状態CTA設計 | 全画面の「死」解消 | Low | ✅ CSS確定 | 7 |
| **P0** | 1タップ復習 | 毎日-2タップ | Low | ✅ 確定 | 3 |
| **P0** | QAPreview統合 | コア体験完成 | Medium | ✅ 確定 | 1 |
| **P0** | ホーム全面再設計 | 情報密度+動機付け | High | ✅ 全セクション確定 | 2 |
| **P1** | マスタリー定義+クエリ | 全画面の数値基盤 | Low | ✅ 数値使用箇所確定 | 4 |
| **P1** | 復習完了後の状態 | 完了後の価値 | Low | 追加 | 2 |
| **P1** | 完了サマリー強化 | 復習後の満足度 | Low | 基本+拡張 | 3 |
| **P1** | セッション内フィードバック | 進捗の可視化 | Low | 追加 | 3 |
| **P1** | Historyマスタリー分布 | 成長の実感 | Medium | 基本+拡張 | 4 |
| **P1** | コンテキスト通知 | リテンション | Medium | 追加 | 6 |
| **P1** | スマートソート | 要注意カード発見 | Low | 追加 | 5 |
| **P1** | スワイプヒント | 操作の自然な学習 | Low | 追加 | 7 |
| **P1** | エラー回復コンテキスト | 失敗時UX | Low | 基本あり | 1 |
| **P2** | URLAnalysisインライン進捗 | 取り込み体験改善 | Medium | 追加 | 1 |
| **P2** | 表示モード切り替え | ライブラリ閲覧性 | Medium | 追加 | 5 |
| **P2** | ミニレビューモード | 隙間時間活用 | Low | 追加 | 3 |
| **P2** | フルヒートマップ | 習慣の可視化 | Medium | 追加 | 4 |
| **P2** | インポート完了通知 | 非同期体験改善 | Low | 追加 | 6 |
| **P2** | バルク操作拡張 | 管理効率 | Low-Medium | 追加 | 5 |
| **P2** | コンテキストメニュー | 編集効率 | Low | 追加 | 5 |
| **P2** | 状態適応型レイアウト | 段階的開示 | Medium | 追加 | 2 |
| **P2** | 初週リテンション | 新規定着 | Medium | 追加 | 7 |
| **P3** | ガイド付きオンボーディング | 初回体験改善 | High | 追加 | 7 |
| **P3** | Share Extension強化 | 外部連携 | Medium-High | 追加 | 1 |
| **P3** | 段階的リエンゲージメント | 離脱防止 | Medium-High | 追加 | 6 |
| **P3** | ポイント可視化 | ゲーミフィケーション | Medium | 追加 | 4 |
| **P3** | 無料枠リセット通知 | 枠活用促進 | Low | 追加 | 6 |

---

## 10. 成功指標（定量目標）

| 指標 | 現状 | Phase 1-2後 | Phase 3-4後 | 計測方法 |
|------|------|-----------|-----------|---------|
| URL→QAPreview到達率 | 0%（孤立） | 80%+ | 90%+ | QAPreview表示/URL解析完了 |
| 復習開始タップ数 | 3 | 1 | 1 | タップカウント |
| ホーム情報要素数 | 3 | 12+（モック仕様） | 15+ | UI要素カウント |
| 空状態CTA画面数 | 0/9 | 9/9 | 9/9 | 画面カウント |
| マスタリー確認タップ | 不可（∞） | 0（Home直表示） | 0 | タップカウント |
| セッション完了率 | 不明 | 80%+ | 85%+ | 完了画面到達/開始 |
| 7日継続率 | 不明 | 40%+ | 50%+ | ストリーク7+比率 |
| 1カード評価時間 | 不明 | 2秒以下 | 1.5秒以下 | タイムスタンプ差分 |

---

## 11. 技術的注意事項

### ⚠️ カラーシステム移行の判断

モックアップはBlue主体 (`#1A73E8`) をPrimary Action色として使用。
現アプリはAmber (`#C47F17`/`#F5A623`) がAccent。

**選択肢:**
- A: モック準拠でBlue主体に移行（30テーマ体系の再設計が必要）
- B: Amber主体を維持し、モックのBlue部分をAmberに置換（モックとの乖離）
- C: Blue=Action, Amber=Accent の二重アクセント（モック通り、新パターン）

→ **推奨: C案。** モックアップが既にBlue(アクション)+Amber(FABアクセント)+Green(成功)の3色を使い分けており、これがGoogle Calendar美学の核。30テーマはベース色（background/text）のバリエーションに限定し、Action色はBlue固定とする。

### ⚠️ QAPreview統合時のナビゲーション設計

URLImportList → QAPreview → (保存して復習開始) → ReviewScreen の3画面遷移。
ReviewScreen完了時は `navigation.popToTop()` でImportListまで戻す、
またはHomeに `navigation.reset()` で戻す。

### ⚠️ マスタリー集計クエリのパフォーマンス

reviewsテーブル全件スキャンになるため、カード1000件超で重くなる可能性。
対策:
- 集計結果をapp_settingsにキャッシュ（`mastery_cache`, `mastery_cache_at`）
- 復習完了時にキャッシュ無効化
- HomeScreenのuseFocusEffectでキャッシュ5分以内なら再計算しない

### ⚠️ 週間アクティビティのドット状態判定

モックアップの3状態:
- `wdot strong`（blue塗り + 白✓）: 10件以上復習した日
- `wdot done`（blue枠 + blue✓）: 1-9件復習した日
- `wdot today-ring`（blue枠のみ）: 今日（未復習）
- `wdot`（空）: 未実施の過去日

しきい値（strong/done境界 = 10件）はapp_settingsで調整可能にする。

### ⚠️ 通知テンプレートの状態依存性

expo-notificationsのスケジュール通知は`content`を事前固定するため、
当日朝の通知テキストを前日夜に決定する必要がある。
対策: 毎日のリマインダー時刻30分前にバックグラウンドタスクで通知内容を更新。

### ⚠️ モックアップのフォント

モックは`Google Sans`を使用しているが、Google Sansはライセンス制限あり。
React Native実装では`System`フォント（SF Pro）を使用し、
日本語は`Hiragino Sans`フォールバック（既存設計通り）。
視覚的にはGoogle SansとSF Proは近い印象を持つため、大きな乖離はない。

### ⚠️ 前提: uiux-improvement-plan.md との関係

既存の`uiux-improvement-plan.md`（2026-04-06）で定義された以下は引き続き有効:
- スワイプジェスチャー評価（1-A）: 既存ReviewCardに実装済み
- 評価時フィードバック（1-B）: 既存ReviewScreenに実装済み（フラッシュオーバーレイ）
- プログレスバー横バー（1-C）: 本ドキュメントの3-2で拡張
- セッション完了サマリー（1-D）: 本ドキュメントの3-3で拡張
- カードフラグ機能（1-E）: 引き続き有効
- Share Extension（2-A）: 本ドキュメントの1-4で再定義
- Shimmerローディング（2-B）: 引き続き有効（モックにもプログレスアニメーションあり）
- QAPreviewカードスタック（3-A）: モックではリスト+カード切替で確定

---

*最終更新: 2026-04-07*
