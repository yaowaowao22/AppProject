# recall-kit-groq-proxy Lambda

ReCallKit (React Native) アプリから Groq Cloud の OpenAI 互換 Chat Completions API
(`/v1/chat/completions`) を呼び出すための薄い透過プロキシ Lambda。

クライアントに `GROQ_API_KEY` を持たせないことが唯一の目的。ロジックは最小限で、
バリデーションと allow-list、上流 Groq API への転送とエラー伝播のみを行う。

---

## 概要

- 関数名 (Lambda 上): `recall-kit-groq-proxy`
  - クライアント (`src/services/...`) はこの名前で `InvokeCommand` を発行する想定。
    **名前を変える場合は必ずクライアント設定も同時更新すること**。
- 呼び出し経路: AWS SDK (`@aws-sdk/client-lambda`) の `InvokeCommand`
- 認証: Cognito Identity Pool (unauth) → 一時 AWS クレデンシャル → Lambda Invoke
- 入出力の形:
  - **Event (payload)**: Groq の `/v1/chat/completions` リクエストボディそのまま
    ```json
    {
      "model": "llama-3.1-8b-instant",
      "messages": [
        {"role": "system", "content": "..."},
        {"role": "user",   "content": "..."}
      ],
      "temperature": 0.3,
      "max_tokens": 2500,
      "response_format": {"type": "json_object"}
    }
    ```
  - **Response**:
    ```json
    { "statusCode": 200, "body": "<Groq のレスポンスJSONを文字列化したもの>" }
    ```
  - **Error Response**:
    ```json
    { "statusCode": 400|401|413|429|500|504, "body": "{\"error\":\"...\"}" }
    ```

## 動作仕様 (サマリ)

| ケース                           | statusCode | body                                |
| -------------------------------- | ---------- | ----------------------------------- |
| 正常 (Groq 2xx)                  | 200        | Groq レスポンスボディ (文字列)       |
| `GROQ_API_KEY` 未設定             | 500        | `{"error": "GROQ_API_KEY env var not set"}` |
| 不正 JSON / 型不一致              | 400        | `{"error": "Invalid JSON body"}` ほか |
| `model` 欠落 / allow-list 外     | 400        | `{"error": "Model '...' is not allowed. ..."}` |
| `messages` 欠落 / 空              | 400        | `{"error": "'messages' field is required ..."}` |
| Groq 401 (キー不正)               | 401        | Groq のエラーメッセージ              |
| Groq 413 (ペイロード過大)         | 413        | Groq のエラーメッセージ              |
| Groq 429 (レートリミット)         | 429        | Groq のエラーメッセージ              |
| Groq その他 4xx/5xx               | そのまま    | Groq のエラーメッセージ              |
| ネットワークエラー / タイムアウト | 504        | `{"error": "Upstream Groq API timed out"}` |

### Allow-list モデル

悪用防止のため、以下のモデルのみ許可する（`handler.py` の `ALLOWED_MODELS`）:

- `llama-3.1-8b-instant`
- `llama-3.3-70b-versatile`

追加したい場合はセットに追記してから再デプロイする。

### タイムアウト

- Lambda 自体のタイムアウト: **60 秒** を推奨（デプロイコマンド参照）
- 上流 Groq への HTTP タイムアウト: **55 秒** (ハンドラ内定数 `GROQ_TIMEOUT_SEC`)
- クライアント (RN) 側も 60 秒を想定。調整する場合は 3 点 (client / Lambda / upstream) を揃えること。

---

## 環境変数

| 変数名         | 必須 | 説明                                                                           |
| -------------- | ---- | ------------------------------------------------------------------------------ |
| `GROQ_API_KEY` | 必須 | Groq Cloud で発行した API キー (`gsk_...`)。Lambda 設定 or Secrets Manager で注入。 |

> **推奨**: 長期運用するならキーは AWS Secrets Manager に置き、Lambda 起動時に読み出す形へ移行する。
> 初期構築では Lambda の Environment Variables 直挿しで OK。

---

## IAM 権限

### Lambda 実行ロール (関数自身が assume するロール)

基本の Lambda 実行ロール（CloudWatch Logs 書き込み権限）だけで十分。
Groq は外部 HTTPS のみ使用し、AWS リソース (S3/Bedrock 等) には触らない。

```
arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
```

### Invoke 側 (Cognito Identity Pool の unauth ロール)

クライアント (RN アプリ) が使う Cognito Identity Pool の unauth ロールに、
この Lambda を呼び出す許可を追加する必要がある:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "lambda:InvokeFunction",
      "Resource": "arn:aws:lambda:ap-northeast-1:ACCOUNT_ID:function:recall-kit-groq-proxy"
    }
  ]
}
```

> Identity Pool のポリシー管理はこのリポジトリのスコープ外。既存の `recall-kit-url-analyzer`
> と同じ Identity Pool を流用する場合は、同じポリシーに `recall-kit-groq-proxy` の ARN を
> 追加する形で更新すること。

---

## デプロイ

### 初回デプロイ

```bash
cd lambda/groq_proxy
zip -r groq_proxy.zip handler.py

aws lambda create-function \
  --function-name recall-kit-groq-proxy \
  --runtime python3.12 \
  --handler handler.lambda_handler \
  --zip-file fileb://groq_proxy.zip \
  --role arn:aws:iam::ACCOUNT:role/recall-kit-lambda-role \
  --timeout 60 \
  --memory-size 256 \
  --environment Variables={GROQ_API_KEY=gsk_...} \
  --region ap-northeast-1
```

> `ACCOUNT` と `gsk_...` は実値に置き換える。リージョンは既存 `recall-kit-url-analyzer`
> と揃えること (ap-northeast-1)。

### コード更新 (2 回目以降)

```bash
cd lambda/groq_proxy
zip -r groq_proxy.zip handler.py

aws lambda update-function-code \
  --function-name recall-kit-groq-proxy \
  --zip-file fileb://groq_proxy.zip \
  --region ap-northeast-1
```

### 環境変数だけ更新する場合

```bash
aws lambda update-function-configuration \
  --function-name recall-kit-groq-proxy \
  --environment Variables={GROQ_API_KEY=gsk_NEW_KEY} \
  --region ap-northeast-1
```

---

## ローカル smoke test

`handler.py` には `__main__` ブロックを同梱しており、依存なしで実行できる:

```bash
cd lambda/groq_proxy
python3 handler.py
```

- `GROQ_API_KEY` 未設定時のエラー、各種バリデーションエラーがすべて想定どおり返ることを確認する。
- 実際に Groq を叩きたい場合は `GROQ_API_KEY_REAL=gsk_...` を環境変数にセットして実行する
  (本番キーは直接 `GROQ_API_KEY` には入れないこと — ハンドラ内のネガティブテストと競合するため)。

---

## 依存関係

**なし**。標準ライブラリ (`json`, `os`, `urllib.request`, `urllib.error`) のみで動作する。
`requirements.txt` は不要。ZIP に `handler.py` を入れてアップロードするだけで完結する。

---

## 関連ファイル

- `lambda/recall_analyzer/handler.py` — 既存の URL → Bedrock 解析 Lambda (参考実装)
- `src/services/bedrockAnalysisService.ts` — 既存の LambdaClient 呼び出し側実装 (Groq 版も同じパターンで実装予定)
