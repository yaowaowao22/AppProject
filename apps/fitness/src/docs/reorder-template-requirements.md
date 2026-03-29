# 種目並び替え確認画面 & テンプレート保存・読込機能 要件定義

> 作成日: 2026-03-30

---

## 1. 画面遷移フロー図

### 現状フロー
```
WorkoutStack
  ExerciseSelect
    └─[種目選択 → "N種目を開始" タップ]──▶ ActiveWorkout(exerciseIds)
```

### 新フロー（変更後）
```
WorkoutStack
  ExerciseSelect
    └─[種目選択 → "次へ" タップ]──────────▶ OrderConfirm(exerciseIds) [NEW]
                                              ├─[ドラッグで並び替え後 "開始" タップ]──▶ ActiveWorkout(exerciseIds)
                                              ├─["テンプレートとして保存" タップ]─────▶ (モーダル: 名称入力) ──▶ 同画面に戻る
                                              └─[← 戻る]────────────────────────────▶ ExerciseSelect

HomeScreen (既存)
  └─["テンプレートから開始" セクション]
      ├─[テンプレート一覧表示]
      └─[テンプレートカードタップ]──────────▶ OrderConfirm(exerciseIds) [テンプレート読込]
```

---

## 2. 新規画面・コンポーネント一覧と責務

### 新規画面

| 画面名 | ファイルパス | 責務 |
|--------|------------|------|
| `OrderConfirmScreen` | `src/screens/OrderConfirmScreen.tsx` | 選択した種目の順番確認・ドラッグ並び替え・テンプレート保存 |

### 新規コンポーネント

| コンポーネント名 | ファイルパス | 責務 |
|---------------|------------|------|
| `DraggableExerciseList` | `src/components/DraggableExerciseList.tsx` | ドラッグ&ドロップ可能な種目リスト（GestureHandler + Reanimated） |
| `DraggableItem` | `src/components/DraggableExerciseList.tsx` (内包) | 個別ドラッグ行（Animated.View + ハンドルアイコン） |
| `SaveTemplateModal` | `src/components/SaveTemplateModal.tsx` | テンプレート名称入力モーダル（TextInput + 保存/キャンセル） |
| `TemplateListSection` | `src/components/TemplateListSection.tsx` | HomeScreen用テンプレート一覧セクション（水平スクロール） |
| `TemplateCard` | `src/components/TemplateListSection.tsx` (内包) | テンプレート1件のカード表示（名称・種目数・最終使用日） |

---

## 3. データ構造の追加・変更点

### 3-A. 新規型: `WorkoutTemplate`

```typescript
// src/types.ts に追加
export interface WorkoutTemplate {
  id: string;                // newId() で生成
  name: string;              // ユーザー入力テンプレート名
  exerciseIds: string[];     // 種目IDの配列（順序が意味を持つ）
  createdAt: string;         // ISO8601
  updatedAt: string;         // ISO8601（最終使用時も更新）
}
```

### 3-B. 既存型の変更なし

現行の `WorkoutSession`, `DailyWorkout`, `PersonalRecord`, `WeeklyStats`, `WorkoutSet` は変更不要。

### 3-C. ナビゲーション型の変更

```typescript
// src/navigation/RootNavigator.tsx
export type WorkoutStackParamList = {
  ExerciseSelect:  undefined;
  OrderConfirm:    { exerciseIds: string[]; templateId?: string }; // NEW
  ActiveWorkout:   { exerciseIds: string[] };
};
```

- `templateId` はテンプレートから開始した場合のみセット（上書き保存 UI の出し分けに使用）

---

## 4. WorkoutContext への追加 state/action

### 追加する state

```typescript
// WorkoutContextValue に追加
templates: WorkoutTemplate[];
```

### 追加する action

```typescript
// WorkoutContextValue に追加
saveTemplate:   (name: string, exerciseIds: string[]) => Promise<void>;
updateTemplate: (id: string, patch: Partial<Pick<WorkoutTemplate, 'name' | 'exerciseIds'>>) => Promise<void>;
deleteTemplate: (id: string) => Promise<void>;
touchTemplate:  (id: string) => Promise<void>; // updatedAt 更新のみ（使用時に呼ぶ）
```

### Provider 内の追加実装

```typescript
const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);

// 起動時ロード（既存 useEffect に追加）
const loadedTemplates = await loadTemplates(); // 新規ストレージ関数
setTemplates(loadedTemplates);

// saveTemplate
const saveTemplate = useCallback(async (name: string, exerciseIds: string[]) => {
  const now = new Date().toISOString();
  const t: WorkoutTemplate = { id: newId(), name, exerciseIds, createdAt: now, updatedAt: now };
  const next = [...templates, t];
  setTemplates(next);
  await saveTemplates(next);
}, [templates]);

// updateTemplate / deleteTemplate / touchTemplate は同様のパターン
```

---

## 5. ドラッグ並び替えの実装方針

### 使用ライブラリ

| ライブラリ | バージョン | 用途 |
|-----------|----------|------|
| `react-native-gesture-handler` | ~2.28.0 (導入済) | パン操作の認識 |
| `react-native-reanimated` | ~4.1.1 (導入済) | アニメーション・レイアウト計算 |
| `expo-haptics` | ~14.0.1 (導入済) | ドラッグ開始時の触覚フィードバック |

外部の draggable-flatlist ライブラリは**導入しない**（依存追加ゼロ）。

### アプローチ: カスタム実装

```
DraggableExerciseList
  ScrollView（スクロール無効化、全件表示が前提・最大10件程度）
    items.map(item =>
      DraggableItem（Animated.View）
        GestureDetector（Gesture.Pan）
          [ハンドルアイコン ☰]  [種目名]  [順番バッジ]
    )
```

#### 実装ステップ

1. **各アイテムの `y` 座標を `useSharedValue` で管理**
   ```typescript
   const positions = useSharedValue<number[]>(items.map((_, i) => i * ITEM_HEIGHT));
   ```

2. **Pan ジェスチャーで `currentY` を更新**
   ```typescript
   Gesture.Pan()
     .onStart(() => { Haptics.impactAsync(ImpactFeedbackStyle.Medium); })
     .onChange(e => { /* currentY を更新、他アイテムのインデックス入れ替え計算 */ })
     .onEnd(() => { /* positions を正規化、onReorder(newOrder) コールバック呼び出し */ })
   ```

3. **`useAnimatedStyle` で各 DraggableItem の `transform: [{ translateY }]` を適用**

4. **`runOnJS` で JS スレッド側の `exerciseIds` state を更新**

5. **アクティブアイテムは `zIndex: 10` + `elevation: 5` で他アイテムの上に浮かせる**

#### 考慮事項

- `ScrollView` を使うため全件描画が前提。種目数の上限を **10件** と UX ガイドラインで定める
- アイテム高さは定数 `ITEM_HEIGHT = 64` で固定（フレキシブルな高さはヒットテスト計算を複雑にする）
- `GestureHandlerRootView` は既存の `App.tsx` でラップ済みであることを確認（未確認なら `App.tsx` に追加）

---

## 6. テンプレート CRUD の AsyncStorage 永続化方針

### ストレージキー

```typescript
// src/utils/storage.ts に追加
const TEMPLATES_KEY = '@massapp_fitness/templates_v1';
```

バージョンサフィックス `_v1` を付けておくことで、型変更時のマイグレーションが容易になる。

### 関数定義

```typescript
// src/utils/storage.ts に追加
export async function loadTemplates(): Promise<WorkoutTemplate[]> {
  const raw = await AsyncStorage.getItem(TEMPLATES_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as WorkoutTemplate[];
}

export async function saveTemplates(templates: WorkoutTemplate[]): Promise<void> {
  await AsyncStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}
```

### CRUD フロー

| 操作 | トリガー | 処理 |
|-----|---------|------|
| Create | OrderConfirm で「保存」ボタン押下 | `saveTemplate(name, currentOrder)` |
| Read | アプリ起動時 | `loadTemplates()` → Context state にセット |
| Read | HomeScreen マウント時 | Context の `templates` を参照（リアクティブ） |
| Update (並び替え) | テンプレート編集（将来対応・今回はスコープ外） | `updateTemplate(id, { exerciseIds })` |
| Update (使用日) | テンプレートから開始時 | `touchTemplate(id)` → `updatedAt` のみ更新 |
| Delete | テンプレートカードの長押し or スワイプ削除 | `deleteTemplate(id)` |

### 注意事項

- `AsyncStorage` は既に `@react-native-async-storage/async-storage: 2.2.0` で導入済み
- 既存の `loadWorkouts` / `saveWorkouts` と同一パターンで実装する（`src/utils/storage.ts` を参照）
- テンプレートは最大 **20件** を上限とし、超過時は保存前にユーザーへ警告する

---

## 7. ナビゲーション変更点

### 7-A. `WorkoutStackParamList` の変更（RootNavigator.tsx）

```typescript
// 変更前
export type WorkoutStackParamList = {
  ExerciseSelect: undefined;
  ActiveWorkout:  { exerciseIds: string[] };
};

// 変更後
export type WorkoutStackParamList = {
  ExerciseSelect: undefined;
  OrderConfirm:   { exerciseIds: string[]; templateId?: string }; // 追加
  ActiveWorkout:  { exerciseIds: string[] };
};
```

### 7-B. `WorkoutStackNavigator` への画面追加

```typescript
import { OrderConfirmScreen } from '../screens/OrderConfirmScreen'; // 追加

function WorkoutStackNavigator() {
  return (
    <WorkoutStack.Navigator screenOptions={{ headerShown: false, ... }}>
      <WorkoutStack.Screen name="ExerciseSelect" component={ExerciseSelectScreen} />
      <WorkoutStack.Screen name="OrderConfirm"   component={OrderConfirmScreen} /> {/* 追加 */}
      <WorkoutStack.Screen name="ActiveWorkout"  component={ActiveWorkoutScreen} />
    </WorkoutStack.Navigator>
  );
}
```

### 7-C. `ExerciseSelectScreen` の遷移先変更

```typescript
// WorkoutScreen.tsx 内 handleStart()
// 変更前
navigation.navigate('ActiveWorkout', { exerciseIds: selectedIds });

// 変更後
navigation.navigate('OrderConfirm', { exerciseIds: selectedIds });
```

### 7-D. `HomeScreen` からの `OrderConfirm` 遷移

HomeScreen は DrawerNavigator 配下のため、WorkoutStack への遷移には `navigation.navigate` の代わりに以下を使う:

```typescript
// HomeScreen.tsx
import { useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import type { RootDrawerParamList } from '../navigation/RootNavigator';

const navigation = useNavigation<DrawerNavigationProp<RootDrawerParamList>>();

// テンプレートカードタップ時
navigation.navigate('WorkoutStack', {
  screen: 'OrderConfirm',
  params: { exerciseIds: template.exerciseIds, templateId: template.id },
} as any); // WorkoutStack はネストナビゲーターのため型アサーション必要
```

---

## 8. 実装優先順序（推奨）

1. **型定義の追加** (`WorkoutTemplate`、`WorkoutStackParamList` 更新)
2. **ストレージ関数の追加** (`loadTemplates`, `saveTemplates`)
3. **WorkoutContext の拡張** (templates state + 4 actions)
4. **OrderConfirmScreen の骨格** (静的リスト表示・開始ボタン)
5. **DraggableExerciseList の実装** (ドラッグ並び替え)
6. **SaveTemplateModal の実装**
7. **TemplateListSection + TemplateCard** (HomeScreen に組み込み)
8. **ExerciseSelectScreen の遷移先変更** (最後に切り替える)
