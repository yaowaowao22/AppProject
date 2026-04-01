# スキルギャップ分析 — fitnessアプリ開発知見との照合

生成日: 2026-04-02
対象スキル: expo-mobile-builder / ios-uiux / ios-app-store-submission

---

## 1. expo-mobile-builder.md（400行）

### 現状カバー一覧

| セクション | 概要 |
|-----------|------|
| §1 プロジェクト構成テンプレート | ディレクトリ構造（src/api, auth, navigation, screens, purchases, theme, utils） |
| §2 Provider階層パターン | AuthProvider → RevenueCatProvider → ThemeProvider → ToastProvider → RootNavigator |
| §3 認証パターン | AuthContext設計, SecureStore, デバイスID, ゲスト→正規変換 |
| §4 APIクライアントパターン | Axios + 401リトライキュー, stale-while-revalidateキャッシュ |
| §5 ナビゲーション設計 | 条件分岐ルーティング, タブ内ネストStack |
| §6 課金実装（RevenueCat） | サブスク・消耗品IAP・広告報酬の3パターン |
| §7 テーマシステム | AppTheme interface, useThemeColors(), AsyncStorage永続化 |
| §8 プッシュ通知 | requestPermissionsAsync, getExpoPushTokenAsync, setNotificationHandler |
| §9 AdMob（リワード広告） | シングルトンパターン, 報酬フロー, 重複防止 |
| §10 EAS Build & Submit | eas.json構成, appVersionポリシー, fingerprintポリシー非推奨理由, pnpmモノレポ注意点 |
| §11 画面追加テンプレート | 標準スクリーンテンプレートコード |
| §12 デバッグ注意 | __DEV__フラグ, AdMobテストID, RevenueCat Sandbox |
| §13 EC2上でExpo Go実行 | pkill/fuser, tunnel起動, S3経由ログ取得, Windows文字化け対策 |

### ギャップ（fitnessアプリ開発で得られた未記載ナレッジ）

| ギャップトピック | 詳細・背景 |
|----------------|-----------|
| **iOS Widget連携（expo-widgets / WidgetKit）** | fitnessアプリでウィジェット（ランダムQ&A表示）を実装済み。`expo-widgets`プラグインのapp.json設定, AppGroup設定, `UserDefaults(suiteName:)`でJS→Widget間データ共有のパターンが未記載 |
| **BottomSheet + KeyboardAvoidingView の組み合わせ** | `@gorhom/bottom-sheet`使用時、iOS/Androidで`KeyboardAvoidingView`の`behavior`分岐（`'padding'` vs `'height'`）が必要な実装パターンが未記載 |
| **PowerShell環境での文字化け対策（詳細化）** | §13ではS3経由のEC2ケースのみ。ローカルWindowsでのPowerShell→bash→Expoログのcp932/UTF-8エンコード問題, `chcp 65001`での対処が未記載 |
| **DynamicTypographyコンテキスト設計** | フォントサイズ（Small/Medium/Large）・太さ（Regular/Medium/Bold）・フォント種類（System/Rounded/Serif）をユーザーが選択可能なContext設計パターンが未記載。`src/theme/TypographyContext.tsx`の設計例なし |
| **EAS OTA runtimeVersionポリシーの詳細決定フロー** | appVersion vs fingerprintの比較判断基準は記載済みだが、「初回はfingerprint→pnpmモノレポ環境でOTA不達を経験→appVersionに移行」という実地の失敗→解決フローが未記載。どの段階でポリシー変更するかの判断木がない |
| **Drawerナビゲーション（カスタムDrawerContent）** | タブバー+Drawerのハイブリッド構成で、`DrawerContentScrollView`を使わずカスタムDrawerContentを実装するパターン（ユーザー情報表示, テーマ選択, 設定項目）が未記載 |
| **TaskContext + TaskStack（タスク管理画面）** | BottomTab内のStack → Modalで開くTaskScreenのようなパターン（React Navigation: `presentation: 'modal'`）が未記載 |
| **react-native.config.js の具体的除外パターン拡張** | 現行§10にfirebase/google-mobile-adsの除外例があるが、pnpmモノレポで問題になりやすい他パッケージ（`@react-native-community/datetimepicker`等）の除外判断基準が未記載 |

### 記述が古い・不十分な箇所

| 箇所 | 問題 | 改善案 |
|------|------|--------|
| §7 テーマシステム | `AppTheme`がgradient/accent/accentLightのみ。DynamicTypography未統合 | TypographySettingsをThemeContextに統合 or 別Contextとして追記 |
| §10 OTA runtimeVersion | appVersionポリシーの説明は正確だが、`version`フィールドの数値の上げ方（semver vs build number）が不明瞭 | `"version": "1.0.1"` などの具体的運用例を追記 |
| §5 ナビゲーション設計 | ハイブリッドモデル（タブ+Drawer）の言及なし | Drawerとの組み合わせ例を追記 |

### 他スキルとの重複

| 重複箇所 | 重複先 |
|---------|--------|
| App Store提出コマンド（`eas submit`） | ios-app-store-submission §9 |
| `eas.json` production設定 | ios-app-store-submission §3.2 |
| `runtimeVersion: appVersion` ポリシー説明 | ios-app-store-submission §3.1（一部） |

---

## 2. ios-uiux/SKILL.md（584行）

### 現状カバー一覧

| セクション | 概要 |
|-----------|------|
| §0 DDP受信インターフェース | ma-no-kozo-designからのTension Profile受け取り・変換テーブル |
| §1 UI設計の鉄則（Tier S/A/B） | タップターゲット44pt, 8ptグリッド, セマンティックカラー, SF Pro, ダークモード等 |
| §2 UX設計の鉄則（Tier S/A/B） | コンテンツファーストオンボーディング, オフラインファースト, スケルトン, ハビットループ等 |
| §3 ナビゲーションパターン | タブバー（ゴールドスタンダード）, ハイブリッドモデル, iOS標準ジェスチャー |
| §4 アニメーション設計 | Springトランジション標準値, Reduce Motion対応, タイミング注記 |
| §5 カラーパレット実践 | ジャンル別推奨パレット, セマンティックカラー一覧 |
| §6 コンポーネント別ベストプラクティス | ボタン, テキストフィールド, シート, アラート, 検索, ウィジェット, Live Activities |
| §7 リテンション・収益化設計 | サブスクUIの高コンバージョン設計, Appleガイドライン準拠 |
| §8 2024-2026トレンド | Liquid Glass, AIネイティブUI, 日本市場考慮点 |
| §9 アクセシビリティ（WCAG 2.2 AA） | VoiceOver, Dynamic Type, コントラスト比 |
| §10 App Store審査チェックリスト | HIG準拠, アクセシビリティ, パフォーマンス, プライバシー, 2025年重点項目 |
| §11 アンチパターン | 10カテゴリのNG事例と代替案 |
| §12 Layer 3適用ガイド | frontend_design_zones定義, 禁止領域, フォントルール, iOS Design Spec YAMLフォーマット |
| §13 連携ポイント | Layer 1→2a→3のデータフロー, 矛盾時優先順位 |

### ギャップ（fitnessアプリ開発で得られた未記載ナレッジ）

| ギャップトピック | 詳細・背景 |
|----------------|-----------|
| **Dynamic Typography（ユーザー選択可能なフォントサイズ・太さ・種類）** | fitnessアプリでユーザーが「フォントサイズ（S/M/L）」「太さ（Regular/Medium/Bold）」「フォント種類（System/Rounded/Serif）」を設定画面で変更できるUI実装。Apple HIG Dynamic Typeとは別の概念（ユーザー主導カスタマイズ）であることの定義・設計方針が完全に未記載 |
| **カスタムDrawerContent設計** | `DrawerContentScrollView`を使わない完全カスタムDrawerの設計ガイドライン（ユーザーアバター・テーマスウォッチャー・設定ショートカット等）が未記載。§3ハイブリッドモデルには言及があるが実装水準の設計指針なし |
| **高コントラストテーマ + アクセシビリティスライダーUI** | `Increase Contrast`（Accessibility設定）への対応UIパターン（`@Environment(\.colorSchemeContrast)`での分岐）が§9に未記載。またスライダーでコントラスト強度をユーザーが手動調整するカスタムUIパターンが未記載 |
| **テーマセレクター（カラーパレット選択UI）** | ユーザーがアプリ内でカラーテーマを切り替えるUI（スウォッチグリッド/プレビューカード）の設計パターンが未記載。§5のカラーパレットは設計者向け参考値であり、エンドユーザー向けテーマ選択UIの設計指針がない |
| **スライダーUI（カスタム）のHIG準拠実装** | カスタムスライダー（ハンドルカスタマイズ, トラックグラデーション）のタップターゲット確保・ハプティクスフィードバック設計が§6コンポーネント一覧に未記載 |
| **ウィジェット拡張（WidgetKit）の詳細設計** | §6でウィジェットのサイズバリエーションとiOS 18アクセントウィジェット対応には言及があるが、SwiftUI EntryView設計, AppIntentタイムライン設計, random Q&A表示ロジックが未記載 |
| **React Nativeでの実装との対応付け** | 本スキルはSwiftUI/UIKit記法中心。Expo/React Native（RN）での対応コンポーネント・実装パターンへの橋渡し情報（例：`UIFont.preferredFont` → `useDynamicTypography()` hookへの対応）が一切ない |

### 記述が古い・不十分な箇所

| 箇所 | 問題 | 改善案 |
|------|------|--------|
| §9 Dynamic Type | `label.font = UIFont.preferredFont(forTextStyle: .body)` のみ。ユーザー選択型カスタムタイポグラフィとApple Dynamic Typeの混同リスクあり | 両概念を明確に分離して記述 |
| §3 ナビゲーションパターン | ハイブリッドモデルの言及が2行のみ。カスタムDrawerの設計指針なし | §3に「カスタムDrawer設計」小節を追加 |
| §6 コンポーネント | スライダーなし（HIG標準外カスタムスライダーの記述ゼロ） | `UXSlider`カスタム実装パターンを追加 |

### 他スキルとの重複

| 重複箇所 | 重複先 |
|---------|--------|
| Dynamic Type言及（基礎部分） | expo-mobile-builder §7テーマシステム（薄い言及） |
| ウィジェットサイズバリエーション | expo-mobile-builder（WidgetKitは言及なし） |
| App Store審査チェックリスト§10 | ios-app-store-submission（チェックリスト系） |

---

## 3. ios-app-store-submission/SKILL.md（428行）

### 現状カバー一覧

| セクション | 概要 |
|-----------|------|
| §0 事前確認（共通情報） | Apple Team ID, Apple ID, ASC API Key, Expo Owner等の固定値 |
| §1 アプリ情報変数 | APP_SLUG, APP_NAME, BUNDLE_ID等の変数テーブル |
| §2 Cloudflare Workers API作成 | プライバシーポリシー/サポートページホスティング手順 |
| §3 アプリ設定ファイル更新 | app.json（eas init, expo-updates設定）, eas.json（production強化） |
| §4 ASCでアプリ手動作成 | POST /appsが非対応のため手動手順 |
| §5 ASCメタデータ自動設定 | setup_asc.pyの作成・実行。カテゴリ, サブタイトル, 説明文, キーワード, レビュー情報 |
| §6 スクリーンショットアップロード | create_screenshots.pyによる3サイズ自動リサイズ・ASCアップロード |
| §7 ビルド（EAS） | `eas build --platform ios --profile production` |
| §8 TestFlightで確認 | 必須チェック項目5点 |
| §9 App Storeに提出 | `eas submit` + ASC手動確認 |
| §10 全体フローまとめ | 15ステップのチェックリスト（手動5つ） |
| §11 各アプリの実績 | push-notify（通過済み）, FORGE fitness（進行中） |
| §12 トラブルシューティング | 7ケースの症状/原因/対処テーブル |
| §13 参考ファイル | テンプレートファイル一覧 |

### ギャップ（fitnessアプリ開発で得られた未記載ナレッジ）

| ギャップトピック | 詳細・背景 |
|----------------|-----------|
| **スクリーンショット自動生成フロー（シミュレーター操作→撮影→リサイズ）** | §6では「screenshots/に配置する」とあるだけで、iOSシミュレーターでどの画面をどういう手順で撮影するか（画面一覧・操作シナリオ・Xcodeシミュレーターの撮影コマンド）が未記載。`xcrun simctl io booted screenshot` コマンドによる自動化フローが未記載 |
| **ASCメタデータのローカライズ設定（多言語対応）** | §5のsetup_asc.pyは日本語ロケール（ja）のみ想定。英語（en-US）や他言語ロケールの追加方法（`v1/appStoreVersionLocalizations`への複数ロケール POST）が未記載。FORGE fitness は日英両対応の審査を経験 |
| **スクリーンショットに必要な画面サイズ種別の最新情報** | §6で「6.7"/6.5"/5.5"の3サイズ」とあるが、2026年現在のASC必須サイズ（6.9"が追加されたかどうか等）の確認フローが未記載。`create_screenshots.py`のSIZES定数が古くなるリスクへの言及なし |
| **App Privacy Labels詳細設定（「Data Not Collected」以外）** | §5で「App Privacy LabelsはASC UIで手動設定」とのみ記載。HealthKit使用時・ウィジェットへのデータ提供時のプライバシー申告ガイド、Required Reason APIs（User Defaults等）の申告漏れ防止チェックリストが未記載 |
| **審査リジェクト事例と対処パターン（fitness固有）** | ヘルス/フィットネスカテゴリに特有の審査リジェクト事例（医療的主張の禁止表現・HealthKit連携の審査基準・ウィジェット経由のデータ表示の審査基準）が未記載。§12のトラブルシューティングはビルド/提出技術問題のみで審査内容ゼロ |
| **TestFlightの外部テスター招待フロー** | §8は内部テストのみ言及。外部テスターへの招待（Beta App Review, グループ管理, 招待URLの発行）が未記載 |
| **ias update後の審査再提出の要否判断** | OTA（`eas update`）後に再提出が必要か不要かの判断基準（UI変更 vs 文言修正 vs 機能追加）が未記載。Appleの審査ポリシー上のOTA限界値（重大なUI変更・機能追加はビルド再提出必須）が未記載 |

### 記述が古い・不十分な箇所

| 箇所 | 問題 | 改善案 |
|------|------|--------|
| §6 スクリーンショット | 「6.7"/6.5"/5.5"の3サイズ」のみ。2026年の必須サイズ一覧更新が必要 | ASCの現行必須サイズ（iPhone 16 Pro Max等）を確認・更新 |
| §11 各アプリの実績 | FORGE fitnessが「🔄 進行中」のまま。審査通過後の更新が未反映 | 審査通過後に✅へ更新し通過日・バージョンを記録 |
| §5 setup_asc.py | `set_version_loc`のattrsにwhatsNewが未記載 | バージョンアップ時のWhat's New記入例を追加 |

### 他スキルとの重複

| 重複箇所 | 重複先 |
|---------|--------|
| `eas build --platform ios --profile production` コマンド | expo-mobile-builder §10 |
| `eas.json` productionプロファイル設定 | expo-mobile-builder §10 |
| `runtimeVersion: appVersion` ポリシー | expo-mobile-builder §10 |
| App Store審査チェックリスト（HIG/アクセシビリティ系） | ios-uiux §10 |

---

## 総合サマリー

### 最優先で追加すべきナレッジ（3スキル横断）

| 優先度 | トピック | 対象スキル |
|--------|---------|-----------|
| ★★★ | **Dynamic Typography（ユーザー選択型）Context設計パターン** | expo-mobile-builder + ios-uiux |
| ★★★ | **iOS Widget連携（expo-widgets/WidgetKit + AppGroup + UserDefaults）** | expo-mobile-builder + ios-uiux |
| ★★★ | **ASCメタデータのローカライズ設定（多言語対応）** | ios-app-store-submission |
| ★★ | **カスタムDrawerContent設計（タブバー+Drawerハイブリッド）** | expo-mobile-builder + ios-uiux |
| ★★ | **スクリーンショット自動生成フロー（xcrun simctl）** | ios-app-store-submission |
| ★★ | **審査リジェクト事例（ヘルス/フィットネスカテゴリ固有）** | ios-app-store-submission |
| ★ | **高コントラストテーマ + アクセシビリティスライダーUI** | ios-uiux |
| ★ | **EAS OTA runtimeVersion失敗→移行フローの判断木** | expo-mobile-builder |

### スキル間の重複整理提案

`eas build/submit`コマンドとEAS設定は `expo-mobile-builder` を正本とし、`ios-app-store-submission` からは参照リンクに変更することで重複を削減できる。審査チェックリストは `ios-app-store-submission` を正本とし、`ios-uiux §10` はHIG/アクセシビリティに絞って棲み分ける。
