// ============================================================
// ローカルAI URL解析サービス
// Lambdaの代わりにPC上のOllama（Gemma 4）を直接呼び出す
//
// データフロー:
//   App → fetch(URL) → HTML抽出 → Ollamaプロンプト → JSON解析
// ============================================================

import {
  LOCAL_AI_HOST,
  LOCAL_AI_MODEL,
  LOCAL_AI_TIMEOUT_MS,
  LOCAL_AI_MAX_TEXT_LENGTH,
} from '../config/localAI';
import type { AnalysisResult } from '../types/analysis';

// ============================================================
// HTML テキスト抽出（Lambda の Python ロジックを TypeScript に移植）
// ============================================================

function extractTextFromHtml(html: string): string {
  // script / style / noscript を除去
  let cleaned = html.replace(/<(script|style|noscript)[^>]*>[\s\S]*?<\/\1>/gi, '');

  // article → main → p の順で抽出
  for (const tag of ['article', 'main']) {
    const match = cleaned.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
    if (match) {
      const text = match[1]
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (text.length > 100) return text.slice(0, LOCAL_AI_MAX_TEXT_LENGTH);
    }
  }

  // <p> タグを結合
  const paragraphs = [...cleaned.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map(m =>
    m[1].replace(/<[^>]+>/g, ' '),
  );
  if (paragraphs.length > 0) {
    const text = paragraphs.join(' ').replace(/\s+/g, ' ').trim();
    if (text.length > 0) return text.slice(0, LOCAL_AI_MAX_TEXT_LENGTH);
  }

  // fallback: body 全体
  const bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const raw = bodyMatch ? bodyMatch[1] : cleaned;
  return raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, LOCAL_AI_MAX_TEXT_LENGTH);
}

// ============================================================
// プロンプト生成（Lambda の build_prompt と同一）
// ============================================================

function buildPrompt(url: string, text: string): string {
  return `以下はWebページの本文テキストです。
このページの内容を分析し、学習カード用のデータをJSON形式で生成してください。

【出力形式】
JSONオブジェクトのみを出力してください（説明文・マークダウン不要）:
{
  "title": "ページタイトル（30文字以内）",
  "summary": "1〜2行の要約（内容を端的に説明）",
  "qa_pairs": [
    {"question": "問い（?で終わる）", "answer": "答え（3文以内）"}
  ],
  "category": "技術 or ビジネス or 科学 or 語学 or 一般教養 or その他"
}

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

URL: ${url}
本文:
${text}`;
}

// ============================================================
// JSON パース（```json ブロックに対応）
// ============================================================

function parseJsonResponse(raw: string): AnalysisResult {
  let text = raw.trim();
  if (text.startsWith('```')) {
    const lines = text.split('\n');
    const endIdx = lines.findLastIndex(l => l.trim() === '```');
    text = lines.slice(1, endIdx > 0 ? endIdx : undefined).join('\n');
  }
  const parsed = JSON.parse(text) as Partial<AnalysisResult>;
  return {
    title:    parsed.title    ?? '無題',
    summary:  parsed.summary  ?? '',
    qa_pairs: parsed.qa_pairs ?? [],
    category: parsed.category ?? 'その他',
  };
}

// ============================================================
// URL 解析メイン（bedrockAnalysisService.analyzeUrl と同一シグネチャ）
// ============================================================

export async function analyzeUrlLocal(url: string): Promise<AnalysisResult> {
  // 1. URLフェッチ
  let html: string;
  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
      },
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    html = await resp.text();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`ページの読み込みに失敗しました: ${msg}`);
  }

  // 2. テキスト抽出
  const text = extractTextFromHtml(html);
  if (!text) throw new Error('本文を抽出できませんでした');

  // 3. Ollama 呼び出し
  const prompt = buildPrompt(url, text);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LOCAL_AI_TIMEOUT_MS);

  let raw: string;
  try {
    const resp = await fetch(`${LOCAL_AI_HOST}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: LOCAL_AI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        options: { temperature: 0 },
      }),
      signal: controller.signal,
    });

    if (!resp.ok) throw new Error(`Ollama HTTP ${resp.status}`);

    const data = (await resp.json()) as { message?: { content?: string } };
    raw = data.message?.content ?? '';
    if (!raw) throw new Error('Ollamaから空のレスポンスが返されました');
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`ローカルAI解析がタイムアウトしました（${LOCAL_AI_TIMEOUT_MS / 1000}秒）`);
    }
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `ローカルAIへの接続に失敗しました: ${msg}\n` +
      `Ollamaが起動しているか確認してください（ollama serve）`,
    );
  } finally {
    clearTimeout(timeoutId);
  }

  // 4. JSON パース
  try {
    return parseJsonResponse(raw);
  } catch {
    throw new Error('AIレスポンスのJSON解析に失敗しました');
  }
}
