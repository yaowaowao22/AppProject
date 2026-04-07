"""
Bedrock (Claude 3 Haiku) vs Gemma 4 E2B Q3_K_S 比較スクリプト
同一サンプルテキストで両モデルを実行して出力を並べて表示する

使い方:
    PYTHONIOENCODING=utf-8 python compare_bedrock_vs_gemma.py
    PYTHONIOENCODING=utf-8 python compare_bedrock_vs_gemma.py --url https://example.com
"""

import argparse
import json
import re
import ssl
import sys
import time
import urllib.request
import urllib.error

import boto3
import requests
from botocore.exceptions import ClientError

# ============================================================
# 設定
# ============================================================

BEDROCK_REGION = "ap-northeast-1"
BEDROCK_MODEL  = "anthropic.claude-3-haiku-20240307-v1:0"

OLLAMA_URL    = "http://localhost:11434/api/chat"
OLLAMA_MODEL  = "gemma4-q3ks"

MAX_TEXT_LENGTH     = 12000
LONG_TEXT_THRESHOLD = 20000
LONG_TEXT_HEAD      = 6000
LONG_TEXT_TAIL      = 6000

FETCH_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
}

SAMPLE_TEXT = """
Gemma 4 は Google DeepMind が 2026年4月にリリースしたオープンモデルファミリーです。
E2B（約2B有効パラメータ）と E4B（約4B有効パラメータ）はエッジデバイス向けに設計されており、
Per-Layer Embeddings（PLE）技術により軽量ながら高い表現力を持ちます。
全モデルが Apache 2.0 ライセンスで公開されており、商用利用も可能です。
コンテキストウィンドウは E2B/E4B が 128K トークン、26B/31B が 256K トークンです。
Ollama v0.20.0 以降でネイティブサポートされており、
`ollama pull gemma4:e2b` で即時利用できます。
JSON スキーマ出力にもネイティブ対応しており、構造化データの生成に適しています。
"""
SAMPLE_URL = "https://blog.google/technology/developers/gemma4/"


# ============================================================
# 共通ユーティリティ
# ============================================================

def fetch_and_extract(url: str) -> str:
    ctx = ssl._create_unverified_context()
    req = urllib.request.Request(url, headers=FETCH_HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=15, context=ctx) as resp:
            html = resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"HTTP {e.code}") from e
    except Exception as e:
        raise RuntimeError(str(e)) from e

    html = re.sub(r"<(script|style|noscript)[^>]*>[\s\S]*?</\1>", "", html, flags=re.IGNORECASE)
    for tag in ("article", "main"):
        m = re.search(rf"<{tag}[^>]*>([\s\S]*?)</{tag}>", html, re.IGNORECASE)
        if m:
            text = re.sub(r"<[^>]+>", " ", m.group(1))
            text = re.sub(r"\s+", " ", text).strip()
            if len(text) > 100:
                return text[:MAX_TEXT_LENGTH]
    paragraphs = re.findall(r"<p[^>]*>([\s\S]*?)</p>", html, re.IGNORECASE)
    if paragraphs:
        text = " ".join(re.sub(r"<[^>]+>", " ", p) for p in paragraphs)
        text = re.sub(r"\s+", " ", text).strip()
        if text:
            return text[:MAX_TEXT_LENGTH]
    m = re.search(r"<body[^>]*>([\s\S]*?)</body>", html, re.IGNORECASE)
    raw = m.group(1) if m else html
    text = re.sub(r"<[^>]+>", " ", raw)
    return re.sub(r"\s+", " ", text).strip()[:MAX_TEXT_LENGTH]


def truncate_text(text: str) -> str:
    if len(text) > LONG_TEXT_THRESHOLD:
        return text[:LONG_TEXT_HEAD] + "\n...[中略]...\n" + text[-LONG_TEXT_TAIL:]
    if len(text) > MAX_TEXT_LENGTH:
        return text[:MAX_TEXT_LENGTH]
    return text


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


def parse_json_output(raw: str) -> dict | None:
    clean = raw.strip()
    if clean.startswith("```"):
        lines = clean.split("\n")
        clean = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])
    # <think>...</think> ブロック除去（Gemma thinkingモード対応）
    clean = re.sub(r"<think>[\s\S]*?</think>", "", clean).strip()
    try:
        return json.loads(clean)
    except json.JSONDecodeError:
        return None


# ============================================================
# Bedrock 呼び出し
# ============================================================

def run_bedrock(prompt: str) -> dict:
    bedrock = boto3.client("bedrock-runtime", region_name=BEDROCK_REGION)
    start = time.time()
    try:
        response = bedrock.invoke_model(
            modelId=BEDROCK_MODEL,
            contentType="application/json",
            accept="application/json",
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 8192,
                "messages": [{"role": "user", "content": prompt}],
            }),
        )
    except ClientError as e:
        return {"error": str(e), "elapsed": time.time() - start}

    elapsed = time.time() - start
    body = json.loads(response["body"].read())
    raw  = body["content"][0]["text"].strip()
    usage = body.get("usage", {})

    return {
        "raw":           raw,
        "elapsed":       elapsed,
        "input_tokens":  usage.get("input_tokens", 0),
        "output_tokens": usage.get("output_tokens", 0),
        "tps":           usage.get("output_tokens", 0) / elapsed if elapsed > 0 else 0,
        "cost_usd":      usage.get("input_tokens", 0) * 0.00025/1000
                        + usage.get("output_tokens", 0) * 0.00125/1000,
    }


# ============================================================
# Ollama 呼び出し
# ============================================================

def run_ollama(prompt: str) -> dict:
    payload = {
        "model": OLLAMA_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "stream": False,
        "options": {"temperature": 0},
    }
    start = time.time()
    try:
        resp = requests.post(OLLAMA_URL, json=payload, timeout=300)
        resp.raise_for_status()
    except requests.exceptions.ConnectionError:
        return {"error": "Ollama未起動（ollama serve を実行してください）", "elapsed": 0}
    except Exception as e:
        return {"error": str(e), "elapsed": time.time() - start}

    elapsed = time.time() - start
    data = resp.json()
    raw  = data["message"]["content"].strip()
    eval_count    = data.get("eval_count", 0)
    eval_duration = data.get("eval_duration", 1) / 1e9

    return {
        "raw":           raw,
        "elapsed":       elapsed,
        "output_tokens": eval_count,
        "tps":           eval_count / eval_duration if eval_duration > 0 else 0,
        "cost_usd":      0.0,
    }


# ============================================================
# 比較表示
# ============================================================

SEP  = "=" * 64
SEP2 = "-" * 64

def print_result(label: str, result: dict):
    print(f"\n{SEP}")
    print(f"  {label}")
    print(SEP)

    if "error" in result:
        print(f"[ERROR] {result['error']}")
        return

    parsed = parse_json_output(result["raw"])

    # --- 統計 ---
    print(f"  所要時間    : {result['elapsed']:.1f}s")
    print(f"  出力トークン: {result.get('output_tokens', '?')}")
    print(f"  速度        : {result.get('tps', 0):.1f} tok/s")
    cost = result.get("cost_usd", 0)
    print(f"  コスト      : {'無料（ローカル）' if cost == 0 else f'${cost:.6f}'}")

    print(SEP2)

    if parsed is None:
        print("[NG] JSONパース失敗")
        print("生出力(先頭500文字):")
        print(result["raw"][:500])
        return

    print(f"[OK] JSONパース成功")
    print(f"  title    : {parsed.get('title')}")
    print(f"  category : {parsed.get('category')}")
    qa = parsed.get("qa_pairs", [])
    print(f"  Q&A件数  : {len(qa)} 件")
    print(f"  summary  :\n    {parsed.get('summary', '')}")
    print()
    for i, qa_pair in enumerate(qa, 1):
        print(f"  Q{i:02d}: {qa_pair.get('question')}")
        print(f"  A{i:02d}: {qa_pair.get('answer')}")

    return parsed


def print_comparison(bedrock_parsed, gemma_parsed):
    print(f"\n{SEP}")
    print("  比較サマリー")
    print(SEP)

    if not bedrock_parsed or not gemma_parsed:
        print("片方のパースが失敗のため比較スキップ")
        return

    b_qa = bedrock_parsed.get("qa_pairs", [])
    g_qa = gemma_parsed.get("qa_pairs", [])

    print(f"{'項目':<20} {'Bedrock (Haiku)':<25} {'Gemma4 Q3KS':<25}")
    print(SEP2)
    print(f"{'title':<20} {str(bedrock_parsed.get('title',''))[:24]:<25} {str(gemma_parsed.get('title',''))[:24]:<25}")
    print(f"{'category':<20} {str(bedrock_parsed.get('category',''))[:24]:<25} {str(gemma_parsed.get('category',''))[:24]:<25}")
    print(f"{'Q&A件数':<20} {len(b_qa):<25} {len(g_qa):<25}")


# ============================================================
# メイン
# ============================================================

def main():
    parser = argparse.ArgumentParser(description="Bedrock vs Gemma 4 比較テスト")
    parser.add_argument("--url",            default="", help="解析するURL")
    parser.add_argument("--bedrock-only",   action="store_true")
    parser.add_argument("--gemma-only",     action="store_true")
    args = parser.parse_args()

    # テキスト取得
    if args.url:
        print(f"[フェッチ] {args.url}")
        try:
            text = fetch_and_extract(args.url)
            url  = args.url
        except RuntimeError as e:
            print(f"ERROR: {e}")
            sys.exit(1)
    else:
        print("[サンプルテキスト使用]")
        text = SAMPLE_TEXT.strip()
        url  = SAMPLE_URL

    text = truncate_text(text)
    print(f"[テキスト長] {len(text)} 文字")

    prompt = build_prompt(url, text)

    bedrock_parsed = None
    gemma_parsed   = None

    # Bedrock
    if not args.gemma_only:
        print(f"\n[1/2] Bedrock ({BEDROCK_MODEL}) 呼び出し中...")
        bedrock_result = run_bedrock(prompt)
        bedrock_parsed = print_result("Bedrock — Claude 3 Haiku", bedrock_result)

    # Gemma
    if not args.bedrock_only:
        print(f"\n[2/2] Gemma 4 E2B Q3_K_S (Ollama) 呼び出し中...")
        gemma_result = run_ollama(prompt)
        gemma_parsed = print_result("Gemma 4 E2B Q3_K_S — ローカル", gemma_result)

    # 比較表
    if not args.bedrock_only and not args.gemma_only:
        print_comparison(bedrock_parsed, gemma_parsed)


if __name__ == "__main__":
    main()
