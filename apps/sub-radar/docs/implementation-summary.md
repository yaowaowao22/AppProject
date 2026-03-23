# SubRadar 実装サマリー

> 作成日: 2026-03-23
> 対象ブランチ: `main`
> 最終コミット: `faafdc5`

---

## 実装済み機能

### 1. データ層（`src/config.ts` / `src/types.ts` / `src/utils/subscriptionUtils.ts` / `src/SubscriptionContext.tsx`）

| 機能 | 詳細 |
|------|------|
| **通貨換算（固定レート）** | `FX_RATES: { JPY:1, USD:150, EUR:163 }` を config.ts に定義。`toJPY()` / `calcMonthlyAmountJPY()` を subscriptionUtils.ts に追加 |
| **JPY換算合計** | Context に `totalMonthlyJPY` / `totalYearlyJPY` を追加。`useMemo` でメモ化済み |
| **前月比データ型** | `types.ts` に `MonthlySnapshot` / `MomData` インターフェースを追加 |
| **月次スナップショット** | 起動時に先月分が未保存なら `STORE_KEYS.monthlySnapshot` に保存（今月と先月の比較が可能） |
| **前月比計算** | `calcMonthOverMonth()` を追加。Context の `momData` に `up/down/neutral` + `pct` を格納 |

### 2. 通知（`src/utils/notificationUtils.ts` / `App.tsx` / `src/screens/SettingsScreen.tsx`）

| 機能 | 詳細 |
|------|------|
| **権限リクエスト** | `requestPermissions()` — アプリ起動時に OS に通知権限をリクエスト |
| **リマインダースケジュール** | `scheduleSubscriptionReminders()` — アクティブなサブスクの請求日 3日前・前日 9:00 に通知をスケジュール |
| **iOS 64件制限対応** | 近い順にソートし上限 60件で絞り込み |
| **件数表示** | SettingsScreen に `{scheduledCount}件スケジュール済み` を Caption で表示 |
| **Switch連動** | Switch 変更時に再スケジュール → 件数更新のフローを実装 |

### 3. ダッシュボード UI（`src/screens/DashboardVariantC.tsx`）

| 機能 | 詳細 |
|------|------|
| **前月比バッジ（3状態）** | `null` → `-`（グレー）/ `up` → `+X%`（赤）/ `down` → `-X%`（teal）/ `neutral` → `±0%`（グレー） |
| **KPI を JPY 換算に統一** | 月額・年間・カレンダー合計を `totalMonthlyJPY` / `totalYearlyJPY` に変更 |
| **AC ダークパレット** | ハードコードの AC 定数（`#0D1117` 背景 / `#26C6DA` teal）で全体を統一 |

### 4. AddSubscriptionModal（`src/screens/AddSubscriptionModal.tsx`）

| 機能 | 詳細 |
|------|------|
| **ダークテーマ完全適用** | コンテナ・Card・TextInput・セグメント・アイコンボタン・保存/削除ボタンを AC 定数で上書き |

### 5. SettingsScreen（`src/screens/SettingsScreen.tsx`）

| 機能 | 詳細 |
|------|------|
| **AC ダークパレット適用** | コンテナ・全カードを AC 定数で統一 |
| **プレミアム機能リスト** | 未購入時に「登録数無制限 / 月次トレンド分析 / 通知カスタマイズ / CSV出力（近日）」を表示 |
| **EUR 通貨追加** | デフォルト通貨セレクタに `€ EUR` を追加 |
| **RevenueCat モックガード** | `USE_MOCK_PURCHASES = __DEV__` — 本番ビルドでモック購入を無効化 |

---

## コード品質チェック結果

| チェック項目 | 結果 |
|---|---|
| `console.log` / デバッグコード | ✅ ゼロ件 |
| 未使用 import | ✅ 修正済み（DashboardVariantC から `useTheme/H2/Body/Caption` を削除） |
| `momData === null` クラッシュ | ✅ 三項演算子で null チェック済み |
| 通知権限未許可時クラッシュ | ✅ `.catch(() => {})` で握り潰し |

---

## 残課題（リリース前に対応必要）

### HIGH（リリースブロッカー）

| # | 内容 | 対応方法 |
|---|------|--------|
| **R-1** | **`expo-notifications` 未インストール** | `pnpm add expo-notifications` を実行し、`app.json` に `expo-notifications` プラグイン設定を追加する |
| **R-2** | **プライバシーポリシー URL がダミー** | `SettingsScreen.tsx:382` の `massapp.example.com/sub-radar/privacy` を実際の URL に差し替える |
| **R-3** | **RevenueCat 本番統合未実装** | フェーズ2: `@revenuecat/react-native-purchases` を導入し `isPremium` のソースを entitlement に変更する |

### MEDIUM（早期対応）

| # | 内容 | 対応方法 |
|---|------|--------|
| **R-4** | **`getNextBillingDate` が週次・年次に未対応** | `subscriptionUtils.ts:23` — `billingCycle` が `weekly`/`yearly` の場合は `billingDay` ではなく `createdAt` 起点の次回日付を計算する |
| **R-5** | **`isUnused` が初回登録直後に `true` を返す** | `lastTappedAt` が未設定の場合は `createdAt` から 30日経過したかで判定するよう変更する |
| **R-6** | **上限アラート（無料版）に設定画面への誘導なし** | `App.tsx:63` の Alert に「設定でアップグレード」ボタンを追加する |

### LOW

| # | 内容 |
|---|------|
| **R-7** | `defaultCurrency` 設定が AddSubscriptionModal の初期値に未連携 |
| **R-8** | StatusBar スタイルがライトモード時も `auto`（`style="light"` に固定推奨） |
| **R-9** | カテゴリ横棒グラフの金額が登録通貨のまま混在（JPY換算に統一が望ましい） |

---

## ファイル変更一覧

```
src/config.ts                        — FX_RATES / USE_MOCK_PURCHASES 追加
src/types.ts                         — MonthlySnapshot / MomData 型追加
src/utils/subscriptionUtils.ts       — toJPY / calcMonthlyAmountJPY / calcMonthOverMonth 追加
src/utils/notificationUtils.ts       — 新規作成（requestPermissions / scheduleSubscriptionReminders / getScheduledCount）
src/SubscriptionContext.tsx          — totalMonthlyJPY / totalYearlyJPY / momData 追加
src/screens/DashboardVariantC.tsx    — 前月比バッジ・JPY換算KPI・AC ダークテーマ / 未使用import削除
src/screens/AddSubscriptionModal.tsx — AC ダークテーマ完全適用
src/screens/SettingsScreen.tsx       — AC ダークテーマ / プレミアム機能リスト / EUR追加 / USE_MOCK_PURCHASES ガード
App.tsx                              — 通知権限リクエスト / 変更時リスケジュール
```
