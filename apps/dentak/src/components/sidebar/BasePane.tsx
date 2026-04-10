import React, { useState, memo, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { useCalculatorStore } from '../../store/calculatorStore';
import { getAllBases } from '../../engine/baseConverter';
import type { BaseType } from '../../engine/baseConverter';
import { colors, fontFamily } from '../../theme/tokens';

// ══════════════════════════════════════════════
// 無音の演算 — BasePane
// HTML mock: .sb-pane#pane-base
// 進数選択 2列 + 現在値 4種表示
// ⚠️ base はストア未実装のため local state で管理
//    settingsStore に base/setBase が追加された際は
//    useState → useSettingsStore に差し替え
// ══════════════════════════════════════════════

interface BaseDef {
  id: BaseType;
  label: string;
}

const BASES: BaseDef[] = [
  { id: 'DEC', label: 'DEC 10' },
  { id: 'HEX', label: 'HEX 16' },
  { id: 'OCT', label: 'OCT 8'  },
  { id: 'BIN', label: 'BIN 2'  },
];

// ── セクションラベル ────────────────────────────
const SectionLabel = memo<{ text: string }>(({ text }) => (
  <Text style={styles.sectionLabel}>{text}</Text>
));
SectionLabel.displayName = 'SectionLabel';

// ── BasePane ────────────────────────────────────
const BasePane = memo(() => {
  // ⚠️ settingsStore に base が追加されたらそちらに移行
  const [base, setBase] = useState<BaseType>('DEC');

  const current = useCalculatorStore(useShallow((s) => s.current));

  const onSelectBase = useCallback((id: BaseType) => {
    setBase(id);
  }, []);

  // 現在値を全基数に変換
  const bases = useMemo(() => {
    const decVal = parseFloat(current);
    if (isNaN(decVal)) {
      return { DEC: '—', HEX: '—', OCT: '—', BIN: '—' } as Record<BaseType, string>;
    }
    return getAllBases(decVal);
  }, [current]);

  return (
    <View>
      {/* ── 進数選択セクション ───────────────────── */}
      <View style={styles.section}>
        <SectionLabel text="進数選択" />
        {/* 2列グリッド: gap:1px セパレータ */}
        <View style={styles.gridContainer}>
          {/* row 1: DEC / HEX */}
          <View style={styles.row}>
            {BASES.slice(0, 2).map((b) => (
              <TouchableOpacity
                key={b.id}
                style={[styles.btn, base === b.id && styles.btnActive]}
                onPress={() => onSelectBase(b.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.btnText, base === b.id && styles.btnTextActive]}>
                  {b.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* row 2: OCT / BIN */}
          <View style={styles.row}>
            {BASES.slice(2, 4).map((b) => (
              <TouchableOpacity
                key={b.id}
                style={[styles.btn, base === b.id && styles.btnActive]}
                onPress={() => onSelectBase(b.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.btnText, base === b.id && styles.btnTextActive]}>
                  {b.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* ── 現在値セクション ─────────────────────── */}
      <View style={styles.section}>
        <SectionLabel text="現在値" />
        <Text style={styles.baseReadout}>
          {'DEC: '}{bases.DEC}{'\n'}
          {'HEX: '}{bases.HEX}{'\n'}
          {'OCT: '}{bases.OCT}{'\n'}
          {'BIN: '}{bases.BIN}
        </Text>
      </View>
    </View>
  );
});

BasePane.displayName = 'BasePane';

export default BasePane;

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
  btnActive: {
    backgroundColor: colors.black,
  },
  btnText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.black,
    fontFamily: fontFamily.mono,
  },
  btnTextActive: {
    color: colors.white,
  },
  baseReadout: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    fontSize: 11,
    color: colors.g2,
    fontFamily: fontFamily.mono,
    lineHeight: 22,   // lineHeight:2 相当（11px × 2）
  },
});
