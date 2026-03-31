# 設計書：URL解析 × AWS Bedrock 連携

作成日: 2026-03-31  
更新日: 2026-03-31（認証方式を Cognito Identity Pool に刷新）

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

## 3. なぜ API Key をアプリに入れてはいけないか

```
EXPO_PUBLIC_* 変数はビルド時にバンドルへ平文埋め込みされる
  → アプリを逆コンパイルすれば誰でも取得可能
  → EAS Secrets も「ビルド時にバンドルへ展開」なので同じ
  → レート制限は被害を減らすだけで根本解決にならない

モバイルアプリに静的な秘密情報を入れる方法は存在しない。
```

**AWS 公式推奨パターン：Cognito Identity Pool（一時認証情報）**  
アプリに入れるのは「Identity Pool ID」のみ。これは**公開情報**（エンドポイント名）であり秘密ではない。

---

## 4. アーキテクチャ：Lambda + Cognito Identity Pool（確定）

### 全体構成図

```
┌──────────────────────────────────────────┐
│  ReCallKit (Expo / RN)                   │
│                                          │
│  1. fetch(url) → HTML取得                │
│  2. 本文テキスト抽出                      │
│  3. Cognito に一時認証情報をリクエスト    │
│     IdentityPoolId（公開情報）            │
└────────────┬─────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│  Amazon Cognito Identity Pool            │
│  （Unauthenticated Identities 有効）      │
│                                          │
│  ・デバイスごとに固有の Identity を発行  │
│  ・AccessKeyId / SecretKey /             │
│    SessionToken を返す（TTL: 15分）      │
│  ・15分後に自動失効、自動更新            │
└────────────┬─────────────────────────────┘
             │ 一時認証情報（STS）
             ▼
┌──────────────────────────────────────────┐
│  ReCallKit (続き)                        │
│                                          │
│  4. Lambda Function URL へ POST          │
│     SigV4 署名（一時認証情報で署名）      │
│     ※ 静的なキーは一切含まない           │
└────────────┬─────────────────────────────┘
             │ HTTPS + SigV4署名
             ▼
┌──────────────────────────────────────────┐
│  Lambda Function URL                     │
│  auth_type: AWS_IAM                      │
│                                          │
│  ・SigV4署名を検証（IAM認証）            │
│  ・Cognito Identity ごとにレート制限     │
│  ・HTML本文 → Bedrock へ送信             │
│  ・Q&A JSON を返す                       │
│                                          │
│  IAM実行ロール:                           │
│    bedrock:InvokeModel のみ              │
└────────────┬─────────────────────────────┘
             │ boto3
             ▼
┌──────────────────────────────────────────┐
│  AWS Bedrock                             │
│  Claude 3.5 Haiku                        │
│  ap-northeast-1（東京）                  │
└──────────────────────────────────────────┘
```

### なぜ API Gateway を使わないか

Lambda Function URL（2022年〜）を使うことで API Gateway 不要。
- コスト削減（API Gateway は $1/100万req）
- IAM 認証を Lambda Function URL 単体で実現できる
- 設定がシンプル

---

## 5. 使用モデル

| | モデル ID | 備考 |
|-|----------|------|
| AImensetu 現在 | `anthropic.claude-3-haiku-20240307-v1:0` | Claude 3 Haiku（触らない） |
| **ReCallKit 採用** | `anthropic.claude-3-5-haiku-20241022-v1:0` | Claude 3.5 Haiku、3.0比でQ&A品質が明確に高い |

---

## 6. コスト試算

**Bedrock Claude 3.5 Haiku（2025年時点）**
- Input: $0.00080 / 1K tok
- Output: $0.00400 / 1K tok

| シナリオ | 合計/ページ | 合計/月（100ページ） |
|---------|-----------|-------------------|
| 記事10,000字＋プロンプト（~13,800 tok in / ~800 tok out） | **≒$0.014（約2円）** | **≒$1.40（約210円）** |

**Lambda + Cognito 追加コスト**
- Lambda 実行: 月100回 → $0（無料枠 100万回/月）
- Lambda Function URL: 追加コストなし
- Cognito Identity Pool: $0（月50,000 MAU まで無料）

---

## 7. IAM・認証の設定詳細

### 7-1. Cognito Identity Pool の Unauthenticated ロール

Cognito が発行する一時認証情報に付与する IAM ポリシー:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "lambda:InvokeFunctionUrl",
      "Resource": "arn:aws:lambda:ap-northeast-1:{ACCOUNT_ID}:function:recall-kit-analyzer"
    }
  ]
}
```

**Lambda の呼び出し権限のみ**。Bedrock・S3・その他すべて拒否。

### 7-2. Lambda 実行ロール（Lambda → Bedrock）

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
      "Action": ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

### 7-3. Lambda Function URL の設定

```
AuthType: AWS_IAM
CORS: オリジン = * （React Native は origin なし）
```

Resource-based policy（Cognito の Unauthenticated ロールのみ許可）:
```json
{
  "Effect": "Allow",
  "Principal": {
    "AWS": "arn:aws:iam::{ACCOUNT_ID}:role/recall-kit-cognito-unauth-role"
  },
  "Action": "lambda:InvokeFunctionUrl",
  "Resource": "arn:aws:lambda:ap-northeast-1:{ACCOUNT_ID}:function:recall-kit-analyzer"
}
```

---

## 8. アプリ側の認証フロー（コード概要）

### インストールするパッケージ

```bash
# 一時認証情報の取得
npm install @aws-sdk/client-cognito-identity \
            @aws-sdk/credential-provider-cognito-identity

# SigV4 署名済み fetch
npm install aws4fetch
# または @aws-sdk/signature-v4 + @aws-sdk/protocol-http
```

### アプリに含める情報（これだけ・秘密なし）

```typescript
// src/config/aws.ts
// Identity Pool ID は公開情報（エンドポイント名）
export const COGNITO_IDENTITY_POOL_ID =
  'ap-northeast-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

export const LAMBDA_FUNCTION_URL =
  'https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.lambda-url.ap-northeast-1.on.aws/';

export const AWS_REGION = 'ap-northeast-1';
```

### 認証情報の取得と Lambda 呼び出し

```typescript
// src/services/bedrockAnalysisService.ts（概要）
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';

// 一時認証情報プロバイダー（15分TTLで自動更新）
const credentials = fromCognitoIdentityPool({
  client: new CognitoIdentityClient({ region: AWS_REGION }),
  identityPoolId: COGNITO_IDENTITY_POOL_ID,
});

// SigV4署名 → Lambda Function URL へ POST
// aws4fetch ライブラリが署名を自動付与
```

---

## 9. Lambda 関数の仕様

### エンドポイント

```
POST https://{function-url}.lambda-url.ap-northeast-1.on.aws/

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

### Lambda 構成（Python）

```
lambda/
  recall_analyzer/
    handler.py        ← boto3 で Bedrock 呼び出し（~60行）
    requirements.txt  ← 空（boto3 は Lambda ランタイム標準）
```

---

## 10. ReCallKit 実装コンポーネント一覧

```
src/config/aws.ts                        ← 新規：公開設定値（PoolID・FunctionURL）
src/services/bedrockAnalysisService.ts   ← 新規：Cognito認証 + Lambda呼び出し
src/screens/add/URLPreviewScreen.tsx     ← 新規：Q&Aプレビュー＋保存画面
src/navigation/types.ts                  ← 変更：URLPreviewScreen 型追加
src/navigation/stacks/LibraryStack.tsx   ← 変更：画面スタック追加
src/screens/add/AddItemScreen.tsx        ← 変更：[AI解析]ボタン追加
```

**.gitignore への追加は不要**（秘密情報をアプリに含めないため）。

---

## 11. HTMLテキスト抽出（クライアント側）

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

## 12. データモデル（追加変更なし）

既存スキーマ（v2）で対応可能:

```
items テーブル:
  type       = 'url'
  title      = "Q: {question}"
  content    = "Q: {question}\n\nA: {answer}"
  excerpt    = answer の先頭100文字
  source_url = 元URL
```

複数Q&Aを選択して保存 → items を複数行 INSERT。

---

## 13. 実装ステップ（優先順）

| ステップ | 内容 | 場所 |
|---------|------|------|
| ① | Cognito Identity Pool 作成（Unauthenticated 有効） | AWS Console |
| ② | Unauthenticated ロールに lambda:InvokeFunctionUrl のみ付与 | IAM |
| ③ | Lambda 実行ロール作成（bedrock:InvokeModel のみ） | IAM |
| ④ | Lambda 関数 `recall-kit-analyzer` 作成・Function URL 有効化（AWS_IAM） | AWS Console / CLI |
| ⑤ | Lambda Function URL の Resource-based policy 設定 | AWS Console |
| ⑥ | `src/config/aws.ts` 新規作成（PoolID と FunctionURL を記載） | ReCallKit |
| ⑦ | SDK パッケージインストール（cognito-identity + aws4fetch） | ReCallKit |
| ⑧ | `bedrockAnalysisService.ts` 新規作成 | ReCallKit |
| ⑨ | `URLPreviewScreen.tsx` 新規作成 | ReCallKit |
| ⑩ | ナビゲーション・AddItemScreen 修正 | ReCallKit |

---

## 14. 懸念点・検討事項

| 項目 | 内容 |
|------|------|
| Unauthenticated Identity の濫用 | Identity Pool ID が公開されていても、発行される一時認証情報は「この Lambda だけ呼べる」スコープ。Lambda 内でリクエストのレート制限を追加可能 |
| CORS | React Native の fetch は CORS 制約なし → HTML 取得は問題なし |
| SPA ページ | fetch では JS レンダリング後のコンテンツが取れないケースあり（許容） |
| Lambda コールドスタート | Python + boto3 only で ~300ms。Bedrock 自体が 3〜8秒かかるため実質無視できる |
| モデル利用可能リージョン | Bedrock 3.5 Haiku は `ap-northeast-1`（東京）で利用可能 |
| Cognito Identity の永続化 | SDK が自動でデバイスにキャッシュ。アンインストールで消える（問題なし） |
