// mathjs を同期 require でロード（Metro bundler では require は同期実行）
// async IIFE を使うと parseVoiceInput() 呼び出し時点で null のまま残る競合状態が発生するため
// 同期ロードに統一する（BUG-006）
let mathEvaluate: ((expr: string) => number) | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { create, all } = require('mathjs') as typeof import('mathjs');
  const math = create(all);
  mathEvaluate = (expr: string) => math.evaluate(expr);
} catch {
  // mathjs 未インストール時は null のまま
}

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

// 数学キーワード → 演算子/関数に置換（パターンマッチ前の前処理）
// 数字が隣接していなくても置換する（後段の applyPatterns で数字と結合）
const MATH_KEYWORD_MAP: [RegExp, string][] = [
  [/掛ける|かける|掛け|かけ/g,   '*'],
  [/割る|わる/g,                  '/'],
  [/足す|たす|プラス/g,           '+'],
  [/引く|ひく|マイナス/g,         '-'],
  [/ルート/g,                     'sqrt '],
  [/サイン/g,                     'sin '],
  [/コサイン/g,                   'cos '],
  [/タンジェント/g,               'tan '],
  [/ログ/g,                       'log10 '],
  [/階乗/g,                       ' factorial'],
  [/円周率|パイ/g,                'pi'],
  [/ネイピア数/g,                 'e'],
  [/絶対値/g,                     'abs '],
  [/乗/g,                         '^'],
  [/点|てん/g,                    '.'],
  [/イコール|は/g,                '='],
];

/**
 * 数学に無関係な日本語テキストを除去し、数字・演算子・数学キーワードだけ残す。
 * Whisperが「えーと10たす5です」と返した場合→「10+5」に変換。
 */
function stripNonMath(text: string): string {
  let s = text;
  // まず数学キーワードを演算子に置換
  for (const [pattern, replacement] of MATH_KEYWORD_MAP) {
    s = s.replace(pattern, replacement);
  }
  // 数字・演算子・数学関数名・小数点・スペースだけ残し、それ以外の文字を除去
  s = s.replace(/[^0-9+\-*/.()^,%\s a-zA-Z]/g, '');
  // 数学関数名以外のアルファベット列を除去（pi, e, sin, cos, tan, log10, sqrt, abs, factorial, pow のみ残す）
  s = s.replace(/\b(?!pi\b|e\b|sin\b|cos\b|tan\b|log10\b|sqrt\b|abs\b|factorial\b|pow\b)[a-df-oq-zA-DF-OQ-Z][a-zA-Z]*\b/g, '');
  // 連続スペースを1つに
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

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
  const withKanji = replaceKanjiNumbers(text.trim());

  // 2. 数学キーワード置換 + 非数学テキスト除去
  const normalized = stripNonMath(withKanji);

  // 3. パターンマッチング（日本語/英語）
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

  // 4. フォールバック: 数字と演算子のみの文字列を直接評価
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

  // 5. 完全フォールバック
  return {
    expression: normalized || text,
    result:     null,
    confidence: 'low',
    rawText:    text,
  };
}
