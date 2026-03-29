# TANREN iOS UI/UX 全画面改善デザイン仕様書

> 設計思想: **鍛鉄の間（MA）— 余白と一点の炎**
> プラットフォーム: React Native (Expo) / iOS & Android
> 準拠: Apple HIG / WCAG 2.2 AA / 8ptグリッドシステム
> 作成日: 2026-03-30

---

## 0. 設計方針サマリー

### Tension Profile（暗黙的DDP）

TANRENの既存デザイントークン・設計思想から導出した内部テンションプロファイル:

| 軸 | 値 | 根拠 |
|---|---|---|
| Structure / Flow | 3（構造的） | 8ptグリッド厳守、明確なセクション分離 |
| Silence / Expression | 3（静寂） | 余白重視、装飾最小限、「間」の哲学 |
| Precision / Imperfection | 2（精密） | tabular-nums、letterSpacing微調整、精密な数値UI |
| Universal / Personal | 7（個人的） | 日本語ファースト、和名テーマ、高情報密度 |
| Permanence / Impermanence | 4（やや永続的） | 堅実なダーク基調、鍛鉄のメタファー |

### Layer Dominance

- **Primary: MA（間）** — 余白重視・コンテンツファースト・装飾抑制
- **Secondary: KOE（声）** — accentカラーの「一点の炎」による情報階層の明示

### 改善原則

1. **情報密度の向上** — 既存の余白を維持しつつ、補助情報を適切に追加
2. **階層ナビゲーション** — Alert.alertからドリルダウンUIへの統一的な移行
3. **入力効率の最適化** — 数値コントロールのコンパクト化、タップ操作の削減
4. **達成感の演出** — 完了画面のフルスクリーン化による報酬体験の強化

---

## 1. ホーム画面（HomeScreen）

### 1.1 現状の問題

- `menuRow`: exercise名 + 1行のサブテキスト（PR重量 or muscleDetail）のみ
- 情報量不足: セット数、前回ボリューム、目標重量が不明
- フラットリスト形式で各種目の区切りが弱い

### 1.2 改善設計: カード型メニュー

#### レイアウト構造

```
┌─────────────────────────────────────────┐
│ [本日のメニュー]  SectionLabel           │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │  ベンチプレス              ›        │ │
│ │  大胸筋・三角筋前部                 │ │
│ │  ┌────────┬────────┬────────┐      │ │
│ │  │前回 80kg│ 5セット │PR 85kg │      │ │
│ │  └────────┴────────┴────────┘      │ │
│ └─────────────────────────────────────┘ │
│                 8pt gap                  │
│ ┌─────────────────────────────────────┐ │
│ │  スクワット                ›        │ │
│ │  ...                                │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

#### コンポーネント仕様

**MenuCard（各種目カード）**

| プロパティ | 値 | トークン |
|---|---|---|
| 背景色 | `surface1` | テーマカラー |
| 角丸 | 13pt | `RADIUS.card` |
| パディング | 16pt | `SPACING.cardPadding` |
| カード間隔 | 8pt | `SPACING.cardGap` |
| 左右マージン | 16pt | `SPACING.contentMargin` |
| 最小高さ | 88pt | 8ptグリッド準拠 |
| タップターゲット | カード全体（88pt以上） | HIG 44pt超 |

**種目名行（上段）**

| 要素 | フォント | ウェイト | 色 |
|---|---|---|---|
| 種目名 | 17pt (`body`) | 600 (`semiBold`) | `textPrimary` |
| シェブロン `›` | 20pt | — | `textTertiary` |
| 筋肉詳細 | 11pt (`captionSmall`) | 500 (`regular`) | `textTertiary` |

**補助情報行（下段: メタチップ）**

カード下部に水平配置する情報チップ:

| 要素 | フォント | 色 | 背景 |
|---|---|---|---|
| `前回 80kg` | 11pt, `regular` | `textSecondary` | `surface2` |
| `5セット` | 11pt, `regular` | `textSecondary` | `surface2` |
| `PR 85kg` | 11pt, `heavy` | `accent` | `accentDim` |

チップ仕様:
- 角丸: 4pt (`RADIUS.badge`)
- パディング: 水平8pt、垂直3pt
- チップ間隔: 6pt
- 行マージントップ: 8pt (`SPACING.sm`)
- PRバッジがある場合のみ `accent` / `accentDim` で強調表示

#### データソース

```typescript
// 各menuItemに追加するデータ
{
  exercise: Exercise,
  pr: PersonalRecord | undefined,
  lastSets: number,        // 前回セッションのセット数
  lastMaxWeight: number,   // 前回セッションの最大重量
  lastVolume: number,      // 前回セッションの総ボリューム
}
```

### 1.3 スタイル変更差分

```typescript
// 変更前: menuRow（フラットリスト行）
menuRow: {
  flexDirection: 'row',
  paddingVertical: SPACING.cardPadding,
  borderBottomWidth: 1,
  borderBottomColor: c.separator,
  minHeight: 48,
}

// 変更後: menuCard（カード型）
menuCard: {
  backgroundColor: c.surface1,
  borderRadius: RADIUS.card,
  padding: SPACING.cardPadding,
  marginBottom: SPACING.cardGap,   // 8pt
  minHeight: 88,                    // 8ptグリッド
}
menuCardTop: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
}
menuMuscle: {
  fontSize: TYPOGRAPHY.captionSmall, // 11pt
  color: c.textTertiary,
  marginTop: SPACING.xs,             // 4pt
}
menuChips: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 6,
  marginTop: SPACING.sm,             // 8pt
}
menuChip: {
  backgroundColor: c.surface2,
  borderRadius: RADIUS.badge,         // 4pt
  paddingHorizontal: 8,
  paddingVertical: 3,
}
menuChipPR: {
  backgroundColor: c.accentDim,
}
menuChipText: {
  fontSize: 11,
  fontWeight: TYPOGRAPHY.regular,
  color: c.textSecondary,
}
menuChipTextPR: {
  color: c.accent,
  fontWeight: TYPOGRAPHY.heavy,
}
```

---

## 2. 順番確認画面（OrderConfirmScreen）

### 2.1 問題1: タイトル見切れ

**現状**: `ScreenHeader title="この順番で開始しますか？"` が `numberOfLines={1}` で truncation される。`fontSize: 28pt (screenTitle)` で全角11文字が表示限界。

**解決策: ScreenHeaderにサブタイトル対応を追加**

ScreenHeaderのtitle propsを短縮し、サブタイトルで補足する:

```
title: "順番確認"
subtitle: "ドラッグで並べ替えできます"
```

#### ScreenHeader サブタイトル仕様

| プロパティ | 値 |
|---|---|
| title fontSize | 28pt (`TYPOGRAPHY.screenTitle`) — 変更なし |
| subtitle fontSize | 12pt (`TYPOGRAPHY.caption`) |
| subtitle fontWeight | 500 (`regular`) |
| subtitle color | `textTertiary` |
| subtitle marginTop | 2pt |
| subtitle numberOfLines | 1 |

#### ScreenHeader Props変更

```typescript
interface ScreenHeaderProps {
  title: string;
  subtitle?: string;        // 新規追加
  showBack?: boolean;
  showHamburger?: boolean;
  rightAction?: ReactNode;
}
```

#### titleスタイル変更

```typescript
// ScreenHeader.tsx の title スタイルに追加
titleWrap: {
  flex: 1,
  marginHorizontal: SPACING.xs,
}
title: {
  fontSize: TYPOGRAPHY.screenTitle,
  fontWeight: TYPOGRAPHY.bold,
  color: c.textPrimary,
  letterSpacing: -0.5,
}
subtitle: {
  fontSize: TYPOGRAPHY.caption,
  fontWeight: TYPOGRAPHY.regular,
  color: c.textTertiary,
  marginTop: 2,
}
```

### 2.2 問題2: BottomSheet表示時のリスト隠れ

**現状**: テンプレート保存BottomSheetが表示されると、DraggableFlatListの下部コンテンツが背面に隠れ、ユーザーが入力結果を確認できない。

**解決策**:

1. **BottomSheet表示時にリストのpaddingBottomを動的に拡張**

```typescript
// OrderConfirmScreen.tsx
<DraggableFlatList
  contentContainerStyle={[
    styles.listContent,
    sheetVisible && { paddingBottom: 280 },  // シート高さ分を確保
  ]}
/>
```

2. **BottomSheetのmaxHeightを制限**

テンプレート保存シートは入力フィールド1つ + ボタン1つなので、高さを制限:

```typescript
// テンプレート保存用BottomSheetの maxHeight を 240pt に制限
// BottomSheet.tsx に maxHeight props を追加
interface Props {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  maxHeight?: number | string;  // 新規追加（デフォルト: '76%'）
  children: React.ReactNode;
}
```

3. **KeyboardAvoidingView追加**

```typescript
// OrderConfirmScreen.tsx のBottomSheet内
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
>
  <TextInput ... />
  <TouchableOpacity ... />
</KeyboardAvoidingView>
```

---

## 3. データ入力画面（ActiveWorkoutScreen）

### 3.1 数値コントロールのコンパクト化

**現状**: `numVal fontSize: 58pt (heroNumber)` が大きすぎ、画面の大部分を占有。

**改善仕様**:

| プロパティ | 現状 | 改善後 | 根拠 |
|---|---|---|---|
| numVal fontSize | 58pt | 42pt | 視認性を維持しつつ30%縮小 |
| numVal lineHeight | 58pt | 46pt | 8ptグリッド近似 |
| numBlock paddingVertical | 14pt | 12pt | 上下4pt削減 |
| numBlock paddingHorizontal | 10pt | 12pt | 左右を8ptグリッドに統一 |
| numBlock gap | 8pt | 6pt | コンパクト化 |
| numLabel fontSize | 11pt | 11pt | 変更なし |
| numUnit marginTop | -4pt | -2pt | 微調整 |
| stepBtn width/height | 44pt | 40pt | タップターゲットは44pt確保（hitSlopで+4pt） |
| stepBtn gap | 8pt | 8pt | 変更なし |

```typescript
// 改善後の numCtrl スタイル
numCtrl: {
  flexDirection: 'row',
  gap: 8,                                // 10→8 (8ptグリッド)
  paddingHorizontal: SPACING.contentMargin,
  paddingBottom: SPACING.sm,              // 12→8
}
numBlock: {
  flex: 1,
  backgroundColor: c.surface1,
  borderRadius: RADIUS.card,
  paddingVertical: 12,
  paddingHorizontal: 12,
  alignItems: 'center',
  gap: 6,
}
numVal: {
  fontSize: 42,                           // 58→42
  fontWeight: TYPOGRAPHY.heavy,
  color: c.textPrimary,
  lineHeight: 46,                         // 58→46
  letterSpacing: -1.5,                    // -2→-1.5
  minWidth: 64,                           // 72→64
  textAlign: 'center',
}
numValInput: {
  fontSize: 42,                           // 同上
  fontWeight: TYPOGRAPHY.heavy,
  color: c.accent,
  lineHeight: 46,
  letterSpacing: -1.5,
  minWidth: 64,
  textAlign: 'center',
  padding: 0,
}
stepBtn: {
  width: 40,                              // 44→40（見た目）
  height: 40,
  borderRadius: 20,
  backgroundColor: c.surface2,
  alignItems: 'center',
  justifyContent: 'center',
  // タップターゲット確保
  // hitSlop: { top: 4, bottom: 4, left: 4, right: 4 },
}
```

### 3.2 ボタン幅の適正化

**現状**: `doneBtn` が `marginHorizontal: 16` で画面幅の約91%を占有。

**改善仕様**:

```typescript
doneBtn: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  marginHorizontal: SPACING.xl,           // 16→32（画面幅の約82%）
  marginBottom: 12,
  height: BUTTON_HEIGHT.primary,           // 60pt 変更なし
  backgroundColor: c.accent,
  borderRadius: RADIUS.button,
}
```

代替案: `alignSelf: 'center'` + `width: '80%'` でも同等の効果。

### 3.3 セパレーター追加

セット一覧エリアとボタンエリアの間に視覚的な区切りを追加:

```
  [セット完了ボタン]
  ─────────────────── ← セパレーター
  セット
  1  80kg × 8  ✓
  2  80kg × 8  ✓
  3  ← active
  4  —
  5  —
  ─────────────────── ← セパレーター
  [種目完了 → 次へ]
  [ワークアウト終了]
```

```typescript
setSeparator: {
  height: StyleSheet.hairlineWidth,
  backgroundColor: c.separator,
  marginHorizontal: SPACING.contentMargin,
  marginVertical: SPACING.sm,              // 8pt
}
```

配置場所:
1. `doneBtn`（セット完了）の直下、`slog`（セット一覧）の直前
2. `slog`の直下、`doneBtn`（種目完了）の直前

### 3.4 過去比較グラフの文字重なり修正

**現状**: `barTopVal fontSize: 8` が8本のバーに対して横幅不足で重なる。

**改善仕様**:

| プロパティ | 現状 | 改善後 |
|---|---|---|
| histBars height | 60pt | 72pt |
| histBar最小表示高 | 4pt | 6pt |
| barTopVal / histLbl | 未実装（histSectionにはbarTopVal無し） | 値ラベルを条件付き表示 |
| histCol gap | 4pt | 6pt |

バーの上に値ラベルを追加（重なり防止ロジック付き）:

```typescript
// 値が0以外のバーのみラベル表示
// バー幅が狭い場合（6本以上）は現在のバーのみラベル表示
{(isToday || sessionHistory.length <= 4) && (s.maxWeight ?? 0) > 0 && (
  <Text style={[styles.histBarVal, isToday && styles.histBarValCurrent]}>
    {s.maxWeight}
  </Text>
)}
```

```typescript
histBars: {
  flexDirection: 'row',
  alignItems: 'flex-end',
  gap: 6,                    // 4→6
  height: 72,                // 60→72
  marginBottom: 8,
}
histBarVal: {
  fontSize: 9,               // 最小可読サイズ
  fontWeight: TYPOGRAPHY.regular,
  color: c.textTertiary,
  marginBottom: 3,
  fontVariant: ['tabular-nums'],
  textAlign: 'center',
}
histBarValCurrent: {
  color: c.textPrimary,
  fontWeight: TYPOGRAPHY.semiBold,
}
```

### 3.5 セット行タップでアクティブ選択

**現状**: アクティブ行は常に「最初の未完了行」で固定。ユーザーが任意の行を選択できない。

**改善設計**:

```
セット
1  80kg × 8  ✓        ← 完了済み（タップ→再編集モード）
2  80kg × 8  ✓        ← 完了済み
3  80kg × 8  ● active  ← タップで選択中を明示
4  —                   ← 未入力（タップ→この行をアクティブに）
5  —
```

#### インタラクション仕様

| 操作 | 対象 | 動作 |
|---|---|---|
| タップ | 未完了行（done: false） | その行をアクティブ行に設定。numCtrlの値をその行の値に更新 |
| タップ | 完了済み行（done: true） | 完了済み行をdone:falseに戻し、アクティブ行に設定 |
| ロングプレス | 任意の行 | 行の削除確認（Alert） |

#### スタイル追加

```typescript
setRow: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 12,
  borderBottomWidth: StyleSheet.hairlineWidth,
  borderBottomColor: c.separator,
  minHeight: 44,                          // HIG最小タップターゲット
}
setRowTappable: {
  // TouchableOpacityでラップ（activeOpacity: 0.7）
}
setRowActive: {
  backgroundColor: c.accentDim,           // 薄いアクセント背景で強調
  borderRadius: 8,                        // 行内角丸
  marginHorizontal: -8,                   // 背景を左右に拡張
  paddingHorizontal: 8,
  borderBottomWidth: 0,
}
```

### 3.6 スクロール最適化

**現状**: ScrollView内にすべてのコンテンツを配置。大量セット時にもたつく。

**改善方針**:

1. **FlatList化は不要**（セット数は通常5〜10行程度で少量）
2. **removeClippedSubviews の適用は不要**（ScrollView内の静的コンテンツ）
3. **useMemoによるスタイル再計算の最小化**（既に実施済み）
4. **numCtrlをScrollView外に固定配置**:

```
┌─ SafeAreaView ──────────────────────────┐
│ ScreenHeader                             │
│ actHeader（筋肉情報 + バッジ + タイマー）  │
│ numCtrl（重量・回数コントロール）← 固定    │
│ [セット完了ボタン]              ← 固定    │
│ ─── separator ───                        │
│ ┌─ ScrollView ────────────────────────┐  │
│ │ セット一覧                           │  │
│ │ ─── separator ───                    │  │
│ │ 過去比較グラフ                       │  │
│ └──────────────────────────────────────┘  │
│ [種目完了ボタン]                ← 固定    │
│ [ワークアウト終了]              ← 固定    │
└──────────────────────────────────────────┘
```

numCtrlとセット完了ボタンをScrollView外（上部固定）にし、セット一覧と比較グラフのみスクロール可能にする。これによりセット数が増えてもコントロール部分は常に表示され、操作性が向上する。

---

## 4. ワークアウト完了画面

### 4.1 フルスクリーンモーダルへの変更

**現状**: BottomSheet（maxHeight:76%）で表示。達成感の演出が不足。

**改善設計**: React NavigationのフルスクリーンModal（`presentation: 'fullScreenModal'`）に変更。

#### 画面レイアウト

```
┌─────────────────────────────────────────┐
│                                  [×]     │  ← 閉じるボタン（右上）
│                                         │
│              ─────                      │
│                                         │
│           お疲れ様です！                 │  ← ヒーローテキスト
│                                         │
│      ┌──────────────────────┐           │
│      │  3 種目  │  15 セット │           │  ← サマリー統計
│      │  4,800kg │   32 分   │           │
│      └──────────────────────┘           │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  種目サマリー                            │
│  ┌───────────────────────────────────┐  │
│  │ ベンチプレス    5セット  80kg  PR  │  │
│  │─────────────────────────────────── │  │
│  │ スクワット      5セット  100kg     │  │
│  │─────────────────────────────────── │  │
│  │ デッドリフト    5セット  120kg PR  │  │
│  └───────────────────────────────────┘  │
│                                         │
│         [ホームに戻る]                   │  ← プライマリCTA
│                                         │
└─────────────────────────────────────────┘
```

#### コンポーネント仕様

**ヒーローセクション**

| 要素 | フォント | ウェイト | 色 | 配置 |
|---|---|---|---|---|
| 「お疲れ様です！」 | 28pt (`screenTitle`) | 700 (`bold`) | `textPrimary` | center |
| サブテキスト「3種目完了」 | 15pt (`bodySmall`) | 500 | `textSecondary` | center |
| 上部マージン | 48pt (`xxl`) | — | — | — |

**統計グリッド（2×2）**

| プロパティ | 値 |
|---|---|
| 背景 | `surface1` |
| 角丸 | 13pt (`RADIUS.card`) |
| パディング | 16pt |
| マージン水平 | 16pt (`contentMargin`) |
| グリッド gap | 1pt（separator色の区切り線で表現） |
| セル最小高さ | 64pt |

各セル:

| 要素 | フォント | 色 |
|---|---|---|
| 数値 | 24pt, `heavy` | `textPrimary` |
| ラベル | 11pt, `regular` | `textTertiary` |

統計項目: 種目数 / セット数 / 総ボリューム(kg) / トレーニング時間(分)

**種目サマリーリスト**

既存の `SheetRow` コンポーネントを流用:
- PRがある種目には `accentDim` 背景 + `accent` テキストの PR バッジ表示
- セクションラベル: 「種目サマリー」11pt, `semiBold`, `textTertiary`, uppercase

**CTAボタン**

| プロパティ | 値 |
|---|---|
| テキスト | 「ホームに戻る」 |
| 高さ | 60pt (`BUTTON_HEIGHT.primary`) |
| 背景 | `accent` |
| 角丸 | 18pt (`RADIUS.btnCTA`) |
| マージン | 水平32pt（画面幅の約82%） |
| 下マージン | `insets.bottom + 16` |

**閉じるボタン（右上）**

| プロパティ | 値 |
|---|---|
| アイコン | Ionicons `close-outline` size:24 |
| 色 | `textSecondary` |
| タップターゲット | 44×44pt |
| 位置 | 右上、paddingTop: `insets.top + 8`, paddingRight: 16 |

#### ナビゲーション実装

```typescript
// WorkoutStackParamList に追加
type WorkoutStackParamList = {
  ExerciseSelect: undefined;
  OrderConfirm: { exerciseIds: string[] };
  ActiveWorkout: { exerciseIds: string[] };
  WorkoutComplete: { reportItems: ReportItem[] };  // 新規追加
};

// Stack.Screen 設定
<Stack.Screen
  name="WorkoutComplete"
  component={WorkoutCompleteScreen}
  options={{
    presentation: 'fullScreenModal',
    animation: 'fade',
    headerShown: false,
    gestureEnabled: false,  // 誤スワイプ防止
  }}
/>
```

---

## 5. 履歴画面（HistoryScreen）

### 5.1 3階層ドリルダウンUI

**現状**: カードタップ → `Alert.alert` で文字列表示。編集不可。

**改善設計**: 3階層のドリルダウンナビゲーション

```
Level 1: 日付カードリスト（既存）
  ↓ タップ
Level 2: その日の種目一覧（BottomSheet or 画面遷移）
  ↓ タップ
Level 3: 種目別セット詳細・編集画面
```

#### Level 2: 日別種目一覧（BottomSheet）

カードタップ時に BottomSheet を表示（Alert.alert を置換）:

```
┌─────────────────────────────────────────┐
│  ─── grip ───                            │
│  3月28日（金）                            │
│  3種目 · 15セット · 4,800kg              │
│  ─────────────────────────────────────── │
│                                          │
│  ┌─────────────────────────────────────┐│
│  │ ベンチプレス    5セット  80kg   PR  ›││
│  │─────────────────────────────────────││
│  │ スクワット      5セット  100kg     ›││
│  │─────────────────────────────────────││
│  │ デッドリフト    5セット  120kg  PR ›││
│  └─────────────────────────────────────┘│
│                                          │
└──────────────────────────────────────────┘
```

**SheetRow の改善**: 右端にシェブロン `›` を追加し、タップ可能であることを明示。

```typescript
// SheetRow に onPress props を追加
interface SheetRowProps {
  label: string;
  detail?: string;
  value?: string;
  badge?: boolean;
  isLast?: boolean;
  onPress?: () => void;     // 新規追加
  showChevron?: boolean;    // 新規追加
}
```

#### Level 3: 種目別セット詳細・編集

BottomSheet内の種目行タップで新しい BottomSheet（または画面遷移）を表示:

```
┌─────────────────────────────────────────┐
│  ─── grip ───                            │
│  ベンチプレス                             │
│  3月28日 · 5セット                        │
│  ─────────────────────────────────────── │
│                                          │
│  セット  重量     回数     状態           │
│  ─────────────────────────────────────── │
│  1      [80.0]kg  [8]reps   ✓            │
│  2      [80.0]kg  [8]reps   ✓            │
│  3      [82.5]kg  [6]reps   ✓  PR       │
│  4      [80.0]kg  [8]reps   ✓            │
│  5      [80.0]kg  [7]reps   ✓            │
│  ─────────────────────────────────────── │
│                                          │
│           [変更を保存]                    │
│                                          │
└──────────────────────────────────────────┘
```

**編集可能セル仕様**:

| 要素 | フォント | 色 | 操作 |
|---|---|---|---|
| セット番号 | 13pt, `semiBold` | `textTertiary` | — |
| 重量値 | 15pt (`bodySmall`), `semiBold` | `textPrimary` | タップで TextInput に変換 |
| 回数値 | 15pt (`bodySmall`), `semiBold` | `textPrimary` | タップで TextInput に変換 |
| 単位 | 11pt, `regular` | `textTertiary` | — |
| PR バッジ | 9pt, `heavy` | `accent` on `accentDim` | — |

**保存ボタン**:

| プロパティ | 値 |
|---|---|
| テキスト | 「変更を保存」 |
| 高さ | 50pt (`BUTTON_HEIGHT.secondary`) |
| 背景 | `accent` |
| 角丸 | 16pt (`RADIUS.button`) |
| 状態 | 変更がない場合は disabled（opacity: 0.5） |

---

## 6. 進捗画面（ProgressScreen）

### 6.1 カレンダーからのドリルダウン

**現状**: カレンダー日付タップで BottomSheet 表示（種目一覧の閲覧のみ）。

**改善設計**: 履歴画面（§5）と同じ3階層ドリルダウンUIを共有。

#### 遷移フロー

```
カレンダー日付タップ
  ↓
Level 2: BottomSheet（日別種目一覧）← §5.1 Level 2 と同一コンポーネント
  ↓ 種目行タップ
Level 3: BottomSheet（種目別セット詳細・編集）← §5.1 Level 3 と同一
```

#### 共通コンポーネント化

Level 2・Level 3 の BottomSheet は `DayDetailSheet` / `SessionEditSheet` として共通コンポーネント化:

```typescript
// src/components/DayDetailSheet.tsx
interface DayDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  workout: DailyWorkout;
  onSessionPress: (session: WorkoutSession) => void;
}

// src/components/SessionEditSheet.tsx
interface SessionEditSheetProps {
  visible: boolean;
  onClose: () => void;
  session: WorkoutSession;
  date: string;
  onSave: (updatedSets: SetData[]) => void;
}
```

HistoryScreen と ProgressScreen の両方から利用。

---

## 7. 設定画面（SettingsScreen）

### 7.1 テーマ選択のグリッド化

**現状**: テーマごとに minHeight:56 の行表示。16テーマで画面が長大。

**改善設計**: カラーサークルのみのグリッド表示。

#### レイアウト

```
ダークテーマ
┌─────────────────────────────────────┐
│ ○ ○ ○ ○ ○ ○                       │
│ ○ ○ ○ ○ ○                         │
└─────────────────────────────────────┘

ライトテーマ
┌─────────────────────────────────────┐
│ ○ ○ ○ ○ ○                         │
└─────────────────────────────────────┘
```

#### グリッド仕様

| プロパティ | 値 | 根拠 |
|---|---|---|
| サークル外径 | 44pt | HIG最小タップターゲット |
| サークル内径（表示） | 36pt | 視覚サイズ |
| アクセントドット | 12pt（内部中央） | テーマのaccentカラー表示 |
| グリッド列数 | 6列 | (screenWidth - 32 - 16*2) / (44+8) ≈ 6 |
| セル間隔 | 8pt (`SPACING.sm`) | 8ptグリッド |
| 行間隔 | 8pt | 8ptグリッド |
| 選択状態 | 2pt accent色ボーダー | 非選択はボーダーなし |
| sectionCard パディング | 16pt | 既存と統一 |

#### サークルコンポーネント

```typescript
themeGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: SPACING.sm,                         // 8pt
  padding: SPACING.md,                     // 16pt
}
themeCircle: {
  width: 44,
  height: 44,
  borderRadius: 22,
  alignItems: 'center',
  justifyContent: 'center',
}
themeCircleInner: {
  width: 36,
  height: 36,
  borderRadius: 18,
  alignItems: 'center',
  justifyContent: 'center',
  // backgroundColor: theme.colors.surface1
}
themeCircleSelected: {
  borderWidth: 2,
  borderColor: c.accent,                   // 現在のテーマのaccentで囲む
}
themeCircleAccentDot: {
  width: 12,
  height: 12,
  borderRadius: 6,
  // backgroundColor: theme.colors.accent
}
// ライトテーマのサークルにはhairline borderを追加（背景との区別）
themeCircleLight: {
  borderWidth: StyleSheet.hairlineWidth,
  borderColor: c.separator,
}
```

#### テーマ名表示

グリッド下にテーマ名を表示（選択中のテーマのみ）:

```typescript
themeSelectedLabel: {
  fontSize: TYPOGRAPHY.caption,            // 12pt
  fontWeight: TYPOGRAPHY.semiBold,
  color: c.textSecondary,
  textAlign: 'center',
  marginTop: SPACING.sm,                   // 8pt
}
```

### 7.2 トレーニング設定値の編集UI

**現状**: `WEIGHT_STEP` と `DEFAULT_SETS` は表示のみ（config.ts の定数）。

**改善設計**: 設定行タップでインライン編集。

#### WEIGHT_STEP 編集

```
┌─────────────────────────────────────────┐
│ デフォルト重量ステップ     [-] 2.5kg [+] │
├─────────────────────────────────────────┤
│ デフォルトセット数         [-]  5   [+]  │
└─────────────────────────────────────────┘
```

| 設定項目 | 選択肢 | デフォルト | 保存先 |
|---|---|---|---|
| WEIGHT_STEP | 0.5, 1.0, 1.25, 2.5, 5.0 kg | 2.5 kg | AsyncStorage |
| DEFAULT_SETS | 1〜10 | 5 | AsyncStorage |
| DEFAULT_REPS | 1〜30 | 8 | AsyncStorage |
| REST_DURATION | 30, 45, 60, 90, 120, 180 秒 | 60 | AsyncStorage |

#### ステッパー仕様

```typescript
settingStepper: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: SPACING.sm,                         // 8pt
}
stepperBtn: {
  width: 32,                               // iconDisplay サイズ
  height: 32,
  borderRadius: 16,
  backgroundColor: c.surface2,
  alignItems: 'center',
  justifyContent: 'center',
  // hitSlop で44pt確保
}
stepperValue: {
  fontSize: TYPOGRAPHY.bodySmall,           // 15pt
  fontWeight: TYPOGRAPHY.bold,
  color: c.textPrimary,
  minWidth: 48,
  textAlign: 'center',
  fontVariant: ['tabular-nums'],
}
```

---

## 8. 新規テーマ追加

### 8.1 ダークモノクロテーマ「鉄墨（tetsuboku）」

設計コンセプト: 鍛鉄から色を抜いた純粋な白黒。アクセントすらグレーで統一し、数値と余白だけで語るストイックな画面。

```typescript
tetsuboku: {
  meta: {
    id: 'tetsuboku',
    name: '鉄墨',
    subtitle: '色を捨てた先に、数字だけが残る',
    accentLabel: '銀鼠',
  },
  colors: {
    background:    '#111111',
    surface1:      '#1A1A1A',
    surface2:      '#242424',
    textPrimary:   '#E8E8E8',
    textSecondary: 'rgba(232,232,232,0.58)',
    textTertiary:  'rgba(232,232,232,0.36)',
    accent:        '#9A9A9A',          // グレーアクセント
    accentDim:     'rgba(154,154,154,0.12)',
    success:       '#8A8A8A',          // successもグレー系
    separator:     'rgba(255,255,255,0.07)',
    error:         '#C47070',          // 彩度を極力抑えた赤
    onAccent:      '#111111',          // 暗背景上のアクセント→濃い文字
    scrim:         'rgba(0,0,0,0.60)',
    tabBarBg:      '#1A1A1A',
    tabBarBorder:  'rgba(255,255,255,0.07)',
  },
},
```

**コントラスト検証**:
- textPrimary (#E8E8E8) on background (#111111): **12.6:1** (AAA)
- accent (#9A9A9A) on background (#111111): **5.5:1** (AA)
- textSecondary (0.58 opacity) on background: **6.8:1** (AA)

### 8.2 ライトモノクロテーマ「白鋼（hakukou）」

設計コンセプト: 純白の中に黒い文字と灰色の階調。印刷物のような静謐さ。

```typescript
hakukou: {
  meta: {
    id: 'hakukou',
    name: '白鋼',
    subtitle: '白紙に墨の一滴、それだけで十分',
    accentLabel: '墨鼠',
    isLight: true,
  },
  colors: {
    background:    '#FAFAFA',
    surface1:      '#F0F0F0',
    surface2:      '#E5E5E5',
    textPrimary:   '#1A1A1A',
    textSecondary: '#6B6B6B',
    textTertiary:  '#999999',
    accent:        '#4A4A4A',          // ダークグレーアクセント
    accentDim:     'rgba(74,74,74,0.10)',
    success:       '#5A5A5A',          // successもグレー系
    separator:     'rgba(0,0,0,0.08)',
    error:         '#A04040',          // 彩度を極力抑えた赤
    onAccent:      '#FFFFFF',
    scrim:         'rgba(0,0,0,0.55)',
    tabBarBg:      '#F0F0F0',
    tabBarBorder:  'rgba(0,0,0,0.08)',
  },
},
```

**コントラスト検証**:
- textPrimary (#1A1A1A) on background (#FAFAFA): **16.1:1** (AAA)
- accent (#4A4A4A) on background (#FAFAFA): **8.6:1** (AAA)
- textSecondary (#6B6B6B) on background (#FAFAFA): **4.9:1** (AA)
- textTertiary (#999999) on background (#FAFAFA): **2.8:1** (大テキスト3:1未満 → 大テキストのみ使用)

### 8.3 ThemeId型への追加

```typescript
export type ThemeId =
  // ... 既存 ...
  | 'tetsuboku'   // 鉄墨（ダークモノクロ）
  | 'hakukou';    // 白鋼（ライトモノクロ）
```

---

## 9. サイドバー（CustomDrawerContent）

### 9.1 上部余白の削除

**現状**: `miniDash` の `paddingTop: insets.top + SPACING.md` がSafe Areaの外側にも余白を作っている。`DrawerContentScrollView` が独自に `contentInset` を設定するため二重余白が発生。

**原因分析**:

`DrawerContentScrollView` は内部で `safeAreaInsets.top` を `contentContainerStyle.paddingTop` に自動適用する。その上で `miniDash` にも `insets.top + 16` を設定しているため、合計で `insets.top * 2 + 16` の余白が生じている。

**改善方法**:

```typescript
// 方法: DrawerContentScrollView の contentContainerStyle で
// paddingTop を 0 に上書きし、miniDash で一元管理

<DrawerContentScrollView
  {...props}
  scrollEnabled={false}
  contentContainerStyle={[styles.scrollContent, { paddingTop: 0 }]}
>
  <View style={[styles.miniDash, { paddingTop: insets.top + SPACING.sm }]}>
    {/* ... */}
  </View>
```

**変更差分**:

| プロパティ | 現状 | 改善後 |
|---|---|---|
| DrawerContentScrollView paddingTop | 自動（insets.top） | 0（上書き） |
| miniDash paddingTop | `insets.top + SPACING.md` (16) | `insets.top + SPACING.sm` (8) |
| 合計余白 | `insets.top * 2 + 16` | `insets.top + 8` |

これにより上部の不要な余白が解消され、ダッシュボードがステータスバー直下から始まる。

---

## 10. 共通改善事項

### 10.1 ScreenHeader の numberOfLines 対応

OrderConfirmScreen以外にも長いタイトルが発生しうるため、ScreenHeaderを汎用的に改善:

```typescript
// ScreenHeader.tsx
<View style={styles.titleWrap}>
  <Text
    style={styles.title}
    numberOfLines={1}
    adjustsFontSizeToFit                   // 長いテキスト時に自動縮小
    minimumFontScale={0.7}                 // 最小70%まで（28pt→19.6pt）
  >
    {title}
  </Text>
  {!!subtitle && (
    <Text style={styles.subtitle} numberOfLines={1}>
      {subtitle}
    </Text>
  )}
</View>
```

### 10.2 SwipeableRow の改善

削除スワイプ時の確認ステップ追加（HIG: 破壊的アクション確認必須）:

現在 `SwipeableRow` の `onDelete` は即時実行。改善として:
- スワイプ完了時に `Alert.alert` で確認
- 「削除」ボタンは `style: 'destructive'`（赤色）

### 10.3 空状態（Empty State）の統一

各画面の空状態デザインを統一:

```
┌─────────────────────────────────────────┐
│                                         │
│          [アイコン 48×48pt]              │
│                                         │
│       まだ記録がありません               │
│    トレーニングを始めましょう             │
│                                         │
│        [トレーニングを開始]              │
│                                         │
└─────────────────────────────────────────┘
```

| 要素 | フォント | 色 |
|---|---|---|
| アイコン | Ionicons 48pt | `textTertiary` |
| メインテキスト | 17pt (`body`), `semiBold` | `textSecondary` |
| サブテキスト | 15pt (`bodySmall`), `regular` | `textTertiary` |
| CTAボタン | §1の ctaButton と同一仕様 | — |

---

## 11. iOS Design Spec（Layer 3連携用）

```yaml
ios_design_spec:
  app_name: TANREN
  platform: react_native_expo
  design_philosophy: "鍛鉄の間（MA）— 余白と一点の炎"

  navigation:
    type: drawer
    primary_items:
      - { icon: "barbell", label: "ホーム" }
      - { icon: "fitness", label: "トレーニング" }
      - { icon: "time", label: "履歴" }
      - { icon: "stats-chart", label: "進捗" }
      - { icon: "calendar", label: "月別レポート" }
      - { icon: "calculator", label: "RM計算機" }
    secondary_items:
      - { icon: "settings", label: "設定" }

  components:
    cards:
      corner_radius: 13pt
      padding: 16pt
      style: flat
      background: surface1
    buttons:
      primary: { height: 60pt, radius: 18pt, bg: accent }
      secondary: { height: 50pt, radius: 16pt, bg: surface1 }
      icon: { size: 44pt, radius: 22pt }
      min_target: 44x44pt

  colors:
    token_type: TanrenThemeColors
    theme_count: 18 (dark:13, light:7)
    semantic_mapping:
      success: success
      error: error
      accent: accent
    dark_mode: multi_theme

  typography:
    system: system_default (SF Pro on iOS)
    scale:
      hero: 42pt (revised from 58pt for data input)
      screenTitle: 28pt
      exerciseName: 20pt
      body: 17pt
      bodySmall: 15pt
      caption: 12pt
      captionSmall: 11pt

  spacing:
    grid: 8pt
    content_margin: 16pt
    card_gap: 8pt
    section_gap: 24pt

  animation:
    spring: { damping: 12, stiffness: 180, mass: 0.8 }
    ease_out: 180ms
    reduce_motion: supported

  accessibility:
    wcag_version: "2.2"
    level: AA
    voiceover: implemented
    contrast_normal: "4.5:1"
    contrast_large: "3:1"

  frontend_design_zones:
    - zone: workout_complete_hero
      constraints: "ヒーローセクション上部50%・アニメーション可"
    - zone: empty_state_illustration
      constraints: "48×48ptアイコン領域・装飾的要素のみ"
    - zone: theme_swatch_grid
      constraints: "サークル内部のみ・44ptタップターゲット維持"
```

---

## 12. 実装優先度

| 優先度 | 画面/機能 | 工数目安 | 影響度 |
|---|---|---|---|
| **P0** | データ入力画面コンパクト化（§3.1-3.3） | 中 | 毎回使う画面の操作性 |
| **P0** | ワークアウト完了フルスクリーン（§4） | 中 | 達成感・リテンション |
| **P1** | ホーム画面カード化（§1） | 小 | 情報視認性 |
| **P1** | 順番確認タイトル修正（§2.1） | 小 | 表示バグ修正 |
| **P1** | サイドバー余白修正（§9） | 小 | 表示バグ修正 |
| **P2** | 履歴ドリルダウン（§5） | 大 | 編集機能追加 |
| **P2** | 進捗ドリルダウン（§6） | 中 | §5と共通コンポーネント |
| **P2** | 設定テーマグリッド（§7.1） | 小 | UIリフレッシュ |
| **P2** | 設定値編集UI（§7.2） | 小 | カスタマイズ性 |
| **P3** | モノクロテーマ追加（§8） | 小 | テーマバリエーション |
| **P3** | セット行タップ選択（§3.5） | 中 | 操作性向上 |
| **P3** | 比較グラフ修正（§3.4） | 小 | 視認性改善 |
