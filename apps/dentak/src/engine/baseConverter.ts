export type BaseType = 'DEC' | 'HEX' | 'OCT' | 'BIN';

const BASE_RADIX: Record<BaseType, number> = {
  DEC: 10,
  HEX: 16,
  OCT: 8,
  BIN: 2,
};

/**
 * 10進数の整数値を指定基数の文字列に変換する。
 * 小数点以下は切り捨て。負数は '-' プレフィックスで表示。
 */
function decToBase(decValue: number, to: BaseType): string {
  if (!isFinite(decValue) || isNaN(decValue)) return 'Error';

  const integer = Math.trunc(decValue);
  const isNegative = integer < 0;
  const absValue = Math.abs(integer);

  const result = absValue.toString(BASE_RADIX[to]).toUpperCase();
  return isNegative ? `-${result}` : result;
}

/**
 * 指定基数の文字列を10進数に変換する。
 */
function baseToDec(value: string, from: BaseType): number {
  if (!value || typeof value !== 'string') return NaN;

  const trimmed = value.trim();
  if (trimmed === '') return NaN;

  const isNegative = trimmed.startsWith('-');
  const absStr = isNegative ? trimmed.slice(1) : trimmed;

  if (absStr === '') return NaN;

  const parsed = parseInt(absStr, BASE_RADIX[from]);
  if (isNaN(parsed)) return NaN;

  return isNegative ? -parsed : parsed;
}

/**
 * 任意の基数間で整数値を変換する。
 * @param value 変換元の文字列（対象基数での表現）
 * @param from  変換元の基数
 * @param to    変換先の基数
 * @returns 変換後の文字列。変換失敗時は 'Error'
 */
export function convertBase(value: string, from: BaseType, to: BaseType): string {
  if (!value || typeof value !== 'string') return 'Error';

  const trimmed = value.trim();
  if (trimmed === '') return 'Error';

  if (from === to) return trimmed.toUpperCase();

  const decValue = baseToDec(trimmed, from);
  if (isNaN(decValue) || !isFinite(decValue)) return 'Error';

  return decToBase(decValue, to);
}

/**
 * 10進数値から全基数の文字列表現を生成する。
 * @param decValue 10進数の数値
 * @returns 各基数の文字列を含む Record
 */
export function getAllBases(decValue: number): Record<BaseType, string> {
  if (!isFinite(decValue) || isNaN(decValue)) {
    return { DEC: 'Error', HEX: 'Error', OCT: 'Error', BIN: 'Error' };
  }

  const integer = Math.trunc(decValue);

  return {
    DEC: String(integer),
    HEX: decToBase(integer, 'HEX'),
    OCT: decToBase(integer, 'OCT'),
    BIN: decToBase(integer, 'BIN'),
  };
}
