"""
Gemma 4 E2B ローカルテストスクリプト
Lambdaと同じプロンプトをOllamaで実行して出力を確認する

事前準備:
    1. Ollama インストール: https://ollama.com/download
    2-A. 手っ取り早く試す（Ollamaが管理するQ4_K_M, 7.2GB）:
            ollama pull gemma4:e2b
    2-B. Q3_K_S（~2.3GB）で試す:
            # HuggingFaceからダウンロード（huggingface-cli必要）
            pip install huggingface_hub
            huggingface-cli download unsloth/gemma-4-E2B-it-GGUF \
                gemma-4-E2B-it-Q3_K_S.gguf \
                --local-dir ./models
            # Ollamaに登録
            ollama create gemma4-q3ks -f ./Modelfile_Q3KS

使い方:
    python test_gemma_local.py                          # サンプルテキストで動作確認
    python test_gemma_local.py --url https://example.com  # URLを直接解析
    python test_gemma_local.py --model gemma4-q3ks       # Q3_K_S使用
"""

import argparse
import json
import re
import ssl
import sys
import time
import urllib.request
import urllib.error

import requests  # pip install requests

# Windows cp932環境でも日本語を正しく出力する
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# ============================================================
# 設定
# ============================================================

OLLAMA_URL   = "http://localhost:11434/api/chat"
DEFAULT_MODEL = "gemma4:e2b"   # 2-B で変えた場合は --model gemma4-q3ks

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

# サンプルテキスト（URLなしで動かすとき用）
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
# HTML フェッチ・テキスト抽出（Lambda と同じロジック）
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


# ============================================================
# プロンプト生成（Lambda と同じ）
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
# Ollama 呼び出し
# ============================================================

def call_ollama(model: str, prompt: str) -> dict:
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "stream": False,
        # temperature=0 で確定的出力
        "options": {"temperature": 0},
        # NOTE: think パラメータは省略（think=false + format の既知バグ回避）
    }

    print(f"\n[Ollama] モデル: {model}")
    print("[Ollama] 送信中... (初回は起動に数秒かかる場合あり)\n")

    start = time.time()
    try:
        resp = requests.post(OLLAMA_URL, json=payload, timeout=180)
        resp.raise_for_status()
    except requests.exceptions.ConnectionError:
        print("ERROR: Ollama に接続できません。")
        print("  → ollama serve を先に起動してください")
        sys.exit(1)
    except requests.exceptions.Timeout:
        print("ERROR: タイムアウト（180秒）")
        sys.exit(1)

    elapsed = time.time() - start
    data = resp.json()
    raw_text = data["message"]["content"].strip()

    # トークン統計
    eval_count    = data.get("eval_count", 0)
    eval_duration = data.get("eval_duration", 1) / 1e9  # ns → sec
    tps = eval_count / eval_duration if eval_duration > 0 else 0

    print(f"[統計] 所要時間: {elapsed:.1f}s  出力トークン: {eval_count}  速度: {tps:.1f} tok/s")

    return {"raw": raw_text, "stats": data}


# ============================================================
# メイン
# ============================================================

def write_markdown(out_path: str, url: str, model: str, elapsed: float, tps: float,
                   parsed: dict | None, raw: str, parse_ok: bool) -> None:
    """解析結果をMarkdownファイルに書き出す。"""
    from datetime import datetime
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    lines = [
        f"# Gemma 4 解析結果",
        f"",
        f"| 項目 | 値 |",
        f"|---|---|",
        f"| 日時 | {now} |",
        f"| モデル | `{model}` |",
        f"| URL | {url} |",
        f"| 所要時間 | {elapsed:.1f}s |",
        f"| 速度 | {tps:.1f} tok/s |",
        f"| JSON解析 | {'OK' if parse_ok else 'NG'} |",
        f"",
    ]

    if parse_ok and parsed:
        qa = parsed.get("qa_pairs", [])
        lines += [
            f"## メタ情報",
            f"",
            f"- **タイトル**: {parsed.get('title', '')}",
            f"- **カテゴリ**: {parsed.get('category', '')}",
            f"- **Q&A件数**: {len(qa)} 件",
            f"- **要約**: {parsed.get('summary', '')}",
            f"",
            f"## Q&A ペア",
            f"",
        ]
        for i, qa_pair in enumerate(qa, 1):
            lines += [
                f"### Q{i:02d}",
                f"**Q**: {qa_pair.get('question', '')}  ",
                f"**A**: {qa_pair.get('answer', '')}",
                f"",
            ]
    else:
        lines += [
            f"## 生の出力（パース失敗）",
            f"",
            f"```",
            raw,
            f"```",
            f"",
        ]

    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"\n[MD出力] {out_path}")


def main():
    parser = argparse.ArgumentParser(description="Gemma 4 E2B ローカルテスト")
    parser.add_argument("--url",   default="", help="解析するURL（省略時はサンプルテキスト使用）")
    parser.add_argument("--model", default=DEFAULT_MODEL, help=f"Ollamaモデル名 (default: {DEFAULT_MODEL})")
    parser.add_argument("--out",   default="", help="MD出力ファイルパス（省略時は自動生成）")
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
        print("[サンプルテキスト使用] --url <URL> で実URLを指定できます")
        text = SAMPLE_TEXT.strip()
        url  = SAMPLE_URL

    text = truncate_text(text)
    print(f"[テキスト長] {len(text)} 文字")

    # プロンプト生成・Ollama呼び出し
    prompt = build_prompt(url, text)
    result = call_ollama(args.model, prompt)
    raw    = result["raw"]
    stats  = result["stats"]
    elapsed     = stats.get("total_duration", 0) / 1e9
    eval_count  = stats.get("eval_count", 0)
    eval_dur    = stats.get("eval_duration", 1) / 1e9
    tps         = eval_count / eval_dur if eval_dur > 0 else 0

    print("\n" + "=" * 60)
    print("【生の出力】")
    print("=" * 60)
    print(raw)

    # JSON パース
    print("\n" + "=" * 60)
    print("【JSON パース結果】")
    print("=" * 60)

    clean = raw
    if clean.startswith("```"):
        lines = clean.split("\n")
        clean = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])

    parsed   = None
    parse_ok = False
    try:
        parsed   = json.loads(clean)
        parse_ok = True
        print("[OK] パース成功")
        print(f"  title    : {parsed.get('title')}")
        print(f"  summary  : {parsed.get('summary')}")
        print(f"  category : {parsed.get('category')}")
        qa = parsed.get("qa_pairs", [])
        print(f"  qa_pairs : {len(qa)} 件")
        print()
        for i, qa_pair in enumerate(qa, 1):
            print(f"  Q{i:02d}: {qa_pair.get('question')}")
            print(f"  A{i:02d}: {qa_pair.get('answer')}")
            print()
    except json.JSONDecodeError as e:
        print(f"[NG] パース失敗: {e}")
        print("  -> モデルがJSONを正しく出力していない可能性あり")

    # MD出力
    import re as _re
    slug = _re.sub(r"[^a-zA-Z0-9]+", "-", url)[-40:] if url else "sample"
    from datetime import datetime
    ts       = datetime.now().strftime("%Y%m%d_%H%M%S")
    out_path = args.out or f"result_{ts}_{slug}.md"
    write_markdown(out_path, url, args.model, elapsed, tps, parsed, raw, parse_ok)


if __name__ == "__main__":
    main()
