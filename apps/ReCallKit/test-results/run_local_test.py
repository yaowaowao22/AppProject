"""
ReCallKit E2E 統合テスト — ローカル検証スクリプト
- Lambda ハンドラーのロジック（Bedrock を unittest.mock でモック）
- 実際の Bedrock 呼び出し（IAM 権限があれば実行）
- Cognito + Lambda Function URL の疎通（リソースが存在すれば実行）
"""

import json
import os
import sys
import time
import unittest
from unittest.mock import MagicMock, patch
from io import BytesIO

# Lambda ハンドラーを直接 import するためパスを追加
LAMBDA_DIR = os.path.join(os.path.dirname(__file__), "..", "lambda", "recall_analyzer")
sys.path.insert(0, LAMBDA_DIR)

# ======================================================================
# テスト用定数
# ======================================================================
TEST_URL = "https://example.com/ai-article"
TEST_TEXT = (
    "This is a test article about artificial intelligence and machine learning. "
    "AI has transformed many industries including healthcare, finance, and education. "
    "Deep learning models like neural networks can process vast amounts of data. "
    "Natural language processing enables computers to understand human language. "
    "Reinforcement learning allows agents to learn through trial and error."
)

MOCK_BEDROCK_RESPONSE = {
    "title": "AI・機械学習入門",
    "summary": "AIと機械学習の基本概念と産業への影響を解説する記事。",
    "qa_pairs": [
        {"question": "AIはどの産業に影響を与えていますか？", "answer": "医療、金融、教育など多くの産業に変革をもたらしています。"},
        {"question": "ディープラーニングとは何ですか？", "answer": "大量データを処理できるニューラルネットワークを用いた機械学習手法です。"},
        {"question": "自然言語処理の目的は何ですか？", "answer": "コンピュータが人間の言語を理解・処理できるようにすることです。"},
        {"question": "強化学習の特徴は何ですか？", "answer": "試行錯誤を通じてエージェントが最適な行動を学習する手法です。"},
        {"question": "機械学習の主な応用分野は？", "answer": "画像認識、音声認識、自然言語処理、推薦システムなどに幅広く応用されています。"},
    ],
    "category": "技術",
}

results = []  # テスト結果を収集


def log(label: str, status: str, detail: str = "", elapsed: float = 0.0):
    emoji = "[OK]" if status == "PASS" else "[NG]" if status == "FAIL" else "[--]"
    entry = {
        "label": label,
        "status": status,
        "detail": detail,
        "elapsed_ms": round(elapsed * 1000, 1),
    }
    results.append(entry)
    print(f"  {emoji} [{status}] {label} ({entry['elapsed_ms']}ms)")
    if detail:
        for line in detail.split("\n")[:5]:
            print(f"       {line}")


# ======================================================================
# Step 1: aws.ts の設定値確認
# ======================================================================
def test_step1_aws_config():
    print("\n[Step 1] aws.ts 設定値の確認")
    config_path = os.path.join(os.path.dirname(__file__), "..", "src", "config", "aws.ts")
    with open(config_path, encoding="utf-8") as f:
        content = f.read()

    has_cognito = "xxxxxxxx" not in content.split("COGNITO_IDENTITY_POOL_ID")[1].split(";")[0]
    has_lambda = "xxxxxxxxxx" not in content.split("LAMBDA_FUNCTION_URL")[1].split(";")[0]

    if has_cognito and has_lambda:
        log("aws.ts: 実際の値が設定済み", "PASS")
    else:
        missing = []
        if not has_cognito:
            missing.append("COGNITO_IDENTITY_POOL_ID（プレースホルダーのまま）")
        if not has_lambda:
            missing.append("LAMBDA_FUNCTION_URL（プレースホルダーのまま）")
        log(
            "aws.ts: 設定値未更新",
            "FAIL",
            "未設定: " + ", ".join(missing),
        )
    return has_cognito, has_lambda


# ======================================================================
# Step 2: Lambda ハンドラー ロジック検証（Bedrockをモック）
# ======================================================================
def test_step2_handler_logic():
    print("\n[Step 2] Lambda ハンドラー ロジック検証（Bedrockモック）")

    mock_response_body = BytesIO(
        json.dumps(
            {"content": [{"text": json.dumps(MOCK_BEDROCK_RESPONSE, ensure_ascii=False)}]}
        ).encode()
    )
    mock_bedrock = MagicMock()
    mock_bedrock.invoke_model.return_value = {"body": mock_response_body}

    with patch("boto3.client", return_value=mock_bedrock):
        import importlib
        import handler as h
        importlib.reload(h)

        # 正常ケース
        t0 = time.time()
        event = {"body": json.dumps({"url": TEST_URL, "text": TEST_TEXT})}
        resp = h.lambda_handler(event, None)
        elapsed = time.time() - t0

        body = json.loads(resp["body"])
        ok = (
            resp["statusCode"] == 200
            and "title" in body
            and "summary" in body
            and "qa_pairs" in body
            and "category" in body
            and isinstance(body["qa_pairs"], list)
            and len(body["qa_pairs"]) > 0
        )
        log(
            "正常リクエスト: statusCode=200 + 必須フィールド",
            "PASS" if ok else "FAIL",
            f"title={body.get('title')}, category={body.get('category')}, qa_pairs={len(body.get('qa_pairs',[]))}件",
            elapsed,
        )

        # Q&A構造検証
        all_qa_ok = all(
            "question" in qa and "answer" in qa for qa in body.get("qa_pairs", [])
        )
        log(
            "qa_pairs 構造検証（question/answerフィールド）",
            "PASS" if all_qa_ok else "FAIL",
            f"qa_pairs={body.get('qa_pairs', [])}",
        )

        # カテゴリ検証
        valid_categories = {"技術", "ビジネス", "科学", "語学", "一般教養", "その他"}
        cat_ok = body.get("category") in valid_categories
        log(
            f"category 値の検証: '{body.get('category')}'",
            "PASS" if cat_ok else "FAIL",
            f"有効値: {valid_categories}",
        )


# ======================================================================
# Step 3: エラーケース検証（Bedrockをモック）
# ======================================================================
def test_step3_error_cases():
    print("\n[Step 3] エラーケース検証")

    mock_bedrock = MagicMock()

    with patch("boto3.client", return_value=mock_bedrock):
        import importlib
        import handler as h
        importlib.reload(h)

        # 空 text フィールド
        t0 = time.time()
        event = {"body": json.dumps({"url": TEST_URL, "text": ""})}
        resp = h.lambda_handler(event, None)
        elapsed = time.time() - t0
        ok = resp["statusCode"] == 400 and "error" in json.loads(resp["body"])
        log(
            "エラー: 空textフィールド → 400",
            "PASS" if ok else "FAIL",
            f"statusCode={resp['statusCode']}, body={resp['body'][:100]}",
            elapsed,
        )

        # 不正 JSON
        t0 = time.time()
        event_bad = {"body": "{ invalid json {{"}
        resp_bad = h.lambda_handler(event_bad, None)
        elapsed = time.time() - t0
        ok_bad = resp_bad["statusCode"] == 400
        log(
            "エラー: 不正JSON → 400",
            "PASS" if ok_bad else "FAIL",
            f"statusCode={resp_bad['statusCode']}, body={resp_bad['body'][:100]}",
            elapsed,
        )

        # text なし（フィールド自体が欠如）
        t0 = time.time()
        event_no_text = {"body": json.dumps({"url": TEST_URL})}
        resp_no_text = h.lambda_handler(event_no_text, None)
        elapsed = time.time() - t0
        ok_no_text = resp_no_text["statusCode"] == 400
        log(
            "エラー: textフィールド欠如 → 400",
            "PASS" if ok_no_text else "FAIL",
            f"statusCode={resp_no_text['statusCode']}",
            elapsed,
        )


# ======================================================================
# Step 4: テキスト切り詰めロジック検証
# ======================================================================
def test_step4_truncation():
    print("\n[Step 4] テキスト切り詰めロジック検証")

    with patch("boto3.client", return_value=MagicMock()):
        import importlib
        import handler as h
        importlib.reload(h)

        # 8000文字超 → head+tail方式
        long_text = "A" * 4000 + "B" * 4001
        result = h.truncate_text(long_text)
        ok = len(result) == 4000 + len("\n...[中略]...\n") + 2000
        log(
            "8001文字テキスト → head2000+tail2000に切り詰め",
            "PASS" if ok else "FAIL",
            f"入力={len(long_text)}文字 → 出力={len(result)}文字",
        )

        # 4001文字 → 先頭4000文字
        medium_text = "C" * 4001
        result2 = h.truncate_text(medium_text)
        ok2 = len(result2) == 4000
        log(
            "4001文字テキスト → 先頭4000文字に切り詰め",
            "PASS" if ok2 else "FAIL",
            f"入力={len(medium_text)}文字 → 出力={len(result2)}文字",
        )

        # 3999文字 → そのまま
        short_text = "D" * 3999
        result3 = h.truncate_text(short_text)
        ok3 = len(result3) == 3999
        log(
            "3999文字テキスト → そのまま返却",
            "PASS" if ok3 else "FAIL",
            f"入力={len(short_text)}文字 → 出力={len(result3)}文字",
        )


# ======================================================================
# Step 5: 実Bedrock 呼び出し（IAM権限があれば）
# ======================================================================
def test_step5_real_bedrock():
    print("\n[Step 5] 実 Bedrock 呼び出し（IAM権限チェック）")
    import boto3
    from botocore.exceptions import ClientError

    try:
        client = boto3.client("bedrock-runtime", region_name="ap-northeast-1")
        t0 = time.time()
        response = client.invoke_model(
            modelId="anthropic.claude-3-5-haiku-20241022-v1:0",
            contentType="application/json",
            accept="application/json",
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 100,
                "messages": [{"role": "user", "content": "respond with the single word: pong"}],
            }),
        )
        elapsed = time.time() - t0
        result = json.loads(response["body"].read())
        text = result["content"][0]["text"]
        log(
            "実 Bedrock InvokeModel 疎通",
            "PASS",
            f"応答: {text[:80]}",
            elapsed,
        )
        return True
    except ClientError as e:
        log(
            "実 Bedrock InvokeModel",
            "FAIL",
            f"AccessDenied or Error: {e.response['Error']['Code']} — {e.response['Error']['Message'][:120]}",
        )
        return False


# ======================================================================
# Step 6: Cognito + Lambda Function URL 疎通（リソース存在時のみ）
# ======================================================================
def test_step6_cognito_lambda(cognito_ok: bool, lambda_ok: bool):
    print("\n[Step 6] Cognito + Lambda Function URL 疎通テスト")

    if not cognito_ok or not lambda_ok:
        log(
            "Cognito + Lambda 疎通テスト",
            "SKIP",
            "aws.ts にプレースホルダー値が残っているためスキップ",
        )
        return

    # aws.ts から値を読み取る
    config_path = os.path.join(os.path.dirname(__file__), "..", "src", "config", "aws.ts")
    with open(config_path, encoding="utf-8") as f:
        content = f.read()

    import re
    pool_match = re.search(r"COGNITO_IDENTITY_POOL_ID\s*=\s*'(ap-northeast-1:[^']+)'", content)
    url_match = re.search(r"LAMBDA_FUNCTION_URL\s*=\s*'(https://[^']+)'", content)

    if not pool_match or not url_match:
        log("aws.ts パース", "FAIL", "値の抽出に失敗")
        return

    identity_pool_id = pool_match.group(1)
    lambda_url = url_match.group(1)

    import boto3
    from botocore.exceptions import ClientError

    # Cognito: 未認証IDの取得
    try:
        cog = boto3.client("cognito-identity", region_name="ap-northeast-1")
        t0 = time.time()
        id_resp = cog.get_id(IdentityPoolId=identity_pool_id)
        identity_id = id_resp["IdentityId"]
        cred_resp = cog.get_credentials_for_identity(IdentityId=identity_id)
        creds = cred_resp["Credentials"]
        elapsed = time.time() - t0
        log(
            "Cognito 未認証クレデンシャル取得",
            "PASS",
            f"IdentityId: {identity_id}\nAccessKeyId: {creds['AccessKeyId'][:10]}...",
            elapsed,
        )
    except ClientError as e:
        log(
            "Cognito 未認証クレデンシャル取得",
            "FAIL",
            f"{e.response['Error']['Code']}: {e.response['Error']['Message'][:120]}",
        )
        return

    # Lambda: SigV4 署名付きリクエスト
    try:
        import botocore.auth
        import botocore.awsrequest
        import botocore.credentials
        import urllib.request

        session_creds = botocore.credentials.Credentials(
            access_key=creds["AccessKeyId"],
            secret_key=creds["SecretKey"],
            token=creds["SessionToken"],
        )

        payload = json.dumps({"url": TEST_URL, "text": TEST_TEXT}).encode()
        request = botocore.awsrequest.AWSRequest(
            method="POST",
            url=lambda_url,
            data=payload,
            headers={"Content-Type": "application/json"},
        )
        signer = botocore.auth.SigV4Auth(session_creds, "lambda", "ap-northeast-1")
        signer.add_auth(request)

        prepared = request.prepare()
        req = urllib.request.Request(
            lambda_url,
            data=payload,
            headers=dict(prepared.headers),
            method="POST",
        )
        t0 = time.time()
        with urllib.request.urlopen(req, timeout=35) as resp:
            elapsed = time.time() - t0
            resp_body = json.loads(resp.read().decode())
            log(
                "Lambda Function URL 疎通 (SigV4)",
                "PASS",
                f"statusCode=200\ntitle={resp_body.get('title')}\ncategory={resp_body.get('category')}\nqa_pairs={len(resp_body.get('qa_pairs',[]))}件",
                elapsed,
            )
    except Exception as e:
        log("Lambda Function URL 疎通 (SigV4)", "FAIL", str(e)[:200])


# ======================================================================
# 実行
# ======================================================================
if __name__ == "__main__":
    print("=" * 60)
    print(" ReCallKit E2E 統合テスト")
    print("=" * 60)

    cognito_ok, lambda_ok = test_step1_aws_config()
    test_step2_handler_logic()
    test_step3_error_cases()
    test_step4_truncation()
    bedrock_ok = test_step5_real_bedrock()
    test_step6_cognito_lambda(cognito_ok, lambda_ok)

    # サマリー
    passed = sum(1 for r in results if r["status"] == "PASS")
    failed = sum(1 for r in results if r["status"] == "FAIL")
    skipped = sum(1 for r in results if r["status"] == "SKIP")

    print("\n" + "=" * 60)
    print(f" 結果: PASS={passed}  FAIL={failed}  SKIP={skipped}  合計={len(results)}")
    print("=" * 60)

    # JSON 出力（レポート生成用）
    output_path = os.path.join(os.path.dirname(__file__), "test_results_raw.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(
            {
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S+09:00"),
                "aws_config_ok": cognito_ok and lambda_ok,
                "bedrock_reachable": bedrock_ok,
                "summary": {"passed": passed, "failed": failed, "skipped": skipped},
                "results": results,
            },
            f,
            ensure_ascii=False,
            indent=2,
        )
    print(f"\n  結果JSON: {output_path}")
