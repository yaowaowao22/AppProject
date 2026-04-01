# スキルギャップ分析レポート

> 作成日: 2026-04-02
> 対象スキル: expo-mobile-builder / ios-uiux / ios-app-store-submission
> パターン抽出元: git log（baseProject 全体・直近50コミット）

---

## 概要

`skill-patterns-from-commits.md`（前タスク出力）が未生成のため、
git ログから直接パターンを抽出して照合した。

### git ログから抽出されたパターン一覧

| # | パターン | 代表コミット |
|---|---------|-------------|
| P1 | **ウィジェット実装** (@bacons/apple-targets + RecallWidgetBridge) | `4df3c0b`, `cbe2d76`, `f856a32` |
| P2 | **BottomSheet** (KeyboardAvoidingView + keyboardShouldPersistTaps) | `66a9079`, `3976fce` |
| P3 | **文字化け対策** (Windows PowerShell cp932 / JSX エンコード破損) | `02c0391`, `967c5c9`, `f1ce375`, `d505a57`, `bc2de1c` |
| P4 | **DynamicTypography** (フォントサイズ・太さ・種類の動的設定) | `86a2312`, `4a6c36e`, `35d488b` |
| P5 | **OTA ポリシー** (appVersion vs fingerprint / Windows 環境問題) | `09f5cef`, `11dafa1`, `128899e` |
| P6 | **PanResponder / ScrollView ジェスチャー競合** | `6e19003` |
| P7 | **pnpm モノレポ hoisting 対策** (autolinking 除外) | `a97a267`, `c84981b` |
| P8 | **ドロワーナビゲーション** (CustomDrawerContent / SmartFilter) | `a6bc19d`, `f856a32` |
| P9 | **ネイティブ変更判断** (ネイティブ変更 → バージョンアップ + rebuild 必須) | `64c732c` |
| P10 | **ディープリンク** (外部AIアプリへの URL スキーム) | `556c3f2` |
| P11 | **高コントラストテーマ** (3 種 + コントラストスライダー) | `45f88be` |
| P12 | **テスト基盤** | ※コミットなし（ギャップ確認済み） |

---

## スキル 1: `expo-mobile-builder.md`

### 現状のセクション構成

```
1.  プロジェクト構成テンプレート
2.  Provider 階層パターン
3.  認証パターン
4.  API クライアントパターン
5.  ナビゲーション設計
6.  課金実装（RevenueCat）
7.  テーマシステム
8.  プッシュ通知
9.  AdMob 統合（リワード広告）
10. EAS Build & Submit（OTA 含む）
11. 画面追加テンプレート
12. デバッグ注意
13. EC2 上で Expo Go (tunnel) を動かす場合
```

### 追加すべき項目

| 優先度 | セクション名 | 内容概要 | 対応パターン |
|--------|-------------|---------|-------------|
| 🔴 HIGH | **14. BottomSheet 実装パターン** | `@gorhom/bottom-sheet` or `react-native-bottom-sheet` の標準設定。`KeyboardAvoidingView`・`keyboardShouldPersistTaps` の組み合わせ。ScrollView ネスト時の競合回避。`snapPoints` 設計（`['50%', '90%']` 等） | P2 |
| 🔴 HIGH | **15. 文字化け対策（Windows + JSX）** | Windows PowerShell で JSX を編集すると cp932 エンコーディング破損が発生するパターン。修正手順: `UTF-8 (BOM なし)` で保存し直す・エディタ設定の確認。バックエンドから文字列を受け取る場合の `Content-Type: charset=utf-8` 確認 | P3 |
| 🔴 HIGH | **16. DynamicTypography** | フォントサイズ・太さ・種類を Context + AsyncStorage でユーザーが変更できる設計パターン。`TYPOGRAPHY` 定数 vs `DynamicTypography` カスタムフックの使い分け。画面横断的な型インポート整理の手順 | P4 |
| 🔴 HIGH | **17. iOS ウィジェット実装** | `@bacons/apple-targets` による WidgetKit ターゲット追加手順。`RecallWidgetBridge`（App Group 経由でデータ共有）。iOS 16 / 17 互換対応ポイント（`@available` 分岐）。ランダムデータ表示・TimeLine エントリの設計 | P1 |
| 🟡 MID | **18. PanResponder / ScrollView ジェスチャー競合** | `PanResponder` を使ったスライダー実装時に ScrollView 縦スクロールを妨げる問題。`onMoveShouldSetPanResponder` の条件分岐で水平のみ捕捉する解決パターン | P6 |
| 🟡 MID | **19. ディープリンクパターン** | 外部アプリ（ChatGPT: `chatgpt://`、Gemini: `gemini://`、Claude: `claude://`）への URL スキームディープリンク。`Linking.openURL` + `canOpenURL` のフォールバックパターン | P10 |
| 🟡 MID | **20. ドロワーナビゲーション補足** | 既存 §5 を拡張。`CustomDrawerContent` のカスタマイズパターン。タブバー + ドロワーのハイブリッドモデル実装例。低頻度機能をドロワーに移動する際の UX 考慮点 | P8 |
| 🟢 LOW | **21. テスト基盤** | Jest + `@testing-library/react-native` の最低限セットアップ。カスタムフック単体テストのパターン（`renderHook`）。Context Provider のラッパー設定 | P12 |

### 既存内容との矛盾・重複リスク

- **§10 の OTA 設定**はすでに詳細あり（appVersion ポリシー推奨・fingerprint 非推奨の理由）。§14 以降で OTA 言及する場合は §10 を参照させるだけにすること（重複注意）
- **§7 テーマシステム**に `useThemeColors()` の説明あり。§16 DynamicTypography 追加時はテーマとの棲み分けを明確化すること（色 → ThemeContext、フォント → TypographyContext）

---

## スキル 2: `ios-uiux/SKILL.md`

### 現状のセクション構成

```
0.  Layer 1 入力の受け取り方（DDP 受信インターフェース）
1.  UI 設計の鉄則（Tier S / A / B）
2.  UX 設計の鉄則（Tier S / A / B）
3.  ナビゲーションパターン
4.  アニメーション設計
5.  カラーパレット実践
6.  コンポーネント別ベストプラクティス
7.  リテンション・収益化設計
8.  2024-2026 iOS トレンド
9.  アクセシビリティ実装（WCAG 2.2 AA 準拠）
10. App Store 審査チェックリスト
11. アンチパターン
12. Layer 3 適用ガイド（frontend-design 連携）
13. 連携ポイント（スキル間データフロー）
```

### 追加すべき項目

| 優先度 | セクション名 | 内容概要 | 対応パターン |
|--------|-------------|---------|-------------|
| 🔴 HIGH | **§6 補足: React Native / Expo での実装パターン** | 既存 §6 はすべて SwiftUI / UIKit のコード例。RN/Expo での対応実装を各コンポーネントに追記する（例: BottomSheet → `@gorhom/bottom-sheet`、Dynamic Type → `useWindowDimensions` + カスタム scale、ウィジェット → `@bacons/apple-targets`） | P1, P2, P4 |
| 🔴 HIGH | **§9 補足: Dynamic Type（React Native）** | SwiftUI の `adjustsFontForContentSizeCategory` は RN では使えない。代替: `PixelRatio.getFontScale()` + カスタム `DynamicTypography` フックで実現するパターンを追記 | P4 |
| 🟡 MID | **§5 補足: 高コントラストテーマ設計** | アクセシビリティ目的の高コントラストテーマ（3 バリアント）設計指針。コントラストスライダー UI のパターン（PanResponder + ScrollView 競合回避を含む） | P11, P6 |
| 🟡 MID | **§6 補足: BottomSheet の RN 実装注意点** | `gorhom/bottom-sheet` の `keyboardBehavior` 設定、`enablePanDownToClose`、iOS キーボード回避の具体的なプロパティ組み合わせ | P2 |
| 🟢 LOW | **§8 補足: iOS ウィジェットデザイン（RN プロジェクト）** | WidgetKit の制約（SwiftUI のみ）と RN プロジェクトでの対応方法（`@bacons/apple-targets` でネイティブ Swift ターゲット追加）。デザイン観点: small/medium/large サイズ別レイアウト指針 | P1 |

### 既存内容との矛盾・重複リスク

- **§9 Dynamic Type** は SwiftUI の `UIFont.preferredFont(forTextStyle:)` で説明されている。RN 補足を追加する際、「Swift は §9 の実装を使用、RN は §9 補足の実装を使用」と明示しないと混乱が生じる
- **§6 シート**に「50%未満の高さ: Bottom Sheet + Detent」とあるが、RN では `Detent` API は使えない。RN 実装補足では `snapPoints` ベースの説明に切り替えること（矛盾防止）

---

## スキル 3: `ios-app-store-submission/SKILL.md`

### 現状のセクション構成

```
0.  事前確認（共通情報）
1.  アプリ情報を決める
2.  バックエンド API（Cloudflare Workers）を作る
3.  アプリ設定ファイルを更新する
4.  App Store Connect でアプリを作成する（手動 1 回）
5.  ASC メタデータを設定する（自動化済み）
6.  スクリーンショットをアップロードする
7.  ビルドする
8.  TestFlight で確認する
9.  App Store に提出する
10. 全体フローまとめ
11. 各アプリの実績
12. トラブルシューティング
13. 参考ファイル
```

### 追加すべき項目

| 優先度 | セクション名 | 内容概要 | 対応パターン |
|--------|-------------|---------|-------------|
| 🔴 HIGH | **§12 補足: OTA vs ネイティブ変更の判断フロー** | JS 変更のみ → `eas update`、ネイティブ変更（新モジュール追加・app.json plugins 変更）→ バージョンアップ + `eas build` 必須。判断チェックリストを追記（`expo-modules-core` への影響・autolinking 変化の有無）。`expo-mobile-builder §10` との相互参照を明示 | P5, P9 |
| 🔴 HIGH | **§12 補足: Windows 環境 fingerprint ポリシー問題** | Windows/Linux 環境差異でローカルとEASのフィンガープリントが一致しない問題。`appVersion` ポリシーへの切り戻し手順（`eas.json` の `runtimeVersion.policy` を変更 → バージョン番号で管理） | P5 |
| 🟡 MID | **§14. 複数アプリ提出時の教訓** | push-notify（審査通過）→ FORGE（進行中）で得た教訓。`setup_asc.py` / `create_screenshots.py` のテンプレート流用手順。各アプリで異なる `BUNDLE_ID` / `SKU` / `KEYWORDS` の管理方法。「2 本目以降は 1 本目より速い」具体的な時短ポイント | P9 |
| 🟡 MID | **§6 補足: スクリーンショット自動化の詳細** | `create_screenshots.py` の仕組み（Pillow で 6.7" → 6.5" / 5.5" に自動リサイズ）。スクリーンショット撮影の推奨手順（iOS シミュレーター + `xcrun simctl io` コマンドでの自動撮影）。デザインガイドライン: 文字オーバーレイ不要・アプリ画面そのものを使う | - |
| 🟡 MID | **§15. 審査リジェクト対応パターン** | よくあるリジェクト理由と対処法（プライバシーポリシーURL が 404、Required Reason APIs 未申告、スクリーンショットとアプリ機能の乖離）。App Store Guidelines 4.3（コピーアプリ）対策 | - |
| 🟢 LOW | **§16. EAS Submit 後の ASC 手動確認チェックリスト** | TestFlight ビルドが Processing → Available になるまでの待機時間の目安（5〜30 分）。ASC で「審査に提出」前に確認すべき項目リスト（メタデータ・スクリーンショット・年齢レーティング・プライバシーラベル） | - |

### 既存内容との矛盾・重複リスク

- **§10 全体フロー**に「手動ステップは 5 つだけ」と書いてあるが、実際は `5, 8, 9, 11, 13, 15` の 6 つが列挙されている（不整合）。修正時に合わせて修正すること
- **§3 の appVersion ポリシー**設定は `expo-mobile-builder §10` にも詳細がある。両スキルで情報が分散している状態。追記時は相互参照リンクを入れて重複を最小化すること

---

## 優先度サマリー

| 優先度 | 数 | 対象スキル |
|--------|----|-----------|
| 🔴 HIGH | 8 項目 | expo-mobile-builder (4) / ios-uiux (2) / ios-app-store-submission (2) |
| 🟡 MID  | 8 項目 | expo-mobile-builder (3) / ios-uiux (2) / ios-app-store-submission (3) |
| 🟢 LOW  | 3 項目 | expo-mobile-builder (1) / ios-uiux (1) / ios-app-store-submission (1) |

### 最優先で追加すべき 3 項目

1. **expo-mobile-builder §17: iOS ウィジェット実装** — `@bacons/apple-targets` は公式 Expo ドキュメントにない手法で、知識がなければ詰まる
2. **expo-mobile-builder §15: 文字化け対策** — Windows 環境固有の問題で繰り返しバグが発生している（関連コミット 5 件）
3. **expo-mobile-builder §16: DynamicTypography** — `TYPOGRAPHY` 定数と `DynamicTypography` フックの混在がクラッシュを引き起こした（`d505a57`）

---

*分析メモ: `skill-patterns-from-commits.md` が未生成だったため、git log --oneline -50 から直接パターンを抽出した。次回このスキルを更新する際は、まず前タスクのパターン抽出ステップを実行すること。*
