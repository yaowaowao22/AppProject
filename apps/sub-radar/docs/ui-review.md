# SubRadar — UIレビューレポート

作成日: 2026-03-23
対象ファイル:
- `src/screens/DashboardVariantC.tsx`
- `src/screens/AddSubscriptionModal.tsx`
- `src/screens/SettingsScreen.tsx`

ラベル凡例: 【採用推奨】【要議論】【オプション】

---

## 1. デザイン統一性: テーマ戦略の選択

### 現状

| ファイル | スタイリング手法 | 課題 |
|---------|---------------|------|
| `DashboardVariantC.tsx` | `AC.*` ハードコード定数（GitHub-Dark系） | 独立した色世界 |
| `AddSubscriptionModal.tsx` | `useTheme()` → `colors.*` + `<Card>/<Button>/<Badge>` | ライトモード時に白背景で浮く |
| `SettingsScreen.tsx` | `useTheme()` → `colors.*` + `<ListItem>/<Divider>/<Badge>` | primary が緑系 (`#4DB6AC`) で teal (`#26C6DA`) と不一致 |

### トレードオフ分析

#### Option A: Modal/Settings を AC パレットに直接統一 【要議論】

```
DashboardVariantC → AC定数（現状維持）
AddSubscriptionModal → AC定数に移行
SettingsScreen → AC定数に移行
```

**メリット**: 色の一致が完全・即効性がある
**デメリット**:
- `<Card>`, `<Button>`, `<Badge>`, `<ListItem>`, `<Divider>` など @massapp/ui コンポーネントを多用しており、これらすべてのスタイルを手動オーバーライドまたは撤去が必要
- `SettingsScreen` は特に `<Badge variant="success">` / `<ListItem>` など UI コンポーネントへの依存が深く、工数が大きい（推定 2〜3日）
- テーマシステムの恩恵（ライト/ダーク切り替え）を手放すことになる

#### Option B: `theme.ts` の dark palette を AC 値で上書き 【採用推奨】

```tsx
// packages/ui/src/theme.ts（またはsub-radar/src/theme.ts）のdark設定を変更
dark: {
  background:   '#0D1117',   // AC.bgDeep
  surface:      '#161B22',   // AC.bgCard
  primary:      '#26C6DA',   // AC.teal （← ここが重要。現状 #4DB6AC と異なる）
  textPrimary:  '#E6EDF3',   // AC.textBright
  textSecondary:'#8B949E',   // AC.textMid
  border:       '#21262D',   // AC.borderSubtle
}
```

**メリット**:
- `AddSubscriptionModal` と `SettingsScreen` の `colors.*` 参照が自動的に AC 値を返すようになる
- Switch の `trackColor.true = colors.primary` が `#26C6DA` に追従（ギャップ分析 #1 の Switch 色不一致も解決）
- @massapp/ui コンポーネントをそのまま活用できる
- 工数: 小（`theme.ts` 数行変更）

**デメリット**:
- `DashboardVariantC` も `useTheme()` を import しているが AC 定数を直接使っているため、完全な一元管理にはさらに DashboardVariantC 側のリファクタも必要（フェーズ3向け）
- ライトモードでは依然として色差が生じる（ダッシュボードは常にダーク固定、Modal/Settings はライトに切り替わる）

#### Option C: ハイブリッド（暫定妥協案）【オプション】

`DashboardVariantC` に `forceColorScheme="dark"` 相当のラッパーを当てつつ、Modal/Settings はテーマに従う。ユーザーがライトモードを選んだ場合にダッシュボードだけ常にダークになる。

**推奨アクション**: **Option B を先行実施**（小工数）し、フェーズ3で DashboardVariantC も `useTheme()` 参照に移行する。

---

## 2. 前月比バッジ: UIパターン提案

### 現状コード（`DashboardVariantC.tsx:423-426`）

```tsx
<View style={[aStyles.momBadge, aStyles.momBadgeNeutral]}>
  <Ionicons name="remove-outline" size={12} color={AC.textMid} />
  <Text style={[aStyles.momText, { color: AC.textMid }]}>前月比 -</Text>
</View>
```

スタイルは `momBadgeUp`（赤系BG）/ `momBadgeDown`（teal系BG）/ `momBadgeNeutral`（グレー系BG）が定義済み。

### 3状態 UI パターン 【採用推奨】

| 状態 | 条件 | アイコン | テキスト | 色 |
|------|------|---------|---------|-----|
| `up` | 今月 > 先月（支出増） | `trending-up-outline` | `前月比 +X%` | `#F44336`（赤） |
| `down` | 今月 < 先月（支出減） | `trending-down-outline` | `前月比 -X%` | `#26C6DA`（teal） |
| `neutral` | データなし or ±0 | `remove-outline` | `前月比 -` | `#8B949E`（グレー） |

```tsx
// 実装イメージ
function MoMBadge({ current, previous }: { current: number; previous: number | null }) {
  if (previous === null || previous === 0) {
    return (
      <View style={[aStyles.momBadge, aStyles.momBadgeNeutral]}>
        <Ionicons name="remove-outline" size={12} color={AC.textMid} />
        <Text style={[aStyles.momText, { color: AC.textMid }]}>前月比 -</Text>
      </View>
    );
  }
  const diff = ((current - previous) / previous) * 100;
  const isUp = diff > 0;
  const color = isUp ? '#F44336' : AC.downTeal;
  const icon = isUp ? 'trending-up-outline' : 'trending-down-outline';
  const badge = isUp ? aStyles.momBadgeUp : aStyles.momBadgeDown;
  return (
    <View style={[aStyles.momBadge, badge]}>
      <Ionicons name={icon} size={12} color={color} />
      <Text style={[aStyles.momText, { color }]}>
        前月比 {isUp ? '+' : ''}{Math.round(diff)}%
      </Text>
    </View>
  );
}
```

**必要な前提データ**: ギャップ分析 #2 の月次スナップショット保存ロジックの実装が必須。UI 自体は上記パターンで即実装可能。

---

## 3. プレミアムペイウォール: 機能リスト表示

### 現状の課題

- `SettingsScreen.tsx:151-158`: ボタン1つのみで訴求力が弱い
- `App.tsx:47-53`: 無料上限到達時の `Alert.alert` に設定画面への誘導なし（ギャップ分析 #7-3）

### 提案: インライン訴求カード 【採用推奨】

`SettingsScreen` の `planCard` を以下のレイアウトに拡張（`Alert` は廃止）:

```
┌─────────────────────────────────┐
│ ✦ プレミアム  ¥2,400 買い切り    │
│                                  │
│ ✓ サブスク登録 無制限             │
│ ✓ 請求日通知（3日前・前日）       │
│ ✓ 前月比トレンドバッジ            │
│ ✓ 将来機能の優先アクセス          │
│                                  │
│  [ プレミアムにアップグレード ]    │
│  [ 購入を復元 ]                   │
└─────────────────────────────────┘
```

実装ポイント:
- 機能リストは `FeatureRow` コンポーネント（チェックマーク + テキスト）で箇条書き
- 価格は目立つ大きさで表示（`fontSize: 20, fontWeight: '700'`）
- 「買い切り（サブスクではない）」を強調 → 心理的障壁を下げる
- 無料上限到達の `Alert` に「設定でアップグレード →」ボタンを追加

### App.tsx の Alert 改善 【採用推奨】

```tsx
Alert.alert(
  '無料版の上限（3件）に達しました',
  'プレミアムにアップグレードすると無制限に追加できます',
  [
    { text: 'キャンセル', style: 'cancel' },
    { text: 'アップグレードを見る', onPress: () => navigation.navigate('Settings') },
  ],
);
```

---

## 4. グリッドカード詳細タップUX

### 現状の問題（`DashboardVariantC.tsx:384-391`）

```tsx
const handleCardPress = useCallback(
  (sub: Subscription) => {
    updateSubscription(sub.id, { lastTappedAt: new Date().toISOString() });
    setExpandedId((prev) => (prev === sub.id ? null : sub.id)); // ← dead code
    onEditPress(sub); // ← タップ即編集
  },
  [updateSubscription, onEditPress],
);
```

`_expandedId` は宣言されているが展開UIがなく dead code になっている。

### 推奨フロー: Short press → 展開 / 展開後に編集ボタン 【採用推奨】

```
カードタップ
  ↓
カードが展開（高さが伸びる）
  ↓
展開エリアに表示:
  - 次回請求日: 〇月〇日（残X日）
  - メモ: 〜〜〜
  - カテゴリ: エンタメ
  - [編集ボタン]
```

実装方針:
- `_expandedId` を `expandedId` に rename し、`GridCard` の `isExpanded` prop として渡す
- 展開時は `LayoutAnimation.easeInEaseOut()` でスムーズに高さを変化させる
- 展開エリアに「編集」ボタンを配置 → `onEditPress(sub)` を呼ぶ

### 代替案: 詳細BottomSheet → 編集 【オプション】

タップ → `@gorhom/bottom-sheet` でサービス詳細を表示 → BottomSheet内の「編集」ボタン
工数は大きいが、長期的により自然なUX（大きいタッチターゲット、スワイプで閉じられる）。フェーズ3向け。

---

## 5. 通知設定UI: スケジュール済み件数の表示

### 現状（`SettingsScreen.tsx:181-199`）

Switch が2つあるのみ。スケジューリング状態が不明。

### 提案: Switch 下部に件数インジケーター 【採用推奨】

```tsx
{/* 3日前通知 Switch の直下 */}
{notify3days && scheduledCount3day > 0 && (
  <Caption color={colors.textMuted} style={{ marginTop: 4 }}>
    {scheduledCount3day} 件の通知をスケジュール済み
  </Caption>
)}
```

表示場所の選択肢:

| 案 | 場所 | 印象 |
|----|------|------|
| **A（推奨）** | 各Switchの下にCaption | コンパクト・自然 |
| B | セクションヘッダー横にバッジ `[計X件]` | 一覧性あり・やや賑やか |
| C | 通知設定カードの下部にまとめて表示 | 分かりやすいが縦スペース消費 |

**条件**: ギャップ分析 #3（expo-notifications 実装）完了後に追加。それまでは「※通知機能は準備中です」のCaption表示を暫定的に追加するのも選択肢。

### 暫定表示（通知未実装期間中）【オプション】

```tsx
<Caption color={colors.textMuted} style={{ marginTop: 8 }}>
  ※ 通知機能は次のアップデートで有効になります
</Caption>
```

---

## 6. 空状態: 改善案

### 現状（`DashboardVariantC.tsx:492-500`）

```tsx
<View style={aStyles.emptyContainer}>
  <Ionicons name="albums-outline" size={64} color={AC.textDim} />
  <Text ...>サブスクがまだありません</Text>
  <Text ...>右下の ＋ ボタンから追加してください</Text>
</View>
```

課題:
- CTA がテキストのみで操作性なし
- アイコンが抽象的（ユーザーが「何をするアプリか」をすぐ把握できない）
- 「右下の＋ボタン」という間接的な誘導

### 提案: アクション付き空状態 【採用推奨】

```
┌──────────────────────────────┐
│                              │
│    💳  (card-multiple-outline)│  ← size=80, color=AC.teal (薄め)
│                              │
│  サブスクを登録しましょう        │  ← fontSize: 18, bold
│                              │
│  Netflix、Spotify など        │  ← サジェスト的なサブタイトル
│  支払いを一括管理できます       │
│                              │
│  [＋ 最初のサブスクを追加]     │  ← teal ボタン、onPress=onAddPress
│                              │
└──────────────────────────────┘
```

実装ポイント:
- `onAddPress` を `DashboardVariantC` の空状態内ボタンに渡す（Props は既に存在）
- アイコン候補: `card-multiple-outline`（複数カードのイメージ）または `cash-outline`
- ボタンスタイルは FAB と同じ teal 色を使用し、一貫性を持たせる

### 追加提案: ダミーカードでUIを先見せ 【オプション】

登録0件時に半透明の「サンプルカード」（Netflix例）をグレーアウト表示し、「このように表示されます」と示す。視覚的に空間を埋めつつ機能を伝えられる。工数: 中。

---

## 優先度サマリー

| # | 提案 | 推奨度 | 工数 | 依存 |
|---|------|--------|------|------|
| 1-B | theme.ts dark palette を AC 値で更新 | 【採用推奨】 | 小 | なし |
| 2 | 前月比バッジ 3状態コンポーネント化 | 【採用推奨】 | 小 | 月次スナップショット保存（#2） |
| 3-alert | Alert に「設定へ」ボタン追加 | 【採用推奨】 | 小 | なし |
| 3-card | プレミアム訴求カードの機能リスト表示 | 【採用推奨】 | 中 | なし |
| 4-expand | カード展開 → 編集ボタンフロー | 【採用推奨】 | 小〜中 | なし |
| 5-count | 通知件数インジケーター | 【採用推奨】 | 小 | expo-notifications（#3） |
| 5-temp | 未実装中の「準備中」Caption | 【オプション】 | 小 | なし |
| 6-cta | 空状態に onAddPress ボタン追加 | 【採用推奨】 | 小 | なし |
| 1-A | Modal/Settings 全体を AC 定数に置き換え | 【要議論】 | 大 | なし |
| 4-sheet | BottomSheet 詳細フロー | 【オプション】 | 大 | なし |
| 6-dummy | ダミーカードによる先見せ | 【オプション】 | 中 | なし |
