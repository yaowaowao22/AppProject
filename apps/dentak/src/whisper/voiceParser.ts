// mathjs を動的インポート（未インストール時のフォールバック対応）
let mathEvaluate: ((expr: string) => number) | null = null;
(async () => {
  try {
    const mathjs = await import('mathjs').catch(() => null);
    if (mathjs) {
      const { create, all } = mathjs as any;
      const math = create(all);
      mathEvaluate = (expr: string) => math.evaluate(expr);
    }
  } catch {
    // mathjs 未インストール時は null のまま
  }
})();

export interface ParseResult {
  expression: string;
  result:     number | null;
  confidence: 'high' | 'low';
  rawText:    string;
}

// 漢字数字 → 算用数字変換マップ
const KANJI_NUM_MAP: Record<string, string> = {
  '〇': '0', '零': '0',
  '一': '1', '二': '2', '三': '3', '四': '4',
  '五': '5', '六': '6', '七': '7', '八': '8', '九': '9',
  '十': '10',
};

function replaceKanjiNumbers(text: string): string {
  let result = text;
  // 十の桁: 二十 → 20, 三十 → 30 ... 九十 → 90
  result = result.replace(/([二三四五六七八九])十([一二三四五六七八九])?/g, (_, tens, ones) => {
    const t = parseInt(KANJI_NUM_MAP[tens] ?? '0', 10) * 10;
    const o = ones ? parseInt(KANJI_NUM_MAP[ones] ?? '0', 10) : 0;
    return String(t + o);
  });
  // 十単独: 10
  result = result.replace(/^十$|(?<!\d)十(?!\d)/g, '10');
  // 一桁漢字
  for (const [kanji, num] of Object.entries(KANJI_NUM_MAP)) {
    if (kanji === '十') continue;
    result = result.replaceAll(kanji, num);
  }
  return result;
}

// 日本語パターン
const JA_PATTERNS: [RegExp, string][] = [
  [/(\d+(?:\.\d+)?)\s*かける\s*(\d+(?:\.\d+)?)/g,    '$1*$2'],
  [/(\d+(?:\.\d+)?)\s*わる\s*(\d+(?:\.\d+)?)/g,      '$1/$2'],
  [/(\d+(?:\.\d+)?)\s*たす\s*(\d+(?:\.\d+)?)/g,      '$1+$2'],
  [/(\d+(?:\.\d+)?)\s*ひく\s*(\d+(?:\.\d+)?)/g,      '$1-$2'],
  [/(\d+(?:\.\d+)?)\s*の\s*(\d+(?:\.\d+)?)\s*乗/g,   'pow($1,$2)'],
  [/ルート\s*(\d+(?:\.\d+)?)/g,                       'sqrt($1)'],
  [/サイン\s*(\d+(?:\.\d+)?)/g,                       'sin($1)'],
  [/コサイン\s*(\d+(?:\.\d+)?)/g,                     'cos($1)'],
  [/タンジェント\s*(\d+(?:\.\d+)?)/g,                 'tan($1)'],
  [/ログ\s*(\d+(?:\.\d+)?)/g,                         'log10($1)'],
  [/(\d+(?:\.\d+)?)\s*の\s*階乗/g,                    'factorial($1)'],
  [/円周率/g,                                          'pi'],
  [/ネイピア数/g,                                      'e'],
  [/絶対値\s*([+-]?\d+(?:\.\d+)?)/g,                  'abs($1)'],
];

// 英語パターン
const EN_PATTERNS: [RegExp, string][] = [
  [/square root of (\d+(?:\.\d+)?)/gi,               'sqrt($1)'],
  [/(\d+(?:\.\d+)?)\s*to the power of\s*(\d+(?:\.\d+)?)/gi, 'pow($1,$2)'],
  [/factorial of (\d+(?:\.\d+)?)/gi,                 'factorial($1)'],
  [/(\d+(?:\.\d+)?)\s*times\s*(\d+(?:\.\d+)?)/gi,   '$1*$2'],
  [/(\d+(?:\.\d+)?)\s*divided by\s*(\d+(?:\.\d+)?)/gi, '$1/$2'],
  [/(\d+(?:\.\d+)?)\s*plus\s*(\d+(?:\.\d+)?)/gi,    '$1+$2'],
  [/(\d+(?:\.\d+)?)\s*minus\s*(\d+(?:\.\d+)?)/gi,   '$1-$2'],
  [/sine?\s*(\d+(?:\.\d+)?)/gi,                      'sin($1)'],
  [/cosine?\s*(\d+(?:\.\d+)?)/gi,                    'cos($1)'],
  [/tangent\s*(\d+(?:\.\d+)?)/gi,                    'tan($1)'],
  [/log(?:arithm)?\s*(\d+(?:\.\d+)?)/gi,             'log10($1)'],
  [/pi/gi,                                            'pi'],
  [/euler(?:'s number)?/gi,                           'e'],
  [/absolute value of ([+-]?\d+(?:\.\d+)?)/gi,       'abs($1)'],
];

function applyPatterns(text: string): string | null {
  let expr = text;
  let matched = false;

  for (const [pattern, replacement] of JA_PATTERNS) {
    const next = expr.replace(pattern, replacement);
    if (next !== expr) { expr = next; matched = true; }
  }

  for (const [pattern, replacement] of EN_PATTERNS) {
    const next = expr.replace(pattern, replacement);
    if (next !== expr) { expr = next; matched = true; }
  }

  return matched ? expr.trim() : null;
}

function tryEvaluate(expr: string): number | null {
  if (!mathEvaluate) return null;
  try {
    const result = mathEvaluate(expr);
    if (typeof result === 'number' && isFinite(result)) return result;
    return null;
  } catch {
    return null;
  }
}

export function parseVoiceInput(text: string): ParseResult {
  // 1. 漢字数字を算用数字に変換
  const normalized = replaceKanjiNumbers(text.trim());

  // 2. パターンマッチング
  const matched = applyPatterns(normalized);

  if (matched !== null) {
    const result = tryEvaluate(matched);
    return {
      expression: matched,
      result,
      confidence: 'high',
      rawText: text,
    };
  }

  // 3. フォールバック: 数字と演算子のみの文字列を直接評価
  const directExpr = normalized.replace(/[^0-9+\-*/.()^,%\s]/g, '').trim();
  if (directExpr.length > 0) {
    const result = tryEvaluate(directExpr);
    if (result !== null) {
      return {
        expression: directExpr,
        result,
        confidence: 'low',
        rawText: text,
      };
    }
  }

  // 4. 完全フォールバック: 元テキストをそのまま返す
  return {
    expression: text,
    result:     null,
    confidence: 'low',
    rawText:    text,
  };
}
