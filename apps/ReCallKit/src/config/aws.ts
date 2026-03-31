// ============================================================
// AWS設定
// プレースホルダ値はAWSコンソールから取得した値に置換すること
// ============================================================

export const AWS_REGION = 'ap-northeast-1' as const;

/** CognitoフェデレーテッドアイデンティティプールID（未認証アクセス用） */
export const COGNITO_IDENTITY_POOL_ID =
  'ap-northeast-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' as const;

/** Lambda Function URL（SigV4認証付きエンドポイント） */
export const LAMBDA_FUNCTION_URL =
  'https://xxxxxxxxxx.lambda-url.ap-northeast-1.on.aws/' as const;
