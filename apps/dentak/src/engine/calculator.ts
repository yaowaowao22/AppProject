import { create, all } from 'mathjs';

const math = create(all);
math.config({ number: 'BigNumber', precision: 64 });

export type AngleUnit = 'deg' | 'rad' | 'grad';
export type BaseType = 'DEC' | 'HEX' | 'OCT' | 'BIN';

export interface HistoryEntry {
  expression: string;
  result: string;
  timestamp: number;
}

export interface CalcState {
  display: string;
  expression: string;
  history: HistoryEntry[];
  memory: number;
  stack: number[];
  angleUnit: AngleUnit;
  base: BaseType;
  isSecond: boolean;
}

/**
 * deg/grad モード時は trig 関数の引数を rad に変換するラッパー式に変換する。
 * mathjs の config.angleMode は存在しないため自前変換。
 * - deg:  sin(x) → sin(x * pi / 180)
 * - grad: sin(x) → sin(x * pi / 200)
 * - rad:  そのまま
 */
function wrapTrigFunctions(expr: string, angleUnit: AngleUnit): string {
  if (angleUnit === 'rad') return expr;

  const divisor = angleUnit === 'deg' ? '180' : '200';

  // 順三角関数: 引数を deg/grad → rad に変換してから渡す
  // sin(x) → sin((pi / 180) * x)
  const trigInputFunctions = ['sin', 'cos', 'tan'];

  let result = expr;
  for (const fn of trigInputFunctions) {
    const regex = new RegExp(`\\b${fn}\\(`, 'g');
    result = result.replace(regex, `${fn}((pi / ${divisor}) * `);
  }

  // 逆三角関数: 結果(rad)を deg/grad に変換する
  // asin(x) → asin(x) * (180 / pi)
  // 引数は無次元比なので入力変換は不要
  const invTrigFunctions = ['asin', 'acos', 'atan'];
  for (const fn of invTrigFunctions) {
    // パターン: fn(引数) ※引数に括弧を含まない前提（_applyFnReal の呼び出し形式に対応）
    const regex = new RegExp(`\\b${fn}\\(([^)]+)\\)`, 'g');
    result = result.replace(regex, `${fn}($1) * (${divisor} / pi)`);
  }

  return result;
}

/**
 * 数式を評価して文字列を返す。
 * エラー時は 'Error' を返す（throw しない）。
 */
export function evaluate(expr: string, angleUnit: AngleUnit): string {
  if (!expr || typeof expr !== 'string') return 'Error';

  const trimmed = expr.trim();
  if (trimmed === '') return 'Error';

  try {
    const wrapped = wrapTrigFunctions(trimmed, angleUnit);
    const result = math.evaluate(wrapped);

    if (result === null || result === undefined) return 'Error';

    // BigNumber / 通常数値どちらでも文字列化
    if (typeof result === 'boolean') return result.toString();

    const num: number =
      math.isBigNumber(result)
        ? result.toNumber()
        : typeof result === 'number'
        ? result
        : Number(result);

    if (!isFinite(num)) {
      return isNaN(num) ? 'Error' : num > 0 ? 'Infinity' : '-Infinity';
    }

    // BigNumber の精度を保ったまま文字列化
    if (math.isBigNumber(result)) {
      return result.toString();
    }

    return String(num);
  } catch {
    return 'Error';
  }
}
