import React, { memo } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import tokens from '../../theme/tokens';
import * as Haptics from '../../utils/haptics';
import { useSettingsStore } from '../../store/settingsStore';
import { resolveKey } from '../../config/keyLayouts';
import type { LayoutRow } from '../../config/keyLayouts';

// ══════════════════════════════════════════════
// 無音の演算 — UtilBar
// レイアウト設定から動的にボタンを生成する汎用ユーティリティバー
// height: 38px / bg: #0a0a0a / text: g2 → white on press
// mic キーは onMicPress コールバックで処理
// ══════════════════════════════════════════════

export interface UtilBarProps {
  onKeyPress:  (key: string) => void;
  onMicPress?: () => void;
  isVoiceActive?: boolean;
}

const UTIL_BG = '#0a0a0a';

export const UtilBar = memo(function UtilBar({
  onKeyPress,
  onMicPress,
  isVoiceActive = false,
}: UtilBarProps) {
  const utilLayout = useSettingsStore((s) => s.utilLayout);

  return (
    <View style={styles.row}>
      {utilLayout.map((cell, idx) => {
        const def = resolveKey(cell.keyId);
        if (!def) return null;

        const isMic = def.type === 'mic';

        return (
          <Pressable
            key={`${cell.keyId}-${idx}`}
            style={[styles.btn, { flex: cell.flex ?? 1 }]}
            onPressIn={() => { void Haptics.tap(); }}
            onPress={() => {
              if (isMic && onMicPress) {
                onMicPress();
              } else if (!isMic) {
                onKeyPress(def.pressKey);
              }
            }}
            accessibilityLabel={def.label}
            accessibilityRole="button"
          >
            {({ pressed }) => (
              <Text
                style={[
                  styles.label,
                  pressed && styles.labelActive,
                  isMic && isVoiceActive && styles.labelMicActive,
                ]}
              >
                {isMic ? '🎙' : def.label}
              </Text>
            )}
          </Pressable>
        );
      })}
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
  labelMicActive: {
    color: tokens.colors.amber,
  },
});
