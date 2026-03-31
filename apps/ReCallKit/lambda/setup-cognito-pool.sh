#!/bin/bash
# Cognito Identity Pool 作成 & ロール紐付けスクリプト
# 実行前提: yaowaowao02 に AdministratorAccess または必要な Cognito 権限が付与済みであること

set -e

POOL_NAME="recall-kit-pool"
ACCOUNT_ID="376408658186"
UNAUTH_ROLE_NAME="recall-kit-unauthenticated-role"
UNAUTH_ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${UNAUTH_ROLE_NAME}"
INFO_FILE=".aws-account-info.json"

echo "=== Cognito Identity Pool 作成 ==="

# Identity Pool を作成（未認証アクセスを許可）
POOL_JSON=$(aws cognito-identity create-identity-pool \
  --identity-pool-name "${POOL_NAME}" \
  --allow-unauthenticated-identities \
  --region ap-northeast-1)

echo "作成完了:"
echo "${POOL_JSON}"

IDENTITY_POOL_ID=$(echo "${POOL_JSON}" | python -c "import sys, json; print(json.load(sys.stdin)['IdentityPoolId'])")
echo ""
echo "Identity Pool ID: ${IDENTITY_POOL_ID}"

# 未認証ロールを Identity Pool に紐付け
echo ""
echo "=== 未認証ロールを紐付け ==="
aws cognito-identity set-identity-pool-roles \
  --identity-pool-id "${IDENTITY_POOL_ID}" \
  --roles "unauthenticated=${UNAUTH_ROLE_ARN}" \
  --region ap-northeast-1

echo "ロール紐付け完了: ${UNAUTH_ROLE_ARN}"

# .aws-account-info.json に Identity Pool ID を追記
echo ""
echo "=== ${INFO_FILE} を更新 ==="
python - <<EOF
import json

with open("${INFO_FILE}", "r") as f:
    data = json.load(f)

data["identityPoolId"] = "${IDENTITY_POOL_ID}"
data["unauthRoleArn"] = "${UNAUTH_ROLE_ARN}"

with open("${INFO_FILE}", "w") as f:
    json.dump(data, f, indent=2)

print("更新後の内容:")
print(json.dumps(data, indent=2))
EOF

echo ""
echo "=== 完了 ==="
echo "Identity Pool ID: ${IDENTITY_POOL_ID}"
echo "${INFO_FILE} に identityPoolId を追記しました"
