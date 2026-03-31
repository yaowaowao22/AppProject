#!/usr/bin/env bash
# =============================================================================
# deploy.sh — recall-kit-url-analyzer Lambda デプロイスクリプト
#
# 使い方:
#   初回デプロイ: bash lambda/deploy.sh create
#   コード更新:   bash lambda/deploy.sh update  (省略時もupdate)
#
# 事前準備:
#   1. AWS CLI がインストール・設定済みであること (aws configure)
#   2. IAM ロール recall-kit-lambda-role が作成済みであること
#      → 設計書 docs/design-bedrock-url-analysis.md セクション6-5 参照
#   3. LAMBDA_ROLE_ARN を実際の ARN に書き換えること
# =============================================================================

set -euo pipefail

# --- 設定（環境に合わせて変更） ---
FUNCTION_NAME="recall-kit-url-analyzer"
REGION="ap-northeast-1"
RUNTIME="python3.12"
HANDLER="handler.lambda_handler"
MEMORY_SIZE=256
TIMEOUT=30

# IAM ロール ARN（初回作成時に必要。実際の ARN に書き換えること）
LAMBDA_ROLE_ARN="arn:aws:iam::376408658186:role/recall-kit-lambda-role"

# プロジェクトルートの設定ファイル
INFO_FILE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/.aws-account-info.json"

# --- パス設定 ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_DIR="${SCRIPT_DIR}/recall_analyzer"
ZIP_FILE="${SCRIPT_DIR}/function.zip"

# --- コマンド引数（デフォルト: update） ---
COMMAND="${1:-update}"

# =============================================================================
# 共通: ZIP パッケージング
# =============================================================================
package() {
  echo "[1/3] ZIP パッケージングを開始..."
  rm -f "${ZIP_FILE}"
  cd "${SRC_DIR}"
  zip -r "${ZIP_FILE}" handler.py
  echo "      → ${ZIP_FILE} を作成しました"
  cd "${SCRIPT_DIR}"
}

# =============================================================================
# create: Lambda 関数の新規作成 + Function URL 設定
# =============================================================================
create_function() {
  package

  echo "[2/3] Lambda 関数を作成中..."

  # 関数がすでに存在するか確認
  if aws lambda get-function \
    --function-name "${FUNCTION_NAME}" \
    --region "${REGION}" \
    --output text \
    --query "Configuration.FunctionName" 2>/dev/null | grep -q "${FUNCTION_NAME}"; then
    echo "      ⚠ 関数 '${FUNCTION_NAME}' はすでに存在します。コードのみ更新します..."
    update_code_only
    return
  fi

  aws lambda create-function \
    --function-name "${FUNCTION_NAME}" \
    --runtime "${RUNTIME}" \
    --handler "${HANDLER}" \
    --zip-file "fileb://${ZIP_FILE}" \
    --role "${LAMBDA_ROLE_ARN}" \
    --timeout "${TIMEOUT}" \
    --memory-size "${MEMORY_SIZE}" \
    --region "${REGION}"
  echo "      → Lambda 関数を作成しました"

  echo "[3/3] Lambda Function URL を設定中..."
  setup_function_url
}

# =============================================================================
# update: コードのみ更新
# =============================================================================
update_code_only() {
  aws lambda update-function-code \
    --function-name "${FUNCTION_NAME}" \
    --zip-file "fileb://${ZIP_FILE}" \
    --region "${REGION}"
  echo "      → コードを更新しました"
}

update_function() {
  package
  echo "[2/3] Lambda コードを更新中..."
  update_code_only

  echo "[3/3] Function URL の確認..."
  get_function_url
}

# =============================================================================
# Function URL の作成または取得
# =============================================================================
setup_function_url() {
  # すでに Function URL が存在するか確認
  EXISTING_URL=$(aws lambda get-function-url-config \
    --function-name "${FUNCTION_NAME}" \
    --region "${REGION}" \
    --query "FunctionUrl" \
    --output text 2>/dev/null || true)

  if [[ -n "${EXISTING_URL}" && "${EXISTING_URL}" != "None" ]]; then
    echo "      ⚠ Function URL はすでに存在します"
    save_function_url "${EXISTING_URL}"
    return
  fi

  aws lambda create-function-url-config \
    --function-name "${FUNCTION_NAME}" \
    --auth-type AWS_IAM \
    --invoke-mode RESPONSE_STREAM \
    --region "${REGION}"
  echo "      → Function URL を作成しました (AuthType: AWS_IAM, InvokeMode: RESPONSE_STREAM)"

  get_function_url
}

get_function_url() {
  URL=$(aws lambda get-function-url-config \
    --function-name "${FUNCTION_NAME}" \
    --region "${REGION}" \
    --query "FunctionUrl" \
    --output text 2>/dev/null || echo "")

  if [[ -z "${URL}" || "${URL}" == "None" ]]; then
    echo "      ⚠ Function URL が取得できませんでした"
    return
  fi

  save_function_url "${URL}"
}

save_function_url() {
  local url="$1"
  echo ""
  echo "====================================================="
  echo "  Function URL: ${url}"
  echo "  → src/config/aws.ts の LAMBDA_ANALYZER_URL に設定"
  echo "====================================================="

  # .aws-account-info.json に FunctionUrl を保存
  if [[ -f "${INFO_FILE}" ]]; then
    python3 - <<PYEOF
import json

with open("${INFO_FILE}", "r") as f:
    data = json.load(f)

data["LambdaFunctionUrl"] = "${url}"
data["LambdaFunctionName"] = "${FUNCTION_NAME}"

with open("${INFO_FILE}", "w") as f:
    json.dump(data, f, indent=2)

print("  .aws-account-info.json を更新しました")
print("  LambdaFunctionUrl:", "${url}")
PYEOF
  else
    echo "      ⚠ ${INFO_FILE} が見つかりません。手動で更新してください。"
  fi
}

# =============================================================================
# メイン処理
# =============================================================================
echo "================================================="
echo " recall-kit-url-analyzer デプロイスクリプト"
echo " コマンド : ${COMMAND}"
echo " リージョン: ${REGION}"
echo "================================================="

case "${COMMAND}" in
  create)
    create_function
    ;;
  update)
    update_function
    ;;
  url)
    get_function_url
    ;;
  *)
    echo "使い方: bash deploy.sh [create|update|url]"
    echo "  create : 新規作成（初回）"
    echo "  update : コード更新（デフォルト）"
    echo "  url    : Function URL を表示"
    exit 1
    ;;
esac

echo ""
echo "完了。"
