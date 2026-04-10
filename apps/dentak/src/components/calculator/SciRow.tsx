import React, { memo } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import tokens from '../../theme/tokens';
import * as Haptics from '../../utils/haptics';

// ══════════════════════════════════════════════
// 無音の演算 — SciRow
// 2 rows of science function buttons in one component.
//
// Row 1: [2nd] | sin(→asin) | cos(→acos) | tan(→atan) | log(→10ˣ)
// Row 2: x²(→x³) | √x(→∛x) | xⁿ(→eˣ) | ln(→n!) | π(→e)
//
// isSecond=false: primary label visible, sublabel opacity:0
// isSecond=true : primary label visible, sublabel opacity:1, fn calls secondary
// ══════════════════════════════════════════════

export interface SciRowProps {
  isSecond:  boolean;
  onKeyPress: (key: string) => void;
}

/** [primaryLabel, primaryKey, secondaryLabel, secondaryKey] */
type SciBtnDef = readonly [string, string, string, string];

const ROW1_SCI: SciBtnDef[] = [
  ['sin', 'sin',  'sin⁻¹', 'asin'],
  ['cos', 'cos',  'cos⁻¹', 'acos'],
  ['tan', 'tan',  'tan⁻¹', 'atan'],
  ['log', 'log',  '10ˣ',   '10^x'],
];

const ROW2_SCI: SciBtnDef[] = [
  ['x²',  'x²',   'x³',  'x³'  ],
  ['√x',  'sqrt', '∛x',  'cbrt'],
  ['xⁿ',  'xⁿ',  'eˣ',  'eˣ'  ],
  ['ln',  'ln',   'n!',  'n!'  ],
  ['π',   'π',   'e',   'e'   ],
];

export const SciRow = memo(function SciRow({ isSecond, onKeyPress }: SciRowProps) {
  return (
    <View style={styles.container}>

      {/* ── Row 1: [2nd] + 4 sci buttons ─────────────────────────────── */}
      <View style={styles.row}>
        {/* 2nd toggle button */}
        <Pressable
          style={[styles.btn, isSecond && styles.btn2ndOn]}
          onPressIn={() => { void Haptics.tap(); }}
          onPress={() => onKeyPress('2nd')}
          accessibilityLabel="2nd"
          accessibilityRole="button"
          accessibilityState={{ selected: isSecond }}
        >
          <Text style={styles.label2nd}>2nd</Text>
        </Pressable>

        {ROW1_SCI.map(([primLabel, primKey, secLabel, secKey]) => (
          <SciBtnCell
            key={primKey}
            primLabel={primLabel}
            secLabel={secLabel}
            fnKey={isSecond ? secKey : primKey}
            isSecond={isSecond}
            onKeyPress={onKeyPress}
          />
        ))}
      </View>

      {/* ── Row 2: 5 sci buttons ──────────────────────────────────────── */}
      <View style={styles.row}>
        {ROW2_SCI.map(([primLabel, primKey, secLabel, secKey]) => (
          <SciBtnCell
            key={primKey}
            primLabel={primLabel}
            secLabel={secLabel}
            fnKey={isSecond ? secKey : primKey}
            isSecond={isSecond}
            onKeyPress={onKeyPress}
          />
        ))}
      </View>

    </View>
  );
});

// ── Internal sci cell ──────────────────────────────────────────────────────

interface SciBtnCellProps {
  primLabel:  string;
  secLabel:   string;
  fnKey:      string;
  isSecond:   boolean;
  onKeyPress: (key: string) => void;
}

const SciBtnCell = memo(function SciBtnCell({
  primLabel,
  secLabel,
  fnKey,
  isSecond,
  onKeyPress,
}: SciBtnCellProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.btn, pressed && styles.btnSciPressed]}
      onPressIn={() => { void Haptics.tap(); }}
      onPress={() => onKeyPress(fnKey)}
      accessibilityLabel={isSecond ? secLabel : primLabel}
      accessibilityRole="button"
    >
      {({ pressed }) => (
        <>
          {/* Primary label — always visible */}
          <Text style={[styles.labelSci, pressed && styles.labelSciPressedColor]}>
            {primLabel}
          </Text>
          {/* Secondary label — 8px amber; opacity 0 → 1 in 2nd mode */}
          <Text
            style={[
              styles.sublabelSci,
              isSecond && styles.sublabelSciVisible,
              pressed && styles.labelSciPressedColor,
            ]}
          >
            {secLabel}
          </Text>
        </>
      )}
    </Pressable>
  );
});

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    gap: tokens.size.gap,
  },
  row: {
    flexDirection: 'row',
    gap: tokens.size.gap,
  },

  // Shared btn base (sci height 50px, bg g3)
  btn: {
    flex: 1,
    height: tokens.size.btnSci, // 50
    backgroundColor: tokens.colors.g3,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 2,
  },

  // 2nd button ON → amber bg
  btn2ndOn: {
    backgroundColor: tokens.colors.amber,
  },

  // Sci button pressed → white bg
  btnSciPressed: {
    backgroundColor: tokens.colors.white,
  },

  // 2nd button label
  label2nd: {
    fontFamily: tokens.fontFamily.mono,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: tokens.colors.white,
  },

  // Primary sci label
  labelSci: {
    fontFamily: tokens.fontFamily.mono,
    fontSize: 14,
    color: tokens.colors.white,
  },

  // Text color inversion when button is pressed (bg goes white)
  labelSciPressedColor: {
    color: tokens.colors.black,
  },

  // Secondary sublabel: 8px amber, hidden by default
  sublabelSci: {
    fontFamily: tokens.fontFamily.mono,
    fontSize: 8,
    color: tokens.colors.amber,
    lineHeight: 10,
    opacity: 0,
  },
  sublabelSciVisible: {
    opacity: 1,
  },
});
