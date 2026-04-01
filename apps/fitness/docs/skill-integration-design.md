# スキル統合設計書 — 3スキルへのナレッジ統合計画

> Stage 3の3並列タスクが独立して参照できるよう、スキルごとにセクションを分離している。
> 入力ソース: gitログ380件（fitnessアプリ実装履歴）+ 既存スキル3種の全文分析

---

## 目次

1. [expo-mobile-builder 強化計画](#1-expo-mobile-builder-強化計画)
2. [ios-uiux 強化計画](#2-ios-uiux-強化計画)
3. [ios-app-store-submission 強化計画](#3-ios-app-store-submission-強化計画)
4. [3スキル間の責務境界と参照ルール](#4-3スキル間の責務境界と参照ルール)
5. [実装優先度サマリー](#5-実装優先度サマリー)

---

## 1. expo-mobile-builder 強化計画

### 1.1 追加セクション一覧

| # | 見出し名 | 挿入位置 | 優先度 |
|---|----------|----------|--------|
| A | テスト基盤（Jest + RTL） | セクション12（デバッグ注意）の後 → 新セクション13 | P1 |
| B | テーマシステム拡張（30テーマ + DynamicTypography） | 既存セクション7（テーマシステム）を拡張 | P1 |
| C | iOSウィジェット（@bacons/apple-targets） | セクション13（EC2上でExpo Go）の前 → 新セクション14 | P2 |
| D | BottomSheet + KeyboardAvoidingView | セクション11（画面追加テンプレート）の後 → 新セクション12.5（ただし既存13のEC2セクション前に挿入） | P1 |
| E | OTA更新詳細（runtimeVersionポリシー選択基準） | 既存セクション10（EAS Build & Submit）の `appVersionポリシー` 説明を拡充 | P1 |
| F | 文字化け対策（PowerShellエンコーディング） | セクション13（EC2上でExpo Go）に追記、または新セクション14として追加 | P2 |

---

### 1.2 各セクションの詳細設計

#### セクション A: テスト基盤（セクション12の後、新セクション13として挿入）

**見出し**: `## 13. テスト基盤（Jest + React Native Testing Library）`

**記述すべき内容**:

```
- Jest設定（jest.config.js）: preset='jest-expo', transformIgnorePatterns設定
- babel.config.js の設定（module:metro-react-native-babel-preset）
- モックパターン（コード例必須）:
  - expo-secure-store のモック
  - @react-native-async-storage のモック
  - expo-router / React Navigation のモック
  - useThemeColors / useAuth などのカスタムフックモック
- RTLセットアップ: @testing-library/react-native, renderWithProviders ヘルパー
- テスト実行コマンド: pnpm test --watchAll=false
```

**コード例を含むべき箇所**:
1. `jest.config.js` の全体設定
2. `__mocks__/expo-secure-store.js` のモックファイル
3. `test-utils/renderWithProviders.tsx` ヘルパー（ThemeProvider + AuthProvider をラップ）
4. 画面コンポーネントのテスト例（`HomeScreen.test.tsx`）

---

#### セクション B: テーマシステム拡張（既存セクション7を拡張）

**既存セクション7に追記する内容**:

**追記位置**: 既存の「テーマ適用パターン」の直後

**見出し追加**: `### 大規模テーマシステム（30テーマ対応）`

**記述すべき内容**:

```
- 30テーマ定義のファイル構造（themes/index.ts に配列でエクスポート）
- ライトテーマ / ダークテーマ / 高コントラストテーマの分類
- コントラスト調整スライダーの実装パターン（0.5〜2.0の範囲）
- テーマIDの永続化（AsyncStorage）と起動時復元
```

**追加見出し**: `### DynamicTypography（ユーザー設定可能フォント）`

**記述すべき内容**:

```
- DynamicTypographyContext の設計（fontSize / fontWeight / fontFamily の3軸）
- フォント種類の定義（System / Rounded / Monospace）
- DynamicTypography型の定義とuseTypography()フック
- 全画面への展開パターン（useTypography()でスタイルを注入）
- AsyncStorage永続化キー設計
```

**コード例を含むべき箇所**:
1. `AppTheme` インターフェース拡張（contrastMultiplier, isDark フラグ追加）
2. `DynamicTypographyContext` の型定義とProvider実装
3. 画面でのフォント適用パターン（`useTypography()` → `StyleSheet.create` への渡し方）

---

#### セクション C: iOSウィジェット（新セクション14として追加）

**見出し**: `## 14. iOSウィジェット（@bacons/apple-targets）`

**挿入位置**: セクション13（EC2上でExpo Go）の直前

**記述すべき内容**:

```
- @bacons/apple-targets のインストールと app.json プラグイン設定
- targets/widget/ ディレクトリ構造
  - targets/widget/index.swift（メインウィジェット実装）
  - targets/widget/Info.plist
- SwiftUI ウィジェットの基本テンプレート（TimelineProvider + EntryView）
- AppGroupsを使ったRN↔ウィジェット間のデータ共有
  - UserDefaults(suiteName: "group.com.massapp.{APP_SLUG}")
  - RNから書き込む: expo-modules-core のネイティブモジュール or react-native-shared-group-preferences
- ウィジェットのランダムQ&A表示パターン（TimelineEntryのコンテンツ更新）
- EASビルド時のウィジェットターゲット含有設定（iOS 16/17互換対応）
```

**コード例を含むべき箇所**:
1. `app.json` の `@bacons/apple-targets` プラグイン設定
2. `targets/widget/index.swift` の TimelineProvider 実装（最小限）
3. RN側からAppGroupsに書き込むユーティリティ関数

---

#### セクション D: BottomSheet + KeyboardAvoidingView

**挿入位置**: 既存セクション12（デバッグ注意）の前に新セクション12として挿入
（既存の12は13にリナンバー、13はEC2で14にリナンバー）

**見出し**: `## 12. BottomSheetとキーボード対応`

**記述すべき内容**:

```
- @gorhom/bottom-sheet のセットアップと基本パターン
- BottomSheet内でのテキスト入力（KeyboardAvoidingView の配置位置が重要）
- keyboardShouldPersistTaps="handled" の設定箇所
- ScrollView と PanResponder の競合回避（縦スクロールがパンジェスチャーを妨げる問題）
- BottomSheet の高さスナップポイント設計
```

**コード例を含むべき箇所**:
1. `BottomSheet` + `KeyboardAvoidingView` + `ScrollView` の正しいネスト順序（コード例必須）
2. `keyboardShouldPersistTaps` と `KeyboardAvoidingView behavior` の組み合わせパターン

---

#### セクション E: OTA更新詳細（既存セクション10を拡充）

**拡充位置**: 既存セクション10の `appVersionポリシーの動作` の直後

**追記見出し**: `### runtimeVersionポリシー選択フローチャート`

**記述すべき内容**:

```
- 選択基準フローチャート（テキストベース）:
  pnpmモノレポ? → YES → appVersionポリシー一択
               → NO  → チームがWindows/Linux混在? → fingerprintリスクあり
- appVersionポリシー運用ルール:
  1. JSのみ変更 → eas update（versionそのまま）
  2. ネイティブ変更（新モジュール、app.json plugins変更）→ version上げ → eas build
  3. versionを上げずにeas buildしない（OTA配信範囲がずれる）
- OTA診断情報の画面表示パターン（Settings画面でのデバッグ表示）
```

**コード例を含むべき箇所**:
1. OTA診断表示コンポーネント（`Updates.updateId`, `Updates.runtimeVersion` の表示）

---

#### セクション F: 文字化け対策（セクション14として追加）

**見出し**: `## 14. Windows/PowerShell 文字化け対策`

**挿入位置**: EC2セクションの後（最終セクション）

**記述すべき内容**:

```
- 原因: PowerShellのデフォルトエンコーディング（cp932）がUTF-8と衝突
- 根本対策: VSCode/エディタのファイル保存エンコーディングをUTF-8（BOMなし）に固定
- PowerShell実行時の一時対策:
  $OutputEncoding = [Console]::OutputEncoding = [Text.UTF8Encoding]::new()
- EAS CLI経由でファイルを生成する場合のエンコーディング確認方法
- 文字化けが発生した場合の一括修正パターン（Pythonスクリプトでの再エンコード）
- pnpm scriptsでエンコーディングを保証する方法（cross-envの活用）
```

**コード例を含むべき箇所**:
1. PowerShellプロファイルへの永続設定追加コマンド
2. 文字化けファイル検出スクリプト（Node.js版）

---

## 2. ios-uiux 強化計画

### 2.1 追加セクション一覧

| # | 見出し名 | 挿入位置 | 優先度 |
|---|----------|----------|--------|
| G | Dynamic Typography HIG準拠パターン | 既存のアクセシビリティセクションに追記 | P1 |
| H | Drawer/サイドバーナビゲーションのHIG準拠設計 | 既存のナビゲーションセクションに追記 | P2 |

**基本方針**: ios-uiux は SwiftUI / UIKit 中心のスキルであるため、React Native固有の実装詳細はここに書かない。「React Native実装時の注意」サブセクションとして追記し、主たる内容はHIG準拠の設計原則にとどめる。

---

### 2.2 各セクションの詳細設計

#### セクション G: Dynamic Typography HIG準拠パターン

**挿入位置**: 既存スキルのアクセシビリティ（VoiceOver・Dynamic Type）セクションの中

**見出し追加**: `### Dynamic Type + ユーザー設定可能フォント`

**HIG準拠の設計原則（記述すべき内容）**:

```
HIG原則:
- Apple は Dynamic Type（システムフォントサイズ）を最優先とする
- ユーザーが設定したフォントサイズは「追加の拡大縮小」ではなく
  「ベースサイズのオフセット」として実装すること
- フォントファミリー変更は読みやすさを損なわない範囲に限定
- 推奨フォントファミリー: SF Pro（System）、SF Pro Rounded（Rounded）、
  SF Mono（Monospace） — いずれもApple提供のシステムフォントを使用

HIG Tier S（変更不可）:
- フォントサイズが小さすぎてアクセシビリティを損なう設定は提供不可
- 最小フォントサイズ: Caption2（11pt）以上

推奨実装パターン:
- システムのDynamic Typeスケールをベースに、ユーザー設定を±オフセットとして適用
- フォント設定UIはSettings（設定画面）内に配置（メインナビゲーションに露出させない）
```

**「React Native実装時の注意」サブセクション**:

```
React Native固有の実装詳細は expo-mobile-builder §7（テーマシステム）の
DynamicTypographyセクションを参照。

iOS HIG観点での注意点:
- RNの StyleSheet.create に渡すフォントサイズは、
  PixelRatio.getFontScale() を考慮して計算すること
- allowFontScaling={true}（デフォルト）を明示的にfalseにしない
  （Appleのアクセシビリティ審査指摘対象）
- カスタムフォントファミリーを使う場合、Appleフォントライセンス規約を確認
```

---

#### セクション H: Drawer/サイドバーナビゲーションのHIG準拠設計

**挿入位置**: 既存スキルのナビゲーション設計セクションの末尾

**見出し追加**: `### Drawer / サイドバーナビゲーション`

**HIG準拠の設計原則（記述すべき内容）**:

```
HIG原則:
- iOS標準のナビゲーションパターンはタブバー + NavigationStack
- Drawer（サイドバー）はiPadのSplitView用途が主であり、iPhoneでは
  「補助的なナビゲーション」または「フィルター・設定パネル」として使う
- iPhoneでDrawerをメインナビゲーションに使う場合の注意:
  1. Tab Barと共存させる（ドロワーはタブの補完として機能させる）
  2. ジェスチャー（左エッジスワイプ）でのオープンはBack gestureと競合しない設計
  3. オーバーレイはsystemBackground上に.thickMaterialを使用
  4. 幅は画面幅の75%以下に制限

開閉アニメーション:
- 推奨: spring(response: 0.3, dampingFraction: 0.85)
- オーバーレイ背景: opacity 0→0.4 のフェード
- コンテンツが押し出されるパターン（push型）はiPhoneでは非推奨

Smart Filters パネルとしての用途:
- フィルター条件の選択に使う場合、ActionSheet/BottomSheetの方がHIG的に適切
- ただしフィルター項目が5種以上の場合はDrawerも許容
```

**「React Native実装時の注意」サブセクション**:

```
React Native固有の実装詳細は expo-mobile-builder §5（ナビゲーション設計）を参照。

iOS HIG観点での注意点:
- @react-navigation/drawerのデフォルト実装は左エッジスワイプで開く
  → Back gestureが有効なStackNavigator内では競合する
  → edgeWidth を 0 に設定してジェスチャーを無効化し、ハンバーガーボタン専用にする
- Drawer内のリスト項目は44pt以上のタップ領域を確保すること
```

---

## 3. ios-app-store-submission 強化計画

### 3.1 追加セクション一覧

| # | 見出し名 | 挿入位置 | 優先度 |
|---|----------|----------|--------|
| I | スクリーンショット撮影フロー詳細 | 既存セクション6（スクリーンショット）を拡張 | P1 |
| J | ASCメタデータ設定の実践的教訓 | 既存セクション5（ASCメタデータ）の後に追記 | P1 |
| K | 提出前チェックリスト拡充 | 既存セクション8（TestFlight）を拡張 | P2 |
| L | 審査リジェクト対処パターン | セクション12（トラブルシューティング）に追記 | P2 |

---

### 3.2 各セクションの詳細設計

#### セクション I: スクリーンショット撮影フロー詳細（セクション6を拡張）

**既存セクション6.2「スクリーンショットを撮影」を拡充**

**記述すべき内容**:

```
撮影方法の選択基準:
1. Expo Go / 開発ビルドでのシミュレーター撮影（推奨・最速）
   → Simulator: Device → iPhone 15 Pro Max (6.7")
   → cmd+S でスクリーンショット保存
   → create_screenshots.py が3サイズに自動リサイズ

2. 手動フロー（本番ビルドが必要な機能がある場合）
   → TestFlightからインストール → 実機撮影
   → iCloud / AirDropでMacに転送

3. expo-screenshot（自動化ツール）の現状:
   → Expo SDK 50以降で利用可能だが、設定コストが高い
   → 1〜3枚の静的スクリーンショットが目的なら手動フローが現実的

スクリーンショット品質チェックリスト:
- [ ] 6.7インチ（2796×1290px）で撮影
- [ ] ステータスバー: 時刻が9:41（Appleのお作法）または非表示
- [ ] 日本語ローカライズされた状態
- [ ] データが入った状態（空状態ではなくサンプルデータ入り）
- [ ] アプリのコア価値が一目でわかる構図
```

**コード例を含むべき箇所**:
1. `create_screenshots.py` のリサイズロジックの説明（既存ファイルへの参照）
2. シミュレーターで9:41表示にする方法（xcrun simctl を使った時刻設定）

---

#### セクション J: ASCメタデータ設定の実践的教訓（セクション5の後に追記）

**見出し追加**: `### 5.3 実践的教訓（複数アプリ提出経験から）`

**記述すべき内容**:

```
push-notify / FORGE提出経験から得た教訓:

1. キーワード（100文字制限）の最適化
   - 競合が少ない日本語複合語を優先（例: 「筋トレ記録」より「筋トレ管理アプリ」）
   - カンマ区切り、スペースなし
   - アプリ名・サブタイトルに含まれている単語は重複不要

2. 説明文の構成
   - 最初の170文字が「続きを読む」で切れる → 最重要メッセージを冒頭に
   - 箇条書き（•）で機能を列挙するフォーマットが審査通過率が高い
   - 「AI」「最高」「最強」などの主観的表現は避ける

3. レビューノート（英語）の重要性
   - テストアカウントが必要な場合は必ず記載
   - 「No login required」「Works offline」等の明示で審査員の誤解を防ぐ
   - デモ用ユーザー名/パスワードを記載する場合、実際に動作するものを使う

4. App Privacy Labels
   - 「Data Not Collected」は ASC API 非対応 → 手動でUIから設定
   - 一度設定するとアプリ削除まで変更が面倒 → 初回から正確に設定

5. ascAppId の扱い
   - eas.json の submit.production.ios.ascAppId に空文字を入れるとビルドエラー
   - ASCでアプリを作成するまでは {} のままにする
   - AppStore URLの数字部分がascAppId（例: id6743214830 → "6743214830"）
```

---

#### セクション K: 提出前チェックリスト拡充（セクション8を拡張）

**既存セクション8のTestFlightチェックリストを拡充**

**追記する項目**:

```
メタデータチェック:
- [ ] アプリ名が15文字以内（推奨）/ 30文字以内（必須上限）
- [ ] サブタイトルが30文字以内
- [ ] キーワードが100文字以内
- [ ] 説明文に他社アプリ名・OS名の比較表現がない
- [ ] プライバシーポリシーURLが正常にアクセス可能
- [ ] サポートURLが正常にアクセス可能

スクリーンショットチェック:
- [ ] 6.7" サイズのSSが最低1枚（必須）
- [ ] 6.5" / 5.5" のSSが揃っている
- [ ] 全SSでUIが崩れていない

技術チェック:
- [ ] アイコン1024×1024px、透過なし、角丸なし
- [ ] ビルドバージョンが前回提出より大きい（autoIncrementで自動）
- [ ] NSCameraUsageDescription等の使用しないpermissionを削除済み
- [ ] Bitcode設定（SDK 49以降: 不要）

審査情報チェック:
- [ ] ReviewNotesが英語で記載済み
- [ ] デモアカウントが必要な場合は認証情報を記載
- [ ] 年齢レーティングが正しい（4+ / 12+ / 17+）
```

---

#### セクション L: 審査リジェクト対処パターン（セクション12に追記）

**既存トラブルシューティング表に行を追加**

```
| 症状 | 原因 | 対処 |
|------|------|------|
| Guideline 2.1 - App Completeness | ログイン画面でクラッシュ | デモ用認証情報をReviewNotesに記載 |
| Guideline 4.0 - Design: Copycat | UI が他アプリと酷似と判定 | スクリーンショットとレビューノートでオリジナリティを説明 |
| ITMS-90683: Missing Purpose String | Info.plistのUsage Description欠落 | app.jsonのios.infoPlistに対象のUsage Descriptionを追加 |
| Binary rejected: Invalid Swift version | Xcodeバージョン不一致 | eas.json の ios.image を "latest" に設定 |
```

---

## 4. 3スキル間の責務境界と参照ルール

### 4.1 責務マトリクス

| トピック | expo-mobile-builder | ios-uiux | ios-app-store-submission |
|----------|---------------------|----------|--------------------------|
| テーマシステム実装（コード） | **主** | 参照 | — |
| テーマのHIG準拠判断 | 参照 | **主** | — |
| DynamicTypography実装 | **主** | 参照 | — |
| DynamicTypographyのHIG原則 | 参照 | **主** | — |
| Drawerナビゲーション実装 | **主** | 参照 | — |
| DrawerのHIG設計判断 | 参照 | **主** | — |
| OTA更新設定（runtimeVersion） | **主** | — | 参照 |
| ビルド設定（eas.json） | **主** | — | 参照 |
| スクリーンショット撮影フロー | 参照 | — | **主** |
| ASCメタデータ設定 | — | — | **主** |
| アクセシビリティ（HIG原則） | 参照 | **主** | — |
| テスト基盤（Jest/RTL） | **主** | — | — |
| iOSウィジェット実装 | **主** | 参照 | — |

### 4.2 参照ルール（重複回避）

```
1. HIG準拠の「べき論」（Should/Must）→ ios-uiux が主、他から参照
   例: "テーマの配色はios-uiux §○○のHIG準拠カラールールを参照"

2. React Native/Expoの実装コード → expo-mobile-builder が主、他から参照
   例: "DynamicTypographyの実装はexpo-mobile-builder §7を参照"

3. ASC操作・App Store提出手順 → ios-app-store-submission が主、他から参照
   例: "eas.jsonのsubmit設定はios-app-store-submission §3.2を参照"

4. 同じ内容を2箇所に書かない。後から参照する側は1行の参照リンクだけ書く。
```

---

## 5. 実装優先度サマリー

### P1（必須 — 現在のfitnessアプリ開発で実際に詰まるパターン）

| 項目 | 対象スキル | 根拠（gitコミット） |
|------|----------|-----------------|
| BottomSheet + KeyboardAvoidingView パターン | expo-mobile-builder §D | 3976fce, 66a9079 |
| DynamicTypography実装パターン | expo-mobile-builder §B | 86a2312, 4a6c36e, 35d488b |
| OTA runtimeVersionポリシー選択基準 | expo-mobile-builder §E | 09f5cef |
| ASCメタデータ実践的教訓 | ios-app-store-submission §J | push-notify審査通過実績 |
| スクリーンショット撮影フロー | ios-app-store-submission §I | FORGE提出進行中 |
| Dynamic Typography HIG準拠原則 | ios-uiux §G | 86a2312（アクセシビリティ審査リスク） |

### P2（推奨 — 次フェーズで必要になるパターン）

| 項目 | 対象スキル | 根拠 |
|------|----------|------|
| iOSウィジェット（@bacons/apple-targets） | expo-mobile-builder §C | cbe2d76, f856a32 |
| Drawer/サイドバーHIG設計 | ios-uiux §H | a6bc19d, 1de8fe8 |
| 提出前チェックリスト拡充 | ios-app-store-submission §K | FORGE提出フロー改善 |
| 審査リジェクト対処パターン | ios-app-store-submission §L | 汎用的教訓 |
| 文字化け対策（PowerShell） | expo-mobile-builder §F | 02c0391, f1ce375等 |

### P3（あれば良い — 将来的に価値が出るパターン）

| 項目 | 対象スキル | 根拠 |
|------|----------|------|
| テスト基盤（Jest + RTL） | expo-mobile-builder §A | 現状テスト未整備 |
| expo-screenshotによる自動化 | ios-app-store-submission §I補足 | 現状手動で十分 |

---

*作成日: 2026-04-02 / Stage 2出力 → Stage 3（3並列実装タスク）の入力として使用*
