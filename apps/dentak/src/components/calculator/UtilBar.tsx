import React, { memo } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import tokens from '../../theme/tokens';
import * as Haptics from '../../utils/haptics';

// ══════════════════════════════════════════════
// 無音の演算 — UtilBar
// 5-column micro-row: （ ） EE ANS ⌫
// height: 38px / bg: #0a0a0a / text: g2 → white on press
// ══════════════════════════════════════════════

export interface UtilBarProps {
  onKeyPress: (key: string) => void;
}

const UTIL_BG = '#0a0a0a';

const BUTTONS: ReadonlyArray<{ label: string; key: string }> = [
  { label: '（', key: '(' },
  { label: '）', key: ')' },
  { label: 'EE',  key: 'EE'  },
  { label: 'ANS', key: 'ANS' },
  { label: '⌫',  key: '⌫'  },
];

export const UtilBar = memo(function UtilBar({ onKeyPress }: UtilBarProps) {
  return (
    <View style={styles.row}>
      {BUTTONS.map(({ label, key }) => (
        <Pressable
          key={key}
          style={styles.btn}
          onPressIn={() => { void Haptics.tap(); }}
          onPress={() => onKeyPress(key)}
          accessibilityLabel={label}
          accessibilityRole="button"
        >
          {({ pressed }) => (
            <Text style={[styles.label, pressed && styles.labelActive]}>
              {label}
            </Text>
          )}
        </Pressable>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: UTIL_BG,
    gap: tokens.size.gap,
  },
  btn: {
    flex: 1,
    height: tokens.size.btnUtil, // 38
    backgroundColor: UTIL_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: tokens.fontFamily.mono,
    fontSize: 14,
    color: tokens.colors.g2,
  },
  labelActive: {
    color: tokens.colors.white,
  },
});
