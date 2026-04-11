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

// ═══════════════════════════════════════════════
// Phase 1: ひらがな/カタカナ数字 → 算用数字
// ═══════════════════════════════════════════════

const KANA_NUM_MAP: Record<string, string> = {
  'いち': '1', 'に': '2', 'さん': '3', 'し': '4', 'よん': '4',
  'ご': '5', 'ろく': '6', 'なな': '7', 'しち': '7',
  'はち': '8', 'きゅう': '9', 'く': '9',
  'じゅう': '10', 'ひゃく': '100', 'せん': '1000', 'まん': '10000',
  'ゼロ': '0', 'ワン': '1', 'ツー': '2', 'スリー': '3',
  'フォー': '4', 'ファイブ': '5', 'シックス': '6', 'セブン': '7',
  'エイト': '8', 'ナイン': '9', 'テン': '10',
};

const KANJI_NUM_MAP: Record<string, string> = {
  '〇': '0', '零': '0',
  '一': '1', '二': '2', '三': '3', '四': '4',
  '五': '5', '六': '6', '七': '7', '八': '8', '九': '9',
  '十': '10', '百': '100', '千': '1000', '万': '10000',
};

function replaceSpokenNumbers(text: string): string {
  let s = text;

  // ── 漢字複合数: 百・千・万の桁 ─────────────────────────
  // 三百二十五 → 325, 二千 → 2000, 五万 → 50000
  s = s.replace(/([一二三四五六七八九])万/g, (_, d) => String(parseInt(KANJI_NUM_MAP[d], 10) * 10000));
  s = s.replace(/万/g, '10000');
  s = s.replace(/([一二三四五六七八九])千/g, (_, d) => String(parseInt(KANJI_NUM_MAP[d], 10) * 1000));
  s = s.replace(/千/g, '1000');
  s = s.replace(/([一二三四五六七八九])百/g, (_, d) => String(parseInt(KANJI_NUM_MAP[d], 10) * 100));
  s = s.replace(/百/g, '100');

  // 十の桁: 二十三 → 23
  s = s.replace(/([二三四五六七八九])十([一二三四五六七八九])?/g, (_, tens, ones) => {
    const t = parseInt(KANJI_NUM_MAP[tens] ?? '0', 10) * 10;
    const o = ones ? parseInt(KANJI_NUM_MAP[ones] ?? '0', 10) : 0;
    return String(t + o);
  });
  s = s.replace(/十([一二三四五六七八九])/g, (_, ones) => `1${KANJI_NUM_MAP[ones]}`);
  s = s.replace(/十/g, '10');

  // 一桁漢字
  for (const [kanji, num] of Object.entries(KANJI_NUM_MAP)) {
    if (['十', '百', '千', '万'].includes(kanji)) continue;
    s = s.replaceAll(kanji, num);
  }

  // ── ひらがな数字（長い方から先にマッチ）────────────────
  const sortedKana = Object.entries(KANA_NUM_MAP).sort((a, b) => b[0].length - a[0].length);
  for (const [kana, num] of sortedKana) {
    s = s.replaceAll(kana, num);
  }

  return s;
}

// ═══════════════════════════════════════════════
// Phase 2: 日本語数学表現 → 数式（複合パターン対応）
// ═══════════════════════════════════════════════
// 順序が重要: 複合表現（長い）→ 単純表現（短い）の順で処理

// NUM は数値にマッチするパターン断片
const N = '(\\d+(?:\\.\\d+)?)';

const JA_COMPOUND_PATTERNS: [RegExp, string][] = [
  // ── 累乗 ──────────────────────────────────────
  // 「3の2乗」「3の二乗」→ pow(3,2) — 漢字数字は Phase 1 で変換済み
  [new RegExp(`${N}\\s*の\\s*${N}\\s*乗`, 'g'),        'pow($1,$2)'],
  // 「3二乗」「3 2乗」→ pow(3,2) — 「の」省略
  [new RegExp(`${N}\\s*${N}\\s*乗`, 'g'),               'pow($1,$2)'],
  // 「3の自乗」「3自乗」→ pow(3,2)
  [new RegExp(`${N}\\s*(?:の\\s*)?自乗`, 'g'),          'pow($1,2)'],
  // 「3の二乗根」→ pow(3, 1/2) = sqrt
  [new RegExp(`${N}\\s*の\\s*平方根`, 'g'),             'sqrt($1)'],
  // 「3じょう」→ ^3 — 「X乗」単独（前に数字がない場合はPhase3で処理）

  // ── 分数 ──────────────────────────────────────
  // 「3分の1」→ 1/3  ※日本語の分数は分母が先
  [new RegExp(`${N}\\s*分の\\s*${N}`, 'g'),             '($2/$1)'],

  // ── 四則演算 ──────────────────────────────────
  [new RegExp(`${N}\\s*(?:かける|掛ける|掛け|×)\\s*${N}`, 'g'),   '$1*$2'],
  [new RegExp(`${N}\\s*(?:わる|割る|÷)\\s*${N}`, 'g'),            '$1/$2'],
  [new RegExp(`${N}\\s*(?:たす|足す|プラス|＋)\\s*${N}`, 'g'),     '$1+$2'],
  [new RegExp(`${N}\\s*(?:ひく|引く|マイナス|ー)\\s*${N}`, 'g'),   '$1-$2'],

  // ── 関数 ──────────────────────────────────────
  [/(?:ルート|√|平方根)\s*(\d+(?:\.\d+)?)/g,            'sqrt($1)'],
  [/(?:サイン|sine?)\s*(\d+(?:\.\d+)?)/g,               'sin($1)'],
  [/(?:コサイン|cosine?)\s*(\d+(?:\.\d+)?)/g,           'cos($1)'],
  [/(?:タンジェント|tangent)\s*(\d+(?:\.\d+)?)/g,       'tan($1)'],
  [/(?:ログ|log(?:arithm)?)\s*(\d+(?:\.\d+)?)/g,        'log10($1)'],
  [/(\d+(?:\.\d+)?)\s*(?:の\s*)?階乗/g,                 'factorial($1)'],
  [/factorial\s*(?:of\s*)?(\d+(?:\.\d+)?)/gi,            'factorial($1)'],
  [/(?:絶対値|abs)\s*([+-]?\d+(?:\.\d+)?)/g,            'abs($1)'],

  // ── 定数 ──────────────────────────────────────
  [/円周率|パイ/g,                                       'pi'],
  [/ネイピア数/g,                                        'e'],

  // ── 英語 ──────────────────────────────────────
  [/square root of (\d+(?:\.\d+)?)/gi,                   'sqrt($1)'],
  [/(\d+(?:\.\d+)?)\s*to the power of\s*(\d+(?:\.\d+)?)/gi, 'pow($1,$2)'],
  [/(\d+(?:\.\d+)?)\s*squared/gi,                        'pow($1,2)'],
  [/(\d+(?:\.\d+)?)\s*cubed/gi,                          'pow($1,3)'],
  [/(\d+(?:\.\d+)?)\s*times\s*(\d+(?:\.\d+)?)/gi,       '$1*$2'],
  [/(\d+(?:\.\d+)?)\s*divided by\s*(\d+(?:\.\d+)?)/gi,  '$1/$2'],
  [/(\d+(?:\.\d+)?)\s*plus\s*(\d+(?:\.\d+)?)/gi,        '$1+$2'],
  [/(\d+(?:\.\d+)?)\s*minus\s*(\d+(?:\.\d+)?)/gi,       '$1-$2'],
  [/pi/gi,                                                'pi'],
  [/euler(?:'s\s*number)?/gi,                             'e'],
];

// ═══════════════════════════════════════════════
// Phase 3: 残留キーワード → 演算子（Phase 2 で消化されなかった断片）
// ═══════════════════════════════════════════════

const RESIDUAL_KEYWORD_MAP: [RegExp, string][] = [
  [/掛ける|かける|掛け|かけ|×/g,    '*'],
  [/割る|わる|÷/g,                   '/'],
  [/足す|たす|プラス|＋/g,           '+'],
  [/引く|ひく|マイナス/g,            '-'],
  [/ルート|√|平方根/g,              'sqrt '],
  [/サイン/g,                        'sin '],
  [/コサイン/g,                      'cos '],
  [/タンジェント/g,                  'tan '],
  [/ログ/g,                          'log10 '],
  [/階乗/g,                          ' factorial'],
  [/円周率|パイ/g,                   'pi'],
  [/ネイピア数/g,                    'e'],
  [/絶対値/g,                        'abs '],
  [/自乗|じじょう/g,                 '^2'],
  [/二乗|にじょう/g,                 '^2'],
  [/三乗|さんじょう/g,               '^3'],
  [/乗/g,                            '^'],
  [/点|てん/g,                       '.'],
  [/分の/g,                          '/'],
];

// ═══════════════════════════════════════════════
// Phase 4: 非数学文字除去
// ═══════════════════════════════════════════════

const MATH_FUNC_NAMES = /\b(pi|e|sin|cos|tan|log10|sqrt|abs|factorial|pow)\b/;

function stripNonMath(text: string): string {
  let s = text;

  // 残留キーワードを演算子に置換
  for (const [pattern, replacement] of RESIDUAL_KEYWORD_MAP) {
    s = s.replace(pattern, replacement);
  }

  // 数字・演算子・数学関数名・小数点・スペース・カッコのみ残す
  s = s.replace(/[^0-9+\-*/.()^,%\s a-zA-Z]/g, '');

  // 数学関数名以外のアルファベット列を除去
  s = s.replace(/\b[a-zA-Z]+\b/g, (match) => {
    return MATH_FUNC_NAMES.test(match) ? match : '';
  });

  // 連続演算子の正規化: ** → ^, // → /
  s = s.replace(/\*\*/g, '^');
  s = s.replace(/\/\//g, '/');

  // 孤立した演算子の除去（先頭/末尾の演算子、連続演算子）
  s = s.replace(/^[+*/^%,]+/, '');
  s = s.replace(/[+\-*/^%,]+$/, '');

  // 連続スペースを1つに
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

// ═══════════════════════════════════════════════
// Phase 5: 数式評価
// ═══════════════════════════════════════════════

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

/**
 * 複合パターンを適用する。マッチした場合は変換後の文字列を返す。
 */
function applyCompoundPatterns(text: string): string {
  let expr = text;
  for (const [pattern, replacement] of JA_COMPOUND_PATTERNS) {
    // RegExp の lastIndex をリセット（g フラグ付き正規表現の再利用対策）
    pattern.lastIndex = 0;
    expr = expr.replace(pattern, replacement);
  }
  return expr;
}

export function parseVoiceInput(text: string): ParseResult {
  // Phase 1: ひらがな/カタカナ/漢字数字 → 算用数字
  const withNumbers = replaceSpokenNumbers(text.trim());

  // Phase 2: 複合数学パターンマッチング
  const afterPatterns = applyCompoundPatterns(withNumbers);

  // Phase 3+4: 残留キーワード置換 + 非数学テキスト除去
  const cleaned = stripNonMath(afterPatterns);

  // Phase 5: 数式評価
  if (cleaned.length > 0) {
    const result = tryEvaluate(cleaned);
    if (result !== null) {
      return {
        expression: cleaned,
        result,
        confidence: 'high',
        rawText: text,
      };
    }
  }

  // フォールバック: 数字と演算子のみ抽出して再試行
  const digitsOnly = cleaned.replace(/[^0-9+\-*/.()^,%\s]/g, '').trim();
  if (digitsOnly.length > 0) {
    const result = tryEvaluate(digitsOnly);
    if (result !== null) {
      return {
        expression: digitsOnly,
        result,
        confidence: 'low',
        rawText: text,
      };
    }
  }

  return {
    expression: cleaned || text,
    result:     null,
    confidence: 'low',
    rawText:    text,
  };
}
