# スキル統合設計書 v2 — Stage 3 実装用リファレンス

> **本ドキュメントの目的**: Stage 3の3並列タスクが独立して参照できるよう、スキルごとにセクションを分離した作業指示書。
> **前提**: `docs/skill-patterns-from-commits.md`（コミット履歴パターン抽出）+ `docs/skill-gap-analysis.md`（ギャップ分析）を統合した設計書。
> **入力ソース**: git log 380件（fitness/ReCallKit アプリ実装履歴）+ 既存スキル3種の全文分析
> **生成日**: 2026-04-02

---

## 目次

1. [expo-mobile-builder への追記計画](#1-expo-mobile-builder-への追記計画)
2. [ios-uiux への追記計画](#2-ios-uiux-への追記計画)
3. [ios-app-store-submission への追記計画](#3-ios-app-store-submission-への追記計画)
4. [3スキル間の重複排除ルール](#4-3スキル間の重複排除ルール)
5. [実装優先度サマリーと想定行数](#5-実装優先度サマリーと想定行数)

---

## 1. expo-mobile-builder への追記計画

### 1.1 現状のセクション番号マップ

```
1.  プロジェクト構成テンプレート
2.  Provider階層パターン
3.  認証パターン
4.  APIクライアントパターン
5.  ナビゲーション設計
6.  課金実装（RevenueCat）
7.  テーマシステム          ← §B で拡張
8.  プッシュ通知
9.  AdMob統合（リワード広告）
10. EAS Build & Submit      ← §E で拡張
11. 画面追加テンプレート
12. デバッグ注意            ← §D を12の後に挿入（旧12→13にシフト）
13. EC2上でExpo Go(tunnel)  ← 現在の13が14にシフト
```

### 1.2 追加セクション一覧（優先度・挿入位置・想定行数）

| 記号 | 見出し名 | 挿入位置 | 優先度 | 想定行数 |
|------|----------|----------|--------|---------|
| B | テーマシステム拡張（30テーマ・DynamicTypography・コントラスト調整） | 既存 §7 を拡張（末尾に追記） | **高** | 60行 |
| D | BottomSheet + キーボード回避 | §12（デバッグ注意）の前に挿入 → 新§12、旧12→13 | **高** | 45行 |
| E | OTA runtimeVersionポリシー選択基準 | §10（EAS Build & Submit）内に追記 | **高** | 30行 |
| C | iOSウィジェット（@bacons/apple-targets） | EC2セクション（旧13→新14）の前 → 新§14 | 中 | 70行 |
| F | Windows/PowerShell 文字化け対策 | EC2セクションの後 → 新§15 | 中 | 35行 |
| A | テスト基盤（Jest + RTL） | §15（文字化け）の後 → 新§16 | 低 | 80行 |

---

### 1.3 各セクションの詳細設計

#### §B: テーマシステム拡張（§7 末尾に追記）

**挿入位置**: 既存 §7 の「テーマ適用パターン」ブロックの直後

**追加見出し1**: `### 大規模テーマシステム（30テーマ・高コントラスト対応）`

**記述内容のアウトライン**:
- `ThemeKey` 列挙型 + `themes: Record<ThemeKey, AppTheme>` の定義構造
- テーマ分類：ライト / ダーク / 高コントラスト（3バリアント）
- テーマIDの AsyncStorage 永続化と起動時復元パターン
- SettingsScreen にモーダルピッカーを配置するパターン（`FlatList` + プレビューカード）
- `AppTheme` インターフェース拡張：`contrastMultiplier: number`・`isDark: boolean` フラグを追加

**コード例（必須）**:
```typescript
interface AppTheme {
  id: string;
  label: string;
  gradient: [string, string];
  accent: string;
  accentLight: string;
  isDark: boolean;              // 追加
  contrastMultiplier: number;   // 追加（1.0=標準 / 1.3=高コントラスト）
}
```

**追加見出し2**: `### DynamicTypography（ユーザー設定可能フォント）`

**記述内容のアウトライン**:
- `DynamicTypographyContext` の設計（`size: 0.8〜1.4` / `weight: TextStyle['fontWeight']` / `family: string`）
- `useTypography()` フックの返却値インターフェース
- AsyncStorage 永続化キー設計（`@app:typography`）
- 全画面への展開パターン：`TYPOGRAPHY` 定数から `useTypography()` フックへの移行手順
  - grep で `import.*TYPOGRAPHY` を洗い出し → 型インポート置換 → スタイル適用部分を更新
- iOS フォントファミリー指定：`System`=デフォルト、`HiraginoSans-W3`=丸ゴシック、`HiraMinProN-W3`=明朝
- **重複注意**: 色は `ThemeContext`、フォントは `TypographyContext` に一元化。両者を混在させない

**コード例（必須）**:
```typescript
// DynamicTypographyContext の型定義
interface DynamicTypography {
  size: number;           // 倍率 (0.8〜1.4)
  weight: TextStyle['fontWeight'];
  family: 'System' | 'Rounded' | 'Serif' | 'Monospace';
}
const { typography } = useTypography();
// StyleSheet.create 内で: fontSize: 15 * typography.size
```

**追加見出し3**: `### コントラスト調整スライダー（PanResponder競合回避）`

**記述内容のアウトライン**:
- `ContrastSlider` コンポーネントの実装パターン（PanResponder ベース）
- **ScrollView との競合問題**: `PanResponder.onMoveShouldSetPanResponder` で水平移動のみ捕捉
  ```typescript
  onMoveShouldSetPanResponder: (_, gestureState) =>
    Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
  ```
- スライダー値（0.8〜2.0）を `ThemeContext` の `contrastMultiplier` に反映する接続パターン

---

#### §D: BottomSheet + キーボード回避（新§12、現在の§12は§13にリナンバー）

**見出し**: `## 12. BottomSheet とキーボード回避`

**挿入位置**: 現在の §12（デバッグ注意）の直前

**記述内容のアウトライン**:
1. `@gorhom/bottom-sheet` の基本セットアップ（`GestureHandlerRootView` + `BottomSheetModalProvider` の配置）
2. **TextInput がある場合のネスト順序**（順序が逆だとキーボードが隠れる）:
   ```
   <BottomSheet>
     <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={insets.bottom}>
       <BottomSheetScrollView keyboardShouldPersistTaps="handled">
         <TextInput />
       </BottomSheetScrollView>
     </KeyboardAvoidingView>
   </BottomSheet>
   ```
3. `keyboardShouldPersistTaps="handled"` を忘れると TextInput フォーカス中にリスト行タップで `onPress` が発火しない
4. `nestedScrollEnabled={true}` の設定（Android 必須）
5. `snapPoints` 設計ガイド：`['50%', '90%']` パターンと `enableDynamicSizing` の使い分け
6. `keyboardBehavior="interactive"` vs `"extend"` の違い

**コード例（必須）**: 上記のネスト順序を示すフルコード例

---

#### §E: OTA runtimeVersionポリシー選択基準（§10 内に追記）

**挿入位置**: 既存 §10 の `⚠️ fingerprintポリシーはpnpmモノレポ非推奨` ブロックの直後

**追加見出し**: `### runtimeVersionポリシー選択フローチャート`

**記述内容のアウトライン**:
```
Q1: pnpmモノレポ環境か？
    → YES: appVersionポリシー一択（fingerprintは選択しない）
    → NO: Q2へ
Q2: Windows/Linux混在CI環境か？
    → YES: fingerprintは避ける（環境差異でフィンガープリントが一致しない）
    → NO: fingerprintも選択可能

appVersionポリシー運用ルール（3択）:
  1. JS変更のみ         → eas update（versionそのまま）
  2. ネイティブ変更     → version上げ → eas build（eas updateは不要）
  3. 不明な場合         → git diff app.json を確認し plugins/dependencies 変化を確認
```

**ネイティブ変更の判断チェックリスト**:
- `app.json` の `plugins` 配列に追加・削除があるか
- `package.json` にネイティブモジュール（`react-native-*`・`expo-*`）を追加・削除したか
- `ios/` ディレクトリ配下のファイルを直接編集したか

**OTA診断情報の表示パターン**（Settings画面）:
```typescript
import * as Updates from 'expo-updates';
// { Updates.updateId } { Updates.channel } { Updates.runtimeVersion }
```

---

#### §C: iOSウィジェット実装（新§14）

**見出し**: `## 14. iOSウィジェット（@bacons/apple-targets）`

**挿入位置**: EC2セクション（現在の §13、リナンバー後 §15）の直前

**記述内容のアウトライン**:
1. **前提**: ウィジェット追加はネイティブ変更 → `expo prebuild --clean` + `pod install` + `eas build` が必要
2. `app.json` プラグイン設定:
   ```json
   { "plugins": [["@bacons/apple-targets"]] }
   ```
3. `targets/widget/` ディレクトリ構造:
   ```
   targets/widget/
   ├── index.swift          # TimelineProvider + EntryView
   ├── Info.plist
   └── WidgetBundleTarget.swift
   ```
4. App Groups によるデータ共有（RN → ウィジェット）:
   - App Groups ID: `group.com.{bundleId}`
   - RN 側: `@react-native-async-storage` の App Groups 対応 or ネイティブモジュール
   - Swift 側: `UserDefaults(suiteName: "group.com.{bundleId}")`
5. iOS 16 / 17 互換対応:
   ```swift
   // iOS 17以降のみ containerBackground が使用可能
   if #available(iOS 17.0, *) {
     content.containerBackground(.fill.tertiary, for: .widget)
   }
   ```
6. ランダム表示のための `TimelineProvider.getTimeline()` 実装パターン:
   - 複数 `TimelineEntry` を生成
   - `policy: .after(nextDate)` で定期更新

**コード例（必須）**:
1. `app.json` プラグイン設定全体
2. `TimelineProvider` 最小実装（ランダムQ&A表示）
3. RN 側から App Groups への書き込みユーティリティ

---

#### §F: Windows/PowerShell 文字化け対策（新§15）

**見出し**: `## 15. Windows/PowerShell 文字化け対策`

**挿入位置**: EC2セクション（§15→§16 にリナンバー）の直前

**記述内容のアウトライン**:
1. **原因**: PowerShell デフォルトエンコーディング（cp932/Shift-JIS）が UTF-8 ファイルに干渉
2. **根本対策**（永続設定）:
   ```powershell
   # $PROFILE に追記
   $OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
   ```
3. **VSCode 設定**: `"files.encoding": "utf8"`, `"files.autoGuessEncoding": false`
4. **文字化けが発生した場合の一括修正手順**:
   - `git diff` で破損範囲を確認
   - 正規表現 `[^\x00-\x7F\u3000-\u9FFF\uFF00-\uFFEF]` で非ASCII・非CJK文字を検出
   - 影響ファイルを grep で洗い出し → 1ファイルずつ UTF-8 で保存し直す
5. **コミット戦略**: 文字化け修正は機能変更と混在させない → 単独コミットにする（`fix: 文字化け修正`）
6. **予防策**: `eas update`・ファイル生成コマンドの前後でエンコーディングを確認

---

#### §A: テスト基盤（新§16）

**見出し**: `## 16. テスト基盤（Jest + React Native Testing Library）`

**挿入位置**: §15（文字化け）の後（ファイル末尾）

**記述内容のアウトライン**:
1. **jest.config.js** の最小設定:
   ```js
   preset: 'jest-expo',
   transformIgnorePatterns: [
     'node_modules/(?!((jest-)?react-native|@react-native|@react-navigation|expo(nent)?|@expo|react-native-reanimated).*)'
   ]
   ```
2. **renderWithProviders ヘルパー**: `ThemeProvider` + `WorkoutProvider` + `AuthProvider` を1か所でラップ
3. **必須モック一覧**（`__mocks__/` に配置）:
   - `expo-secure-store`
   - `@react-native-async-storage/async-storage`
   - `expo-updates`
   - `@react-navigation/native`（`useFocusEffect` を `(cb) => cb()` に差し替え）
4. **Branch テスト優先戦略**: done 状態の解除・else 分岐・null ガードの3パターン追加でカバレッジ大幅向上
5. **テスト実行コマンド**: `pnpm test --watchAll=false --coverage`

---

## 2. ios-uiux への追記計画

### 2.1 現状のセクション番号マップ

```
0.  Layer 1入力受け取り方（DDP受信インターフェース）
1.  UI設計の鉄則（Tier S/A/B）
2.  UX設計の鉄則（Tier S/A/B）
3.  ナビゲーションパターン         ← §H を追記
4.  アニメーション設計
5.  カラーパレット実践              ← §I（コントラスト調整）を追記
6.  コンポーネント別ベストプラクティス ← §G（BottomSheet RN補足）を追記
7.  リテンション・収益化設計
8.  2024-2026 iOSトレンド
9.  アクセシビリティ実装            ← §G（Dynamic Typography補足）を追記
10. App Store審査チェックリスト
11. アンチパターン
12. Layer 3適用ガイド
13. 連携ポイント
```

### 2.2 追加セクション一覧

| 記号 | 見出し名 | 挿入位置 | 優先度 | 想定行数 |
|------|----------|----------|--------|---------|
| G | Dynamic Typography HIG準拠パターン（RN補足含む） | §9（アクセシビリティ）末尾に追記 | **高** | 40行 |
| H | Drawer/サイドバーのHIG準拠設計（RN実装注意含む） | §3（ナビゲーション）末尾に追記 | 中 | 35行 |
| I | コントラスト調整UIのHIG準拠指針 | §5（カラーパレット）末尾に追記 | 中 | 20行 |
| J | BottomSheet RN実装の注意点 | §6（コンポーネント）の BottomSheet/Sheet 項目に追記 | 中 | 15行 |

---

### 2.3 各セクションの詳細設計

#### §G: Dynamic Typography HIG準拠パターン（§9 末尾に追記）

**挿入位置**: §9（アクセシビリティ実装）セクションの末尾

**追加見出し**: `### Dynamic Type + ユーザー設定可能フォント`

**HIG設計原則（記述内容のアウトライン）**:
1. Apple HIG の基本立場：Dynamic Type（OSレベルのフォントサイズ）を最優先とする
2. ユーザーカスタムフォントサイズの位置付け：「OS設定値へのオフセット追加」として実装
3. **HIG Tier S（変更不可）**: 最小フォントサイズは Caption2（11pt）以上
4. 推奨フォントファミリー：SF Pro（System）・SF Pro Rounded・SF Mono のみApple公式保証
5. フォント設定UIの配置場所：Settings（設定）画面内に限定（メインナビに露出させない）

**RN実装時の注意（サブセクション）**:
```
React Native固有の実装詳細は expo-mobile-builder §7（テーマシステム）の
DynamicTypographyセクションを参照。

iOS HIG観点での注意点:
- StyleSheet に渡すサイズは PixelRatio.getFontScale() を考慮して計算すること
- allowFontScaling={false} を設定しない（Appleのアクセシビリティ審査指摘対象）
- カスタムフォントファミリーはAppleフォントライセンス規約を確認
```

---

#### §H: Drawer/サイドバーHIG準拠設計（§3 末尾に追記）

**挿入位置**: §3（ナビゲーションパターン）セクションの末尾

**追加見出し**: `### Drawer / サイドバーナビゲーション`

**HIG設計原則（記述内容のアウトライン）**:
1. iOS標準：タブバー + NavigationStack がプライマリ。Drawer は補助的用途
2. iPhone でDrawerをメインナビに使う場合の4条件:
   - Tab Bar と共存させる
   - 左エッジスワイプは Back gesture と競合しない設計
   - オーバーレイは `.thickMaterial`（systemBackground 上に重ねる）
   - 幅は画面幅の75%以下
3. 開閉アニメーション：`spring(response: 0.3, dampingFraction: 0.85)` + フェードオーバーレイ
4. **Smart Filters としての用途**：フィルター5種以上なら Drawer 許容、未満なら ActionSheet/BottomSheet 推奨

**RN実装時の注意（サブセクション）**:
```
React Native固有の実装は expo-mobile-builder §5（ナビゲーション設計）を参照。

iOS HIG観点:
- @react-navigation/drawer のデフォルトは左エッジスワイプで開く
  → StackNavigator 内で Back gesture と競合する
  → edgeWidth: 0 でジェスチャー無効化し、ハンバーガーボタン専用に
- Drawer項目のタップ領域は 44pt × 44pt 確保（HIG必須）
- 再選択時スタックリセット: DrawerContent の onPress で
  navigation.dispatch(StackActions.popToTop()) を呼ぶ
```

---

#### §I: コントラスト調整UIのHIG準拠指針（§5 末尾に追記）

**挿入位置**: §5（カラーパレット実践）セクションの末尾

**追加見出し**: `### コントラスト調整UIの設計指針`

**記述内容のアウトライン**:
1. WCAG 2.2 AA 基準：通常テキスト 4.5:1 / 大テキスト 3.0:1
2. `Increase Contrast`（iOS アクセシビリティ設定）への対応：`@Environment(\.colorSchemeContrast) == .increased`
3. カスタムコントラストスライダーの許容範囲：1.0（標準）〜 2.0（最大）
4. **アンチパターン**：コントラスト比を下げるUI（薄いグレーの文字、低不透明度テキスト）
5. **重複注意**: PanResponder + ScrollView の競合実装詳細は `expo-mobile-builder §B` を参照

---

#### §J: BottomSheet RN実装注意点（§6 の Sheet/BottomSheet 項目に追記）

**挿入位置**: §6（コンポーネント別ベストプラクティス）内の BottomSheet/Sheet 関連の説明に追記

**追加サブセクション**: `#### React Native実装時の注意`

**記述内容のアウトライン**:
```
SwiftUI の .sheet(isPresented:) は RN では @gorhom/bottom-sheet で代替。
HIG観点で注意すべき点:
- Detent（.medium / .large）は RN では snapPoints で実現
- UISheetPresentationController.detents は RN 非対応 → snapPoints: ['50%', '90%']
- キーボード回避の詳細実装: expo-mobile-builder §12 を参照
```

---

## 3. ios-app-store-submission への追記計画

### 3.1 現状のセクション番号マップ

```
0.  事前確認（共通情報）
1.  アプリ情報を決める
2.  バックエンドAPI（Cloudflare Workers）
3.  アプリ設定ファイルを更新する      ← §M（EASビルドベストプラクティス）を追記
4.  App Store Connectでアプリを作成
5.  ASCメタデータを設定する           ← §K（メタデータ教訓）を追記
6.  スクリーンショットをアップロード   ← §L（撮影ワークフロー詳細）を拡張
7.  ビルドする
8.  TestFlightで確認する              ← §N（チェックリスト拡充）を追記
9.  App Storeに提出する
10. 全体フローまとめ                  ← 手動ステップ数の不整合を修正
11. 各アプリの実績
12. トラブルシューティング            ← §O（審査リジェクト対処）を追記
13. 参考ファイル
```

### 3.2 追加セクション一覧

| 記号 | 見出し名 | 挿入位置 | 優先度 | 想定行数 |
|------|----------|----------|--------|---------|
| L | スクリーンショット撮影ワークフロー詳細 | §6（スクリーンショット）を拡張 | **高** | 50行 |
| K | ASCメタデータ管理の実践的教訓 | §5（ASCメタデータ）末尾に §5.3 として追記 | **高** | 55行 |
| M | EASビルド設定ベストプラクティス | §3（アプリ設定）末尾に §3.3 として追記 | **高** | 40行 |
| N | 提出前チェックリスト拡充 | §8（TestFlight）を拡張 | 中 | 40行 |
| O | 審査リジェクト対処パターン | §12（トラブルシューティング）表に追記 | 中 | 20行 |
| P | 複数アプリ提出時の教訓 | §11（各アプリの実績）末尾に追記 | 低 | 25行 |

---

### 3.3 各セクションの詳細設計

#### §L: スクリーンショット撮影ワークフロー詳細（§6 を拡張）

**拡張位置**: 既存 §6.2「スクリーンショットを撮影」ブロックを拡充

**追加見出し**: `### 6.2a 撮影ワークフロー選択基準`

**記述内容のアウトライン**:
1. **推奨ルート（最速）**: Expo Go / 開発ビルド + iOS シミュレーター
   ```bash
   # iPhone 15 Pro Max を 6.7" でターゲット
   xcrun simctl list | grep "iPhone 15 Pro Max"
   # シミュレーター起動後
   xcrun simctl io booted screenshot screenshot_1.png
   ```
2. **代替ルート**: TestFlight → 実機撮影 → AirDrop/iCloud 転送
3. **自動化ツール（現状コスト高）**: `expo-screenshot` / `fastlane snapshot` は設定コストが高い → 1〜4枚なら手動が現実的
4. **`create_screenshots.py` の仕組み**:
   - 入力: 6.7インチ（2796×1290px）
   - Pillow でリサイズ: 6.5"（2778×1284px）/ 5.5"（2208×1242px）
   - ASC API に直接アップロード

**スクリーンショット品質チェックリスト**（コードブロックで記述）:
```
- [ ] 6.7インチ（2796×1290px）で撮影
- [ ] ステータスバーの時刻を 9:41 に設定（xcrun simctl status_bar で変更可能）
- [ ] 日本語ローカライズ済みの状態
- [ ] サンプルデータが入った状態（空状態 NG）
- [ ] コア機能が一目でわかる構図（テキストオーバーレイ不要・アプリ画面そのもの）
```

**コード例**:
```bash
# シミュレーターのステータスバーを 9:41 に設定
xcrun simctl status_bar booted override --time 9:41 --batteryLevel 100 --batteryState charged
```

---

#### §K: ASCメタデータ管理の実践的教訓（§5 末尾に §5.3 として追記）

**見出し**: `### 5.3 実践的教訓（push-notify / FORGE提出経験から）`

**記述内容のアウトライン**:

1. **キーワード（100文字制限）の最適化**:
   - 競合が少ない日本語複合語を優先
   - アプリ名・サブタイトルに含まれる単語は重複不要（SEO的に無駄）
   - カンマ区切り・スペースなし
   - 例（悪）: `筋トレ,トレーニング,筋肉` → 例（良）: `筋トレ記録,ワークアウト管理,自重トレ,筋力アップ`

2. **説明文の構成**:
   - 冒頭170文字が「続きを読む」で切れる → 最重要メッセージを冒頭に配置
   - 箇条書き（`•`）形式が審査通過しやすい
   - 禁止表現: `最高`・`最強`・`AI`（主観的・誤解招く）

3. **レビューノート（英語）の重要性**:
   - `No login required.`・`Works fully offline.` を明示 → 審査員の誤解防止
   - デモ用アカウントは実際に動作するものを記載

4. **App Privacy Labels の扱い**:
   - ASC API 非対応 → UI から手動設定が必須
   - 一度設定すると変更が面倒 → 初回から正確に入力すること

5. **ascAppId の落とし穴**:
   - `eas.json` の `submit.production.ios.ascAppId` に空文字を入れるとビルドエラー
   - ASC でアプリ作成前は `{}` のまま保持
   - AppStore URL の数字部分が ascAppId（例: `id6743214830` → `"6743214830"`）

6. **アプリ名変更時の同期漏れ**（TANREN → FORGE 経験）:
   - `app.json` の `name` + `ios.bundleIdentifier` + ASC のアプリ名を同時に変更
   - `setup_asc.py` の `APP_NAME` も合わせて更新

---

#### §M: EASビルド設定ベストプラクティス（§3 末尾に §3.3 として追記）

**見出し**: `### 3.3 EASビルド設定のベストプラクティス`

**記述内容のアウトライン**:

1. **`eas.json` のバリデーションルール**（ハマりポイント）:
   - `submit.production.ios.ascAppId` に空文字は禁止 → ASC アプリ作成前は `{}` のまま
   - `cli.appVersionSource: "remote"` を設定すると `autoIncrement` は EAS 側で管理
   - `ios.image: "latest"` で最新 Xcode を使用（Swift バージョン不一致エラー防止）

2. **pnpmモノレポでの注意事項**:
   - `react-native.config.js` で不要なネイティブモジュールを除外（hoisting 対策）
   - `expo-build-properties` の `excludedPackages` で autolinking からも除外
   - `@babel/runtime` の Metro 解決問題: `extraNodeModules` でルートの `node_modules` に強制リダイレクト

3. **`appVersionSource: "remote"` の運用**:
   - バージョンは `eas.json` の remote 管理になり、`app.json` の `version` は参照されなくなる
   - 手動でバージョンを上げたい場合は `eas build:version:set`

4. **Expo Go 互換維持**（開発初期）:
   - `expo-dev-client` は `package.json` + `app.json` の `plugins` 両方から削除する
   - dev-client 追加前は Expo Go で開発 → ネイティブモジュール追加のタイミングで dev-client に切り替え

5. **iOS証明書の自動管理**:
   - EAS が Distribution Certificate + Provisioning Profile を自動管理
   - 初回失敗時は `--clear-cache` フラグで再生成: `eas build --platform ios --profile development --clear-cache`
   - Capabilities（Push Notifications・App Groups）は Developer Portal で手動有効化が必要

**`eas.json` 完成形テンプレート（コード例）**:
```json
{
  "cli": { "version": ">= 16.0.0", "appVersionSource": "remote" },
  "build": {
    "development": {
      "developmentClient": true, "distribution": "internal",
      "ios": { "simulator": true }, "android": { "buildType": "apk" }
    },
    "preview": {
      "distribution": "internal", "channel": "preview",
      "ios": { "simulator": false, "image": "latest" }
    },
    "production": {
      "autoIncrement": true, "channel": "production",
      "ios": { "image": "latest" }, "android": { "buildType": "app-bundle" }
    }
  },
  "submit": {
    "production": {
      "ios": { "ascAppId": "<ASCでアプリ作成後に設定>" }
    }
  }
}
```

---

#### §N: 提出前チェックリスト拡充（§8 を拡張）

**挿入位置**: 既存の §8 TestFlight チェックリストの末尾に追記

**追加見出し**: `### 8.2 提出前チェックリスト（メタデータ・技術・審査情報）`

**記述内容のアウトライン**:
```markdown
**メタデータ**:
- [ ] アプリ名 30文字以内
- [ ] サブタイトル 30文字以内
- [ ] キーワード 100文字以内
- [ ] 説明文に他社製品との比較表現なし
- [ ] プライバシーポリシーURL が 200 OK
- [ ] サポートURL が 200 OK

**スクリーンショット**:
- [ ] 6.7"（2796×1290px）が最低1枚
- [ ] 6.5"（2778×1284px）が揃っている
- [ ] 5.5"（2208×1242px）が揃っている
- [ ] 全サイズで UI が崩れていない

**技術チェック**:
- [ ] アイコン 1024×1024px・透過なし・角丸なし
- [ ] ビルドバージョンが前回より大きい（autoIncrement で自動）
- [ ] 使用しない Permission（NSCameraUsageDescription 等）を削除済み
- [ ] Privacy Manifest（PrivacyInfo.xcprivacy）が ios/ に配置済み（iOS 17+必須）

**審査情報**:
- [ ] ReviewNotes が英語で記載済み
- [ ] デモアカウントが必要な場合は認証情報を記載
- [ ] 年齢レーティングが正しい（4+ / 12+ / 17+）
- [ ] App Privacy Labels 設定済み（ASC UI から手動）
```

---

#### §O: 審査リジェクト対処パターン（§12 表に追記）

**挿入位置**: 既存 §12 トラブルシューティング表の末尾に行追加

**追加行**:
```
| Guideline 2.1 - App Completeness | ログイン画面でクラッシュ | デモ認証情報を ReviewNotes に記載 |
| Guideline 4.0 - Design: Copycat | UI が他アプリと酷似と判定 | スクリーンショットと ReviewNotes でオリジナリティを説明 |
| ITMS-90683: Missing Purpose String | Info.plist の Usage Description 欠落 | app.json の ios.infoPlist に該当キーを追加 |
| Binary rejected: Invalid Swift version | Xcode バージョン不一致 | eas.json の ios.image を "latest" に設定 |
| Metadata Rejected: Review notes inadequate | 審査ノートが不十分 | オフライン動作・ログイン不要等を英語で明示 |
```

---

#### §P: 複数アプリ提出時の教訓（§11 末尾に追記）

**挿入位置**: §11（各アプリの実績）テーブルの末尾

**追加見出し**: `### 2本目以降を速く出す時短ポイント`

**記述内容のアウトライン**:
1. `setup_asc.py`・`create_screenshots.py` のテンプレート流用（変数6個を置換するだけ）
2. Cloudflare Workers の `src/index.ts` は APP_NAME だけ変更でOK
3. `eas.json` は `push-notify/eas.json` をコピーして `ascAppId` を空にする
4. Bundle ID の事前登録を忘れない（EAS Build 前に Developer Portal で手動登録）
5. 1本目より速くなる理由：証明書・Provisioning Profile は既存のものを再利用

---

## 4. 3スキル間の重複排除ルール

### 4.1 責務マトリクス（主/参照 の決定表）

| トピック | expo-mobile-builder | ios-uiux | ios-app-store-submission |
|----------|---------------------|----------|--------------------------|
| テーマシステム実装（コード） | **主** | 参照 | — |
| テーマのHIG準拠判断（色選択） | 参照 | **主** | — |
| DynamicTypography 実装（コード） | **主** | 参照 | — |
| DynamicTypography HIG原則 | 参照 | **主** | — |
| コントラスト調整スライダー（実装） | **主** | 参照 | — |
| コントラスト調整UI HIG指針 | 参照 | **主** | — |
| Drawer ナビゲーション実装 | **主** | 参照 | — |
| Drawer HIG設計判断 | 参照 | **主** | — |
| BottomSheet 実装（KeyboardAvoidingView） | **主** | 参照 | — |
| BottomSheet HIG設計（Detent原則） | 参照 | **主** | — |
| OTA runtimeVersion 設定（コード） | **主** | — | 参照 |
| EAS ビルド設定（eas.json） | **主** | — | 参照 |
| iOS ウィジェット実装 | **主** | 参照 | — |
| スクリーンショット撮影ワークフロー | — | — | **主** |
| ASC メタデータ設定・教訓 | — | — | **主** |
| テスト基盤（Jest/RTL） | **主** | — | — |
| PowerShell 文字化け対策 | **主** | — | — |

### 4.2 参照の書き方（重複回避の記法ルール）

```
ルール1: HIG準拠の「べき論」→ ios-uiux が主担当
  記法例: "テーマ配色の HIG 準拠基準は ios-uiux §5 を参照"

ルール2: React Native/Expo の実装コード → expo-mobile-builder が主担当
  記法例: "DynamicTypography の実装詳細は expo-mobile-builder §7 を参照"

ルール3: App Store 提出・ASC 操作 → ios-app-store-submission が主担当
  記法例: "eas.json の submit 設定は ios-app-store-submission §3 を参照"

ルール4: 同じ内容を2箇所に書かない
  参照する側は「1行の参照リンクのみ」に制限する。
  コード例の重複も禁止（参照先にあるコードはここに書かない）
```

### 4.3 既存内容との矛盾修正リスト

| ファイル | 箇所 | 矛盾内容 | 修正方法 |
|---------|------|---------|---------|
| ios-app-store-submission §10 | 「手動ステップは5つだけ」 | 実際は5, 8, 9, 11, 13, 15の6つが列挙されている | 「6つ」に修正 |
| ios-uiux §6 | 「Bottom Sheet + Detent」 | RNでは `Detent` API は使えない | RN実装補足で `snapPoints` ベースに差し替えと明記 |
| ios-uiux §9 | Dynamic Type の実装例 | SwiftUI の `adjustsFontForContentSizeCategory` は RN で使えない | 「Swift実装はこちら、RN実装は補足を参照」と分岐を明示 |

---

## 5. 実装優先度サマリーと想定行数

### 高優先度（P1）— 現在のfitnessアプリ開発で実際に詰まるパターン

| 記号 | 対象スキル | セクション名 | 根拠コミット | 想定行数 |
|------|----------|------------|------------|---------|
| B | expo-mobile-builder | テーマ拡張（DynamicTypography・コントラスト） | 86a2312, 4a6c36e, 6e19003 | 60行 |
| D | expo-mobile-builder | BottomSheet + キーボード回避 | 66a9079, 3976fce | 45行 |
| E | expo-mobile-builder | OTA runtimeVersion選択基準 | 09f5cef | 30行 |
| G | ios-uiux | Dynamic Typography HIG準拠原則 | 86a2312（審査リスク） | 40行 |
| L | ios-app-store-submission | スクリーンショット撮影ワークフロー詳細 | FORGE提出進行中 | 50行 |
| K | ios-app-store-submission | ASCメタデータ管理の実践的教訓 | push-notify審査通過実績 | 55行 |
| M | ios-app-store-submission | EASビルド設定ベストプラクティス | 複数ビルド経験 | 40行 |

**P1 合計想定行数**: 320行

### 中優先度（P2）— 次フェーズで必要になるパターン

| 記号 | 対象スキル | セクション名 | 根拠 | 想定行数 |
|------|----------|------------|------|---------|
| C | expo-mobile-builder | iOSウィジェット（@bacons/apple-targets） | cbe2d76, f856a32 | 70行 |
| F | expo-mobile-builder | PowerShell文字化け対策 | 02c0391, f1ce375 | 35行 |
| H | ios-uiux | Drawer HIG設計 | a6bc19d, 1de8fe8 | 35行 |
| I | ios-uiux | コントラスト調整UI HIG指針 | 45f88be | 20行 |
| J | ios-uiux | BottomSheet RN実装注意 | 66a9079 | 15行 |
| N | ios-app-store-submission | 提出前チェックリスト拡充 | FORGE提出フロー | 40行 |
| O | ios-app-store-submission | 審査リジェクト対処パターン | 汎用的教訓 | 20行 |

**P2 合計想定行数**: 235行

### 低優先度（P3）— あれば良い

| 記号 | 対象スキル | セクション名 | 根拠 | 想定行数 |
|------|----------|------------|------|---------|
| A | expo-mobile-builder | テスト基盤（Jest + RTL） | 現状テスト未整備 | 80行 |
| P | ios-app-store-submission | 複数アプリ提出時の教訓 | 汎用的教訓 | 25行 |

**P3 合計想定行数**: 105行

---

### 全体スケジュール指針

```
Stage 3 実装タスク（3並列）:
  Task 3a: expo-mobile-builder を強化（§B, §D, §E を P1 として実装 → §C, §F も追加）
  Task 3b: ios-uiux を強化（§G, §H, §I, §J を実装）
  Task 3c: ios-app-store-submission を強化（§L, §K, §M を P1 として実装 → §N, §O, §P も追加）

実装総量: 約 660行（P1: 320行 + P2: 235行 + P3: 105行）
```

---

*作成日: 2026-04-02 / Stage 2出力 → Stage 3（3並列実装タスク）の入力として使用*
*前提ドキュメント: docs/skill-patterns-from-commits.md / docs/skill-gap-analysis.md*
