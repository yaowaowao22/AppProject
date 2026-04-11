import { create } from 'zustand';
import { evaluate } from '../engine/calculator';
import { normalizeExpression } from '../engine/expressionParser';
import { useSettingsStore } from './settingsStore';
export type { HistoryEntry } from '../engine/calculator';
import type { HistoryEntry } from '../engine/calculator';

// ParseResult は src/whisper/voiceParser.ts 実装後にそちらからimportに差し替え
export interface ParseResult {
  expression: string;
  result:     number | null;
  confidence: 'high' | 'low';
  rawText:    string;
}

export interface CalculatorStore {
  // 表示状態
  current:    string;
  expression: string;
  history:    HistoryEntry[];

  // 計算状態
  pendingOp:   string | null;
  pendingVal:  number | null;
  shouldReset: boolean;
  lastAnswer:  number;

  // 拡張状態
  memory:     number;
  stack:      number[];
  openParens: number;

  // Actions
  inputDigit:       (d: string) => void;
  inputDot:         () => void;
  setOperator:      (op: string) => void;
  calculate:        () => void;
  applyFunction:    (fn: string) => void;
  applyVoiceResult: (result: ParseResult) => void;
  clear:            () => void;
  backspace:        () => void;
  toggleSign:       () => void;
  percent:          () => void;

  // 2nd モード (SciRow ラベル切り替え / Keyboard → SciRow へ伝播)
  isSecond:         boolean;
  toggleIsSecond:   () => void;
}

const INITIAL_STATE = {
  current:     '0',
  expression:  '',
  history:     [] as HistoryEntry[],
  pendingOp:   null as string | null,
  pendingVal:  null as number | null,
  shouldReset: false,
  lastAnswer:  0,
  memory:      0,
  stack:       [] as number[],
  openParens:  0,
  isSecond:    false,
};

export const useCalculatorStore = create<CalculatorStore>((set, get) => ({
  ...INITIAL_STATE,

  inputDigit: (d: string) => {
    set((s) => {
      if (s.shouldReset) {
        return { current: d, shouldReset: false };
      }
      const next = s.current === '0' ? d : s.current + d;
      return { current: next };
    });
  },

  inputDot: () => {
    set((s) => {
      if (s.shouldReset) {
        return { current: '0.', shouldReset: false };
      }
      if (s.current.includes('.')) return {};
      return { current: s.current + '.' };
    });
  },

  setOperator: (op: string) => {
    set((s) => {
      const val = parseFloat(s.current);
      if (isNaN(val)) return {};  // 'Error' 等の無効値は演算子を無視 (BUG-011)
      if (s.pendingOp !== null && !s.shouldReset) {
        // チェーン演算子: 前の演算を先に評価（スタブ実装）
        // Stage 2の計算エンジン実装後に evaluate() で正式評価
        return {
          pendingOp:   op,
          pendingVal:  val,
          expression:  `${s.expression}${s.current} ${op} `,
          shouldReset: true,
        };
      }
      return {
        pendingOp:   op,
        pendingVal:  val,
        expression:  s.expression + s.current + ` ${op} `,
        shouldReset: true,
      };
    });
  },

  calculate: () => {
    set((s) => {
      const fullExpr = s.expression + s.current;
      if (!fullExpr.trim()) return {};

      const angleUnit = useSettingsStore.getState().angleUnit;
      const resultStr = evaluate(normalizeExpression(fullExpr), angleUnit);

      const entry: HistoryEntry = {
        expression: fullExpr,
        result:     resultStr,
        timestamp:  Date.now(),
      };

      return {
        current:     resultStr,
        expression:  '',
        history:     [entry, ...s.history],
        pendingOp:   null,
        pendingVal:  null,
        shouldReset: true,
        lastAnswer:  resultStr !== 'Error' ? parseFloat(resultStr) : s.lastAnswer,
      };
    });
  },

  applyFunction: (fn: string) => {
    set((s) => {
      const expr = `${fn}(${s.current})`;
      const angleUnit = useSettingsStore.getState().angleUnit;
      const resultStr = evaluate(normalizeExpression(expr), angleUnit);

      const entry: HistoryEntry = {
        expression: expr,
        result:     resultStr,
        timestamp:  Date.now(),
      };

      return {
        current:     resultStr,
        expression:  '',
        history:     [entry, ...s.history],
        shouldReset: true,
        lastAnswer:  resultStr !== 'Error' ? parseFloat(resultStr) : s.lastAnswer,
      };
    });
  },

  applyVoiceResult: (result: ParseResult) => {
    set((s) => {
      if (result.result === null) {
        // 数値変換失敗: 式文字列だけ expression に反映してリセット待ち
        return {
          expression:  result.expression,
          current:     s.current,
          shouldReset: true,
        };
      }
      const resultStr = String(result.result);
      const entry: HistoryEntry = {
        expression: result.expression,
        result:     resultStr,
        timestamp:  Date.now(),
      };
      return {
        current:     resultStr,
        expression:  '',
        history:     [entry, ...s.history],
        pendingOp:   null,
        pendingVal:  null,
        shouldReset: true,
        lastAnswer:  result.result,
      };
    });
  },

  clear: () => {
    set({ ...INITIAL_STATE });
  },

  backspace: () => {
    set((s) => {
      if (s.shouldReset || s.current === 'Error') {
        return { current: '0', shouldReset: false };
      }
      const next = s.current.length > 1 ? s.current.slice(0, -1) : '0';
      return { current: next };
    });
  },

  toggleSign: () => {
    set((s) => {
      if (s.current === '0' || s.current === 'Error') return {};
      const next = s.current.startsWith('-')
        ? s.current.slice(1)
        : '-' + s.current;
      return { current: next };
    });
  },

  percent: () => {
    set((s) => {
      const val = parseFloat(s.current);
      if (isNaN(val)) return {};
      const next = String(val / 100);
      return { current: next };
    });
  },

  toggleIsSecond: () => set((s) => ({ isSecond: !s.isSecond })),
}));
