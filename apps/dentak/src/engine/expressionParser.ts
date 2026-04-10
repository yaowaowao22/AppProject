import { create, all } from 'mathjs';

const math = create(all);
math.config({ number: 'BigNumber', precision: 64 });

/**
 * 表示用文字列を mathjs 評価可能な式に変換する。
 *
 * 変換ルール（順序依存に注意）:
 *  × → *
 *  ÷ → /
 *  π → pi
 *  x² → ^2
 *  √( → sqrt(
 *  ln → log      (mathjs の log = 自然対数)
 *  log → log10
 *  暗黙の乗算: 数字+π → *pi, )( → )*(
 *  未閉じ括弧の自動補完
 */
export function normalizeExpression(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';

  let expr = raw.trim();
  if (expr === '') return '';

  // 1. ln は log に変換（先に処理しないと次の log10 変換に巻き込まれる）
  expr = expr.replace(/\bln\(/g, 'log(');

  // 2. log → log10 (ln変換後に実施)
  expr = expr.replace(/\blog\(/g, 'log10(');

  // 3. 乗除演算子
  expr = expr.replace(/×/g, '*');
  expr = expr.replace(/÷/g, '/');

  // 4. x² → ^2（文字 ² が直後にある場合）
  expr = expr.replace(/²/g, '^2');

  // 5. √( → sqrt(
  expr = expr.replace(/√\(/g, 'sqrt(');
  // √ 単体（括弧なし）の場合も対応
  expr = expr.replace(/√(\d)/g, 'sqrt($1');

  // 6. π → pi（暗黙の乗算挿入より先に変換）
  expr = expr.replace(/π/g, 'pi');

  // 7. e（自然対数の底） — 変数 e として mathjs が扱う
  //    既に 'e' はそのまま mathjs に渡せるが、数字直後の e は指数表記と競合するため
  //    ここでは変換せずそのまま通す（mathjs が e を定数として認識）

  // 8. 暗黙の乗算挿入
  //    数字 + pi: '2pi' → '2*pi'
  expr = expr.replace(/(\d)(pi)/g, '$1*$2');
  //    pi + 数字: 'pi2' → 'pi*2'（例: pi2 は稀だが安全のため）
  expr = expr.replace(/(pi)(\d)/g, '$1*$2');
  //    )( → )*(
  expr = expr.replace(/\)\s*\(/g, ')*(');
  //    数字( → 数字*(（例: 2(3+4) → 2*(3+4)）
  expr = expr.replace(/(\d)\s*\(/g, '$1*(');

  // 9. 未閉じ括弧の自動補完
  let openParens = 0;
  for (const ch of expr) {
    if (ch === '(') openParens++;
    else if (ch === ')') openParens--;
  }
  if (openParens > 0) {
    expr += ')'.repeat(openParens);
  }

  return expr;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * mathjs.parse() で構文検証する。
 * パース成功 = valid: true、失敗 = valid: false + エラーメッセージ
 */
export function validateExpression(expr: string): ValidationResult {
  if (!expr || typeof expr !== 'string') {
    return { valid: false, error: 'Empty expression' };
  }

  const trimmed = expr.trim();
  if (trimmed === '') {
    return { valid: false, error: 'Empty expression' };
  }

  try {
    math.parse(trimmed);
    return { valid: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Parse error';
    return { valid: false, error: message };
  }
}
