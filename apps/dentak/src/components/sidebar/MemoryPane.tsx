import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { useCalculatorStore } from '../../store/calculatorStore';
import { colors, fontFamily } from '../../theme/tokens';

// ══════════════════════════════════════════════
// 無音の演算 — MemoryPane
// HTML mock: .sb-pane#pane-mem
// M+/M−/MR/MC 2列グリッド + PUSH/POP/SWAP 3列グリッド
// ══════════════════════════════════════════════

// ── 汎用グリッドボタン ───────────────────────────
interface GridBtnProps {
  label: string;
  onPress: () => void;
  style?: object;
}

const GridBtn = memo<GridBtnProps>(({ label, onPress, style }) => (
  <TouchableOpacity
    style={[styles.btn, style]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={styles.btnText}>{label}</Text>
  </TouchableOpacity>
));
GridBtn.displayName = 'GridBtn';

// ── セクションラベル ────────────────────────────
const SectionLabel = memo<{ text: string }>(({ text }) => (
  <Text style={styles.sectionLabel}>{text}</Text>
));
SectionLabel.displayName = 'SectionLabel';

// ── MemoryPane ──────────────────────────────────
const MemoryPane = memo(() => {
  const { memory, stack, current } = useCalculatorStore(
    useShallow((s) => ({
      memory:  s.memory,
      stack:   s.stack,
      current: s.current,
    })),
  );

  // ── メモリ操作 ───────────────────────────────
  const memStore = useCallback(() => {
    const val = parseFloat(current);
    if (isNaN(val)) return;
    useCalculatorStore.setState((s) => ({ memory: s.memory + val }));
  }, [current]);

  const memSub = useCallback(() => {
    const val = parseFloat(current);
    if (isNaN(val)) return;
    useCalculatorStore.setState((s) => ({ memory: s.memory - val }));
  }, [current]);

  const memRecall = useCallback(() => {
    useCalculatorStore.setState({ current: String(memory), shouldReset: true });
  }, [memory]);

  const memClear = useCallback(() => {
    useCalculatorStore.setState({ memory: 0 });
  }, []);

  // ── スタック操作 ─────────────────────────────
  const stackPush = useCallback(() => {
    const val = parseFloat(current);
    if (isNaN(val)) return;
    useCalculatorStore.setState((s) => ({ stack: [val, ...s.stack] }));
  }, [current]);

  const stackPop = useCallback(() => {
    if (stack.length === 0) return;
    useCalculatorStore.setState((s) => ({
      current:     String(s.stack[0]),
      stack:       s.stack.slice(1),
      shouldReset: true,
    }));
  }, [stack.length]);

  const stackSwap = useCallback(() => {
    if (stack.length < 2) return;
    useCalculatorStore.setState((s) => {
      const next = [...s.stack];
      [next[0], next[1]] = [next[1], next[0]];
      return { stack: next };
    });
  }, [stack.length]);

  const stackLabel =
    stack.length === 0
      ? 'Stack: 空'
      : stack.map((v, i) => `[${i}]: ${v}`).join('\n');

  return (
    <View>
      {/* ── メモリ操作セクション ─────────────────── */}
      <View style={styles.section}>
        <SectionLabel text="メモリ操作" />
        {/* 2列グリッド: gap:1px区切りをcontainer backgroundで表現 */}
        <View style={styles.gridContainer}>
          <View style={styles.row}>
            <GridBtn label="M+"  onPress={memStore}  style={styles.cell2} />
            <GridBtn label="M−"  onPress={memSub}    style={styles.cell2} />
          </View>
          <View style={styles.row}>
            <GridBtn label="MR"  onPress={memRecall} style={styles.cell2} />
            <GridBtn label="MC"  onPress={memClear}  style={styles.cell2} />
          </View>
        </View>
        <Text style={styles.readout}>M = {memory}</Text>
      </View>

      {/* ── スタックセクション ───────────────────── */}
      <View style={styles.section}>
        <SectionLabel text="スタック" />
        {/* 3列グリッド */}
        <View style={[styles.gridContainer, styles.row]}>
          <GridBtn label="PUSH" onPress={stackPush} style={styles.cell3} />
          <GridBtn label="POP"  onPress={stackPop}  style={styles.cell3} />
          <GridBtn label="SWAP" onPress={stackSwap} style={styles.cell3} />
        </View>
        <Text style={[styles.readout, styles.stackReadout]}>{stackLabel}</Text>
      </View>
    </View>
  );
});

MemoryPane.displayName = 'MemoryPane';

export default MemoryPane;

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
  // 2列セル
  cell2: {
    flex: 1,
  },
  // 3列セル
  cell3: {
    flex: 1,
  },
  btn: {
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
  readout: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 12,
    color: colors.g2,
    fontFamily: fontFamily.mono,
  },
  stackReadout: {
    fontSize: 10,
    lineHeight: 18,
  },
});
