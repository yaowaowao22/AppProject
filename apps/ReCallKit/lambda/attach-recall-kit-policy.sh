#!/bin/bash
# ReCallKit カスタマー管理ポリシー作成 & yaowaowao02 にアタッチ
# 実行前提: aws configure 済み (root or Admin 権限)
set -euo pipefail

POLICY_NAME="recall-kit-deploy-policy"
USER_NAME="yaowaowao02"
ACCOUNT_ID="376408658186"
POLICY_FILE="$(dirname "$0")/iam-policies/recall-kit-managed-policy.json"
POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/${POLICY_NAME}"

echo "=== ReCallKit マネージドポリシー作成 & アタッチ ==="

# 1. ポリシーが既に存在するか確認
if aws iam get-policy --policy-arn "$POLICY_ARN" > /dev/null 2>&1; then
  echo "[1/2] ポリシー既存: $POLICY_ARN"
  echo "  → 新バージョンを作成します"
  aws iam create-policy-version \
    --policy-arn "$POLICY_ARN" \
    --policy-document "file://$POLICY_FILE" \
    --set-as-default
else
  echo "[1/2] ポリシー新規作成: $POLICY_NAME"
  aws iam create-policy \
    --policy-name "$POLICY_NAME" \
    --policy-document "file://$POLICY_FILE" \
    --description "ReCallKit Lambda/Cognito/IAM/Bedrock デプロイ権限"
  echo "  作成完了: $POLICY_ARN"
fi

# 2. ユーザーにアタッチ（既にアタッチ済みでもエラーにならない）
echo "[2/2] $USER_NAME にアタッチ中..."
aws iam attach-user-policy \
  --user-name "$USER_NAME" \
  --policy-arn "$POLICY_ARN"
echo "  アタッチ完了"

echo ""
echo "=== 完了 ==="
echo "確認コマンド:"
echo "  aws iam list-attached-user-policies --user-name $USER_NAME"
echo ""
echo "次のステップ:"
echo "  bash lambda/setup-iam-role.sh"
echo "  bash lambda/setup-cognito-pool.sh"
echo "  bash lambda/deploy.sh create"
