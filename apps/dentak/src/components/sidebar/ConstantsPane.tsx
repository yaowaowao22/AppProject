import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useCalculatorStore } from '../../store/calculatorStore';
import { colors, fontFamily } from '../../theme/tokens';

// ══════════════════════════════════════════════
// 無音の演算 — ConstantsPane
// HTML mock: .sb-pane#pane-const
// 数学定数 3列 + 物理定数 3列グリッド
// ══════════════════════════════════════════════

interface ConstantDef {
  label: string;
  value: number;
  fontSize?: number;
}

const MATH_CONSTANTS: ConstantDef[] = [
  { label: 'π',     value: Math.PI          },
  { label: 'e',     value: Math.E           },
  { label: 'φ',     value: 1.6180339887     },
  { label: '√2',    value: Math.SQRT2       },
  { label: 'log₂e', value: Math.LOG2E       },
  { label: 'ln 2',  value: Math.LN2         },
];

const PHYS_CONSTANTS: ConstantDef[] = [
  { label: 'c',  value: 299792458,    fontSize: 11 },
  { label: 'h',  value: 6.62607015e-34, fontSize: 11 },
  { label: 'G',  value: 6.67430e-11,  fontSize: 11 },
  { label: 'kB', value: 1.380649e-23, fontSize: 11 },
  { label: 'NA', value: 6.022e23,     fontSize: 11 },
  { label: 'R',  value: 8.314,        fontSize: 11 },
];

// ── セクションラベル ────────────────────────────
const SectionLabel = memo<{ text: string }>(({ text }) => (
  <Text style={styles.sectionLabel}>{text}</Text>
));
SectionLabel.displayName = 'SectionLabel';

// ── 定数グリッド（3列） ─────────────────────────
interface ConstGridProps {
  items: ConstantDef[];
  onPress: (value: number) => void;
}

const ConstGrid = memo<ConstGridProps>(({ items, onPress }) => {
  // 3列に分割してrow配列を生成
  const rows: ConstantDef[][] = [];
  for (let i = 0; i < items.length; i += 3) {
    rows.push(items.slice(i, i + 3));
  }

  return (
    <View style={styles.gridContainer}>
      {rows.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.btn}
              onPress={() => onPress(item.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.btnText, item.fontSize ? { fontSize: item.fontSize } : null]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
});
ConstGrid.displayName = 'ConstGrid';

// ── ConstantsPane ───────────────────────────────
const ConstantsPane = memo(() => {
  const insertConst = useCallback((value: number) => {
    useCalculatorStore.setState({
      current:     String(value),
      shouldReset: true,
    });
  }, []);

  return (
    <View>
      {/* 数学定数 */}
      <View style={styles.section}>
        <SectionLabel text="数学定数" />
        <ConstGrid items={MATH_CONSTANTS} onPress={insertConst} />
      </View>

      {/* 物理定数 */}
      <View style={styles.section}>
        <SectionLabel text="物理定数" />
        <ConstGrid items={PHYS_CONSTANTS} onPress={insertConst} />
      </View>
    </View>
  );
});

ConstantsPane.displayName = 'ConstantsPane';

export default ConstantsPane;

const styles = StyleSheet.create({
  section: {
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.g0,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.g2,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    fontFamily: fontFamily.ui,
  },
  // gap:1px セパレータ: container を #E0E0E0 にして gap で透過
  gridContainer: {
    backgroundColor: colors.g1,
    gap: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 1,
  },
  btn: {
    flex: 1,
    height: 44,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.black,
    fontFamily: fontFamily.mono,
  },
});
