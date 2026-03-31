# ReCallKit — 統合設計書

> 作成日: 2026-03-31
> バージョン: 1.0
> ステータス: 設計完了 → 実装準備可能
> 出典: requirements.md / ios-uiux-spec.md / architecture.md / app-ideas-market-a.md

---

## 1. エグゼクティブサマリー

**ReCallKit（リコールキット）** は、「読んだ・見た・聞いた知識をゼロ手間で保存し、SM-2間隔反復で確実に記憶に定着させる」iOS買い切りアプリである。Readwise（月$8.99）に対して¥1,200の一括払いで永久使用できる「サブスク疲れ」層向け代替として、PKM市場の空白地帯を狙う。

| 項目 | 内容 |
|------|------|
| **ポジショニング** | Readwiseの買い切り代替（「2ヶ月分以下で永久使用」） |
| **ターゲット** | PKMユーザー・Readwise課金経験者・インプット系ユーザー |
| **価格** | ¥1,200（買い切り）+ IAP（¥490 / ¥250） |
| **技術スタック** | Expo Go (SDK 52) + React Native + TypeScript |
| **保守費** | 0円（サーバーレス・ローカルファースト・外部API不使用） |
| **市場スコア** | 81点 / 100点（即実行推奨ライン突破。5アイデア中1位） |
| **デザイン思想** | MA（間）主軸 — 余白重視・コンテンツファースト・装飾抑制 |
| **アクセントカラー** | Recall Amber（Light: `#C47F17` / Dark: `#F5A623`） |

### コアバリュー

```
ゼロ手間保存 × SM-2間隔反復 × 日本語最適化 × 買い切り¥1,200
```

この4要素の組み合わせが競合のいない空白地帯を形成する。

---

## 2. 市場分析サマリー

### 2.1 TAM / SAM / SOM

| 区分 | 規模 | 算出根拠 |
|------|------|---------|
| **TAM** | 約¥1兆2,000億円/年（グローバル） | ナレッジ管理・学習テクノロジー市場。Evernote/Notion/ReadwiseがPKM市場を急成長させている |
| **SAM** | 約¥72億円/年（日本） | 国内iPhone利用の「学習系・情報収集系アプリ」ユーザー推計600万人 × 年間平均支出¥1,200 |
| **SOM** | 約¥490万円/年（初年度） | Readwiseユーザー推計国内3万人の10%転換 + note/Xオーガニック経由。月350DL × ¥1,200 × 12ヶ月 |

**グローバル展開可能性:** 高。SM-2アルゴリズム・Share Extensionは英語圏でも即通用。

### 2.2 競合ポジショニングマップ

```
        知識定着機能（高）
               ▲
    Anki       │    ★ ReCallKit（目標ポジション）
    [作成コスト│    [ゼロ手間保存 + 間隔反復]
     高い]     │
               │
カジュアル─────┼─────────────パワーユーザー
               │
  GoodLinks    │    Obsidian
  Reeder       │    [高機能・複雑]
               ▼
        知識定着機能（低）
```

**差別化の空白地帯:** 「ゼロ手間保存 × 間隔反復 × 日本語最適化 × 買い切り」の象限が空白。

### 2.3 競合比較

| 競合 | 価格 | 評価 | 強み | 弱み |
|------|------|:----:|------|------|
| **Readwise** | $8.99/月 | ★4.8 | Kindle連携 | 月額高い・日本語弱い |
| **Anki** | ¥3,680(iOS) | ★4.7 | 完全カスタマイズ | カード手作り必須・UI古い |
| **GoodLinks** | ¥490 | ★4.5 | シンプル管理 | 復習機能ゼロ |
| **Reeder 5** | ¥1,500 | ★4.6 | 美しいUI | 復習機能なし |
| **Obsidian** | 無料(sync有料) | ★4.6 | グラフUI | モバイル操作困難 |

### 2.4 ERRC差別化グリッド

| アクション | ReCallKitの施策 |
|-----------|---------------|
| **Eliminate（排除）** | Kindle連携、ソーシャル共有、複雑なフォルダ管理、カード手作りフロー |
| **Reduce（削減）** | SM-2パラメータ手動調整、復習頻度カスタマイズ → デフォルト最適化「毎朝8時に5件」 |
| **Raise（引き上げ）** | 日本語対応精度、スクショOCR精度、Share Extension使いやすさ |
| **Create（創造）** | ナレッジマップ、QuizMode（能動的想起）、学びジャーナル、Weekly Discovery |

### 2.5 Cagan 4リスクチェック

| リスク種別 | 評価 | 詳細 |
|-----------|:----:|------|
| **Value Risk** | ✅ 低 | Readwise課金経験者の実需あり。「¥1,200で永久使用」はサブスク疲れ層に即響く |
| **Usability Risk** | ✅ 低 | Share Extensionで既存行動フロー。復習は通知タップのみ。AnkiのUXペイン解消 |
| **Feasibility Risk** | ✅ 低 | iOS標準APIのみ。サーバーレス。AI不要 |
| **Viability Risk** | ⚠️ 要注意 | Readwiseの日本語対応強化・価格下落リスク。差別化維持の継続投資が必要 |

---

## 3. 機能仕様

### 3.1 MVP機能（Phase 1 — Expo Go）

| 機能 | 概要 | 含む | 含まない |
|------|------|------|---------|
| **アイテム保存** | クリップボード検知 + 手動入力 | URLペースト、テキスト入力、クリップボードURL自動検出 | Share Extension、OCR |
| **SM-2復習** | 3段階簡易評価 | 忘れた(q=1)/難しい(q=3)/覚えてた(q=5)、毎朝8時×5件 | パラメータ手動調整 |
| **通知** | 毎日の復習リマインダー | expo-notifications スケジュール通知 | カスタム通知音 |
| **ライブラリ** | 保存アイテム管理 | 一覧表示、テキスト検索、タグフィルタ | ソート切替（MVP後） |
| **自動タグ** | 軽量キーワード抽出 | URLドメイン推定、タイトルキーワード、手動タグ編集 | NLP高精度解析 |
| **テーマ** | ライト/ダーク | システム連動自動切替 | カスタムテーマ |
| **データ管理** | JSONエクスポート | expo-file-system経由 | iCloud同期、インポート |
| **オンボーディング** | 4ステップチュートリアル | 忘却曲線説明、通知許可(Just-in-Time) | — |

### 3.2 拡張機能（Phase 2以降 — EAS Build移行後）

| 機能 | 必要パッケージ | 優先度 |
|------|-------------|:-----:|
| **Share Extension** | `expo-share-extension` + Config Plugin | 高 |
| **Vision OCR** | `react-native-text-recognition` / ML Kit | 高 |
| **ナレッジマップ** | `react-native-svg`（自前force-directed） | 中 |
| **QuizMode** | 純TypeScript（穴埋めクイズ自動生成） | 中 |
| **学びジャーナル** | — | 中 |
| **RevenueCat課金** | `react-native-purchases` | 中 |
| **WidgetKit** | `react-native-widget-extension` | 低 |
| **iCloud同期** | CloudKit Bridging | 低 |
| **App Intents** | `expo-apple-targets` | 低 |

### 3.3 Expo Go制約と代替策

| 要件機能 | Expo Go対応 | MVP代替策 |
|---------|:-----------:|----------|
| Share Extension | ❌ | `expo-clipboard`で自動検出。起動時にクリップボードURLを検知し「保存しますか？」バナー表示 |
| Vision OCR | ❌ | MVP対象外。EAS Build移行時に対応 |
| NaturalLanguage自動タグ | ❌ | 正規表現ベースの軽量キーワード抽出（`textTagger.ts`） |
| Core Data | ❌ | `expo-sqlite`で完全代替 |
| SwiftUI グラフ | ❌ | `react-native-svg`でforce-directedグラフを自前実装 |
| バックグラウンド実行 | ⚠️ 制限 | フォアグラウンド復帰時に復習スケジュール再計算 |

#### クリップボード検知フロー（Share Extension代替）

```
[ユーザー] ブラウザでURLコピー
    ↓
[ユーザー] ReCallKitを開く
    ↓
[アプリ] AppState='active' イベントで起動検知
    ↓
[アプリ] expo-clipboard でクリップボード読み取り
    ↓
[アプリ] URL形式を検出?
    ├── YES → 画面上部にバナー「このURLを保存しますか？」
    │         ├── [保存] → アイテム追加 → バナー消去
    │         └── [無視] → バナー消去
    └── NO → 何もしない
```

---

## 4. 技術アーキテクチャ

### 4.1 ディレクトリ構成

```
apps/ReCallKit/
├── App.tsx                        # エントリポイント（Provider階層）
├── app.json                       # Expo設定
├── package.json
├── tsconfig.json
├── index.ts                       # registerRootComponent
├── src/
│   ├── db/
│   │   ├── schema.ts              # SQLiteテーブル定義・マイグレーション
│   │   ├── connection.ts          # DB接続シングルトン
│   │   ├── itemRepository.ts      # アイテムCRUD
│   │   ├── reviewRepository.ts    # 復習スケジュールCRUD
│   │   └── tagRepository.ts       # タグCRUD
│   ├── sm2/
│   │   └── algorithm.ts           # SM-2間隔反復アルゴリズム（純TS、30行）
│   ├── notifications/
│   │   └── scheduler.ts           # expo-notifications ラッパー
│   ├── navigation/
│   │   ├── RootNavigator.tsx       # 条件分岐ナビゲーション
│   │   ├── MainTabs.tsx            # BottomTab定義
│   │   └── types.ts               # ナビゲーションパラメータ型
│   ├── screens/
│   │   ├── home/HomeScreen.tsx     # 今日の復習 + 統計サマリー
│   │   ├── add/AddItemScreen.tsx   # アイテム追加（URLペースト/手動入力）
│   │   ├── review/
│   │   │   ├── ReviewScreen.tsx    # フラッシュカード形式復習
│   │   │   └── QuizScreen.tsx      # 穴埋めクイズモード
│   │   ├── library/LibraryScreen.tsx  # 保存アイテム一覧・検索
│   │   ├── map/KnowledgeMapScreen.tsx # ナレッジマップ（SVGグラフ）
│   │   ├── journal/JournalScreen.tsx  # 学びジャーナル
│   │   ├── onboarding/OnboardingScreen.tsx
│   │   └── settings/SettingsScreen.tsx
│   ├── components/
│   │   ├── ItemCard.tsx            # アイテム表示カード
│   │   ├── ReviewCard.tsx          # 復習用フリップカード
│   │   ├── RatingButtons.tsx       # SM-2 品質評価ボタン
│   │   ├── TagChip.tsx             # タグ表示チップ
│   │   ├── StatsCard.tsx           # 統計表示カード
│   │   └── ForceGraph.tsx          # ナレッジマップSVGグラフ
│   ├── hooks/
│   │   ├── useDatabase.ts          # DB初期化フック
│   │   ├── useTodayReviews.ts      # 今日の復習取得
│   │   ├── useClipboard.ts         # クリップボード読み取り
│   │   └── useColorScheme.ts       # テーマ判定
│   ├── theme/
│   │   ├── ThemeContext.tsx         # テーマProvider + useTheme
│   │   └── colors.ts               # ライト/ダークカラー定義
│   ├── utils/
│   │   ├── urlParser.ts            # URL→タイトル・メタ抽出
│   │   ├── textTagger.ts           # 簡易キーワード抽出（自動タグ）
│   │   └── quizGenerator.ts        # テキスト→穴埋めクイズ変換
│   └── types/
│       └── index.ts                # 共通型定義
└── assets/
    ├── icon.png
    ├── splash.png
    └── adaptive-icon.png
```

### 4.2 Provider階層

```typescript
// App.tsx
<ThemeProvider>          // 1. ライト/ダーク切替（DB不要）
  <DatabaseProvider>     // 2. SQLite接続・マイグレーション完了管理
    <RootNavigator />    // 3. DB初期化後にナビゲーション開始
  </DatabaseProvider>
</ThemeProvider>
```

認証Provider・RevenueCatProvider・APIクライアントは不要（サーバーレス設計）。

### 4.3 データモデル（SQLite）

#### ER図

```
items ──< item_tags >── tags
  │
  ├──< reviews
  └──< journals
```

#### テーブル定義

```sql
-- items: 保存アイテム（URL・テキスト・メモ）
CREATE TABLE IF NOT EXISTS items (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  type          TEXT    NOT NULL DEFAULT 'text',    -- 'url' | 'text' | 'screenshot'
  title         TEXT    NOT NULL,
  content       TEXT    NOT NULL,                   -- 本文テキスト or URL
  source_url    TEXT,                               -- 元URL（任意）
  excerpt       TEXT,                               -- 抜粋（復習カード表示用、最大200文字）
  created_at    TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
  archived      INTEGER NOT NULL DEFAULT 0          -- 0: アクティブ, 1: アーカイブ
);

-- reviews: SM-2 復習スケジュール・履歴
CREATE TABLE IF NOT EXISTS reviews (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id         INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  repetitions     INTEGER NOT NULL DEFAULT 0,       -- 連続正答回数
  easiness_factor REAL    NOT NULL DEFAULT 2.5,     -- EF値（1.3〜）
  interval_days   INTEGER NOT NULL DEFAULT 0,       -- 次回までの間隔（日数）
  next_review_at  TEXT    NOT NULL,                  -- 次回復習日時
  last_reviewed_at TEXT,                             -- 最終復習日時
  quality_history TEXT    NOT NULL DEFAULT '[]'      -- JSON: 直近の品質評価配列
);
CREATE INDEX IF NOT EXISTS idx_reviews_next ON reviews(next_review_at);
CREATE INDEX IF NOT EXISTS idx_reviews_item ON reviews(item_id);

-- tags: タグマスタ
CREATE TABLE IF NOT EXISTS tags (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  name  TEXT    NOT NULL UNIQUE
);

-- item_tags: アイテム×タグ 多対多
CREATE TABLE IF NOT EXISTS item_tags (
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  tag_id  INTEGER NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (item_id, tag_id)
);

-- journals: 学びジャーナル
CREATE TABLE IF NOT EXISTS journals (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id    INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  note       TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);
CREATE INDEX IF NOT EXISTS idx_journals_item ON journals(item_id);

-- app_settings: アプリ設定（KVS形式）
CREATE TABLE IF NOT EXISTS app_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
-- デフォルト値
INSERT OR IGNORE INTO app_settings (key, value) VALUES
  ('review_time', '08:00'),
  ('daily_review_count', '5'),
  ('theme', 'system'),
  ('onboarding_completed', 'false');
```

#### マイグレーション戦略

```typescript
const SCHEMA_VERSION = 1;

export async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  const currentVersion = await getSchemaVersion(db);
  if (currentVersion < 1) {
    await db.execAsync(CREATE_TABLES_SQL);
    await setSchemaVersion(db, 1);
  }
  // if (currentVersion < 2) { ... } // 将来のマイグレーション
}
```

### 4.4 SM-2アルゴリズム

SM-2（SuperMemo 2）は間隔反復の標準アルゴリズム。純TypeScript 30行で実装。

```typescript
export type Quality = 0 | 1 | 2 | 3 | 4 | 5;

export interface SM2State {
  repetitions: number;     // 連続正答回数
  easinessFactor: number;  // EF値（最小1.3）
  intervalDays: number;    // 次回までの間隔（日）
}

export function sm2(state: SM2State, quality: Quality): SM2Result {
  let { repetitions, easinessFactor, intervalDays } = state;

  // EF更新: EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
  const newEF = Math.max(
    1.3,
    easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  if (quality < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    repetitions += 1;
    switch (repetitions) {
      case 1: intervalDays = 1; break;
      case 2: intervalDays = 6; break;
      default: intervalDays = Math.round(intervalDays * newEF); break;
    }
  }

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + intervalDays);
  nextReviewAt.setHours(8, 0, 0, 0);

  return { repetitions, easinessFactor: Math.round(newEF * 100) / 100, intervalDays, nextReviewAt };
}
```

**簡易評価UIマッピング（3ボタン → SM-2内部値）:**

| ボタン表示 | SM-2 quality | 次回間隔の効果 |
|-----------|:-----------:|-------------|
| 忘れた | 1 | リセット（1日後） |
| 難しかった | 3 | やや短い間隔 |
| 覚えてた | 5 | 最大間隔延長 |

**間隔の進行例（quality=5の場合）:**
1回目→1日後 → 2回目→6日後 → 3回目→15日後 → 4回目→38日後 → 5回目→95日後

### 4.5 主要ライブラリ（合計14パッケージ）

#### Expo Go内蔵（8パッケージ）

| ライブラリ | 用途 |
|-----------|------|
| `expo` ~52.0.0 | Expoランタイム |
| `expo-sqlite` ~15.0.0 | ローカルDB |
| `expo-notifications` ~0.29.0 | 復習リマインダー通知 |
| `expo-clipboard` ~7.0.0 | クリップボード読み取り（Share Extension代替） |
| `expo-file-system` ~18.0.0 | データエクスポート |
| `expo-linking` ~7.0.0 | URLスキーム |
| `expo-haptics` ~14.0.0 | 触覚フィードバック |
| `expo-splash-screen` ~0.29.0 | スプラッシュ画面制御 |

#### ナビゲーション（5パッケージ）

| ライブラリ | 用途 |
|-----------|------|
| `@react-navigation/native` ^7.0.0 | ナビゲーション基盤 |
| `@react-navigation/native-stack` ^7.0.0 | Stack |
| `@react-navigation/bottom-tabs` ^7.0.0 | BottomTab |
| `react-native-screens` ~4.4.0 | ネイティブスクリーン最適化 |
| `react-native-safe-area-context` ~4.14.0 | SafeArea |

#### UI・描画（3パッケージ）

| ライブラリ | 用途 |
|-----------|------|
| `react-native-svg` ~15.8.0 | ナレッジマップSVGグラフ |
| `react-native-reanimated` ~3.16.0 | カードフリップ・アニメーション |
| `react-native-gesture-handler` ~2.20.0 | スワイプ・ピンチ操作 |

#### 不採用の判断

| 不採用 | 理由 |
|--------|------|
| `kuromoji` | 辞書40MB+でバンドル肥大化。正規表現ベース簡易タグで代替 |
| `D3.js` | 200KB+、DOM前提でRNと相性悪い。50ノードなら自前実装で十分 |
| `Redux` / `Zustand` | 画面8つ・状態はDB中心。Context+useReducerで十分 |
| SM-2外部ライブラリ | 30行で実装可能。依存ゼロを維持 |
| `axios` | API不要のサーバーレス設計 |

### 4.6 設計判断記録

| 判断 | 採用案 | 理由 |
|------|-------|------|
| DB | expo-sqlite | リレーショナルデータ（タグ多対多、復習JOIN）に必須 |
| 自動タグ | 正規表現キーワード抽出 | kuromoji辞書40MB+回避。MVPは簡易実装で十分 |
| グラフ描画 | react-native-svg直接操作 | 50ノード以下ならD3は過剰 |
| 状態管理 | Context + useReducer | 画面数8、グローバル状態はDB中心 |
| SM-2 | 純TypeScript自前実装 | 30行。将来FSRS移行も容易 |
| 認証 | なし | サーバーレス・ローカル完結 |
| アニメーション | react-native-reanimated | カードフリップ等の複雑アニメーションに必要 |

---

## 5. UI/UX設計

### 5.1 デザイン哲学

**コンセプト: 「静かに積み上がる知識」**

UIは**図書館の書架**をメタファーとする。静かで整然とした空間に、知識が一冊ずつ増えていく感覚。

**3つの設計原則:**

1. **フリクションゼロ（Zero Friction）**: 保存も復習も1タップ以内で開始
2. **静寂の力（Power of Silence）**: 余白がコンテンツを際立たせる。装飾を排除
3. **確実な成長実感（Tangible Growth）**: ストリーク・保存件数を控えめに可視化

**MA（間）主軸:** 余白重視・コンテンツファースト・最小限UIクロム

### 5.2 カラーシステム

#### Recall Amber（唯一のアクセントカラー）

```
Light Mode: #C47F17 — primary actions, accent
Dark Mode:  #F5A623 — primary actions, accent
```

知識の温かみ・蓄積感を表現する琥珀色。Readwiseの冷たいブルー系との差別化。

#### セマンティックカラー

| 用途 | Light | Dark |
|------|-------|------|
| 背景（主） | `#FFFFFF` | `#000000` |
| 背景（副） | `#F2F2F7` | `#1C1C1E` |
| テキスト（主） | `.label` | `.label` |
| テキスト（副） | `.secondaryLabel` | `.secondaryLabel` |
| 成功（ストリーク） | `.systemGreen` / `#30D158` | `#34D399` |
| 警告（期限切れ） | `.systemOrange` / `#FF9F0A` | `#FBBF24` |
| エラー | `.systemRed` / `#FF3B30` | — |

**色数制限:** アクセントカラーは1色（Recall Amber）に限定。状態表現のみsystemGreen/Red/Orangeを使用。

### 5.3 タイポグラフィ

**SF Pro**（Rounded ではなく標準）を採用。日本語はヒラギノ角ゴシックにフォールバック。

| スタイル | サイズ | ウェイト | 用途 |
|---|---|---|---|
| Large Title | 34pt | Bold | 画面タイトル |
| Title 2 | 22pt | Bold | カードタイトル |
| Headline | 17pt | Semibold | ボタンラベル |
| Body | 17pt | Regular | 本文 |
| Subheadline | 15pt | Regular | メタデータ |
| Caption 1 | 12pt | Regular | タブバーラベル |

**必須:** Dynamic Type対応（`allowFontScaling={true}`）。日本語行間: 1.6〜1.8倍。

### 5.4 グリッドシステム

**8ptグリッド:**

| トークン | 値 | 用途 |
|---|---|---|
| `space-s` | 8pt | 最小余白 |
| `space-m` | 16pt | 標準マージン・カード内パディング |
| `space-l` | 24pt | カード間間隔 |
| `space-xl` | 32pt | セクション間間隔 |

**カードレイアウト:** 角丸12pt、内パディング16pt、カード間隔12pt

### 5.5 画面一覧と遷移図

#### ナビゲーション構造（4タブ + 設定）

```
RootNavigator
├── [未初期化] → OnboardingScreen → MainTabs
└── [初期化済] → MainTabs
    ├── 📅 Today (HomeStack)
    │   ├── HomeScreen          ← 今日の復習件数 + ストリーク
    │   │   ├── [復習開始] ──→ ReviewScreen（フルスクリーンモーダル）
    │   │   └── [クイズ] ───→ QuizScreen（フルスクリーンモーダル）
    │   └── [⚙️] ──────────→ SettingsScreen（プッシュ遷移）
    │
    ├── 📚 Library (LibraryStack)
    │   ├── LibraryScreen       ← 全アイテム一覧・検索・タグフィルタ
    │   └── ItemDetailScreen    ← 編集・タグ管理・削除
    │
    ├── 🗺 Map (MapStack)
    │   └── KnowledgeMapScreen  ← SVGグラフ（ノードタップ→BottomSheet）
    │
    └── 📓 Journal (JournalStack)
        └── JournalScreen       ← カレンダー/リスト切替
```

#### ナビゲーション型定義

```typescript
export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  Review: undefined;
  Quiz: undefined;
};

export type LibraryStackParamList = {
  Library: { filterTag?: string };
  ItemDetail: { itemId: number };
};

export type MapStackParamList = {
  KnowledgeMap: undefined;
  ItemDetail: { itemId: number };
};
```

### 5.6 主要画面ワイヤーフレーム

#### Today画面（ホーム）

```
┌──────────────────────────────────────┐
│ Nav: "Today"  (Large Title)     ⚙️   │
│──────────────────────────────────────│
│  ┌────────────────────────────────┐  │
│  │  🔥 12日連続                   │  │
│  │  ████████░░  3/5 完了          │  │
│  │  [復習を始める]  (CTA)         │  │
│  └────────────────────────────────┘  │
│  今日の復習 ─────────────────────    │
│  ┌────────────────────────────────┐  │
│  │ ✅ React Hooksの基礎           │  │
│  │    #フロントエンド · 3月28日    │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ ○ 認知バイアスの種類           │  │
│  │    #心理学 · 3月20日           │  │
│  └────────────────────────────────┘  │
│ ──────────────────────────────────── │
│  📅 Today  📚 Library  🗺 Map  📓    │
└──────────────────────────────────────┘
```

**コンポーネント:**
- ストリーク＆進捗ヘッダー: 🔥日数 + プログレスバー（8pt高、Recall Amber）+ CTAボタン（Amber背景、高さ50pt）
- 復習カードリスト: 完了=✅+打ち消し線、未完了=○+通常テキスト
- 空状態: 「今日の復習はすべて完了しました」+ 本棚線画イラスト

#### 復習画面（Review）

```
┌──────────────────────────────────────┐
│  ✕                    3 / 5          │
│  ████████████░░░░░░░░                │
│──────────────────────────────────────│
│       ┌──────────────────────┐       │
│       │  React Hooksの基礎   │       │
│       │  #フロントエンド      │       │
│       │  タップしてめくる     │       │
│       └──────────────────────┘       │
│  ┌─────┬──────┬──────┬──────┐       │
│  │Again│ Hard │ Good │ Easy │       │
│  │<1日 │ 3日  │ 7日  │ 14日 │       │
│  └─────┴──────┴──────┴──────┘       │
└──────────────────────────────────────┘
```

**SM-2難易度ボタン（4色）:**

| ボタン | 背景色 | 次回復習 |
|---|---|---|
| Again | `.systemRed` @15% | < 1日 |
| Hard | `.systemOrange` @15% | SM-2算出値 |
| Good | `.systemGreen` @15% | SM-2算出値 |
| Easy | `.systemBlue` @15% | SM-2算出値 |

ボタン高さ56pt、角丸12pt。タップ時 `.impact(.light)` ハプティクス。

#### Library画面

```
┌──────────────────────────────────────┐
│ Nav: "ライブラリ" (Large Title)       │
│  🔍 検索...                          │
│  [すべて] [URL] [テキスト] [スクショ] │
│  タグ: [フロントエンド] [データベース]│
│  今日 ──────────────────────────     │
│  ┌────────────────────────────────┐  │
│  │ 🔗 TypeScriptの型ガード完全解説│  │
│  │    zenn.dev · #フロントエンド   │  │
│  │    次回復習: 4月2日             │  │
│  └────────────────────────────────┘  │
│ ──────────────────────────────────── │
│  📅 Today  📚 Library  🗺 Map  📓    │
└──────────────────────────────────────┘
```

**スワイプアクション:** 右=「復習に追加」(Blue)、左=「削除」(Red、確認アラート付き)

#### ナレッジマップ画面

- force-directedグラフ: ノード=タグ（円形40〜60pt）、エッジ=同一アイテムに付与されたタグ間の接続線
- ノードサイズ: そのタグを持つアイテム数に比例
- 標準版制限: 50ノードまで → Proパック¥490で無制限解放
- ジェスチャー: ピンチズーム、パン、ノードタップ→BottomSheet

#### 学びジャーナル画面

- 表示切替: カレンダー / リスト（Segmented Control）
- カレンダー: ジャーナル記録がある日にRecall Amberドットインジケーター
- メモ追加: リスト末尾の [+ メモを追加] テキストボタン → インライン展開

### 5.7 オンボーディング（4ステップ）

| Step | 内容 | 目的 |
|:----:|------|------|
| 1 | 忘却曲線イラスト + 「読んだのに、忘れていませんか？」 | 問題提起・価値提案 |
| 2 | Share Extensionアニメ + 「どこからでも1タップで保存」 | 保存体験のデモ |
| 3 | フラッシュカードアニメ + 「毎朝5分で知識を定着」 | 復習体験のデモ |
| 4 | 通知ベル + 「復習リマインダーを受け取る」 | 通知許可（Just-in-Time） |

- 全ステップでスキップ可能
- スワイプでページ送り
- 通知許可: Step 4でのみ要求（Pre-promptで受諾率40〜60%向上）
- 完了後: Today画面 → 空状態 + 「最初の知識を保存しましょう」CTA

### 5.8 ゲーミフィケーション

**ハビットループ:**

```
[プロンプト]      → [アクション]    → [報酬]            → [投資]
毎朝8時の通知    → 5件の復習完了   → ストリーク更新     → ジャーナル記録
                                    + 成長実感バッジ     + タグ整理
```

**マイルストーンバッジ:**

| マイルストーン | バッジ | トリガー |
|---|---|---|
| 保存10件 | 📚 最初の本棚 | 累計10件 |
| 保存100件 | 🏛 知識の殿堂 | 累計100件 → **レビュー誘導** |
| ストリーク7日 | 🔥 1週間の炎 | 7日連続 |
| ストリーク30日 | 🌟 月間マスター | 30日連続 → **レビュー誘導** |
| Quiz正答率90%+ | 🎯 記憶の達人 | 10問以上で90%+ |

### 5.9 アニメーション方針

MA（間）主軸のため、**控えめで必然的なもののみ**。装飾的アニメーションは排除。

| アニメーション | 場所 | パラメータ |
|---|---|---|
| カードフリップ | Review画面 | Y軸回転、Spring 0.4s, bounce 0.15 |
| ストリークカウントアップ | Today画面 | Spring 0.6s |
| 保存完了チェック | Share Extension | スケールイン、Spring 0.3s |
| ハプティクス（タップ） | 評価ボタン | `.impact(.light)` |
| ハプティクス（完了） | 復習完了 | `.notification(.success)` |

### 5.10 モックHTML参照

UI/UX仕様書のワイヤーフレームに基づくモックHTMLは `docs/sample.html` に配置予定。実装開始時にfrontend-designスキルで生成する。

---

## 6. 収益化戦略

### 6.1 価格設定

| 項目 | 価格 | 根拠 |
|------|------|------|
| **本体** | ¥1,200（買い切り） | Readwise月$8.99の2ヶ月分以下。「サブスク疲れ」層に刺さる直接対比 |
| **ナレッジマップProパック** | ¥490（IAP） | ナレッジマップ50件制限→無制限解放 |
| **Weekly Discovery** | ¥250（IAP） | 保存済みタグから関連記事を毎週自動レコメンド |

**訴求コピー:** 「Readwiseを月$8.99払っていますか？2ヶ月分以下で永久使用」

### 6.2 IAP UI設計

- 設定画面内の「アップグレード」セクションに配置
- 成果ベースメッセージ: 「あなたの知識は○○件。ナレッジマップで関連を可視化しましょう」
- `StoreKit`の`restoreCompletedTransactions`で購入復元

### 6.3 収益予測（初年度SOM）

| 指標 | 値 |
|------|-----|
| 月間DL数（安定期） | 約350件 |
| 年間収益 | 約¥490万円 |

### 6.4 レビュー獲得施策

1. **保存100件達成時:** 「あなたは100個の知識を保存しました」マイルストーン通知 → `SKStoreReviewController.requestReview()`
2. **30日連続ストリーク:** 「1ヶ月間、毎日学び続けています」→ レビューリクエスト
3. **note記事戦略:** 「Readwiseに月1,300円払っていた私が¥1,200の買い切りアプリに乗り換えた話」で初速獲得
4. **iOS制限遵守:** `requestReview()` は年3回まで

---

## 7. 開発ロードマップ

### Phase 1: MVP（Expo Go、3〜4週間）

| 週 | タスク | 成果物 |
|:--:|--------|--------|
| **Week 1** | プロジェクトセットアップ、DB設計・マイグレーション、SM-2アルゴリズム実装、テーマシステム | 基盤完成。`npx expo start`で起動確認 |
| **Week 2** | HomeScreen、AddItemScreen（クリップボード検知）、ReviewScreen（カードフリップ+3段階評価）、通知スケジューラ | コアループ「保存→復習→記憶定着」が動作 |
| **Week 3** | LibraryScreen（検索・タグフィルタ）、SettingsScreen、オンボーディング4ステップ、自動タグ（正規表現） | 全MVP画面完成 |
| **Week 4** | バグフィックス、パフォーマンス最適化、TestFlight内部テスト配布 | MVP完成。TestFlight10人で検証開始 |

**MVP完了基準:**
- 「URLコピー→アプリ起動→クリップボード検知→保存→翌朝通知→復習→評価→次回スケジュール」の全フロー動作
- コールドスタート2秒以内
- Expo Goで動作確認完了

### Phase 2: ナレッジマップ・QuizMode（2週間）

| 週 | タスク |
|:--:|--------|
| **Week 5** | KnowledgeMapScreen（force-directedグラフ、50ノード制限）、ノードタップ→BottomSheet |
| **Week 6** | QuizMode（穴埋めクイズ自動生成）、学びジャーナル画面 |

### Phase 3: EAS Build移行・App Store提出（2週間）

| 週 | タスク |
|:--:|--------|
| **Week 7** | EAS Build移行、Share Extension実装、RevenueCat課金統合（ナレッジマップPro / Weekly Discovery） |
| **Week 8** | App Store提出準備（スクリーンショット、説明文、プライバシーポリシー）、審査提出 |

### EAS Build移行トリガー

```
Expo Go（Phase 1-2）
  → MVP検証・TestFlight内部テスト
  → 「保存→復習→記憶定着」のコアループ検証

EAS Build移行の判断基準:
  ✓ TestFlightで10人以上が2週間継続利用
  ✓ 「Share Extensionがほしい」フィードバックが多数
  ✓ App Store提出準備開始時
```

---

## 8. リスクと対策

### 8.1 技術リスク

| リスク | 影響度 | 対策 |
|--------|:-----:|------|
| **Expo Go制約でShare Extension非対応** | 中 | MVP期間はクリップボード検知で代替。EAS Build移行判断を早期に行う |
| **expo-sqliteのパフォーマンス** | 低 | インデックス設計済み。1万件以下では問題なし |
| **react-native-svgのグラフ描画性能** | 低 | 50ノード制限で負荷制御。Proパックで解放時もページング考慮 |
| **Expo SDK メジャーアップデート** | 低 | SDK 52のLTS期間内で安定運用。破壊的変更はCHANGELOG確認 |

### 8.2 ビジネスリスク

| リスク | 影響度 | 対策 |
|--------|:-----:|------|
| **Readwiseが日本語対応強化・値下げ** | 高 | ナレッジマップ・QuizModeなどReadwiseにない独自機能で差別化維持 |
| **Ankiとの機能比較** | 中 | 「カード手作り不要のゼロ手間」を一貫訴求。Ankiの弱点（UI・学習コスト）を突く |
| **買い切りモデルの収益持続性** | 中 | IAP（ナレッジマップPro / Weekly Discovery）でLTV伸長。新機能追加でランキング維持 |

### 8.3 市場リスク

| リスク | 影響度 | 対策 |
|--------|:-----:|------|
| **「あとで読む」アプリの市場飽和** | 中 | 「間隔反復」という明確な差別化軸。保存だけでなく「定着」にフォーカス |
| **App Store審査リスク** | 低 | サーバーレス・AI不使用・標準API のみで審査リスク最小。HIG準拠を徹底 |
| **初期ユーザー獲得の難しさ** | 中 | Readwiseコミュニティ（Twitter/Discord）への直接アプローチ。note記事戦略で初速獲得 |

### 8.4 対策のまとめ

1. **コアループの早期検証**: 「保存→復習→記憶定着」が2週間の継続利用を生むかを最優先で検証
2. **段階的ビルド移行**: Expo Go → EAS Build の2段階でリスクを分離
3. **差別化機能の継続投資**: ナレッジマップ・QuizModeなどReadwiseにない機能を継続的に追加
4. **コミュニティドリブン獲得**: note記事・X投稿・Readwiseコミュニティでのオーガニック獲得

---

## 付録A: 開発環境セットアップ

```bash
# プロジェクト作成
npx create-expo-app@latest ReCallKit --template blank-typescript
cd ReCallKit

# Expo Go内蔵パッケージ
npx expo install expo-sqlite expo-notifications expo-clipboard \
  expo-file-system expo-linking expo-haptics expo-splash-screen

# ナビゲーション
npx expo install @react-navigation/native @react-navigation/native-stack \
  @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context

# UI・描画
npx expo install react-native-svg react-native-reanimated react-native-gesture-handler

# 起動
npx expo start
```

Expo Goアプリでスキャンして即実行可能。prebuild不要。

---

## 付録B: app.json 設定

```json
{
  "expo": {
    "name": "ReCallKit",
    "slug": "recallkit",
    "version": "0.1.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#1A1A2E"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.recallkit.app",
      "infoPlist": {
        "NSUserNotificationsUsageDescription": "復習リマインダーを毎朝お届けするために通知を使用します"
      }
    },
    "plugins": [
      ["expo-notifications", { "icon": "./assets/icon.png", "color": "#E94560" }],
      "expo-sqlite"
    ]
  }
}
```

---

## 付録C: 通知スケジューラ実装

```typescript
// src/notifications/scheduler.ts
import * as Notifications from 'expo-notifications';

export async function scheduleDailyReview(
  hour: number = 8,
  minute: number = 0,
  pendingCount: number
): Promise<string> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (pendingCount === 0) return '';

  return await Notifications.scheduleNotificationAsync({
    content: {
      title: '今日の復習',
      body: `${pendingCount}件の復習が待っています`,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}
```

---

## 付録D: 参照ドキュメント

| ドキュメント | パス | 内容 |
|------------|------|------|
| 要件定義書 | `docs/requirements.md` | アプリ概要・機能一覧・技術要件 |
| UI/UX仕様書 | `docs/ios-uiux-spec.md` | 全画面ワイヤーフレーム・デザインシステム詳細 |
| アーキテクチャ設計書 | `docs/architecture.md` | ディレクトリ構成・データモデル・SM-2実装 |
| 市場分析レポート | `app-ideas-market-a.md` | TAM/SAM/SOM・競合分析・収益化戦略 |
