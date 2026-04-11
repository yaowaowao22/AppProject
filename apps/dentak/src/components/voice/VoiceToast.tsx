import React, { memo, useEffect, useCallback } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import tokens from '../../theme/tokens';

// ══════════════════════════════════════════════
// VoiceToast — 音声認識結果を画面上部にしれっと表示
// Dynamic Island の下に出現し、3秒後に自動消滅
// ══════════════════════════════════════════════

export interface VoiceToastProps {
  /** 表示するテキスト（空文字で非表示） */
  text: string;
  /** エラーか通常かでスタイル分岐 */
  isError?: boolean;
  /** 消滅後のコールバック（親で text をリセットする用途） */
  onDismiss?: () => void;
}

const SHOW_DURATION_MS = 4000;

const VoiceToast = memo(function VoiceToast({
  text,
  isError = false,
  onDismiss,
}: VoiceToastProps) {
  const translateY = useSharedValue(-60);
  const opacity = useSharedValue(0);

  const handleDismiss = useCallback(() => {
    onDismiss?.();
  }, [onDismiss]);

  useEffect(() => {
    if (!text) return;

    // slide in
    translateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
    opacity.value = withTiming(1, { duration: 300 });

    // auto-dismiss
    const timer = setTimeout(() => {
      translateY.value = withTiming(-60, { duration: 250 });
      opacity.value = withDelay(0, withTiming(0, { duration: 250 }, (finished) => {
        if (finished) runOnJS(handleDismiss)();
      }));
    }, SHOW_DURATION_MS);

    return () => clearTimeout(timer);
  }, [text, translateY, opacity, handleDismiss]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!text) return null;

  return (
    <Animated.View style={[styles.container, animStyle]}>
      <Animated.View style={[styles.pill, isError && styles.pillError]}>
        <Text style={[styles.label, isError && styles.labelError]} numberOfLines={4}>
          {isError ? '⚠ ' : '🎙 '}{text}
        </Text>
      </Animated.View>
    </Animated.View>
  );
});

export default VoiceToast;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 62,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 300,
  },
  pill: {
    backgroundColor: 'rgba(58,58,60,0.92)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    maxWidth: '92%',
  },
  pillError: {
    backgroundColor: 'rgba(255,59,48,0.18)',
  },
  label: {
    fontFamily: tokens.fontFamily.mono,
    fontSize: 13,
    color: tokens.colors.white,
    textAlign: 'center',
  },
  labelError: {
    color: '#FF6B6B',
  },
});
