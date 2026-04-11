// mathjs を同期 require でロード（Metro bundler では require は同期実行）
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

// ═══════════════════════════════════════════════════════════════
// Phase 1: ひらがな / カタカナ / 漢字 数字 → 算用数字
// ═══════════════════════════════════════════════════════════════

const KANA_NUM_MAP: [string, string][] = [
  // 長い方を先に（「きゅう」を「く」の前に）
  ['きゅう', '9'], ['じゅう', '10'],
  ['ひゃく', '100'], ['びゃく', '100'], ['ぴゃく', '100'],
  ['せん', '1000'], ['ぜん', '1000'],
  ['まん', '10000'],
  ['いち', '1'], ['さん', '3'], ['よん', '4'], ['ろく', '6'],
  ['なな', '7'], ['しち', '7'], ['はち', '8'],
  ['ゼロ', '0'], ['ワン', '1'], ['ツー', '2'], ['スリー', '3'],
  ['フォー', '4'], ['ファイブ', '5'], ['シックス', '6'], ['セブン', '7'],
  ['エイト', '8'], ['ナイン', '9'], ['テン', '10'],
  ['に', '2'], ['し', '4'], ['ご', '5'], ['く', '9'],
];

const KANJI_DIGIT: Record<string, number> = {
  '〇': 0, '零': 0, '一': 1, '二': 2, '三': 3, '四': 4,
  '五': 5, '六': 6, '七': 7, '八': 8, '九': 9,
};

function replaceSpokenNumbers(text: string): string {
  let s = text;

  // ── 漢字複合数 ────────────────────────────────────────
  // 万の桁
  s = s.replace(/([一二三四五六七八九])万/g, (_, d) => String(KANJI_DIGIT[d] * 10000));
  s = s.replace(/万/g, '10000');
  // 千の桁
  s = s.replace(/([一二三四五六七八九])千/g, (_, d) => String(KANJI_DIGIT[d] * 1000));
  s = s.replace(/千/g, '1000');
  // 百の桁
  s = s.replace(/([一二三四五六七八九])百/g, (_, d) => String(KANJI_DIGIT[d] * 100));
  s = s.replace(/百/g, '100');
  // 十の桁
  s = s.replace(/([二三四五六七八九])十([一二三四五六七八九])?/g, (_, tens, ones) => {
    return String(KANJI_DIGIT[tens] * 10 + (ones ? KANJI_DIGIT[ones] : 0));
  });
  s = s.replace(/十([一二三四五六七八九])/g, (_, ones) => String(10 + KANJI_DIGIT[ones]));
  s = s.replace(/十/g, '10');
  // 一桁漢字
  for (const [kanji, val] of Object.entries(KANJI_DIGIT)) {
    s = s.replaceAll(kanji, String(val));
  }

  // ── ひらがな / カタカナ数字 ────────────────────────────
  for (const [kana, num] of KANA_NUM_MAP) {
    s = s.replaceAll(kana, num);
  }

  // 隣接する数字の間にスペースがある場合は結合（「1 0」→「10」にはしない、意図が曖昧なため）
  return s;
}

// ═══════════════════════════════════════════════════════════════
// Phase 2: 複合数学表現 → 数式
// ═══════════════════════════════════════════════════════════════
// 順序が重要: 長い複合表現 → 短い単純表現

const N = '(\\d+(?:\\.\\d+)?)'; // 数値キャプチャ

const COMPOUND_PATTERNS: [RegExp, string][] = [
  // ── 累乗（複合） ──────────────────────────────────
  // 「5かける3の2乗」→ 5*pow(3,2) — かけるを先に処理すると壊れるので累乗を先に
  [new RegExp(`${N}\\s*の\\s*${N}\\s*乗`, 'g'),                    'pow($1,$2)'],
  [new RegExp(`${N}\\s*(?:の\\s*)?(?:二乗|自乗|じじょう|にじょう)`, 'g'), 'pow($1,2)'],
  [new RegExp(`${N}\\s*(?:の\\s*)?(?:三乗|さんじょう|立方)`, 'g'),       'pow($1,3)'],
  [new RegExp(`${N}\\s*(?:の\\s*)?(?:四乗|よんじょう)`, 'g'),            'pow($1,4)'],
  [new RegExp(`${N}\\s*squared`, 'gi'),                              'pow($1,2)'],
  [new RegExp(`${N}\\s*cubed`, 'gi'),                                'pow($1,3)'],
  [new RegExp(`${N}\\s*to\\s*the\\s*power\\s*of\\s*${N}`, 'gi'),    'pow($1,$2)'],

  // ── N乗根 ─────────────────────────────────────────
  [new RegExp(`${N}\\s*の\\s*${N}\\s*乗根`, 'g'),                   'nthRoot($1,$2)'],
  [new RegExp(`${N}\\s*の\\s*(?:平方根|へいほうこん)`, 'g'),         'sqrt($1)'],
  [new RegExp(`${N}\\s*の\\s*(?:立方根|りっぽうこん)`, 'g'),         'cbrt($1)'],

  // ── 分数（日本語: 分母が先）──────────────────────────
  [new RegExp(`${N}\\s*分の\\s*${N}`, 'g'),                         '($2/$1)'],

  // ── 逆数 ──────────────────────────────────────────
  [new RegExp(`${N}\\s*の\\s*(?:逆数|ぎゃくすう)`, 'g'),            '(1/$1)'],

  // ── 四則演算 ──────────────────────────────────────
  [new RegExp(`${N}\\s*(?:かける|掛ける|掛け|×)\\s*${N}`, 'g'),     '$1*$2'],
  [new RegExp(`${N}\\s*(?:わる|割る|÷)\\s*${N}`, 'g'),              '$1/$2'],
  [new RegExp(`${N}\\s*(?:たす|足す|プラス|＋)\\s*${N}`, 'g'),       '$1+$2'],
  [new RegExp(`${N}\\s*(?:ひく|引く|マイナス|ー)\\s*${N}`, 'g'),     '$1-$2'],
  [new RegExp(`${N}\\s*(?:モジュロ|mod|あまり|余り)\\s*${N}`, 'g'),  '$1%$2'],

  // ── 英語四則 ──────────────────────────────────────
  [new RegExp(`${N}\\s*times\\s*${N}`, 'gi'),                        '$1*$2'],
  [new RegExp(`${N}\\s*divided\\s*by\\s*${N}`, 'gi'),                '$1/$2'],
  [new RegExp(`${N}\\s*plus\\s*${N}`, 'gi'),                         '$1+$2'],
  [new RegExp(`${N}\\s*minus\\s*${N}`, 'gi'),                        '$1-$2'],

  // ── 三角関数 ──────────────────────────────────────
  [/(?:アークサイン|アークシン|逆サイン|asin)\s*(\d+(?:\.\d+)?)/gi,     'asin($1)'],
  [/(?:アークコサイン|アークコス|逆コサイン|acos)\s*(\d+(?:\.\d+)?)/gi, 'acos($1)'],
  [/(?:アークタンジェント|逆タンジェント|atan)\s*(\d+(?:\.\d+)?)/gi,   'atan($1)'],
  [/(?:サイン|sine?)\s*(\d+(?:\.\d+)?)/gi,                            'sin($1)'],
  [/(?:コサイン|cosine?)\s*(\d+(?:\.\d+)?)/gi,                        'cos($1)'],
  [/(?:タンジェント|tangent)\s*(\d+(?:\.\d+)?)/gi,                    'tan($1)'],

  // ── 双曲線関数 ─────────────────────────────────────
  [/(?:ハイパボリックサイン|sinh)\s*(\d+(?:\.\d+)?)/gi,               'sinh($1)'],
  [/(?:ハイパボリックコサイン|cosh)\s*(\d+(?:\.\d+)?)/gi,             'cosh($1)'],
  [/(?:ハイパボリックタンジェント|tanh)\s*(\d+(?:\.\d+)?)/gi,         'tanh($1)'],

  // ── 対数 ──────────────────────────────────────────
  [/(?:自然対数|エルエヌ|ln)\s*(\d+(?:\.\d+)?)/gi,                    'log($1)'],
  [/(?:常用対数|ログ|log(?:arithm)?)\s*(\d+(?:\.\d+)?)/gi,            'log10($1)'],
  [new RegExp(`log\\s*${N}\\s*(?:底|てい)\\s*${N}`, 'gi'),            'log($2,$1)'],

  // ── ルート ────────────────────────────────────────
  [/(?:ルート|√|平方根|square\s*root\s*(?:of)?)\s*(\d+(?:\.\d+)?)/gi,  'sqrt($1)'],
  [/(?:立方根|cube\s*root\s*(?:of)?)\s*(\d+(?:\.\d+)?)/gi,            'cbrt($1)'],

  // ── 階乗 ──────────────────────────────────────────
  [/(\d+(?:\.\d+)?)\s*(?:の\s*)?階乗/g,                               'factorial($1)'],
  [/factorial\s*(?:of\s*)?(\d+(?:\.\d+)?)/gi,                          'factorial($1)'],

  // ── 絶対値 ────────────────────────────────────────
  [/(?:絶対値|abs(?:olute\s*value\s*(?:of)?)?)\s*([+-]?\d+(?:\.\d+)?)/gi, 'abs($1)'],

  // ── 順列・組み合わせ ──────────────────────────────
  [new RegExp(`${N}\\s*(?:パーミテーション|P|順列)\\s*${N}`, 'g'),     'permutations($1,$2)'],
  [new RegExp(`${N}\\s*(?:コンビネーション|C|組み合わせ)\\s*${N}`, 'g'), 'combinations($1,$2)'],

  // ── パーセント ────────────────────────────────────
  [new RegExp(`${N}\\s*(?:パーセント|%)`, 'g'),                        '($1/100)'],

  // ── eのX乗 / 10のX乗 ─────────────────────────────
  [/(?:e|ネイピア数)の\s*(\d+(?:\.\d+)?)\s*乗/g,                      'exp($1)'],
  [/10の\s*(\d+(?:\.\d+)?)\s*乗/g,                                    'pow(10,$1)'],

  // ── 丸め ──────────────────────────────────────────
  [/(?:四捨五入|ラウンド|round)\s*(\d+(?:\.\d+)?)/gi,                  'round($1)'],
  [/(?:切り捨て|切捨て|フロア|floor)\s*(\d+(?:\.\d+)?)/gi,              'floor($1)'],
  [/(?:切り上げ|切上げ|シーリング|シール|ceil)\s*(\d+(?:\.\d+)?)/gi,     'ceil($1)'],

  // ── 定数 ──────────────────────────────────────────
  [/円周率|パイ|pi/gi,                                                 'pi'],
  [/ネイピア数|オイラー数|euler(?:'s\s*number)?/gi,                     'e'],

  // ── カッコ ────────────────────────────────────────
  [/カッコ開き|括弧開き|かっこ(?:を)?開/g,                              '('],
  [/カッコ閉じ|括弧閉じ|かっこ(?:を)?閉/g,                              ')'],
  [/カッコ|括弧|かっこ/g,                                               '('],  // 単体は開きカッコ
];

// ═══════════════════════════════════════════════════════════════
// Phase 3: 残留キーワード → 演算子
// ═══════════════════════════════════════════════════════════════

const RESIDUAL_MAP: [RegExp, string][] = [
  // 四則
  [/掛ける|かける|掛け|かけ|×/g,          '*'],
  [/割る|わる|÷/g,                         '/'],
  [/足す|たす|プラス|＋/g,                 '+'],
  [/引く|ひく/g,                            '-'],
  [/余り|あまり/g,                          '%'],
  // 三角関数
  [/アークサイン|アークシン|逆サイン/g,    'asin '],
  [/アークコサイン|アークコス|逆コサイン/g,'acos '],
  [/アークタンジェント|逆タンジェント/g,   'atan '],
  [/サイン/g,                               'sin '],
  [/コサイン/g,                             'cos '],
  [/タンジェント/g,                         'tan '],
  // 双曲線
  [/ハイパボリックサイン/g,                 'sinh '],
  [/ハイパボリックコサイン/g,               'cosh '],
  [/ハイパボリックタンジェント/g,           'tanh '],
  // 対数
  [/自然対数|エルエヌ/g,                    'log '],
  [/常用対数|ログ/g,                        'log10 '],
  // ルート・累乗
  [/ルート|√|平方根/g,                      'sqrt '],
  [/立方根/g,                               'cbrt '],
  [/自乗|じじょう|二乗|にじょう/g,         '^2'],
  [/三乗|さんじょう/g,                      '^3'],
  [/四乗|よんじょう/g,                      '^4'],
  [/乗/g,                                   '^'],
  // その他
  [/逆数/g,                                 '1/'],
  [/階乗/g,                                 'factorial '],
  [/絶対値/g,                               'abs '],
  [/円周率|パイ/g,                          'pi'],
  [/ネイピア数|オイラー数/g,                'e'],
  [/四捨五入|ラウンド/g,                    'round '],
  [/切り捨て|切捨て|フロア/g,               'floor '],
  [/切り上げ|切上げ|シーリング/g,            'ceil '],
  [/マイナス/g,                              '-'],
  [/点|てん|ポイント/g,                     '.'],
  [/分の/g,                                  '/'],
  [/パーセント/g,                            '/100'],
  [/カッコ開き|括弧開き/g,                   '('],
  [/カッコ閉じ|括弧閉じ/g,                   ')'],
  [/カッコ|括弧|かっこ/g,                    '('],
];

// ═══════════════════════════════════════════════════════════════
// Phase 4: 非数学文字を除去
// ═══════════════════════════════════════════════════════════════

const ALLOWED_FUNCS = new Set([
  'pi', 'e', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
  'sinh', 'cosh', 'tanh', 'log', 'log10', 'log2',
  'sqrt', 'cbrt', 'abs', 'exp',
  'factorial', 'pow', 'nthRoot', 'round', 'floor', 'ceil',
  'permutations', 'combinations',
]);

function stripNonMath(text: string): string {
  let s = text;

  for (const [pattern, replacement] of RESIDUAL_MAP) {
    s = s.replace(pattern, replacement);
  }

  // 数字・演算子・数学関数名・小数点・スペース・カッコのみ残す
  s = s.replace(/[^0-9+\-*/.()^,%\s a-zA-Z]/g, '');

  // 数学関数名以外のアルファベット列を除去
  s = s.replace(/\b[a-zA-Z]+\b/g, (match) => ALLOWED_FUNCS.has(match) ? match : '');

  // 正規化
  s = s.replace(/\*\*/g, '^');
  s = s.replace(/\/\//g, '/');
  s = s.replace(/^[+*/^%,]+/, '');
  s = s.replace(/[+\-*/^%,]+$/, '');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

// ═══════════════════════════════════════════════════════════════
// Phase 5: 評価
// ═══════════════════════════════════════════════════════════════

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

function applyCompoundPatterns(text: string): string {
  let expr = text;
  for (const [pattern, replacement] of COMPOUND_PATTERNS) {
    pattern.lastIndex = 0;
    expr = expr.replace(pattern, replacement);
  }
  return expr;
}

export function parseVoiceInput(text: string): ParseResult {
  // Phase 1: 数字変換
  const withNumbers = replaceSpokenNumbers(text.trim());

  // Phase 2: 複合パターン
  const afterPatterns = applyCompoundPatterns(withNumbers);

  // Phase 3+4: 残留キーワード + 非数学除去
  const cleaned = stripNonMath(afterPatterns);

  // Phase 5: 評価
  if (cleaned.length > 0) {
    const result = tryEvaluate(cleaned);
    if (result !== null) {
      return { expression: cleaned, result, confidence: 'high', rawText: text };
    }
  }

  // フォールバック: 数字と演算子のみ
  const digitsOnly = cleaned.replace(/[^0-9+\-*/.()^,%\s]/g, '').trim();
  if (digitsOnly.length > 0) {
    const result = tryEvaluate(digitsOnly);
    if (result !== null) {
      return { expression: digitsOnly, result, confidence: 'low', rawText: text };
    }
  }

  return { expression: cleaned || text, result: null, confidence: 'low', rawText: text };
}
