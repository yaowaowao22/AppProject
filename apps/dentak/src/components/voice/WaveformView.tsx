import React, { memo, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';

import tokens from '../../theme/tokens';

// ══════════════════════════════════════════════
// 無音の演算 — WaveformView
// 9 amber bars that scale vertically with staggered timing.
// Matches .v-wave / .di-wave animation from whisper-calc-mock.html.
// ══════════════════════════════════════════════

// Full-size (9 bars) — heights & delays match HTML mock v-wave
const LARGE_HEIGHTS = [8, 18, 30, 40, 34, 40, 30, 18, 8] as const;
const LARGE_DELAYS  = [0, 80, 160, 240, 200, 280, 160, 80, 0] as const;

// Small (5 bars for Dynamic Island) — heights ~half, delays match di-wave
const SMALL_HEIGHTS = [3, 7, 10, 7, 4] as const;
const SMALL_DELAYS  = [0, 100, 200, 120, 250] as const;

// CSS animation: vBeat 1.3s — half-cycle = 650ms
const HALF_CYCLE_MS = 650;

// ── Bar (internal) ──────────────────────────────────────────────────────────

interface BarProps {
  baseHeight: number;
  delay:      number;
}

/** Single animated bar. Handles its own shared values to avoid hook-in-loop. */
const Bar = memo(function Bar({ baseHeight, delay }: BarProps) {
  const scale   = useSharedValue(0.25);
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    const easeIO = Easing.inOut(Easing.ease);

    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1,    { duration: HALF_CYCLE_MS, easing: easeIO }),
          withTiming(0.25, { duration: HALF_CYCLE_MS, easing: easeIO }),
        ),
        -1,
      ),
    );

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1,    { duration: HALF_CYCLE_MS }),
          withTiming(0.35, { duration: HALF_CYCLE_MS }),
        ),
        -1,
      ),
    );

    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  // delay is constant per instance — intentionally omitted from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: scale.value }],
    opacity:   opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width:           3,
          height:          baseHeight,
          backgroundColor: tokens.colors.amber,
          borderRadius:    3,
        },
        animStyle,
      ]}
    />
  );
});

// ── WaveformView ────────────────────────────────────────────────────────────

export interface WaveformViewProps {
  /** Number of bars to render. Defaults to 9 (large) or 5 (small). */
  barCount?: number;
  /** 'small' = Dynamic Island mode (5 bars, half height). Default: 'large'. */
  size?: 'small' | 'large';
}

const WaveformView = memo(function WaveformView({
  barCount,
  size = 'large',
}: WaveformViewProps) {
  const isSmall   = size === 'small';
  const heights   = isSmall ? SMALL_HEIGHTS : LARGE_HEIGHTS;
  const delays    = isSmall ? SMALL_DELAYS  : LARGE_DELAYS;
  const count     = barCount ?? heights.length;

  return (
    <View style={styles.container}>
      {Array.from({ length: count }, (_, i) => (
        <Bar
          key={i}
          baseHeight={heights[i] ?? 8}
          delay={delays[i] ?? 0}
        />
      ))}
    </View>
  );
});

export default WaveformView;

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            3,
    height:         40,
  },
});
