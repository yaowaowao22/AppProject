// ============================================================
// Bedrock URL解析サービス
// Cognito未認証IDから一時認証情報を取得し、Lambda Function URLへSigV4署名付きリクエストを送信する
// ============================================================

import {
  CognitoIdentityClient,
  GetIdCommand,
  GetCredentialsForIdentityCommand,
} from '@aws-sdk/client-cognito-identity';
import { AwsClient } from 'aws4fetch';

import {
  AWS_REGION,
  COGNITO_IDENTITY_POOL_ID,
  LAMBDA_FUNCTION_URL,
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
// URL解析リクエスト
// ============================================================

export async function analyzeUrl(
  url: string,
): Promise<AnalysisResult> {
  const credentials = await getTemporaryCredentials();

  const awsClient = new AwsClient({
    accessKeyId: credentials.accessKeyId,
    secretAccessKey: credentials.secretAccessKey,
    sessionToken: credentials.sessionToken,
    service: 'lambda',
    region: AWS_REGION,
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45_000);

  try {
    const response = await awsClient.fetch(LAMBDA_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = (await response.json()) as AnalysisResult;
    return data;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('AI解析がタイムアウトしました（30秒）');
    }
    throw new Error('AI解析に失敗しました');
  } finally {
    clearTimeout(timeoutId);
  }
}
