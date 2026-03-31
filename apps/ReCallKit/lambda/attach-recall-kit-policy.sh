#!/bin/bash
# yaowaowao02 の IAM 権限を完全にマネージドポリシーへ移行するスクリプト
#
# 【やること】
#   1. 既存インラインポリシーを全て削除（2048文字制限を解消）
#   2. aimensetu-deploy-policy を作成してアタッチ
#   3. recall-kit-deploy-policy を作成してアタッチ
#
# 実行前提: aws configure 済み (root or Admin 権限)
set -euo pipefail

USER_NAME="yaowaowao02"
ACCOUNT_ID="376408658186"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

AIMENSETU_POLICY_NAME="aimensetu-deploy-policy"
RECALL_KIT_POLICY_NAME="recall-kit-deploy-policy"
AIMENSETU_POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/${AIMENSETU_POLICY_NAME}"
RECALL_KIT_POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/${RECALL_KIT_POLICY_NAME}"

echo "=== IAM 権限マネージドポリシー移行スクリプト ==="
echo "対象ユーザー: $USER_NAME"
echo ""

# ----------------------------------------------------------------
# Step 1: 既存インラインポリシーを全て削除
# ----------------------------------------------------------------
echo "[Step 1] インラインポリシーを削除（2048文字制限の解消）"
INLINE_POLICIES=$(aws iam list-user-policies \
  --user-name "$USER_NAME" \
  --query 'PolicyNames' \
  --output text 2>/dev/null || echo "")

if [ -z "$INLINE_POLICIES" ]; then
  echo "  インラインポリシーなし（スキップ）"
else
  for POLICY in $INLINE_POLICIES; do
    echo "  削除中: $POLICY"
    aws iam delete-user-policy \
      --user-name "$USER_NAME" \
      --policy-name "$POLICY"
    echo "  削除完了: $POLICY"
  done
fi

# ----------------------------------------------------------------
# Step 2: aimensetu-deploy-policy を作成 & アタッチ
# ----------------------------------------------------------------
echo ""
echo "[Step 2] aimensetu-deploy-policy を作成 & アタッチ"
AIMENSETU_FILE="${SCRIPT_DIR}/iam-policies/aimensetu-managed-policy.json"

if aws iam get-policy --policy-arn "$AIMENSETU_POLICY_ARN" > /dev/null 2>&1; then
  echo "  既存ポリシーを最新版に更新: $AIMENSETU_POLICY_NAME"
  aws iam create-policy-version \
    --policy-arn "$AIMENSETU_POLICY_ARN" \
    --policy-document "file://$AIMENSETU_FILE" \
    --set-as-default
else
  echo "  新規作成: $AIMENSETU_POLICY_NAME"
  aws iam create-policy \
    --policy-name "$AIMENSETU_POLICY_NAME" \
    --policy-document "file://$AIMENSETU_FILE" \
    --description "AI面接アプリ EC2/SSM/S3/STS 操作権限"
fi

aws iam attach-user-policy \
  --user-name "$USER_NAME" \
  --policy-arn "$AIMENSETU_POLICY_ARN"
echo "  アタッチ完了: $AIMENSETU_POLICY_ARN"

# ----------------------------------------------------------------
# Step 3: recall-kit-deploy-policy を作成 & アタッチ
# ----------------------------------------------------------------
echo ""
echo "[Step 3] recall-kit-deploy-policy を作成 & アタッチ"
RECALL_KIT_FILE="${SCRIPT_DIR}/iam-policies/recall-kit-managed-policy.json"

if aws iam get-policy --policy-arn "$RECALL_KIT_POLICY_ARN" > /dev/null 2>&1; then
  echo "  既存ポリシーを最新版に更新: $RECALL_KIT_POLICY_NAME"
  aws iam create-policy-version \
    --policy-arn "$RECALL_KIT_POLICY_ARN" \
    --policy-document "file://$RECALL_KIT_FILE" \
    --set-as-default
else
  echo "  新規作成: $RECALL_KIT_POLICY_NAME"
  aws iam create-policy \
    --policy-name "$RECALL_KIT_POLICY_NAME" \
    --policy-document "file://$RECALL_KIT_FILE" \
    --description "ReCallKit Lambda/Cognito/IAM/Bedrock デプロイ権限"
fi

aws iam attach-user-policy \
  --user-name "$USER_NAME" \
  --policy-arn "$RECALL_KIT_POLICY_ARN"
echo "  アタッチ完了: $RECALL_KIT_POLICY_ARN"

# ----------------------------------------------------------------
# 確認
# ----------------------------------------------------------------
echo ""
echo "=== 完了 ==="
echo "アタッチ済みマネージドポリシー一覧:"
aws iam list-attached-user-policies \
  --user-name "$USER_NAME" \
  --query 'AttachedPolicies[].PolicyName' \
  --output table

echo ""
echo "残存インラインポリシー（0件であるべき）:"
aws iam list-user-policies \
  --user-name "$USER_NAME" \
  --query 'PolicyNames' \
  --output table

echo ""
echo "次のステップ:"
echo "  bash lambda/setup-iam-role.sh"
echo "  bash lambda/setup-cognito-pool.sh"
echo "  bash lambda/deploy.sh create"
