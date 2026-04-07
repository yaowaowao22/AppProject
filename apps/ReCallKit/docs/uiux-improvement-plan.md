# ReCallKit — UI/UX 改善計画

> 作成日: 2026-04-06  
> 対象フロー: URL取り込み → フラッシュカード生成 → 学習セッション  
> 優先軸: **「フラッシュカードで勉強する体験」の摩擦ゼロ化**

---

## 0. 改善の背景・課題認識

現在のコアバリューチェーンは以下の3ステップ。それぞれに摩擦があり、特に **Step 3（学習）** の完成度が最も惜しい状態。

```
[Step 1] URL入力 → URLAnalysisScreen → URLImportListScreen
[Step 2] Q&A確認・保存 → QAPreviewScreen
[Step 3] 学習セッション → ReviewSelectScreen → ReviewScreen
```

### 現状の主な課題

| # | 課題 | 影響ステップ | 深刻度 |
|---|------|------------|--------|
| A | URLをアプリを開いて手動で貼る必要がある | Step 1 | 高 |
| B | 解析中のUI（2秒ポーリング）がほぼ空白 | Step 1 | 中 |
| C | QAPreviewがリスト形式で「カードとして」実感できない | Step 2 | 中 |
| D | フリップ後の評価がボタン4つで指が動かない | Step 3 | 高 |
| E | 評価後の視覚フィードバックがゼロ | Step 3 | 高 |
| F | セッション完了感・成長実感が弱い | Step 3 | 中 |
| G | ホームの「今日やること」導線が弱い | 全体 | 中 |

---

## 1. Step 3 改善：学習セッション体験

> **最優先。他のどのステップより改善ROIが高い。**

### 1-A. スワイプジェスチャーで評価（最大インパクト）

**現状**  
カードをフリップ → 画面下部の4ボタン（もう一度/難しかった/良かった/簡単）をタップ

**改善**  
フリップ後、カードをスワイプして評価する。

```
← 左スワイプ   = "もう一度"（赤）     quality: 0
→ 右スワイプ   = "簡単"（緑）         quality: 5
↑ 上スワイプ   = "良かった"（青）      quality: 4
↓ 下スワイプ   = "難しかった"（橙）    quality: 1
```

- ボタンUIは残す（スワイプ方向のヒントとして機能させる）
- スワイプ開始時にカードがその方向に傾く（リアルタイムフィードバック）
- スワイプ途中で放すとキャンセル（戻る）
- `react-native-gesture-handler` の `Pan Gesture` で実装（既存依存に含まれる想定）

**実装対象ファイル**
- `src/components/ReviewCard.tsx` — Pan Gesture 追加・傾きアニメーション
- `src/screens/review/ReviewScreen.tsx` — スワイプ完了時の評価ハンドラ接続

---

### 1-B. 評価時の視覚・触覚フィードバック

**現状**  
評価ボタンを押すと無言で次のカードへ遷移

**改善**  
評価の結果をカードが「物理的に反応」して伝える。

| 評価 | カードの動き | 背景フラッシュ | ハプティクス |
|------|------------|-------------|------------|
| もう一度 | 左へ飛んで消える | 赤フラッシュ（300ms） | `impactAsync(Heavy)` |
| 難しかった | 下へ落ちて消える | 橙フラッシュ | `impactAsync(Medium)` |
| 良かった | 上へ浮いて消える | 青フラッシュ | `impactAsync(Light)` |
| 簡単 | 右へ飛んで消える | 緑フラッシュ（300ms） | `notificationAsync(Success)` |

- `react-native-reanimated` の `withSpring` + `withTiming` で実装（既使用）
- `expo-haptics` で触覚フィードバック（既使用）
- 背景フラッシュは `Animated.View` でオーバーレイ `opacity: 0 → 0.15 → 0`

**実装対象ファイル**
- `src/components/ReviewCard.tsx` — exit アニメーション追加
- `src/screens/review/ReviewScreen.tsx` — フラッシュオーバーレイ追加

---

### 1-C. セッション内プログレスの強化

**現状**  
`ReviewProgressBar` に「3 / 10」というテキストのみ

**改善**  
上部に横バー（幅が右から左へアニメーションで縮む）＋残り枚数。

```
[██████████░░░░░░░░░░] 5 / 10 cards
```

- バーの色は `colors.accent`（テーマ追従）
- カード遷移のたびに `withSpring` でバーが縮む
- セッション残り枚数が3以下になったらバーを `colors.success` に変色（終わりが見える）

**実装対象ファイル**
- `src/components/ReviewProgressBar.tsx` — 横バー追加

---

### 1-D. セッション完了サマリーの強化

**現状**  
完了画面は絵文字 + カード枚数のみ

**改善**  
今日のセッション結果を一覧表示。

```
今日の復習 完了！ 🎉

┌─────────────────────────────┐
│  簡単    ████████  6枚       │
│  良かった ████     4枚       │
│  難しかった ██     2枚       │
│  もう一度  █       1枚       │
└─────────────────────────────┘

次回の復習: 明日 8枚

🔥 7日連続学習中！

         [ 閉じる ]
```

- 評価内訳をセッション中に集計（`ReviewScreen` の state に追加）
- 次回復習予定件数は `getDueItems` を翌日日付で呼ぶ（or 既存DBから算出）
- StreakRing コンポーネントを完了画面でも表示

**実装対象ファイル**
- `src/screens/review/ReviewScreen.tsx` — 評価集計 + 完了画面再設計
- `src/components/ReviewProgressBar.tsx` — 完了サマリー用サブコンポーネント切り出し

---

### 1-E. カード内「フラグ」機能

**現状**  
学習中に「このカードの内容が間違っている」「後で編集したい」と思っても手段がない

**改善**  
カード右上に🚩ボタン。タップでフラグ付き → Library画面でフラグ済みカードをフィルタ可能。

- DBの `items` テーブルに `flagged INTEGER DEFAULT 0` カラム追加（migration）
- ReviewScreen のカード上部に小さなフラグアイコン（24px、タップエリア 44px）
- LibraryScreen にフラグフィルタChip追加

**実装対象ファイル**
- `src/db/schema.ts` — migration v6 追加
- `src/components/ReviewCard.tsx` — フラグボタン追加
- `src/screens/library/LibraryScreen.tsx` — フィルタChip追加

---

## 2. Step 1 改善：URL取り込みの摩擦削減

### 2-A. iOS Share Extension（最大インパクト・工数大）

**現状**  
SafariでURLをコピー → ReCallKitを開く → URLAnalysisScreenに貼る（3ステップ）

**改善**  
SafariのShareボタン → ReCallKitを選択 → 即バックグラウンド登録（0タップ）

```
[Safari] Share → [ReCallKit] → "URLを登録しました" トースト表示
                              → バックグラウンドでBedrockが解析開始
                              → 完了通知 → タップでQAPreviewへ
```

- `targets/` ディレクトリに Share Extension ターゲット追加
- App Groups でSQLiteを共有（`group.com.yourapp.recallkit`）
- ⚠️ **EAS Build必須**。Expo Go では動作しない
- ⚠️ App Groups の設定は `app.json` の `ios.entitlements` に追加が必要

**実装対象ファイル**
- `targets/share-extension/` — 新規作成
- `app.json` — entitlements 追加
- `src/services/urlAnalysisPipeline.ts` — バックグラウンド起動対応

---

### 2-B. 解析中画面のエンゲージメント強化

**現状**  
URLImportListScreen: 2秒ポーリング中はほぼ空白のリスト

**改善**  
解析中にプレースホルダーカードをアニメーションで表示。

```
🔍 URLを解析中...

┌─────────────────────┐
│ ████████████        │  ← shimmer loading
│ ██████              │
│                     │
│ ██████████████████  │
└─────────────────────┘
```

- Shimmer アニメーション（`react-native-reanimated` でグラデーションを左→右へ繰り返し）
- 「AIがQ&Aを生成しています」「通常10〜30秒かかります」の説明文
- ポーリング間隔は 2秒 → 3秒に延ばしてDB負荷を下げる

**実装対象ファイル**
- `src/screens/add/URLImportListScreen.tsx` — Shimmer UI 追加
- 新規コンポーネント `src/components/ShimmerCard.tsx`

---

## 3. Step 2 改善：QAプレビューの体験向上

### 3-A. カードUIでプレビュー（保存前に実物確認）

**現状**  
QAPreviewScreen: Q&Aをリスト形式で並べて表示

**改善**  
スワイプ可能なカードスタック形式でプレビュー。保存するカードだけを右スワイプで選択。

```
[← 除外]  [カード 3/8]  [保存 →]

┌──────────────────────────────┐
│                              │
│   Reactのuseeffectの         │
│   第2引数の役割は？           │
│                              │
│        タップしてめくる        │
└──────────────────────────────┘

      ■ ■ ■ □ □ □ □ □
```

- 既存の `ReviewCard` コンポーネントを再利用
- 左スワイプ = このカードを除外、右スワイプ = 保存リストに追加
- 全カード確認後に「選択した7枚を保存」ボタン

**実装対象ファイル**
- `src/screens/add/QAPreviewScreen.tsx` — レイアウト全面変更（既存リストUIはオプション切り替えで残す）

---

### 3-B. Q&A編集のインライン強化

**現状**  
QAPreviewScreen でQ&Aをインライン編集できるが、UIが小さくタップしにくい

**改善**  
- 編集タップ時にキーボード上部に確定ボタン（Done ツールバー）を固定表示
- `KeyboardAvoidingView` でカードが隠れないよう調整
- 文字数カウンター表示（Q: 〜120字、A: 〜300字）

**実装対象ファイル**
- `src/screens/add/QAPreviewScreen.tsx` — TextInput + KeyboardToolbar 改善

---

## 4. 全体導線の改善

### 4-A. ホーム画面「今日やること」CTA強化

**現状**  
StreakRing + 件数テキスト + 小さな「復習する」ボタン

**改善**  
```
┌──────────────────────────────────┐
│  🔥 7日連続                        │
│                                    │
│     今日の復習                      │
│     ┌────────────────┐             │
│     │   12枚 期限切れ  │← 大きく強調  │
│     │   + 3枚 新規     │            │
│     └────────────────┘             │
│                                    │
│     [  今すぐ始める  ]← Primary CTA  │
└──────────────────────────────────┘
```

- `getDueItems` の件数を HomeScreen の最上部に大きく表示
- 件数が0のときは「今日の復習はすべて完了！」に切り替え（✅ アイコン付き）

**実装対象ファイル**
- `src/screens/home/HomeScreen.tsx` — デュー件数セクション再設計

---

### 4-B. 復習開始ショートカット（通知連携）

**現状**  
通知実装なし（SettingsScreenに`review_time`設定はあるが実際の通知は未送信）

**改善**  
- `expo-notifications` で設定した時刻に「今日X枚の復習があります」ローカル通知
- 通知タップ → 直接 ReviewScreen へディープリンク

**実装対象ファイル**
- 新規 `src/services/notificationService.ts`
- `src/screens/settings/SettingsScreen.tsx` — 通知許可リクエスト + スケジュール設定UI

---

## 5. 実装ロードマップ

### Phase 1: 学習体験コア（2〜3日）

| タスク | ファイル | 工数感 |
|--------|---------|--------|
| スワイプジェスチャー評価 | ReviewCard.tsx, ReviewScreen.tsx | 大 |
| 評価アニメーション + フラッシュ | ReviewCard.tsx, ReviewScreen.tsx | 中 |
| プログレスバー横バー化 | ReviewProgressBar.tsx | 小 |
| セッション完了サマリー | ReviewScreen.tsx | 中 |

### Phase 2: 取り込み体験（1〜2日）

| タスク | ファイル | 工数感 |
|--------|---------|--------|
| Shimmer ローディングUI | URLImportListScreen.tsx, ShimmerCard.tsx | 小 |
| QAPreview カードスタック化 | QAPreviewScreen.tsx | 大 |
| Q&A編集UI改善 | QAPreviewScreen.tsx | 小 |

### Phase 3: 導線・通知（1日）

| タスク | ファイル | 工数感 |
|--------|---------|--------|
| ホームCTA強化 | HomeScreen.tsx | 小 |
| ローカル通知 | notificationService.ts, SettingsScreen.tsx | 中 |
| カードフラグ機能 | schema.ts, ReviewCard.tsx, LibraryScreen.tsx | 中 |

### Phase 4: Share Extension（別スプリント）

| タスク | 工数感 | 備考 |
|--------|--------|------|
| Share Extension ターゲット作成 | 大 | EAS Build環境が前提 |
| App Groups 設定 | 中 | プロビジョニング更新必要 |
| バックグラウンド解析 + 完了通知 | 大 | |

---

## 6. 技術的注意事項

### ⚠️ スワイプジェスチャーの排他制御
`ReviewCard` の Pan Gesture と `ScrollView` や `FlatList` のスクロールが競合する可能性がある。
`activeOffsetX` / `activeOffsetY` で方向を明示的に分離すること。

```typescript
gesture.activeOffsetX([-10, 10])  // 水平10px以上でジェスチャー開始
gesture.failOffsetY([-5, 5])       // 縦5px以上で失敗(= Scrollに渡す)
```

### ⚠️ ReviewScreen の currentItem undefined クラッシュ（既存バグ CP-01）
スワイプ評価を実装する前に、`currentIndex >= items.length` ガードを確実に入れること。
スワイプの連打でインデックスが溢れる可能性があり、スワイプ導入でこのバグの発火確率が上がる。

```typescript
// ReviewScreen.tsx 評価ハンドラ内
if (currentIndex >= items.length) return;  // ガード必須
```

### ⚠️ QAPreview カードスタック化の際のリスト表示互換
既存の `QAPreviewScreen` のリスト表示ロジックを削除せず、
`viewMode: 'card' | 'list'` で切り替え可能にすること（回帰リスク回避）。

### ⚠️ Share Extension は Expo Go 非対応
Phase 4 は EAS Build + 実機テストのみで検証可能。
シミュレータでは Share Extension の動作確認不可。

---

## 7. 成功指標（定量）

| 指標 | 現状（推定） | 目標 | 計測方法 |
|------|-----------|------|---------|
| 1セッション完了率 | 不明 | 80%以上 | ReviewScreen 完了画面到達 / 開始回数 |
| 1カードあたり評価時間 | 不明 | 2秒以下 | タイムスタンプ差分ログ |
| URL取り込み → 初回復習までの時間 | 不明 | 5分以内 | URLAnalysis開始 → Review開始 |
| 7日継続率 | 不明 | 40%以上 | StreakRing 7+ ユーザー比率 |

---

*最終更新: 2026-04-06*
