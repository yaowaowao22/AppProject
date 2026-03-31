# ReCallKit — 最小構成アーキテクチャ設計書

> 作成日: 2026-03-31
> 技術スタック: Expo Go (SDK 52) + React Native + TypeScript
> 設計方針: 保守費ゼロ・サーバーレス・ローカルファースト・Expo Go完結

---

## 1. ディレクトリ構成

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
│   │   └── algorithm.ts           # SM-2間隔反復アルゴリズム（純TypeScript）
│   ├── notifications/
│   │   └── scheduler.ts           # expo-notifications ラッパー
│   ├── navigation/
│   │   ├── RootNavigator.tsx       # 条件分岐ナビゲーション
│   │   ├── MainTabs.tsx            # BottomTab定義
│   │   └── types.ts               # ナビゲーションパラメータ型
│   ├── screens/
│   │   ├── home/
│   │   │   └── HomeScreen.tsx      # 今日の復習 + 統計サマリー
│   │   ├── add/
│   │   │   └── AddItemScreen.tsx   # アイテム追加（URLペースト/手動入力）
│   │   ├── review/
│   │   │   ├── ReviewScreen.tsx    # フラッシュカード形式復習
│   │   │   └── QuizScreen.tsx      # 穴埋めクイズモード
│   │   ├── library/
│   │   │   └── LibraryScreen.tsx   # 保存アイテム一覧・検索
│   │   ├── map/
│   │   │   └── KnowledgeMapScreen.tsx  # ナレッジマップ（SVGグラフ）
│   │   ├── journal/
│   │   │   └── JournalScreen.tsx   # 学びジャーナル
│   │   ├── onboarding/
│   │   │   └── OnboardingScreen.tsx # 初回チュートリアル
│   │   └── settings/
│   │       └── SettingsScreen.tsx  # 設定・データエクスポート
│   ├── components/
│   │   ├── ItemCard.tsx            # アイテム表示カード
│   │   ├── ReviewCard.tsx          # 復習用フリップカード
│   │   ├── RatingButtons.tsx       # SM-2 品質評価ボタン（0-5）
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

---

## 2. 主要ライブラリ一覧

### コアライブラリ（Expo Go内蔵）

| ライブラリ | バージョン | 用途 | Expo Go対応 |
|-----------|-----------|------|:-----------:|
| `expo` | ~52.0.0 | Expoランタイム | ✅ |
| `expo-sqlite` | ~15.0.0 | ローカルDB（SQLite） | ✅ |
| `expo-notifications` | ~0.29.0 | 復習リマインダー通知 | ✅ |
| `expo-clipboard` | ~7.0.0 | クリップボード読み取り（Share Extension代替） | ✅ |
| `expo-file-system` | ~18.0.0 | データエクスポート・バックアップ | ✅ |
| `expo-linking` | ~7.0.0 | URLスキーム・ディープリンク | ✅ |
| `expo-haptics` | ~14.0.0 | 触覚フィードバック | ✅ |
| `expo-splash-screen` | ~0.29.0 | スプラッシュ画面制御 | ✅ |

### ナビゲーション

| ライブラリ | バージョン | 用途 |
|-----------|-----------|------|
| `@react-navigation/native` | ^7.0.0 | ナビゲーション基盤 |
| `@react-navigation/native-stack` | ^7.0.0 | Stackナビゲーション |
| `@react-navigation/bottom-tabs` | ^7.0.0 | BottomTabナビゲーション |
| `react-native-screens` | ~4.4.0 | ネイティブスクリーン最適化 |
| `react-native-safe-area-context` | ~4.14.0 | SafeArea対応 |

### UI・描画

| ライブラリ | バージョン | 用途 |
|-----------|-----------|------|
| `react-native-svg` | ~15.8.0 | ナレッジマップSVGグラフ描画 |
| `react-native-reanimated` | ~3.16.0 | カードフリップ・グラフアニメーション |
| `react-native-gesture-handler` | ~2.20.0 | スワイプ・ピンチ操作 |

### 合計: 14パッケージ（最小構成）

> **不使用の判断**: `kuromoji`（40MB+辞書）、`d3`（ナレッジマップには過剰）、`axios`（API不要）は不採用。
> 自動タグは正規表現ベースの軽量実装で代替。ナレッジマップはSVG直接操作で実装。

---

## 3. データモデル設計（SQLiteテーブル定義）

### ER図（テキスト）

```
items ──< item_tags >── tags
  │
  ├──< reviews
  └──< journals
```

### テーブル定義

```sql
-- ============================================================
-- items: 保存アイテム（URL・テキスト・メモ）
-- ============================================================
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

-- ============================================================
-- reviews: SM-2 復習スケジュール・履歴
-- ============================================================
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

-- ============================================================
-- tags: タグマスタ
-- ============================================================
CREATE TABLE IF NOT EXISTS tags (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  name  TEXT    NOT NULL UNIQUE
);

-- ============================================================
-- item_tags: アイテム×タグ 多対多
-- ============================================================
CREATE TABLE IF NOT EXISTS item_tags (
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  tag_id  INTEGER NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (item_id, tag_id)
);

-- ============================================================
-- journals: 学びジャーナル（復習時の気づきメモ）
-- ============================================================
CREATE TABLE IF NOT EXISTS journals (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id    INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  note       TEXT    NOT NULL,                      -- 1行メモ
  created_at TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);
CREATE INDEX IF NOT EXISTS idx_journals_item ON journals(item_id);

-- ============================================================
-- app_settings: アプリ設定（KVS形式）
-- ============================================================
CREATE TABLE IF NOT EXISTS app_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
-- デフォルト設定の挿入
INSERT OR IGNORE INTO app_settings (key, value) VALUES
  ('review_time', '08:00'),           -- 復習通知時刻
  ('daily_review_count', '5'),        -- 1日の復習件数
  ('theme', 'system'),                -- 'light' | 'dark' | 'system'
  ('onboarding_completed', 'false');
```

### マイグレーション戦略

```typescript
// src/db/schema.ts
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

---

## 4. SM-2アルゴリズム（TypeScript実装）

### アルゴリズム仕様

SM-2（SuperMemo 2）は間隔反復の標準アルゴリズム。ユーザーの自己評価（0-5）に基づき次回復習間隔を算出する。

```typescript
// src/sm2/algorithm.ts

/**
 * SM-2 品質評価
 * 0: 完全に忘れた（Blackout）
 * 1: 間違えた（Incorrect）
 * 2: 間違えたが見たら思い出した（Incorrect, but remembered on reveal）
 * 3: 思い出すのに苦労した（Correct, with serious difficulty）
 * 4: 少し迷ったが正解（Correct, with some hesitation）
 * 5: 完璧に覚えていた（Perfect response）
 */
export type Quality = 0 | 1 | 2 | 3 | 4 | 5;

export interface SM2State {
  repetitions: number;     // 連続正答回数
  easinessFactor: number;  // EF値（最小1.3）
  intervalDays: number;    // 次回までの間隔（日）
}

export interface SM2Result extends SM2State {
  nextReviewAt: Date;      // 次回復習日時
}

const MIN_EF = 1.3;

/**
 * SM-2アルゴリズム本体
 * @param state 現在の復習状態
 * @param quality ユーザーの自己評価（0-5）
 * @returns 更新後の状態 + 次回復習日
 */
export function sm2(state: SM2State, quality: Quality): SM2Result {
  let { repetitions, easinessFactor, intervalDays } = state;

  // EF更新: EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
  const newEF = Math.max(
    MIN_EF,
    easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  if (quality < 3) {
    // 不正解 → リセット
    repetitions = 0;
    intervalDays = 1;
  } else {
    // 正解 → 間隔延長
    repetitions += 1;
    switch (repetitions) {
      case 1:
        intervalDays = 1;
        break;
      case 2:
        intervalDays = 6;
        break;
      default:
        intervalDays = Math.round(intervalDays * newEF);
        break;
    }
  }

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + intervalDays);
  nextReviewAt.setHours(8, 0, 0, 0); // デフォルト: 翌朝8時

  return {
    repetitions,
    easinessFactor: Math.round(newEF * 100) / 100, // 小数2桁
    intervalDays,
    nextReviewAt,
  };
}

/**
 * 新規アイテムの初期SM2状態
 */
export function createInitialSM2State(): SM2State {
  return {
    repetitions: 0,
    easinessFactor: 2.5,
    intervalDays: 0,
  };
}

/**
 * ReCallKit簡易評価UI用マッピング
 * ユーザーには3ボタンを表示し、内部でSM-2の0-5にマッピング
 */
export const SIMPLE_RATINGS = {
  forgot: 1 as Quality,    // 「忘れた」→ 1
  hard: 3 as Quality,      // 「難しかった」→ 3
  easy: 5 as Quality,      // 「覚えてた」→ 5
} as const;
```

### SM-2 間隔の進行例

| 復習回数 | quality=5の場合の間隔 | quality=3の場合の間隔 |
|:-------:|:-------------------:|:-------------------:|
| 1回目 | 1日後 | 1日後 |
| 2回目 | 6日後 | 6日後 |
| 3回目 | 15日後 | 13日後 |
| 4回目 | 38日後 | 27日後 |
| 5回目 | 95日後 | 59日後 |

---

## 5. 画面遷移図

### 全体構造

```
App.tsx
└── ThemeProvider
    └── DatabaseProvider
        └── RootNavigator
            ├── [未初期化] → OnboardingScreen
            │                  │
            │                  └─→ MainTabs（完了後遷移）
            │
            └── [初期化済] → MainTabs
                ├── 🏠 HomeTab (HomeStack)
                │   ├── HomeScreen          ← 今日の復習件数 + 統計
                │   │   ├── [復習開始] ──→ ReviewScreen
                │   │   └── [クイズ] ───→ QuizScreen
                │   ├── ReviewScreen        ← フラッシュカード復習
                │   │   └── [メモ追加] ──→ JournalModal
                │   └── QuizScreen          ← 穴埋めクイズ
                │
                ├── ➕ AddTab (AddStack)
                │   └── AddItemScreen       ← URL貼り付け / テキスト入力
                │       ├── [クリップボード] → 自動検出・保存
                │       └── [手動入力] ────→ タグ編集 → 保存
                │
                ├── 📚 LibraryTab (LibraryStack)
                │   ├── LibraryScreen       ← 全アイテム一覧・検索・タグフィルタ
                │   │   └── [タップ] ────→ ItemDetailScreen
                │   └── ItemDetailScreen    ← アイテム詳細・編集・削除
                │
                ├── 🗺️ MapTab (MapStack)
                │   └── KnowledgeMapScreen  ← SVGグラフ表示（タグ関連）
                │       └── [ノードタップ] → ItemDetailScreen
                │
                └── ⚙️ SettingsTab (SettingsStack)
                    └── SettingsScreen      ← 通知時刻/件数/テーマ/エクスポート
```

### ナビゲーション型定義

```typescript
// src/navigation/types.ts
export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  Review: undefined;
  Quiz: undefined;
};

export type AddStackParamList = {
  AddItem: { clipboardText?: string };
};

export type LibraryStackParamList = {
  Library: { filterTag?: string };
  ItemDetail: { itemId: number };
};

export type MapStackParamList = {
  KnowledgeMap: undefined;
  ItemDetail: { itemId: number };
};

export type SettingsStackParamList = {
  Settings: undefined;
};
```

---

## 6. Expo Go制約事項と代替策一覧

| 要件機能 | ネイティブ実装 | Expo Go制約 | 代替策（MVP） | 影響度 |
|---------|-------------|:-----------:|-------------|:-----:|
| **Share Extension** | iOS Share Extension | ❌ 非対応 | `expo-clipboard`で自動検出 + アプリ内URLペースト入力。起動時にクリップボードURLを検知し「保存しますか？」バナー表示 | 中 |
| **Vision OCR** | iOS Vision Framework | ❌ 非対応 | MVP対象外。将来EAS Build移行時に`expo-camera` + ML Kit で対応 | 低（MVP） |
| **NaturalLanguage自動タグ** | iOS NaturalLanguage | ❌ 非対応 | 正規表現ベースの軽量キーワード抽出（`textTagger.ts`）。URLドメイン・タイトルからの推定タグ + 手動タグ編集 | 低 |
| **Core Data** | iOS Core Data | ❌ 非対応 | `expo-sqlite`で完全代替。SQLで直接操作、マイグレーション自前管理 | なし |
| **SwiftUI グラフ** | SwiftUI Charts | ❌ 非対応 | `react-native-svg`でforce-directedグラフを自前実装 | なし |
| **バックグラウンド実行** | Background Tasks | ⚠️ 制限あり | フォアグラウンド復帰時に復習スケジュール再計算。通知は`expo-notifications`のスケジュール通知で対応 | 低 |
| **iCloud同期** | CloudKit | ❌ 非対応 | MVPはローカル完結。JSONエクスポート/インポートで手動バックアップ対応 | 低（MVP） |
| **ウィジェット** | WidgetKit | ❌ 非対応 | MVP対象外。EAS Build移行後に対応 | なし（MVP） |

### Share Extension代替: クリップボード検知フロー

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

## 7. 将来のEAS Build移行時の拡張ポイント

EAS Build（Development Build）に移行することで解放されるネイティブ機能:

| 機能 | 必要パッケージ | 拡張内容 | 実装コスト |
|------|-------------|---------|:--------:|
| **Share Extension** | `expo-share-extension`（サードパーティ）+ Config Plugin | iOS共有シートから直接保存。ゼロ手間保存を実現 | 中 |
| **Vision OCR** | `react-native-text-recognition` or `expo-camera` + ML Kit | スクショ内テキスト自動抽出 | 中 |
| **WidgetKit** | `react-native-widget-extension` | ホーム画面ウィジェットで復習件数・ストリーク表示 | 中 |
| **App Intents / Shortcuts** | `expo-apple-targets` | Siri「ReCallKitで復習」で起動 | 低 |
| **iCloud同期** | `expo-file-system` + CloudKit Bridging | デバイス間データ同期 | 高 |
| **RevenueCat課金** | `react-native-purchases` | ナレッジマップProパック ¥490 / Weekly Discovery ¥250 | 中 |
| **Background Fetch** | `expo-background-fetch` + `expo-task-manager` | バックグラウンドで復習リマインダー再スケジュール | 低 |

### 移行判断基準

```
Expo Go（現在）
  → MVP検証・TestFlight内部テスト
  → クリップボード保存で体験検証
  → 「保存→復習→記憶定着」のコアループ検証

EAS Build移行トリガー:
  ✓ TestFlightで10人以上が2週間継続利用
  ✓ 「Share Extensionがほしい」フィードバックが多数
  ✓ App Store提出準備開始時
```

---

## 8. app.json 最小設定

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
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.recallkit.app",
      "infoPlist": {
        "NSUserNotificationsUsageDescription": "復習リマインダーを毎朝お届けするために通知を使用します"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#1A1A2E"
      },
      "package": "com.recallkit.app"
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/icon.png",
          "color": "#E94560"
        }
      ],
      "expo-sqlite"
    ],
    "extra": {
      "eas": {
        "projectId": "YOUR_EAS_PROJECT_ID"
      }
    }
  }
}
```

---

## 9. Provider階層（App.tsx）

```typescript
// App.tsx
import { ThemeProvider } from './src/theme/ThemeContext';
import { DatabaseProvider } from './src/hooks/useDatabase';
import { RootNavigator } from './src/navigation/RootNavigator';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function App() {
  return (
    <ThemeProvider>
      <DatabaseProvider>
        <RootNavigator />
      </DatabaseProvider>
    </ThemeProvider>
  );
}
```

Provider順序（外→内）:
1. **ThemeProvider** — ライト/ダーク切替（DB不要）
2. **DatabaseProvider** — SQLite接続・マイグレーション完了を管理
3. **RootNavigator** — DB初期化後にナビゲーション開始

> 認証Provider・RevenueCatProvider・APIクライアントは不要（サーバーレス設計）。
> Expo Goの利点: Provider階層が極めてシンプル。

---

## 10. 通知スケジューラ設計

```typescript
// src/notifications/scheduler.ts
import * as Notifications from 'expo-notifications';

/**
 * 毎日の復習リマインダーをスケジュール
 * @param hour 通知時刻（時）デフォルト8
 * @param minute 通知時刻（分）デフォルト0
 * @param pendingCount 未復習件数
 */
export async function scheduleDailyReview(
  hour: number = 8,
  minute: number = 0,
  pendingCount: number
): Promise<string> {
  // 既存のスケジュールをキャンセル
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (pendingCount === 0) return '';

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '📚 今日の復習',
      body: `${pendingCount}件の復習が待っています`,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  return id;
}
```

---

## 11. ナレッジマップ設計方針

### 描画方式: react-native-svg + 自前force-directed

```
ノード = タグ（円）
エッジ = 同一アイテムに付与されたタグ間の接続線
ノードサイズ = そのタグを持つアイテム数に比例

[TypeScript] ─────── [React Native]
      \                 /
       \               /
        [Expo]────[SQLite]
       /
      /
[SM-2]
```

### 実装アプローチ
- **レイアウト計算**: 簡易force-directedをTypeScriptで実装（requestAnimationFrame + タイマー）
- **描画**: `react-native-svg`の`<Circle>`, `<Line>`, `<Text>`
- **インタラクション**: `react-native-gesture-handler`でパン・ピンチズーム
- **標準版制限**: 50ノードまで表示（パフォーマンス + 将来IAPゲート）

### D3不使用の理由
- D3.jsはDOM操作前提でReact Nativeと相性が悪い
- `d3-force`のみ切り出し可能だが、50ノード程度なら自前実装で十分
- バンドルサイズ削減（D3全体で200KB+）

---

## 12. テーマ設計

```typescript
// src/theme/colors.ts
export const lightColors = {
  background: '#FAFAFA',
  surface: '#FFFFFF',
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  primary: '#E94560',        // ReCallKitブランドカラー（赤）
  primaryLight: '#FEE2E2',
  accent: '#0F3460',         // ネイビー（補色）
  border: '#E5E7EB',
  success: '#10B981',        // ストリーク・達成
  warning: '#F59E0B',        // 復習期限接近
  card: '#FFFFFF',
};

export const darkColors = {
  background: '#1A1A2E',
  surface: '#16213E',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  primary: '#E94560',
  primaryLight: '#3B1A2E',
  accent: '#0F3460',
  border: '#334155',
  success: '#34D399',
  warning: '#FBBF24',
  card: '#16213E',
};
```

---

## 13. 設計上の判断記録

| 判断 | 採用案 | 不採用案 | 理由 |
|------|-------|---------|------|
| DB | expo-sqlite（同期API） | AsyncStorage / MMKV | リレーショナルデータ（タグ多対多、復習スケジュールJOIN）に必須 |
| 自動タグ | 正規表現キーワード抽出 | kuromoji（形態素解析） | kuromoji辞書40MB+はバンドル肥大化。MVPは簡易実装で十分 |
| グラフ描画 | react-native-svg直接操作 | D3.js / Victory | 50ノード以下ならD3は過剰。RN向け軽量実装を優先 |
| 状態管理 | React Context + useReducer | Redux / Zustand / Jotai | 画面数8、グローバル状態はDB中心。Context十分 |
| SM-2 | 純TypeScript自前実装 | ts-fsrs / supermemo npm | 依存ゼロ。アルゴリズムは30行で実装可能。将来FSRS移行も容易 |
| 認証 | なし | Supabase / Firebase Auth | サーバーレス設計。ローカル完結 |
| アニメーション | react-native-reanimated | Animated API | カードフリップ等の複雑アニメーションで必要 |

---

## 14. MVP機能スコープ

### Phase 1: MVP（Expo Go、4週間目標）

| 機能 | 含む | 含まない |
|------|------|---------|
| アイテム保存 | URLペースト、テキスト手動入力、クリップボード検知 | Share Extension、OCR |
| SM-2復習 | 3段階評価（忘れた/難しい/覚えてた）、デフォルト毎朝8時×5件 | パラメータ手動調整 |
| 通知 | 毎日の復習リマインダー | カスタム通知音 |
| ライブラリ | 一覧表示、テキスト検索、タグフィルタ | ソート切替 |
| 自動タグ | URLドメイン推定、タイトルキーワード | 高精度NLP |
| テーマ | ライト/ダーク（システム連動） | カスタムテーマ |
| データ管理 | JSONエクスポート | iCloud同期、インポート |

### Phase 2: EAS Build移行後

- Share Extension（ゼロ手間保存）
- Vision OCR（スクショテキスト抽出）
- ナレッジマップ（SVGグラフ）
- QuizMode（穴埋めクイズ）
- 学びジャーナル
- RevenueCat課金（ナレッジマップPro / Weekly Discovery）
- WidgetKit（ホーム画面ウィジェット）

---

## 15. 開発環境セットアップ（クイックスタート）

```bash
# プロジェクト作成
npx create-expo-app@latest ReCallKit --template blank-typescript
cd ReCallKit

# Expo Go内蔵パッケージ（バージョンはExpo SDKに合わせて自動解決）
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
