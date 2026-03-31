#!/bin/bash
# recall-kit-lambda-role 作成スクリプト
# 実行前提：yaowaowao02 に iam:CreateRole / iam:AttachRolePolicy 権限が必要
set -euo pipefail

ROLE_NAME="recall-kit-lambda-role"
ACCOUNT_ID="376408658186"
INFO_FILE="$(dirname "$0")/../.aws-account-info.json"

echo "=== Lambda実行ロール作成 ==="

# 1. ロール作成（信頼ポリシー: lambda.amazonaws.com）
echo "[1/3] ロール作成中..."
ROLE_ARN=$(aws iam create-role \
  --role-name "$ROLE_NAME" \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": { "Service": "lambda.amazonaws.com" },
        "Action": "sts:AssumeRole"
      }
    ]
  }' \
  --description "ReCallKit Lambda execution role" \
  --query 'Role.Arn' \
  --output text)

echo "  作成完了: $ROLE_ARN"

# 2. AWSLambdaBasicExecutionRole をアタッチ
echo "[2/3] AWSLambdaBasicExecutionRole アタッチ中..."
aws iam attach-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
echo "  アタッチ完了"

# 3. .aws-account-info.json にロールARNを追記
echo "[3/3] .aws-account-info.json を更新中..."
python3 - <<PYEOF
import json

with open("$INFO_FILE", "r") as f:
    data = json.load(f)

data["LambdaRoleArn"] = "$ROLE_ARN"
data["LambdaRoleName"] = "$ROLE_NAME"

with open("$INFO_FILE", "w") as f:
    json.dump(data, f, indent=2)

print("  更新完了:", "$INFO_FILE")
PYEOF

echo ""
echo "=== 完了 ==="
echo "LambdaRoleArn: $ROLE_ARN"
echo ""
echo "次のステップ:"
echo "  bash lambda/deploy.sh   # Lambda関数デプロイ"
