import { useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useCalculatorStore } from '../store/calculatorStore';
import type { HistoryEntry } from '../store/calculatorStore';
import { useSettingsStore } from '../store/settingsStore';
import { evaluate } from '../engine/calculator';
import { normalizeExpression } from '../engine/expressionParser';
import { formatDisplay } from '../utils/formatNumber';
import * as Haptics from '../utils/haptics';

// ══════════════════════════════════════════════
// 無音の演算 — useCalculator
// Integrates calculatorStore + settingsStore, wraps
// real evaluation (normalizeExpression → evaluate)
// and routes all key presses through a single handler.
// ══════════════════════════════════════════════

export type ResultFontSize = 'lg' | 'md' | 'sm';

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Normalise an operator symbol for the expression string (display form). */
function toDisplayOp(key: string): string {
  if (key === '*') return '×';
  if (key === '/') return '÷';
  return key;
}

/** Digit-count of the formatted display value (excluding separators). */
function countDisplayDigits(formatted: string): number {
  return formatted.replace(/[,.\- e]/g, '').length;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useCalculator() {
  // ── Calculator store (state only, shallow for minimal re-renders) ────────
  const {
    current,
    expression,
    history,
    pendingOp,
    pendingVal,
    shouldReset,
    lastAnswer,
    memory,
    stack,
    openParens,
  } = useCalculatorStore(
    useShallow((s) => ({
      current:    s.current,
      expression: s.expression,
      history:    s.history,
      pendingOp:  s.pendingOp,
      pendingVal: s.pendingVal,
      shouldReset: s.shouldReset,
      lastAnswer:  s.lastAnswer,
      memory:     s.memory,
      stack:      s.stack,
      openParens: s.openParens,
      isSecond:   s.isSecond,
    })),
  );

  // ── Calculator store (actions — stable references, selected once) ────────
  const {
    inputDigit,
    inputDot,
    setOperator,
    calculate,
    applyFunction,
    applyVoiceResult,
    clear,
    backspace,
    toggleSign,
    percent,
  } = useCalculatorStore(
    useShallow((s) => ({
      inputDigit:       s.inputDigit,
      inputDot:         s.inputDot,
      setOperator:      s.setOperator,
      calculate:        s.calculate,
      applyFunction:    s.applyFunction,
      applyVoiceResult: s.applyVoiceResult,
      clear:            s.clear,
      backspace:        s.backspace,
      toggleSign:       s.toggleSign,
      percent:          s.percent,
      toggleIsSecond:   s.toggleIsSecond,
    })),
  );

  // ── Settings store ───────────────────────────────────────────────────────
  const { angleUnit, decimals, useThousandSep, useExpNotation } =
    useSettingsStore(
      useShallow((s) => ({
        angleUnit:      s.angleUnit,
        decimals:       s.decimals,
        useThousandSep: s.useThousandSep,
        useExpNotation: s.useExpNotation,
      })),
    );

  // ── Derived: formatted display ───────────────────────────────────────────
  const formattedDisplay = useMemo<string>(() => {
    if (current === 'Error') return 'Error';
    if (current === 'Infinity')  return '∞';
    if (current === '-Infinity') return '-∞';
    return formatDisplay(current, { decimals, useThousandSep, useExpNotation });
  }, [current, decimals, useThousandSep, useExpNotation]);

  // ── Derived: display-form expression ────────────────────────────────────
  /** Convert any raw operator symbols back to the display-friendly forms. */
  const formattedExpression = useMemo<string>(() => {
    return expression
      .replace(/\*/g, '×')
      .replace(/(?<!\d)\/(?!\d)/g, '÷');
  }, [expression]);

  // ── Derived: font size tier based on digit count ─────────────────────────
  const resultFontSize = useMemo<ResultFontSize>(() => {
    const digits = countDisplayDigits(formattedDisplay);
    if (digits <= 7)  return 'lg';
    if (digits <= 12) return 'md';
    return 'sm';
  }, [formattedDisplay]);

  // ── Real function evaluation (bypasses store stub) ───────────────────────
  /**
   * Applies a mathematical function to `current` using the real engine.
   * Called internally by handleKeyPress for function keys.
   *
   * @param fn - e.g. 'sin', 'sqrt', '^2' (special case for square)
   */
  const _applyFnReal = useCallback((fn: string) => {
    const s     = useCalculatorStore.getState();
    const { angleUnit: au } = useSettingsStore.getState();

    const rawExpr  = fn === '^2' ? `${s.current}^2` : `${fn}(${s.current})`;
    const normalized = normalizeExpression(rawExpr);
    const resultStr  = evaluate(normalized, au);

    const entry: HistoryEntry = {
      expression: rawExpr,
      result:     resultStr,
      timestamp:  Date.now(),
    };

    useCalculatorStore.setState({
      current:     resultStr,
      expression:  '',
      history:     [entry, ...s.history],
      shouldReset: true,
      lastAnswer:  resultStr !== 'Error' ? parseFloat(resultStr) : s.lastAnswer,
    });

    void (resultStr === 'Error' ? Haptics.error() : Haptics.success());
  }, []);

  // ── Real calculation ─────────────────────────────────────────────────────
  /**
   * Reads expression + current from the store, normalises, evaluates with
   * the real engine, and updates store state.
   */
  const handleCalculate = useCallback(() => {
    const s    = useCalculatorStore.getState();
    const { angleUnit: au } = useSettingsStore.getState();

    const fullExpr = (s.expression + s.current).trim();
    if (!fullExpr) return;

    const normalized = normalizeExpression(fullExpr);
    const resultStr  = evaluate(normalized, au);

    const entry: HistoryEntry = {
      expression: fullExpr,
      result:     resultStr,
      timestamp:  Date.now(),
    };

    useCalculatorStore.setState({
      current:     resultStr,
      expression:  '',
      history:     [entry, ...s.history],
      pendingOp:   null,
      pendingVal:  null,
      shouldReset: true,
      lastAnswer:  resultStr !== 'Error' ? parseFloat(resultStr) : s.lastAnswer,
    });

    void (resultStr === 'Error' ? Haptics.error() : Haptics.success());
  }, []);

  // ── Unified key handler ──────────────────────────────────────────────────
  /**
   * Routes any key label from the keyboard UI to the appropriate action.
   * Calls haptics.tap() for all keys; '=' uses handleCalculate which
   * additionally fires success/error haptics.
   */
  const handleKeyPress = useCallback((key: string) => {
    // '=' delegates entirely to handleCalculate (has its own haptics)
    if (key === '=') {
      handleCalculate();
      return;
    }

    // ── Perform action ──────────────────────────────────────────────────────

    // Digit keys
    if (/^[0-9]$/.test(key)) {
      inputDigit(key);

    // Decimal
    } else if (key === '.') {
      inputDot();

    // Arithmetic operators
    } else if (key === '+') {
      setOperator('+');
    } else if (key === '-') {
      setOperator('-');
    } else if (key === '×' || key === '*') {
      setOperator('×');
    } else if (key === '÷' || key === '/') {
      setOperator('÷');
    } else if (key === '^' || key === 'xⁿ') {
      setOperator('^');

    // Control keys
    } else if (key === 'AC' || key === 'C') {
      clear();
    } else if (key === '⌫') {
      backspace();
    } else if (key === '±' || key === '+/-') {
      toggleSign();
    } else if (key === '%') {
      percent();

    // Open parenthesis
    } else if (key === '(') {
      const s = useCalculatorStore.getState();
      // If there is a pending value in current, use implicit multiplication
      const prefix =
        !s.shouldReset && s.current !== '0'
          ? s.current + '*'
          : '';
      useCalculatorStore.setState({
        expression:  s.expression + prefix + '(',
        current:     '0',
        shouldReset: false,
        openParens:  s.openParens + 1,
      });

    // Close parenthesis
    } else if (key === ')') {
      const s = useCalculatorStore.getState();
      if (s.openParens <= 0) return; // no matching open paren
      useCalculatorStore.setState({
        expression:  s.expression + s.current + ')',
        current:     '0',
        shouldReset: true,
        openParens:  s.openParens - 1,
      });

    // Scientific functions (real evaluation)
    } else if (
      key === 'sin' || key === 'cos' || key === 'tan' ||
      key === 'asin' || key === 'acos' || key === 'atan'
    ) {
      _applyFnReal(key);
    } else if (key === 'log') {
      _applyFnReal('log');   // normalizeExpression converts log→log10
    } else if (key === 'ln') {
      _applyFnReal('ln');    // normalizeExpression converts ln→log (natural)
    } else if (key === 'sqrt' || key === '√') {
      _applyFnReal('sqrt');
    } else if (key === 'x²' || key === '²') {
      _applyFnReal('^2');

    // Constants — input as digit-like tokens
    } else if (key === 'π') {
      inputDigit('π');
    } else if (key === 'e') {
      inputDigit('e');

    // ANS — recall last answer
    } else if (key === 'ANS') {
      const s = useCalculatorStore.getState();
      inputDigit(String(s.lastAnswer));

    // 2nd toggle
    } else if (key === '2nd') {
      toggleIsSecond();
    }

    // Haptic feedback for all non-calculate keys
    void Haptics.tap();
  }, [
    handleCalculate,
    _applyFnReal,
    inputDigit,
    inputDot,
    setOperator,
    clear,
    backspace,
    toggleSign,
    percent,
    toggleIsSecond,
  ]);

  // ── Return ───────────────────────────────────────────────────────────────
  return {
    // ── calculatorStore: state
    current,
    expression,
    history,
    pendingOp,
    pendingVal,
    shouldReset,
    lastAnswer,
    memory,
    stack,
    openParens,

    // ── calculatorStore: actions (exposed for advanced use)
    inputDigit,
    inputDot,
    setOperator: (op: string) => setOperator(toDisplayOp(op)),
    calculate,          // store stub — prefer handleCalculate
    applyFunction,      // store stub — prefer handleKeyPress with fn key
    applyVoiceResult,
    clear,
    backspace,
    toggleSign,
    percent,

    // ── settingsStore slices
    angleUnit,
    decimals,
    useThousandSep,
    useExpNotation,

    // ── Derived values
    formattedDisplay,
    formattedExpression,
    resultFontSize,

    // ── Hook-level
    isSecond,
    toggleIsSecond,
    handleKeyPress,
    handleCalculate,
  };
}
