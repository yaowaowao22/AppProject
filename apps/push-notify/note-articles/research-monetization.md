# 「かんたんプッシュ」課金・収益化 調査レポート

> 記事1執筆用の素材集。ソースコードから抽出した具体的なコード・数値・設計判断をまとめる。

---

## 1. RevenueCat課金関連コード

### ファイル: `src/utils/purchases.ts`（全63行）

RevenueCatの `react-native-purchases` をラップした薄いユーティリティ。

```ts
// ── 初期化 ──
const REVENUECAT_IOS_KEY = 'appl_frBDjrHKKZhHlPYwQdmeOgXzzFq';
const REVENUECAT_ANDROID_KEY = 'appl_frBDjrHKKZhHlPYwQdmeOgXzzFq';
const ENTITLEMENT_ID = 'premium';

export async function initPurchases(): Promise<void> {
  if (initialized) return;
  const key = Platform.OS === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;
  Purchases.configure({ apiKey: key });
  initialized = true;
}
```

**設計判断ポイント:**
- iOS/Android で同一キー（RevenueCat側で統合管理）
- `initialized` フラグで二重初期化を防止（シンプルなシングルトン）
- API Key未設定時は `console.warn` して早期リターン（開発時の安全弁）

### buyPremium() — 購入フロー

```ts
export async function buyPremium(): Promise<{ success: boolean; error?: string }> {
  const offerings = await Purchases.getOfferings();
  const pkg = offerings.current?.availablePackages[0];
  if (!pkg) return { success: false, error: '購入可能なプランが見つかりません' };

  const { customerInfo } = await Purchases.purchasePackage(pkg);
  const hasPremium = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  return { success: hasPremium, error: hasPremium ? undefined : '購入処理に失敗しました' };
}
```

**設計判断ポイント:**
- `offerings.current?.availablePackages[0]` — RevenueCatの「Current Offering」から最初のパッケージを自動取得。**商品を1つだけに絞るシンプル設計**
- ユーザーキャンセル時は `e.userCancelled` で判定し、エラー表示を抑制
- 返り値は `{ success, error? }` の統一フォーマット

### restorePurchases() — 購入復元

```ts
export async function restorePurchases(): Promise<boolean> {
  const info: CustomerInfo = await Purchases.restorePurchases();
  return info.entitlements.active[ENTITLEMENT_ID] !== undefined;
}
```

**記事で使えるポイント:** Apple審査で「購入復元」ボタンは必須。このコードは**わずか6行**で実装完了。

### checkPremium() — 状態確認

```ts
export async function checkPremium(): Promise<boolean> {
  const info: CustomerInfo = await Purchases.getCustomerInfo();
  return info.entitlements.active[ENTITLEMENT_ID] !== undefined;
}
```

---

## 2. フリーミアム設計

### FREE_LIMIT定数: `src/types.ts`

```ts
export const FREE_LIMIT = 10;
```

**月10通まで無料。プレミアムは無制限。**

### UsageInfo型定義

```ts
export interface UsageInfo {
  monthKey: string; // "2026-02" format
  count: number;
}
```

### クライアント側の使用量管理: `App.tsx`

```ts
// サーバーから使用状況を同期
useEffect(() => {
  if (apiKeyLoading || !apiKey) return;
  (async () => {
    const res = await fetch(`${API_BASE}/api/status?token=${apiKey}`);
    const data = await res.json();
    if (data.usage) {
      setUsage({ monthKey: data.usage.month, count: data.usage.count });
    }
  })();
}, [apiKey, apiKeyLoading, setUsage]);
```

### クライアント側の送信制限チェック: `SetupScreen.tsx`

```ts
if (!isPremium && currentUsage.count >= FREE_LIMIT) {
  Alert.alert(
    '送信制限',
    `無料プランの月${FREE_LIMIT}通に達しました。\n設定タブからプレミアムにアップグレードしてください。`
  );
  return;
}
```

### サーバー側の送信制限: `server/push-api/src/index.ts`

```
FREE_MONTHLY_LIMIT = env.FREE_MONTHLY_LIMIT（デフォルト: 10）

- 無料ユーザー: 月10通まで（超過で 429 エラー）
- プレミアムユーザー: 日2000通まで（超過で 429 エラー）
- 使用量は KV に保存（月次: 60日TTL、日次: 2日TTL）
```

**設計判断ポイント:**
- **二重チェック**: クライアント側（UX即時フィードバック）+ サーバー側（セキュリティ）
- サーバーは Cloudflare Workers KV で使用量をカウント
- プレミアムでも日2000通の安全上限あり（悪用防止）

### プレミアム状態管理: `UsageContext.tsx`

```ts
interface UsageContextValue {
  usage: UsageInfo;
  isPremium: boolean;
}

const UsageContext = createContext<UsageContextValue>({
  usage: { monthKey: getCurrentMonthKey(), count: 0 },
  isPremium: false,
});

export const UsageProvider = UsageContext.Provider;
export function useUsage(): UsageContextValue {
  return useContext(UsageContext);
}
```

**記事で使えるポイント:** React Contextで `isPremium` と `usage` を全画面に配信。画面ごとにfetchする必要なし。

### 課金状態のサーバー同期: `SettingsScreen.tsx`

```ts
const syncPremiumToServer = useCallback(
  (token: string) => {
    fetch(`${API_BASE}/api/premium`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    }).catch(() => {});
  },
  []
);
```

**記事で使えるポイント:** 購入完了後にサーバー側のKVにもプレミアムフラグを保存。RevenueCat → クライアント → サーバーの3層同期。`.catch(() => {})` でネットワークエラー時もUIをブロックしない。

### アプリ起動時のプレミアム復元: `App.tsx`

```ts
// RevenueCat初期化 + premium状態同期
useEffect(() => {
  if (apiKeyLoading || !apiKey) return;
  (async () => {
    await initPurchases();
    const hasPremium = await checkPremium();
    setIsPremium(hasPremium);
    if (hasPremium) {
      fetch(`${API_BASE}/api/premium`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: apiKey }),
      }).catch(() => {});
    }
  })();
}, [apiKey, apiKeyLoading]);
```

**記事で使えるポイント:** 毎回起動時にRevenueCatから最新のプレミアム状態を取得し、サーバーにも同期。端末を変えても購入が反映される仕組み。

---

## 3. 課金UI: `SettingsScreen.tsx`

### 価格表示とアップグレードボタン

```tsx
<Caption color={colors.textSecondary}>
  {isPremium ? '送信数無制限・買い切り済み' : `月${FREE_LIMIT}通まで無料`}
</Caption>
<Badge
  label={isPremium ? '有効' : `${currentCount}/${FREE_LIMIT}`}
  variant={isPremium ? 'success' : 'info'}
/>
{!isPremium && (
  <Button
    title={purchasing ? '処理中...' : 'プレミアムにアップグレード — ¥300'}
    onPress={handlePurchase}
    variant="primary"
    disabled={purchasing}
  />
)}
```

**記事で使える数値:**
- **価格: ¥300（買い切り）**
- サブスクではなく一回購入で永久プレミアム
- 無料: 月10通 / プレミアム: 無制限

### 購入復元UI

```tsx
<ListItem
  title="購入を復元"
  subtitle={restoring ? '復元中...' : '別端末での購入を復元'}
  onPress={restoring ? undefined : handleRestorePurchase}
  rightIcon={
    restoring
      ? <ActivityIndicator size="small" color={colors.primary} />
      : <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
  }
/>
```

### 使用量バッジ表示（受信箱ヘッダー: `InboxScreen.tsx`）

```tsx
<Badge
  label={isPremium ? 'プレミアム' : `無料 ${currentCount}/${FREE_LIMIT}`}
  variant={isPremium ? 'success' : currentCount >= FREE_LIMIT ? 'error' : 'info'}
/>
```

**記事で使えるポイント:** 上限到達時にバッジが赤（error）に変化 → 課金への自然な導線。

---

## 4. AdMob広告関連コード

### 広告設定: `src/ads.config.ts`

```ts
import { AD_CONFIG_UTILITY } from '@massapp/ads';

export const adConfig: AdConfig = {
  unitIds: {
    banner:       { android: 'ca-app-pub-XXX/XXX', ios: 'ca-app-pub-XXX/XXX' },
    interstitial: { android: 'ca-app-pub-XXX/XXX', ios: 'ca-app-pub-XXX/XXX' },
    rewarded:     { android: 'ca-app-pub-XXX/XXX', ios: 'ca-app-pub-XXX/XXX' },
  },
  adsDisabled: true,   // ★ 現在は広告無効
  ...AD_CONFIG_UTILITY,
  interstitialFrequency: AD_CONFIG_UTILITY.interstitialFrequency!,
  interstitialInitialDelay: AD_CONFIG_UTILITY.interstitialInitialDelay!,
  showBanner: AD_CONFIG_UTILITY.showBanner!,
};
```

### 共通adsパッケージの設定プリセット: `@massapp/ads`

```
AD_CONFIG_UTILITY:
  - interstitialFrequency: 5（5アクションに1回インタースティシャル）
  - interstitialInitialDelay: 30000ms（起動後30秒は非表示）
  - showBanner: true

AD_CONFIG_GAME:
  - interstitialFrequency: 3
  - interstitialInitialDelay: 60000ms

AD_CONFIG_LIFESTYLE:
  - interstitialFrequency: 0（インタースティシャルなし）
  - showBanner: true
```

### AdProvider統合: `App.tsx`

```tsx
<AdProvider config={adConfig}>
  <AppInner />
</AdProvider>
```

### app.jsonのAdMobプラグイン設定

```json
[
  "react-native-google-mobile-ads",
  {
    "androidAppId": "ca-app-pub-3940256099942544~3347511713",
    "iosAppId": "ca-app-pub-6549870597795219~8560699337"
  }
]
```

**記事で使えるポイント:**
- 現在は `adsDisabled: true` で**広告を無効化**（課金のみで収益化）
- ただし広告インフラは完備済み（banner / interstitial / rewarded の3種類対応）
- `@massapp/ads` パッケージで複数アプリ間の広告設定を共通化
- 将来的に広告ON → 「無料+広告 / プレミアム=広告なし」モデルに切り替え可能

---

## 5. app.json / eas.json のビルド・審査関連設定

### app.json

| 項目 | 値 | 記事での意味 |
|------|-----|-------------|
| `name` | かんたんプッシュ | アプリ表示名 |
| `slug` | push-notify | Expo管理名 |
| `version` | 1.1.0 | ストア表示バージョン |
| `ios.bundleIdentifier` | com.massapp.pushnotify | iOSバンドルID |
| `android.package` | com.massapp.pushnotify | AndroidパッケージID |
| `ios.buildNumber` | 6 | iOS審査提出回数の実績 |
| `ios.infoPlist.ITSAppUsesNonExemptEncryption` | **false** | 暗号化申告不要（審査時の手動操作を省略） |
| `userInterfaceStyle` | automatic | ダークモード対応 |
| `owner` | yaowao | Expoアカウント名 |
| `runtimeVersion.policy` | appVersion | OTA更新のバージョン管理 |

**記事で使えるポイント:**
- `ITSAppUsesNonExemptEncryption: false` — 審査提出時に毎回聞かれる暗号化質問を自動スキップ。**個人開発者の審査Tips**として使える。
- `buildNumber: 6` — 6回ビルド提出した実績
- `expo-updates` プラグイン — ストア再審査なしでOTA更新が可能

### eas.json

```json
{
  "build": {
    "development": { "developmentClient": true, "ios": { "simulator": true } },
    "preview":     { "distribution": "internal", "channel": "preview", "android": { "buildType": "apk" } },
    "production":  { "autoIncrement": true, "channel": "production", "ios": { "image": "latest" }, "android": { "buildType": "app-bundle" } }
  },
  "submit": {
    "production": { "ios": { "ascAppId": "6759830379" } }
  }
}
```

**記事で使えるポイント:**
- 3環境（dev / preview / production）の構成
- `autoIncrement: true` — ビルド番号の自動インクリメント
- `ascAppId: 6759830379` — App Store ConnectのアプリID
- Android: production は `app-bundle`、previewは `apk`

---

## 6. package.json 依存関係

### 課金・広告関連の主要依存

| パッケージ | バージョン | 用途 |
|-----------|----------|------|
| `react-native-purchases` | ^9.10.5 | RevenueCat SDK（課金管理） |
| `react-native-google-mobile-ads` | ^14.0.0 | AdMob SDK（広告） |
| `@massapp/ads` | workspace:* | 自作広告ラッパー（モノレポ内パッケージ） |
| `expo-secure-store` | ^55.0.8 | APIキーのセキュア保存 |

### その他の主要依存

| パッケージ | バージョン | 用途 |
|-----------|----------|------|
| `expo` | ~54.0.33 | Expo SDK |
| `react-native` | 0.81.5 | React Native |
| `expo-notifications` | ~0.32.16 | プッシュ通知 |
| `expo-updates` | ~29.0.16 | OTA更新 |
| `@react-navigation/*` | ^7.x | ナビゲーション |
| `@massapp/ui` | workspace:* | 自作UIコンポーネント |
| `@massapp/hooks` | workspace:* | 自作フック |
| `@massapp/storage` | workspace:* | ストレージラッパー |
| `@massapp/analytics` | workspace:* | アナリティクス |
| `@massapp/navigation` | workspace:* | ナビゲーション |

**記事で使えるポイント:**
- モノレポ構成（`workspace:*`）で複数アプリ間のコード共有
- `@massapp/` プレフィックスの自作パッケージ5つ（ads, analytics, hooks, navigation, storage, ui）
- Expo SDK 54 + React Native 0.81.5（最新構成）

---

## 7. サーバー側の課金設計（`server/push-api`）

### POST /api/premium — プレミアム有効化

```
- KV に `premium:{apiKey}` を保存（TTLなし = 永続）
- 新規プレミアムユーザーの場合、オーナーに通知
- デバイス登録済みチェックあり
```

### POST /api/send — 送信時の制限チェック

```
1. デバイス登録チェック
2. KV `premium:{apiKey}` を確認
3. 無料ユーザー: 月間使用量 >= FREE_MONTHLY_LIMIT → 429
4. プレミアム: 日間使用量 >= 2000 → 429
5. 使用量をKVでインクリメント
   - 月間: `usage:{apiKey}:{YYYY-MM}` (TTL: 60日)
   - 日間: `usage:{apiKey}:{YYYY-MM-DD}` (TTL: 2日)
```

### GET /api/status — ステータス確認

```
レスポンス: { registered, premium, usage: { month, count, limit } }
- premiumユーザーは limit: null
```

### DELETE /api/premium — プレミアム解除

```
- KV の `premium:{apiKey}` を削除
```

### GET /api/admin/stats — 管理者統計

```
- ADMIN_SECRET による Bearer認証
- 全デバイス数、プレミアムユーザー数、ユーザー別使用量
```

---

## 8. 記事に使える「設計判断」まとめ

### 収益モデルの選択

| 判断 | 内容 | 理由（推測） |
|------|------|-------------|
| 買い切り ¥300 | サブスクではなく一回払い | ユーティリティ系アプリは買い切りの方が購入率が高い |
| 月10通の無料枠 | 試用可能だが実用には足りない | 「試して納得して買う」フロー |
| 広告は現在無効 | `adsDisabled: true` | 課金一本でシンプルに。広告インフラは将来用 |
| プレミアムでも日2000通上限 | 悪用防止の安全弁 | 通知APIの濫用を防ぐ |

### 技術的な設計判断

| 判断 | 内容 |
|------|------|
| RevenueCat採用 | 自前のレシート検証が不要。iOS/Androidの差異をSDKが吸収 |
| 二重チェック（client + server） | クライアントはUX向上、サーバーはセキュリティ |
| KVで使用量管理 | Cloudflare Workers KV の TTL で自動クリーンアップ |
| Context API で課金状態配信 | 全画面で isPremium にアクセス可能 |
| syncPremiumToServer | 購入後すぐにサーバー側も反映（次回送信から即座に無制限） |

### 審査対策

| 対策 | 実装 |
|------|------|
| 購入復元ボタン | SettingsScreenに設置（Apple必須要件） |
| ITSAppUsesNonExemptEncryption: false | 暗号化申告を自動スキップ |
| プライバシーポリシーURL | `push-api.selectinfo-yaowao.workers.dev/privacy` |
| Apple標準EULA利用 | `apple.com/legal/internet-services/itunes/dev/stdeula/` |

---

## 9. 記事で使える具体的な数値

| 数値 | 出典 |
|------|------|
| ¥300 | SettingsScreen UI テキスト |
| 月10通 | FREE_LIMIT = 10（types.ts + サーバー環境変数） |
| 日2000通（プレミアム上限） | サーバー側ハードコード |
| ビルド番号6 | app.json ios.buildNumber |
| 自作パッケージ6個 | package.json workspace:* |
| purchases.ts 全63行 | ファイル行数 |
| 広告3種類対応 | banner / interstitial / rewarded（ads.config.ts） |
| App Store ID: 6759830379 | eas.json ascAppId |
