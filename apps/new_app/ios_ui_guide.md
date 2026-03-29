# iOS UIパターンガイド — 買い切りアプリ9本共通仕様

> **対象アプリ**: 俳句帳 / 証明写真スタジオ / ゴミ分別ガイド / 敬語コーチ / 冠婚葬祭マナー帳 / ワリカン名人 / 御朱印デジタル帳 / 読み方ドリル / 四字熟語道場
> **作成日**: 2026-03-28 | iOS 17+ / Expo + React Native / 買い切り
> **ベース**: Apple HIG + ios-uiux スキル知見

---

## 目次

1. [共通UIコンポーネント仕様](#1-共通uiコンポーネント仕様)
2. [アプリ種別ごとのUI推奨パターン](#2-アプリ種別ごとのui推奨パターン)
3. [iOS 17+ デザイントレンド](#3-ios-17-デザイントレンド)
4. [アクセシビリティ要件](#4-アクセシビリティ要件)
5. [アニメーション・トランジション方針](#5-アニメーショントランジション方針)
6. [Safe Area / Dynamic Island 対応レイアウト](#6-safe-area--dynamic-island-対応レイアウト)

---

## 1. 共通UIコンポーネント仕様

### 1-1. グリッドシステム

すべてのアプリで **8ptグリッド** を基準とする。

| 用途 | 値 |
|---|---|
| 左右マージン | 16pt |
| カード内パディング | 16pt |
| カード間ギャップ | 12pt |
| セクション間 | 24pt |
| 大セクション間 | 32pt |
| タップターゲット最小サイズ | **44×44pt**（絶対遵守） |

### 1-2. ナビゲーションバー

```
高さ: 44pt（標準）/ 96pt（Large Title使用時）
スタイル: .inline（辞典・ツール型）/ .large（トップ画面）
背景: .systemBackground（自動ダークモード対応）
```

**用途別設定:**

| アプリ種別 | タイトルスタイル | 右ボタン |
|---|---|---|
| 辞典/リファレンス型 | `.inline` + 検索バー常時表示 | フィルターアイコン（line.3.horizontal.decrease.circle） |
| クイズ/学習型 | `.inline` + 進捗表示 | 設定（gearshape） |
| 記録/コレクション型 | `.large` + コレクション名 | 追加（plus.circle.fill） |
| ツール/計算型 | `.inline` + ステップ名 | 情報（info.circle） |

**React Native 実装例:**
```tsx
<Stack.Screen
  options={{
    title: 'ゴミ分別ガイド',
    headerLargeTitle: false,           // 辞典型はfalse
    headerSearchBarOptions: {
      placeholder: '品目を検索...',
      onChangeText: (e) => setQuery(e.nativeEvent.text),
    },
    headerStyle: { backgroundColor: colors.systemBackground },
    headerTintColor: colors.systemBlue,
  }}
/>
```

### 1-3. タブバー

**構成ルール:**
- タブ数: **3〜5個**（ラベルテキスト必須、アイコンのみ禁止）
- 高さ: 49pt + Safe Area下部を自動確保
- アクティブ: ソリッドアイコン + アクセントカラー
- 非アクティブ: ラインアイコン + `.tertiaryLabel`

**各アプリのタブ構成推奨:**

| アプリ | Tab1 | Tab2 | Tab3 | Tab4 |
|---|---|---|---|---|
| 俳句帳 | 俳句一覧（books.vertical.fill） | 新規作成（square.and.pencil） | 季語辞典（book.fill） | 設定（gearshape） |
| 証明写真スタジオ | 撮影（camera.fill） | 履歴（photo.on.rectangle） | 設定（gearshape） | — |
| ゴミ分別ガイド | 検索（magnifyingglass） | カテゴリ（square.grid.2x2.fill） | お気に入り（star.fill） | 設定（gearshape） |
| 敬語コーチ | レッスン（graduationcap.fill） | 辞典（book.fill） | 成績（chart.bar.fill） | 設定（gearshape） |
| 冠婚葬祭マナー帳 | 検索（magnifyingglass） | カテゴリ（list.bullet） | 六曜（calendar） | 設定（gearshape） |
| ワリカン名人 | 計算（yensign.circle.fill） | 履歴（clock.fill） | 設定（gearshape） | — |
| 御朱印デジタル帳 | 帳面（book.closed.fill） | 記録追加（plus.circle.fill） | 地図（map.fill） | 設定（gearshape） |
| 読み方ドリル | ドリル（pencil.and.list.clipboard） | 辞典（character.book.closed.fill） | 成績（chart.xyaxis.line） | 設定（gearshape） |
| 四字熟語道場 | 学習（brain.head.profile） | 辞典（text.book.closed.fill） | 成績（trophy.fill） | 設定（gearshape） |

### 1-4. カードコンポーネント

```tsx
// 標準カードスタイル
const cardStyle = {
  borderRadius: 12,           // 標準: 12pt / 大カード: 16pt
  padding: 16,
  backgroundColor: colors.secondarySystemBackground,
  // shadowは使わずmaterialで代替（iOS 17+）
  // shadow: { color: '#000', opacity: 0.06, radius: 8, offsetY: 2 }
};
```

**カードタイプ別仕様:**

| タイプ | 用途 | 高さ | 角丸 |
|---|---|---|---|
| リストカード | ゴミ分別・マナー・四字熟語辞典 | auto（最小64pt） | 12pt |
| 大カード | 俳句・御朱印記録表示 | 200〜240pt | 16pt |
| クイズカード | 敬語コーチ・四字熟語道場 | 160〜200pt | 16pt |
| ツールカード | ワリカン入力・証明写真ステップ | auto | 12pt |

### 1-5. リストコンポーネント

```tsx
// セル最小高さ: 44pt / 推奨: 64pt（アイコン付き）
// セパレーター: .separator カラー（16pt インセット）
// スワイプアクション: 削除は .destructive（赤）必須

<FlatList
  contentInsetAdjustmentBehavior="automatic"   // Safe Area自動対応
  keyboardDismissMode="on-drag"
  ItemSeparatorComponent={() => <Separator inset={60} />}
/>
```

**用途別リストスタイル:**

- **Inset Grouped（推奨）**: 辞典型・設定画面 — カード群の中にセクション
- **Plain**: 長大なリスト（読み方ドリル問題リスト等）
- **サイドバー型**: iPad対応時のカテゴリナビ

### 1-6. ボタン

```tsx
// プライマリ: filled, cornerRadius: 12, height: 52pt, font: .headline semibold
// セカンダリ: tinted, 同サイズ
// テキスト: plain, tintColor

// 状態管理
const ButtonStates = {
  default:   { opacity: 1.0 },
  pressed:   { opacity: 0.7, scale: 0.97 },
  disabled:  { opacity: 0.35 },
  loading:   { showSpinner: true, text: '処理中...' },
};

// 破壊的アクション（削除・リセット）
// → .destructive スタイル（赤）+ Alertによる2段階確認
```

**FAB（フローティングアクションボタン）:**
- サイズ: 56×56pt
- 位置: 右下、bottom: 24pt + tabBarHeight + safeAreaBottom
- SF Symbol: `plus`（新規作成）
- 使用: 俳句帳・御朱印デジタル帳の新規追加

### 1-7. モーダル・シート

```tsx
// Half Modal（Detent使用）: 50〜60%高さ
// → フィルター、クイック情報表示
// 閉じ方: 下スワイプ + キャンセルボタン両方提供（必須）

// Full Sheet: 詳細編集、証明写真プレビュー
// Alert: 2択以内の確認のみ（3択以上はActionSheet）

// React Native での実装
import { BottomSheetModal } from '@gorhom/bottom-sheet';
const snapPoints = useMemo(() => ['50%', '90%'], []);
```

**用途別モーダル:**

| 用途 | タイプ | スナップ |
|---|---|---|
| 四字熟語・俳句詳細表示 | Bottom Sheet | 60% / 90% |
| ゴミ分別フィルター | Bottom Sheet | 50% |
| 冠婚葬祭マナー詳細 | Full Sheet（push） | — |
| 証明写真プレビュー | Full Screen Modal | — |
| 削除確認 | Alert | — |

---

## 2. アプリ種別ごとのUI推奨パターン

### 2-1. 辞典/リファレンス型

**対象**: ゴミ分別ガイド / 冠婚葬祭マナー帳 / 敬語コーチ（辞典タブ）

#### 基本レイアウト構造

```
NavigationStack
├── SearchBar（常時表示・sticky）
├── フィルターチップ（横スクロール）
│   └── [すべて] [燃えるゴミ] [プラ] [カン] [古紙] ...
├── SectionList（アルファベット/カテゴリインデックス付き）
│   ├── Section Header（カテゴリ名）
│   └── Cell（アイコン + 品目名 + 分別種別バッジ）
└── 右端: セクションインデックス（あいうえお順）
```

#### 検索UI仕様

```tsx
// リアルタイム検索: 入力に対して即時フィルタリング
// デバウンス: 150ms（Fuse.jsで2000品目も高速）
// 検索中: スケルトンスクリーン（スピナー禁止）
// 0件: イラスト(200×200) + 「見つかりませんでした」+ サジェストCTA

const searchConfig = {
  debounceMs: 150,
  minQueryLength: 1,
  highlightMatches: true,   // 一致部分を太字ハイライト
  showRecentSearches: true, // 最近の検索: 最大7件
};
```

#### カラーパレット（辞典型）

| 役割 | Light | Dark |
|---|---|---|
| Primary | `#0A84FF` (systemBlue) | `#0A84FF` |
| Background | `#F2F2F7` (systemGroupedBackground) | `#1C1C1E` |
| Card | `#FFFFFF` (systemBackground) | `#2C2C2E` |
| Accent | アプリ固有（下表） | 同左 |

| アプリ | Accentカラー | 意図 |
|---|---|---|
| ゴミ分別ガイド | `#30D158` (systemGreen) | 環境・エコ |
| 冠婚葬祭マナー帳 | `#8E8E93` (systemGray) + Gold `#FFD700` | 格式・伝統 |
| 敬語辞典タブ | `#007AFF` (systemBlue) | 信頼・ビジネス |

#### ゴミ分別ガイド 固有パターン

```
分別バッジ（小）:
  燃えるゴミ → 赤 background, 白テキスト
  燃えないゴミ → グレー
  プラスチック → 青
  カン・ビン → 水色
  古紙 → 黄
  粗大ゴミ → オレンジ
  注意が必要 → SF Symbol: exclamationmark.triangle.fill

セル構成:
  [SF Symbol or絵文字 40×40] [品目名 .headline] [バッジ]
  [↓ 収集曜日 .caption .secondaryLabel]
```

#### 冠婚葬祭マナー帳 固有パターン

```
カテゴリトップ:
  [結婚] [葬儀] [七五三] [お宮参り] [法事] [その他]
  → 大カードグリッド（2列）+ 代表イラスト

詳細ページ:
  NavigationStack push遷移
  ├── ヒーロー画像（服装例: 240pt高）
  ├── 重要ポイント（黄アイコン付きリスト）
  ├── マナー詳細（Accordion形式で折りたたみ）
  └── 六曜カレンダー（日付選択 → 吉凶表示）
```

---

### 2-2. クイズ/学習型

**対象**: 敬語コーチ / 四字熟語道場 / 読み方ドリル

#### 基本レイアウト構造

```
HomeTab
├── 本日のレッスンカード（大・グラデーション背景）
│   └── 「今日の目標: 10問」+ ストリーク日数
├── カテゴリグリッド（2列カード）
└── 最近の弱点（ホリゾンタルスクロール）

QuizScreen（フルスクリーン）
├── プログレスバー（上部・細い、アクセントカラー）
├── 問題番号（x / 10）
├── 問題カード（中央・大カード 220〜260pt）
├── 選択肢ボタン（縦並び 4択、各 52pt高）
└── [次へ] ボタン（正答後に出現・Springアニメ）

ResultScreen
├── スコア円グラフ（大・中央）
├── 正誤サマリーリスト
└── [もう一度] + [弱点を復習] ボタン
```

#### 進捗・ゲーミフィケーション

```tsx
// ストリーク表示（ホーム上部固定バナー）
<StreakBanner days={7} color={colors.systemOrange} />

// XPアニメーション（正答時）
// +10 XP がカード中心から上にフワッと消える
// duration: 800ms, spring(bounce: 0.2)

// レベルバー（下部）
// Current XP / Next Level XP の細いバー
// 進捗変化時: 幅がspringで伸びる

// バッジ獲得モーダル（フルスクリーンオーバーレイ）
// 背景: confetti パーティクル（150個、500ms）
// → [タップして閉じる]
```

#### クイズカード仕様

```tsx
// 問題カード
const QuizCard = {
  borderRadius: 20,
  padding: 24,
  minHeight: 160,
  backgroundColor: colors.secondarySystemBackground,
  // 問題文: .title2 semibold, center
  // ルビ（読み方ドリル用）: .caption above main text
};

// 選択肢ボタン（4択）
// 未回答: secondarySystemBackground + .label テキスト
// 選択済（待機中）: systemBlue tinted
// 正解: systemGreen tinted + checkmark.circle.fill
// 不正解: systemRed tinted + xmark.circle.fill
// アニメ: 正誤判定後、0.25s でカラー変化

// 解説パネル（正誤判定後スライドイン）
// bottom sheet 40%高、スライドアップ 0.35s
```

#### 敬語コーチ 固有パターン

```
シチュエーション選択画面:
  カテゴリカード（2列グリッド）
  各カード: SF Symbol + シーン名 + 問題数 + 達成率バー

変換トレーニングモード:
  上段: 「普通の表現」テキスト
  ↓
  下段: テキストフィールド（敬語を入力）
  → [答えを見る] でフェードイン表示
```

#### 四字熟語道場 固有パターン

```
SM-2アルゴリズム対応UI:
  各カードに「次回復習まで: 3日」バッジ
  復習キュー: 赤バッジ数（「!」）でタブバーに表示

辞典モード（検索+詳細）:
  四字熟語: .largeTitle bold（中央揃え）
  読み: .subheadline ルビ
  意味: .body
  用例: .callout（イタリック風、斜め罫線囲み）
  類義語・対義語: Chip形式リスト
```

#### 読み方ドリル 固有パターン

```
4択モード（MVP）:
  問題: 漢字 .system(size: 64) weight: .bold center
  選択肢: ひらがな4択 + 送り仮名付き
  難易度バッジ: 小学生〜大学 color coded

手書きモード（v2以降）:
  Canvas: PKCanvasView wrapper
  正解判定: ML Model on-device
  消しゴム: ツールバーボタン（eraser.line.dashed）
```

---

### 2-3. 記録/コレクション型

**対象**: 俳句帳 / 御朱印デジタル帳

#### 基本レイアウト構造

```
CollectionTab（デフォルト: グリッドビュー）
├── ビュー切り替え（右上: square.grid.2x2 / list.bullet）
├── ソート/フィルターバー（下スクロールで隠れる）
├── グリッド（2列）or リスト
│   └── CollectionCard（写真 or テキストプレビュー）
└── FAB「+」（右下固定）

DetailScreen（push遷移）
├── ヒーロー画像 / テキスト表示エリア（300pt）
├── メタ情報（日付・場所・タグ）
├── 本文詳細
└── 編集・共有ボタン（ナビバー右）
```

#### 俳句帳 固有パターン

```
縦書き表示（React Native WebView経由）:
  HTML: writing-mode: vertical-rl; text-orientation: mixed
  font-family: HiraginoMincho（iOS標準明朝体）
  font-size: 28px（Large Title相当）
  背景: 和紙テクスチャ画像（subtle, opacity: 0.08）

俳句カード（グリッド）:
  背景: parchment風グラデーション（薄い黄〜オフホワイト）
  上部: 句（縦書き、中央）
  下部: 作成日 + 季語バッジ

季語バッジ:
  春: 桜ピンク #FFB7C5
  夏: 若葉グリーン #30D158
  秋: 紅葉オレンジ #FF9F0A
  冬: 雪白 #E5E5EA（ボーダーあり）
  新年: 金 #FFD700

新規作成モーダル（Half Sheet → Full Sheet）:
  五・七・五 カウンター（リアルタイム音節カウント）
  季語サジェスト（入力に連動してサジェスト5件）
  縦書きプレビュー（リアルタイム更新）
```

#### 御朱印デジタル帳 固有パターン

```
帳面ビュー（メイン）:
  見開き風レイアウト（横スクロールPager）
  左ページ: 御朱印写真（フィル表示）
  右ページ: 神社名・日付・メモ

写真登録フロー（3ステップ）:
  Step1: カメラ/フォトライブラリ選択
  Step2: クロップ（縦長 or 正方形）
  Step3: メタ情報入力（神社名・日付・参拝記録）
  → AsyncStorage/SQLite保存

マップ統合:
  react-native-maps（オンライン時のみ表示）
  オフライン時: 「マップはオンライン時に利用できます」プレースホルダー
  ピン: カスタムアイコン（torii gate SF Symbol系）

コレクション統計（ホーム上部）:
  参拝神社数 / 都道府県数 / 総参拝回数
  → 大きな数字 + アイコン の横並びカード
```

---

### 2-4. ツール/計算型

**対象**: ワリカン名人 / 証明写真スタジオ

#### 基本レイアウト構造

```
// ワリカン名人: シングルスクリーン（スクロール）
MainScreen
├── InputSection（参加者・金額入力）
├── SettingsSection（傾斜配分オプション）
├── ResultSection（計算結果）
└── ActionButtons（共有・コピー・履歴保存）

// 証明写真スタジオ: ステッパーフロー
StepFlow（3ステップ）
├── Step1: 撮影/選択
├── Step2: 補正・サイズ設定
└── Step3: プレビュー・保存・共有
```

#### ワリカン名人 固有パターン

```
PersonRow（参加者1人分のセル）:
  [名前テキストフィールド（幅: 35%）]
  [金額テキストフィールド（幅: 35%）]
  [役割ピッカー（幹事/通常/割引）（幅: 25%）]
  [削除ボタン（幅: 5%）]

NumberPad: .decimalPad（金額）/ .default（名前）
参加者追加: インラインの「+人を追加」テキストボタン（44pt高）

結果カード:
  背景: systemBlue グラデーション（上: #0A84FF → 下: #005FD8）
  テキスト: 白
  「1人あたり ¥X,XXX」→ .largeTitle bold center
  個別金額リスト（名前: 左, 金額: 右）
  [LINEで共有] [画像を保存] → 横並びボタン

画像生成（react-native-view-shot）:
  生成サイズ: 750×500 @3x
  透かし: 右下「ワリカン名人」ロゴ（opacity: 0.3）
```

#### 証明写真スタジオ 固有パターン

```
ステッパーインジケーター（ナビバー下固定）:
  ○─●─○  （3ステップ, アクティブ: filled + accent）

Step1（撮影）:
  カメラプレビュー（4:3 比率、角丸なし・エッジまでフル）
  グリッドオーバーレイ（3×3、薄い白線）
  顔枠ガイド（卵形破線）
  [シャッター] FAB（72×72, 中央下）

Step2（補正）:
  ← SwipeablePager で左右の比較
  ツールバー（下）: 明るさ / コントラスト / 背景除去
  背景除去トグル: iOS 17+ VisionKit使用
    → iOS 16以下: 「iOS 17以上が必要です」Alert

Step3（プレビュー・サイズ選択）:
  サイズチップ（横スクロール）:
    [3×4cm] [3.5×4.5cm] [4×5cm] [2×3cm（パスポート用）]
  印刷レイアウトプレビュー（L判に何枚並ぶか）
  [保存] [コンビニ印刷ガイドを見る]
```

**ステッパーフロー共通ルール:**
- 次ステップへ進む条件を満たすまで「次へ」ボタンをdisabled
- 「戻る」はナビゲーションバーの標準戻るボタン（エッジスワイプも有効）
- 各ステップ: プログレスバー（上部 4pt高）でフィードバック

---

## 3. iOS 17+ デザイントレンド

### 3-1. Dynamic Island 考慮

**基本方針**: Dynamic Islandに重要UIを被せない

```tsx
// React Native でのDynamic Island回避
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function ScreenHeader() {
  const { top } = useSafeAreaInsets();
  // top inset が自動でDynamic Island / ノッチ高さを返す
  return <View style={{ paddingTop: top }}>...</View>;
}

// Dynamic Island使用モデル (iPhone 14 Pro以降)
// SafeArea.top = 59pt（vs ノッチモデル: 44〜47pt）
```

**Live Activities の活用（証明写真スタジオ、読み方ドリルのみ）:**
- 証明写真スタジオ: 背景除去処理中の進捗表示（処理は10秒以内に完結）
- 読み方ドリル: 学習リマインダー（オプション機能）
- その他アプリ: Live Activities 不要（過剰実装を避ける）

### 3-2. SF Symbols 活用方針

```tsx
// 選択状態の明示: 選択時ソリッド / 非選択時ライン
// 例: タブバー
{ selected: 'magnifyingglass.circle.fill', unselected: 'magnifyingglass' }
{ selected: 'book.fill',                   unselected: 'book'           }
{ selected: 'star.fill',                   unselected: 'star'           }

// アニメーション付きSF Symbol（iOS 17+）
// 正答時: checkmark.seal.fill → .bounce エフェクト
// 誤答時: xmark.circle.fill  → .shake エフェクト
// 保存完了: checkmark.circle.fill → .pulse エフェクト

// 禁止事項
// Material Design アイコン使用禁止
// SVGカスタムアイコンは用途が明確な場合のみ（SF Symbolsで代替できない場合）
```

### 3-3. セマンティックカラー（必須）

Material Design のカラーシステムは使用しない。**iOS セマンティックカラーのみ使用。**

```tsx
// 全アプリ共通カラー定義
export const colors = {
  // テキスト
  label:            { light: '#000000', dark: '#FFFFFF' },     // .label
  secondaryLabel:   { light: '#3C3C4399', dark: '#EBEBF599' }, // .secondaryLabel
  tertiaryLabel:    { light: '#3C3C434D', dark: '#EBEBF54D' },

  // 背景
  systemBackground:          { light: '#FFFFFF', dark: '#000000' },
  secondarySystemBackground: { light: '#F2F2F7', dark: '#1C1C1E' },
  tertiarySystemBackground:  { light: '#FFFFFF', dark: '#2C2C2E' },
  systemGroupedBackground:   { light: '#F2F2F7', dark: '#000000' },

  // アクセント
  systemBlue:   '#0A84FF',
  systemGreen:  '#30D158',
  systemRed:    '#FF453A',
  systemOrange: '#FF9F0A',
  systemYellow: '#FFD60A',
};

// React Native での使用（useColorScheme フック）
import { useColorScheme } from 'react-native';
const scheme = useColorScheme(); // 'light' | 'dark'
```

### 3-4. Liquid Glass 対応準備（iOS 26 先行対応）

```tsx
// 現在は .ultraThinMaterial でBlur UI を準備
import { BlurView } from 'expo-blur';

// タブバー背景（translucent効果）
<BlurView intensity={80} tint={colorScheme === 'dark' ? 'dark' : 'light'}>
  {tabBarContent}
</BlurView>

// ナビゲーションバー（スクロール時のみ背景表示）
// scrollY > 10 で backgroundColor をfade-in
```

---

## 4. アクセシビリティ要件

### 4-1. Dynamic Type 対応

**固定ptサイズは全面禁止。** テキストスタイルを使用する。

```tsx
// フォントスタイル対応表
const typography = {
  largeTitle: { style: 'largeTitle', size: 34 },  // 俳句表示・クイズ問題
  title1:     { style: 'title1',     size: 28 },  // 四字熟語
  title2:     { style: 'title2',     size: 22 },  // セクションヘッダー
  headline:   { style: 'headline',   size: 17 },  // 強調テキスト (semibold)
  body:       { style: 'body',       size: 17 },  // 本文
  callout:    { style: 'callout',    size: 16 },  // 補助テキスト
  subheadline:{ style: 'subheadline',size: 15 },  // ルビ・読み
  footnote:   { style: 'footnote',   size: 13 },  // 注記
  caption1:   { style: 'caption1',   size: 12 },  // バッジ・ラベル
  caption2:   { style: 'caption2',   size: 11 },  // 最小テキスト
};

// React Native での実装
<Text
  style={{ fontSize: 17 }}   // ← 禁止
  // ↓ 正しい実装
  style={{ fontFamily: 'System', ...StyleSheet.flatten(
    useTextStyle('body')     // Platform固有で取得
  )}}
  allowFontScaling={true}   // 必須（default: true だが明示）
  maxFontSizeMultiplier={2.0} // 過大にならないよう上限設定（適宜調整）
/>
```

**Dynamic Type + 俳句縦書きの注意:**
- WebView内は `font-size` を `em` 単位で指定（px固定禁止）
- 最大文字サイズ(XXXLarge)での縦書きレイアウト崩れをテスト必須

### 4-2. VoiceOver 対応

```tsx
// すべてのインタラクティブ要素に設定
<TouchableOpacity
  accessibilityLabel="ゴミ分別検索フィールド"
  accessibilityHint="タップして品目名を入力します"
  accessibilityRole="button"
>

// 状態変化の通知
<View
  accessibilityLabel={`敬語クイズ ${currentQ}問目 全${totalQ}問中`}
  accessibilityLiveRegion="polite"   // 変化時に自動読み上げ
>

// 装飾要素は非表示に
<Image
  source={decorationImage}
  accessibilityElementsHidden={true}
  importantForAccessibility="no-hide-descendants"
/>

// クイズ正誤フィードバック
// 正解時: AccessibilityInfo.announceForAccessibility('正解です！')
// 誤答時: AccessibilityInfo.announceForAccessibility('不正解です。正答は〇〇です')
```

### 4-3. コントラスト比

| テキスト種別 | 最低比率 | 確認ツール |
|---|---|---|
| 通常テキスト（18pt未満） | **4.5:1** | Simulator → Accessibility Inspector |
| 大テキスト（18pt以上 / 14pt Bold） | **3:1** | — |
| UIアイコン・バッジ | **3:1** | — |

**注意が必要なケース:**
- 俳句帳の和紙テクスチャ上テキスト → テクスチャopacity ≤ 0.08 で確保
- ワリカン結果カード（白テキスト on 青背景）→ `#0A84FF` on `#FFFFFF` = 4.54:1 ✓
- 冠婚葬祭の Gold アクセント → Gold on White = 2.2:1（大テキスト3pt以上専用）

### 4-4. Reduce Motion 対応

```tsx
import { AccessibilityInfo } from 'react-native';

function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);
  return reduceMotion;
}

// 使用例
const reduceMotion = useReduceMotion();
const animation = reduceMotion ? undefined : { type: 'spring', bounce: 0.3 };
```

---

## 5. アニメーション・トランジション方針

### 5-1. 基本方針

「**必然的に見える流動性**」— ユーザーがアニメを意識しないほど自然に。派手なエフェクト禁止。

| 分類 | duration | spring bounce | 用途 |
|---|---|---|---|
| Micro（微細） | 150〜200ms | 0.0 | ボタン押下、トグル、チェック |
| Standard | 300ms | 0.15 | カード展開、モーダル表示 |
| Expressive | 400ms | 0.25〜0.30 | クイズ正答祝福、バッジ獲得 |
| Transition | 350ms | 0.10 | 画面遷移（push/pop） |

```tsx
// React Native Reanimated v3 推奨実装
import Animated, { withSpring, withTiming } from 'react-native-reanimated';

// Standard spring（ほとんどのケースはこれ）
const standardSpring = { damping: 20, stiffness: 200 };

// Expressive spring（クイズ正答・バッジ）
const expressiveSpring = { damping: 14, stiffness: 180, mass: 0.8 };
```

### 5-2. 画面遷移

| 遷移 | アニメーション | 備考 |
|---|---|---|
| NavigationStack push | 右→左スライド（iOS標準） | デフォルトのまま |
| Modal / Sheet | 下から上スライドイン | `presentation: 'modal'` |
| Tab切り替え | クロスフェード（iOS標準） | カスタム不要 |
| アラート | ズームイン（iOS標準） | カスタム不要 |
| クイズ問題切り替え | カード右→左フリップ or スライド | 200ms |

### 5-3. アプリ固有のアニメーション

**ワリカン名人 — 計算結果リビール:**
```
計算ボタン押下
→ ボタンが縮小・フェード（150ms）
→ 結果カードがスケール 0.9→1.0 + フェードイン（300ms, spring bounce:0.2）
→ 個別金額が上から順にスタガー表示（各50ms遅延）
```

**四字熟語道場 / 敬語コーチ — 正答フィードバック:**
```
正解: 選択肢背景が緑に変化（200ms tween）
     + checkmark.seal.fill が .bounce SF Symbol animation
     + 触覚フィードバック: UINotificationFeedbackGenerator(.success)
     + +10 XP ラベルが上にフロート消滅（600ms）

誤答: 選択肢背景が赤に変化（200ms）
     + xmark.circle が .shake SF Symbol animation
     + 触覚フィードバック: UINotificationFeedbackGenerator(.error)
     + 正答が緑でハイライト表示
```

**俳句帳 — カード新規追加:**
```
FABタップ
→ FABがスケール 1.0→1.1→0.0（220ms, spring）
→ Half Sheet スライドアップ（350ms）
→ 保存後: Sheet dismiss + カードが グリッド先頭にフェードイン（250ms）
```

**御朱印デジタル帳 — 帳面めくり:**
```
Pager横スクロール: snap, decelerationRate: 'fast'
ページ切り替え: 触覚フィードバック UISelectionFeedbackGenerator
帳面の「シャリ」感を演出（UIImpactFeedbackGenerator.light）
```

**証明写真スタジオ — 背景除去:**
```
処理中: スケルトン（シマーアニメーション）
完了: 背景が dissolve でフェードアウト（600ms）
     + ✓ アイコンがスケール 0→1（300ms, spring bounce:0.3）
     + 触覚: UINotificationFeedbackGenerator(.success)
```

### 5-4. 禁止アニメーション

- ✗ フラッシュ / ストロボ効果（光過敏症ユーザーへの影響）
- ✗ 1秒を超えるトランジション
- ✗ 無限ループアニメーション（コンテンツエリア）
- ✗ 3Dパースペクティブ過多なカードフリップ
- ✗ Reduce Motion 無視のアニメーション

---

## 6. Safe Area / Dynamic Island 対応レイアウト

### 6-1. デバイス別 Safe Area 値

| デバイス | StatusBar | Dynamic Island | TabBar | Home Indicator |
|---|---|---|---|---|
| iPhone 16 Pro（Dynamic Island） | 59pt | 54pt（バブル） | 83pt | 34pt |
| iPhone 16（Dynamic Island） | 59pt | 54pt | 83pt | 34pt |
| iPhone SE 3rd（ノッチなし） | 20pt | — | 49pt | 0pt |
| iPhone 14（ノッチ） | 47pt | — | 83pt | 34pt |

### 6-2. 実装方針

```tsx
// 全画面に SafeAreaProvider + SafeAreaView を使用
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// ルートに配置
<SafeAreaProvider>
  <NavigationContainer>
    {/* ... */}
  </NavigationContainer>
</SafeAreaProvider>

// 個別画面での使用例
function GameScreen() {
  const { top, bottom } = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, paddingTop: top, paddingBottom: bottom + 83 }}>
      {/* コンテンツ（タブバー分の paddingBottom を追加） */}
    </View>
  );
}
```

### 6-3. Dynamic Island を意識したレイアウト

```
禁止: top inset領域（0〜59pt）への重要UIの配置
     → Dynamic Islandが展開した際にUIが隠れる

推奨: ナビゲーションバー下（59pt以降）からコンテンツ開始
     → expo-router / React Navigation の標準動作で自動対応

特別対応が必要な場面:
  1. フルスクリーンカメラUI（証明写真スタジオ）
     → cameraPreview は safeAreaInsets.top から開始
     → シャッターボタンは safeAreaInsets.bottom + 24pt の位置に配置

  2. 縦書き俳句表示（俳句帳）
     → WebView height = screenHeight - top - tabBarHeight - bottom

  3. 地図表示（御朱印デジタル帳）
     → MapView は edges={['top']} を外して全画面表示
     → コントロールUIはSafeArea内に配置
```

### 6-4. キーボード対応

```tsx
// キーボード表示時にコンテンツが隠れないよう KeyboardAvoidingView を使用
import { KeyboardAvoidingView, Platform } from 'react-native';

<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  keyboardVerticalOffset={headerHeight}
>
  <ScrollView keyboardDismissMode="interactive">
    {/* 入力フォーム */}
  </ScrollView>
</KeyboardAvoidingView>

// 重要: テキストフィールドがキーボードで隠れるアプリ
// - ワリカン名人（名前・金額入力）
// - 俳句帳（俳句入力）
// - 御朱印デジタル帳（メモ入力）
// → 各画面でテスト必須（特にiPhone SE等の小画面）
```

### 6-5. iPad 対応（v2以降・オプション）

```tsx
// ユニバーサルビルドを意識した実装
const isIPad = Platform.isPad;

// iPad用レイアウト切り替え
const numColumns = isIPad ? 3 : 2;  // グリッドカラム数
const sidebarWidth = isIPad ? 320 : 0;

// UISplitViewController相当（React Navigation v7）
// 辞典・リファレンス型は特にiPad対応で価値UP
```

---

## 付録A: アプリ別クイックリファレンス

| アプリ | UIパターン | メインカラー | 主要コンポーネント | 技術特記 |
|---|---|---|---|---|
| 俳句帳 | 記録/コレクション型 | 墨黒 + 桜ピンク | FAB, 縦書きWebView, 季語バッジ | WebView縦書き必須 |
| 証明写真スタジオ | ツール/ステップ型 | `#0A84FF` | ステッパー, カメラUI, 背景除去 | iOS17+限定機能あり |
| ゴミ分別ガイド | 辞典/検索型 | `#30D158` | SearchBar+SectionList, 分別バッジ | Fuse.js 2000品目 |
| 敬語コーチ | クイズ/学習型 | `#007AFF` | QuizCard, 4択, 進捗ダッシュボード | SM-2不要（問題固定）|
| 冠婚葬祭マナー帳 | 辞典/検索型 | `#8E8E93` + Gold | カテゴリグリッド, Accordion | 六曜ローカル計算 |
| ワリカン名人 | ツール/計算型 | `#0A84FF` | PersonRow, 結果カード, view-shot | Pure TypeScript計算 |
| 御朱印デジタル帳 | 記録/コレクション型 | `#FF9F0A` | Pager帳面, マップ, 写真登録 | react-native-maps |
| 読み方ドリル | クイズ/学習型 | `#5AC8FA` | QuizCard大漢字, 4択, 難易度バッジ | 手書きはv2以降 |
| 四字熟語道場 | クイズ/学習型 | `#FF9F0A` | SM-2カード, XPバー, 辞典モード | SQLite + SM-2 |

---

## 付録B: App Store 審査チェックリスト（9本共通）

### HIG準拠
- [ ] タップターゲット全要素 44×44pt 以上
- [ ] バックボタン / 閉じるボタンが常に利用可能（モーダル含む）
- [ ] キーボードが入力フィールドを隠さない（全入力画面テスト済み）
- [ ] 標準UIコンポーネントを正しく使用（非標準UI要素の理由を明確化）

### アクセシビリティ
- [ ] VoiceOver: 全インタラクティブ要素にaccessibilityLabel/Hint設定済み
- [ ] Dynamic Type: XSSS〜AX5 全サイズでレイアウト崩れなし
- [ ] コントラスト比: 通常4.5:1以上、大テキスト3:1以上（Accessibility Inspector確認）
- [ ] Reduce Motion: アニメーション分岐実装済み

### パフォーマンス
- [ ] コールドスタート 3秒以内（iPhone 12以上で計測）
- [ ] リストスクロール 60fps（Instruments確認）
- [ ] 画像キャッシュ: expo-image 使用（react-native-fast-image 可）

### Safe Area
- [ ] Dynamic Island モデル（iPhone 14 Pro以降）で表示確認
- [ ] iPhone SE（ノッチなし小画面）でレイアウト確認
- [ ] ホームインジケーター領域（下34pt）にUIが被っていない

### プライバシー（買い切りアプリ共通）
- [ ] Privacy Manifest（PrivacyInfo.xcprivacy）設定済み
- [ ] カメラ / フォトライブラリ使用理由の文字列（証明写真・御朱印のみ）
- [ ] 位置情報: 御朱印デジタル帳のみ使用（「使用中のみ許可」で十分）
- [ ] データ収集なし（買い切り・オフライン）→ Privacy 欄「データ収集なし」申告

---

*ベース資料: ios-uiux スキル / Apple HIG 2025 / 03_final_report.md*
*作成: 2026-03-28 | Claude Code (claude-sonnet-4-6)*
