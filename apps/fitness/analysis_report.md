# 筋トレアプリ UI調査レポート

## 1. 戻るボタンUI差分一覧

### OrderConfirmScreen（正例）`src/screens/OrderConfirmScreen.tsx:130-141`

| 項目 | 値 |
|------|-----|
| コンテナ要素 | `TouchableOpacity`（行全体がタップ可能） |
| スタイル名 | `detailBackRow` |
| 背景色 | なし（親の `c.background` が透過して見える） |
| paddingHorizontal | `SPACING.contentMargin` |
| paddingVertical | `SPACING.sm` |
| gap | `SPACING.xs` |
| タップ領域 | 行全体（chevron + テキスト + フレックスの空白 + カウント） |

**JSX 構造:**
```jsx
<TouchableOpacity style={styles.detailBackRow} onPress={() => navigation.goBack()} activeOpacity={0.7}>
  <Ionicons name="chevron-back" size={20} color={colors.accent} />
  <Text style={styles.detailBackText}>種目選択</Text>   {/* accent色, bodySmall, semiBold */}
  <View style={{ flex: 1 }} />
  <Text style={styles.detailBackInfo}>{data.length}種目</Text>  {/* textTertiary, caption, semiBold */}
</TouchableOpacity>
```

---

### ActiveWorkoutScreen（修正対象）`src/screens/WorkoutScreen.tsx:546-566`

| 項目 | 値 |
|------|-----|
| コンテナ要素 | `View`（タップ不可） |
| スタイル名 | `exerciseInfoRow` |
| 背景色 | `c.surface1`（**帯として浮いて見える**） |
| paddingHorizontal | `16`（ハードコード、SPACING定数を使っていない） |
| paddingVertical | `12`（ハードコード） |
| gap | `SPACING.xs` |
| タップ領域 | アイコン部分のみ（子の `TouchableOpacity` がアイコンだけを囲む） |

**JSX 構造:**
```jsx
<View style={styles.exerciseInfoRow}>
  <TouchableOpacity               {/* ← アイコンのみラップ */}
    onPress={() => navigation.goBack()}
    activeOpacity={0.7}
    style={{ marginRight: 4 }}
  >
    <Ionicons name="chevron-back" size={20} color={colors.accent} />
  </TouchableOpacity>
  <Text style={styles.exInfoName}>{exercise?.name ?? 'ワークアウト'}</Text>  {/* 太字20px */}
  <View style={{ flex: 1 }} />
  <View style={styles.setBadge}>...</View>
</View>
```

---

### 差分サマリー

| 比較軸 | OrderConfirmScreen（正） | ActiveWorkoutScreen（修正対象） |
|--------|--------------------------|--------------------------------|
| 行全体のタップ可否 | ✅ TouchableOpacity | ❌ View（アイコンのみタップ） |
| 背景色 | なし（透明） | `c.surface1`（帯が浮く） |
| paddingHorizontal | `SPACING.contentMargin` | `16`（ハードコード） |
| paddingVertical | `SPACING.sm` | `12`（ハードコード） |
| 戻り先ラベル | 「種目選択」(accent色テキスト) | なし（種目名が表示されるだけ） |
| 右端情報 | `{N}種目`（textTertiary） | セットバッジ（画面役割上維持） |

---

## 2. ActiveWorkoutScreen 戻るボタン行の修正内容

OrderConfirmScreen のパターンに揃えるための具体的な変更:

### JSX 変更

**Before (`WorkoutScreen.tsx:546-566`):**
```jsx
<View style={styles.exerciseInfoRow}>
  <TouchableOpacity
    onPress={() => navigation.goBack()}
    activeOpacity={0.7}
    accessibilityRole="button"
    accessibilityLabel="順序確認に戻る"
    style={{ marginRight: 4 }}
  >
    <Ionicons name="chevron-back" size={20} color={colors.accent} />
  </TouchableOpacity>
  <Text style={styles.exInfoName}>{exercise?.name ?? 'ワークアウト'}</Text>
  <View style={{ flex: 1 }} />
  <View style={styles.setBadge}>...</View>
</View>
```

**After:**
```jsx
<TouchableOpacity
  style={styles.exerciseInfoRow}
  onPress={() => navigation.goBack()}
  activeOpacity={0.7}
  accessibilityRole="button"
  accessibilityLabel="順序確認に戻る"
>
  <Ionicons name="chevron-back" size={20} color={colors.accent} />
  <Text style={styles.exInfoName}>{exercise?.name ?? 'ワークアウト'}</Text>
  <View style={{ flex: 1 }} />
  <View style={styles.setBadge}>...</View>
</TouchableOpacity>
```

### スタイル変更 (`exerciseInfoRow`)

**Before (`WorkoutScreen.tsx:951-958`):**
```js
exerciseInfoRow: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 16,        // ハードコード
  paddingVertical: 12,          // ハードコード
  backgroundColor: c.surface1, // 背景帯
  gap: SPACING.xs,
},
```

**After:**
```js
exerciseInfoRow: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: SPACING.contentMargin, // 定数化
  paddingVertical: SPACING.sm,              // 定数化
  // backgroundColor 削除（透明）
  gap: SPACING.xs,
},
```

---

## 3. ホーム→ワークアウト開始の遷移問題

### 3-1. 問題の根本: focus リスナーとの競合

`RootNavigator.tsx:117-124` の WorkoutStack DrawerScreen に以下の focus リスナーが設定されている:

```js
listeners={({ navigation }) => ({
  focus: () => {
    (navigation as any).navigate('WorkoutStack', { screen: 'ExerciseSelect' });
  },
})}
```

**問題フロー:**

```
HomeScreen.handleStartWorkout()
  → navigation.navigate('WorkoutStack')        # Drawerが WorkoutStack に切り替わる
  → DrawerScreen の focus イベントが発火
  → focus リスナー: navigate('WorkoutStack', { screen: 'ExerciseSelect' })
  → WorkoutStack が ExerciseSelect にリセットされる
```

この flow 自体は「ドロワーで再選択時に完了画面の再表示を防ぐ」という意図通りに動くが、**QuickStart チップや本日メニュー経由の遷移に副作用がある**:

```
HomeScreen.handleChipPress(id)
  → navigate('WorkoutStack', { screen: 'ActiveWorkout', params: {...} })
  → Drawer が WorkoutStack に切り替わる → focus 発火
  → focus リスナーが ExerciseSelect に上書きリセット  ← 意図しない競合
```

focus リスナーの `navigate` と画面遷移の `navigate` がレースコンディションになり、ActiveWorkout ではなく ExerciseSelect が表示される場合がある。

### 3-2. NativeStack のデフォルトアニメーション問題

- WorkoutStack.Navigator の `screenOptions` に `animation` 指定がない
- iOS デフォルト: `default`（右スライド）
- Drawer ナビゲーション（左右スライド）の直後に NativeStack の push アニメーションが重なり、不自然な二重アニメーションになる
- `handleStartWorkout` → Drawerスライド → ExerciseSelect push という流れで視覚的にぎこちない

### 3-3. 改善案

#### 案A: focus リスナーを廃止し ExerciseSelectScreen で代替（推奨）

```diff
// RootNavigator.tsx
<Drawer.Screen
  name="WorkoutStack"
  component={WorkoutStackNavigator}
  options={{ title: 'トレーニング' }}
- listeners={({ navigation }) => ({
-   focus: () => {
-     (navigation as any).navigate('WorkoutStack', { screen: 'ExerciseSelect' });
-   },
- })}
/>
```

```diff
// WorkoutScreen.tsx - ExerciseSelectScreen
useFocusEffect(
  useCallback(() => {
    setSelectedIds([]);
+   // 完了後のスタック残骸を戻す必要がある場合は navigation.dispatch を使う
  }, []),
);
```

- WorkoutComplete → ExerciseSelect に戻った際のスタック管理は `navigation.popToTop()` を ExerciseSelect の useFocusEffect または WorkoutComplete の「もう一度」ボタンで処理する

#### 案B: WorkoutStack の初期画面アニメーションを none に設定

```diff
// RootNavigator.tsx
function WorkoutStackNavigator() {
  return (
    <WorkoutStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
+       animation: 'fade',  // Drawerアニメーションとの二重感を軽減
      }}
    >
```

Drawer から WorkoutStack に入る際の NativeStack push アニメーションを `fade` または `none` にすることで、Drawer スライドと重なるアニメーションの違和感を解消できる。`WorkoutComplete` は既に `slide_from_bottom` を個別指定しているためこの設定に影響されない。

#### 案C: HomeScreen の navigate 方法を navigate → reset に変更（最もクリーン）

```diff
// HomeScreen.tsx
function handleStartWorkout() {
- navigation.navigate('WorkoutStack');
+ (navigation as any).navigate('WorkoutStack', { screen: 'ExerciseSelect' });
  // focus リスナーと同じ指定で明示的に初期画面を指定
}
```

これにより focus リスナーとの競合ではなく、navigate 呼び出し元が初期画面を明示する。

#### 案D: focus リスナーを条件付きに変更

```diff
// RootNavigator.tsx
listeners={({ navigation }) => ({
  focus: () => {
+   // すでに ExerciseSelect 以外の画面にいる場合のみリセット
+   // → ただし navigationState の参照が必要で実装が複雑になる
    (navigation as any).navigate('WorkoutStack', { screen: 'ExerciseSelect' });
  },
})}
```

この案はナビゲーション状態の参照が必要になり実装が複雑になるため、案A または案C が望ましい。

### 3-4. 推奨修正方針まとめ

1. **focus リスナーを削除**（案A）: QuickStart・メニュータップ経由の遷移競合を根本解決
2. **WorkoutStack の animation を `fade` に変更**（案B）: Drawer と NativeStack のアニメーション二重感を解消
3. **WorkoutComplete の戻りロジック**: `navigation.popToTop()` または `navigation.dispatch(CommonActions.reset({...}))` で ExerciseSelect に戻る処理を WorkoutComplete 側に移動

これら3点を組み合わせることで、ホーム→ワークアウト開始の遷移がスムーズになる。
