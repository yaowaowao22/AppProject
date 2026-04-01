# FORGE (TANREN) 開発タイムライン — 記事リサーチ用

> `git log --format='%ai | %s' -- . | sort` で抽出（2026-04-02 時点）

---

## 開発サマリー

| 指標 | 値 |
|------|-----|
| 総コミット数 | 152 |
| 開発日数 | 4日間（3/29〜4/1） |
| スクリーン数 | 15画面 |
| テーマ数 | 30種（和名テーマ全種） |
| ソースコード（主要ファイル）| 9,895行 |
| ソースコード（全.ts/.tsx） | 20,434行 |

---

## フェーズ別タイムライン

### 3/29（Day 1）— 初期実装

**1コミットで骨格を構築**

```
2026-03-29 05:03 | feat(fitness): TANRENアプリ初期実装
```

- アプリ名「TANREN」として初回リリース
- ワークアウト記録UI基盤（部位→種目→セット記録のフロー）
- WorkoutContext / ThemeContext の初期実装
- Drawer ナビゲーション構造
- テーマシステム初版

---

### 3/30（Day 2）— 機能拡張・バグ修正

**25コミット — テンプレート・ナビゲーション・UI細部の整備**

#### 主要機能追加

```
feat(fitness): TANRENアプリ機能拡張（テーマ・画面・ナビゲーション改善）
feat(fitness): HistoryScreen部位別日付グループ化・種目別余白修正
feat(fitness): テンプレート一覧行を種目選択画面と同じスタイルに変更
feat(fitness): メニューカードを2行レイアウトに変更
```

#### バグ修正

```
fix(fitness): テンプレート編集時にIDを保持するよう修正
fix(fitness): WorkoutStackをドロワー再選択時にリセット（完了画面の再表示防止）
fix(fitness): セット行タップ時のデータ消失修正 & 前の種目ボタン追加
fix(fitness): ScreenHeader に onBack コールバックを追加し Drawer 直下の編集→一覧戻りを修正
fix(fitness): OrderConfirmScreen の並び替えをドラッグ→上下ボタンに変更・開始ボタン色修正
fix(fitness): 全データ削除で WorkoutContext の in-memory state をリセット
fix(fitness): セット行タップ時データ消失の根本修正
fix(fitness): バグ修正4件 — セット行初期化・完了ボタン色・履歴重複・空セッション保存防止
fix(fitness): タイムゾーンバグ修正・updateTemplateメソッド追加・クイックスタートデフォルトOFF
```

#### スタイリング

```
style(fitness): iOS HIG準拠でメニューカードの余白・フォント階層を強化
style(fitness): アクセントカラーを全テーマで暗めに調整
style(fitness): theme.ts の未コミット変更を保存（配色最終調整）
```

---

### 3/31（Day 3）— UI/UX改修・テスト基盤構築

**41コミット — iOS HIG準拠リファクタ + 全画面テスト**

#### UI/UX 改修

```
feat(fitness): LineChartコンポーネント追加 + react-native-svg依存追加
feat(fitness): HistoryScreen 棒グラフ→線グラフ置換
feat(fitness): HistoryScreen レイアウト調整
feat(fitness): ActiveWorkoutScreen ヘッダー共通化
feat(fitness): WorkoutScreen ヘッダー統合・比較削除・PR表示・部位削除
feat(fitness): HomeScreen トレーニングメニューを選択日連動に変更
feat(fitness): テーマ背景色の暗色化
fix(fitness): カレンダーを月全体が表示されるよう動的週数計算に修正
fix(fitness): ActiveWorkoutScreen の戻るボタンを行全体タップ化・UI統一
fix(fitness): WorkoutStack遷移改善と未使用スタイル削除
fix(fitness): PR色分け削除 — セット行背景を統一、PRバッジを控えめテキストに変更
fix(fitness): ExerciseDetailView のPR行背景色・prBadge削除
```

#### iOS HIG ナビゲーション設計

```
docs(fitness): iOS HIG ナビゲーション分析レポート追加
docs(fitness): 戻るボタンUI差分と画面遷移問題の調査レポートを追加
docs(fitness): UI/UX改修設計書を追加
```

#### テスト基盤（Jest + React Native Testing Library）

```
test(infra): Jest+RTL テスト基盤を構築
test(screens): 全画面コンポーネントテスト追加
test(navigation): App統合テスト・ナビゲーションテスト追加
test: ActiveWorkoutScreen テスト追加（重量・回数操作・セット完了）
test: ActiveWorkoutScreen 追加テスト（終了アラート・種目切替・入力操作）
test: WorkoutContext currentSession=nullでのaddSetテスト追加
test: MonthlyReportScreen 複数種目ランキングソートテスト追加
test: SettingsScreen デフォルト重量・レップ数Stepperテスト追加
test: Branches向上テスト追加（WorkoutScreen・OrderConfirm・ProgressScreen）
（他多数 — テストコミット合計約30件）
```

---

### 4/1（Day 4）— テーマ・フォント・カスタム種目・iOS審査対応

**65コミット — 機能完成 + アプリ名変更 + 審査提出**

#### アプリ名変更

```
feat(fitness): アプリ名を FORGE に変更・英語対応
feat(fitness): ASC App ID設定・メタデータ一括設定完了
```

#### テーマシステム拡張（30種完成）

```
feat: 高コントラストライトテーマ3種追加＋コントラスト調整スライダー実装
（渋彩テーマ・墨彩テーマは3/31に追加済み）
```

テーマ内訳:
| カテゴリ | 数 | 代表テーマ |
|---------|-----|-----------|
| ライトテーマ | 5 | 白妙・白磁・花曇・青磁・薄藤 |
| モノクロ | 2 | 白鋼・鉄墨 |
| ダークテーマ（既存） | 8 | 鍛錬・玉鋼・朱漆・翠嵐 等 |
| ダークテーマ（追加） | 3 | 桜煙・萌黄・曙光 |
| 墨彩テーマ | 6 | 墨炎・墨青・墨翠・白炎・白青・白翠 |
| 渋彩テーマ | 3 | 灰白・錆色・古灰 |
| 高コントラストライト | 3 | 雪白・月白・白雪 |
| **合計** | **30** | |

#### フォント設定機能

```
feat: フォント設定機能追加（サイズ・太さ・種類）＋OTA診断情報表示
feat: フォント設定機能を全主要画面に展開（サイズ・太さ・フォント種類）
```

#### カスタム種目機能

```
feat: カスタム種目追加機能＋スワイプバック修正
feat: カスタム種目追加・削除機能 + ProgressScreen文字化け修正
fix: カスタム種目をすべての画面で組み込み種目と同等に扱うように修正
fix: カスタム種目をWorkoutContext経由に統一
```

#### iOS審査対応

```
feat(settings): iOS審査対応 - プライバシーポリシー・利用規約画面追加
feat(recall+fitness): ReCallKitカテゴリ対応・EAS設定更新・iOS審査ガイド追加
feat(contact): メール送信型お問い合わせ画面を新規作成
feat(hooks): useUsageStats実装・LAUNCH_DATESストレージキー追加
docs(fitness): iOS審査進捗更新 - fitness-apiデプロイ完了・Bundle ID登録済み
fix: Google Mobile Ads autolinking exclusion to fix FORGE crash
fix: Firebase モジュールも autolinking から除外 (hoisting 対策)
```

#### バグ修正（文字化け対応）

```
fix: PowerShellエンコーディング破損による文字化けを修正
fix: CustomDrawerContentの日連続・設定タグの文字化けも修正
fix: SettingsScreen.tsx 文字化け修正（28箇所の構文エラー解消）
fix: SettingsScreen.tsx 表示文字化け修正（データ/ホーム/クイック等37箇所）
fix: HistoryScreen typography未定義によるクラッシュ修正 + 文字化け修正
```

---

## 重要機能の実装コミット抜粋

### ワークアウト記録フロー（部位→種目→セット）

```
3/29: feat(fitness): TANRENアプリ初期実装
      — 部位選択→種目選択→セット記録の基本フローが初回から実装
3/30: fix(fitness): セット行タップ時データ消失の根本修正
3/30: fix(fitness): バグ修正4件 — セット行初期化・完了ボタン色・履歴重複・空セッション保存防止
4/1:  fix: BottomSheet にKeyboardAvoidingView追加 + keyboardShouldPersistTaps対応
```

### テンプレート機能

```
3/30: fix(fitness): テンプレート編集時にIDを保持するよう修正
3/30: feat(fitness): テンプレート一覧行を種目選択画面と同じスタイルに変更
3/30: fix(fitness): OrderConfirmScreen の並び替えをドラッグ→上下ボタンに変更
```

### テーマシステム（30種和名テーマ）

```
3/30: style(fitness): アクセントカラーを全テーマで暗めに調整
3/31: feat(fitness): テーマ背景色の暗色化
      （渋彩テーマ3種・墨彩テーマ6種 追加）
4/1:  feat: 高コントラストライトテーマ3種追加＋コントラスト調整スライダー実装
```

### フォント設定機能

```
4/1: feat: フォント設定機能追加（サイズ・太さ・種類）＋OTA診断情報表示
4/1: feat: フォント設定機能を全主要画面に展開（サイズ・太さ・フォント種類）
4/1: chore: WorkoutScreenのTYPOGRAPHY→DynamicTypography型インポート整理
```

### コントラスト調整

```
4/1: feat: 高コントラストライトテーマ3種追加＋コントラスト調整スライダー実装
4/1: fix: ContrastSlider PanResponder が ScrollView の縦スクロールを妨げていた問題を修正
```

### カスタム種目

```
4/1: feat: カスタム種目追加機能＋スワイプバック修正
4/1: feat: カスタム種目追加・削除機能 + ProgressScreen文字化け修正
4/1: fix: カスタム種目をすべての画面で組み込み種目と同等に扱うように修正
4/1: fix: カスタム種目をWorkoutContext経由に統一
```

### 履歴・進捗グラフ

```
3/30: feat(fitness): HistoryScreen部位別日付グループ化・種目別余白修正
3/31: feat(fitness): LineChartコンポーネント追加 + react-native-svg依存追加
3/31: feat(fitness): HistoryScreen 棒グラフ→線グラフ置換
3/31: feat(fitness): HistoryScreen レイアウト調整
4/1:  fix(history): 種目別表示を最大重量→総ボリュームに変更
4/1:  fix(history): 部位カード・グラフ背景をcardBackgroundに変更
4/1:  fix(history): 種目詳細グラフ背景白化・PRバッジをMAXセットのみ表示
```

---

## 開発の数値データ（詳細）

```
総コミット数:          152
開発日数:              4日間（2026-03-29〜2026-04-01）
  Day 1（3/29）:        1コミット  — 初期実装
  Day 2（3/30）:       25コミット  — 機能拡張・バグ修正
  Day 3（3/31）:       41コミット  — UI/UX改修・テスト基盤
  Day 4（4/1）:        65コミット  — 機能完成・iOS審査

テーマ数:              30種（全て和名）
画面数:               15画面（src/screens/*.tsx）
  主要画面: HomeScreen / WorkoutScreen / ActiveWorkoutScreen /
           HistoryScreen / ProgressScreen / SettingsScreen /
           TemplateManageScreen / OrderConfirmScreen /
           SessionEditScreen / MonthlyReportScreen /
           DayDetailScreen / RMCalculatorScreen /
           ContactScreen / PrivacyPolicyScreen / TermsOfServiceScreen

ソースコード行数（主要ファイル）:  9,895行
  WorkoutScreen.tsx:    1,845行（最大）
  HistoryScreen.tsx:    1,116行
  ProgressScreen.tsx:     774行
  HomeScreen.tsx:         713行
  SettingsScreen.tsx:     783行
  theme.ts:               837行
  WorkoutContext.tsx:     399行
  ThemeContext.tsx:        219行

ソースコード行数（全.ts/.tsx）:  20,434行
```
