"""
recall-kit-analyzer Lambda ハンドラー

エンドポイント: Lambda Function URL (POST)
認証: AWS_IAM (Cognito Identity Pool 経由の一時認証情報)

リクエストボディ:
    {
        "url": str,   # 解析元URL
        "text": str   # アプリ側で抽出済みの本文テキスト（省略時はLambdaがフェッチ）
    }

レスポンス 200:
    {
        "title": str,        # ページタイトル（30文字以内）
        "summary": str,      # 1〜2行の要約
        "qa_pairs": [        # 内容量に応じて10〜40個のQ&Aペア
            {"question": str, "answer": str}
        ],
        "category": str      # 技術 / ビジネス / 科学 / 語学 / 一般教養 / その他
    }

コスト記録:
    s3://aimensetu-storage-376408658186/recall-kit-costs/YYYY/MM/DD/*.json

リクエスト/レスポンスログ:
    s3://aimensetu-storage-376408658186/recall-kit-logs/YYYY/MM/DD/*.json
"""

import json
import logging
import re
import ssl
import uuid
import urllib.request
import urllib.error
from datetime import datetime, timezone

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

BEDROCK_REGION = "ap-northeast-1"
MODEL_ID = "anthropic.claude-3-haiku-20240307-v1:0"

# Claude 3 Haiku on Bedrock (ap-northeast-1) の料金（USD per token）
PRICE_INPUT_PER_TOKEN  = 0.00025 / 1000   # $0.00025 / 1K tokens
PRICE_OUTPUT_PER_TOKEN = 0.00125 / 1000   # $0.00125 / 1K tokens

# S3保存先
COST_LOG_BUCKET = "aimensetu-storage-376408658186"
COST_LOG_PREFIX = "recall-kit-costs"
REQUEST_LOG_PREFIX = "recall-kit-logs"

# テキスト長制限
MAX_TEXT_LENGTH = 12000
LONG_TEXT_THRESHOLD = 20000
LONG_TEXT_HEAD = 6000
LONG_TEXT_TAIL = 6000

bedrock = boto3.client("bedrock-runtime", region_name=BEDROCK_REGION)
s3 = boto3.client("s3")

USER_AGENTS = [
    # Chrome 131 on macOS
    (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/131.0.0.0 Safari/537.36"
    ),
    # Safari 17 on macOS
    (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/605.1.15 (KHTML, like Gecko) "
        "Version/17.6 Safari/605.1.15"
    ),
]

FETCH_HEADERS_BASE = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Upgrade-Insecure-Requests": "1",
}

MAX_RETRIES = 2
RETRYABLE_CODES = {403, 429, 500, 502, 503, 504}


# ============================================================
# URLフェッチ・テキスト抽出
# ============================================================

def _extract_text_from_html(html: str) -> str:
    """HTML文字列からテキストを抽出する。"""
    # script / style / noscript を除去
    html = re.sub(r"<(script|style|noscript)[^>]*>[\s\S]*?</\1>", "", html, flags=re.IGNORECASE)
    # コメント除去
    html = re.sub(r"<!--[\s\S]*?-->", "", html)

    # 1. article → main の順で抽出（ネスト対応: 最長マッチ）
    for tag in ("article", "main"):
        content = _extract_outer_tag(html, tag)
        if content:
            text = re.sub(r"<[^>]+>", " ", content)
            text = re.sub(r"\s+", " ", text).strip()
            if len(text) > 100:
                return text[:MAX_TEXT_LENGTH]

    # 2. role="article" コンテナ（note.com 等のCMS対応）
    m = re.search(r'role\s*=\s*["\']article["\'][^>]*>([\s\S]*?)(?:</div>|</section>)', html, re.IGNORECASE)
    if m:
        text = re.sub(r"<[^>]+>", " ", m.group(1))
        text = re.sub(r"\s+", " ", text).strip()
        if len(text) > 100:
            return text[:MAX_TEXT_LENGTH]

    # 3. <section> タグの集合（note.com 等で使われる）
    sections = re.findall(r"<section[^>]*>([\s\S]*?)</section>", html, re.IGNORECASE)
    if sections:
        texts = []
        for sec in sections:
            t = re.sub(r"<[^>]+>", " ", sec)
            t = re.sub(r"\s+", " ", t).strip()
            if len(t) > 30:
                texts.append(t)
        if texts:
            combined = " ".join(texts)
            if len(combined) > 200:
                return combined[:MAX_TEXT_LENGTH]

    # 4. <p> タグを全結合
    paragraphs = re.findall(r"<p[^>]*>([\s\S]*?)</p>", html, re.IGNORECASE)
    if paragraphs:
        text = " ".join(re.sub(r"<[^>]+>", " ", p) for p in paragraphs)
        text = re.sub(r"\s+", " ", text).strip()
        if text:
            return text[:MAX_TEXT_LENGTH]

    # 5. fallback: body 全体
    body = _extract_outer_tag(html, "body")
    raw = body if body else html
    text = re.sub(r"<[^>]+>", " ", raw)
    return re.sub(r"\s+", " ", text).strip()[:MAX_TEXT_LENGTH]


def _extract_outer_tag(html: str, tag: str) -> str | None:
    """指定タグの最も外側のブロック内容を返す（ネスト対応）。"""
    open_re = re.compile(rf"<{tag}[\s>]", re.IGNORECASE)
    close_re = re.compile(rf"</{tag}\s*>", re.IGNORECASE)

    open_m = open_re.search(html)
    if not open_m:
        return None

    tag_close_idx = html.find(">", open_m.start())
    if tag_close_idx == -1:
        return None

    depth = 1
    pos = tag_close_idx + 1

    while depth > 0 and pos < len(html):
        next_open = open_re.search(html, pos)
        next_close = close_re.search(html, pos)

        if not next_close:
            break

        if next_open and next_open.start() < next_close.start():
            depth += 1
            pos = next_open.end()
        else:
            depth -= 1
            if depth == 0:
                return html[tag_close_idx + 1 : next_close.start()]
            pos = next_close.end()

    return html[tag_close_idx + 1 : pos]


def fetch_and_extract(url: str) -> str:
    """URLをサーバー側でフェッチしてテキストを抽出する。403等はUAを変えてリトライ。"""
    ctx = ssl._create_unverified_context()
    last_error = None

    for attempt in range(1 + MAX_RETRIES):
        ua = USER_AGENTS[attempt % len(USER_AGENTS)]
        headers = {**FETCH_HEADERS_BASE, "User-Agent": ua}
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=20, context=ctx) as resp:
                html = resp.read().decode("utf-8", errors="replace")
            return _extract_text_from_html(html)
        except urllib.error.HTTPError as e:
            last_error = e
            if e.code in RETRYABLE_CODES and attempt < MAX_RETRIES:
                logger.warning("HTTP %d for %s, retrying (%d/%d)...", e.code, url, attempt + 1, MAX_RETRIES)
                import time
                time.sleep(1.5 * (attempt + 1))
                continue
            raise RuntimeError(f"HTTP {e.code}") from e
        except Exception as e:
            last_error = e
            if attempt < MAX_RETRIES:
                logger.warning("Fetch error for %s: %s, retrying (%d/%d)...", url, e, attempt + 1, MAX_RETRIES)
                import time
                time.sleep(1.5 * (attempt + 1))
                continue
            raise RuntimeError(str(e)) from e

    raise RuntimeError(str(last_error))


# ============================================================
# テキスト切り詰め
# ============================================================

def truncate_text(text: str) -> str:
    if len(text) > LONG_TEXT_THRESHOLD:
        return text[:LONG_TEXT_HEAD] + "\n...[中略]...\n" + text[-LONG_TEXT_TAIL:]
    if len(text) > MAX_TEXT_LENGTH:
        return text[:MAX_TEXT_LENGTH]
    return text


# ============================================================
# プロンプト生成
# ============================================================

def build_prompt(url: str, text: str) -> str:
    return f"""以下はWebページの本文テキストです。
このページの内容を分析し、学習カード用のデータをJSON形式で生成してください。

【出力形式】
JSONオブジェクトのみを出力してください（説明文・マークダウン不要）:
{{
  "title": "ページタイトル（30文字以内）",
  "summary": "1〜2行の要約（内容を端的に説明）",
  "qa_pairs": [
    {{"question": "問い（?で終わる）", "answer": "答え（3文以内）"}}
  ],
  "category": "技術 or ビジネス or 科学 or 語学 or 一般教養 or その他"
}}

【Q&Aペアの要件】
- ページの内容量に応じて可能な限り多くのQ&Aペアを生成すること
- 短い記事: 10〜15個、中程度の記事: 15〜25個、長い記事: 25〜40個
- ページの全セクション・全トピックを網羅し、内容を取りこぼさないこと
- 同じ内容・同じ観点の質問を繰り返さないこと。各Q&Aは異なるトピック・異なる切り口にすること
- 1問1答で簡潔に（Aは3文以内）
- 日本語で生成すること
- 基礎的な問いから応用的な問いまでバランスよく含めること

【カテゴリ判定基準】
- 技術: プログラミング、AI/ML、クラウド、ソフトウェア開発、エンジニアリング
- ビジネス: 経営、マーケティング、起業、投資、マネジメント
- 科学: 自然科学、医学、物理、化学、生物
- 語学: 英語学習、翻訳、言語習得、外国語
- 一般教養: 歴史、哲学、文化、社会、教育
- その他: 上記に当てはまらない場合

URL: {url}
本文:
{text}"""


# ============================================================
# コストログをS3に保存（失敗してもメイン処理に影響しない）
# ============================================================

def save_cost_log(
    url: str,
    input_tokens: int,
    output_tokens: int,
    qa_count: int,
) -> None:
    cost_usd = (
        input_tokens  * PRICE_INPUT_PER_TOKEN +
        output_tokens * PRICE_OUTPUT_PER_TOKEN
    )
    now = datetime.now(timezone.utc)
    key = (
        f"{COST_LOG_PREFIX}/"
        f"{now.strftime('%Y/%m/%d')}/"
        f"{now.strftime('%Y%m%dT%H%M%SZ')}-{uuid.uuid4().hex[:8]}.json"
    )
    entry = {
        "timestamp": now.isoformat(),
        "url": url,
        "model": MODEL_ID,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "cost_usd": round(cost_usd, 8),
        "qa_count": qa_count,
    }
    try:
        s3.put_object(
            Bucket=COST_LOG_BUCKET,
            Key=key,
            Body=json.dumps(entry, ensure_ascii=False),
            ContentType="application/json",
        )
        logger.info(
            "コスト記録: input=%d output=%d cost=$%.6f → s3://%s/%s",
            input_tokens, output_tokens, cost_usd, COST_LOG_BUCKET, key,
        )
    except Exception as e:
        logger.warning("コストログのS3保存失敗（処理は継続）: %s", e)


# ============================================================
# メインハンドラー
# ============================================================

def lambda_handler(event, context):
    # リクエストボディのパース
    try:
        if isinstance(event.get("body"), str):
            body = json.loads(event["body"])
        else:
            body = event.get("body") or event
    except (json.JSONDecodeError, TypeError) as e:
        logger.error("リクエストボディのパース失敗: %s", e)
        return {
            "statusCode": 400,
            "body": json.dumps({"error": "Invalid JSON body"}, ensure_ascii=False),
        }

    url = body.get("url", "")
    text = body.get("text", "")

    # text が未提供の場合は Lambda 側でURLをフェッチ
    if not text:
        if not url:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "url フィールドが必要です"}, ensure_ascii=False),
            }
        try:
            text = fetch_and_extract(url)
        except RuntimeError as e:
            logger.error("URLフェッチ失敗: %s - %s", url, e)
            return {
                "statusCode": 400,
                "body": json.dumps(
                    {"error": f"ページの読み込みに失敗しました: {e}"}, ensure_ascii=False
                ),
            }
        if not text:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "本文を抽出できませんでした"}, ensure_ascii=False),
            }

    # テキスト切り詰め
    original_length = len(text)
    text = truncate_text(text)
    logger.info("入力テキスト長: %d文字 → %d文字 (URL: %s)", original_length, len(text), url)

    # Bedrock 呼び出し
    prompt = build_prompt(url, text)
    try:
        response = bedrock.invoke_model(
            modelId=MODEL_ID,
            contentType="application/json",
            accept="application/json",
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 8192,
                "messages": [{"role": "user", "content": prompt}],
            }),
        )
    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        logger.error("Bedrock 呼び出しエラー: %s - %s", error_code, e)
        return {
            "statusCode": 500,
            "body": json.dumps({"error": f"Bedrock エラー: {error_code}"}, ensure_ascii=False),
        }
    except Exception as e:
        logger.error("予期しないエラー (Bedrock): %s", e)
        return {
            "statusCode": 500,
            "body": json.dumps({"error": "内部エラーが発生しました"}, ensure_ascii=False),
        }

    # レスポンスのパース
    try:
        response_body = json.loads(response["body"].read())
        raw_text = response_body["content"][0]["text"].strip()

        # ```json ... ``` ブロックを除去
        if raw_text.startswith("```"):
            lines = raw_text.split("\n")
            raw_text = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])

        result = json.loads(raw_text)

        # トークン数取得 → コストログ
        usage = response_body.get("usage", {})
        input_tokens  = usage.get("input_tokens", 0)
        output_tokens = usage.get("output_tokens", 0)
    except (json.JSONDecodeError, KeyError, IndexError) as e:
        logger.error("レスポンスのJSON解析失敗: %s", e)
        return {
            "statusCode": 500,
            "body": json.dumps({"error": "AIレスポンスのパースに失敗しました"}, ensure_ascii=False),
        }

    # 必須フィールド補完
    result.setdefault("title", "無題")
    result.setdefault("summary", "")
    result.setdefault("qa_pairs", [])
    result.setdefault("category", "その他")

    qa_count = len(result.get("qa_pairs", []))
    logger.info(
        "解析完了: title=%s, category=%s, qa_pairs=%d件, tokens=%d+%d",
        result.get("title"), result.get("category"), qa_count,
        input_tokens, output_tokens,
    )

    # コストをS3に非同期的に記録（失敗しても200を返す）
    save_cost_log(url, input_tokens, output_tokens, qa_count)

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(result, ensure_ascii=False),
    }
