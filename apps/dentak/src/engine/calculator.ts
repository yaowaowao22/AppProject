import { create, all, BigNumber } from 'mathjs';

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

  // 対象: sin, cos, tan, asin, acos, atan, atan2, sinh, cosh, tanh, asinh, acosh, atanh
  // 逆三角関数の結果は rad で返るため、asin/acos/atan は出力側も変換が必要だが
  // ここでは入力ラップのみ実施（表示フォーマット側で対応する設計）
  const trigInputFunctions = ['sin', 'cos', 'tan'];

  let result = expr;
  for (const fn of trigInputFunctions) {
    // "sin(" を "sin(x * pi / 180)" のパターンに変換
    // 対象: sin( cos( tan( （asin/acos/atan は含まない）
    const regex = new RegExp(`\\b${fn}\\(`, 'g');
    result = result.replace(regex, `${fn}((pi / ${divisor}) * `);
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
      result instanceof math.BigNumber
        ? (result as BigNumber).toNumber()
        : typeof result === 'number'
        ? result
        : Number(result);

    if (!isFinite(num)) {
      return isNaN(num) ? 'Error' : num > 0 ? 'Infinity' : '-Infinity';
    }

    // BigNumber の精度を保ったまま文字列化
    if (result instanceof math.BigNumber) {
      return (result as BigNumber).toString();
    }

    return String(num);
  } catch {
    return 'Error';
  }
}
