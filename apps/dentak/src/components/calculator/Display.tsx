import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { useCalculatorStore } from '../../store/calculatorStore';
import type { HistoryEntry } from '../../store/calculatorStore';
import { useSettingsStore } from '../../store/settingsStore';
import { formatDisplay } from '../../utils/formatNumber';
import tokens from '../../theme/tokens';

// ══════════════════════════════════════════════
// 無音の演算 — Display
// 3-layer layout (bottom-aligned):
//   ① History strip — recent 2 entries (11px mono, #2a2a2a)
//   ② Expression    — current formula  (14px mono, g3)
//   ③ Result        — big number       (60px→44px→30px mono, white)
// ══════════════════════════════════════════════

export interface DisplayProps {
  // No external props — data is read directly from stores.
}

/** Map result character count → font size token key */
function resolveResultSize(charCount: number): {
  fontSize: number;
  letterSpacing: number;
} {
  if (charCount > 13) {
    return { fontSize: tokens.resultFontSize.sm, letterSpacing: -1 };
  }
  if (charCount > 9) {
    return { fontSize: tokens.resultFontSize.md, letterSpacing: -2 };
  }
  return { fontSize: tokens.resultFontSize.lg, letterSpacing: -3 };
}

const Display = memo(function Display(_props: DisplayProps) {
  // ── Store subscriptions (shallow for minimal re-renders) ────────────────
  const { current, expression, history } = useCalculatorStore(
    useShallow((s) => ({
      current:    s.current,
      expression: s.expression,
      history:    s.history,
    })),
  );

  const { decimals, useThousandSep, useExpNotation } = useSettingsStore(
    useShallow((s) => ({
      decimals:       s.decimals,
      useThousandSep: s.useThousandSep,
      useExpNotation: s.useExpNotation,
    })),
  );

  // ── Derived values ──────────────────────────────────────────────────────
  const recentHistory = history.slice(0, 2);

  const formattedResult = formatDisplay(current, {
    decimals,
    useThousandSep,
    useExpNotation,
  });

  const { fontSize: resultFontSize, letterSpacing } = resolveResultSize(
    formattedResult.length,
  );

  return (
    <View style={styles.container}>
      {/* ① History strip — direct recent 2 entries */}
      <View style={styles.historyStrip}>
        {recentHistory.map((item: HistoryEntry, index: number) => (
          <Text key={index} style={styles.historyItem} numberOfLines={1}>
            {item.expression} = {item.result}
          </Text>
        ))}
      </View>

      {/* ② Expression */}
      <Text style={styles.expression} numberOfLines={1}>
        {expression}
      </Text>

      {/* ③ Result — font size responds to value length */}
      <Text
        style={[
          styles.result,
          { fontSize: resultFontSize, letterSpacing, lineHeight: resultFontSize },
        ]}
        numberOfLines={1}
      >
        {formattedResult}
      </Text>
    </View>
  );
});

export default Display;

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex:            1,
    flexDirection:   'column',
    justifyContent:  'flex-end',
    paddingHorizontal: 20,
    paddingTop:      4,
    paddingBottom:   10,
    overflow:        'hidden',
  },
  historyStrip: {
    flexDirection: 'column',
    gap:           1,
    minHeight:     30,
  },
  historyItem: {
    fontFamily: tokens.fontFamily.mono,
    fontSize:   11,
    color:      '#2a2a2a',
    textAlign:  'right',
  },
  expression: {
    fontFamily:    tokens.fontFamily.mono,
    fontSize:      14,
    color:         tokens.colors.g3,   // #3A3A3C
    textAlign:     'right',
    minHeight:     18,
    letterSpacing: -0.2,
    marginTop:     4,
  },
  result: {
    fontFamily:  tokens.fontFamily.mono,
    fontWeight:  '200',
    color:       tokens.colors.white,
    textAlign:   'right',
  },
});
