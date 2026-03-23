# SubRadar — 実装計画書

作成日: 2026-03-23
参照: `docs/gap-analysis.md`, `docs/ui-review.md`, `docs/backend-review.md`
担当エージェント: A（データ層）, B（通知）, C（AddModal）, D（Settings+前月比）

---

## 1. 決定事項サマリー

### 1-1. デザイン方針

**決定: Option B — `src/theme.ts` の dark palette を AC 値で上書き**

```ts
// src/theme.ts のdark セクションに以下を追加上書き
dark: {
  ...presetForestGreen.colors.dark,
  primary:       '#26C6DA',  // AC.teal（現状 #4DB6AC から変更）
  primaryDark:   '#00B8D4',
  primaryLight:  '#4DD0E1',
  // @massapp/ui の ThemeConfig に background/surface/text キーがあれば追加:
  // background:    '#0D1117',  // AC.bgDeep
  // surface:       '#161B22',  // AC.bgCard
  // textPrimary:   '#E6EDF3',  // AC.textBright
  // textSecondary: '#8B949E',  // AC.textMid
  // border:        '#21262D',  // AC.borderSubtle
}
```

> **実装注意（エージェントD）**: `@massapp/ui` の `ThemeConfig` 型と `presetForestGreen` の dark キー一覧を読んでから追加可能なキーを確定すること。`background` 等が型に存在しない場合は `primary` 系のみ変更で可。

**採用理由**:
- `AddSubscriptionModal` と `SettingsScreen` の `colors.*` 参照が自動的に AC 値を返す
- Switch の `trackColor.true = colors.primary` が `#26C6DA` に追従（テーマ不整合解消）
- @massapp/ui コンポーネントを撤去不要。工数: 小

### 1-2. 通貨換算

**決定: 案A — `config.ts` に固定レートを定義**

```ts
// src/config.ts に追加
export const FX_RATES: Record<Currency, number> = {
  JPY: 1,
  USD: 150,
  EUR: 165,
} as const;

export const FX_RATES_LAST_UPDATED = '2026-03'; // 手動更新月
```

**採用理由**: 実装コスト最小・オフライン動作。フェーズ2で動的API取得へ移行予定。

### 1-3. 前月比（MoM）

**決定: AsyncStorage キー `subradar_monthly_snapshots` + 起動時チェック方式（案X）**

- キー: `STORE_KEYS.monthlySnapshots = 'subradar_monthly_snapshots'`
- 型: `Record<string, number>`（例: `{ '2026-02': 3480, '2026-03': 4280 }`）
- 保存タイミング: **アプリ起動時に `先月キー` が未保存なら現在の `totalMonthlyJPY` を先月値として保存**

### 1-4. 通知

**決定: `expo-notifications` を実装（インストールから Context 連携まで）**

- パッケージ: `expo-notifications`（package.json に未記載 → 追加が必要）
- 追加方法: `npx expo install expo-notifications`（pnpm workspace 環境のため `pnpm --filter @massapp/sub-radar add expo-notifications` も可）
- identifier 命名: `subradar_{subId}_{daysBefore}d`
- スケジュール方式: `getNextBillingDate()` ベースの絶対日時（`DateTriggerInput`）で統一
- iOS 64件上限対応: `getDaysUntilBilling()` でソートし近い順に優先
- `STORE_KEYS.notificationPermStatus` を追加

### 1-5. RevenueCat

**決定: フェーズ1（モックガード追加）のみ。本番連携はフェーズ2**

```ts
// src/config.ts に追加
export const USE_MOCK_PURCHASES = __DEV__;
```

SettingsScreen の `handlePurchase`・`handleRestore` に本番ビルド時ガードを追加。

### 1-6. 今回実装する機能の確定リスト

| # | 機能 | エージェント | ギャップ参照 |
|---|------|------------|------------|
| 1 | FX_RATES 定義 + calcMonthlyAmountJPY | A | #5 |
| 2 | totalMonthlyJPY / totalYearlyJPY を Context に追加 | A | #5 |
| 3 | useMemo 適用（totalMonthly 等） | A | backend #6 |
| 4 | calcMonthlyAmount 二重実装の解消 | A | backend 7-2 |
| 5 | getNextBillingDate の週次・年次対応 | A | #7-1 |
| 6 | isUnused の初期登録誤検知修正 | A | #7-2 |
| 7 | MomData 型定義・STORE_KEYS 拡張 | A | #2, backend #2 |
| 8 | expo-notifications インストール + app.json 設定 | B | #3 |
| 9 | notificationUtils.ts の実装 | B | #3 |
| 10 | Context CRUD 操作に通知連携 | B | #3 |
| 11 | SettingsScreen 通知 Switch に件数/暫定Caption | B | ui #5 |
| 12 | defaultCurrency → AddModal デフォルト値連携 | C | #7-7 |
| 13 | billingDay を yearly/weekly では保存しない | C | #7-4 |
| 14 | 空状態に onAddPress CTA ボタン追加 | C | ui #6 |
| 15 | カード展開 → 編集ボタンフロー（_expandedId 活用） | C | #6, ui #4 |
| 16 | theme.ts dark palette を AC 値で上書き | D | #1, ui 1-B |
| 17 | 月次スナップショット保存ロジック（起動時チェック） | D | #2, backend #2 |
| 18 | momData 計算・Context expose | D | #2 |
| 19 | MoMBadge コンポーネント化（3状態） | D | #2, ui #2 |
| 20 | プレミアム訴求カード改善（機能リスト + 価格表示） | D | #4, ui #3 |
| 21 | App.tsx Alert に「設定へ」ボタン追加 | D | #7-3, ui 3-alert |
| 22 | RevenueCat モックガード（USE_MOCK_PURCHASES） | D | #4, backend #4 |
| 23 | プライバシーポリシー URL 修正（TODO コメントで差し替え） | D | #7-6 |
| 24 | StatusBar style を `"light"` に変更 | D | #7-8 |

---

## 2. エージェント別実装仕様

### Agent A: データ層

**担当ファイル**:
- `src/config.ts`
- `src/types.ts`
- `src/utils/subscriptionUtils.ts`
- `src/SubscriptionContext.tsx`

---

#### A-1. `src/config.ts` への追加

```ts
import type { Currency } from './types';

// ── 為替レート（JPY換算・参考値）────────────────────────
// フェーズ2で AsyncStorage キャッシュ方式（案B）に移行予定
export const FX_RATES: Record<Currency, number> = {
  JPY: 1,
  USD: 150,
  EUR: 165,
} as const;

export const FX_RATES_LAST_UPDATED = '2026-03'; // 手動更新月を明示

// ── RevenueCat モックガード ───────────────────────────
// __DEV__ = true（開発時）のみモック動作を許可
export const USE_MOCK_PURCHASES = __DEV__;

// ── STORE_KEYS 拡張 ──────────────────────────────────
export const STORE_KEYS = {
  subscriptions:          'subradar_subscriptions',
  notificationConfig:     'subradar_notification_config',
  isPremium:              'subradar_is_premium',
  themeMode:              'subradar_theme_mode',
  monthlySnapshots:       'subradar_monthly_snapshots',     // 追加: 前月比用
  notificationPermStatus: 'subradar_notification_perm',     // 追加: 通知権限状態
} as const;
```

> **注意**: `Currency` 型は `types.ts` から import する。循環依存を避けるため `FX_RATES` の型注釈に `Currency` を使う場合は import 追加。

---

#### A-2. `src/types.ts` への追加

```ts
// ── 前月比データ ──────────────────────────────────────
export interface MomData {
  currentTotal: number;          // 今月のJPY合計
  prevTotal: number | null;      // 先月のJPY合計（null = データなし）
  diffJPY: number | null;        // 差額（正 = 増加、負 = 減少）
  diffPercent: number | null;    // 変化率 % (null = データなし)
  trend: 'up' | 'down' | 'flat' | 'unknown'; // バッジ表示制御用
}

// ── 月次スナップショット ──────────────────────────────
// { 'YYYY-MM': totalMonthlyJPY } 形式
export type MonthlySnapshotMap = Record<string, number>;
```

---

#### A-3. `src/utils/subscriptionUtils.ts` の変更

**追加する関数**:

```ts
import { FX_RATES } from '../config';

/**
 * 月額をJPY換算で返す（通貨変換 + サイクル変換を一括処理）
 */
export function calcMonthlyAmountJPY(sub: Subscription): number {
  return calcMonthlyAmount(sub) * FX_RATES[sub.currency];
}
```

**`getNextBillingDate` の修正** — `billingCycle` を考慮:

```ts
export function getNextBillingDate(sub: Subscription): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (sub.billingCycle) {
    case 'weekly': {
      // startDate（createdAt）から週次で次回を計算
      const start = new Date(sub.createdAt);
      start.setHours(0, 0, 0, 0);
      const msPerWeek = 7 * 24 * 60 * 60 * 1000;
      const elapsed = today.getTime() - start.getTime();
      const weeksElapsed = Math.ceil(elapsed / msPerWeek);
      return new Date(start.getTime() + weeksElapsed * msPerWeek);
    }
    case 'yearly': {
      // billingDay 月（startDate の月）の同日、今年または来年
      const start = new Date(sub.createdAt);
      const month = start.getMonth();
      const day = Math.min(start.getDate(), 28);
      const thisYear = new Date(today.getFullYear(), month, day);
      if (thisYear >= today) return thisYear;
      return new Date(today.getFullYear() + 1, month, day);
    }
    case 'quarterly': {
      // createdAt 月から3ヶ月ごと
      const start = new Date(sub.createdAt);
      start.setHours(0, 0, 0, 0);
      const day = Math.min(start.getDate(), 28);
      let candidate = new Date(start.getFullYear(), start.getMonth(), day);
      while (candidate < today) {
        candidate = new Date(candidate.getFullYear(), candidate.getMonth() + 3, day);
      }
      return candidate;
    }
    case 'monthly':
    default: {
      // 既存ロジック（billingDay 基準）
      const day = Math.min(sub.billingDay, 28);
      const thisMonth = new Date(today.getFullYear(), today.getMonth(), day);
      if (thisMonth >= today) return thisMonth;
      return new Date(today.getFullYear(), today.getMonth() + 1, day);
    }
  }
}
```

**`isUnused` の修正** — 初期登録誤検知を防ぐ:

```ts
export function isUnused(sub: Subscription): boolean {
  // lastTappedAt がない場合は createdAt を基準にする（登録後UNUSED_THRESHOLD_DAYS日は猶予）
  const baseDate = sub.lastTappedAt ?? sub.createdAt;
  if (!baseDate) return false;
  const diffMs = Date.now() - new Date(baseDate).getTime();
  return diffMs > UNUSED_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;
}
```

---

#### A-4. `src/SubscriptionContext.tsx` の変更

**import の更新**:
```ts
import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { calcMonthlyAmount, calcMonthlyAmountJPY } from './utils/subscriptionUtils';
import type { Subscription, MomData } from './types';
```

**`SubscriptionContextValue` インターフェースの拡張**:
```ts
interface SubscriptionContextValue {
  subscriptions: Subscription[];
  isPremium: boolean;
  addSubscription: (sub: Subscription) => boolean;
  updateSubscription: (id: string, patch: Partial<Subscription>) => void;
  deleteSubscription: (id: string) => void;
  totalMonthly: number;     // 既存（後方互換維持・登録通貨のまま）
  totalYearly: number;      // 既存（後方互換維持）
  totalMonthlyJPY: number;  // 追加（FX換算後JPY月額合計）
  totalYearlyJPY: number;   // 追加（FX換算後JPY年間合計）
  momData: MomData;         // 追加（前月比データ）—— エージェントDが実装
}
```

**`totalMonthly` / `totalYearly` に `useMemo` を適用し、二重実装を解消**:
```ts
const totalMonthly = useMemo(
  () => subscriptions
    .filter((s) => s.isActive)
    .reduce((sum, s) => sum + calcMonthlyAmount(s), 0), // switch を直接書かず関数呼び出しに統一
  [subscriptions],
);

const totalMonthlyJPY = useMemo(
  () => subscriptions
    .filter((s) => s.isActive)
    .reduce((sum, s) => sum + calcMonthlyAmountJPY(s), 0),
  [subscriptions],
);

const totalYearly    = useMemo(() => totalMonthly * 12,    [totalMonthly]);
const totalYearlyJPY = useMemo(() => totalMonthlyJPY * 12, [totalMonthlyJPY]);
```

> **momData と月次スナップショット保存はエージェントDが担当。** エージェントAは `momData` のデフォルト値（`unknown` 状態）をContextのデフォルト値に設定しておく。

**Context デフォルト値**:
```ts
const defaultMomData: MomData = {
  currentTotal: 0,
  prevTotal: null,
  diffJPY: null,
  diffPercent: null,
  trend: 'unknown',
};
```

---

### Agent B: 通知

**担当ファイル**:
- `package.json`（expo-notifications 追加）
- `app.json`（plugins 設定）
- `src/utils/notificationUtils.ts`（新規作成）
- `src/SubscriptionContext.tsx`（CRUD 連携）
- `src/screens/SettingsScreen.tsx`（通知 Caption 追加）

---

#### B-1. パッケージインストール

`package.json` に以下を追加（`pnpm --filter @massapp/sub-radar add expo-notifications` 相当）:

```json
"expo-notifications": "~0.29.0"
```

> **注意**: Expo SDK 54 に対応したバージョンを使うこと。`npx expo install expo-notifications` を実行すれば適切なバージョンが自動解決される。

---

#### B-2. `app.json` の plugins 追加

```json
{
  "expo": {
    "plugins": [
      ["expo-notifications", {
        "icon": "./assets/icon.png",
        "color": "#26C6DA",
        "sounds": []
      }]
    ]
  }
}
```

---

#### B-3. `src/utils/notificationUtils.ts`（新規作成）

このファイルに以下の関数を実装:

```ts
import * as Notifications from 'expo-notifications';
import type { Subscription } from '../types';
import { getNextBillingDate, getDaysUntilBilling, formatCurrency } from './subscriptionUtils';

// iOS 64件制限の上限
const MAX_SCHEDULED_NOTIFICATIONS = 60; // 安全マージン4件

/** 通知 identifier の命名規則 */
export function getNotificationId(subId: string, daysBefore: number): string {
  return `subradar_${subId}_${daysBefore}d`;
}

/** 特定サブスクの通知をすべてキャンセル */
export async function cancelNotificationsForSub(subId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(getNotificationId(subId, 3));
  await Notifications.cancelScheduledNotificationAsync(getNotificationId(subId, 1));
}

/**
 * 1つのサブスクの通知をスケジュール
 * - notify3days/notify1day フラグに基づいてスケジュール
 * - 既存の通知はキャンセルしてから再スケジュール
 */
export async function scheduleNotificationsForSub(
  sub: Subscription,
  notify3days: boolean,
  notify1day: boolean,
): Promise<void> {
  // まずキャンセル
  await cancelNotificationsForSub(sub.id);

  if (!sub.isActive) return;

  const nextDate = getNextBillingDate(sub);
  const daysBefores: Array<{ days: number; enabled: boolean }> = [
    { days: 3, enabled: notify3days },
    { days: 1, enabled: notify1day },
  ];

  for (const { days, enabled } of daysBefores) {
    if (!enabled) continue;

    const triggerDate = new Date(nextDate);
    triggerDate.setDate(triggerDate.getDate() - days);
    triggerDate.setHours(9, 0, 0, 0); // 午前9時に通知

    // 過去日時はスキップ
    if (triggerDate <= new Date()) continue;

    await Notifications.scheduleNotificationAsync({
      identifier: getNotificationId(sub.id, days),
      content: {
        title: '請求が近づいています',
        body: `${sub.name} の請求まであと${days}日です（${formatCurrency(sub.amount, sub.currency)}）`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });
  }
}

/**
 * 全サブスクの通知を再スケジュール
 * iOS 64件制限に対応するため、近い順に優先スケジュール
 */
export async function rescheduleAllNotifications(
  subscriptions: Subscription[],
  notify3days: boolean,
  notify1day: boolean,
): Promise<void> {
  // 全通知をキャンセル（個別キャンセル方式）
  for (const sub of subscriptions) {
    await cancelNotificationsForSub(sub.id);
  }

  if (!notify3days && !notify1day) return;

  // 近い順にソート
  const activeSubs = subscriptions
    .filter((s) => s.isActive)
    .sort((a, b) => getDaysUntilBilling(a) - getDaysUntilBilling(b));

  // 件数制限を考慮してスケジュール
  const enabledCount = (notify3days ? 1 : 0) + (notify1day ? 1 : 0);
  const maxSubs = Math.floor(MAX_SCHEDULED_NOTIFICATIONS / enabledCount);

  for (const sub of activeSubs.slice(0, maxSubs)) {
    await scheduleNotificationsForSub(sub, notify3days, notify1day);
  }
}

/** 通知権限をリクエスト */
export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/** スケジュール済み通知の件数を取得 */
export async function getScheduledCount(subId?: string): Promise<number> {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  if (!subId) return all.length;
  return all.filter((n) => n.identifier.startsWith(`subradar_${subId}_`)).length;
}
```

---

#### B-4. `src/SubscriptionContext.tsx` への通知連携

`addSubscription` / `updateSubscription` / `deleteSubscription` に通知スケジューリングを追加。

> **前提**: `useLocalStorage` で `notify3days` と `notify1day` を読み取り。ただし SubscriptionContext が SettingsScreen の状態を直接知るのは設計上問題があるため、以下の方針で実装する:
>
> - `STORE_KEYS.notificationConfig` から `NotificationTiming[]` を読み込む
> - `DEFAULT_NOTIFICATION_TIMINGS` で初期値を設定

```ts
import { DEFAULT_DAYS_BEFORE } from './config';
import {
  scheduleNotificationsForSub,
  cancelNotificationsForSub,
  rescheduleAllNotifications,
} from './utils/notificationUtils';

// Context Provider 内で通知設定を読み込む
const [notificationConfig] = useLocalStorage<{ notify3days: boolean; notify1day: boolean }>(
  STORE_KEYS.notificationConfig,
  { notify3days: true, notify1day: true },
);

// addSubscription: 追加後に通知をスケジュール
const addSubscription = useCallback(
  (sub: Subscription): boolean => {
    if (!isPremium && subscriptions.length >= FREE_LIMIT) return false;
    setSubscriptions([...subscriptions, sub]);
    // 通知スケジュール（非同期・fire-and-forget）
    scheduleNotificationsForSub(sub, notificationConfig.notify3days, notificationConfig.notify1day)
      .catch(() => {}); // エラーは無視（通知は補助機能）
    return true;
  },
  [subscriptions, isPremium, setSubscriptions, notificationConfig],
);

// updateSubscription: 更新後に対象サブスクの通知を再スケジュール
const updateSubscription = useCallback(
  (id: string, patch: Partial<Subscription>) => {
    const updated = subscriptions.map((s) => (s.id === id ? { ...s, ...patch } : s));
    setSubscriptions(updated);
    const updatedSub = updated.find((s) => s.id === id);
    if (updatedSub) {
      scheduleNotificationsForSub(updatedSub, notificationConfig.notify3days, notificationConfig.notify1day)
        .catch(() => {});
    }
  },
  [subscriptions, setSubscriptions, notificationConfig],
);

// deleteSubscription: 削除時に通知をキャンセル
const deleteSubscription = useCallback(
  (id: string) => {
    setSubscriptions(subscriptions.filter((s) => s.id !== id));
    cancelNotificationsForSub(id).catch(() => {});
  },
  [subscriptions, setSubscriptions],
);
```

---

#### B-5. `src/screens/SettingsScreen.tsx` — 通知 Caption の追加

通知設定のスイッチ下部に以下を追加（実装前は暫定Caption）:

```tsx
{/* 3日前通知スイッチの直下 */}
<Text style={settingsCaptionStyle}>
  ※ 通知機能は次回アップデートで有効になります
</Text>
```

> **実装完了後**: `getScheduledCount()` を使って `{N} 件の通知をスケジュール済み` に差し替える。

**STORE_KEYS.notificationConfig への書き込み**: `notify3days` / `notify1day` の Switch 変更時に `STORE_KEYS.notificationConfig` へ保存し、`rescheduleAllNotifications()` を呼ぶ。

```ts
const handleNotify3daysChange = useCallback(async (value: boolean) => {
  setNotify3days(value);
  // notificationConfig を更新して全件再スケジュール
  await rescheduleAllNotifications(subscriptions, value, notify1day);
}, [subscriptions, notify1day]);
```

---

### Agent C: AddSubscriptionModal

**担当ファイル**:
- `src/screens/AddSubscriptionModal.tsx`
- `src/screens/DashboardVariantC.tsx`

---

#### C-1. defaultCurrency → AddModal デフォルト値連携（gap 7-7）

`AddSubscriptionModal.tsx` の先頭で `useLocalStorage` を使って `sub_default_currency` を読み込み、`currency` state の初期値として使う。

```ts
import { useLocalStorage } from '@massapp/hooks';
import type { Currency } from '../types';

// SettingsScreen と同じキーを参照
const [defaultCurrency] = useLocalStorage<Currency>('sub_default_currency', 'JPY');

// form state の初期化時
const [currency, setCurrency] = useState<Currency>(defaultCurrency);
```

> **注意**: `defaultCurrency` が変わっても既に開いているモーダルの状態は変わらない（useEffect での同期は不要）。モーダルを開くたびに `defaultCurrency` の値が使われれば十分。

---

#### C-2. billingDay を yearly/weekly では保存しない（gap 7-4）

`AddSubscriptionModal.tsx` のサブスク保存時:

```ts
const newSub: Subscription = {
  id: ...,
  name,
  amount: parseFloat(amountText),
  currency,
  billingCycle,
  // monthly / quarterly のみ billingDay を使用。yearly / weekly は billingDay 不要
  billingDay: (billingCycle === 'monthly' || billingCycle === 'quarterly')
    ? selectedBillingDay
    : 1, // ダミー値（getNextBillingDate では monthly/quarterly ケースのみ billingDay を参照）
  ...
};
```

> `getNextBillingDate`（Agent A で修正済み）の `yearly`・`weekly` ケースは `billingDay` を使わず `createdAt` を基準にするため、この値は実質無視される。

---

#### C-3. 空状態 CTA ボタン（ui-review #6）

`DashboardVariantC.tsx` の空状態コンテナに `onAddPress` を直接呼ぶボタンを追加:

```tsx
<View style={aStyles.emptyContainer}>
  <Ionicons name="card-multiple-outline" size={80} color={AC.teal + '60'} />
  <Text style={aStyles.emptyTitle}>サブスクを登録しましょう</Text>
  <Text style={aStyles.emptySubtitle}>
    Netflix、Spotify など{'\n'}支払いを一括管理できます
  </Text>
  <TouchableOpacity style={aStyles.emptyCtaButton} onPress={onAddPress}>
    <Ionicons name="add" size={18} color={AC.bgDeep} />
    <Text style={aStyles.emptyCtaText}>最初のサブスクを追加</Text>
  </TouchableOpacity>
</View>
```

スタイル追加:
```ts
emptyCtaButton: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  backgroundColor: AC.teal,
  paddingHorizontal: 20,
  paddingVertical: 12,
  borderRadius: 24,
  marginTop: 20,
},
emptyCtaText: {
  color: AC.bgDeep,
  fontSize: 15,
  fontWeight: '600',
},
```

---

#### C-4. カード展開 → 編集フロー（gap 6, ui-review #4）

`DashboardVariantC.tsx` の変更:

**`handleCardPress` の修正** — 展開/折りたたみのみに変更（即 onEditPress を呼ばない）:
```ts
const handleCardPress = useCallback(
  (sub: Subscription) => {
    updateSubscription(sub.id, { lastTappedAt: new Date().toISOString() });
    setExpandedId((prev) => (prev === sub.id ? null : sub.id));
    // onEditPress(sub) を削除 — 編集ボタンから呼び出す
  },
  [updateSubscription],
);
```

**GridCard または inline に展開エリアを追加**:
- `expandedId === sub.id` のとき、カードの下部に展開パネルを表示
- 展開パネルに「次回請求日 / メモ / カテゴリ / [編集ボタン]」を表示
- `LayoutAnimation.easeInEaseOut()` でアニメーション

展開パネルのレイアウト例（インライン実装）:
```tsx
{expandedId === sub.id && (
  <View style={aStyles.expandedPanel}>
    <Text style={aStyles.expandedLabel}>
      次回: {formatNextBillingDate(sub)} （残{getDaysUntilBilling(sub)}日）
    </Text>
    {sub.note ? <Text style={aStyles.expandedNote}>{sub.note}</Text> : null}
    <TouchableOpacity
      style={aStyles.editButton}
      onPress={() => onEditPress(sub)}
    >
      <Ionicons name="pencil-outline" size={14} color={AC.teal} />
      <Text style={aStyles.editButtonText}>編集</Text>
    </TouchableOpacity>
  </View>
)}
```

**`_expandedId` → `expandedId` にリネーム**（dead code 解消）。

---

### Agent D: Settings + 前月比 + テーマ

**担当ファイル**:
- `src/theme.ts`
- `src/SubscriptionContext.tsx`（momData・スナップショット追加）
- `src/screens/DashboardVariantC.tsx`（MoMBadge）
- `src/screens/SettingsScreen.tsx`（プレミアム訴求カード, モックガード, URL修正）
- `App.tsx`（StatusBar, Alert 改善）

---

#### D-1. `src/theme.ts` — dark palette を AC 値で上書き

```ts
import { presetForestGreen } from '@massapp/ui';
import type { ThemeConfig } from '@massapp/ui';

export const theme: ThemeConfig = {
  ...presetForestGreen,
  name: 'sub-radar',
  colors: {
    ...presetForestGreen.colors,
    light: {
      ...presetForestGreen.colors.light,
      primary:      '#00897B',
      primaryDark:  '#00695C',
      primaryLight: '#4DB6AC',
      secondary:    '#2E7D32',
      secondaryDark:'#1B5E20',
      accent:       '#26A69A',
    },
    dark: {
      ...presetForestGreen.colors.dark,
      primary:       '#26C6DA',  // AC.teal（#4DB6AC から変更）
      primaryDark:   '#00B8D4',
      primaryLight:  '#4DD0E1',
      secondary:     '#66BB6A',
      secondaryDark: '#388E3C',
      accent:        '#80CBC4',
      // @massapp/ui の ThemeConfig 型に存在するキーのみ追加可能
      // 型エラーが出る場合は primary 系のみで可
    },
  },
};
```

> **実装注意**: `@massapp/ui` の `ThemeConfig` 型定義を読んで、`background` / `surface` / `textPrimary` 等のキーが存在するか確認してから追加すること。存在しない場合は `primary` 系のみ変更。

---

#### D-2. `src/SubscriptionContext.tsx` — 月次スナップショット + momData

**必要なインポート追加**:
```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';
import type { MomData, MonthlySnapshotMap } from './types';
import { STORE_KEYS } from './config';
```

**月次スナップショット保存ロジック**（Provider 内に追加）:

```ts
// 月次スナップショットの保存・読み込み
const [monthlySnapshots, setMonthlySnapshots] = useLocalStorage<MonthlySnapshotMap>(
  STORE_KEYS.monthlySnapshots,
  {},
);

// アプリ起動時: 先月分のスナップショットが未保存なら保存
useEffect(() => {
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7); // 'YYYY-MM'
  // 先月キー計算
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonth = prevDate.toISOString().slice(0, 7);

  if (!monthlySnapshots[prevMonth] && totalMonthlyJPY > 0) {
    setMonthlySnapshots({
      ...monthlySnapshots,
      [prevMonth]: totalMonthlyJPY,
    });
  }

  // 今月スナップショットも最新状態に更新（サブスク変更追跡用）
  if (monthlySnapshots[currentMonth] !== totalMonthlyJPY) {
    setMonthlySnapshots((prev) => ({
      ...prev,
      [currentMonth]: totalMonthlyJPY,
    }));
  }
}, []); // 起動時1回のみ
```

**momData の計算**:

```ts
const momData = useMemo((): MomData => {
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonth = prevDate.toISOString().slice(0, 7);

  const current = totalMonthlyJPY;
  const prev = monthlySnapshots[prevMonth] ?? null;

  if (prev === null || prev === 0) {
    return {
      currentTotal: current,
      prevTotal: null,
      diffJPY: null,
      diffPercent: null,
      trend: 'unknown',
    };
  }

  const diffJPY = current - prev;
  const diffPercent = Math.round((diffJPY / prev) * 100);

  return {
    currentTotal: current,
    prevTotal: prev,
    diffJPY,
    diffPercent,
    trend: diffJPY > 0 ? 'up' : diffJPY < 0 ? 'down' : 'flat',
  };
}, [totalMonthlyJPY, monthlySnapshots]);
```

---

#### D-3. `DashboardVariantC.tsx` — MoMBadge コンポーネント化

`DashboardVariantC.tsx` 内に以下のコンポーネントを追加（ファイル内ローカルコンポーネント）:

```tsx
function MoMBadge({ momData }: { momData: MomData }) {
  if (momData.trend === 'unknown' || momData.diffPercent === null) {
    return (
      <View style={[aStyles.momBadge, aStyles.momBadgeNeutral]}>
        <Ionicons name="remove-outline" size={12} color={AC.textMid} />
        <Text style={[aStyles.momText, { color: AC.textMid }]}>前月比 -</Text>
      </View>
    );
  }

  const isUp = momData.trend === 'up';
  const color = isUp ? '#F44336' : AC.teal;
  const icon = isUp ? 'trending-up-outline' : 'trending-down-outline';
  const badgeStyle = isUp ? aStyles.momBadgeUp : aStyles.momBadgeDown;

  return (
    <View style={[aStyles.momBadge, badgeStyle]}>
      <Ionicons name={icon} size={12} color={color} />
      <Text style={[aStyles.momText, { color }]}>
        前月比 {isUp ? '+' : ''}{momData.diffPercent}%
      </Text>
    </View>
  );
}
```

既存の固定バッジ箇所（`DashboardVariantC.tsx:423-426` 付近）を `<MoMBadge momData={momData} />` に差し替え。`momData` は `useSubscriptions()` から取得。

---

#### D-4. `SettingsScreen.tsx` — プレミアム訴求カード改善（ui-review #3）

`planCard` 内を以下の構成に拡張:

```tsx
{/* プレミアム価格 */}
<Text style={styles.premiumPrice}>¥{PREMIUM_PRICE_JPY.toLocaleString()} <Text style={styles.premiumPriceNote}>買い切り（サブスクではありません）</Text></Text>

{/* 機能リスト */}
{[
  'サブスク登録 無制限',
  '請求日通知（3日前・前日）',
  '前月比トレンドバッジ',
  '将来機能の優先アクセス',
].map((feature) => (
  <View key={feature} style={styles.featureRow}>
    <Ionicons name="checkmark-circle-outline" size={16} color={colors.primary} />
    <Text style={styles.featureText}>{feature}</Text>
  </View>
))}

{/* 購入ボタン / 復元ボタン */}
<Button onPress={handlePurchase} loading={purchasing}>
  プレミアムにアップグレード
</Button>
<Button variant="ghost" onPress={handleRestore} loading={restoring}>
  購入を復元
</Button>
```

---

#### D-5. `SettingsScreen.tsx` — RevenueCat モックガード

```ts
import { USE_MOCK_PURCHASES } from '../config';

const handlePurchase = useCallback(async () => {
  if (!USE_MOCK_PURCHASES) {
    // TODO: RevenueCat 本番統合（フェーズ2）
    Alert.alert('エラー', '本番ビルドでは RevenueCat 統合が必要です');
    return;
  }
  // 既存のモック実装
  setPurchasing(true);
  await new Promise<void>((resolve) => setTimeout(resolve, 800));
  setIsPremium(true);
  setPurchasing(false);
}, [setIsPremium]);
```

---

#### D-6. `SettingsScreen.tsx` — プライバシーポリシー URL 修正

```ts
// 現状
const PRIVACY_URL = 'https://massapp.example.com/sub-radar/privacy';

// 修正後（TODO: App Store 審査前に実際のURLに差し替え）
const PRIVACY_URL = 'https://massapp.example.com/sub-radar/privacy'; // TODO: 本番URLに差し替え
```

> コード上は変更なし（ダミーURLのまま）だが、コメントを `TODO: 本番URLに差し替え` に統一し、grep で検索しやすくする。

---

#### D-7. `App.tsx` — StatusBar + Alert 改善

**StatusBar**:
```tsx
// 変更前
<StatusBar style="auto" />
// 変更後（ダークダッシュボードに合わせて常に light）
<StatusBar style="light" />
```

**Alert 改善（gap 7-3）**:
```tsx
// App.tsx の無料版上限到達 Alert
Alert.alert(
  '無料版の上限（3件）に達しました',
  'プレミアムにアップグレードすると無制限に追加できます',
  [
    { text: 'キャンセル', style: 'cancel' },
    {
      text: 'アップグレードを見る',
      onPress: () => {
        // Settings タブへ移動
        // RootNavigator の構造に合わせて navigation.navigate('Settings') 等を呼ぶ
      },
    },
  ],
);
```

> `navigation` が App.tsx から直接取れない場合は、`onAddPress` コールバックで上限到達フラグを返し、App.tsx 側でナビゲーションする設計に変更。

---

## 3. 実装順序・依存関係

```
[Agent A: データ層]  ──┐
                        ├──> [Agent D: Settings+前月比]  （totalMonthlyJPY, momData 型に依存）
[Agent B: 通知]    ──┘
                   （STORE_KEYS.notificationConfig, calcMonthlyAmountJPY に依存）

[Agent C: AddModal]   （独立。theme.ts 変更後は自動追従）
```

**推奨実行順**: A → C（並列可）→ B → D
- A が型・関数を定義してから B・D が実装する
- C は A と並列実行可能（defaultCurrency 読み込みは既存 useLocalStorage で実装可能）

---

## 4. 品質チェックリスト

エージェントは実装完了後、以下を確認すること:

- [ ] `pnpm --filter @massapp/sub-radar typecheck` でTypeScriptエラーなし
- [ ] `totalMonthlyJPY` が USD/EUR サブスク混在時に正しく換算されること
- [ ] `getNextBillingDate` が weekly / yearly / quarterly で正しい日時を返すこと
- [ ] `isUnused` が登録直後（lastTappedAt=undefined）のサブスクに false を返すこと
- [ ] expo-notifications の通知 identifier が `subradar_{id}_{days}d` 形式になっていること
- [ ] `USE_MOCK_PURCHASES` が本番ビルドで false になること（`__DEV__` の動作確認）
- [ ] theme.ts 変更後に AddSubscriptionModal が AC.teal のボタン色で表示されること
- [ ] 月次スナップショットが `STORE_KEYS.monthlySnapshots` キーに `{ 'YYYY-MM': number }` 形式で保存されること
- [ ] MoMBadge が momData.trend に応じて up/down/neutral の3状態を正しく表示すること

---

## 5. 今回スコープ外（フェーズ2以降）

| 項目 | 理由 |
|------|------|
| RevenueCat 本番統合 | 商品設定・APIキー等の外部準備が必要 |
| 動的為替レート取得（案B） | APIキー管理・エラーハンドリング要 |
| プライバシーポリシー URL 本番差し替え | 本番 URL の確定が必要 |
| DashboardVariantC の useTheme 移行 | フェーズ3のリファクタ対象 |
| BottomSheet 詳細フロー | 工数大・フェーズ3 UX 改善 |

---

*作成: Claude Sonnet 4.6 / 2026-03-23*

---

## 要追加パッケージ

```
pnpm add expo-notifications
```

`expo-notifications` は `package.json` に未登録のため、実装前に追加が必要。
