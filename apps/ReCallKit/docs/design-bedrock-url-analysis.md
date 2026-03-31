# 設計書：URL解析 × AWS Bedrock 連携

作成日: 2026-03-31

---

## 1. やりたいこと（ゴール）

URL を入力するだけで、そのページの内容を**学習用Q&Aカード**に自動変換する。
ユーザーはカードを選んで保存するだけで、記憶定着に最適な学習素材が揃う。

---

## 2. ユーザー体験フロー（理想）

```
AddItemScreen
  └─ URL入力 → [解析] ボタンタップ
       └─ URLPreviewScreen（新画面）
            ├─ ローディング中: "ページを読み込んでいます..."
            ├─ 完了後:
            │    ┌─────────────────────────┐
            │    │  📄 ページタイトル       │
            │    │  要約: 1〜2行            │
            │    ├─────────────────────────┤
            │    │  ☑ Q: ○○とは何か？      │
            │    │    A: ～～～             │
            │    │  ☐ Q: ～なぜ重要か？    │
            │    │    A: ～～～             │
            │    │  ☑ Q: ～の手順は？      │
            │    │    A: ～～～             │
            │    └─────────────────────────┘
            │  [選択した項目を保存] ボタン
            └─ LibraryScreen（各Q&Aが1アイテムとして保存）
```

---

## 3. アーキテクチャ選択

### 選択肢

| 方式 | メリット | デメリット |
|------|----------|-----------|
| **A. AImensetu バックエンドに追記**（推奨） | 既存 BedrockClient・IAM ロールをそのまま流用、インフラ追加不要 | 2アプリ間の結合 |
| B. AWS Lambda 新設 | 完全独立、ReCallKit 専用 | 新インフラ構築・デプロイ作業が必要 |
| C. Expo アプリから直接 Bedrock | バックエンド不要 | AWS 認証情報をアプリに埋め込む必要あり（危険）、Cognito 設定が複雑 |

### → 方式A を推奨

AImensetu の FastAPI バックエンドに `/api/recall/analyze` エンドポイントを1本追加するだけで動く。
boto3 セッション・IAM ロール・BedrockClient は**一切触らず流用**できる。

---

## 4. 使用モデル

| | モデル ID | 備考 |
|-|----------|------|
| 現在（AImensetu） | `anthropic.claude-3-haiku-20240307-v1:0` | Claude 3 Haiku |
| **推奨（ReCallKit）** | `anthropic.claude-3-5-haiku-20241022-v1:0` | Claude 3.5 Haiku（Bedrock で利用可能な最新 Haiku） |

3.5 Haiku は 3.0 比でQ&A品質が明確に高い。Bedrock 上の料金は同等帯。
※ AImensetu 既存処理への影響なし（ReCallKit 専用エンドポイントのみ 3.5 を使う）。

---

## 5. コスト再試算（Bedrock 料金）

Bedrock の Haiku 3.5 料金（2025年時点）:
- Input: $0.00080 / 1K tok（≒ Direct API と同じ）
- Output: $0.00400 / 1K tok

| シナリオ | Input | Output | 合計/ページ | 合計/月（100ページ） |
|---------|-------|--------|-----------|-------------------|
| 記事10,000字 + プロンプト | ~13,000 tok | ~800 tok | **約$0.013（≒2円）** | **約$1.30（≒200円）** |

個人利用レベルではほぼ無視できるコスト。

---

## 6. 実装コンポーネント一覧

### 6-1. AImensetu バックエンド（Python FastAPI）

```
backend/app/api/v1/recall.py        ← 新規エンドポイント
  POST /api/recall/analyze
    body: { url: str, html_text: str }
    return: { title, summary, qa_pairs: [{question, answer}] }
```

- `BedrockClient.invoke()` をそのまま呼ぶ（`model="haiku"` ただし model_id は 3.5 に設定）
- プロンプトは日本語 or 英語を自動判定して生成
- タイムアウト: 30秒

**プロンプト（案）:**
```
以下はWebページのテキストです。
学習用のQ&Aペアを5〜8個生成してください。
難しすぎず、ページの核心的な知識をカバーすること。

出力はJSON配列のみ。形式:
[{"question": "...", "answer": "..."}]

テキスト:
{本文 最大4000文字}
```

### 6-2. ReCallKit モバイルアプリ（React Native / Expo）

```
src/services/bedrockAnalysisService.ts   ← 新規
  fetchUrlAnalysis(url, htmlText) → AnalysisResult

src/screens/add/URLPreviewScreen.tsx     ← 新規画面
  ├─ ロード中 UI
  ├─ Q&A カードリスト（チェックボックス付き）
  └─ 「保存」ボタン → 複数アイテム一括 INSERT

src/navigation/types.ts                  ← URLPreviewScreen 型追加
src/navigation/stacks/LibraryStack.tsx   ← 画面追加
```

### 6-3. 環境変数・設定

```
RECALL_API_BASE_URL=https://api.aimensetu.com   ← AImensetu バックエンドのURL
RECALL_API_KEY=...                               ← 簡易 API キー認証
```

Expo では `app.config.js` の `extra` or `EXPO_PUBLIC_*` で管理。

---

## 7. HTMLテキスト抽出（クライアント側）

現在の `urlMetadataService.ts` は OGP のみ抽出。
本文抽出ロジックを追加する:

```typescript
// 優先度順に本文テキストを抽出
1. <article> 内のテキスト
2. <main> 内のテキスト  
3. <p> タグ群のテキスト（4000文字でトリム）

// 除外
<nav>, <header>, <footer>, <script>, <style>, <aside>
```

4000文字に収めることでトークン数を抑制（コスト最適化）。

---

## 8. データモデル（変更なし）

既存スキーマで対応可能:

```
items テーブル:
  title   ← Q の前後に答えを含む形で保存
  content ← "Q: {question}\n\nA: {answer}" 形式
  excerpt ← answer の要約（1行）
  source_url ← 元URL
  type    ← 'url'
```

複数Q&Aを1URLから保存する場合、items を複数行 INSERT する。

---

## 9. 実装ステップ（優先順）

| ステップ | 内容 | 場所 |
|---------|------|------|
| ① | AImensetu に `/api/recall/analyze` エンドポイント追加 | Python backend |
| ② | HTML本文抽出ロジック追加 | `urlMetadataService.ts` |
| ③ | `bedrockAnalysisService.ts` 新規作成 | ReCallKit |
| ④ | `URLPreviewScreen.tsx` 新規作成 | ReCallKit |
| ⑤ | ナビゲーション追加（LibraryStack / types） | ReCallKit |
| ⑥ | AddItemScreen に「解析」ボタン追加 | ReCallKit |

---

## 10. 懸念点・検討事項

| 項目 | 内容 |
|------|------|
| CORS | React Native の fetch は CORS 制約なし → HTML 取得は問題なし |
| ページによっては JS レンダリング必要 | fetch では SPA のコンテンツが取れないケースあり（許容 or headless Chromium は over-kill） |
| AImensetu バックエンドの認証 | 現状 Cognito 認証。ReCallKit 用に API Key 認証エンドポイントを別途切るか検討 |
| モデル利用可能リージョン | Bedrock の 3.5 Haiku は `ap-northeast-1`（東京）で利用可能（2025年確認済み） |
| オフライン | ネットワーク不要の時はボタンを無効化するだけで良い |
