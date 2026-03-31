"""
ReCallKit Bedrock コスト確認スクリプト
S3 の recall-kit-costs/ 以下のログを集計して表示する。

使い方:
    python lambda/check-costs.py
    python lambda/check-costs.py --days 7   # 直近7日分だけ表示
"""

import argparse
import io
import sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
import json
import sys
from collections import defaultdict
from datetime import datetime, timezone, timedelta

import boto3

BUCKET = "aimensetu-storage-376408658186"
PREFIX = "recall-kit-costs/"


def fetch_logs(days: int | None) -> list[dict]:
    s3 = boto3.client("s3")
    paginator = s3.get_paginator("list_objects_v2")

    cutoff = None
    if days is not None:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    logs = []
    for page in paginator.paginate(Bucket=BUCKET, Prefix=PREFIX):
        for obj in page.get("Contents", []):
            if cutoff and obj["LastModified"] < cutoff:
                continue
            body = s3.get_object(Bucket=BUCKET, Key=obj["Key"])["Body"].read()
            try:
                logs.append(json.loads(body))
            except json.JSONDecodeError:
                pass

    return logs


def main():
    parser = argparse.ArgumentParser(description="ReCallKit Bedrock コスト確認")
    parser.add_argument("--days", type=int, default=None, help="直近N日分のみ集計")
    args = parser.parse_args()

    print("S3からコストログを取得中...")
    logs = fetch_logs(args.days)

    if not logs:
        print("ログが見つかりません。")
        return

    # 日別集計
    by_date: dict[str, dict] = defaultdict(
        lambda: {"requests": 0, "input_tokens": 0, "output_tokens": 0, "cost_usd": 0.0, "qa_count": 0}
    )
    total = {"requests": 0, "input_tokens": 0, "output_tokens": 0, "cost_usd": 0.0, "qa_count": 0}

    for log in logs:
        date = log.get("timestamp", "")[:10]  # YYYY-MM-DD
        by_date[date]["requests"]      += 1
        by_date[date]["input_tokens"]  += log.get("input_tokens", 0)
        by_date[date]["output_tokens"] += log.get("output_tokens", 0)
        by_date[date]["cost_usd"]      += log.get("cost_usd", 0.0)
        by_date[date]["qa_count"]      += log.get("qa_count", 0)
        total["requests"]      += 1
        total["input_tokens"]  += log.get("input_tokens", 0)
        total["output_tokens"] += log.get("output_tokens", 0)
        total["cost_usd"]      += log.get("cost_usd", 0.0)
        total["qa_count"]      += log.get("qa_count", 0)

    # 表示
    days_label = f"直近{args.days}日" if args.days else "全期間"
    print(f"\n{'='*52}")
    print(f"  ReCallKit Bedrockコスト ({days_label})")
    print(f"{'='*52}")
    print(f"  {'日付':<12}  {'件数':>4}  {'QA':>4}  {'入力tok':>8}  {'出力tok':>8}  {'費用(USD)':>10}  {'費用(円)':>8}")
    print(f"  {'-'*12}  {'-'*4}  {'-'*4}  {'-'*8}  {'-'*8}  {'-'*10}  {'-'*8}")

    for date in sorted(by_date):
        d = by_date[date]
        jpy = d["cost_usd"] * 150  # 概算 1USD=150JPY
        print(
            f"  {date:<12}  {d['requests']:>4}  {d['qa_count']:>4}"
            f"  {d['input_tokens']:>8,}  {d['output_tokens']:>8,}"
            f"  ${d['cost_usd']:>9.5f}  JPY{jpy:>7.1f}"
        )

    print(f"  {'─'*12}  {'─'*4}  {'─'*4}  {'─'*8}  {'─'*8}  {'─'*10}  {'─'*8}")
    jpy_total = total["cost_usd"] * 150
    avg_usd = total["cost_usd"] / total["requests"] if total["requests"] else 0
    print(
        f"  {'合計':<12}  {total['requests']:>4}  {total['qa_count']:>4}"
        f"  {total['input_tokens']:>8,}  {total['output_tokens']:>8,}"
        f"  ${total['cost_usd']:>9.5f}  JPY{jpy_total:>7.1f}"
    )
    print(f"{'='*52}")
    print(f"  1リクエスト平均: ${avg_usd:.5f}  (JPY{avg_usd*150:.2f})")
    print(f"{'='*52}\n")


if __name__ == "__main__":
    main()
