"""
recall-kit-gemini-proxy Lambda ハンドラー

エンドポイント: Lambda (InvokeCommand 経由)
認証: AWS_IAM (Cognito Identity Pool 経由の一時認証情報)

役割:
    Google Gemini API (v1beta/models/<model>:generateContent) への透過プロキシ。
    クライアント (React Native) に Gemini API キーを持たせないための中継点。

    groq_proxy と同じパターン。クライアントから model を含む JSON payload を
    受け取り、Lambda 側で URL を組み立てて Gemini REST API に POST する。

リクエストボディ (event):
    {
        "model": "gemini-1.5-flash-8b",
        "contents": [
            {"role": "user", "parts": [{"text": "..."}]}
        ],
        "systemInstruction": {
            "parts": [{"text": "..."}]
        },
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 2000,
            "responseMimeType": "application/json"
        }
    }

レスポンス 200:
    {
        "statusCode": 200,
        "body": "<Gemini のレスポンスJSONを文字列化したもの>"
    }

レスポンス エラー:
    {
        "statusCode": 400 | 401 | 413 | 429 | 500 | 504,
        "body": json.dumps({"error": "<メッセージ>"})
    }

環境変数:
    GEMINI_API_KEY — Google AI Studio の API キー (必須、AIza... で始まる)
"""

import json
import os
import urllib.request
import urllib.error

# ============================================================
# 定数
# ============================================================

GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"

# モデル allow-list (悪用防止)。無料枠〜低コスト帯のモデルのみ許可。
ALLOWED_MODELS = {
    "gemini-1.5-flash-8b",   # 最安 ($0.0375/1M in, $0.15/1M out)
    "gemini-1.5-flash",      # ($0.075/1M in, $0.30/1M out)
    "gemini-2.0-flash",      # ($0.10/1M in, $0.40/1M out)
    "gemini-2.0-flash-lite", # ($0.075/1M in, $0.30/1M out)
}

# Gemini API タイムアウト (秒)。Lambda 最大 60s、RN クライアントも 60s なので 55s で打ち切る。
GEMINI_TIMEOUT_SEC = 55

# 上流から伝播させたい HTTP ステータス (401/413/429 はクライアントで意味がある)
PASSTHROUGH_STATUS = {401, 413, 429}


# ============================================================
# バリデーション
# ============================================================

def _validate_payload(body: dict) -> tuple[bool, str]:
    """
    Gemini リクエストボディのバリデーション。
    戻り値: (ok: bool, error_message: str)
    """
    if not isinstance(body, dict):
        return False, "Request body must be a JSON object"

    model = body.get("model")
    if not model or not isinstance(model, str):
        return False, "'model' field is required and must be a string"

    if model not in ALLOWED_MODELS:
        return False, (
            f"Model '{model}' is not allowed. "
            f"Allowed models: {sorted(ALLOWED_MODELS)}"
        )

    contents = body.get("contents")
    if not isinstance(contents, list) or len(contents) == 0:
        return False, "'contents' field is required and must be a non-empty list"

    for i, msg in enumerate(contents):
        if not isinstance(msg, dict):
            return False, f"contents[{i}] must be an object"
        if "parts" not in msg or not isinstance(msg["parts"], list):
            return False, f"contents[{i}] must have 'parts' (list)"

    return True, ""


# ============================================================
# Gemini API 呼び出し
# ============================================================

def _call_gemini(api_key: str, model: str, payload: dict) -> tuple[int, str]:
    """
    Gemini /v1beta/models/<model>:generateContent を呼び出す。
    戻り値: (status_code: int, response_body: str)

    クライアントから送られた payload のうち 'model' フィールドは URL に使うため
    Gemini API 本体には送らない。残りのフィールド (contents/systemInstruction/
    generationConfig) だけを JSON body として送信する。

    例外:
        urllib.error.URLError — ネットワーク/タイムアウト
    """
    # 'model' キーを除外した payload を作成
    send_payload = {k: v for k, v in payload.items() if k != "model"}
    data = json.dumps(send_payload).encode("utf-8")

    url = f"{GEMINI_BASE_URL}/models/{model}:generateContent?key={api_key}"
    headers = {
        "Content-Type": "application/json",
        # 明示的に UA を指定 (一部 CDN/WAF の拒否回避)
        "User-Agent": "recall-kit-gemini-proxy/1.0 (Lambda)",
        "Accept": "application/json",
    }
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")

    try:
        with urllib.request.urlopen(req, timeout=GEMINI_TIMEOUT_SEC) as resp:
            body_str = resp.read().decode("utf-8", errors="replace")
            return resp.status, body_str
    except urllib.error.HTTPError as e:
        body_bytes = e.read() if hasattr(e, "read") else b""
        body_str = body_bytes.decode("utf-8", errors="replace") if body_bytes else ""
        # デバッグ用に生ボディを print (CloudWatch にだけ出る)
        # ⚠️ URL に埋め込んだ api_key が出ないよう注意 (e.url には key 含むので
        #    code と body だけログに出す)
        print(f"[gemini_proxy] upstream HTTP {e.code}: body={body_str[:300]}")
        return e.code, body_str


# ============================================================
# Gemini エラーボディから error メッセージを抜き出す
# ============================================================

def _extract_error_message(body_str: str, fallback: str) -> str:
    """
    Gemini のエラーレスポンスは通常 {"error": {"code": 400, "message": "...", "status": "..."}} 形式。
    パースできなければ fallback を返す。
    """
    if not body_str:
        return fallback
    try:
        parsed = json.loads(body_str)
        if isinstance(parsed, dict):
            err = parsed.get("error")
            if isinstance(err, dict) and "message" in err:
                return str(err["message"])
            if isinstance(err, str):
                return err
    except (json.JSONDecodeError, TypeError):
        pass
    return fallback


# ============================================================
# メインハンドラー
# ============================================================

def lambda_handler(event, context):
    # --- 1. API キーの取得 ---
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("ERROR: GEMINI_API_KEY env var not set")
        return {
            "statusCode": 500,
            "body": json.dumps({"error": "GEMINI_API_KEY env var not set"}),
        }

    # --- 2. リクエストボディのパース ---
    # InvokeCommand からの直接呼び出しでは event 自体が payload。
    # Function URL / API Gateway 経由の場合は event['body'] (文字列) に入る。
    try:
        if isinstance(event, dict) and isinstance(event.get("body"), str):
            body = json.loads(event["body"])
        elif isinstance(event, str):
            body = json.loads(event)
        else:
            body = event
    except (json.JSONDecodeError, TypeError) as e:
        print(f"ERROR: failed to parse request body: {e}")
        return {
            "statusCode": 400,
            "body": json.dumps({"error": "Invalid JSON body"}),
        }

    # --- 3. バリデーション ---
    ok, err_msg = _validate_payload(body)
    if not ok:
        print(f"ERROR: validation failed: {err_msg}")
        return {
            "statusCode": 400,
            "body": json.dumps({"error": err_msg}),
        }

    model = body["model"]
    contents_count = len(body.get("contents", []))
    print(f"INFO: forwarding to Gemini — model={model}, contents={contents_count}")

    # --- 4. Gemini 呼び出し ---
    try:
        status, resp_body = _call_gemini(api_key, model, body)
    except urllib.error.URLError as e:
        # ネットワークエラー・タイムアウト
        reason = getattr(e, "reason", str(e))
        print(f"ERROR: Gemini upstream network error: {reason}")
        return {
            "statusCode": 504,
            "body": json.dumps({"error": "Upstream Gemini API timed out"}),
        }
    except Exception as e:
        # 想定外の例外
        print(f"ERROR: unexpected error calling Gemini: {type(e).__name__}: {e}")
        return {
            "statusCode": 500,
            "body": json.dumps({"error": f"Internal error: {type(e).__name__}"}),
        }

    # --- 5. レスポンスの処理 ---
    # 2xx: そのままクライアントへ
    if 200 <= status < 300:
        print(f"INFO: Gemini success status={status}, body_len={len(resp_body)}")
        return {
            "statusCode": 200,
            "body": resp_body,
        }

    # non-2xx: エラーメッセージを抽出してステータスを伝播
    error_message = _extract_error_message(
        resp_body, fallback=f"Gemini API returned HTTP {status}"
    )

    # 401/413/429 はクライアントに意味のある情報なのでそのまま伝播。
    # それ以外の 4xx/5xx もステータスコードは保持する (デバッグ用)。
    out_status = status if status in PASSTHROUGH_STATUS else status
    print(
        f"ERROR: Gemini returned status={status}, passthrough={out_status}, "
        f"message={error_message}"
    )
    return {
        "statusCode": out_status,
        "body": json.dumps({"error": error_message}),
    }


# ============================================================
# ローカル smoke test
# ============================================================

if __name__ == "__main__":
    # GEMINI_API_KEY が未設定なら実呼び出しはスキップし、バリデーションのみ確認。
    print("=== gemini_proxy handler smoke test ===")

    # ケース1: GEMINI_API_KEY 未設定 → 500
    os.environ.pop("GEMINI_API_KEY", None)
    r = lambda_handler(
        {
            "model": "gemini-1.5-flash-8b",
            "contents": [{"role": "user", "parts": [{"text": "hi"}]}],
        },
        None,
    )
    print("[case1] no api key:", r["statusCode"], r["body"])
    assert r["statusCode"] == 500

    # ダミーキーを設定 (実呼び出しはしない)
    os.environ["GEMINI_API_KEY"] = "dummy_for_validation_test"

    # ケース2: model 欠落 → 400
    r = lambda_handler(
        {"contents": [{"role": "user", "parts": [{"text": "hi"}]}]}, None
    )
    print("[case2] missing model:", r["statusCode"], r["body"])
    assert r["statusCode"] == 400

    # ケース3: 許可されていない model → 400
    r = lambda_handler(
        {
            "model": "gpt-4",
            "contents": [{"role": "user", "parts": [{"text": "hi"}]}],
        },
        None,
    )
    print("[case3] disallowed model:", r["statusCode"], r["body"])
    assert r["statusCode"] == 400

    # ケース4: contents 空 → 400
    r = lambda_handler({"model": "gemini-1.5-flash-8b", "contents": []}, None)
    print("[case4] empty contents:", r["statusCode"], r["body"])
    assert r["statusCode"] == 400

    # ケース5: contents[0] 形式不正 → 400
    r = lambda_handler(
        {"model": "gemini-1.5-flash-8b", "contents": [{"role": "user"}]},
        None,
    )
    print("[case5] malformed contents:", r["statusCode"], r["body"])
    assert r["statusCode"] == 400

    # ケース6: バリデーション成功 (実呼び出しは dummy キーなので 400 が返るはず)
    real_key = os.environ.get("GEMINI_API_KEY_REAL")
    if real_key:
        os.environ["GEMINI_API_KEY"] = real_key
        r = lambda_handler(
            {
                "model": "gemini-1.5-flash-8b",
                "contents": [{"role": "user", "parts": [{"text": "Say 'pong'"}]}],
                "generationConfig": {"maxOutputTokens": 10},
            },
            None,
        )
        print("[case6] real call:", r["statusCode"], r["body"][:200])
    else:
        print("[case6] skipped (set GEMINI_API_KEY_REAL env to run real call)")

    print("=== smoke test OK ===")
