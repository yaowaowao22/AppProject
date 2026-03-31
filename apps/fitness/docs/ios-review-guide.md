# TANREN — iOS App Store 審査チェックリスト

> 作成日: 2026-04-01
> 対象: `apps/fitness` (Bundle ID: `com.massapp.fitness`)
> 凡例: ✅ 実装済み / ⚠️ 要対応 / ➖ 該当なし

---

## 1. App Store Connect 設定

| # | 項目 | 状態 | 設定値 / アクション |
|---|------|------|-------------------|
| 1.1 | アプリ名 (日本語) | ✅ | `TANREN` |
| 1.2 | サブタイトル | ⚠️ | `筋トレ記録を、シンプルに` を ASC で設定 |
| 1.3 | 説明文 (日本語) | ⚠️ | 下記説明文テンプレートを ASC に設定 |
| 1.4 | キーワード (100文字以内) | ⚠️ | `筋トレ,ワークアウト,トレーニング記録,筋肉,ジム,フィットネス,PR,自重,ダンベル,ログ` |
| 1.5 | カテゴリ (Primary) | ⚠️ | `HEALTH_AND_FITNESS` |
| 1.6 | カテゴリ (Secondary) | ⚠️ | `LIFESTYLE` |
| 1.7 | 年齢制限 | ⚠️ | `4+`（全項目 NONE）|
| 1.8 | 価格 | ⚠️ | 無料 |
| 1.9 | Privacy Policy URL | ⚠️ | `https://fitness-api.selectinfo-yaowao.workers.dev/privacy`（fitness-api デプロイ後に設定） |
| 1.10 | Support URL | ⚠️ | `https://fitness-api.selectinfo-yaowao.workers.dev/support`（同上） |
| 1.11 | スクリーンショット (6.7" iPhone) | ⚠️ | 1290×2796 px — 4枚以上（ホーム/ワークアウト/履歴/設定）|
| 1.12 | スクリーンショット (6.5" iPhone) | ⚠️ | 1242×2688 px |
| 1.13 | スクリーンショット (5.5" iPhone) | ⚠️ | 1242×2208 px |
| 1.14 | ASC App ID | ⚠️ | ASCでアプリ作成後に取得 → `eas.json` の `submit.production.ios.ascAppId` に設定 |
| 1.15 | Apple Team ID | ⚠️ | `PVM8Q8HG54`（push-notify と同一チーム）— `eas.json` に設定 |
| 1.16 | レビュー担当者情報 | ⚠️ | Name: Yuta Tata / Email: y.tata02020202@icloud.com / Phone: 要設定 |
| 1.17 | レビューノート | ⚠️ | "Works fully offline. No login required. All data stored locally." |

<details>
<summary>説明文テンプレート</summary>

```
TANRENは、日々の筋トレを記録するシンプルなワークアウトアプリです。

■ 主な機能
・部位別のエクササイズ選択（胸・背中・脚・肩・腕・体幹）
・45種目のエクササイズデータベース
・重量×回数のセット記録
・自己ベスト（PR）の自動追跡
・月間レポート・ストリーク表示
・RM計算機
・テンプレートでのクイックスタート
・25種類以上のテーマカスタマイズ

■ 特徴
・完全オフライン対応 — データはすべて端末内に保存
・広告なし、無料
・シンプルで直感的なUI
```

</details>

---

## 2. プライバシー関連

| # | 項目 | 状態 | ファイル / アクション |
|---|------|------|----------------------|
| 2.1 | プライバシーポリシー画面 (アプリ内) | ✅ | `src/screens/PrivacyPolicyScreen.tsx` — 9セクション実装済み |
| 2.2 | 設定画面からのリンク | ✅ | `src/screens/SettingsScreen.tsx:320` — `navigation.navigate('PrivacyPolicy')` |
| 2.3 | PrivacyPolicy のナビゲーター登録 | ✅ | `src/navigation/RootNavigator.tsx` — `SettingsStack` に登録済み |
| 2.4 | Privacy Policy URL (Web) | ⚠️ | `fitness-api` の `/privacy` エンドポイントをデプロイして設定 |
| 2.5 | App Tracking Transparency (ATT) | ✅ | トラッキングなし — `NSUserTrackingUsageDescription` 不要 |
| 2.6 | `ITSAppUsesNonExemptEncryption` | ✅ | `app.json` > `ios.infoPlist` に `false` 設定済み |
| 2.7 | App Privacy Labels (データ収集) | ⚠️ | ASC の「App Privacy」セクションで設定。収集データ: なし（端末内保存のみ）→ "Data Not Collected" を選択 |
| 2.8 | データ収集の実装確認 | ✅ | 外部サーバー送信なし（PP `src/screens/PrivacyPolicyScreen.tsx:28` に明記） |

---

## 3. 利用規約

| # | 項目 | 状態 | ファイル / アクション |
|---|------|------|----------------------|
| 3.1 | 利用規約画面 (アプリ内) | ✅ | `src/screens/TermsOfServiceScreen.tsx` — 8条実装済み |
| 3.2 | 設定画面からのリンク | ✅ | `src/screens/SettingsScreen.tsx:330` — `navigation.navigate('TermsOfService')` |
| 3.3 | TermsOfService のナビゲーター登録 | ✅ | `src/navigation/RootNavigator.tsx` — `SettingsStack` に登録済み |
| 3.4 | EULA | ✅ | Apple 標準 EULA を使用（独自 EULA 不要） |
| 3.5 | 初回起動時の同意フロー | ➖ | アカウント登録・課金なし → 初回同意画面は不要 |

---

## 4. 技術要件

| # | 項目 | 状態 | 設定値 / アクション |
|---|------|------|-------------------|
| 4.1 | 最低 iOS バージョン | ✅ | Expo SDK 54 = iOS 16 以上（React Native 0.81.5） |
| 4.2 | Bundle Identifier | ✅ | `com.massapp.fitness`（`app.json` > `ios.bundleIdentifier`） |
| 4.3 | `ITSAppUsesNonExemptEncryption` | ✅ | `app.json` > `ios.infoPlist.ITSAppUsesNonExemptEncryption: false` |
| 4.4 | NSCameraUsageDescription | ➖ | カメラ未使用 — 不要 |
| 4.5 | NSPhotoLibraryUsageDescription | ➖ | フォトライブラリ未使用 — 不要 |
| 4.6 | NSLocationWhenInUseUsageDescription | ➖ | 位置情報未使用 — 不要 |
| 4.7 | NSHealthShareUsageDescription | ➖ | HealthKit 未使用 — 不要 |
| 4.8 | NSMotionUsageDescription | ➖ | モーション未使用 — 不要 |
| 4.9 | IPv6 対応 | ✅ | React Native / Expo は IPv6 対応済み |
| 4.10 | ATS (App Transport Security) | ✅ | HTTPS のみ使用（デフォルト ATS で問題なし） |
| 4.11 | `useFrameworks: static` | ✅ | `app.json` > `plugins.expo-build-properties.ios.useFrameworks: "static"` |
| 4.12 | newArchEnabled | ✅ | `app.json` > `newArchEnabled: true` |
| 4.13 | expo-updates 設定 | ✅ | `app.json` に `updates.url` と `runtimeVersion.policy: "appVersion"` 設定済み |

---

## 5. UI/UX 要件

| # | 項目 | 状態 | 設定値 / アクション |
|---|------|------|-------------------|
| 5.1 | Apple Sign In | ➖ | サードパーティログイン未使用 → Apple Sign In 不要 |
| 5.2 | iPad サポート | ✅ | `app.json` > `ios.supportsTablet: false`（iPad 非対応として明示） |
| 5.3 | ダークモード対応 | ✅ | `app.json` > `userInterfaceStyle: "dark"`（ダークモード専用） |
| 5.4 | 画面向き | ✅ | `app.json` > `orientation: "portrait"` |
| 5.5 | スプラッシュ画面 | ✅ | `app.json` > `splash.image: "./assets/splash-icon.png"` / `backgroundColor: "#111113"` |
| 5.6 | アイコン | ✅ | `app.json` > `icon: "./assets/icon.png"` — 1024×1024px であることを要確認 |
| 5.7 | アイコン透過・角丸 | ⚠️ | アイコンは透過なし・角丸なし（Appleが自動で丸める）の正方形 PNG を確認 |
| 5.8 | Safe Area 対応 | ✅ | `react-native-safe-area-context` 使用済み（`~5.6.0`） |
| 5.9 | ジェスチャーハンドラー | ✅ | `react-native-gesture-handler ~2.28.0` 使用 |

---

## 6. 課金関連

| # | 項目 | 状態 | アクション |
|---|------|------|-----------|
| 6.1 | アプリ内課金 | ✅ | なし — 完全無料 |
| 6.2 | RevenueCat / StoreKit | ➖ | 未使用 |
| 6.3 | 購入リストアボタン | ➖ | 課金なし → 不要 |
| 6.4 | サブスクリプション | ➖ | なし |

---

## 7. コンテンツ

| # | 項目 | 状態 | アクション |
|---|------|------|-----------|
| 7.1 | ユーザー生成コンテンツ (UGC) | ➖ | なし（端末内データのみ） |
| 7.2 | ソーシャル機能 | ➖ | なし |
| 7.3 | 外部リンク | ➖ | なし |
| 7.4 | 広告 (AdMob等) | ➖ | なし |
| 7.5 | デモアカウント | ✅ | 不要（アカウント登録なし）— レビューノートに明記 |
| 7.6 | 年齢制限コンテンツ | ✅ | 4+ 相当（暴力・性的表現なし） |

---

## 8. ビルド・提出

| # | 項目 | 状態 | コマンド / アクション |
|---|------|------|----------------------|
| 8.1 | EAS Project ID | ✅ | `app.json` > `extra.eas.projectId: "136412e9-9744-499f-a942-41d0597e67ec"` |
| 8.2 | EAS CLI バージョン | ✅ | `eas.json` > `cli.version: ">= 16.0.0"` |
| 8.3 | eas.json production プロファイル | ✅ | `channel: "production"` / `autoIncrement: true` / `ios.image: "latest"` |
| 8.4 | eas.json submit 設定 | ⚠️ | `ascAppId` が未設定 — ASCでアプリ作成後に `eas.json` > `submit.production.ios.ascAppId` を更新 |
| 8.5 | Apple Distribution 証明書 | ⚠️ | `eas build` 実行時に自動生成 or 手動で EAS に登録 |
| 8.6 | Provisioning Profile | ⚠️ | `eas build` 実行時に自動生成 |
| 8.7 | ASC API キー設定 | ⚠️ | Key ID: `WBL22JQ6B3` / Issuer ID: `0bc13228-682d-418b-a53e-d74894424555` / P8: `AuthKey_WBL22JQ6B3.p8` |
| 8.8 | Production ビルド | ⚠️ | `cd apps/fitness && eas build --platform ios --profile production` |
| 8.9 | TestFlight 配布 | ⚠️ | ビルド後に ASC の TestFlight で内部テスト → 外部テスト |
| 8.10 | App Store 提出 | ⚠️ | `eas submit --platform ios --profile production` |
| 8.11 | fitness-api デプロイ | ✅ | デプロイ済み: `https://fitness-api.selectinfo-yaowao.workers.dev` (2026-04-01) |
| 8.12 | buildNumber | ✅ | `app.json` > `ios.buildNumber: "1"`（`autoIncrement: true` で EAS が自動管理） |

---

## 9. 提出前 最終確認フロー

```
[x] 1. fitness-api デプロイ完了 → Privacy/Support URL 正常稼働確認済み (2026-04-01)
[x] 2. Bundle ID 登録済み (com.massapp.fitness, id=2DB8ZVR4T6, Apple Dev Portal)
[ ] 3. ASC でアプリ作成（手動）→ ascAppId 取得 → eas.json に設定
      ※ ASC API は CREATE 未対応。https://appstoreconnect.apple.com で手動作成が必要
      　 Bundle ID: com.massapp.fitness / Name: TANREN / Locale: 日本語 / SKU: tanren-fitness-2026
[ ] 4. python setup_asc.py → メタデータ一括設定（カテゴリ・説明・キーワード・レビュー情報・年齢レーティング）
[ ] 5. App Privacy Labels を「Data Not Collected」に設定（ASC UI）
[ ] 6. スクリーンショット撮影（4画面）→ screenshots/ に配置 → python create_screenshots.py local
[ ] 7. アイコン画像確認（1024×1024 / 透過なし / 角丸なし）
[ ] 8. eas build --platform ios --profile production 実行
[ ] 9. TestFlight で動作確認
[ ] 10. eas submit --platform ios --profile production 実行
[ ] 11. 審査サブミッション（ASC から「Submit for Review」）
```

---

## 参考情報

### push-notify（審査通過済み）の構成
| 項目 | 値 |
|------|-----|
| Bundle ID | `com.massapp.pushnotify` |
| ASC App ID | `6759830379` |
| Apple Team ID | `PVM8Q8HG54` |
| ASC API Key ID | `WBL22JQ6B3` |
| ASC Issuer ID | `0bc13228-682d-418b-a53e-d74894424555` |
| P8 Key Path | `C:/Users/ytata/Downloads/AuthKey_WBL22JQ6B3.p8` |
| Privacy Policy | `https://push-api.selectinfo-yaowao.workers.dev/privacy` |

### 参考スクリプト (push-notify)
| ファイル | 用途 |
|----------|------|
| `apps/push-notify/setup_asc.py` | ASC メタデータ初期設定 |
| `apps/push-notify/create_55inch_screenshots.py` | SS生成+アップロード+審査提出 |
| `server/push-api/src/index.ts` | Workers API 実装参照 |

### 今回作成した成果物
| ファイル | 用途 | 状態 |
|----------|------|------|
| `apps/fitness/app.json` | EAS + expo-updates 設定 | ✅ 更新済み |
| `apps/fitness/eas.json` | ビルド・提出設定 (channel/image) | ✅ 更新済み |
| `server/fitness-api/src/index.ts` | Workers API (PP/Support/Health) | ✅ 作成済み |
| `server/fitness-api/wrangler.toml` | Wrangler 設定 | ✅ 作成済み |
| `server/fitness-api/package.json` | 依存関係 | ✅ 作成済み |
| `server/fitness-api/tsconfig.json` | TypeScript 設定 | ✅ 作成済み |
| `apps/fitness/setup_asc.py` | ASC メタデータ自動設定 | ✅ 作成済み |
| `apps/fitness/create_screenshots.py` | SS リサイズ・アップロード | ✅ 作成済み |

### スクリプト使用方法

**ASC メタデータ設定:**
```bash
cd apps/fitness
python setup_asc.py
```

**スクリーンショットアップロード (ローカルから):**
```bash
mkdir -p screenshots
# screenshot_1.png ~ screenshot_4.png を配置
python create_screenshots.py local
```

**スクリーンショットリサイズ (ASC上の大サイズから):**
```bash
python create_screenshots.py resize
```

---

## スキル化メモ

このドキュメントをスキル化する際のポイント：

1. **パラメータ化**: APP_NAME, BUNDLE_ID, SUBTITLE, CATEGORY, DESCRIPTION, KEYWORDS, API_URL
2. **共通固定**: ASC認証情報 (KEY_ID/ISSUER_ID/P8)、ASC APIパターン、EAS CLIコマンド
3. **フロー**: EAS init → Workers作成・デプロイ → app.json/eas.json更新 → ASC設定 → SS → ビルド → 提出
4. **判断ロジック**: アプリ機能に基づいてカテゴリ・キーワード・説明文・年齢レーティングを自動生成
5. **テンプレート**: fitness-api のWorker構造（PP/Support HTML）を汎用テンプレート化
