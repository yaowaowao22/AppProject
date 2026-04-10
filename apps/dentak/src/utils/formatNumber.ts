// ══════════════════════════════════════════════
// 無音の演算 — Number formatter
// Spec: DESIGN.md §6 (計算精度)
//   - max 14 display digits
//   - exp notation auto-switch: |x| >= 1e13 or (|x| < 1e-7 and x !== 0)
//   - NaN  → 'Error'
//   - Infinity → '∞'
// ══════════════════════════════════════════════

export type DecimalMode = 'auto' | 4 | 8;

export interface FormatOptions {
  /** Number of decimal places. 'auto' trims trailing zeros. Default: 'auto' */
  decimals?:       DecimalMode;
  /** Insert thousand separators (e.g. 1,234,567). Default: false */
  useThousandSep?: boolean;
  /** Force exponential notation regardless of magnitude. Default: false */
  useExpNotation?: boolean;
}

const MAX_DIGITS     = 14;
const EXP_UPPER      = 1e13;   // |x| >= 1e13 → exp
const EXP_LOWER      = 1e-7;   // |x| < 1e-7 (non-zero) → exp

/**
 * Format a numeric value for display in the calculator result area.
 *
 * @param value   - The value to format. Accepts number or numeric string.
 * @param options - Formatting options (decimals, separators, exp notation).
 * @returns       - Human-readable string suitable for the display.
 */
export function formatDisplay(
  value:    number | string,
  options?: FormatOptions,
): string {
  const { decimals = 'auto', useThousandSep = false, useExpNotation = false } =
    options ?? {};

  // Coerce string → number
  const num = typeof value === 'string' ? parseFloat(value) : value;

  // ── Special values ──────────────────────────────────────────────────────
  if (Number.isNaN(num))      return 'Error';
  if (!Number.isFinite(num))  return num > 0 ? '∞' : '-∞';

  const abs = Math.abs(num);

  // ── Exponential notation ────────────────────────────────────────────────
  const needsExp =
    useExpNotation ||
    (abs !== 0 && (abs >= EXP_UPPER || abs < EXP_LOWER));

  if (needsExp) {
    return formatExp(num, decimals);
  }

  // ── Fixed notation ──────────────────────────────────────────────────────
  return formatFixed(num, decimals, useThousandSep);
}

// ── Internal helpers ────────────────────────────────────────────────────────

function formatFixed(
  num:          number,
  decimals:     DecimalMode,
  thousandSep:  boolean,
): string {
  let str: string;

  if (decimals === 'auto') {
    // toPrecision(MAX_DIGITS) then trim trailing zeros
    str = trimTrailingZeros(num.toPrecision(MAX_DIGITS));
  } else {
    str = num.toFixed(decimals);
    // Still cap at MAX_DIGITS total significant digits to avoid display overflow
    str = capSignificantDigits(str, MAX_DIGITS);
  }

  if (thousandSep) {
    str = insertThousandSep(str);
  }

  return str;
}

function formatExp(num: number, decimals: DecimalMode): string {
  const precision = decimals === 'auto' ? MAX_DIGITS : (decimals as number) + 1;
  // toPrecision gives "1.23456789012345e+20" style
  const raw = num.toPrecision(precision);
  // Parse to ensure consistent output then rebuild
  const [mantissa, exp] = raw.toLowerCase().split('e');
  const cleanMantissa =
    decimals === 'auto' ? trimTrailingZeros(mantissa) : mantissa;
  const expSign  = exp.startsWith('-') ? '-' : '+';
  const expDigits = exp.replace(/^[+-]0*/, '').padStart(2, '0');
  return `${cleanMantissa}e${expSign}${expDigits}`;
}

/** Remove trailing zeros after decimal point. "3.14000" → "3.14", "3.0" → "3" */
function trimTrailingZeros(str: string): string {
  if (!str.includes('.')) return str;
  return str.replace(/\.?0+$/, '');
}

/** Insert commas into the integer part of a decimal string. */
function insertThousandSep(str: string): string {
  const [intPart, decPart] = str.split('.');
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decPart !== undefined ? `${withCommas}.${decPart}` : withCommas;
}

/**
 * Ensure the total significant digits shown do not exceed `max`.
 * Used when a fixed decimal count is specified but the integer part is large.
 */
function capSignificantDigits(str: string, max: number): string {
  const [intPart, decPart] = str.split('.');
  const intDigits = intPart.replace('-', '').length;
  if (intDigits >= max || decPart === undefined) {
    // No room for decimals — return integer portion only
    return intPart;
  }
  const allowedDec = max - intDigits;
  return `${intPart}.${decPart.slice(0, allowedDec)}`;
}
