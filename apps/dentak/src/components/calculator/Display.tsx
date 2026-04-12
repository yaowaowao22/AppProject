import React, { memo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { useCalculatorStore } from '../../store/calculatorStore';
import type { HistoryEntry } from '../../store/calculatorStore';
import { useSettingsStore } from '../../store/settingsStore';
import { formatDisplay } from '../../utils/formatNumber';
import tokens from '../../theme/tokens';

// ══════════════════════════════════════════════
// 無音の演算 — Display
// 3-layer layout (bottom-aligned):
//   ① History strip — recent 3 entries (12px mono, dim white)
//   ② Expression    — current formula  (18px mono, secondary white, horizontal scroll)
//   ③ Result        — big number       (64px→48px→32px→24px mono, white)
// ══════════════════════════════════════════════

export interface DisplayProps {
  // No external props — data is read directly from stores.
}

/** Map result character count → font size + letter spacing */
function resolveResultSize(charCount: number): {
  fontSize: number;
  letterSpacing: number;
} {
  if (charCount > 16) {
    return { fontSize: 24, letterSpacing: -0.5 };
  }
  if (charCount > 12) {
    return { fontSize: 32, letterSpacing: -1 };
  }
  if (charCount > 8) {
    return { fontSize: 48, letterSpacing: -2 };
  }
  return { fontSize: 64, letterSpacing: -3 };
}

/** 式を見やすくフォーマット: 演算子の前後にスペースを挿入 */
function formatExpression(expr: string): string {
  return expr
    .replace(/([+\-×÷^])/g, ' $1 ')
    .replace(/\s{2,}/g, ' ')
    .trim();
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
  const recentHistory = history.slice(0, 3);

  const formattedResult = formatDisplay(current, {
    decimals,
    useThousandSep,
    useExpNotation,
  });

  const displayExpression = formatExpression(expression);

  const { fontSize: resultFontSize, letterSpacing } = resolveResultSize(
    formattedResult.length,
  );

  const isError = formattedResult === 'Error';

  return (
    <View style={styles.container}>
      {/* ① History strip — recent 3 entries */}
      <View style={styles.historyStrip}>
        {recentHistory.map((item: HistoryEntry, index: number) => (
          <Text
            key={`${item.timestamp}-${index}`}
            style={[
              styles.historyItem,
              index === 0 && styles.historyItemRecent,
            ]}
            numberOfLines={1}
          >
            {item.expression} = {item.result}
          </Text>
        ))}
      </View>

      {/* ② Expression — horizontal scrollable */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.expressionScroll}
        style={styles.expressionWrapper}
      >
        <Text style={styles.expression}>
          {displayExpression}
        </Text>
      </ScrollView>

      {/* ③ Result — font size responds to value length */}
      <Text
        style={[
          styles.result,
          {
            fontSize: resultFontSize,
            letterSpacing,
            lineHeight: resultFontSize * 1.1,
          },
          isError && styles.resultError,
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.5}
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
    paddingBottom:   12,
    overflow:        'hidden',
  },

  // ── History ──
  historyStrip: {
    flexDirection: 'column',
    gap:           2,
    minHeight:     46,
  },
  historyItem: {
    fontFamily:    tokens.fontFamily.mono,
    fontSize:      12,
    color:         'rgba(255,255,255,0.25)',
    textAlign:     'right',
    letterSpacing: -0.3,
  },
  /** 直近の履歴はやや明るく */
  historyItemRecent: {
    color:    'rgba(255,255,255,0.40)',
    fontSize: 13,
  },

  // ── Expression ──
  expressionWrapper: {
    maxHeight:  28,
    minHeight:  24,
    marginTop:  6,
    flexGrow:   0,
  },
  expressionScroll: {
    flexGrow:       1,
    justifyContent: 'flex-end',
  },
  expression: {
    fontFamily:    tokens.fontFamily.mono,
    fontSize:      18,
    color:         'rgba(255,255,255,0.55)',
    textAlign:     'right',
    letterSpacing: -0.3,
  },

  // ── Result ──
  result: {
    fontFamily:  tokens.fontFamily.mono,
    fontWeight:  '200',
    color:       tokens.colors.white,
    textAlign:   'right',
    marginTop:   2,
  },
  resultError: {
    color: '#FF6B6B',
  },
});
