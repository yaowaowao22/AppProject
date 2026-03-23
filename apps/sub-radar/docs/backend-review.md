# SubRadar — バックエンド・データ設計レビュー

作成日: 2026-03-23
レビュー対象: `src/SubscriptionContext.tsx`, `src/utils/subscriptionUtils.ts`, `src/types.ts`, `src/config.ts`, `package.json`

---

## 凡例

| ラベル | 説明 |
|--------|------|
| 【採用推奨】 | 明確なメリットがあり、迷いなく採用すべき |
| 【要議論】 | トレードオフがあり、要件・工数感で判断が変わる |
| 【オプション】 | あると良いが必須ではない。後回し可 |

---

## 1. 通貨換算設計

### 現状の問題

`SubscriptionContext.tsx:14` のコメントには `// 全サブスクの月額合計（JPY換算）` と書かれているが、
`totalMonthly` の計算（65-75行目）は**通貨を一切無視して加算**している。
USD $9.99 と JPY ¥1,500 が同じ数値として足されると `¥2,499` ではなく `¥11` 相当の意味不明な値になる（`9.99 + 1500 ≒ 1510`、さらに `monthly` 以外はサイクル換算が入るため数値は変動）。

また `calcMonthlyAmount` 関数自体にも `// 通貨換算は行わず、登録通貨のまま計算` とコメントされており、
ContextとUtilsで責任の所在が曖昧になっている。

### 各案のトレードオフ

| 案 | 方式 | メリット | デメリット |
|----|------|----------|------------|
| **案A** | `config.ts` に固定レート定義 | 実装コスト小・オフライン動作・即リリース可 | レートが古くなる（USD/JPY は年10-20%変動することも） |
| **案B** | AsyncStorage定期更新（外部API） | 精度が高い | APIキー管理・エラーハンドリング・ネットワーク依存 |
| **案C** | 換算しない（ユーザー任せ） | 実装ゼロ | ダッシュボードの「合計金額」が破綻する |

### 推奨設計 【採用推奨】案A → フェーズ2で案Bへ移行

**`src/config.ts` への追加:**

```typescript
// ── 為替レート（JPY換算・参考値）────────────────────
// フェーズ2で AsyncStorage キャッシュ方式に移行予定
export const FX_RATES: Record<Currency, number> = {
  JPY: 1,
  USD: 150,
  EUR: 165,
} as const;

export const FX_RATES_LAST_UPDATED = '2026-03'; // 手動更新月を明示
```

**`src/utils/subscriptionUtils.ts` への追加関数:**

```typescript
import { FX_RATES } from '../config';

/** 月額をJPY換算で返す（通貨変換 + サイクル変換を一括処理） */
export function calcMonthlyAmountJPY(sub: Subscription): number {
  return calcMonthlyAmount(sub) * FX_RATES[sub.currency];
}
```

**`SubscriptionContext.tsx` の修正方針:**

```typescript
// totalMonthly → totalMonthlyJPY にリネームして責任を明確化
const totalMonthlyJPY = useMemo(
  () => subscriptions
    .filter((s) => s.isActive)
    .reduce((sum, s) => sum + calcMonthlyAmountJPY(s), 0),
  [subscriptions],
);
```

**UI上の注意:** ダッシュボードの合計金額表示には小さく `※為替レートは参考値です` を付ける。
ユーザーが「なぜ計算がずれるのか」と混乱しないための配慮。

### 【要議論】案B（定期更新）の採用タイミング

ExchangeRate-API（フリープラン：1500リクエスト/月）等を利用すれば、
アプリ起動時に1日1回バックグラウンドでレートを取得・AsyncStorageキャッシュという構成が可能。
ただし `STORE_KEYS.fxRates` の追加・エラー時フォールバック（案Aの固定値）設計が必要。
フェーズ1は案Aで十分。多通貨ユーザーが増えてきたフェーズ2以降で検討。

---

## 2. 前月比（MoM）計算設計

### 現状の問題

`DashboardVariantC.tsx:423-426` で MoMバッジが常に `'-'` 固定。
スタイル（`momBadgeUp` / `momBadgeDown`）は完成済みで、月次スナップショットの保存・読み取りロジックのみ欠落。

### AsyncStorage キー設計 【採用推奨】

**`src/config.ts` への追加:**

```typescript
export const STORE_KEYS = {
  subscriptions:      'subradar_subscriptions',
  notificationConfig: 'subradar_notification_config',
  isPremium:          'subradar_is_premium',
  themeMode:          'subradar_theme_mode',
  monthlySnapshots:   'subradar_monthly_snapshots', // 追加
} as const;
```

**スナップショットのデータ構造:**

```typescript
// AsyncStorage 格納値の型
type MonthlySnapshotMap = Record<string, number>; // { 'YYYY-MM': totalMonthlyJPY }
// 例: { '2026-01': 2980, '2026-02': 3480, '2026-03': 4280 }
```

月次キーは `new Date().toISOString().slice(0, 7)` で `'YYYY-MM'` 形式。

### 保存タイミング 【要議論】

**案X: アプリ起動時チェック**
起動時に「今月分のスナップショットがなければ現在値を保存」する。
→ 月をまたいで起動するだけで自動保存。追加実装が最小限。
→ **欠点:** 月初1日に起動しない場合、直近の更新後スナップショットが取れない。

**案Y: サブスク変更時にも保存**
`addSubscription` / `updateSubscription` / `deleteSubscription` のたびに今月分を上書き保存。
→ 常に最新の「今月の合計」が記録される。
→ **欠点:** 「月末時点の合計」ではなく「最後に操作した時点の合計」になる。

**推奨:** 案Xをベースに、月初起動時のみ「先月分」として確定保存する形。

```typescript
// SubscriptionContext 内の処理イメージ
const CURRENT_MONTH = new Date().toISOString().slice(0, 7); // '2026-03'
const PREV_MONTH = getPrevMonth(CURRENT_MONTH);             // '2026-02'

// 起動時: 先月スナップショットが未保存なら保存
if (!snapshots[PREV_MONTH]) {
  // 先月末時点の値は取れないため、今月の初回起動値を先月として近似保存
  saveSnapshot(PREV_MONTH, totalMonthlyJPY);
}
```

### MomData 型設計 【採用推奨】

**`src/types.ts` への追加:**

```typescript
export interface MomData {
  currentTotal: number;         // 今月のJPY合計
  prevTotal: number | null;      // 先月のJPY合計（null = データなし）
  diffJPY: number | null;        // 差額（正 = 増加、負 = 減少）
  diffPercent: number | null;    // 変化率 % (null = データなし)
  trend: 'up' | 'down' | 'flat' | 'unknown'; // バッジ表示制御用
}
```

**`SubscriptionContextValue` への追加:**

```typescript
interface SubscriptionContextValue {
  // ... 既存
  totalMonthlyJPY: number;
  momData: MomData;
}
```

---

## 3. Expo Notifications 設計

### 現状の問題

- `expo-notifications` が **`package.json` に未記載**（インストールなし）
- `NotificationTiming` 型（`types.ts:43-46`）と `DEFAULT_DAYS_BEFORE`（`config.ts:17`）は定義済みだが、どこにも接続されていない
- `SettingsScreen.tsx` の `notify3days` / `notify1day` はフラグ保存のみ

### パッケージ追加 【採用推奨】

```bash
npx expo install expo-notifications
```

`app.json` のプラグイン設定も必要:

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

### 通知 identifier 命名規則 【採用推奨】

形式: `subradar_{subId}_{daysBefore}d`
例: `subradar_abc123_3d`（abc123のサブスクの3日前通知）、`subradar_abc123_1d`（前日通知）

この命名により:
- サブスク削除時 → そのサブスクの全通知を `cancelScheduledNotificationAsync` で個別キャンセル可能
- 設定変更時 → `daysBefore` 単位でキャンセル・再スケジュール可能
- デバッグ時 → `getScheduledNotificationsAsync()` で何がスケジュール済みか一目瞭然

**`STORE_KEYS` への追加:**

```typescript
notificationPermissionStatus: 'subradar_notification_permission_status', // 'granted' | 'denied' | 'undetermined'
```

### スケジュール戦略 【要議論】

**月次サブスクの場合:**
`CalendarTriggerInput`（月次繰り返し）を使うのが最もシンプル:

```typescript
await scheduleNotificationAsync({
  identifier: `subradar_${sub.id}_3d`,
  content: {
    title: '請求が近づいています',
    body: `${sub.name} の請求まであと3日です（${formatCurrency(sub.amount, sub.currency)}）`,
  },
  trigger: {
    type: SchedulableTriggerInputTypes.CALENDAR,
    day: Math.max(1, sub.billingDay - 3),
    hour: 9,
    minute: 0,
    repeats: true,
  },
});
```

**月をまたぐ問題（例: billingDay=2、3日前=前月末29日）の考慮が必要。**
この場合は `DateTriggerInput` で絶対日時指定が安全。次回請求日を `getNextBillingDate()` で取得して、そこから `daysBefore` を引いた日時を計算する。

**週次・年次サブスクへの対応:**
`getNextBillingDate()` を billingCycle 対応に修正した後（ギャップ7-1の修正後）、
絶対日時方式で統一する方が確実。

**iOS 64件制限への対処:**
アクティブなサブスク数 × `daysBefore` の数 = 合計通知件数。
例: 30件 × 2 = 60件 → ギリギリ。
上限超過の場合は `getDaysUntilBilling()` でソートし、近い順に64件を優先スケジュール。
`STORE_KEYS` にスケジュール済み件数を保存してチェック。

### 通知スケジュール再構築タイミング 【採用推奨】

```
addSubscription()    → 全件再スケジュール
updateSubscription() → 対象サブスクの通知のみ再スケジュール
deleteSubscription() → 対象サブスクの通知をキャンセル
notify設定 ON/OFF   → 全件再スケジュール or 全件キャンセル
```

**注意:** `cancelAllScheduledNotificationsAsync()` は全通知を消すため、複数サブスク管理では identifier 指定のキャンセルを推奨。

---

## 4. RevenueCat 統合フェーズ設計

### 現状

`react-native-purchases@9.10.5` インストール済みだが **一切インポートなし**。
`SettingsScreen.tsx:107-115` の `handlePurchase` は `setTimeout(800)` で誰でも無料プレミアム化。

### フェーズ分け推奨 【採用推奨】

**フェーズ1（今すぐ対応）: モックに開発モードガードを追加**

App Store 提出前に誤提出を防ぐため、モック購入に明示的なフラグを設ける:

```typescript
// config.ts に追加
export const USE_MOCK_PURCHASES = __DEV__; // 本番ビルドでは false になる

// SettingsScreen.tsx
if (!USE_MOCK_PURCHASES) {
  throw new Error('RevenueCat integration not yet implemented for production');
}
```

これにより本番ビルドで誤ってモック動作が走ることを防止できる。

**フェーズ2（App Store 提出前）: RevenueCat 本番統合**

実装チェックリスト:
1. RevenueCat ダッシュボードで商品設定（`com.massapp.subradar.premium` 等）
2. Entitlement ID: `premium` を作成
3. `App.tsx` 起動時に `Purchases.configure({ apiKey: RC_API_KEY })`
4. `SettingsScreen` の `handlePurchase` を `Purchases.purchasePackage(pkg)` に差し替え
5. `handleRestore` を `Purchases.restorePurchases()` に差し替え
6. `isPremium` 判定を `customerInfo.entitlements.active['premium']` から取得
7. APIキーを `app.json` の `extra` または環境変数で管理

**セキュリティ注意事項:** RevenueCat SDK がサーバーサイドでレシート検証するため、
クライアントの `AsyncStorage` に `isPremium: true` を保存する現在の方式は廃止し、
SDK からの entitlement 状態をソースオブトゥルースとする。

### 【要議論】APIキー管理

```json
// app.json
{
  "expo": {
    "extra": {
      "revenueCatApiKeyIOS": "appl_xxxxxxxx",
      "revenueCatApiKeyAndroid": "goog_xxxxxxxx"
    }
  }
}
```

`expo-constants` 経由でアクセス。ただしこれはクライアント側コードに含まれるため、
APIキーの秘匿性はRevenueCat側の設定（Bundle ID制限等）に依存する。

---

## 5. SubscriptionContext 拡張設計

### 型定義の追加 【採用推奨】

**`src/types.ts`:**

```typescript
// 既存の NotificationTiming に加えて追加
export interface MomData {
  currentTotal: number;
  prevTotal: number | null;
  diffJPY: number | null;
  diffPercent: number | null;
  trend: 'up' | 'down' | 'flat' | 'unknown';
}

// FX_RATES は config.ts に定義（types.ts には型のみ）
// → Currency 型は既存のまま流用
```

**`SubscriptionContextValue` の拡張:**

```typescript
interface SubscriptionContextValue {
  subscriptions: Subscription[];
  isPremium: boolean;
  addSubscription: (sub: Subscription) => boolean;
  updateSubscription: (id: string, patch: Partial<Subscription>) => void;
  deleteSubscription: (id: string) => void;
  totalMonthly: number;       // 既存（登録通貨のまま合計 → 後方互換維持）
  totalMonthlyJPY: number;    // 追加（FX換算後JPY合計）
  totalYearly: number;        // 既存
  totalYearlyJPY: number;     // 追加（FX換算後JPY年間合計）
  momData: MomData;           // 追加（前月比データ）
}
```

**後方互換方針:** `totalMonthly` は既存のまま残し、新たに `totalMonthlyJPY` を追加。
既存コードへの影響を最小化しつつ、ダッシュボードは段階的に `totalMonthlyJPY` へ移行。

### calcMonthlyAmountJPY の追加 【採用推奨】

`subscriptionUtils.ts` に追加:

```typescript
import { FX_RATES } from '../config';

/**
 * 月額をJPY換算で返す（通貨変換 + サイクル変換を一括処理）
 */
export function calcMonthlyAmountJPY(sub: Subscription): number {
  return calcMonthlyAmount(sub) * FX_RATES[sub.currency];
}
```

**注意:** `FX_RATES` を `subscriptionUtils.ts` が `config.ts` からインポートすることで、
換算ロジックが一箇所に集約される。Context 側では `calcMonthlyAmountJPY` を呼ぶだけでよい。

---

## 6. パフォーマンス（useMemo適用）

### 現状の問題

`SubscriptionContext.tsx:65-77` の `totalMonthly` と `totalYearly` は**プレーンな変数**として宣言されており、
`useMemo` が使われていない。Provider コンポーネントが再レンダリングされるたびに毎回 `reduce` が走る。

```typescript
// 現状（useMemo なし）
const totalMonthly = subscriptions
  .filter((s) => s.isActive)
  .reduce(..., 0);

const totalYearly = totalMonthly * 12;
```

### 推奨修正 【採用推奨】

```typescript
import React, { createContext, useContext, useCallback, useMemo } from 'react'; // useMemo 追加

const totalMonthly = useMemo(
  () => subscriptions
    .filter((s) => s.isActive)
    .reduce((sum, s) => {
      switch (s.billingCycle) {
        case 'monthly':   return sum + s.amount;
        case 'yearly':    return sum + s.amount / 12;
        case 'quarterly': return sum + s.amount / 3;
        case 'weekly':    return sum + s.amount * 4.33;
        default:          return sum;
      }
    }, 0),
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

**効果:**
- サブスクリプションリストが変化しない限り再計算しない
- `useMemo` のインポートを `SubscriptionContext.tsx:1` に追加する必要あり（現在 `useCallback` のみ）

### 【オプション】週次換算係数の精度改善

現状の `4.33`（= 365/12/7）は概算。
より正確には `52.1775 / 12 ≈ 4.348` だが、サブスクトラッカーでは `4.33` で十分。
変更すると既存ユーザーの表示金額が微妙に変わるためそのままでも問題なし。

---

## 7. その他の気づき（コードレビュー）

### 7-1. `totalYearly` の計算精度 【オプション】

```typescript
const totalYearly = totalMonthly * 12;
```

年次サブスク（例: ¥12,000/年）は `totalMonthly` で ¥1,000 に換算され、
`totalYearly` で ¥12,000 に戻る。計算上は正しいが、小数点の丸め誤差が蓄積する可能性。
実用上の問題は軽微だが、意識しておく価値あり。

### 7-2. `calcMonthlyAmount` と Context の二重実装 【採用推奨】

`calcMonthlyAmount`（`subscriptionUtils.ts:8-16`）と `SubscriptionContext.tsx:68-74` の
`reduce` 内の `switch` 文が**まったく同じロジックの二重実装**になっている。

Context 側を `calcMonthlyAmount` 呼び出しに統一すべき:

```typescript
// SubscriptionContext.tsx の totalMonthly 計算を:
.reduce((sum, s) => sum + calcMonthlyAmount(s), 0)
// に変更（switch 文の二重化を解消）
```

### 7-3. `STORE_KEYS` の拡張が必要な項目まとめ

フェーズ1-2で追加すべき `STORE_KEYS`:

```typescript
export const STORE_KEYS = {
  subscriptions:               'subradar_subscriptions',
  notificationConfig:          'subradar_notification_config',
  isPremium:                   'subradar_is_premium',
  themeMode:                   'subradar_theme_mode',
  monthlySnapshots:            'subradar_monthly_snapshots',    // 前月比用（フェーズ2）
  fxRates:                     'subradar_fx_rates',             // 動的レート用（フェーズ2・案B時）
  notificationPermStatus:      'subradar_notification_perm',    // 通知権限状態（フェーズ2）
} as const;
```

### 7-4. `NotificationTiming` 型の活用 【採用推奨】

`types.ts:43-46` に `NotificationTiming` が定義済みだが、どこにも使われていない。
通知実装時に `notificationConfig` の型として活用:

```typescript
// config.ts との連携
export const DEFAULT_NOTIFICATION_TIMINGS: NotificationTiming[] = [
  { daysBefore: 3, enabled: true },
  { daysBefore: 1, enabled: true },
];
```

`STORE_KEYS.notificationConfig` のデシリアライズ型として `NotificationTiming[]` を使用。

---

## 優先度サマリー

| # | 項目 | ラベル | フェーズ | 工数 |
|---|------|--------|----------|------|
| 1 | `useMemo` 追加（totalMonthly 等） | 【採用推奨】 | 1 | 〜1h |
| 2 | calcMonthlyAmount 二重実装の解消 | 【採用推奨】 | 1 | 〜1h |
| 3 | FX_RATES を config.ts に追加 | 【採用推奨】 | 1 | 〜2h |
| 4 | calcMonthlyAmountJPY 関数追加 | 【採用推奨】 | 1 | 〜1h |
| 5 | totalMonthlyJPY を Context に追加 | 【採用推奨】 | 1 | 〜2h |
| 6 | STORE_KEYS に monthlySnapshots 追加 | 【採用推奨】 | 2 | 〜1h |
| 7 | MomData 型定義 + Context 追加 | 【採用推奨】 | 2 | 〜3h |
| 8 | expo-notifications インストール・設計 | 【採用推奨】 | 2 | 大 |
| 9 | 通知 identifier 命名規則確定 | 【採用推奨】 | 2 | 〜1h |
| 10 | RevenueCat モックガード追加 | 【採用推奨】 | 1 | 〜1h |
| 11 | RevenueCat 本番統合 | 【要議論】 | 2 | 大 |
| 12 | 外部API動的為替レート（案B） | 【要議論】 | 3 | 中 |
| 13 | NotificationTiming 型の活用 | 【採用推奨】 | 2 | 〜1h |
| 14 | totalYearly 丸め誤差改善 | 【オプション】 | 3 | 〜1h |

---

*レビュー実施: Claude Sonnet 4.6 / 2026-03-23*
