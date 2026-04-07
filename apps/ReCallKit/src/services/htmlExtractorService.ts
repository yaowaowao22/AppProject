// ============================================================
// HTML フェッチ・テキスト抽出サービス
// Lambdaが担っていた「URLフェッチ → テキスト抽出」を
// React Native 側で再現する（CORSがないため素の fetch で動く）
// ============================================================

import { LOCAL_AI_MAX_TEXT_LENGTH } from '../config/localAI';

const FETCH_TIMEOUT_MS = 30_000;

const FETCH_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
    'AppleWebKit/537.36 (KHTML, like Gecko) ' +
    'Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
};

// ============================================================
// テキスト抽出（Lambda の Python ロジックと同等）
// ============================================================

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, ' ');
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s{2,}/g, ' ').trim();
}

function extractText(html: string): string {
  // script / style / noscript / head を除去
  let cleaned = html
    .replace(/<(script|style|noscript|head)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  // article → main の順で本文ブロックを優先抽出
  for (const tag of ['article', 'main']) {
    const match = new RegExp(
      `<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`,
      'i',
    ).exec(cleaned);
    if (match) {
      const candidate = normalizeWhitespace(
        decodeEntities(stripTags(match[1])),
      );
      if (candidate.length > 100) {
        return candidate.slice(0, LOCAL_AI_MAX_TEXT_LENGTH);
      }
    }
  }

  // <p> タグの集合
  const paragraphs = [...cleaned.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map(
    (m) => decodeEntities(stripTags(m[1])).trim(),
  );
  if (paragraphs.length > 0) {
    const candidate = normalizeWhitespace(paragraphs.join(' '));
    if (candidate.length > 0) {
      return candidate.slice(0, LOCAL_AI_MAX_TEXT_LENGTH);
    }
  }

  // fallback: body 全体
  const bodyMatch = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(cleaned);
  const raw = bodyMatch ? bodyMatch[1] : cleaned;
  return normalizeWhitespace(decodeEntities(stripTags(raw))).slice(
    0,
    LOCAL_AI_MAX_TEXT_LENGTH,
  );
}

// ============================================================
// Public API
// ============================================================

/**
 * URLをフェッチしてページ本文テキストを返す。
 * Lambda の fetch_and_extract() と同等のロジック。
 */
export async function fetchAndExtractText(url: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let html: string;
  try {
    const res = await fetch(url, {
      headers: FETCH_HEADERS,
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(
        `ページの読み込みに失敗しました（HTTP ${res.status}）`,
      );
    }
    html = await res.text();
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('ページの読み込みがタイムアウトしました（30秒）');
    }
    if (err instanceof Error) throw err;
    throw new Error('ページの読み込みに失敗しました');
  } finally {
    clearTimeout(timeoutId);
  }

  const text = extractText(html);
  if (text.length === 0) {
    throw new Error('ページからテキストを抽出できませんでした');
  }
  return text;
}
