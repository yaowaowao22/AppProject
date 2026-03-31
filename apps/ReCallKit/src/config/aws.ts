// ============================================================
// AWS設定
// プレースホルダ値はAWSコンソールから取得した値に置換すること
// ============================================================

export const AWS_REGION = 'ap-northeast-1' as const;

/** CognitoフェデレーテッドアイデンティティプールID（未認証アクセス用） */
export const COGNITO_IDENTITY_POOL_ID =
  'ap-northeast-1:30376610-eefd-4443-b7eb-6cf0cfcdb1ab' as const;

/** Lambda Function URL（SigV4認証付きエンドポイント） */
export const LAMBDA_FUNCTION_URL =
  'https://zqw7yo7u7mp7ctxi3elwx4pmda0vorub.lambda-url.ap-northeast-1.on.aws/' as const;

/**
 * AWSの設定値がプレースホルダのままでないかを確認する。
 * 両方の値が実際の値に置換されている場合のみ true を返す。
 */
export function isAwsConfigured(): boolean {
  return (
    !COGNITO_IDENTITY_POOL_ID.includes('xxxxxxxx') &&
    !LAMBDA_FUNCTION_URL.includes('xxxxxxxxxx')
  );
}
