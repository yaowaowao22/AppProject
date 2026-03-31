export interface UrlMetadata {
  title: string | null;
  description: string | null;
  image: string | null;
}

/**
 * URLのHTMLを取得し、OGP/titleメタデータをパースして返す。
 * エラー時は null を返す（UIをブロックしない）。
 */
export async function fetchUrlMetadata(url: string): Promise<UrlMetadata | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        // Webサイトのbot拒否を回避する最低限のUser-Agent
        'User-Agent': 'Mozilla/5.0 (compatible; ReCallKit/1.0)',
        Accept: 'text/html',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const html = await response.text();

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
