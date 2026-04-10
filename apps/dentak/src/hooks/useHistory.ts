import { useMemo, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useCalculatorStore } from '../store/calculatorStore';
import type { HistoryEntry } from '../store/calculatorStore';

// ══════════════════════════════════════════════
// 無音の演算 — useHistory
// Subscribes to calculatorStore.history and exposes:
//   recentHistory  — latest 20 entries (stable slice)
//   clearHistory   — purge all entries
//   recallEntry    — set current display to a past result
// ══════════════════════════════════════════════

export type { HistoryEntry };

const MAX_RECENT = 20;

export interface HistoryHook {
  /** Most recent 20 history entries, newest first. */
  recentHistory: HistoryEntry[];
  /** Remove all history entries from the store. */
  clearHistory: () => void;
  /** Recall an entry's result into the calculator display. */
  recallEntry: (entry: HistoryEntry) => void;
}

export function useHistory(): HistoryHook {
  // ── Subscribe to history array only (shallow avoids re-render on other state changes) ──
  const history = useCalculatorStore(useShallow((s) => s.history));

  // ── Derived: cap at MAX_RECENT ──────────────────────────────────────────
  const recentHistory = useMemo<HistoryEntry[]>(
    () => history.slice(0, MAX_RECENT),
    [history],
  );

  // ── Actions ─────────────────────────────────────────────────────────────

  /** Purge all history entries. */
  const clearHistory = useCallback(() => {
    useCalculatorStore.setState({ history: [] });
  }, []);

  /**
   * Load a past result into the calculator's current display.
   * Sets shouldReset=true so the next digit input replaces the recalled value.
   */
  const recallEntry = useCallback((entry: HistoryEntry) => {
    useCalculatorStore.setState({
      current:     entry.result,
      expression:  '',
      shouldReset: true,
    });
  }, []);

  return { recentHistory, clearHistory, recallEntry };
}
