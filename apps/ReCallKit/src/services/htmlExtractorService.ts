// ============================================================
// HTML フェッチ・テキスト抽出サービス
// Lambdaが担っていた「URLフェッチ → テキスト抽出」を
// React Native 側で再現する（CORSがないため素の fetch で動く）
// ============================================================

import { LOCAL_AI_MAX_TEXT_LENGTH } from '../config/localAI';

const FETCH_TIMEOUT_MS = 15_000;

/** リトライ対象のHTTPステータス */
const RETRYABLE_STATUS = new Set([403, 429, 500, 502, 503, 504]);
const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 1_500;

/**
 * ブラウザ User-Agent ローテーション。
 * 1つのUAがブロックされても別のUAでリトライできる。
 */
const USER_AGENTS = [
  // Chrome 131 on macOS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  // Safari 17 on macOS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15',
  // Chrome 131 on iPhone
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1',
];

function buildFetchHeaders(uaIndex: number): Record<string, string> {
  return {
    'User-Agent': USER_AGENTS[uaIndex % USER_AGENTS.length],
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
    'Cache-Control': 'no-cache',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
  };
}

// ============================================================
// テキスト抽出（Lambda の Python ロジックと同等 + 拡張）
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
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s{2,}/g, ' ').trim();
}

/**
 * 指定タグの最も外側のブロックを抽出する。
 * ネストされた同名タグがあっても正しくペアリングする。
 */
function extractOuterTagContent(html: string, tag: string): string | null {
  const openRe = new RegExp(`<${tag}[\\s>]`, 'gi');
  const openMatch = openRe.exec(html);
  if (!openMatch) return null;

  const startIdx = openMatch.index;
  // 開始タグの閉じ ">" を探す
  const tagCloseIdx = html.indexOf('>', startIdx);
  if (tagCloseIdx === -1) return null;

  let depth = 1;
  let pos = tagCloseIdx + 1;
  const openPattern = new RegExp(`<${tag}[\\s>]`, 'gi');
  const closePattern = new RegExp(`</${tag}\\s*>`, 'gi');

  while (depth > 0 && pos < html.length) {
    openPattern.lastIndex = pos;
    closePattern.lastIndex = pos;
    const nextOpen = openPattern.exec(html);
    const nextClose = closePattern.exec(html);

    if (!nextClose) break; // 閉じタグが見つからない

    if (nextOpen && nextOpen.index < nextClose.index) {
      depth++;
      pos = nextOpen.index + nextOpen[0].length;
    } else {
      depth--;
      if (depth === 0) {
        return html.slice(tagCloseIdx + 1, nextClose.index);
      }
      pos = nextClose.index + nextClose[0].length;
    }
  }

  // depth > 0 でも見つかった範囲をfallbackで返す
  return html.slice(tagCloseIdx + 1, pos);
}

function extractText(html: string): string {
  // script / style / noscript / head を除去
  let cleaned = html
    .replace(/<(script|style|noscript|head)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  // 1. article → main の順で本文ブロックを優先抽出（ネスト対応）
  for (const tag of ['article', 'main']) {
    const content = extractOuterTagContent(cleaned, tag);
    if (content) {
      const candidate = normalizeWhitespace(
        decodeEntities(stripTags(content)),
      );
      if (candidate.length > 100) {
        return candidate.slice(0, LOCAL_AI_MAX_TEXT_LENGTH);
      }
    }
  }

  // 2. note.com / CMS系: role="article" や data属性つきコンテナ
  const roleArticleMatch = /role\s*=\s*["']article["'][^>]*>([\s\S]*?)(?:<\/div>|<\/section>)/i.exec(cleaned);
  if (roleArticleMatch) {
    const candidate = normalizeWhitespace(
      decodeEntities(stripTags(roleArticleMatch[1])),
    );
    if (candidate.length > 100) {
      return candidate.slice(0, LOCAL_AI_MAX_TEXT_LENGTH);
    }
  }

  // 3. <section> タグの集合（note.com 等で使われる）
  const sections = [...cleaned.matchAll(/<section[^>]*>([\s\S]*?)<\/section>/gi)].map(
    (m) => decodeEntities(stripTags(m[1])).trim(),
  ).filter((s) => s.length > 30);
  if (sections.length > 0) {
    const candidate = normalizeWhitespace(sections.join(' '));
    if (candidate.length > 200) {
      return candidate.slice(0, LOCAL_AI_MAX_TEXT_LENGTH);
    }
  }

  // 4. <p> タグの集合
  const paragraphs = [...cleaned.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map(
    (m) => decodeEntities(stripTags(m[1])).trim(),
  );
  if (paragraphs.length > 0) {
    const candidate = normalizeWhitespace(paragraphs.join(' '));
    if (candidate.length > 0) {
      return candidate.slice(0, LOCAL_AI_MAX_TEXT_LENGTH);
    }
  }

  // 5. fallback: body 全体
  const bodyContent = extractOuterTagContent(cleaned, 'body');
  const raw = bodyContent ?? cleaned;
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
 *
 * 403/429/5xx エラー時はUA を変えてリトライする。
 */
/**
 * React Native では AbortController が fetch を確実に中断しない既知問題がある。
 * Promise.race でタイムアウトを強制し、タイムアウト時はリトライしない。
 */
async function fetchWithTimeout(url: string, uaIndex: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => {
      controller.abort();
      reject(new Error('TIMEOUT'));
    }, FETCH_TIMEOUT_MS),
  );
  const fetchPromise = fetch(url, {
    headers: buildFetchHeaders(uaIndex),
    signal: controller.signal,
    redirect: 'follow',
  });
  return Promise.race([fetchPromise, timeoutPromise]);
}

export async function fetchAndExtractText(url: string): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetchWithTimeout(url, attempt);

      if (res.ok) {
        const html = await res.text();
        const text = extractText(html);
        if (text.length === 0) {
          throw new Error('ページからテキストを抽出できませんでした');
        }
        return text;
      }

      if (RETRYABLE_STATUS.has(res.status) && attempt < MAX_RETRIES) {
        console.warn(`[htmlExtractor] HTTP ${res.status} → retry (${attempt + 1}/${MAX_RETRIES})`);
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
        continue;
      }

      throw new Error(
        `ページの読み込みに失敗しました（HTTP ${res.status}${res.status === 403 ? ' — アクセスがブロックされました' : ''}）`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';

      // タイムアウトはリトライしない（同じURLは再度ハングする可能性が高い）
      if (msg === 'TIMEOUT' || (err instanceof Error && err.name === 'AbortError')) {
        throw new Error(`ページの読み込みがタイムアウトしました（${FETCH_TIMEOUT_MS / 1000}秒）`);
      }

      lastError = err instanceof Error ? err : new Error('ページの読み込みに失敗しました');

      if (attempt < MAX_RETRIES) {
        console.warn(`[htmlExtractor] ${lastError.message} → retry (${attempt + 1}/${MAX_RETRIES})`);
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
        continue;
      }

      throw lastError;
    }
  }

  throw lastError ?? new Error('ページの読み込みに失敗しました');
}
