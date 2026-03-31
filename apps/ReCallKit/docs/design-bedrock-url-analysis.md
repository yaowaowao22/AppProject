# 設計書：URL解析 × AWS Bedrock 連携

作成日: 2026-03-31  
更新日: 2026-03-31（アーキテクチャを Lambda 方式に確定・キー管理追加）

---

## 1. やりたいこと（ゴール）

URL を入力するだけで、そのページの内容を**学習用Q&Aカード**に自動変換する。
ユーザーはカードを選んで保存するだけで、記憶定着に最適な学習素材が揃う。

---

## 2. ユーザー体験フロー

```
AddItemScreen
  └─ URL入力 → [AI解析] ボタンタップ
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

## 3. アーキテクチャ：AWS Lambda（確定）

### 選定理由

| 観点 | Lambda | AImensetu 追記 | アプリ直接呼び出し |
|------|--------|---------------|----------------|
| コスト | 実質無料（月100回≒$0） | サーバー代は既払い | 実質無料 |
| 独立性 | ◎ ReCallKit 専用 | △ 2アプリ結合 | ◎ |
| 認証 | API Gateway API Key | Cognito が必要で複雑 | ✗ 危険 |
| 資格情報漏洩リスク | ◎ IAM ロールのみ | ◎ IAM ロールのみ | ✗ アプリに埋め込み |
| メンテ負荷 | サーバー管理ゼロ | EC2 管理継続 | ゼロ |

→ **Lambda + API Gateway** が最もクリーンかつセキュア。  
AImensetu とは完全に独立し、ReCallKit だけで完結する。

### 全体構成図

```
┌─────────────────────────────────┐
│  ReCallKit (Expo / RN)          │
│                                 │
│  1. fetch(url) → HTML取得       │
│  2. 本文テキスト抽出             │
│  3. POST /analyze               │
│     Header: x-api-key: ***      │
└────────────┬────────────────────┘
             │ HTTPS
             ▼
┌─────────────────────────────────┐
│  API Gateway (HTTP API)         │
│  ・API Key 認証                 │
│  ・使用量プラン（レート制限）    │
└────────────┬────────────────────┘
             │ Lambda Proxy
             ▼
┌─────────────────────────────────┐
│  AWS Lambda (Python)            │
│  recall-kit-analyzer            │
│                                 │
│  ・HTML本文を受け取る            │
│  ・boto3 で Bedrock を呼ぶ       │
│  ・Q&A JSON を返す              │
│                                 │
│  IAM実行ロール:                  │
│    bedrock:InvokeModel のみ      │
└────────────┬────────────────────┘
             │ AWS SDK (boto3)
             ▼
┌─────────────────────────────────┐
│  AWS Bedrock                    │
│  Claude 3.5 Haiku               │
│  ap-northeast-1 (東京)          │
└─────────────────────────────────┘
```

---

## 4. 使用モデル

| | モデル ID | 備考 |
|-|----------|------|
| AImensetu 現在 | `anthropic.claude-3-haiku-20240307-v1:0` | Claude 3 Haiku（触らない） |
| **ReCallKit 採用** | `anthropic.claude-3-5-haiku-20241022-v1:0` | Claude 3.5 Haiku、3.0比でQ&A品質が明確に高い |

---

## 5. コスト試算

**Bedrock Claude 3.5 Haiku 料金（2025年時点）**
- Input: $0.00080 / 1K tok
- Output: $0.00400 / 1K tok

| シナリオ | Input | Output | 合計/ページ | 合計/月（100ページ） |
|---------|-------|--------|-----------|-------------------|
| 記事10,000字＋プロンプト | ~13,000 tok | ~800 tok | **≒$0.013（約2円）** | **≒$1.30（約200円）** |

**Lambda + API Gateway 追加コスト**
- Lambda: 月100回 → **$0**（無料枠 100万回/月）
- API Gateway HTTP API: 月100回 → **$0**（最小料金 $1/100万回）

---

## 6. 認証・APIキー管理（重要）

### 6-1. キーの種類と役割

| キー | 用途 | 保管場所 |
|------|------|---------|
| **AWS IAM 実行ロール** | Lambda → Bedrock 呼び出し権限 | Lambda に自動付与（コードに書かない） |
| **API Gateway API Key** | モバイルアプリ → Lambda の認証 | 下記参照 |

### 6-2. API Gateway API Key の保管フロー

```
AWS Console / CLI で発行
  └─ API Gateway 使用量プランに紐づけ（レート: 100req/day 等）
       └─ モバイルアプリ側に配布 ↓

【開発時】
  .env.local（.gitignore 対象）
    EXPO_PUBLIC_RECALL_API_URL=https://xxxx.execute-api.ap-northeast-1.amazonaws.com/prod
    EXPO_PUBLIC_RECALL_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

【本番ビルド（EAS Build）】
  EAS Secrets に登録（eas secret:create）
    → EAS サーバー側でのみ保持、ソースコードに含まれない
```

### 6-3. .gitignore への追加（必須）

```
# 既存の .gitignore に追記
.env
.env.local
.env.*.local
```

### 6-4. アプリ側での利用方法

```typescript
// src/config/api.ts
export const RECALL_API_URL = process.env.EXPO_PUBLIC_RECALL_API_URL ?? '';
export const RECALL_API_KEY = process.env.EXPO_PUBLIC_RECALL_API_KEY ?? '';
```

```typescript
// bedrockAnalysisService.ts 内のリクエスト
fetch(RECALL_API_URL + '/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': RECALL_API_KEY,   // API Gateway が検証
  },
  body: JSON.stringify({ url, text }),
})
```

---

## 7. Lambda 関数の仕様

### エンドポイント

```
POST https://{api-id}.execute-api.ap-northeast-1.amazonaws.com/prod/analyze

Request:
{
  "url": "https://example.com/article",
  "text": "記事本文テキスト（最大4000文字）"
}

Response 200:
{
  "title": "ページタイトル",
  "summary": "1〜2行の要約",
  "qa_pairs": [
    { "question": "○○とは何ですか？", "answer": "～～" },
    ...
  ]
}

Response 4xx/5xx:
{ "error": "エラーメッセージ" }
```

### プロンプト設計

```
以下はWebページの本文テキストです。
学習カード用のQ&Aペアを5〜8個生成してください。
- ページの核心的な知識・事実・手順を網羅すること
- 1問1答で簡潔に
- 日本語で生成すること

出力はJSON配列のみ（説明文不要）:
[{"question": "...", "answer": "..."}]

URL: {url}
本文:
{text}
```

### Lambda 関数構成（Python）

```
lambda/
  recall_analyzer/
    handler.py        ← メイン（boto3 で Bedrock 呼び出し）
    requirements.txt  ← boto3 のみ（Lambda にデフォルト入り）
```

`boto3` は Lambda ランタイムに標準で含まれるため、追加パッケージなし。

---

## 8. IAM 設定（最小権限）

Lambda 実行ロールに付与するポリシー:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "arn:aws:bedrock:ap-northeast-1::foundation-model/anthropic.claude-3-5-haiku-20241022-v1:0"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

---

## 9. ReCallKit 実装コンポーネント一覧

```
src/config/api.ts                        ← 新規：API定数（URLとKeyをまとめる）
src/services/bedrockAnalysisService.ts   ← 新規：Lambda API 呼び出し
src/screens/add/URLPreviewScreen.tsx     ← 新規：Q&Aプレビュー＋保存画面
src/navigation/types.ts                  ← 変更：URLPreviewScreen 型追加
src/navigation/stacks/LibraryStack.tsx   ← 変更：画面スタック追加
src/screens/add/AddItemScreen.tsx        ← 変更：[AI解析]ボタン追加
```

---

## 10. HTMLテキスト抽出（クライアント側）

現在の `urlMetadataService.ts` に本文抽出を追加:

```typescript
// 優先度順に本文を抽出
1. <article> 内のテキスト
2. <main> 内のテキスト
3. <p> タグ群のテキスト

// 除外タグ（ノイズ除去）
<nav>, <header>, <footer>, <script>, <style>, <aside>, <iframe>

// 最大4000文字でトリム（コスト最適化）
```

---

## 11. データモデル（追加変更なし）

既存スキーマで対応可能（schema.ts v2 で excerpt 列・collections テーブルは既に定義済み）:

```
items テーブル:
  type      = 'url'
  title     = "Q: {question}"
  content   = "Q: {question}\n\nA: {answer}"
  excerpt   = answer の先頭100文字
  source_url = 元URL
```

複数Q&Aを選択して保存 → items を複数行 INSERT。

---

## 12. 実装ステップ（優先順）

| ステップ | 内容 | 場所 |
|---------|------|------|
| ① | IAM ロール作成（bedrock:InvokeModel のみ） | AWS Console |
| ② | Lambda 関数 `recall-kit-analyzer` 作成・デプロイ | AWS Console / CLI |
| ③ | API Gateway HTTP API 作成・API Key 設定 | AWS Console |
| ④ | `.env.local` 作成・`.gitignore` 追記 | ReCallKit ルート |
| ⑤ | `src/config/api.ts` 新規作成 | ReCallKit |
| ⑥ | `bedrockAnalysisService.ts` 新規作成 | ReCallKit |
| ⑦ | `URLPreviewScreen.tsx` 新規作成 | ReCallKit |
| ⑧ | ナビゲーション・AddItemScreen 修正 | ReCallKit |

---

## 13. 懸念点・検討事項

| 項目 | 内容 |
|------|------|
| CORS | React Native の fetch は CORS 制約なし → HTML 取得は問題なし |
| SPA ページ | fetch では JS レンダリング後のコンテンツが取れないケースあり（許容） |
| API Key の漏洩リスク | Expo アプリはバンドルを逆コンパイルされるとキーが見える。使用量プランでレート制限をかけること（100req/day 等）で被害を最小化 |
| Lambda コールドスタート | Python + boto3 only で ~300ms。Bedrock 自体が 3〜8秒かかるため実質無視できる |
| モデル利用可能リージョン | Bedrock 3.5 Haiku は `ap-northeast-1`（東京）で利用可能 |
| EAS Build でのキー管理 | `eas secret:create --scope project --name EXPO_PUBLIC_RECALL_API_KEY` で登録 |
