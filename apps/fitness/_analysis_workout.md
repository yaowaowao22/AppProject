# WorkoutScreen / ActiveWorkoutScreen 入力フロー・状態管理 調査レポート

調査日: 2026-04-02  
対象ファイル: `src/screens/WorkoutScreen.tsx`

---

## 1. 入力欄（numCtrl）の状態管理

### 主要な状態変数

| 変数 | 型 | 役割 |
|------|-----|------|
| `rows` | `SetRow[]` | 全セット行の重量・回数・完了フラグ |
| `editingField` | `'weight' \| 'reps' \| null` | 現在編集中のフィールド |
| `editValue` | `string` | TextInput の一時バッファ |
| `manualActiveIdx` | `number \| null` | ユーザーが明示的に選択した行インデックス |
| `editingRowRef` | `React.MutableRefObject<number>` | commitEdit が書き戻す行インデックス（Ref） |
| `activeIdxRef` | `React.MutableRefObject<number>` | adjustWeight/adjustReps が参照する行インデックス（Ref） |

### activeRow と rows[activeIdx] の連動

```
autoActiveIdx = rows.findIndex(r => !r.done)   // 最初の未完了行
activeIdx     = manualActiveIdx ?? autoActiveIdx
activeRow     = allDone ? rows[rows.length - 1] : rows[activeIdx]
```

- `activeRow` は **毎レンダリング時に `rows[activeIdx]` を直接参照**する
- numCtrl の表示は `activeRow.weight` / `activeRow.reps` を直接読む（728行、763行）
- `activeIdx` が変わると即座に表示が切り替わる
- **入力欄と行データは分離されていない**：入力欄は行データそのものを表示する

### adjustWeight / adjustReps の動作

```typescript
function adjustWeight(delta: number) {
  const idx = activeIdxRef.current;          // Ref経由でactiveIdxを取得
  setRows(prev => prev.map((r, i) => {
    if (i !== idx) return r;
    const cur = r.weight ?? 0;
    return { ...r, weight: Math.max(0, Math.round((cur + delta) * 10) / 10) };
  }));
  bump(weightScale);                          // アニメーション
}
```

- `±` ボタンで `rows[activeIdx].weight/reps` を**直接書き換える**
- `editValue`（TextInput バッファ）とは無関係
- Ref (`activeIdxRef`) を使うのは、クロージャーが古い `activeIdx` を参照しないため

### startEditing / commitEdit のフロー

**startEditing(field)**:
1. `editingRowRef.current = activeIdx`（書き戻し先の行インデックスを記憶）
2. `editValue = String(activeRow.weight or reps)`（現在の行データを TextInput バッファに転写）
3. `editingField = field`（TextInput を表示切替）
4. 50ms後に TextInput をフォーカス

**commitEdit()**:
1. `editValue` をパース
2. `rows[editingRowRef.current]` に書き戻す（`activeIdx` ではなく**Refで固定した行**）
3. `editingField = null`（TextInput → Text に戻す）

> Refで行インデックスを固定する理由:  
> TextInput の `onBlur` が呼ばれた時点では `activeIdx` が既に変わっている可能性があるため、  
> `editingRowRef` でどの行に書き戻すかを事前に固定している。

---

## 2. handleSetComplete の現在のフロー

### コード（564-588行）

```typescript
function handleSetComplete() {
  if (allDone) return;
  const idx = activeIdxRef.current;
  const nextActive = idx + 1;

  setRows(prev => {
    let updated = prev.map((r, i) => i === idx ? { ...r, done: true } : r);
    // update mode: 既存セッション行は常に done=true を維持
    if (isUpdateMode && existingSession) {
      const existingCount = existingSession.sets.length;
      updated = updated.map((r, i) => i < existingCount ? { ...r, done: true } : r);
    }
    // 次の行がなければ空行を追加
    if (nextActive >= updated.length) {
      return [...updated, { weight: null, reps: null, done: false }];
    }
    return updated;
  });

  setManualActiveIdx(nextActive);   // 必ず次の行へ移動
  setSetDone(true);
  doneTimeoutRef.current = setTimeout(() => setSetDone(false), 1500);
}
```

### フロー概要

1. `rows[idx].done = true`（現在行を完了状態に）
2. 次の行がなければ `{ weight: null, reps: null, done: false }` を追加
3. **`manualActiveIdx = idx + 1`** で必ず次行へ移動
4. セット完了アニメーション（1.5秒）

### manualActiveIdx と autoActiveIdx の関係

```
manualActiveIdx: ユーザー操作（handleRowTap / handleSetComplete）で明示的にセット
autoActiveIdx:  rows.findIndex(r => !r.done)  ← 常に "最初の未完了行"

activeIdx = manualActiveIdx ?? autoActiveIdx
```

`manualActiveIdx` が設定されている間は `autoActiveIdx` は無視される。  
`manualActiveIdx` がリセットされる（`null` になる）のは：
- 種目切り替え時の `useEffect` → `setManualActiveIdx(null)`

### 「一番最初の行に戻る」バグの根本原因

**問題シナリオ例**:
```
rows = [
  { weight:60, reps:10, done:true  },   // row 0
  { weight:60, reps:10, done:true  },   // row 1
  { weight:60, reps: 8, done:false },   // row 2 ← 途中でdoneが解除された
  { weight:60, reps:10, done:true  },   // row 3
]
manualActiveIdx = 4 (次の行を指している)
```

このとき `autoActiveIdx = 2`（row 2 が最初の未完了行）。  
`manualActiveIdx` が有効なうちは row 4 がアクティブだが、  
何らかのタイミングで `manualActiveIdx = null` になると、  
**autoActiveIdx=2 に引き戻される**。

さらに、**より単純な「行 0 に戻る」バグ**：
- `handleRowTap(i)` でタップした行が `done` なら `done: false` にリセットしてから `manualActiveIdx = i` をセット
- しかし row 0 を誤タップして done が解除されると `autoActiveIdx = 0` になる
- その後 `manualActiveIdx` が何らかの理由でリセットされると row 0 がアクティブになる

---

## 3. セット行のクリアボタン（setClearBtn）

### 表示条件（851行）

```typescript
{(row.weight !== null || row.reps !== null || row.done) && (
  <TouchableOpacity
    onPress={() => handleClearRow(i)}
    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    style={styles.setClearBtn}
    accessibilityLabel="クリア"
  >
    <Ionicons name="close" size={13} color={colors.textTertiary} />
  </TouchableOpacity>
)}
```

**表示条件**: `weight !== null` OR `reps !== null` OR `done === true`  
→ データが何もなく未完了の行（未来のセット）にはボタン非表示

### handleClearRow の動作（560-562行）

```typescript
function handleClearRow(i: number) {
  setRows(prev => prev.map((r, idx) => 
    idx === i ? { ...r, weight: null, reps: null, done: false } : r
  ));
}
```

- 対象行の `weight: null`, `reps: null`, `done: false` にリセット
- `manualActiveIdx` はリセットしない（アクティブ行は変わらない）

### レイアウト

`styles.setClearBtn` は行内の右端に配置（絶対位置またはフレックス末尾）。  
行タップ領域（`TouchableOpacity` 全体）の内側にネストしている構造。

---

## 4. handleExerciseComplete / completeSession の done 行処理

### handleExerciseComplete（630-646行）

```typescript
async function handleExerciseComplete() {
  const doneRows = rows.filter(r => r.done);   // done=true の行のみ抽出
  if (isUpdateMode && existingSession) {
    if (doneRows.length > 0)
      await updateSession(existingWorkoutId!, buildUpdatedSession(existingSession!, doneRows));
  } else if (doneRows.length > 0) {
    await completeSession(doneRows.map(r => ({ weight: r.weight, reps: r.reps })));
  }
  // 次の種目 or ワークアウト完了画面へ
  ...
}
```

**処理の流れ**:
1. `rows.filter(r => r.done)` → **done=true の行のみを保存対象**にする
2. done でない行（未完了・途中）は**完全に捨てられる**
3. update mode: `buildUpdatedSession` で既存セッションと merge
4. 通常 mode: `completeSession` に `{weight, reps}[]` を渡す

> **注意**: `completeSession` に渡す前に重量・回数の最終確認ステップはない。  
> numCtrl で編集中の値は `commitEdit` が呼ばれていなければ保存されない可能性がある。

---

## 問題の根本原因まとめ

### 問題① 入力欄（numCtrl）が rows[activeIdx] を直接参照している

```
numCtrl 表示: activeRow.weight / activeRow.reps
activeRow   : rows[activeIdx]  ← 直接参照
```

`handleSetComplete` で `manualActiveIdx = idx + 1` になると、  
次のレンダリングで `activeRow = rows[idx+1]` に切り替わり、  
**numCtrl の表示が即座にリセットされる**（新しい行の値を表示）。

「前のセットと同じ重量・回数をデフォルト表示したい」や  
「入力中の値を行切り替え後も保持したい」という要件は現在の設計では実現できない。

### 問題② autoActiveIdx = rows.findIndex(r => !r.done) による巻き戻し

`manualActiveIdx` が `null` になった瞬間、`autoActiveIdx`（最初の未完了行）が使われる。  
途中の行が done でない場合（誤タップ・クリアボタン操作等）、  
**その行が active になってしまう**。

特に `useEffect`（種目切り替え）で `setManualActiveIdx(null)` が走ると、  
全セットの最初の未完了行がアクティブになるため、  
「一番最初の行に戻る」現象が起きる。

### 問題③ 入力欄と行データが分離されていない

現在のアーキテクチャ:
```
rows[i].weight / rows[i].reps  ← 直接 numCtrl に表示・直接書き換え
```

理想のアーキテクチャ（入力バッファ分離）:
```
inputState: { weight: string, reps: string }  ← numCtrl が読み書き
↓ セット完了時にのみコピー
rows[activeIdx]: { weight: number, reps: number, done: true }
```

現在の設計では「入力欄の内容を保持しつつ行を切り替える」ことができず、  
行切り替え = 入力値リセット という挙動が避けられない。

---

## 改修に向けた示唆

1. **入力バッファを分離**: `inputWeight: string`, `inputReps: string` を独立した state として管理
2. **handleSetComplete 時にのみコピー**: セット完了ボタン押下時に入力バッファ → rows[activeIdx] へ書き込む
3. **行切り替え時のバッファ更新**: `handleRowTap` や `handleSetComplete` で新しいアクティブ行の値を入力バッファにロードする
4. **manualActiveIdx のリセット管理**: autoActiveIdx への fallback が意図しない巻き戻しを起こさないよう、リセット条件を明示的に管理する
