# TimeGrain 技術設計書

> 生成日: 2026-03-31
> ソース: requirements.md + Expo Go互換性調査

---

## 1. 技術スタック

### ランタイム・フレームワーク

| 項目 | 選定 | バージョン |
|------|------|-----------|
| **SDK** | Expo SDK 52+ | ~52.0 |
| **言語** | TypeScript | ~5.3 |
| **ルーティング** | Expo Router | v4 (file-based routing) |
| **JSエンジン** | Hermes | SDK 52デフォルト |

### ライブラリ一覧と選定理由

| ライブラリ | 用途 | 選定理由 | Expo Go対応 |
|-----------|------|---------|:-----------:|
| **expo-calendar** | カレンダー予定取得 | ScreenTime API代替。EventKit相当の機能をExpo Goで提供 | ✅ |
| **expo-sqlite** | ローカルDB | サーバー不要のローカル永続化。リレーショナルクエリで集計処理が容易 | ✅ |
| **expo-notifications** | ローカル通知 | 週次サマリー通知・レビュー誘導。ローカル通知のみ使用（push不要） | ✅ |
| **@shopify/react-native-skia** | 砂粒パーティクル描画 | Canvas APIで1440粒を60fpsレンダリング。GPU活用で高パフォーマンス | ✅ |
| **react-native-reanimated** | UIアニメーション | 砂粒の落下・画面遷移アニメーション。UIスレッドで直接実行し滑らかさ確保 | ✅ |
| **expo-haptics** | 触覚フィードバック | 砂粒タップ・カテゴリ割当時の触覚応答でUX向上 | ✅ |
| **zustand** | 状態管理 | 軽量（~1KB）・ボイラープレートなし。AsyncStorageで永続化可能 | ✅ |
| **date-fns** | 日付処理 | Tree-shakeable。週次集計・日付フォーマットに使用 | ✅ |

> **全ライブラリがExpo Go（SDK 52+）で動作確認済み。Development Buildは不要。**

### 注意事項

- `expo-sqlite`: SDK 52でlegacy APIが削除済み。現行API(`expo-sqlite`)を使用すること
- `@shopify/react-native-skia`: SDK 52対応にはv1.x系を使用。バージョン互換に注意
- `expo-notifications`: ローカル通知のみ使用（push通知はSDK 53以降でExpo Go非対応のため除外）
- `date-fns`: Hermes環境では`parseISO()`を明示使用。`new Date(string)`に依存しない

---

## 2. アーキテクチャ

### ディレクトリ構成

```
TimeGrain/
├── app/                          # Expo Router 画面定義
│   ├── _layout.tsx               # Root Layout（タブナビゲーション）
│   ├── index.tsx                 # ホーム画面（砂粒ビジュアライゼーション）
│   ├── weekly.tsx                # 週次サマリー画面
│   ├── detail/
│   │   └── [date].tsx            # 日次詳細画面（動的ルート）
│   └── settings/
│       ├── index.tsx             # 設定メイン
│       └── categories.tsx        # カテゴリ管理
├── components/                   # 共通コンポーネント
│   ├── GrainCanvas.tsx           # Skia砂粒キャンバス（再利用可能）
│   ├── TimeScoreBadge.tsx        # スコア表示バッジ
│   ├── CategoryTag.tsx           # カテゴリ色タグ
│   └── Header.tsx                # 共通ヘッダー
├── features/                     # 機能別モジュール
│   ├── grains/                   # 砂粒ビジュアライゼーション
│   │   ├── SandGrainCanvas.tsx   # 1440粒メインキャンバス
│   │   ├── GrainRenderer.ts     # 粒の描画ロジック
│   │   ├── GrainLayout.ts       # グリッド配置計算
│   │   └── GrainInteraction.ts  # タップ判定・ポップアップ
│   ├── calendar/                 # カレンダー連携
│   │   ├── CalendarSync.ts      # expo-calendar同期処理
│   │   ├── CategoryClassifier.ts # カテゴリ自動分類エンジン
│   │   └── GapDetector.ts       # 未分類時間帯検出
│   ├── score/                    # TimeScore算出
│   │   ├── TimeScoreCalculator.ts
│   │   └── ScoreHistory.ts
│   └── insights/                 # 週次インサイト
│       ├── InsightGenerator.ts   # 自然言語フィードバック生成
│       └── WeeklyAggregator.ts   # 週次集計
├── stores/                       # Zustand stores
│   ├── useTimeEntryStore.ts      # 時間エントリ状態
│   ├── useCategoryStore.ts       # カテゴリ状態
│   ├── useScoreStore.ts          # スコア状態
│   └── useSettingsStore.ts       # 設定状態
├── db/                           # SQLite スキーマ・クエリ
│   ├── schema.ts                 # テーブル定義・マイグレーション
│   ├── queries.ts                # CRUD操作
│   └── seed.ts                   # 初期データ（デフォルトカテゴリ）
├── utils/                        # ユーティリティ
│   ├── dateUtils.ts              # date-fnsラッパー
│   ├── colorUtils.ts             # カラー変換
│   └── permissions.ts            # カレンダー権限リクエスト
└── constants/                    # 定数・カラー定義
    ├── colors.ts                 # カテゴリカラーパレット
    ├── categories.ts             # デフォルトカテゴリ定義
    └── config.ts                 # アプリ設定定数
```

### コンポーネント依存関係

```
┌──────────────────────────────────────────────────────┐
│                    app/ (画面層)                       │
│  index.tsx ─── weekly.tsx ─── [date].tsx ─── settings │
└──────┬───────────┬──────────────┬──────────┬─────────┘
       │           │              │          │
       ▼           ▼              ▼          ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ grains/  │ │ insights/│ │ calendar/│ │ score/   │
│          │ │          │ │          │ │          │
│ SandGrain│ │ Weekly   │ │ Calendar │ │ TimeScore│
│ Canvas   │ │ Aggregat │ │ Sync     │ │ Calculat │
│ GrainRen │ │ Insight  │ │ Category │ │ ScoreHis │
│ GrainLay │ │ Generat  │ │ Classif  │ │          │
│ GrainInt │ │          │ │ GapDetec │ │          │
└────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘
     │            │             │             │
     ▼            ▼             ▼             ▼
┌──────────────────────────────────────────────────────┐
│               stores/ (Zustand 状態管理層)             │
│  useTimeEntryStore ── useCategoryStore ── useScore   │
└──────────────────────────┬───────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────┐
│                   db/ (SQLite データ層)                │
│          schema.ts ── queries.ts ── seed.ts          │
└──────────────────────────────────────────────────────┘
```

### データフロー

```
【起動時・フォアグラウンド復帰時】

  expo-calendar API ──取得──▶ カレンダー予定一覧
                                    │
                              CategoryClassifier
                              （キーワードマッチング）
                                    │
                              ┌─────┴─────┐
                              │           │
                         分類成功      未分類
                              │           │
                              ▼           ▼
                    time_entries       time_entries
                    (source:calendar)  (source:calendar)
                    (category_id:N)   (category_id:null)
                              │           │
                              └─────┬─────┘
                                    │
                              DB保存 (SQLite)
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
              GrainRenderer   TimeScoreCalc   InsightGenerator
              (Skia Canvas)   (加重平均)      (差分比較)
                    │               │               │
                    ▼               ▼               ▼
              砂粒表示          スコア表示      週次サマリー

【ユーザー操作時】

  未分類砂粒タップ ──▶ カテゴリ選択UI ──▶ time_entries更新
       │                                        │
       ▼                                        ▼
  user_mappings テーブル更新          砂粒色変更 + TimeScore再計算
  （学習データ蓄積）
```

---

## 3. データ設計

### SQLiteスキーマ

```sql
-- カテゴリマスタ
CREATE TABLE categories (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  name              TEXT    NOT NULL,           -- 「仕事」「休息」「移動」等
  color             TEXT    NOT NULL,           -- HEXカラー「#1A4B8C」
  icon              TEXT    NOT NULL DEFAULT 'circle', -- アイコン名
  is_active_attention INTEGER NOT NULL DEFAULT 0, -- 1=能動的注意, 0=受動的注意
  sort_order        INTEGER NOT NULL DEFAULT 0,
  created_at        TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- 時間エントリ（1分単位）
CREATE TABLE time_entries (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  date              TEXT    NOT NULL,           -- 'YYYY-MM-DD'
  start_time        TEXT    NOT NULL,           -- 'HH:MM'
  end_time          TEXT    NOT NULL,           -- 'HH:MM'
  category_id       INTEGER,                    -- FK → categories.id（NULL=未分類）
  source            TEXT    NOT NULL DEFAULT 'calendar', -- 'calendar' | 'manual'
  calendar_event_id TEXT,                       -- expo-calendarのeventId
  calendar_title    TEXT,                       -- 元のカレンダー予定タイトル
  created_at        TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- ユーザー手動分類の学習データ
CREATE TABLE user_mappings (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword           TEXT    NOT NULL,           -- カレンダー予定から抽出したキーワード
  category_id       INTEGER NOT NULL,           -- ユーザーが割り当てたカテゴリ
  hit_count         INTEGER NOT NULL DEFAULT 1, -- マッチ回数（信頼度の指標）
  created_at        TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (category_id) REFERENCES categories(id),
  UNIQUE(keyword, category_id)
);

-- 日次スコア（キャッシュ）
CREATE TABLE daily_scores (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  date              TEXT    NOT NULL UNIQUE,    -- 'YYYY-MM-DD'
  time_score        REAL    NOT NULL,           -- 0.0〜100.0
  active_minutes    INTEGER NOT NULL DEFAULT 0, -- 能動的注意の合計分
  passive_minutes   INTEGER NOT NULL DEFAULT 0, -- 受動的注意の合計分
  unclassified_minutes INTEGER NOT NULL DEFAULT 0,
  switching_count   INTEGER NOT NULL DEFAULT 0, -- カテゴリ切替回数
  plan_adherence    REAL    NOT NULL DEFAULT 0, -- 計画一致率 0.0〜1.0
  updated_at        TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- 設定KVS
CREATE TABLE settings (
  key               TEXT    PRIMARY KEY,
  value             TEXT    NOT NULL
);

-- インデックス
CREATE INDEX idx_time_entries_date ON time_entries(date);
CREATE INDEX idx_time_entries_category ON time_entries(category_id);
CREATE INDEX idx_daily_scores_date ON daily_scores(date);
CREATE INDEX idx_user_mappings_keyword ON user_mappings(keyword);
```

### TypeScript型定義

```typescript
// db/types.ts

export interface Category {
  id: number;
  name: string;
  color: string;           // HEX e.g. '#1A4B8C'
  icon: string;
  isActiveAttention: boolean;
  sortOrder: number;
}

export interface TimeEntry {
  id: number;
  date: string;            // 'YYYY-MM-DD'
  startTime: string;       // 'HH:MM'
  endTime: string;         // 'HH:MM'
  categoryId: number | null;
  source: 'calendar' | 'manual';
  calendarEventId: string | null;
  calendarTitle: string | null;
}

export interface UserMapping {
  id: number;
  keyword: string;
  categoryId: number;
  hitCount: number;
}

export interface DailyScore {
  id: number;
  date: string;
  timeScore: number;       // 0〜100
  activeMinutes: number;
  passiveMinutes: number;
  unclassifiedMinutes: number;
  switchingCount: number;
  planAdherence: number;   // 0.0〜1.0
}

// 砂粒1粒の表現
export interface Grain {
  minute: number;          // 0〜1439（0:00からの経過分）
  categoryId: number | null;
  color: string;
  isActiveAttention: boolean;
  source: 'calendar' | 'manual';
}
```

### デフォルトカテゴリ（seed.ts）

```typescript
export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: '仕事・集中',  color: '#1A4B8C', icon: 'briefcase',    isActiveAttention: true,  sortOrder: 0 },
  { name: '会議',        color: '#2E86C1', icon: 'users',        isActiveAttention: true,  sortOrder: 1 },
  { name: '休息・食事',  color: '#2E7D4F', icon: 'coffee',       isActiveAttention: false, sortOrder: 2 },
  { name: '移動',        color: '#E07B30', icon: 'navigation',   isActiveAttention: false, sortOrder: 3 },
  { name: 'SNS・娯楽',   color: '#C0392B', icon: 'smartphone',   isActiveAttention: false, sortOrder: 4 },
  { name: '運動',        color: '#8E44AD', icon: 'activity',     isActiveAttention: true,  sortOrder: 5 },
  { name: '学習',        color: '#F39C12', icon: 'book-open',    isActiveAttention: true,  sortOrder: 6 },
  { name: '睡眠',        color: '#34495E', icon: 'moon',         isActiveAttention: false, sortOrder: 7 },
];
```

### カテゴリ自動分類ロジック

```typescript
// features/calendar/CategoryClassifier.ts

/**
 * 2段階の分類アルゴリズム:
 * 1. user_mappings テーブル（ユーザー学習データ）を優先検索
 * 2. ヒットしなければデフォルトキーワードルールで分類
 */

// デフォルトキーワードマッピング（初期状態）
const DEFAULT_RULES: { pattern: RegExp; categoryName: string }[] = [
  // 仕事・集中
  { pattern: /開発|コーディング|実装|レビュー|デプロイ|コード|プログラ|設計/i, categoryName: '仕事・集中' },
  { pattern: /執筆|ライティング|記事|ブログ|原稿|資料作成/i,               categoryName: '仕事・集中' },
  { pattern: /デザイン|Figma|figma|UI|UX/i,                              categoryName: '仕事・集中' },

  // 会議
  { pattern: /会議|MTG|mtg|ミーティング|打合せ|打ち合わせ|面談|1on1|定例/i, categoryName: '会議' },
  { pattern: /zoom|Zoom|ZOOM|Teams|teams|meet|Meet|Slack huddle/i,       categoryName: '会議' },

  // 休息・食事
  { pattern: /ランチ|昼食|夕食|朝食|食事|休憩|カフェ|ブレイク/i,           categoryName: '休息・食事' },

  // 移動
  { pattern: /移動|通勤|出社|帰宅|電車|タクシー|フライト|新幹線/i,         categoryName: '移動' },

  // 運動
  { pattern: /ジム|筋トレ|ランニング|ヨガ|ウォーキング|散歩|運動|スポーツ/i, categoryName: '運動' },

  // 学習
  { pattern: /勉強|学習|セミナー|研修|講座|読書|輪読|もくもく/i,           categoryName: '学習' },
];

/**
 * 分類フロー:
 * 1. calendarTitle を正規化（trim + 全角→半角）
 * 2. user_mappings を keyword LIKE '%title%' で検索（hit_count降順）
 * 3. ヒットすれば → そのcategory_id を返す
 * 4. ヒットしなければ → DEFAULT_RULES を順に走査
 * 5. どれにもマッチしなければ → null（未分類）
 */
```

### ユーザー学習の仕組み

```
ユーザーが未分類の砂粒をタップ → カテゴリ選択
    │
    ├─ time_entries.category_id を更新
    │
    └─ user_mappings に INSERT or UPDATE
       keyword = カレンダー予定タイトルから抽出した主要語
       category_id = 選択されたカテゴリ
       hit_count += 1（既存なら）

次回以降、同じキーワードを含む予定は自動分類される
→ 使うほど精度が向上する「育てる」体験
```

---

## 4. 画面設計

### ナビゲーション構造

```
TabNavigator (Expo Router Layout)
├── Tab 1: ホーム（Today）        → app/index.tsx
├── Tab 2: 週次サマリー           → app/weekly.tsx
└── Tab 3: 設定                  → app/settings/index.tsx

Modal / Stack:
├── 日次詳細                     → app/detail/[date].tsx
└── カテゴリ管理                  → app/settings/categories.tsx
```

### 画面1: ホーム（Today）— `app/index.tsx`

**責務:** 今日の時間を1440粒の砂粒で可視化。一目で1日を俯瞰。

| コンポーネント | 責務 | 状態 |
|--------------|------|------|
| **SandGrainCanvas** | Skiaで1440粒をグリッド描画。カテゴリ色で色分け | `useTimeEntryStore` → 今日のGrain[] |
| **TimeScoreBadge** | 今日のTimeScoreを円形バッジで表示（0〜100） | `useScoreStore` → todayScore |
| **CategoryLegend** | 色凡例。タップでそのカテゴリをハイライト | `useCategoryStore` → categories[] |
| **QuickStats** | 「能動 5h12m / 受動 2h30m / 未分類 1h18m」 | `useTimeEntryStore` → 集計値 |

**主要インタラクション:**
- 砂粒タップ → その時間帯の詳細ポップアップ（カテゴリ名・時刻・カレンダー予定名）
- 未分類砂粒タップ → カテゴリ選択ボトムシート（GrainTapEditor）
- 日付スワイプ → 前日/翌日に切替（reanimated遷移）
- TimeScoreBadgeタップ → スコア内訳のツールチップ

### 画面2: 週次サマリー — `app/weekly.tsx`

**責務:** 7日間の傾向を把握。パターン発見を支援。

| コンポーネント | 責務 | 状態 |
|--------------|------|------|
| **WeeklyScoreChart** | 7日間のTimeScoreを棒グラフで表示 | `useScoreStore` → weekScores[] |
| **CategoryBreakdown** | カテゴリ別の時間配分を横棒グラフで表示 | `useTimeEntryStore` → 週次集計 |
| **InsightCard** | 自然言語フィードバック（「先週より深い仕事が2.3h増」） | `InsightGenerator`の出力 |
| **MiniGrainGrid** | 各日の砂粒を縮小表示（タップで日次詳細へ） | `useTimeEntryStore` → 7日分 |

**主要インタラクション:**
- 日の棒グラフタップ → `detail/[date]` へ遷移
- 週スワイプ → 前週/翌週に切替
- InsightCardの「詳しく見る」→ 該当日の詳細へ

### 画面3: 日次詳細 — `app/detail/[date].tsx`

**責務:** 特定日の24時間タイムラインと未分類時間の編集。

| コンポーネント | 責務 | 状態 |
|--------------|------|------|
| **TimelineView** | 24時間を縦軸タイムラインで表示。カテゴリ色帯 | `useTimeEntryStore` → 該当日entries |
| **GrainTapEditor** | 未分類時間帯のカテゴリ割当UI。ボトムシート | 選択中のTimeEntry |
| **DayScoreSummary** | その日のTimeScore + 内訳 | `useScoreStore` → 該当日 |
| **CalendarEventList** | 元のカレンダー予定リスト（分類結果を確認） | `CalendarSync`から取得 |

**GrainTapEditorの動作:**
1. 未分類の時間帯をタップ
2. ボトムシートが出現（カテゴリ一覧をカラータイルで表示）
3. カテゴリをタップ → 即座に割当（確認ダイアログなし。取消はシェイクで）
4. 割当と同時に `user_mappings` を更新（学習）
5. 触覚フィードバック（expo-haptics）

### 画面4: 設定 — `app/settings/index.tsx`

**責務:** 最小限の設定。初期設定ゼロの方針を維持。

| コンポーネント | 責務 |
|--------------|------|
| **CalendarPermission** | カレンダー権限の状態表示・再リクエスト |
| **NotificationToggle** | 週次サマリー通知のON/OFF・時刻設定 |
| **CategoryManagerLink** | カテゴリ管理画面への遷移 |
| **DataExport** | CSV出力（将来のProクライアントパックへの導線） |
| **AppInfo** | バージョン・ライセンス・プライバシーポリシー |

### 画面5: カテゴリ管理 — `app/settings/categories.tsx`

**責務:** カテゴリの追加・編集・削除・キーワード確認。

| コンポーネント | 責務 |
|--------------|------|
| **CategoryList** | ドラッグで並び替え可能なカテゴリ一覧 |
| **CategoryEditor** | 名前・色・アイコン・能動/受動の編集 |
| **KeywordPreview** | このカテゴリに紐づく学習済みキーワード一覧 |

---

## 5. 砂粒アニメーション実装方針

### レンダリングアーキテクチャ

```
@shopify/react-native-skia
├── Canvas（フルスクリーン）
│   ├── Group（砂時計上半分 — 未経過の時間）
│   │   └── Circle × N粒（グリッド配置）
│   ├── Group（砂時計下半分 — 経過した時間）
│   │   └── Circle × M粒（グリッド配置）
│   └── Path（砂時計フレーム — 装飾線）
└── GestureDetector（タップ判定）
```

### グリッド配置アルゴリズム

```typescript
// features/grains/GrainLayout.ts

/**
 * 1440粒をグリッドに配置する計算
 *
 * 画面幅に応じて列数を決定:
 *   - iPhone SE (375pt): 40列 × 36行 = 1440粒, 粒径 ≈ 7pt
 *   - iPhone 15 (393pt): 40列 × 36行 = 1440粒, 粒径 ≈ 7.5pt
 *   - iPhone 15 Pro Max (430pt): 43列 × 34行 ≈ 1462粒, 粒径 ≈ 7.5pt
 *
 * 粒の配置:
 *   x = col * (grainSize + gap) + offsetX
 *   y = row * (grainSize + gap) + offsetY
 *
 * 粒径: 6〜8pt（画面幅に応じて動的計算）
 * 粒間隔: 1〜2pt
 */

const GRAIN_COUNT = 1440;

function calculateLayout(screenWidth: number, screenHeight: number) {
  const grainSize = Math.floor(screenWidth / 52);  // ≈ 7pt
  const gap = 1;
  const cols = Math.floor(screenWidth / (grainSize + gap));
  const rows = Math.ceil(GRAIN_COUNT / cols);
  return { grainSize, gap, cols, rows };
}
```

### 砂時計メタファーの動き

```
時間経過の表現:
  - 現在時刻を境に「上半分=未経過」「下半分=経過済み」に分割
  - 経過した分の粒が上→下にパラパラと落下するアニメーション
  - 落下アニメーション: Reanimated の withTiming で Y座標を補間（duration: 800ms, easing: easeInQuad）
  - 毎分1粒が落下（リアルタイム更新はAppState.addEventListener で管理）

砂粒の落下物理:
  - 重力感: easeInQuad（加速→着地）
  - 着地時に微小バウンド（withSpring: damping 15, stiffness 200）
  - 着地時にexpo-haptics.impactAsync(Light)
```

### パフォーマンス最適化

| 手法 | 効果 |
|------|------|
| **Skia Canvasで一括描画** | 1440個のRNコンポーネントではなく、1つのCanvasで描画。レイヤー数を激減 |
| **色でバッチ描画** | 同一カテゴリの粒をまとめてPaint1回で描画（drawCircle × N ではなく drawPoints） |
| **変更差分のみ再描画** | useDerivedValue で変更があった粒のみアニメーション発火 |
| **オフスクリーンバッファ** | 静的な粒（=既にカテゴリ確定済み）は Picture にキャッシュ |
| **タップ判定の空間インデックス** | グリッドベースなので `Math.floor(x/cellSize)` で O(1) ヒットテスト |

**パフォーマンス目標:** 60fps維持（iPhone SE 第3世代以降）

### タップインタラクション

```
1. GestureDetector の onTapGesture で座標取得
2. GrainLayout から該当する minute (0〜1439) を O(1) で特定
3. 該当 TimeEntry を DB から取得
4. ポップアップ表示:
   ┌─────────────────────────┐
   │ 14:30 - 15:00           │
   │ 🔵 仕事・集中            │
   │ 「API設計レビュー」       │  ← カレンダー予定タイトル
   └─────────────────────────┘
5. 未分類の場合はポップアップの代わりにカテゴリ選択ボトムシートを表示
```

---

## 6. TimeScore算出ロジック

### 基本式

```
TimeScore = (active_ratio × 40) + (low_switch × 30) + (plan_adherence × 30)
```

**スコアレンジ:** 0〜100点（小数第1位まで）

### 各要素の定義

#### active_ratio（能動的注意比率）— 配点40点

```typescript
/**
 * 記録済み時間のうち、能動的注意カテゴリの割合
 *
 * active_ratio = active_minutes / (active_minutes + passive_minutes)
 *
 * ※ unclassified_minutes は分母に含めない（未分類が多いとペナルティではなく中立）
 * ※ 記録時間が0の場合は 0.5（中立値）とする
 *
 * 正規化: そのまま 0.0〜1.0 で使用
 * 得点: active_ratio × 40
 */
```

| active_ratio | 得点 | 解釈 |
|:------------:|:----:|------|
| 1.0 | 40 | 全時間が能動的注意（理想的だが非現実的） |
| 0.7 | 28 | 良好。深い仕事が7割 |
| 0.5 | 20 | 平均的 |
| 0.3 | 12 | 受動的時間が多い |

#### low_switch（低スイッチング率）— 配点30点

```typescript
/**
 * カテゴリの切替回数が少ないほど高スコア
 * =「長時間集中できた」ことを評価
 *
 * switching_count: 1日の中でカテゴリが変わった回数
 * baseline: 20回（1日の平均的な切替回数の想定値）
 *
 * low_switch = max(0, 1 - (switching_count / baseline))
 *
 * 得点: low_switch × 30
 */
```

| switching_count | low_switch | 得点 | 解釈 |
|:--------------:|:----------:|:----:|------|
| 5 | 0.75 | 22.5 | 優秀。長時間集中ブロックが多い |
| 10 | 0.50 | 15.0 | 平均的 |
| 20 | 0.00 | 0.0 | 頻繁な切替。マルチタスク過多 |
| 30 | 0.00 | 0.0 | クリップ（負にならない） |

#### plan_adherence（計画一致率）— 配点30点

```typescript
/**
 * カレンダーに予定があった時間帯のうち、
 * 実際にその予定通りの時間を過ごした割合
 *
 * 判定方法:
 *   カレンダー予定の時間帯 → time_entries でカテゴリが割当済み = 「予定通り」とみなす
 *   （予定の内容まではマッチングしない。予定があった時間帯が空白でないことを評価）
 *
 * plan_adherence = classified_calendar_minutes / total_calendar_minutes
 *
 * ※ カレンダー予定が0件の場合は 0.5（中立値）
 *
 * 得点: plan_adherence × 30
 */
```

### スコア閾値とフィードバック

| スコア帯 | ラベル | 砂粒演出 | フィードバック例 |
|:--------:|--------|---------|----------------|
| 80〜100 | Excellent | ゴールド砂粒 | 「素晴らしい集中日。この調子を維持しましょう」 |
| 60〜79 | Good | 通常色 | 「良い1日。午後のSNS時間を減らすとさらに向上」 |
| 40〜59 | Average | 通常色 | 「会議が多い日でした。明日は集中ブロックを確保しましょう」 |
| 0〜39 | Low | 通常色（灰色多め） | 「リフレッシュ日として割り切るのも大切です」 |

### スコア算出タイミング

```
1. フォアグラウンド復帰時: カレンダー同期 → 全エントリ再計算 → daily_scores 更新
2. カテゴリ手動割当時: 該当日のスコアを差分再計算
3. 23:55のローカル通知: 1日の最終スコアを通知（設定でON/OFF可）
```

---

## 7. ビルド・リリース戦略

### 開発〜リリースフロー

```
開発         Expo Go でプレビュー（実機 + シミュレータ）
    │
テスト       Jest + React Native Testing Library
    │
ビルド       EAS Build（iOS: ipa生成）
    │
内部テスト   TestFlight配布（EAS Submit → App Store Connect）
    │
審査提出     EAS Submit → App Store Review
    │
リリース     App Store公開（¥980 買い切り）
    │
アップデート  EAS Update（OTA）で即時配信（ネイティブ変更時のみEAS Build）
```

### 保守費ゼロの内訳

| 項目 | サービス | 費用 | 備考 |
|------|---------|:----:|------|
| **開発プレビュー** | Expo Go | 無料 | 実機で即座にプレビュー |
| **ビルド** | EAS Build | 無料 | 無料枠: 月30ビルド（個人開発には十分） |
| **App Store提出** | EAS Submit | 無料 | Apple Developer Program（¥15,800/年）は別途必要 |
| **OTAアップデート** | EAS Update | 無料 | 無料枠: 月1,000ユーザーまで |
| **CI/CD** | GitHub Actions | 無料 | 無料枠: 月2,000分（publicリポジトリは無制限） |
| **サーバー** | なし | ¥0 | 全データローカル処理。サーバー不要 |
| **データベース** | expo-sqlite（端末内） | ¥0 | クラウドDB不要 |
| **プッシュ通知** | expo-notifications（ローカル） | ¥0 | プッシュサーバー不要 |
| **分析・クラッシュ** | なし（MVP時点） | ¥0 | 将来必要に応じてSentry無料枠を検討 |
| **合計月額** | — | **¥0** | Apple Developer Program年会費のみ別途 |

> **固定費:** Apple Developer Program ¥15,800/年（≈ ¥1,317/月）のみ。これはApp Store公開の必須費用であり、アプリの保守費ではない。

### App Store審査対策

| 審査ポイント | 対策 |
|-------------|------|
| **プライバシー** | 全データがデバイス内完結。サーバー通信なし。App Privacy欄は「Data Not Collected」 |
| **カレンダー権限** | 使用目的を明記（NSCalendarsUsageDescription: 「カレンダーの予定を読み取り、時間の使い方を自動で可視化します」） |
| **最小機能要件** | 砂粒UI + TimeScore + 週次サマリーでApp Store Reviewガイドライン4.2（Minimum Functionality）をクリア |

---

## 8. 開発ロードマップ

### Phase 1（1ヶ月目）: MVP — データ基盤 + 基本画面

**ゴール:** カレンダーから時間データを取得し、タイムラインとして表示。最低限動作するアプリ。

| 週 | タスク | 成果物 |
|:--:|--------|--------|
| **W1** | プロジェクト初期化 + SQLiteセットアップ | Expo Router + DB + デフォルトカテゴリのseed |
| **W1** | expo-calendar連携 | カレンダー権限取得 → 予定一覧取得 → time_entries保存 |
| **W2** | カテゴリ自動分類エンジン | CategoryClassifier（正規表現マッチング + user_mappings） |
| **W2** | ホーム画面（簡易版） | カテゴリ別の色付きタイムライン（砂粒の代わりに棒グラフ） |
| **W3** | 日次詳細画面 | 24時間タイムライン + GrainTapEditor（カテゴリ手動割当） |
| **W3** | ユーザー学習機能 | 手動割当 → user_mappings更新 → 次回から自動分類 |
| **W4** | 設定画面 + カテゴリ管理 | カテゴリCRUD + カレンダー権限管理 |
| **W4** | E2Eテスト + バグ修正 | 基本フロー動作確認 |

**Phase 1完了基準:** カレンダー予定が自動分類されてタイムラインに表示。未分類時間を手動で割当可能。

---

### Phase 2（2ヶ月目）: コアUX — 砂粒 + スコア

**ゴール:** TimeGrainの差別化要素（砂粒UI + TimeScore）を実装。「見せたくなる」アプリに。

| 週 | タスク | 成果物 |
|:--:|--------|--------|
| **W5** | Skia砂粒レンダリング基盤 | GrainLayout + GrainRenderer（1440粒のグリッド描画） |
| **W5** | 砂粒カテゴリ色マッピング | time_entries → Grain[] → Canvas描画パイプライン |
| **W6** | 砂粒タップインタラクション | O(1)ヒットテスト + ポップアップ + カテゴリ割当ボトムシート |
| **W6** | 砂時計落下アニメーション | 時間経過で粒が落下。Reanimated + Spring物理 |
| **W7** | TimeScore算出エンジン | TimeScoreCalculator + daily_scoresテーブル |
| **W7** | TimeScoreBadge + ゴールド砂粒演出 | スコア80以上で砂粒がゴールドに変化 |
| **W8** | 週次サマリー画面 | WeeklyScoreChart + CategoryBreakdown + MiniGrainGrid |
| **W8** | パフォーマンス最適化 | バッチ描画 + Pictureキャッシュ。60fps確認 |

**Phase 2完了基準:** 砂粒UIでの1日可視化が動作。TimeScoreが算出・表示。週次サマリーで7日間の傾向が確認可能。

---

### Phase 3（3ヶ月目）: 仕上げ — 通知 + ポリッシュ + リリース

**ゴール:** App Storeに提出可能な品質。レビューを獲得できるUX。

| 週 | タスク | 成果物 |
|:--:|--------|--------|
| **W9** | 週次インサイト生成 | InsightGenerator（自然言語フィードバック） |
| **W9** | ローカル通知 | 週次サマリー通知 + レビュー誘導通知（7日後 / スコア70超時） |
| **W10** | ダークモード対応 | useColorScheme + カラートークン全画面適用 |
| **W10** | オンボーディング | カレンダー権限のみの1ステップ。3秒で完了 |
| **W11** | UIポリッシュ + アニメーション調整 | 画面遷移・マイクロインタラクション・触覚フィードバック |
| **W11** | テスト強化 | ユニットテスト + 手動テスト + TestFlight配布 |
| **W12** | App Store準備 | スクリーンショット作成・説明文・プライバシーポリシー |
| **W12** | EAS Build + Submit | ipa生成 → App Store審査提出 |

**Phase 3完了基準:** App Store審査通過。¥980で販売開始。

---

### マイルストーンサマリー

```
Month 1 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ MVP（データ基盤 + 基本画面）
         W1        W2        W3        W4
         DB+Cal    分類      詳細      設定

Month 2 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ コアUX（砂粒 + スコア）
         W5        W6        W7        W8
         Skia基盤  タップ    Score     週次

Month 3 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ リリース（通知 + ポリッシュ）
         W9        W10       W11       W12
         Insight   Dark      Polish    Submit
```
