#!/usr/bin/env bash
# =============================================================================
# setup-cognito-role.sh — recall-kit-unauthenticated-role 作成スクリプト
#
# 使い方:
#   bash lambda/setup-cognito-role.sh
#
# 事前準備:
#   1. AWS CLI がインストール・設定済みであること
#   2. IAM ロール作成権限（iam:CreateRole, iam:PutRolePolicy）が付与されていること
#   3. Cognito Identity Pool 作成後に IDENTITY_POOL_ID を設定すること
# =============================================================================

set -euo pipefail

REGION="ap-northeast-1"
ACCOUNT_ID="376408658186"
ROLE_NAME="recall-kit-unauthenticated-role"
POLICY_NAME="recall-kit-lambda-invoke-policy"
FUNCTION_NAME="recall-kit-analyzer"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "================================================="
echo " Cognito 未認証ロール セットアップスクリプト"
echo " ロール名: ${ROLE_NAME}"
echo " リージョン: ${REGION}"
echo "================================================="

# --- ステップ1: 信頼ポリシーの準備 ---
TRUST_POLICY_FILE="${SCRIPT_DIR}/iam-policies/cognito-unauth-trust-policy.json"
INLINE_POLICY_FILE="${SCRIPT_DIR}/iam-policies/cognito-unauth-inline-policy.json"

if [ ! -f "${TRUST_POLICY_FILE}" ]; then
  echo "エラー: 信頼ポリシーファイルが見つかりません: ${TRUST_POLICY_FILE}"
  exit 1
fi

# Windows の Git Bash では file:// パスが壊れるためファイル内容を変数に読み込む
TRUST_POLICY_JSON=$(cat "${TRUST_POLICY_FILE}")
INLINE_POLICY_JSON=$(cat "${INLINE_POLICY_FILE}")

# --- ステップ2: ロールが存在するか確認 ---
echo "[1/3] ロール存在確認..."
if aws iam get-role --role-name "${ROLE_NAME}" --region "${REGION}" > /dev/null 2>&1; then
  echo "      ⚠ ロール '${ROLE_NAME}' はすでに存在します"
  ROLE_ARN=$(aws iam get-role \
    --role-name "${ROLE_NAME}" \
    --query "Role.Arn" \
    --output text)
else
  # --- ステップ3: ロール作成 ---
  echo "[2/3] IAM ロールを作成中..."
  ROLE_ARN=$(aws iam create-role \
    --role-name "${ROLE_NAME}" \
    --assume-role-policy-document "${TRUST_POLICY_JSON}" \
    --description "Cognito unauthenticated role for Lambda FunctionUrl invoke" \
    --query "Role.Arn" \
    --output text)
  echo "      → ロール作成完了: ${ROLE_ARN}"
fi

# --- ステップ4: インラインポリシーのアタッチ ---
echo "[3/3] インラインポリシーをアタッチ中..."
aws iam put-role-policy \
  --role-name "${ROLE_NAME}" \
  --policy-name "${POLICY_NAME}" \
  --policy-document "${INLINE_POLICY_JSON}"
echo "      → インラインポリシー '${POLICY_NAME}' をアタッチしました"

# --- 結果表示 ---
echo ""
echo "====================================================="
echo "  ロール ARN: ${ROLE_ARN}"
echo "  → .aws-account-info.json の unauthRoleArn に設定"
echo "====================================================="

# --- .aws-account-info.json の更新 (オプション) ---
INFO_FILE="${SCRIPT_DIR}/../.aws-account-info.json"
if [ -f "${INFO_FILE}" ]; then
  echo ""
  echo "次のコマンドで .aws-account-info.json を更新できます:"
  echo ""
  echo "  python3 -c \""
  echo "import json"
  echo "with open('${INFO_FILE}', 'r') as f: data = json.load(f)"
  echo "data['unauthRoleArn'] = '${ROLE_ARN}'"
  echo "with open('${INFO_FILE}', 'w') as f: json.dump(data, f, indent=2)"
  echo "\""
fi

echo ""
echo "完了。"
