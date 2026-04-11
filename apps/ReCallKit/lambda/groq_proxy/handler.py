"""
recall-kit-groq-proxy Lambda ハンドラー

エンドポイント: Lambda (InvokeCommand 経由)
認証: AWS_IAM (Cognito Identity Pool 経由の一時認証情報)

役割:
    Groq OpenAI互換 Chat Completions API (/v1/chat/completions) への透過プロキシ。
    クライアント (React Native) に Groq API キーを持たせないための中継点。

リクエストボディ (event):
    {
        "model": "llama-3.1-8b-instant" | "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": "..."},
            {"role": "user",   "content": "..."}
        ],
        "temperature": 0.3,
        "max_tokens": 2500,
        "response_format": {"type": "json_object"}
    }

レスポンス 200:
    {
        "statusCode": 200,
        "body": "<Groq のレスポンスJSONを文字列化したもの>"
    }

レスポンス エラー:
    {
        "statusCode": 400 | 401 | 413 | 429 | 500 | 504,
        "body": json.dumps({"error": "<メッセージ>"})
    }

環境変数:
    GROQ_API_KEY — Groq Cloud の API キー (必須)
"""

import json
import os
import urllib.request
import urllib.error

# ============================================================
# 定数
# ============================================================

GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"

# モデル allow-list (悪用防止)。Groq 以外のモデル名、または高価格モデルを拒否。
ALLOWED_MODELS = {
    "llama-3.1-8b-instant",
    "llama-3.3-70b-versatile",
}

# Groq API タイムアウト (秒)。Lambda最大 60s、RNクライアントも 60s なので 55s で打ち切る。
GROQ_TIMEOUT_SEC = 55

# 上流から伝播させたい HTTP ステータス (401/413/429 はクライアントで意味がある)
PASSTHROUGH_STATUS = {401, 413, 429}


# ============================================================
# バリデーション
# ============================================================

def _validate_payload(body: dict) -> tuple[bool, str]:
    """
    Groq リクエストボディのバリデーション。
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

    messages = body.get("messages")
    if not isinstance(messages, list) or len(messages) == 0:
        return False, "'messages' field is required and must be a non-empty list"

    for i, msg in enumerate(messages):
        if not isinstance(msg, dict):
            return False, f"messages[{i}] must be an object"
        if "role" not in msg or "content" not in msg:
            return False, f"messages[{i}] must have 'role' and 'content' fields"

    return True, ""


# ============================================================
# Groq API 呼び出し
# ============================================================

def _call_groq(api_key: str, payload: dict) -> tuple[int, str]:
    """
    Groq /v1/chat/completions を呼び出す。
    戻り値: (status_code: int, response_body: str)

    例外:
        urllib.error.URLError — ネットワーク/タイムアウト
    """
    data = json.dumps(payload).encode("utf-8")
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    req = urllib.request.Request(GROQ_ENDPOINT, data=data, headers=headers, method="POST")

    try:
        with urllib.request.urlopen(req, timeout=GROQ_TIMEOUT_SEC) as resp:
            body_str = resp.read().decode("utf-8", errors="replace")
            return resp.status, body_str
    except urllib.error.HTTPError as e:
        # Groq から 4xx/5xx が返った場合はここに到達する。
        # ステータス・ボディを保持して返すため、呼び出し側で処理。
        body_bytes = e.read() if hasattr(e, "read") else b""
        body_str = body_bytes.decode("utf-8", errors="replace") if body_bytes else ""
        return e.code, body_str


# ============================================================
# Groq エラーボディから error メッセージを抜き出す
# ============================================================

def _extract_error_message(body_str: str, fallback: str) -> str:
    """
    Groq のエラーレスポンスは通常 {"error": {"message": "...", "type": "..."}} 形式。
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
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        print("ERROR: GROQ_API_KEY env var not set")
        return {
            "statusCode": 500,
            "body": json.dumps({"error": "GROQ_API_KEY env var not set"}),
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

    model = body.get("model")
    msg_count = len(body.get("messages", []))
    print(f"INFO: forwarding to Groq — model={model}, messages={msg_count}")

    # --- 4. Groq 呼び出し ---
    try:
        status, resp_body = _call_groq(api_key, body)
    except urllib.error.URLError as e:
        # ネットワークエラー・タイムアウト
        reason = getattr(e, "reason", str(e))
        print(f"ERROR: Groq upstream network error: {reason}")
        return {
            "statusCode": 504,
            "body": json.dumps({"error": "Upstream Groq API timed out"}),
        }
    except Exception as e:
        # 想定外の例外
        print(f"ERROR: unexpected error calling Groq: {type(e).__name__}: {e}")
        return {
            "statusCode": 500,
            "body": json.dumps({"error": f"Internal error: {type(e).__name__}"}),
        }

    # --- 5. レスポンスの処理 ---
    # 2xx: そのままクライアントへ
    if 200 <= status < 300:
        print(f"INFO: Groq success status={status}, body_len={len(resp_body)}")
        # Groq のレスポンスは既に JSON 文字列。json.dumps で再シリアライズは不要だが
        # 仕様 (json.dumps() via 文字列化) に合わせて pass-through する。
        return {
            "statusCode": 200,
            "body": resp_body,
        }

    # non-2xx: エラーメッセージを抽出してステータスを伝播
    error_message = _extract_error_message(
        resp_body, fallback=f"Groq API returned HTTP {status}"
    )

    # 401/413/429 はクライアントに意味のある情報なのでそのまま伝播。
    # それ以外の 4xx/5xx もステータスコードは保持する (デバッグ用)。
    out_status = status if status in PASSTHROUGH_STATUS else status
    print(
        f"ERROR: Groq returned status={status}, passthrough={out_status}, "
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
    # GROQ_API_KEY が未設定なら実呼び出しはスキップし、バリデーションのみ確認。
    print("=== groq_proxy handler smoke test ===")

    # ケース1: GROQ_API_KEY 未設定 → 500
    os.environ.pop("GROQ_API_KEY", None)
    r = lambda_handler({"model": "llama-3.1-8b-instant", "messages": [{"role": "user", "content": "hi"}]}, None)
    print("[case1] no api key:", r["statusCode"], r["body"])
    assert r["statusCode"] == 500

    # ダミーキーを設定 (実呼び出しはしない)
    os.environ["GROQ_API_KEY"] = "dummy_for_validation_test"

    # ケース2: model 欠落 → 400
    r = lambda_handler({"messages": [{"role": "user", "content": "hi"}]}, None)
    print("[case2] missing model:", r["statusCode"], r["body"])
    assert r["statusCode"] == 400

    # ケース3: 許可されていない model → 400
    r = lambda_handler({"model": "gpt-4", "messages": [{"role": "user", "content": "hi"}]}, None)
    print("[case3] disallowed model:", r["statusCode"], r["body"])
    assert r["statusCode"] == 400

    # ケース4: messages 空 → 400
    r = lambda_handler({"model": "llama-3.1-8b-instant", "messages": []}, None)
    print("[case4] empty messages:", r["statusCode"], r["body"])
    assert r["statusCode"] == 400

    # ケース5: messages[0] 形式不正 → 400
    r = lambda_handler({"model": "llama-3.1-8b-instant", "messages": [{"role": "user"}]}, None)
    print("[case5] malformed message:", r["statusCode"], r["body"])
    assert r["statusCode"] == 400

    # ケース6: バリデーション成功 (実呼び出しは dummy キーなので 401 が返るはず)
    real_key = os.environ.get("GROQ_API_KEY_REAL")
    if real_key:
        os.environ["GROQ_API_KEY"] = real_key
        r = lambda_handler(
            {
                "model": "llama-3.1-8b-instant",
                "messages": [{"role": "user", "content": "Say 'pong'"}],
                "max_tokens": 10,
            },
            None,
        )
        print("[case6] real call:", r["statusCode"], r["body"][:200])
    else:
        print("[case6] skipped (set GROQ_API_KEY_REAL env to run real call)")

    print("=== smoke test OK ===")
