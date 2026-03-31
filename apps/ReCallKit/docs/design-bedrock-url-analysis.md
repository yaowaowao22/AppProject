# 設計書：URL解析 × AWS Bedrock 連携 + リワード広告

作成日: 2026-03-31  
更新日: 2026-03-31（AWS インフラ構成・リワード広告実装を追加）

> **別セッション向けメモ**: この設計書を読めば実装に必要な情報が揃っている。  
> 実装順序は「セクション13 実装ステップ」を参照。

---

## 1. やりたいこと（ゴール）

URL を入力するだけで、そのページの内容を**学習用Q&Aカード**に自動変換する。
AI解析はリワード広告視聴後に実行できる（1日3回まで無料、以降は広告で追加解放）。

---

## 2. ユーザー体験フロー

```
AddItemScreen
  └─ URLタイプ選択 → URL入力（OGPタイトル自動取得：実装済み）
       └─ [AI解析] ボタンタップ
            ├─ 本日の無料枠あり（3回/日）→ そのまま解析
            └─ 無料枠消費済み → リワード広告を視聴（~30秒）
                 └─ 広告視聴完了 → URLPreviewScreen（新画面）
                      ├─ Lambda 呼び出し中: "AIが解析しています..."
                      └─ 完了後:
                           ┌─────────────────────────┐
                           │  📄 ページタイトル       │
                           │  要約: 1〜2行            │
                           ├─────────────────────────┤
                           │  ☑ Q: ○○とは何か？      │
                           │    A: ～～～             │
                           │  ☐ Q: ～なぜ重要か？    │
                           │    A: ～～～             │
                           │  ☑ Q: ～の手順は？      │
                           │    A: ～～～             │
                           └─────────────────────────┘
                      [選択した項目を保存] → LibraryScreen
```

---

## 3. アーキテクチャ：Lambda + Cognito Identity Pool（確定）

### なぜ API Key をアプリに入れてはいけないか

```
EXPO_PUBLIC_* 変数はビルド時にバンドルへ平文埋め込み
EAS Secrets も「ビルド時に展開」→ 結果は同じ
→ アプリを逆コンパイルすれば誰でも取得可能
→ モバイルアプリに静的な秘密情報を入れる方法は存在しない
```

**正解: Cognito Identity Pool（一時認証情報）**  
アプリに含めるのは Identity Pool ID のみ（公開情報）。秘密は一切含まない。

### 全体構成図

```
┌──────────────────────────────────────────┐
│  ReCallKit (Expo / RN)                   │
│                                          │
│  1. fetch(url) → HTML取得                │
│  2. 本文テキスト抽出（最大4000文字）      │
│  3. Cognito に一時認証情報をリクエスト    │
│     IdentityPoolId（公開情報、秘密でない）│
└────────────┬─────────────────────────────┘
             ↓
┌──────────────────────────────────────────┐
│  Amazon Cognito Identity Pool            │
│  recall-kit-pool（ap-northeast-1）       │
│  Unauthenticated Identities: 有効        │
│                                          │
│  → デバイスごとに固有 Identity を発行    │
│  → AccessKeyId / SecretKey /             │
│     SessionToken を返す（TTL: 15分）     │
└────────────┬─────────────────────────────┘
             ↓ 一時認証情報（STS）
┌──────────────────────────────────────────┐
│  ReCallKit（続き）                       │
│  4. Lambda Function URL へ POST          │
│     SigV4 署名（一時認証情報で署名）      │
│     静的なキーは一切含まない             │
└────────────┬─────────────────────────────┘
             ↓ HTTPS + SigV4署名
┌──────────────────────────────────────────┐
│  Lambda Function URL                     │
│  recall-kit-analyzer                     │
│  auth_type: AWS_IAM                      │
│  region: ap-northeast-1                  │
│                                          │
│  ・SigV4署名を検証（IAM認証）            │
│  ・HTML本文 → プロンプト生成             │
│  ・Bedrock Haiku 3.5 呼び出し            │
│  ・Q&A JSON を返す                       │
└────────────┬─────────────────────────────┘
             ↓ boto3
┌──────────────────────────────────────────┐
│  AWS Bedrock                             │
│  anthropic.claude-3-5-haiku-20241022-v1:0│
│  ap-northeast-1（東京）                  │
└──────────────────────────────────────────┘
```

---

## 4. 使用モデル

| | モデル ID | 備考 |
|-|----------|------|
| AImensetu 現在 | `anthropic.claude-3-haiku-20240307-v1:0` | Claude 3 Haiku（触らない） |
| **ReCallKit 採用** | `anthropic.claude-3-5-haiku-20241022-v1:0` | Claude 3.5 Haiku、品質向上・料金同等 |

---

## 5. コスト試算

**Bedrock Claude 3.5 Haiku（2025年時点）**

| 合計/ページ | 合計/月（100ページ） |
|-----------|-------------------|
| **≒$0.014（約2円）** | **≒$1.40（約210円）** |

Lambda + Cognito は月100回なら実質 **$0**（無料枠内）。

---

## 6. AWS インフラ構成

### 6-1. 作成が必要な AWS リソース一覧

| リソース | 名前 | 設定 |
|---------|------|------|
| IAM Role（Lambda用） | `recall-kit-lambda-role` | bedrock:InvokeModel + CloudWatch Logs |
| IAM Role（Cognito Unauth用） | `recall-kit-cognito-unauth-role` | lambda:InvokeFunctionUrl のみ |
| Lambda Function | `recall-kit-analyzer` | Python 3.12、タイムアウト30秒、メモリ256MB |
| Lambda Function URL | （Lambda に紐づけ） | AuthType: AWS_IAM |
| Cognito Identity Pool | `recall-kit-pool` | Unauthenticated: 有効 |

### 6-2. Lambda ファイル構成（リポジトリ内）

```
apps/ReCallKit/
  lambda/
    recall_analyzer/
      handler.py          ← メイン処理（boto3 で Bedrock 呼び出し）
      requirements.txt    ← 空ファイル（boto3 は Lambda 標準搭載）
    deploy.sh             ← zip 化 → aws lambda update-function-code
```

### 6-3. デプロイコマンド（Lambda）

**初回作成:**
```bash
# 1. IAM ロール作成（AWS Console 推奨、CLIの場合）
aws iam create-role \
  --role-name recall-kit-lambda-role \
  --assume-role-policy-document file://trust-policy.json

# 2. Lambda 関数デプロイ
cd apps/ReCallKit/lambda/recall_analyzer
zip -r function.zip handler.py

aws lambda create-function \
  --function-name recall-kit-analyzer \
  --runtime python3.12 \
  --handler handler.lambda_handler \
  --zip-file fileb://function.zip \
  --role arn:aws:iam::{ACCOUNT_ID}:role/recall-kit-lambda-role \
  --timeout 30 \
  --memory-size 256 \
  --region ap-northeast-1

# 3. Function URL 有効化（AWS_IAM 認証）
aws lambda create-function-url-config \
  --function-name recall-kit-analyzer \
  --auth-type AWS_IAM \
  --cors '{"AllowOrigins":["*"],"AllowMethods":["POST"],"AllowHeaders":["*"]}' \
  --region ap-northeast-1
```

**コード更新時:**
```bash
cd apps/ReCallKit/lambda/recall_analyzer
zip -r function.zip handler.py
aws lambda update-function-code \
  --function-name recall-kit-analyzer \
  --zip-file fileb://function.zip \
  --region ap-northeast-1
```

### 6-4. Cognito Identity Pool 作成

```bash
# Identity Pool 作成
aws cognito-identity create-identity-pool \
  --identity-pool-name "recall-kit-pool" \
  --allow-unauthenticated-identities \
  --region ap-northeast-1
# → IdentityPoolId が返る（例: ap-northeast-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx）
# → src/config/aws.ts の COGNITO_IDENTITY_POOL_ID に記入

# Unauthenticated ロールを紐づけ（AWS Console の方が簡単）
aws cognito-identity set-identity-pool-roles \
  --identity-pool-id ap-northeast-1:xxxxx \
  --roles unauthenticated=arn:aws:iam::{ACCOUNT_ID}:role/recall-kit-cognito-unauth-role \
  --region ap-northeast-1
```

### 6-5. IAM ポリシー詳細

**Lambda 実行ロール (`recall-kit-lambda-role`):**
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
      "Resource": "arn:aws:logs:ap-northeast-1:*:*"
    }
  ]
}
```

**Cognito Unauthenticated ロール (`recall-kit-cognito-unauth-role`):**
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

**Lambda Function URL Resource-based policy（Cognito ロールのみ許可）:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::{ACCOUNT_ID}:role/recall-kit-cognito-unauth-role"
      },
      "Action": "lambda:InvokeFunctionUrl",
      "Resource": "arn:aws:lambda:ap-northeast-1:{ACCOUNT_ID}:function:recall-kit-analyzer",
      "Condition": {
        "StringEquals": {"lambda:FunctionUrlAuthType": "AWS_IAM"}
      }
    }
  ]
}
```

---

## 7. Lambda 関数仕様

### エンドポイント

```
POST https://{function-url-id}.lambda-url.ap-northeast-1.on.aws/

Request Body:
{
  "url": "https://example.com/article",
  "text": "記事本文テキスト（最大4000文字）"
}

Response 200:
{
  "title": "ページタイトル",
  "summary": "1〜2行の要約",
  "qa_pairs": [
    { "question": "○○とは何ですか？", "answer": "～～" }
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
- 1問1答で簡潔に（Aは3文以内）
- 日本語で生成すること

出力はJSON配列のみ（説明文不要）:
[{"question": "...", "answer": "..."}]

URL: {url}
本文:
{text}
```

---

## 8. アプリ側の認証フロー

### 追加パッケージ（ReCallKit）

```bash
npx expo install \
  @aws-sdk/client-cognito-identity \
  @aws-sdk/credential-provider-cognito-identity \
  aws4fetch
```

### アプリに含める情報（秘密情報ゼロ）

```typescript
// src/config/aws.ts
// ※ 以下はすべて公開情報（秘密でない）
export const AWS_REGION = 'ap-northeast-1';

// Cognito Identity Pool 作成後に記入
export const COGNITO_IDENTITY_POOL_ID =
  'ap-northeast-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

// Lambda Function URL 作成後に記入
export const LAMBDA_ANALYZER_URL =
  'https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.lambda-url.ap-northeast-1.on.aws/';
```

### 呼び出しフロー概要（bedrockAnalysisService.ts）

```typescript
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';
import { AwsClient } from 'aws4fetch';

const cognitoClient = new CognitoIdentityClient({ region: AWS_REGION });

// 一時認証情報プロバイダー（15分TTL・自動更新）
const credentialProvider = fromCognitoIdentityPool({
  client: cognitoClient,
  identityPoolId: COGNITO_IDENTITY_POOL_ID,
});

export async function analyzeUrl(url: string, text: string): Promise<AnalysisResult | null> {
  const creds = await credentialProvider();
  const aws = new AwsClient({
    accessKeyId: creds.accessKeyId,
    secretAccessKey: creds.secretAccessKey,
    sessionToken: creds.sessionToken,
    region: AWS_REGION,
    service: 'lambda',
  });
  const res = await aws.fetch(LAMBDA_ANALYZER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, text }),
  });
  if (!res.ok) return null;
  return res.json();
}
```

---

## 9. リワード広告実装

### 9-1. 方針

- AI解析は **1日3回まで無料**（AsyncStorage で日次カウント管理）
- 上限到達後は **リワード広告を視聴** することで追加解析1回を解放
- 実装パターンは **AImensetu mobile から移植**（ほぼそのままコピー可）

### 9-2. 参照元（AImensetu）

```
C:\Users\ytata\Project\AImensetu\mobile\src\hooks\useRewardedAd.ts
C:\Users\ytata\Project\AImensetu\mobile\src\screens\other\TokenScreen.tsx
```

AImensetu の `useRewardedAd.ts` の構造:
- モジュールレベルのシングルトンで広告を事前ロード
- `EARNED_REWARD` イベントで報酬付与
- `CLOSED` イベントで次の広告を自動プリロード
- ReCallKit では**バックエンド API 不要**（ローカル解析カウントのみ）

### 9-3. 必要パッケージ

```bash
npx expo install \
  react-native-google-mobile-ads \
  expo-tracking-transparency
```

### 9-4. AdMob 設定

**AImensetu の AdMob アカウント（Publisher ID: `ca-app-pub-6549870597795219`）を共用**

ReCallKit 用に AdMob Console で新規アプリ・新規広告ユニットを作成する:

| | テスト（開発中） | 本番（要作成） |
|--|---------|------|
| iOS App ID | `ca-app-pub-3940256099942544~1458002511` | 新規作成 |
| Android App ID | `ca-app-pub-3940256099942544~3347511713` | 新規作成 |
| iOS Rewarded Ad Unit | `ca-app-pub-3940256099942544/1712485313` | 新規作成 |
| Android Rewarded Ad Unit | `ca-app-pub-3940256099942544/5224354917` | 新規作成 |

> ※ テスト ID は Google 公式のもので固定。本番は AdMob Console → アプリ追加 → 広告ユニット作成で取得。

### 9-5. app.json への追加

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-google-mobile-ads",
        {
          "androidAppId": "ca-app-pub-XXXXXXXX~XXXXXXXXXX",
          "iosAppId": "ca-app-pub-XXXXXXXX~XXXXXXXXXX"
        }
      ],
      "expo-tracking-transparency"
    ]
  }
}
```

### 9-6. 実装ファイル

```
src/hooks/useRewardedAd.ts          ← AImensetu から移植・ReCallKit用に改変
  主な変更点:
  - AD_REWARD_AMOUNT 削除（ポイント概念なし）
  - EARNED_REWARD → AsyncStorage で解析カウントを +1
  - api.post('/tokens/earn') 削除
  - 本番 Ad Unit ID を ReCallKit 用に変更

src/utils/analysisLimit.ts          ← 新規
  - 1日の解析回数管理（AsyncStorage）
  - getRemainingCount(): Promise<number>
  - consumeOne(): Promise<void>
  - resetIfNewDay(): Promise<void>
```

### 9-7. 広告フロー（AddItemScreen 側）

```typescript
const handleAnalyze = async () => {
  const remaining = await getRemainingCount();
  if (remaining > 0) {
    await consumeOne();
    navigation.push('URLPreview', { url: sourceUrl, text: extractedText });
  } else {
    // リワード広告を視聴
    const result = await showAd();
    if (result.earned) {
      navigation.push('URLPreview', { url: sourceUrl, text: extractedText });
    }
  }
};
```

---

## 10. HTML テキスト抽出（urlMetadataService.ts 拡張）

```typescript
// 優先度順に本文を抽出
1. <article> 内のテキスト
2. <main> 内のテキスト
3. <p> タグ群のテキスト

// 除外タグ
<nav>, <header>, <footer>, <script>, <style>, <aside>, <iframe>

// 最大4000文字でトリム
```

---

## 11. ReCallKit 実装ファイル一覧

```
AWS インフラ側:
  apps/ReCallKit/lambda/
    recall_analyzer/
      handler.py          ← Lambda メイン（新規）
      requirements.txt    ← 空（boto3 は Lambda 標準）
    deploy.sh             ← zip → update-function-code（新規）

モバイル側:
  src/config/aws.ts                        ← 新規（PoolID・FunctionURL 記載）
  src/services/bedrockAnalysisService.ts   ← 新規（Cognito認証 + Lambda呼び出し）
  src/services/urlMetadataService.ts       ← 変更（本文抽出ロジック追加）
  src/hooks/useRewardedAd.ts               ← 新規（AImensetu から移植）
  src/utils/analysisLimit.ts               ← 新規（1日制限管理）
  src/screens/add/URLPreviewScreen.tsx     ← 新規（Q&Aプレビュー・保存）
  src/navigation/types.ts                  ← 変更（URLPreviewScreen 型追加）
  src/navigation/stacks/LibraryStack.tsx   ← 変更（画面追加）
  src/screens/add/AddItemScreen.tsx        ← 変更（[AI解析]ボタン追加）
```

---

## 12. データモデル（追加変更なし）

既存スキーマ（v2）で対応可能:

```
items テーブル（1Q&Aペアにつき1行INSERT）:
  type       = 'url'
  title      = "Q: {question}"
  content    = "Q: {question}\n\nA: {answer}"
  excerpt    = answer の先頭100文字
  source_url = 元URL
```

---

## 13. 実装ステップ（別セッション向け）

### Phase 1: AWS セットアップ（コードなし、Console作業）

| # | 作業 | 場所 |
|---|------|------|
| 1 | IAM ロール `recall-kit-lambda-role` 作成（ポリシー: セクション6-5参照） | AWS Console > IAM |
| 2 | IAM ロール `recall-kit-cognito-unauth-role` 作成 | AWS Console > IAM |
| 3 | Lambda 関数 `recall-kit-analyzer` 作成（Python 3.12、30秒、256MB） | AWS Console > Lambda |
| 4 | Lambda Function URL 有効化（AuthType: AWS_IAM） | Lambda > 設定 > 関数URL |
| 5 | Function URL の Resource-based policy 設定（セクション6-5参照） | Lambda > 設定 > アクセス権限 |
| 6 | Cognito Identity Pool `recall-kit-pool` 作成（Unauth有効） | AWS Console > Cognito |
| 7 | Cognito に Unauth ロールを紐づけ | Cognito > Identity Pool > 編集 |
| 8 | AdMob Console でアプリ追加 + リワード広告ユニット作成 | admob.google.com |

### Phase 2: Lambda コード実装

| # | 作業 | ファイル |
|---|------|---------|
| 9 | handler.py 実装（boto3 + Bedrock + プロンプト） | `lambda/recall_analyzer/handler.py` |
| 10 | deploy.sh 作成・実行 | `lambda/deploy.sh` |

### Phase 3: モバイル実装

| # | 作業 | ファイル |
|---|------|---------|
| 11 | パッケージインストール（セクション8参照） | - |
| 12 | aws.ts に PoolID と FunctionURL を記入 | `src/config/aws.ts` |
| 13 | urlMetadataService.ts に本文抽出を追加 | 既存ファイル |
| 14 | analysisLimit.ts 実装（1日制限） | `src/utils/analysisLimit.ts` |
| 15 | useRewardedAd.ts 移植・修正 | `src/hooks/useRewardedAd.ts` |
| 16 | app.json に AdMob プラグイン追加 | `app.json` |
| 17 | bedrockAnalysisService.ts 実装 | `src/services/bedrockAnalysisService.ts` |
| 18 | URLPreviewScreen.tsx 実装 | `src/screens/add/URLPreviewScreen.tsx` |
| 19 | ナビゲーション追加・AddItemScreen 修正 | types.ts / LibraryStack.tsx / AddItemScreen.tsx |
| 20 | tsc --noEmit で型チェック | - |

---

## 14. 懸念点・メモ

| 項目 | 内容 |
|------|------|
| Cognito Unauth の濫用 | Pool ID 公開でも一時認証情報は Lambda呼び出しのみスコープ。Lambda でレート制限追加も可能 |
| SPA ページ | fetch では JS レンダリング後のコンテンツ取得不可（許容） |
| Lambda コールドスタート | ~300ms。Bedrock 自体が 3〜8秒かかるため無視できる |
| ATT（iOS 追跡許可） | `expo-tracking-transparency` で広告前に許可ダイアログ表示（AImensetu と同パターン） |
| AdMob 本番 ID | AdMob Console でアプリ審査が必要な場合あり。テスト ID で開発を進め、審査後に差し替え |
| Bedrock リージョン | 3.5 Haiku は `ap-northeast-1`（東京）で利用可能（2025年確認済み） |
