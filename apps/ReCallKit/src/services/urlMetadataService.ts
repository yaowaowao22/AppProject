export interface UrlMetadata {
  title: string | null;
  description: string | null;
  image: string | null;
}

/** URLのHTMLを取得して文字列で返す。失敗時はエラーをスロー */
async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
          'AppleWebKit/537.36 (KHTML, like Gecko) ' +
          'Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.text();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * URLのHTMLを取得し、OGP/titleメタデータをパースして返す。
 * エラー時は null を返す（UIをブロックしない）。
 */
export async function fetchUrlMetadata(url: string): Promise<UrlMetadata | null> {
  try {
    const html = await fetchHtml(url);

    const ogTitle = extractMeta(html, /og:title/i);
    const pageTitle = extractTitle(html);
    const ogDescription = extractMeta(html, /og:description/i);
    const metaDescription = extractMeta(html, /description/i, 'name');
    const ogImage = extractMeta(html, /og:image/i);

    return {
      title: ogTitle ?? pageTitle,
      description: ogDescription ?? metaDescription,
      image: ogImage,
    };
  } catch {
    // タイムアウト・ネットワークエラー・パースエラーは静かに無視
    return null;
  }
}

/**
 * URLのHTMLから本文テキストを抽出し、メタデータとともに返す。
 *
 * 抽出優先順位:
 * 1. <article> 内のテキスト
 * 2. <main> 内のテキスト
 * 3. <body> 内の <p> タグを全結合
 *
 * 100文字未満の場合は <body> 全体からタグ除去したテキストにフォールバック。
 * テキストが空の場合はエラーをスロー。
 */
export async function extractBodyText(
  url: string
): Promise<{ text: string; metadata: UrlMetadata }> {
  const fallbackMetadata: UrlMetadata = { title: null, description: null, image: null };

  try {
    const html = await fetchHtml(url);

    // メタデータを同時に抽出
    const ogTitle = extractMeta(html, /og:title/i);
    const pageTitle = extractTitle(html);
    const ogDescription = extractMeta(html, /og:description/i);
    const metaDescription = extractMeta(html, /description/i, 'name');
    const ogImage = extractMeta(html, /og:image/i);
    const metadata: UrlMetadata = {
      title: ogTitle ?? pageTitle,
      description: ogDescription ?? metaDescription,
      image: ogImage,
    };

    // 除外タグを事前に除去（nav/header/footer/aside/script/style/noscript/iframe/svg）
    const cleaned = removeExcludedTags(html);

    // 優先順位1: <article>
    let text = extractTagContent(cleaned, 'article');

    // 優先順位2: <main>
    if (!text) {
      text = extractTagContent(cleaned, 'main');
    }

    // 優先順位3: <section> タグの集合（note.com 等のCMS対応）
    if (!text || text.replace(/<[^>]+>/g, ' ').trim().length < 100) {
      const sectionMatches = cleaned.match(/<section[^>]*>[\s\S]*?<\/section>/gi);
      if (sectionMatches) {
        const sectionText = sectionMatches
          .map((s) => s.replace(/<[^>]+>/g, ' ').trim())
          .filter((s) => s.length > 30)
          .join(' ');
        if (sectionText.length > (text?.replace(/<[^>]+>/g, ' ').trim().length ?? 0)) {
          text = sectionText;
        }
      }
    }

    // 優先順位4: <body> 内の <p> タグを全結合
    if (!text) {
      text = extractParagraphs(cleaned);
    }

    // 100文字未満ならフォールバック: <body> 全体のタグ除去
    if (text.length < 100) {
      text = extractTagContent(cleaned, 'body');
    }

    // タグ除去・空白正規化・4000文字切り詰め
    text = normalizeText(text);

    if (!text) {
      return { text: '', metadata };
    }

    return { text, metadata };
  } catch {
    // ネットワークエラー・タイムアウト・パースエラーは空文字列で返す（呼び出し元をブロックしない）
    return { text: '', metadata: fallbackMetadata };
  }
}

// ────────────────────────────────────────────────────────────
// 内部ヘルパー
// ────────────────────────────────────────────────────────────

/**
 * 除外すべきタグとその内容をまるごと除去する。
 * <script>...</script> のようにネストしない前提で処理。
 */
function removeExcludedTags(html: string): string {
  const tags = ['nav', 'header', 'footer', 'aside', 'script', 'style', 'noscript', 'iframe', 'svg'];
  let result = html;
  for (const tag of tags) {
    // sフラグ（dotall）でマルチライン対応
    result = result.replace(new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi'), '');
    // 自己閉じタグ（<script /> 等）も除去
    result = result.replace(new RegExp(`<${tag}[^>]*\\/>`, 'gi'), '');
  }
  return result;
}

/**
 * 指定タグの最も外側のブロック内容を返す。
 * ネストされた同名タグがあっても正しくペアリングする。
 */
function extractTagContent(html: string, tag: string): string {
  const openRe = new RegExp(`<${tag}[\\s>]`, 'gi');
  const openMatch = openRe.exec(html);
  if (!openMatch) return '';

  const startIdx = openMatch.index;
  const tagCloseIdx = html.indexOf('>', startIdx);
  if (tagCloseIdx === -1) return '';

  let depth = 1;
  let pos = tagCloseIdx + 1;
  const openPattern = new RegExp(`<${tag}[\\s>]`, 'gi');
  const closePattern = new RegExp(`</${tag}\\s*>`, 'gi');

  while (depth > 0 && pos < html.length) {
    openPattern.lastIndex = pos;
    closePattern.lastIndex = pos;
    const nextOpen = openPattern.exec(html);
    const nextClose = closePattern.exec(html);

    if (!nextClose) break;

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

  return html.slice(tagCloseIdx + 1, pos);
}

/** <body> 内の全 <p> タグのテキストをスペース区切りで結合 */
function extractParagraphs(html: string): string {
  const body = extractTagContent(html, 'body') || html;
  const matches = body.match(/<p[^>]*>([\s\S]*?)<\/p>/gi);
  if (!matches) return '';
  return matches
    .map((p) => p.replace(/<[^>]+>/g, ' '))
    .join(' ');
}

/**
 * HTMLタグ除去・エンティティデコード・空白正規化・4000文字切り詰め
 */
function normalizeText(html: string): string {
  // HTMLタグをスペースに置換
  let text = html.replace(/<[^>]+>/g, ' ');
  // エンティティデコード
  text = decodeHtmlEntities(text);
  // 連続する空白・改行を1改行に正規化
  text = text.replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n').replace(/\n{2,}/g, '\n').trim();
  // 最大4000文字
  if (text.length > 4000) {
    text = text.slice(0, 4000);
  }
  return text;
}

/** <title>タグのテキストを取得 */
function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match ? decodeHtmlEntities(match[1].trim()) : null;
}

/**
 * <meta property="og:xxx" content="..."> または
 * <meta name="xxx" content="..."> から content 値を取得
 */
function extractMeta(
  html: string,
  namePattern: RegExp,
  attr: 'property' | 'name' = 'property'
): string | null {
  // property="og:title" content="value" の順序も逆順も対応
  const regex = new RegExp(
    `<meta[^>]+${attr}\\s*=\\s*["'][^"']*${namePattern.source}[^"']*["'][^>]+content\\s*=\\s*["']([^"']+)["']`,
    'i'
  );
  const reverseRegex = new RegExp(
    `<meta[^>]+content\\s*=\\s*["']([^"']+)["'][^>]+${attr}\\s*=\\s*["'][^"']*${namePattern.source}[^"']*["']`,
    'i'
  );

  const match = html.match(regex) ?? html.match(reverseRegex);
  return match ? decodeHtmlEntities(match[1].trim()) : null;
}

/** 基本的なHTMLエンティティをデコード */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&nbsp;/gi, ' ');
}
