// ============================================================
// Bedrock URL解析サービス
// Cognito未認証IDから一時認証情報を取得し、Lambda SDK経由で呼び出す
// aws4fetch は React Native の crypto.subtle 非対応のため使用しない
// ============================================================

import {
  CognitoIdentityClient,
  GetIdCommand,
  GetCredentialsForIdentityCommand,
} from '@aws-sdk/client-cognito-identity';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

import {
  AWS_REGION,
  COGNITO_IDENTITY_POOL_ID,
  LAMBDA_FUNCTION_NAME,
} from '../config/aws';
import type { AnalysisResult } from '../types/analysis';

// ============================================================
// 認証情報キャッシュ
// ============================================================

interface CachedCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expiration: Date;
}

let credentialsCache: CachedCredentials | null = null;

// ============================================================
// 一時認証情報の取得（期限切れなら再取得）
// ============================================================

export async function getTemporaryCredentials(): Promise<CachedCredentials> {
  const now = new Date();
  // 有効期限の1分前まで再利用
  if (
    credentialsCache !== null &&
    credentialsCache.expiration > new Date(now.getTime() + 60 * 1000)
  ) {
    return credentialsCache;
  }

  const client = new CognitoIdentityClient({ region: AWS_REGION });

  // 1. 未認証IdentityIDを取得
  const getIdResponse = await client.send(
    new GetIdCommand({ IdentityPoolId: COGNITO_IDENTITY_POOL_ID }),
  );

  if (!getIdResponse.IdentityId) {
    throw new Error('Cognito Identity IDの取得に失敗しました');
  }

  // 2. 一時認証情報を取得
  const credsResponse = await client.send(
    new GetCredentialsForIdentityCommand({
      IdentityId: getIdResponse.IdentityId,
    }),
  );

  const creds = credsResponse.Credentials;
  if (
    !creds?.AccessKeyId ||
    !creds?.SecretKey ||
    !creds?.SessionToken ||
    !creds?.Expiration
  ) {
    throw new Error('一時認証情報の取得に失敗しました');
  }

  credentialsCache = {
    accessKeyId: creds.AccessKeyId,
    secretAccessKey: creds.SecretKey,
    sessionToken: creds.SessionToken,
    expiration: creds.Expiration,
  };

  return credentialsCache;
}

// ============================================================
// URL解析リクエスト（Lambda SDK 経由）
// ============================================================

export async function analyzeUrl(url: string): Promise<AnalysisResult> {
  const credentials = await getTemporaryCredentials();

  const lambda = new LambdaClient({
    region: AWS_REGION,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
    },
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60_000);

  try {
    const command = new InvokeCommand({
      FunctionName: LAMBDA_FUNCTION_NAME,
      Payload: JSON.stringify({ url }),
    });

    const response = await lambda.send(command, {
      abortSignal: controller.signal,
    });

    // Lambda 実行エラー（Unhandled Exception 等）
    if (response.FunctionError) {
      const raw = new TextDecoder().decode(response.Payload);
      let body: { errorMessage?: string };
      try {
        body = JSON.parse(raw) as { errorMessage?: string };
      } catch {
        throw new Error(
          `Lambdaエラーレスポンスのパースに失敗しました（生データ: ${raw.slice(0, 100)}）`,
        );
      }
      throw new Error(body.errorMessage ?? 'Lambda実行エラー');
    }

    // ハンドラーが返す { statusCode, body } をパース
    const raw = new TextDecoder().decode(response.Payload);
    let lambdaResp: { statusCode: number; body: string };
    try {
      lambdaResp = JSON.parse(raw) as { statusCode: number; body: string };
    } catch {
      throw new Error(
        `Lambdaレスポンスのパースに失敗しました（生データ: ${raw.slice(0, 100)}）`,
      );
    }

    if (lambdaResp.statusCode !== 200) {
      let errBody: { error?: string };
      try {
        errBody = JSON.parse(lambdaResp.body) as { error?: string };
      } catch {
        throw new Error(
          `エラーボディのパースに失敗しました（HTTP ${lambdaResp.statusCode}）`,
        );
      }
      throw new Error(errBody.error ?? `サーバーエラー (HTTP ${lambdaResp.statusCode})`);
    }

    let analysisResult: AnalysisResult;
    try {
      analysisResult = JSON.parse(lambdaResp.body) as AnalysisResult;
    } catch {
      throw new Error('解析結果のパースに失敗しました（bodyが不正なJSONです）');
    }
    return analysisResult;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('AI解析がタイムアウトしました（60秒）');
    }
    if (err instanceof Error) throw err;
    throw new Error('AI解析に失敗しました');
  } finally {
    clearTimeout(timeoutId);
  }
}
