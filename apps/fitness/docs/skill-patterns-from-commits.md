# スキル統合ナレッジパターン（コミット履歴分析）

> 対象リポジトリ: `apps/fitness`  
> 分析コミット数: 380件  
> 生成日: 2026-04-02

---

## 1. expo-mobile-builder 向け

### 1-1. Jest + RTL テスト基盤構築

**代表コミット**: `fe4f8e7`, `b85fd61`, `eae1195`

**教訓・パターン**:
- `jest.config.js` に `preset: 'jest-expo'` + `transformIgnorePatterns` の白リスト設定が必須。`react-native-reanimated` や `@react-navigation/*` は変換対象に含めないとエラーになる
- `@testing-library/react-native` でモーダル・BottomSheet をテストする場合は `act()` 内に `fireEvent` を収める。非同期処理後は `waitFor` + `await` を必ず使う（`a2c512b`, `2e8d7b3`）
- `useFocusEffect` はモック困難なので `jest.mock('@react-navigation/native', () => ({ useFocusEffect: (cb) => cb() }))` でシンプルに差し替える（`9398ef2`）
- `App.tsx` 統合テストは `renderWithProviders` ラッパーを用意し、全 Context（Theme/Workout/DB）を1か所で注入する（`eae1195`）
- カバレッジ向上は「Branch テスト」優先：done 状態の解除・else 分岐・null/undefined ガードの3パターンを追加するだけで Branch が大幅上昇する（`ec3a9b8`, `c795ee8`）

---

### 1-2. テーマシステム（30テーマ・DynamicTypography・フォント設定）

**代表コミット**: `4bef67d`, `86a2312`, `4a6c36e`

**教訓・パターン**:
- `ThemeContext` に `currentTheme` / `setTheme` を持たせ、`useTheme()` フックを全コンポーネントで使う設計。`colors` / `typography` / `sidebarColors` をまとめてコンテキスト値にする（`3b5f5ee`）
- 30テーマ管理は `themes.ts` に `ThemeKey` 列挙型 + `themes: Record<ThemeKey, ThemeDefinition>` として定義。SettingsScreen にモーダルピッカーを配置（`4bef67d`, `9c05050`）
- DynamicTypography は `{ size: number; weight: TextStyle['fontWeight']; family: string }` を AsyncStorage に保存し、全コンポーネントで `useTypography()` フック経由で参照する（`4a6c36e`）
- フォント設定を全画面に展開する際は、まず型 `DynamicTypography` をインポートするファイルと `TYPOGRAPHY`（定数）をインポートしているファイルを grep で洗い出してから一括置換する（`35d488b`）
- 高コントラストテーマ追加時は `ContrastSlider` コンポーネントで `PanResponder` を使うが、`ScrollView` の縦スクロールを妨げる問題が発生する。`PanResponder` の `onMoveShouldSetPanResponder` で `dy > dx` 判定を加えることで縦スクロールを優先できる（`6e19003`）

---

### 1-3. iOS ウィジェット（@bacons/apple-targets + WidgetBridge）

**代表コミット**: `4df3c0b`, `cbe2d76`, `f856a32`

**教訓・パターン**:
- `@bacons/apple-targets` でウィジェットターゲットを追加する場合、`app.json` の `plugins` に `["@bacons/apple-targets"]` を追加し、`targets/widget/` ディレクトリを作成する
- `WidgetBridge`（App Groups 経由のデータ共有）はネイティブ変更を含むため、追加後は必ず `expo prebuild --clean` → `pod install` → ネイティブビルドが必要（`64c732c`）
- iOS 16/17 互換対応：ウィジェットで `@available(iOS 17, *)` ガードが必要な API は `#if available` ではなく `@available` アノテーションを使用する。iOS 16 では `containerBackground` が使えないため分岐する（`f856a32`）
- ウィジェットにランダム表示機能を実装する場合、`TimelineProvider.getTimeline()` で複数 `TimelineEntry` を生成し、`policy: .after(Date())` で定期更新する（`cbe2d76`）

---

### 1-4. BottomSheet（KeyboardAvoidingView + keyboardShouldPersistTaps）

**代表コミット**: `66a9079`, `3976fce`

**教訓・パターン**:
- BottomSheet 内に `TextInput` がある場合、`KeyboardAvoidingView` を `behavior="padding"` で BottomSheet のルート直下に配置する。`keyboardVerticalOffset` は SafeArea インセット分を加算する
- BottomSheet を `ScrollView` で包む場合は `keyboardShouldPersistTaps="handled"` を必ず設定する。これを忘れると TextInput フォーカス中にリスト行をタップしても onPress が発火しない（`66a9079`）
- BottomSheet と `ScrollView` を組み合わせるときは `nestedScrollEnabled={true}` も必要（Android 対応）

---

### 1-5. OTA 更新（expo-updates・runtimeVersion ポリシー選択）

**代表コミット**: `11dafa1`, `128899e`, `09f5cef`

**教訓・パターン**:
- `runtimeVersion` ポリシーの選択指針:
  - `fingerprint`：ネイティブコード変更のたびに自動更新。ネイティブ変更が多い場合に適している。ただし依存ライブラリのネイティブ部分変更で意図せずバージョンが上がることがある
  - `appVersion`：`app.json` の `version` フィールドと連動。手動管理だが予測可能
  - **実際の判断**：このプロジェクトでは `fingerprint` を試したが `appVersion` に戻している（`09f5cef`）。ウィジェットや Firebase 等のネイティブ変更が頻繁な場合は `appVersion` の方がOTAチャンネル管理が安定する
- 設定画面で OTA 情報（UpdateId・チャンネル・Runtime）を表示するには `expo-updates` の `Updates.updateId`, `Updates.channel`, `Updates.runtimeVersion` を利用する（`8007a11`）

---

### 1-6. PowerShell エンコーディング起因の文字化け対策

**代表コミット**: `02c0391`, `967c5c9`, `80489fa`

**教訓・パターン**:
- Windows 環境で PowerShell（またはエディタ）経由でファイルを編集すると、UTF-8 BOM なし → Shift-JIS に変換されて日本語が文字化けする
- 対処法：
  1. ファイル保存時のエンコーディングを `UTF-8 without BOM` に明示設定する（VS Code: `files.encoding: "utf8"`, PowerShell: `$OutputEncoding = [System.Text.Encoding]::UTF8`）
  2. 文字化けが発生したら git diff で壊れた箇所を確認し、正規表現 `[^\x00-\x7F\u3000-\u9FFF]` で非ASCII・非CJK文字を検出する
- 影響範囲が大きい場合（37箇所・28箇所など）は grep で対象を洗い出してから一括修正する。修正漏れが多いため数回に分けてコミットが発生しやすい（`967c5c9` → `80489fa` → `f1ce375` と複数コミット）

---

### 1-7. metro.config.js の @babel/runtime 問題

**代表コミット**: `394e45d`, `1301a99`, `59bc73b`

**教訓・パターン**:
- `@babel/runtime` 7.29+ が ES Module `exports` フィールドを使うようになり、Metro が CommonJS として解決できずバンドル失敗する
- 修正方法：`metro.config.js` の `resolver.extraNodeModules` に `@babel/runtime` をルートの `node_modules` に強制リダイレクトする
  ```js
  resolver: {
    extraNodeModules: {
      '@babel/runtime': path.resolve(__dirname, '../../node_modules/@babel/runtime'),
    },
  }
  ```
- モノレポ構成（pnpm workspaces）では各アプリが独自の `node_modules/@babel/runtime` を持つ場合に発生しやすい（`59bc73b`）

---

### 1-8. Firebase autolinking 除外（ hoisting 問題）

**代表コミット**: `a97a267`, `c84981b`

**教訓・パターン**:
- pnpm モノレポでは Firebase 関連パッケージが hoisting されることで `expo prebuild` 時に autolinking エラーが発生する
- `app.json` の `expo.extra.eas.build.experimental.npmLockFile` ではなく `app.json` の `plugins` 内で autolinking から除外する:
  ```json
  { "expo-build-properties": { "ios": { "excludedPackages": ["@react-native-firebase/app"] } } }
  ```

---

### 1-9. Expo Go 互換（dev-client 除去）

**代表コミット**: `cfb9893`

**教訓・パターン**:
- `expo-dev-client` を追加するとビルドが必要になり Expo Go で実行できなくなる
- 開発初期は `expo-dev-client` を dependencies から除外し、ネイティブモジュールが必要になった段階で追加する
- `app.json` の `plugins` から `expo-dev-client` を削除するだけでは不十分で `package.json` からも削除する必要がある

---

## 2. ios-uiux 向け

### 2-1. Dynamic Typography（ユーザー設定可能なフォントサイズ・太さ・種類）

**代表コミット**: `4a6c36e`, `86a2312`, `35d488b`

**教訓・パターン**:
- ユーザーが変更できるフォント設定は3軸：`size`（相対倍率 0.8〜1.4）・`weight`（light/regular/medium/bold）・`family`（System/丸ゴシック/明朝など）
- 実装構造:
  ```
  DynamicTypographyContext → useTypography() フック
  ├── AsyncStorage に永続化
  ├── 全テキストコンポーネントが useTypography() で取得した値を適用
  └── SettingsScreen にスライダー + ピッカー UI
  ```
- 既存の静的 `TYPOGRAPHY` 定数（`typography.ts`）を DynamicTypography に移行する際、型名の衝突（`TYPOGRAPHY` vs `DynamicTypography`）が発生しやすい。ファイル先頭の import を grep で洗い出してから一括置換する（`35d488b`）
- フォント種類切替は iOS の `fontFamily` 指定で行う。`System` はデフォルト（San Francisco）、丸ゴシックは `HiraginoSans-W3` 等を使用する

---

### 2-2. Drawer / サイドバー HIG 準拠パターン（BottomTab 廃止 → Drawer 移行）

**代表コミット**: `5cc549e`, `ee0dda4`, `78bf34f`

**教訓・パターン**:
- BottomTab を廃止して Drawer に移行する動機：画面数が増えたとき Bottom Tab は 5個が限界で UX が劣化する。Drawer はスケールしやすい
- 移行手順:
  1. `MainTabs.tsx`（BottomTabNavigator）を削除（`7a9010a`）
  2. `DrawerNavigator` をルートに配置し、各 Stack をドロワーのスクリーンとして直接マウントする（`5cc549e`）
  3. `DrawerContent` を `DrawerContentScrollView` + カスタム Row で全面置き換えする（`78bf34f`）
- DrawerNavigator の iOS 最適化:
  - `drawerType: "slide"` でネイティブ感を出す
  - `swipeEdgeWidth: 50` でジェスチャー起点を調整
  - `overlayColor: "rgba(0,0,0,0.3)"` でオーバーレイを設定（`ee0dda4`）
- Drawer 直下の Stack でヘッダーの戻るボタンが機能しない問題：`ScreenHeader` に `onBack` コールバックを追加し、`navigation.goBack()` を明示的に呼ぶ（`2db6b56`）
- Drawer 再選択時にスタックをリセットしないと前回の完了画面が再表示される。`DrawerContent` の `onPress` で `navigation.dispatch(StackActions.popToTop())` を呼ぶ（`61e0348`）

---

### 2-3. ヘッダー共通化パターン

**代表コミット**: `f6e391f`, `4207f93`, `ef8e819`

**教訓・パターン**:
- 全 Stack の `screenOptions` をまとめた `useStackScreenOptions()` フックを作成し、各 Navigator に適用する
  ```ts
  export function useStackScreenOptions(): StackNavigationOptions {
    const { colors } = useTheme();
    return {
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.text,
      headerTitleStyle: { fontWeight: '600' },
    };
  }
  ```
- `useColorScheme()` を Navigator 内で直接使うと Dark Mode 切替時に再レンダリングされない。`useTheme()` を使う（`a42e134`）
- `headerLargeTitle` を使うとハンバーガーボタンとタイトルが別行になる。同一行に揃えたい場合は `headerLargeTitle: false` を設定（`6ee144f`）
- `headerLargeTitleStyle` に `letterSpacing` を指定すると iOS でクラッシュする（型エラー）。削除すること（`6b40d14`）
- `.tsx` 拡張子が必要なファイルを `.ts` で作成すると JSX のパースに失敗する。`useCloseHeader.ts` → `useCloseHeader.tsx` にリネームが必要（`db702b6`）

---

### 2-4. Safe Area 対応

**代表コミット**: `5fb830c`, `2a636f9`

**教訓・パターン**:
- ヘッダーとコンテンツ領域が干渉する問題：`ScrollView` や `FlatList` に `contentInsetAdjustmentBehavior="automatic"` を設定するか、`SafeAreaView` を適切にネストする
- Tab Bar の SafeArea：`edges={['bottom']}` を `SafeAreaView` に明示指定しないとノッチ端末でカットされる（`2a636f9`）
- Drawer と SafeArea：DrawerNavigator は内部で SafeArea を処理するため、DrawerContent 内で追加の SafeAreaView は不要な場合が多い

---

### 2-5. iOS HIG 準拠のボタン・カードデザイン

**代表コミット**: `f43e39d`, `d6aed40`

**教訓・パターン**:
- ボタンサイズ：最小タップターゲット 44pt × 44pt（HIG 推奨）。`minHeight: 44` を StyleSheet に設定する
- カード余白：外側 `marginHorizontal: 16`、内側 `padding: 12〜16`。セクション間 `marginBottom: 24`
- フォント階層（HIG 準拠）：
  - タイトル: `fontSize: 17, fontWeight: '600'`
  - 本文: `fontSize: 15, fontWeight: '400'`
  - キャプション: `fontSize: 12, fontWeight: '400'`
- シャドウ：iOS は `shadowColor/shadowOffset/shadowOpacity/shadowRadius`、Android は `elevation`

---

## 3. ios-app-store-submission 向け

### 3-1. スクリーンショット自動化

**代表コミット**: `958a4de`

**教訓・パターン**:
- スクリーンショット撮影は Simulator + `xcrun simctl io booted screenshot` で自動化できる
- App Store Connect の要求サイズ：6.9インチ（iPhone 16 Pro Max）・6.5インチ（iPhone 14 Plus）・5.5インチ（iPhone 8 Plus）が必須
- スクリーンショット用コミット前に UI を最終状態にスナップショットコミットしておく（`958a4de`）

---

### 3-2. ASC メタデータ一括設定

**代表コミット**: `d210329`, `a695a6b`

**教訓・パターン**:
- `fastlane deliver` を使って `metadata/` ディレクトリから App Store Connect にメタデータを一括アップロードできる
- アプリ名変更（例：TANREN → FORGE）は `app.json` の `name` + `ios.bundleIdentifier` + ASC 上のアプリ名を同時に変更する（`a695a6b`）
- 英語対応（ローカライゼーション）は `metadata/en-US/` ディレクトリを追加する

---

### 3-3. Bundle ID 登録の教訓

**代表コミット**: `4c148e4`, `99ffee6`, `8f2666e`

**教訓・パターン**:
- Bundle ID は Apple Developer Portal で事前に登録が必要。EAS Build 実行前に登録しないと `403 Forbidden` エラーになる
- EAS 設定変更（`eas.json` の `bundleIdentifier`）と `app.json` の `ios.bundleIdentifier` を必ず同期させる
- 初回 EAS Build 時は `eas build --profile development --platform ios --clear-cache` で証明書を再生成する
- Bundle ID に関連する Capabilities（Push Notifications・App Groups）は Developer Portal で手動で有効化が必要

---

### 3-4. プライバシーポリシー / 利用規約画面の審査対応

**代表コミット**: `39457fd`, `8f2666e`

**教訓・パターン**:
- App Store 審査要件：アプリ内に「プライバシーポリシー」と「利用規約」のリンクまたは画面が必須
- 実装パターン：Settings 画面の末尾に `WebView` または `Linking.openURL()` でページを開くセルを追加する
- プライバシーポリシーの URL は `app.json` の `ios.privacyManifests` + ASC の「App Privacy」セクションに両方登録する
- 審査リジェクト対策：「データ収集なし」でも Privacy Manifest（`PrivacyInfo.xcprivacy`）ファイルを `ios/` に配置することが iOS 17+ から必須

---

### 3-5. 審査ガイドのチェックリスト運用

**代表コミット**: `cd9de0c`, `af5425a`

**教訓・パターン**:
- `docs/ios-review-guide.md` をチェックリスト形式で管理し、提出前に全項目確認する
- 主要チェック項目：
  - [ ] Bundle ID が Developer Portal に登録済み
  - [ ] プロビジョニングプロファイルが有効
  - [ ] プライバシーポリシー URL が有効
  - [ ] スクリーンショット全サイズが揃っている
  - [ ] Privacy Manifest が配置されている
  - [ ] TestFlight でクラッシュなし確認済み

---

## 4. 新規スキル候補

### 4-1. AWS Lambda + Cognito 連携（React Native からの認証付き API 呼び出し）

**代表コミット**: `74a0cae`, `a0cb300`, `21d08a1`

**概要**:
- Cognito Identity Pool（非認証ロール）+ Lambda Function URL + AWS Signature V4 の組み合わせでアプリからキーレスに AWS API を呼び出すパターン
- React Native での AWS SDK 利用は `aws4fetch`（ブラウザ互換フェッチ）が動かないため `@aws-sdk/client-lambda` に切り替えが必要（`0c83032`）
- IAM ロールは「信頼ポリシーの Pool ID 実値化」「インラインポリシー追加」の2段階で設定する（`874259c`）

**スキルへの統合提案**: `expo-mobile-builder` に AWS Cognito + Lambda 連携のセクションとして追加。deploy.sh の Windows 対応（cygpath 変換、Python zip 代替）も含める

---

### 4-2. DB OPFS 排他制御（Web / React Native Web）

**代表コミット**: `1aca618`, `38cf28b`, `0727c20`

**概要**:
- `sql.js`（WebAssembly SQLite）+ OPFS（Origin Private File System）を使用する場合、マルチタブ環境で二重オープンエラーが発生する
- Web Locks API（`navigator.locks.request()`）でロックを取得してから DB を開くことで排他制御を実現（`1aca618`）
- OPFS 初期化失敗時の自動回復：`opfs` ファイルを削除して再初期化する（`0727c20`）

**スキルへの統合提案**: 新規スキル `expo-web-db` または `fullstack-fastapi-infra` への追記

---

### 4-3. SM-2 スペーシングリピティション アルゴリズム

**代表コミット**: `875dd58`

**概要**:
- Anki 互換の SM-2 アルゴリズムを TypeScript で実装。`easeFactor`・`interval`・`repetitions` の3フィールドで管理
- 評価スコア（0〜5）に応じて次回復習日を計算する

**スキルへの統合提案**: 新規スキル `spaced-repetition` または `expo-mobile-builder` の教育アプリセクションに追加

---

### 4-4. SVG 力学グラフ（ナレッジマップ）

**代表コミット**: `35cefeb`, `b9e3e5e`

**概要**:
- `react-native-svg` + `requestAnimationFrame` ベースの Force-Directed Graph を実装
- ノード間の引力・斥力を毎フレーム計算し、SVG の `<Circle>` / `<Line>` を更新する
- タグ色分け・ノードのドラッグ操作も実装済み

**スキルへの統合提案**: 新規スキル `react-native-data-viz` または `expo-mobile-builder` の SVG グラフセクション

---

### 4-5. リワード広告 + 解析回数制限（Freemium 制御）

**代表コミット**: `12ef668`, `2d01de6`, `aefa3d3`

**概要**:
- `useRewardedAd` フックで Google Mobile Ads のリワード広告を管理（AImensetu から移植）
- 1日N回の制限を `AsyncStorage` + 日付キーで管理し、広告視聴で追加回数を付与する
- 制限機能自体をフラグ（`ENABLE_LIMIT`）で ON/OFF できる設計

**スキルへの統合提案**: `expo-mobile-builder` の課金・マネタイズセクションに追加

---

### 4-6. Windows Git Bash 環境での AWS CLI / シェルスクリプト対応

**代表コミット**: `121e02e`, `174199b`, `7c78d47`

**概要**:
- Git Bash 上で `aws lambda update-function-code --zip-file fileb://path` を実行する場合、`/c/Users/...` 形式のパスが Windows 形式に変換されないためエラーになる
- `cygpath -w "$PATH"` でパスを変換してから AWS CLI に渡す
- `zip` コマンドが Git Bash に存在しない場合、Python `zipfile` モジュールで代替する（`7c78d47`）

**スキルへの統合提案**: `expo-mobile-builder` の EAS/AWS デプロイ Tips に追記、または新規 `windows-dev-env` スキル

---

### 4-7. ポイント / ガミフィケーションシステム

**代表コミット**: `a7a9951`, `8b50a45`

**概要**:
- `PointsContext` でポイント残高・履歴を管理し、アクション（復習完了・連続ログイン）でポイントを付与
- `useUsageStats` フックで起動日数・ストリーク・最終起動日を `AsyncStorage` に記録
- ストリーク表示は SVG リング（`react-native-svg`）で実装

**スキルへの統合提案**: `expo-mobile-builder` のリテンション機能セクションに追加
