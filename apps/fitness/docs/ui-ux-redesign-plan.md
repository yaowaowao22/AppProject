# UI/UX 改修設計書

作成日: 2026-03-31

---

## 1. ActiveWorkoutScreen のヘッダー共通化

### 1-1. 現状分析

**WorkoutScreen.tsx: L562–L596**

`ActiveWorkoutScreen` の `return` 冒頭は以下の構造になっている:

```tsx
// L563
<SafeAreaView style={styles.container} edges={['bottom']}>
  {/* L564 — title="" showBack={false} という "空" ScreenHeader */}
  <ScreenHeader title="" showBack={false} />
  {/* L566–L580 — 独自の「戻る行」: 戻るボタン + spacer + exIcon + 種目名 */}
  <TouchableOpacity style={styles.detailBackRow} onPress={() => navigation.goBack()}>
    <Ionicons name="chevron-back" size={20} color={colors.accent} />
    <Text style={styles.detailBackText}>戻る</Text>
    <View style={{ flex: 1 }} />
    <View style={styles.exIcon}>
      <Text style={styles.exIconText}>{exercise?.name.charAt(0) ?? ''}</Text>
    </View>
    <Text style={styles.detailExName}>{exercise?.name ?? 'ワークアウト'}</Text>
  </TouchableOpacity>
  {/* L582–L596 — サブヘッダー: 筋肉情報 + setBadge */}
  <View style={styles.actHeader}>
    <Text style={[styles.actSub, { flex: 1 }]}>筋肉情報</Text>
    <View style={styles.setBadge}>...</View>
  </View>
```

問題点:
- `ScreenHeader title="" showBack={false}` は空ヘッダーを描画しているだけで機能していない
- 戻るボタンが独自実装（accent色）で他画面と見た目が異なる
- `ExerciseSelectScreen` (L93) と `OrderConfirmScreen` は `ScreenHeader` の `showBack` を正しく使用しており、`ActiveWorkoutScreen` だけが非統一

**ExerciseSelectScreen (L93):**
```tsx
<ScreenHeader title="種目選択" showBack />
```
→ 正しく共通化済み

**OrderConfirmScreen:** `ScreenHeader` 使用確認が必要（後述）

### 1-2. 変更内容

**ファイル:** `src/screens/WorkoutScreen.tsx`

**変更前（L562–L596）:**
```tsx
<SafeAreaView style={styles.container} edges={['bottom']}>
  <ScreenHeader title="" showBack={false} />
  <TouchableOpacity
    style={styles.detailBackRow}
    onPress={() => navigation.goBack()}
    ...
  >
    <Ionicons name="chevron-back" size={20} color={colors.accent} />
    <Text style={styles.detailBackText}>戻る</Text>
    <View style={{ flex: 1 }} />
    <View style={styles.exIcon}>
      <Text style={styles.exIconText}>{exercise?.name.charAt(0) ?? ''}</Text>
    </View>
    <Text style={styles.detailExName}>{exercise?.name ?? 'ワークアウト'}</Text>
  </TouchableOpacity>
  <View style={styles.actHeader}>
    <Text style={[styles.actSub, { flex: 1 }]}>...</Text>
    <View style={styles.actHeaderRight}>
      <View style={styles.setBadge}>...</View>
    </View>
  </View>
```

**変更後:**
```tsx
<SafeAreaView style={styles.container} edges={['bottom']}>
  {/* ① ScreenHeader を共通仕様で使用（戻るボタンは標準スタイル） */}
  <ScreenHeader title="ワークアウト" showBack />

  {/* ② 種目名行: HistoryScreen の BodyPartDetailView と同じパターン */}
  <View style={styles.detailBackRow}>
    <View style={styles.exIcon}>
      <Text style={styles.exIconText}>{exercise?.name.charAt(0) ?? ''}</Text>
    </View>
    <Text style={styles.detailExName}>{exercise?.name ?? 'ワークアウト'}</Text>
    <View style={{ flex: 1 }} />
    <View style={styles.actHeaderRight}>
      <View style={styles.setBadge}>
        <Text style={styles.setBadgeText}>
          {exerciseIds.length > 1
            ? <Text><Text style={styles.setBadgeNum}>{currentIndex + 1}</Text>{`/${exerciseIds.length}`}</Text>
            : <Text>{'セット '}<Text style={styles.setBadgeNum}>{allDone ? rows.length : activeIdx + 1}</Text></Text>
          }
        </Text>
      </View>
    </View>
  </View>

  {/* ③ サブ情報行: 筋肉情報のみ（setBadge を ② に移動したため削除） */}
  <View style={styles.actHeader}>
    <Text style={[styles.actSub, { flex: 1 }]}>
      {exercise?.muscleDetail ?? BODY_PART_MUSCLE[exercise?.bodyPart as BodyPart] ?? ''}
    </Text>
  </View>
```

**削除するスタイル:**
- `detailBackText`: 独自の「戻る」テキストスタイル（不要）
- `actHeader.actHeaderRight` → `detailBackRow` に移設

**注意点:**
- `ScreenHeader` の `showBack` はデフォルトで `navigation.goBack()` を呼ぶので `onBack` prop は不要
- `detailBackRow` の `TouchableOpacity` → `View` に変更（戻る機能はヘッダーに移設）
- `SafeAreaView edges={['bottom']}` はそのまま維持（ScreenHeader が topInset を管理する）

---

## 2. 履歴画面 ExerciseDetailView の PR 色分け削除

### 2-1. 現状分析

**HistoryScreen.tsx: L834–L868（renderSetTable 関数内）**

```tsx
// L840–L867
{session.sets.map((set: WorkoutSet, idx: number) => {
  const isPR =
    set.isPersonalRecord === true ||
    (pr?.maxWeight != null && set.weight !== null && set.weight >= pr.maxWeight);
  return (
    <View
      key={set.id}
      style={[
        S.setTableRow,
        isPR && { backgroundColor: colors.accentDim },  // ← 行背景色変更（削除対象）
      ]}
    >
      ...
      <View style={[S.setColBadge, ...]}>
        {isPR && (
          <View style={[S.prBadge, { backgroundColor: colors.accent }]}>  // ← PR バッジ背景（維持）
            <Text style={{ fontSize: 9, fontWeight: TYPOGRAPHY.bold, color: colors.onAccent }}>
              PR
            </Text>
          </View>
        )}
      </View>
    </View>
  );
})}
```

### 2-2. 変更内容

**ファイル:** `src/screens/HistoryScreen.tsx`

**変更前（L843–L847）:**
```tsx
<View
  key={set.id}
  style={[
    S.setTableRow,
    isPR && { backgroundColor: colors.accentDim },
  ]}
>
```

**変更後:**
```tsx
<View
  key={set.id}
  style={S.setTableRow}
>
```

**PRバッジ（L857–L863）: 変更なし（維持）**
```tsx
{isPR && (
  <View style={[S.prBadge, { backgroundColor: colors.accent }]}>
    <Text style={{ fontSize: 9, fontWeight: TYPOGRAPHY.bold, color: colors.onAccent }}>
      PR
    </Text>
  </View>
)}
```

---

## 3. グラフを線グラフに統一

### 3-1. 現状分析（棒グラフ使用箇所一覧）

| ファイル | コンポーネント | データ | 種別 | 線グラフ化 |
|---|---|---|---|---|
| HistoryScreen.tsx L204–L241 | `BarChart` 関数 | 最大12本棒グラフ共通 | 汎用 | ✅ 対象 |
| HistoryScreen.tsx L540 | `BodyPartDetailView` 内 `<BarChart>` | 週別ボリューム8週 | 時系列 | ✅ 対象 |
| HistoryScreen.tsx L787–L797 | `ExerciseDetailView` 内 `<BarChart>` | 最大重量推移12回 | 時系列 | ✅ 対象 |
| WorkoutScreen.tsx L734–L761 | `ActiveWorkoutScreen` 内インライン | 過去5セッション比較 | 時系列 | ✅ 対象 |
| ProgressScreen.tsx L307–L358 | `ProgressScreen` 内インライン | 直近7日ボリューム | 時系列 | ✅ 対象 |
| MonthlyReportScreen.tsx L258–L298 | `MonthlyReportScreen` 内インライン | 日別ボリューム | 時系列 | ✅ 対象 |
| MonthlyReportScreen.tsx L232–L254 | 部位別ボリューム水平バー | 部位比較 | 比較 | ❌ 棒グラフ維持 |

### 3-2. 技術選定

#### 候補比較

| ライブラリ | バンドルサイズ | API | RN対応 | Expo対応 |
|---|---|---|---|---|
| `react-native-svg` + カスタムSVG Path | ~110KB | 完全制御 | ◎ | ◎ |
| `victory-native` | ~350KB | 高レベル | ◎ | ◎ |
| `react-native-chart-kit` | ~200KB | 中レベル | △ (メンテ停滞) | ◯ |
| `react-native-svg-charts` | ~160KB | 中レベル | △ (非推奨) | ◯ |

#### 選定: `react-native-svg` + カスタム SVG Path

**理由:**
1. **既存プロジェクト整合性**: `react-native-svg` はすでに Expo SDK に同梱されており、追加依存なし
2. **最小バンドル増加**: `victory-native` 等の高レベルライブラリは不要な機能も含む
3. **デザイン制御**: テーマカラー・線の太さ・ドット・グリッドを完全制御できる
4. **パフォーマンス**: SVG ベースで native レンダリング、メモ化も容易
5. **保守性**: サードパーティに依存しない自前コンポーネントはRN バージョンアップの影響を受けにくい

#### 実装設計: `LineChart` コンポーネント

**新規ファイル:** `src/components/LineChart.tsx`

```tsx
interface LineChartProps {
  data: Array<{ label: string; value: number }>;
  colors: TanrenThemeColors;
  height?: number;          // デフォルト: 100
  showDots?: boolean;       // デフォルト: true
  highlightLast?: boolean;  // 最終点を accent で強調
}
```

**実装仕様:**
- `Svg` / `Path` / `Circle` / `Line` / `Text` を `react-native-svg` から import
- SVG viewBox でレスポンシブ幅対応（`Dimensions.get('window').width` - margins）
- 折れ線: cubic bezier または catmull-rom で滑らか曲線
- ドット: 各データ点に `Circle` (r=3)、最終点のみ r=4 + `colors.accent`
- グリッド: y軸に薄い水平線（`colors.separator`、3本程度）
- ラベル: x軸下部に `SVG Text`（`colors.textTertiary`、fontSize=8）
- ゼロ値: ドット省略、線は地平線に

**WorkoutScreen.tsx の過去比較グラフ（L734–L761）について:**
棒グラフが6本（最大）と少ないため、インライン SVG か `LineChart` コンポーネントを使用する。
現行の `histBars` スタイルは削除、`LineChart` に置換。

### 3-3. 各ファイルの変更箇所

#### HistoryScreen.tsx

- **L204–L241 `BarChart` 関数**: 削除。代わりに `LineChart` をインポートして使用
  ```tsx
  // 削除: function BarChart(...)
  // 追加: import { LineChart } from '../components/LineChart';
  ```
- **L540**: `<BarChart data={chartData} colors={colors} />` → `<LineChart data={chartData} colors={colors} />`
- **L897** (ExerciseDetailView 内 BarChart): `<BarChart data={chartData} colors={colors} />` → `<LineChart data={chartData} colors={colors} />`

#### WorkoutScreen.tsx

- **L734–L761** の `histBars` インライン棒グラフ → `<LineChart>` に置換
- `histAllMax` 計算ロジックは不要になるため削除
- `histSection` スタイルはほぼ維持（LineChart 自体が高さを持つ）

#### ProgressScreen.tsx

- **L307–L358** の `chartBars` インライン棒グラフ → `<LineChart>` に置換
- `maxDailyVolume` の計算ロジックは LineChart 内部に移管
- タップ（`workoutId` 遷移）は LineChart に `onDotPress` prop を追加して対応

#### MonthlyReportScreen.tsx

- **L258–L298** の `chartBars` インライン棒グラフ → `<LineChart>` に置換（日別ボリューム）
- **L232–L254** の部位別水平バーは変更なし

---

## 4. テーマの暗色化

### 4-1. 対象テーマの分類

変更対象: モノクロ系 + ライト墨彩系 + 渋彩系の背景・サーフェス

**方針:**
- `background`: 1段〜2段暗く（ライト系は #F8–#F5 帯へ）
- `surface1`: `background` より約5–8% 暗く
- `surface2`: `surface1` より約5–8% 暗く
- `tabBarBg`: `surface1` と同値
- テキスト・アクセントはそのまま（コントラスト維持）

---

### 4-2. hakukou（白鋼）— ライトモノクロ

**現在値:**
```
background:  #FAFAFA
surface1:    #F0F0F0
surface2:    #E5E5E5
tabBarBg:    #F0F0F0
```

**提案値:**
```
background:  #F2F2F2  (白に近い薄グレーから、明確なライトグレーへ)
surface1:    #E8E8E8
surface2:    #DCDCDC
tabBarBg:    #E8E8E8
```

**変化の意図:** 現行は白すぎてカードとの境界が曖昧。背景を明確にグレーにすることでカード（`cardBackground: #FFFFFF`）が浮き立つ。

---

### 4-3. hakuen（白炎）/ hakusei（白青）/ hakusui（白翠）— ライト墨彩

これら3テーマは背景値が hakukou と同一（`#FAFAFA`/`#F0F0F0`/`#E5E5E5`）のため、同様に調整。

**現在値（共通）:**
```
background:  #FAFAFA
surface1:    #F0F0F0
surface2:    #E5E5E5
tabBarBg:    #F0F0F0
```

**提案値（共通）:**
```
background:  #F2F2F2
surface1:    #E8E8E8
surface2:    #DCDCDC
tabBarBg:    #E8E8E8
```

---

### 4-4. kaihaku（灰白）— ライト渋彩

**現在値:**
```
background:  #F8F8F6  (わずかにウォーム)
surface1:    #EEEEEC
surface2:    #E3E3E0
tabBarBg:    #EEEEEC
```

**提案値:**
```
background:  #F0F0ED  (2段暗く、ウォームトーン維持)
surface1:    #E5E5E2
surface2:    #D9D9D6
tabBarBg:    #E5E5E2
```

---

### 4-5. bokuen（墨炎）/ bokusei（墨青）/ bokusui（墨翠）— ダーク墨彩

これら3テーマの背景は tetsuboku と同値（`#121212`/`#1A1A1A`/`#242424`）。
既にダーク系なので、微調整のみ。

**現在値（共通）:**
```
background:  #121212
surface1:    #1A1A1A
surface2:    #242424
tabBarBg:    #1A1A1A
```

**提案値（共通）:**
```
background:  #0F0F0F  (わずかに暗く、純黒に近づける)
surface1:    #171717
surface2:    #212121
tabBarBg:    #171717
```

**変化の意図:** アクセントカラー（オレンジ/ブルー/グリーン）の鮮やかさを背景を締めることで強調。

---

### 4-6. sabiiro（錆色）— ダーク渋彩

**現在値:**
```
background:  #131110  (ウォームダーク)
surface1:    #1C1917
surface2:    #26221F
tabBarBg:    #1C1917
```

**提案値:**
```
background:  #0F0D0C  (1段暗く)
surface1:    #181513
surface2:    #221E1B
tabBarBg:    #181513
```

---

### 4-7. kohai（古灰）— ダーク渋彩

**現在値:**
```
background:  #111315  (クールダーク)
surface1:    #191B1E
surface2:    #222527
tabBarBg:    #191B1E
```

**提案値:**
```
background:  #0D0F11  (1段暗く)
surface1:    #151719
surface2:    #1E2022
tabBarBg:    #151719
```

---

### 4-8. 変更サマリー表

| テーマID | 変更前 background | 変更後 background | 変更前 surface1 | 変更後 surface1 | 変更前 surface2 | 変更後 surface2 |
|---|---|---|---|---|---|---|
| hakukou | #FAFAFA | #F2F2F2 | #F0F0F0 | #E8E8E8 | #E5E5E5 | #DCDCDC |
| hakuen | #FAFAFA | #F2F2F2 | #F0F0F0 | #E8E8E8 | #E5E5E5 | #DCDCDC |
| hakusei | #FAFAFA | #F2F2F2 | #F0F0F0 | #E8E8E8 | #E5E5E5 | #DCDCDC |
| hakusui | #FAFAFA | #F2F2F2 | #F0F0F0 | #E8E8E8 | #E5E5E5 | #DCDCDC |
| kaihaku | #F8F8F6 | #F0F0ED | #EEEEEC | #E5E5E2 | #E3E3E0 | #D9D9D6 |
| bokuen | #121212 | #0F0F0F | #1A1A1A | #171717 | #242424 | #212121 |
| bokusei | #121212 | #0F0F0F | #1A1A1A | #171717 | #242424 | #212121 |
| bokusui | #121212 | #0F0F0F | #1A1A1A | #171717 | #242424 | #212121 |
| sabiiro | #131110 | #0F0D0C | #1C1917 | #181513 | #26221F | #221E1B |
| kohai | #111315 | #0D0F11 | #191B1E | #151719 | #222527 | #1E2022 |

---

## 5. 変更の影響範囲と注意点

### 5-1. ヘッダー共通化

- **影響:** `WorkoutScreen.tsx` のみ（`ActiveWorkoutScreen` の JSX と styles）
- **注意:**
  - `ScreenHeader` に `showBack` を渡すと `navigation.goBack()` が呼ばれるが、`ActiveWorkoutScreen` は `navigation.replace` で遷移することがあるため動作確認が必要
  - `detailBackRow` の `TouchableOpacity` → `View` への変更で、誤タップによる戻り遷移を防ぐ
  - `styles.detailBackText` と独自の戻るボタン関連スタイルが削除できる

### 5-2. PR 色分け削除

- **影響:** `HistoryScreen.tsx` の `renderSetTable` 関数のみ（L844–L846）
- **注意:** `isPR` 変数の計算自体は残す（PRバッジ表示に使用するため）。`backgroundColor` の付与のみ削除。

### 5-3. 線グラフ化

- **影響:** 新規ファイル `src/components/LineChart.tsx` の追加 + 5ファイルの変更
- **注意:**
  - `react-native-svg` は Expo SDK 51+ に同梱済みのため `expo install` 不要。`package.json` に明示されているか確認する
  - `ProgressScreen` の日別チャートはタップで `DayDetail` 遷移する機能があるため、`LineChart` の `onDotPress` / `onBarPress` prop 設計が必要
  - データが1件の場合、折れ線ではなく単独ドットのみ表示する処理が必要
  - `Dimensions.get('window').width` は `useWindowDimensions()` フックで取るのが推奨（向き変更対応）

### 5-4. テーマ暗色化

- **影響:** `src/theme.ts` の該当テーマの `background` / `surface1` / `surface2` / `tabBarBg` 値のみ
- **注意:**
  - `ThemeContext.tsx:L58` の `cardBackground` は `isLight === true ? '#FFFFFF' : colors.surface1` で自動導出されているため、ライトテーマの背景を暗くしても `cardBackground` は `#FFFFFF` のまま維持される（意図通り）
  - ライトテーマの `background` を暗くすると、`separator: 'rgba(0,0,0,0.08)'` のコントラストが変わる。`rgba(0,0,0,0.10)` への微調整を検討
  - `tabBarBorder` は `surface1` に連動させる必要はないが、現行値のまま問題ない

---

## 6. 実装順序（推奨）

1. **theme.ts 暗色化**（影響範囲最小、即座に視覚確認できる）
2. **HistoryScreen PR 色分け削除**（1行削除のみ）
3. **ActiveWorkoutScreen ヘッダー共通化**（JSX構造変更）
4. **LineChart コンポーネント作成**（新規ファイル）
5. **HistoryScreen グラフ置換**（BarChart → LineChart）
6. **WorkoutScreen グラフ置換**
7. **ProgressScreen グラフ置換**（タップ遷移対応が必要）
8. **MonthlyReportScreen グラフ置換**
