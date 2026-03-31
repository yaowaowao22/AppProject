"""
ReCallKit E2E テスト
Cognito 未認証クレデンシャル取得 → Lambda Function URL (SigV4) 呼び出し
結果を test-results/e2e-result.json に保存する。

前提:
  - src/config/aws.ts に COGNITO_IDENTITY_POOL_ID と LAMBDA_FUNCTION_URL の実値が設定済み
  - boto3 がインストール済み (pip install boto3 botocore)
  - AWS_DEFAULT_REGION または ~/.aws/credentials で ap-northeast-1 が有効
"""

import json
import os
import re
import sys
import time

TEST_URL = "https://example.com/ai-article"
TEST_TEXT = (
    "This is a test article about artificial intelligence and machine learning. "
    "AI has transformed many industries including healthcare, finance, and education. "
    "Deep learning models like neural networks can process vast amounts of data. "
    "Natural language processing enables computers to understand human language. "
    "Reinforcement learning allows agents to learn through trial and error."
)

REGION = "ap-northeast-1"
RESULTS_PATH = os.path.join(os.path.dirname(__file__), "e2e-result.json")
CONFIG_PATH = os.path.join(os.path.dirname(__file__), "..", "src", "config", "aws.ts")

steps = []


def step(label: str, status: str, detail: str = "", elapsed_ms: float = 0.0):
    """テストステップを記録してコンソールに出力する。"""
    icon = "[PASS]" if status == "PASS" else "[FAIL]" if status == "FAIL" else "[SKIP]"
    entry = {
        "step": label,
        "status": status,
        "detail": detail,
        "elapsed_ms": round(elapsed_ms, 1),
    }
    steps.append(entry)
    print(f"  {icon} {label}  ({entry['elapsed_ms']}ms)")
    if detail:
        for line in detail.split("\n")[:8]:
            print(f"        {line}")


def save_result(overall: str, identity_id: str = "", access_key_prefix: str = "",
                lambda_response: dict = None, error: str = ""):
    """e2e-result.json に結果を保存する。"""
    data = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S+09:00"),
        "overall": overall,          # "PASS" | "FAIL" | "SKIP"
        "identity_id": identity_id,
        "access_key_prefix": access_key_prefix,
        "lambda_response": lambda_response or {},
        "error": error,
        "steps": steps,
    }
    with open(RESULTS_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"\n  結果JSON: {RESULTS_PATH}")


# ======================================================================
# Step 1: aws.ts から設定値を読み込む
# ======================================================================
def load_aws_config():
    print("\n[Step 1] aws.ts 設定値読み込み")
    try:
        with open(CONFIG_PATH, encoding="utf-8") as f:
            content = f.read()
    except FileNotFoundError:
        step("aws.ts 読み込み", "FAIL", f"ファイルが見つかりません: {CONFIG_PATH}")
        return None, None

    pool_match = re.search(r"COGNITO_IDENTITY_POOL_ID\s*=\s*'(ap-northeast-1:[^']+)'", content)
    url_match = re.search(r"LAMBDA_FUNCTION_URL\s*=\s*'(https://[^']+)'", content)

    pool_id = pool_match.group(1) if pool_match else None
    lambda_url = url_match.group(1) if url_match else None

    is_placeholder = (
        not pool_id
        or "xxxxxxxx" in (pool_id or "")
        or not lambda_url
        or "xxxxxxxxxx" in (lambda_url or "")
    )

    if is_placeholder:
        missing = []
        if not pool_id or "xxxxxxxx" in (pool_id or ""):
            missing.append("COGNITO_IDENTITY_POOL_ID（プレースホルダーのまま）")
        if not lambda_url or "xxxxxxxxxx" in (lambda_url or ""):
            missing.append("LAMBDA_FUNCTION_URL（プレースホルダーのまま）")
        detail = "未設定項目:\n" + "\n".join(f"  - {m}" for m in missing)
        detail += "\n\nAWSリソースを先に作成してください:"
        detail += "\n  bash lambda/setup-iam-role.sh"
        detail += "\n  bash lambda/setup-cognito-pool.sh"
        detail += "\n  bash lambda/deploy.sh create"
        step("aws.ts 設定値チェック", "FAIL", detail)
        return None, None

    step(
        "aws.ts 設定値チェック",
        "PASS",
        f"COGNITO_IDENTITY_POOL_ID: {pool_id}\nLAMBDA_FUNCTION_URL: {lambda_url}",
    )
    return pool_id, lambda_url


# ======================================================================
# Step 2: Cognito 未認証クレデンシャル取得
# ======================================================================
def get_cognito_credentials(identity_pool_id: str):
    print("\n[Step 2] Cognito 未認証クレデンシャル取得")
    try:
        import boto3
        from botocore.exceptions import ClientError
    except ImportError:
        step("boto3 インポート", "FAIL", "boto3 がインストールされていません: pip install boto3 botocore")
        return None, None

    cog = boto3.client("cognito-identity", region_name=REGION)

    # getCredentialsForIdentity
    try:
        t0 = time.time()
        id_resp = cog.get_id(IdentityPoolId=identity_pool_id)
        identity_id = id_resp["IdentityId"]
        cred_resp = cog.get_credentials_for_identity(IdentityId=identity_id)
        creds = cred_resp["Credentials"]
        elapsed = (time.time() - t0) * 1000
        step(
            "Cognito getCredentialsForIdentity",
            "PASS",
            f"IdentityId: {identity_id}\nAccessKeyId: {creds['AccessKeyId'][:10]}...\nExpiration: {creds['Expiration']}",
            elapsed,
        )
        return identity_id, creds
    except ClientError as e:
        step(
            "Cognito getCredentialsForIdentity",
            "FAIL",
            f"{e.response['Error']['Code']}: {e.response['Error']['Message'][:200]}",
        )
        return None, None
    except Exception as e:
        step("Cognito getCredentialsForIdentity", "FAIL", str(e)[:200])
        return None, None


# ======================================================================
# Step 3: Lambda Function URL (SigV4 署名付き POST)
# ======================================================================
def call_lambda_with_sigv4(lambda_url: str, creds: dict):
    print("\n[Step 3] Lambda Function URL 呼び出し（SigV4）")
    try:
        import botocore.auth
        import botocore.awsrequest
        import botocore.credentials
        import urllib.request
        import urllib.error
    except ImportError as e:
        step("botocore インポート", "FAIL", f"インポートエラー: {e}")
        return None

    payload = json.dumps({"url": TEST_URL, "text": TEST_TEXT}).encode("utf-8")

    try:
        session_creds = botocore.credentials.Credentials(
            access_key=creds["AccessKeyId"],
            secret_key=creds["SecretKey"],
            token=creds["SessionToken"],
        )

        aws_request = botocore.awsrequest.AWSRequest(
            method="POST",
            url=lambda_url,
            data=payload,
            headers={"Content-Type": "application/json"},
        )
        signer = botocore.auth.SigV4Auth(session_creds, "lambda", REGION)
        signer.add_auth(aws_request)
        prepared = aws_request.prepare()

        req = urllib.request.Request(
            lambda_url,
            data=payload,
            headers=dict(prepared.headers),
            method="POST",
        )
        t0 = time.time()
        with urllib.request.urlopen(req, timeout=40) as resp:
            elapsed = (time.time() - t0) * 1000
            body = json.loads(resp.read().decode("utf-8"))
            step(
                "Lambda Function URL (SigV4)",
                "PASS",
                (
                    f"statusCode=200\n"
                    f"title: {body.get('title')}\n"
                    f"category: {body.get('category')}\n"
                    f"summary: {str(body.get('summary',''))[:80]}\n"
                    f"qa_pairs: {len(body.get('qa_pairs', []))}件"
                ),
                elapsed,
            )
            return body
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")[:300]
        step(
            "Lambda Function URL (SigV4)",
            "FAIL",
            f"HTTP {e.code}: {e.reason}\n{err_body}",
        )
        return None
    except Exception as e:
        step("Lambda Function URL (SigV4)", "FAIL", str(e)[:300])
        return None


# ======================================================================
# Step 4: レスポンス構造検証
# ======================================================================
def validate_response(body: dict):
    print("\n[Step 4] レスポンス構造検証")
    if not body:
        step("レスポンス構造検証", "SKIP", "Lambda呼び出し失敗のためスキップ")
        return False

    required_fields = ["title", "summary", "qa_pairs", "category"]
    missing = [f for f in required_fields if f not in body]
    if missing:
        step("必須フィールド存在チェック", "FAIL", f"不足フィールド: {missing}")
        return False
    step("必須フィールド存在チェック", "PASS", f"全フィールド確認: {required_fields}")

    qa_pairs = body.get("qa_pairs", [])
    qa_ok = isinstance(qa_pairs, list) and len(qa_pairs) >= 1
    step(
        "qa_pairs 件数チェック（1件以上）",
        "PASS" if qa_ok else "FAIL",
        f"件数: {len(qa_pairs)}",
    )

    struct_ok = all("question" in qa and "answer" in qa for qa in qa_pairs)
    step(
        "qa_pairs 各要素の question/answer フィールド",
        "PASS" if struct_ok else "FAIL",
    )

    valid_categories = {"技術", "ビジネス", "科学", "語学", "一般教養", "その他"}
    cat_ok = body.get("category") in valid_categories
    step(
        f"category 値: '{body.get('category')}'",
        "PASS" if cat_ok else "FAIL",
        f"有効値: {valid_categories}",
    )

    return qa_ok and struct_ok and cat_ok


# ======================================================================
# エントリポイント
# ======================================================================
if __name__ == "__main__":
    print("=" * 60)
    print(" ReCallKit E2E テスト")
    print(f" 実行日時: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    # Step 1: 設定値読み込み
    identity_pool_id, lambda_url = load_aws_config()
    if not identity_pool_id or not lambda_url:
        save_result(
            overall="FAIL",
            error="aws.ts にプレースホルダー値が残っています。AWSリソースを作成してから再実行してください。",
        )
        passed = sum(1 for s in steps if s["status"] == "PASS")
        failed = sum(1 for s in steps if s["status"] == "FAIL")
        print(f"\n  結果: PASS={passed}  FAIL={failed}  合計={len(steps)}")
        sys.exit(1)

    # Step 2: Cognito クレデンシャル取得
    identity_id, creds = get_cognito_credentials(identity_pool_id)
    if not creds:
        save_result(
            overall="FAIL",
            error="Cognito クレデンシャル取得に失敗しました。",
        )
        sys.exit(1)

    # Step 3: Lambda 呼び出し
    lambda_response = call_lambda_with_sigv4(lambda_url, creds)

    # Step 4: レスポンス構造検証
    valid = validate_response(lambda_response)

    # 最終判定
    all_pass = all(s["status"] == "PASS" for s in steps)
    overall = "PASS" if all_pass else "FAIL"

    passed = sum(1 for s in steps if s["status"] == "PASS")
    failed = sum(1 for s in steps if s["status"] == "FAIL")
    skipped = sum(1 for s in steps if s["status"] == "SKIP")

    print("\n" + "=" * 60)
    print(f" 総合結果: {overall}")
    print(f" PASS={passed}  FAIL={failed}  SKIP={skipped}  合計={len(steps)}")
    print("=" * 60)

    save_result(
        overall=overall,
        identity_id=identity_id or "",
        access_key_prefix=creds["AccessKeyId"][:10] + "..." if creds else "",
        lambda_response=lambda_response or {},
        error="" if overall == "PASS" else "一部ステップが失敗しました。詳細は steps を参照してください。",
    )

    sys.exit(0 if overall == "PASS" else 1)
