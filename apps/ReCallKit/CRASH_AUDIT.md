# ReCallKit クラッシュパターン監査レポート

作成日: 2026-04-05

---

## 優先度別サマリー

| 優先度 | 件数 | 内容 |
|--------|------|------|
| 🔴 高（即クラッシュ） | 5件 | Non-null assertion・エラーハンドリング不足 |
| 🟠 中（条件付きクラッシュ） | 5件 | cleanup不足・レース条件・型安全性 |
| 🟡 低（デバッグ難易度） | 4件 | ESLint抑制・fire-and-forget |

---

## 🔴 高優先度（即座にクラッシュする可能性）

### CP-01: ReviewScreen — currentItem undefined アクセス
- **ファイル**: `src/screens/review/ReviewScreen.tsx:69-76`
- **危険なコード**:
  ```typescript
  const currentItem = items[currentIndex];
  // ...
  const review = currentItem.item.review!;  // currentItem が undefined なら TypeError
  ```
- **クラッシュ条件**: `currentIndex >= items.length` のタイミングで `handleRate()` が呼ばれた場合
- **修正方針**:
  ```typescript
  if (!currentItem || !currentItem.item.review) return;
  const review = currentItem.item.review;
  ```

---

### CP-02: AddItemScreen — fetchMetadata エラーハンドリング不足
- **ファイル**: `src/screens/add/AddItemScreen.tsx:50-81`
- **危険なコード**:
  ```typescript
  setFetching(true);
  const metadata = await fetchUrlMetadata(url);  // throw されると setFetching(false) に到達しない
  setFetching(false);
  ```
- **クラッシュ条件**: `fetchUrlMetadata()` がネットワークエラー等で throw した場合、`isFetching` が true のまま固着
- **修正方針**:
  ```typescript
  setFetching(true);
  try {
    const metadata = await fetchUrlMetadata(url);
    if (!metadata) return;
    // ...
  } catch (err) {
    console.error('[AddItemScreen] fetchMetadata error:', err);
  } finally {
    setFetching(false);
  }
  ```

---

### CP-03: QAPreviewScreen — Non-null assertion `row!.id`
- **ファイル**: `src/screens/add/QAPreviewScreen.tsx:75`
- **危険なコード**:
  ```typescript
  const row = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM tags WHERE name = ?',
    [categoryLabel],
  );
  return row!.id;  // row が null なら TypeError: Cannot read properties of null
  ```
- **クラッシュ条件**: INSERT OR IGNORE 後の SELECT がレース条件等で null を返した場合
- **修正方針**:
  ```typescript
  if (!row) throw new Error(`Tag not found after upsert: ${categoryLabel}`);
  return row.id;
  ```

---

### CP-04: ReviewScreen — `review!` Non-null assertion
- **ファイル**: `src/screens/review/ReviewScreen.tsx:76`
- **危険なコード**:
  ```typescript
  const review = currentItem.item.review!;  // review が null なら crash
  ```
- **クラッシュ条件**: DB にレビューレコードが存在しないアイテムが items に含まれた場合
- **修正方針**: CP-01 と同じガード節で対応

---

### CP-05: urlMetadataService — try-catch なし
- **ファイル**: `src/services/urlMetadataService.ts:34-52`
- **危険なコード**: `fetchHtml()` が throw しても呼び出し元の `fetchMetadata()` でキャッチされない構造
- **クラッシュ条件**: ネットワーク障害・タイムアウト時に上位まで例外が伝播
- **修正方針**: `fetchUrlMetadata()` 内に try-catch を追加し、失敗時は null を返す

---

## 🟠 中優先度（特定条件でクラッシュ）

### CP-06: AddItemScreen — debounce timer cleanup 不足
- **ファイル**: `src/screens/add/AddItemScreen.tsx:92-95`
- **危険なコード**:
  ```typescript
  debounceTimer.current = setTimeout(() => {
    fetchMetadata(text);
  }, DEBOUNCE_MS);
  // useEffect の cleanup がない → unmount 後に fetchMetadata が実行される
  ```
- **クラッシュ条件**: 入力中に画面遷移した場合、unmount 後に setState が呼ばれ Warning/crash
- **修正方針**:
  ```typescript
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);
  ```

---

### CP-07: analysisLimit — 本番で LIMIT_ENABLED = false
- **ファイル**: `src/utils/analysisLimit.ts:12`
- **危険なコード**:
  ```typescript
  const LIMIT_ENABLED = false;  // 開発用フラグ、本番で有効化忘れのリスク
  ```
- **クラッシュ条件**: クラッシュではないが、本番リリース時に制限なしでAPIが叩かれ続ける
- **修正方針**: 環境変数 or `__DEV__` で制御

---

### CP-08: useRewardedAd — シングルトンのレース条件
- **ファイル**: `src/hooks/useRewardedAd.ts:28-34`
- **危険なコード**:
  ```typescript
  let _resolveRef: ((v: ...) => void) | null = null;

  // 複数回 showAd() が呼ばれると _resolveRef が上書きされ
  // 最初の Promise が永遠に resolve されない
  ```
- **クラッシュ条件**: 複数コンポーネントが同時に showAd() を呼び出した場合
- **修正方針**: showAd() 呼び出し中フラグを確認し、2重呼び出しを防止

---

### CP-09: HomeScreen — navigation.getParent() null 安全性
- **ファイル**: `src/screens/home/HomeScreen.tsx:137-141`
- **危険なコード**:
  ```typescript
  (navigation.getParent<DrawerNavigationProp<DrawerParamList>>() as any)?.navigate(...)
  // getParent() が null の場合、機能しないがエラーも出ない（サイレント失敗）
  ```
- **クラッシュ条件**: ナビゲーション構造が変わった場合にサイレント失敗
- **修正方針**: `as any` を除去し、型安全な方法でナビゲート

---

### CP-10: QuizScreen — null item を setState
- **ファイル**: `src/screens/review/QuizScreen.tsx:129`
- **危険なコード**:
  ```typescript
  const item = await getItemById(db, itemIds[currentIndex]);
  setReviewable(item);  // item が null でも state に格納される
  ```
- **クラッシュ条件**: DB にアイテムが存在しない場合、後続の `reviewable.item.content` でクラッシュ
- **修正方針**:
  ```typescript
  const item = await getItemById(db, itemIds[currentIndex]);
  if (!item) { /* エラー処理 */ return; }
  setReviewable(item);
  ```

---

## 🟡 低優先度（デバッグ難易度）

### CP-11: useLibrary — ESLint 依存配列抑制
- **ファイル**: `src/hooks/useLibrary.ts:199-200`
- **コード**: `// eslint-disable-next-line react-hooks/exhaustive-deps`
- **リスク**: 依存配列が不完全で stale closure が発生する可能性
- **対応**: 抑制理由をコメントで明記 + 定期レビュー

---

### CP-12: ItemDetailScreen — ESLint 依存配列抑制
- **ファイル**: `src/screens/library/ItemDetailScreen.tsx:106`
- **コード**: `// eslint-disable-next-line react-hooks/exhaustive-deps`
- **リスク**: CP-11 と同様
- **対応**: CP-11 と同様

---

### CP-13: TaskContext — fire and forget Promise
- **ファイル**: `src/context/TaskContext.tsx:119-121`
- **危険なコード**:
  ```typescript
  runTask(id, url);  // await なし、エラーが握りつぶされる
  ```
- **リスク**: タスク実行エラーがユーザーに通知されない
- **対応**: `.catch()` でエラーログを追加

---

### CP-14: reviewRepository — quality_history JSON 未パース
- **ファイル**: `src/db/reviewRepository.ts:178`
- **危険なコード**:
  ```typescript
  quality_history: row.quality_history,  // '[1,2,3]' 文字列のまま格納
  ```
- **リスク**: 呼び出し元が配列として扱うと型エラー
- **対応**:
  ```typescript
  quality_history: row.quality_history
    ? JSON.parse(row.quality_history)
    : [],
  ```

---

## 検証計画

| フェーズ | 対象 | 判定基準 |
|---------|------|---------|
| 第1層: 静的解析 | 全ファイル TypeScript strict | エラー 0件 |
| 第2層: 単体検証 | CP-01〜05（高優先度） | null/undefined でクラッシュしないこと |
| 第3層: 統合検証 | CP-06〜10（中優先度） | 画面遷移・非同期完了後に状態が正常なこと |
| 第4層: 本番確認 | CP-07（LIMIT_ENABLED） | リリース前チェックリストに追加 |

---

## 修正実施状況

| ID | 対応状況 | 担当 | 期限 |
|----|---------|------|------|
| CP-01 | ⬜ 未対応 | - | - |
| CP-02 | ⬜ 未対応 | - | - |
| CP-03 | ⬜ 未対応 | - | - |
| CP-04 | ⬜ 未対応 | - | - |
| CP-05 | ⬜ 未対応 | - | - |
| CP-06 | ⬜ 未対応 | - | - |
| CP-07 | ⬜ 未対応 | - | - |
| CP-08 | ⬜ 未対応 | - | - |
| CP-09 | ⬜ 未対応 | - | - |
| CP-10 | ⬜ 未対応 | - | - |
| CP-11 | ⬜ 監視中 | - | - |
| CP-12 | ⬜ 監視中 | - | - |
| CP-13 | ⬜ 未対応 | - | - |
| CP-14 | ⬜ 未対応 | - | - |
