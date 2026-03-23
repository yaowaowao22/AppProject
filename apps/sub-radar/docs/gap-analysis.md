# SubRadar — ギャップ分析レポート

作成日: 2026-03-23
対象ブランチ: main (b438f12)

---

## 凡例

| 優先度 | 説明 |
|--------|------|
| **High** | リリース前に修正必須 / ユーザー体験・収益に直結 |
| **Medium** | 早期フェーズで対応すべき品質課題 |
| **Low** | 改善余地あり・後回し可 |

| 工数 | 目安 |
|------|------|
| 小 | 〜半日 |
| 中 | 1〜3日 |
| 大 | 3日超 |

---

## 1. UIギャップ: AddSubscriptionModal・SettingsScreen のテーマ不整合

**優先度: High / 工数: 中**

### 問題
- `DashboardVariantC` は独自のハードコードカラーパレット (`AC.*`) で完全なダークテーマを実現している
  (`bgDeep: '#0D1117'`, `bgCard: '#161B22'` など GitHub-Dark 系)
- `AddSubscriptionModal` と `SettingsScreen` は `@massapp/ui` の `ThemeProvider` カラー (`colors.background`, `colors.surface` 等) を参照
- `theme.ts` は `presetForestGreen` ベース。ダークモード時の `background` は `#121212` 程度になるが、ライトモード時は白系になるため、ダッシュボードの深いダーク感と食い違う
- 通知設定の Switch `trackColor.true = colors.primary` はテーマグリーン (`#4DB6AC`) であり、ダッシュボードの teal (`#26C6DA`) と異なる

### 影響
- モーダルを開くたびに「別アプリを開いたような」感覚のビジュアルギャップ
- SettingsScreen のタブバー背景色がダッシュボードと異なる（テーマ依存 vs ハードコード）

### 修正方針
- `AddSubscriptionModal` と `SettingsScreen` を `AC` パレットに合わせたダークファースト設計へ統一
  **または** `DashboardVariantC` もテーマカラーを参照する形にリファクタリング（テーマを `AC` 値で上書き）
- `theme.ts` の dark.primary を `#26C6DA` に変更すれば Switch 等は自動追従する

---

## 2. 機能ギャップ: 前月比バッジが常に `-` 固定

**優先度: Medium / 工数: 中**

### 問題
`DashboardVariantC.tsx:423-426` の MoMバッジは常に `momBadgeNeutral` / `'-'` を表示。
月次スナップショットデータが存在しないため前月と比較できない。

```tsx
// 現状（暫定表示）
<View style={[aStyles.momBadge, aStyles.momBadgeNeutral]}>
  <Ionicons name="remove-outline" size={12} color={AC.textMid} />
  <Text style={[aStyles.momText, { color: AC.textMid }]}>前月比 -</Text>
</View>
```

### 必要なデータ構造
- `Subscription` に変更履歴フィールド、または別途月次スナップショットを AsyncStorage に保存する仕組みが必要
- 例: `STORE_KEYS.monthlySnapshots` → `{ [YYYY-MM]: number }` の累積マップ
- アプリ起動時または月末に現在の `totalMonthly` を前月分として保存し、翌月に比較

### スタイル準備は完了
`momBadgeUp` / `momBadgeDown` の StyleSheet は定義済み (`aStyles.momBadgeUp` = 赤系、`momBadgeDown` = teal系)。計算ロジックと保存処理のみ不足。

---

## 3. 機能ギャップ: 通知がLocalStorage保存のみでExpo Notifications未実装

**優先度: High / 工数: 大**

### 問題
`SettingsScreen.tsx:42-43` の `notify3days` / `notify1day` は `useLocalStorage` でフラグを保存するだけで、実際の OS 通知スケジューリングは一切行われていない。

```tsx
const [notify3days, setNotify3days] = useLocalStorage<boolean>('sub_notify_3days', true);
const [notify1day,  setNotify1day]  = useLocalStorage<boolean>('sub_notify_1day',  true);
```

### 必要な実装
1. `expo-notifications` の追加インストール (`package.json` に未記載)
2. 権限リクエスト (`requestPermissionsAsync`)
3. サブスク追加・編集・削除・設定変更のたびに `scheduleNotificationAsync` を再スケジュール
4. `app.json` への notification プラグイン設定
5. `STORE_KEYS` に通知トークン保存キーの追加

### リスク
- iOS は通知権限が一度拒否されると再プロンプト不可。ユーザーへの適切な許可フロー設計が必要
- スケジュール上限（iOS: 64件）を超える場合の剪定ロジックが必要

---

## 4. 機能ギャップ: RevenueCat 連携がモック実装のまま

**優先度: High / 工数: 大**

### 問題
`SettingsScreen.tsx:61-84` のプレミアム購入・復元は `setTimeout(800)` のモックのみ。
`react-native-purchases@9.10.5` はインストール済みだが一切インポートされていない。

```tsx
// モック実装（フェーズ2で RevenueCat 連携予定）
const handlePurchase = useCallback(async () => {
  setPurchasing(true);
  await new Promise<void>((resolve) => setTimeout(resolve, 800));
  setIsPremium(true); // ← AsyncStorage に true を書き込むだけ
  ...
```

### 影響
- 現状は購入ボタンを押すと誰でも無料でプレミアムになれる
- App Store / Google Play 審査で必ず指摘される
- 購入の永続化が `AsyncStorage` のみのため、アンインストール後に消える

### 必要な実装
1. RevenueCat ダッシュボードでの商品設定 (Entitlement: `premium`)
2. `Purchases.configure({ apiKey })` の初期化 (`App.tsx`)
3. `Purchases.purchasePackage()` / `Purchases.restorePurchases()` への差し替え
4. `customerInfo.entitlements.active['premium']` による isPremium 判定
5. `app.json` の iOS/Android billing 設定

---

## 5. 機能ギャップ: 通貨換算なしで USD/EUR を JPY と合算

**優先度: Medium / 工数: 中**

### 問題
`subscriptionUtils.ts:8-16` の `calcMonthlyAmount` と `SubscriptionContext.tsx:65-75` の `totalMonthly` 計算は通貨を無視して加算している。

```ts
// subscriptionUtils.ts
export function calcMonthlyAmount(sub: Subscription): number {
  // 通貨換算は行わず、登録通貨のまま計算
  switch (sub.billingCycle) { ... }
}

// SubscriptionContext.tsx
const totalMonthly = subscriptions
  .filter((s) => s.isActive)
  .reduce((sum, s) => { ... return sum + s.amount; }, 0);
  // ↑ USD 9.99 と JPY 1500 が単純加算される
```

### 影響
- USD $9.99/月 + JPY ¥1,500/月 → `¥11` と表示される（壊れた合計）
- カテゴリ別棒グラフも同様に不正

### 修正方針案
**案A（シンプル）**: レート固定値を `config.ts` に定義し静的換算
```ts
export const FX_RATES: Record<Currency, number> = { JPY: 1, USD: 150, EUR: 160 };
```
**案B（理想）**: 外部為替API（ExchangeRate-API 等）を定期取得し AsyncStorage にキャッシュ
→ フェーズ1は案Aで実装、フェーズ2で案Bへ移行が現実的

---

## 6. UXギャップ: グリッドカードタップで即編集モーダルが開く

**優先度: Low / 工数: 小〜中**

### 問題
`DashboardVariantC.tsx:384-391` の `handleCardPress` は `onEditPress(sub)` を直接呼び出し、タップ直後に編集モーダルを開く。

```tsx
const handleCardPress = useCallback(
  (sub: Subscription) => {
    updateSubscription(sub.id, { lastTappedAt: new Date().toISOString() });
    setExpandedId((prev) => (prev === sub.id ? null : sub.id));
    onEditPress(sub); // ← タップ即編集モーダル
  },
  [updateSubscription, onEditPress],
);
```

また `setExpandedId` で展開状態を管理しているが、実際には展開UIがなく (`_expandedId` は未使用)、この状態管理は dead code になっている。

### 影響
- 誤タップで編集画面が開きやすい（特に片手操作時）
- 「詳細確認 → 編集に進む」という自然なフローがない

### 修正方針
- **Short press**: カード展開（サービス名・次回請求日・メモを展開表示）
- **Long press** または 展開後の「編集」ボタン: 編集モーダルを開く
- 現在の `setExpandedId` / `_expandedId` を実際の展開UIに活用

---

## 7. その他のギャップ

### 7-1. `getNextBillingDate` が週次・年次サブスクを未考慮

**優先度: Medium / 工数: 小**

`subscriptionUtils.ts:22-35` の `getNextBillingDate` は `billingDay` 基準の月次ロジックのみで、`billingCycle` を参照していない。
週次（`weekly`）や年次（`yearly`）サブスクの次回請求日が誤計算され、カレンダーとグリッドカードの残日数表示が正確でない。

```ts
export function getNextBillingDate(sub: Subscription): Date {
  // billingCycle を無視して毎月 billingDay 日として計算
  const day = Math.min(sub.billingDay, 28);
  const thisMonth = new Date(..., day);
  ...
}
```

### 7-2. `isUnused` の初期登録時誤検知

**優先度: Low / 工数: 小**

`subscriptionUtils.ts:53-57` で `lastTappedAt` が `undefined` の場合 `isUnused = true` を返す。
登録直後は未タップのため、追加した瞬間に「無駄なサブスクの可能性」に表示されてしまう。

**修正案**: `lastTappedAt ?? createdAt` を基準にする、または登録後30日は猶予期間とする。

### 7-3. 無料版制限のUX（App.tsx の Alert のみ）

**優先度: Medium / 工数: 小**

`App.tsx:47-53` で無料版の上限到達時は `Alert.alert` のみ。
SettingsScreen のアップグレードボタンへ誘導するアクションが提供されていない。

```tsx
Alert.alert(
  '無料版の上限',
  '無料版では3件まで登録できます。\nプレミアムにアップグレードすると無制限に追加できます。',
  [{ text: 'OK' }], // ← 設定画面へのナビゲーションがない
);
```

### 7-4. `billingDay` が月次以外でも保存されデータが不整合

**優先度: Low / 工数: 小**

`AddSubscriptionModal.tsx:62` で `showBillingDay` を `monthly || quarterly` に制限しているが、
`yearly` / `weekly` サブスクでも `billingDay` が 1 として保存される。
カレンダー表示時に年次サブスクが毎月1日に表示されてしまう。

### 7-5. `SubscriptionContext` の `totalMonthly` が非アクティブサブスクを除外するが `calcMonthlyAmount` は除外しない

**優先度: Low / 工数: 小**

`SubscriptionContext.tsx:65` はフィルタ済みだが `calcMonthlyAmount` は個別呼び出しのため整合性依存。
将来的に `calcMonthlyAmount` を直接使う箇所でアクティブチェックを忘れるリスクがある。

### 7-6. プライバシーポリシーURLがプレースホルダー

**優先度: High / 工数: 小**

`SettingsScreen.tsx:321` の URL が `https://massapp.example.com/sub-radar/privacy` というダミー値。
App Store 審査でプライバシーポリシーの実在URLが必須。

### 7-7. `defaultCurrency` がモーダルのデフォルト値に未連携

**優先度: Medium / 工数: 小**

`SettingsScreen` に「デフォルト通貨」設定があるが (`sub_default_currency`)、
`AddSubscriptionModal.tsx:51` は常に `'JPY'` をデフォルトとしており、設定値を読み込んでいない。

### 7-8. `StatusBar style="auto"` がダークダッシュボードと不整合

**優先度: Low / 工数: 小**

`App.tsx:70` で `StatusBar style="auto"` を使用。ダッシュボードは常にダーク背景なので、
ライトモード設定時にステータスバーのテキストが暗くなり視認性が下がる可能性がある。

---

## 優先度サマリー

| # | ギャップ | 優先度 | 工数 |
|---|---------|--------|------|
| 1 | UIテーマ不整合（Modal/Settings） | High | 中 |
| 2 | 前月比バッジ固定 `-` | Medium | 中 |
| 3 | 通知 Expo Notifications 未実装 | High | 大 |
| 4 | RevenueCat モック実装 | High | 大 |
| 5 | 通貨換算なし合算 | Medium | 中 |
| 6 | カードタップ即編集 UX | Low | 小〜中 |
| 7-1 | 週次・年次の次回請求日計算誤り | Medium | 小 |
| 7-2 | isUnused 初期登録誤検知 | Low | 小 |
| 7-3 | 上限アラートのUX（誘導なし） | Medium | 小 |
| 7-4 | billingDay 非月次サブスク不整合 | Low | 小 |
| 7-5 | calcMonthlyAmount アクティブチェック欠如 | Low | 小 |
| 7-6 | プライバシーポリシーURLダミー | **High** | 小 |
| 7-7 | defaultCurrency モーダル未連携 | Medium | 小 |
| 7-8 | StatusBar style不整合 | Low | 小 |

---

## 推奨実装順序

### フェーズ1（リリース最低条件）
1. **7-6** プライバシーポリシーURL差し替え（High・小）
2. **5** 通貨換算の固定レート実装（Medium・中）
3. **7-1** 週次・年次の次回請求日計算修正（Medium・小）
4. **7-7** defaultCurrency → AddSubscriptionModal 連携（Medium・小）
5. **1** UIテーマ統一（High・中）

### フェーズ2（品質・収益化）
6. **4** RevenueCat 本番連携（High・大）
7. **3** Expo Notifications スケジューリング実装（High・大）
8. **2** 月次スナップショット + 前月比バッジ（Medium・中）
9. **7-3** 上限到達時の設定画面誘導（Medium・小）

### フェーズ3（UX改善）
10. **6** カード展開 → 編集フロー改善（Low・小〜中）
11. **7-2** isUnused 猶予期間実装（Low・小）
12. **7-4** billingDay の年次・週次対応（Low・小）
