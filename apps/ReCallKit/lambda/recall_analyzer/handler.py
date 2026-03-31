"""
recall-kit-analyzer Lambda ハンドラー

エンドポイント: Lambda Function URL (POST)
認証: AWS_IAM (Cognito Identity Pool 経由の一時認証情報)

リクエストボディ:
    {
        "url": str,   # 解析元URL（ログ記録用）
        "text": str   # アプリ側で抽出済みの本文テキスト
    }

レスポンス 200:
    {
        "title": str,        # ページタイトル（30文字以内）
        "summary": str,      # 1〜2行の要約
        "qa_pairs": [        # 5〜8個のQ&Aペア
            {"question": str, "answer": str}
        ],
        "category": str      # 技術 / ビジネス / 科学 / 語学 / 一般教養 / その他
    }

カテゴリ自動判定の指示例（プロンプト内）:
    - 技術: プログラミング、AI/ML、クラウド、ソフトウェア開発、エンジニアリング
    - ビジネス: 経営、マーケティング、起業、投資、マネジメント
    - 科学: 自然科学、医学、物理、化学、生物
    - 語学: 英語学習、翻訳、言語習得、外国語
    - 一般教養: 歴史、哲学、文化、社会、教育
    - その他: 上記に当てはまらない場合
"""

import json
import logging
import os
import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

BEDROCK_REGION = "ap-northeast-1"
MODEL_ID = "anthropic.claude-3-5-haiku-20241022-v1:0"

# テキスト長制限
MAX_TEXT_LENGTH = 4000
LONG_TEXT_THRESHOLD = 8000
LONG_TEXT_HEAD = 2000
LONG_TEXT_TAIL = 2000

bedrock = boto3.client("bedrock-runtime", region_name=BEDROCK_REGION)


def truncate_text(text: str) -> str:
    """
    入力テキストを適切な長さに切り詰める。

    - 8000文字超: 前半2000文字 + 後半2000文字を結合（重要部分を保持）
    - 4000文字超: 先頭4000文字に切り詰め
    - それ以下: そのまま返す
    """
    if len(text) > LONG_TEXT_THRESHOLD:
        head = text[:LONG_TEXT_HEAD]
        tail = text[-LONG_TEXT_TAIL:]
        return head + "\n...[中略]...\n" + tail
    if len(text) > MAX_TEXT_LENGTH:
        return text[:MAX_TEXT_LENGTH]
    return text


def build_prompt(url: str, text: str) -> str:
    """Bedrock に送るプロンプトを生成する。"""
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
- 5〜8個生成すること
- ページの核心的な知識・事実・手順を網羅すること
- 1問1答で簡潔に（Aは3文以内）
- 日本語で生成すること

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


def lambda_handler(event, context):
    """
    Lambda Function URL から呼び出されるメインハンドラー。
    """
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

    if not text:
        return {
            "statusCode": 400,
            "body": json.dumps({"error": "text フィールドが必要です"}, ensure_ascii=False),
        }

    # テキスト切り詰め
    original_length = len(text)
    text = truncate_text(text)
    logger.info("入力テキスト長: %d文字 → %d文字に切り詰め (URL: %s)", original_length, len(text), url)

    # プロンプト生成
    prompt = build_prompt(url, text)

    # Bedrock 呼び出し
    try:
        response = bedrock.invoke_model(
            modelId=MODEL_ID,
            contentType="application/json",
            accept="application/json",
            body=json.dumps(
                {
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": 2048,
                    "messages": [
                        {"role": "user", "content": prompt}
                    ],
                }
            ),
        )
    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        logger.error("Bedrock 呼び出しエラー: %s - %s", error_code, e)
        return {
            "statusCode": 500,
            "body": json.dumps(
                {"error": f"Bedrock エラー: {error_code}"}, ensure_ascii=False
            ),
        }
    except Exception as e:
        logger.error("予期しないエラー (Bedrock呼び出し): %s", e)
        return {
            "statusCode": 500,
            "body": json.dumps({"error": "内部エラーが発生しました"}, ensure_ascii=False),
        }

    # レスポンスのパース
    try:
        response_body = json.loads(response["body"].read())
        raw_text = response_body["content"][0]["text"].strip()

        # JSONブロック（```json ... ```）が含まれる場合は取り除く
        if raw_text.startswith("```"):
            lines = raw_text.split("\n")
            raw_text = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])

        result = json.loads(raw_text)
    except (json.JSONDecodeError, KeyError, IndexError) as e:
        logger.error("レスポンスのJSON解析失敗: %s", e)
        return {
            "statusCode": 500,
            "body": json.dumps(
                {"error": "AIレスポンスのパースに失敗しました"}, ensure_ascii=False
            ),
        }

    # 必須フィールドの検証とデフォルト補完
    result.setdefault("title", "無題")
    result.setdefault("summary", "")
    result.setdefault("qa_pairs", [])
    result.setdefault("category", "その他")

    qa_count = len(result.get("qa_pairs", []))
    logger.info(
        "解析完了: title=%s, category=%s, qa_pairs=%d件",
        result.get("title"),
        result.get("category"),
        qa_count,
    )

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(result, ensure_ascii=False),
    }
