# BUGS.md — 無音の演算 (dentak) バグ一覧

生成日: 2026-04-12  
調査対象: `src/` 全ファイル（TS/TSX）、`store/`、`engine/`、`hooks/`、`components/`、`utils/`、`whisper/`

---

## CRITICAL — 計算結果が常に間違う

### BUG-001: `ln(x)` が `log10(x)` として評価される

**ファイル:** `src/engine/expressionParser.ts:27-29`

```ts
// Step 1: ln( → log(
expr = expr.replace(/\bln\(/g, 'log(');
// Step 2: log( → log10(  ← ここで Step1 の変換結果も巻き込まれる
expr = expr.replace(/\blog\(/g, 'log10(');
```

**症状:** `ln(e)` → `log10(e) ≈ 0.4343` (正解: `1.0`)

**メカニズム:** コメントには「ln を先に処理しないと log10 変換に巻き込まれる」とあるが、  
ln → log に変換した後、Step 2 がその `log(` をさらに `log10(` に変換してしまう。  
結果、`ln(x)` は常に `log10(x)` として計算される。

**修正方針:**
- Step 1 で一時マーカーに変換: `ln(` → `__LN__(` → Step 2 後に `log(` に戻す、または
- Step 1 で直接 mathjs の `log(` (自然対数) に変換してから Step 2 の regex を `\blog(?!10)\(` に限定

---

### BUG-002: DEG/GRAD モードで `asin/acos/atan` の結果がラジアンのまま

**ファイル:** `src/engine/calculator.ts:41-48`

```ts
// wrapTrigFunctions の変換対象
const trigInputFunctions = ['sin', 'cos', 'tan'];
// asin/acos/atan は含まれていない ↑
```

**症状 (DEG モード):** `asin(0.5)` → `0.5236`（ラジアン）、正解は `30`（度）

**メカニズム:** `handleKeyPress` (useCalculator.ts:270-272) は `asin/acos/atan` を実装済みだが、  
`wrapTrigFunctions` が変換対象リストにこれらを含まないため、角度変換が適用されない。  
mathjs は常にラジアンで演算するため、DEG/GRAD モードで逆三角関数の出力が度に変換されない。

**加えて:** コメント (calculator.ts:39) には `asin/acos/atan` の「出力側変換が必要」と記載あり。  
入力ラップだけでなく出力のラジアン→度変換も未実装。

**修正方針:**
- `wrapTrigFunctions` に逆三角関数の出力変換を追加:  
  `asin(x)` → `asin(x) * (180 / pi)` (DEG の場合)

---

## HIGH — 機能不全または設定が効かない

### BUG-003: `calculate()` / `applyFunction()` が常に `'Error'` を返す

**ファイル:** `src/store/calculatorStore.ts:119, 143`

```ts
calculate: () => {
  // スタブ
  const resultStr = 'Error';  // L119: 計算エンジン未統合
  ...
}

applyFunction: (fn: string) => {
  const resultStr = 'Error';  // L143: 同上
  ...
}
```

**症状:** `useCalculator` の返り値 (useCalculator.ts:332-333) でこれらが「store stub」として露出されている。  
`calculate` / `applyFunction` を直接呼ぶコード（テスト・今後追加するコンポーネント）は  
常に `'Error'` を受け取り、履歴にも `'Error'` が記録される。

**メカニズム:** 実際の計算は `handleCalculate` / `_applyFnReal` でのみ行われ、  
store の `calculate()` は `useCalculator` フック経由でしか正しく動作しない。

**リスク:** フック外から store を直接呼び出す場合（例: 音声入力の一部パス）に誤動作する。

---

### BUG-004: SettingsSheet のハプティクス切り替えが無効

**ファイル:** `src/utils/haptics.ts:11`

```ts
let hapticsEnabled = true;  // 常に true のまま
```

**症状:** SettingsSheet で「ハプティクス」トグルを OFF にしても、ボタンタップ時の振動が止まらない。

**メカニズム:** `setHapticsEnabled()` (haptics.ts:14) は実装されているが、  
`settingsStore.setHaptics()` からこの関数が呼び出されていない。  
settingsStore と haptics モジュールが切断されたまま。

**確認箇所:** `src/store/settingsStore.ts` の `setHaptics` アクション内に  
`import { setHapticsEnabled } from '../utils/haptics'` と呼び出しが存在しない。

---

### BUG-005: `formattedExpression` の `÷` 変換 regex が `1/2` にマッチしない

**ファイル:** `src/hooks/useCalculator.ts:120`

```ts
const formattedExpression = useMemo(() => {
  return expression
    .replace(/\*/g, '×')
    .replace(/(?<!\d)\/(?!\d)/g, '÷');  // ← バグ
}, [expression]);
```

**症状:** expression に `1/2` が含まれる場合、`÷` に変換されずに `1/2` のまま表示される。

**メカニズム:** `(?<!\d)\/(?!\d)` は「前後が数字でない `/`」にのみマッチ。  
数字に挟まれた `/`（最も一般的な除算表記）はマッチしない。

**注意:** 通常フローでは `handleKeyPress` が `setOperator('÷')` を呼ぶため  
expression には最初から `÷` が入る。しかし voice result や history recall 等の  
別パスで `/` が expression に混入した場合に表示が崩れる。

**修正:** `.replace(/\//g, '÷')` に変更。

---

### BUG-006: 音声入力時 `mathEvaluate` が null の競合状態

**ファイル:** `src/whisper/voiceParser.ts:3-13`

```ts
let mathEvaluate: ((expr: string) => number) | null = null;
(async () => {
  // モジュール読み込み時に非同期でmathjs初期化
  const mathjs = await import('mathjs').catch(() => null);
  ...
})();
```

**症状:** アプリ起動直後に音声入力を使うと、式が計算されず  
`result: null` の `ParseResult` が返り、calculatorStore に式のみ反映される。

**メカニズム:** `mathEvaluate` の初期化は非同期 IIFE。  
`parseVoiceInput()` が初回呼び出された時点でまだ null の場合、  
`tryEvaluate()` が null を返してもエラー表示なし（サイレント失敗）。  
ユーザーには `applied` 状態に見えるが数値結果が得られない。

**修正方針:** `parseVoiceInput` 内で `mathEvaluate` が null なら  
同期的に mathjs を require するか、初期化完了まで待機する処理を追加。

---

## MEDIUM — 動作は部分的に正しいが UX や正確性に問題

### BUG-007: ANS キーが current に文字列連結する

**ファイル:** `src/hooks/useCalculator.ts:291-293`

```ts
} else if (key === 'ANS') {
  const s = useCalculatorStore.getState();
  inputDigit(String(s.lastAnswer));  // ← multi-char string を inputDigit に渡す
}
```

**症状:** current が `'5'` の状態で ANS（lastAnswer = 3.14）を押すと  
`'5' + '3.14'` = `'53.14'` になる（正解: `3.14` に置き換わるべき）。

**メカニズム:** `inputDigit` は "1文字の数字" を想定した設計:  
```ts
const next = s.current === '0' ? d : s.current + d;
```
multi-char 文字列を渡すと文字列連結が発生。

**修正:** `inputDigit` ではなく `useCalculatorStore.setState({ current: String(s.lastAnswer), shouldReset: false })` を直接呼ぶ。

---

### BUG-008: BasePane の進数選択が閉じるたびリセットされる

**ファイル:** `src/components/sidebar/BasePane.tsx:39`

```ts
const [base, setBase] = useState<BaseType>('DEC');  // ← ローカル state
```

**症状:** HEX を選択してサイドバーを閉じ再度開くと DEC に戻る。

**メカニズム:** `base` が `useState` (コンポーネントローカル) のため、  
サイドバーのアニメーション開閉でコンポーネントがアンマウントされると state が消える。  
(ファイル内の TODO コメントで認識済み)

**修正:** `settingsStore` に `baseMode: BaseType` を追加して `useSettingsStore` から読み書き。

---

### BUG-009: SettingsSheet — SharedValue を render フェーズで読み取る

**ファイル:** `src/components/settings/SettingsSheet.tsx:223`

```ts
if (!isVisible && translateY.value >= SCREEN_HEIGHT) {
  return null;  // ← translateY.value は Reanimated SharedValue
}
```

**症状:** 閉じアニメーション中にシートが突然消える、または閉じても null にならない可能性がある。

**メカニズム:** `SharedValue.value` を React の render フェーズで直接読むと  
UI スレッドの最新値ではなく JS スレッドのコピーを読む。  
`withTiming` アニメーション中は値が JS スレッドへ即座に反映されないため、  
条件分岐が意図した挙動にならない可能性がある。

**修正:** `isVisible` と別に `isRendered` の JS state を管理し、  
`withTiming` のコールバック (`runOnJS`) で `setIsRendered(false)` を呼ぶ。

---

### BUG-010: `percent()` が文脈を無視して単純に `/100` する

**ファイル:** `src/store/calculatorStore.ts:213-219`

```ts
percent: () => {
  const val = parseFloat(s.current);
  const next = String(val / 100);  // 常に÷100するだけ
  return { current: next };
}
```

**症状 (期待値 vs 実際):**

| 入力 | 期待 (標準電卓) | 実際 |
|------|----------------|------|
| `100 + 20%` | `120` | `100.2` |
| `200 × 15%` | `30` | `200 × 0.15 = 30` ✓ |
| `500 - 10%` | `450` | `500 - 0.1 = 499.9` |

**メカニズム:** `%` は `pendingOp` と `pendingVal` の文脈を参照せず、  
`current` の値を単純に `/ 100` するだけ。加減算の場合は基準値の何%かを計算すべき。

---

### BUG-011: `setOperator` で current が `'Error'` のとき NaN が pendingVal に入る

**ファイル:** `src/store/calculatorStore.ts:89`

```ts
setOperator: (op: string) => {
  set((s) => {
    const val = parseFloat(s.current);  // 'Error' → NaN
    ...
    return {
      pendingVal: val,  // NaN が格納される
```

**症状:** `Error` 表示中に演算子を押すと `pendingVal = NaN` になり、  
後続のチェーン計算で予期しない結果になる可能性。

**修正:** `isNaN(val)` の場合は `{}` を返して何もしない。

---

## LOW — 機能欠落または軽微な問題

### BUG-012: `EE` キーが `handleKeyPress` で未処理

**ファイル:** `src/hooks/useCalculator.ts` (EE のケースなし) / `src/components/calculator/UtilBar.tsx:22`

**症状:** UtilBar の `EE` ボタンを押しても haptics が鳴るだけで何も起きない。  
科学的記数法の入力（例: `1.5e10`）が不可能。

---

### BUG-013: 計算履歴がアプリ再起動で消える

**ファイル:** `src/store/calculatorStore.ts`

**症状:** アプリを再起動すると履歴が空になる。

**メカニズム:** `useCalculatorStore` は `zustand/middleware/persist` を使っていない。  
`settingsStore` と `modelStore` は persist 済みだが `calculatorStore` は非永続。

---

### BUG-014: マイク権限が永続拒否されても再度ダイアログが出続ける

**ファイル:** `src/hooks/useWhisper.ts:111-115`

```ts
const { status } = await Audio.requestPermissionsAsync();
if (status !== 'granted') {
  setError('マイク権限が必要です');
  return;
}
```

**症状:** ユーザーが「今後確認しない」で拒否した場合でも、  
mic ボタンを押すたびにシステムダイアログが表示される（または即座に denied を返す）。  
設定アプリへの誘導がない。

**修正:** `status === 'denied'` の場合は `Linking.openSettings()` を案内する。

---

### BUG-015: Whisper ネイティブ未初期化時のサイレントモックフォールバック

**ファイル:** `src/whisper/StreamingSession.ts`

**症状:** ネイティブ whisper.rn が利用不可（シミュレーター・未初期化）の場合、  
3秒後に空文字列を `onFinalResult` に返すモックにフォールバックする。  
ユーザーには「WHISPER LISTENING → PROCESSING → APPLIED」と表示されるが  
実際には何も認識していない。デモモードであることが一切通知されない。

---

### BUG-016: `√N` (括弧なし) パターンが小数に対応していない

**ファイル:** `src/engine/expressionParser.ts:42`

```ts
expr = expr.replace(/√(\d)/g, 'sqrt($1');  // 1文字の数字のみマッチ
```

**症状:** `√.5` → マッチせず、mathjs に `√.5` がそのまま渡り `Error`。  
（`√2`、`√25` は自動補完で動作する）

**修正:** `√([\d.]+)` に変更し、小数にも対応。

---

## サマリー

| 優先度 | 件数 | バグ番号 |
|--------|------|---------|
| CRITICAL | 2 | BUG-001, BUG-002 |
| HIGH     | 4 | BUG-003, BUG-004, BUG-005, BUG-006 |
| MEDIUM   | 5 | BUG-007, BUG-008, BUG-009, BUG-010, BUG-011 |
| LOW      | 5 | BUG-012, BUG-013, BUG-014, BUG-015, BUG-016 |
| **合計** | **16** | |

### 修正優先順位

1. **BUG-001** (ln→log10 誤変換) — 全ての自然対数計算が間違い
2. **BUG-002** (逆三角関数の角度変換なし) — DEG/GRAD モードで asin/acos/atan が使えない
3. **BUG-004** (haptics 設定が無効) — 設定 UI のトグルが機能しない
4. **BUG-006** (mathjs 初期化競合) — 起動直後の音声入力が無音で失敗
5. **BUG-007** (ANS キー連結バグ) — ANS 操作が incorrect な数値を生成
