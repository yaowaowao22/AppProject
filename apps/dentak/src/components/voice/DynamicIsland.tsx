import React, { memo, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import WaveformView from './WaveformView';
import tokens from '../../theme/tokens';

// ══════════════════════════════════════════════
// 無音の演算 — DynamicIsland
// Simulates the iPhone Dynamic Island expanding during voice input.
// Matches .di / .di.voice from whisper-calc-mock.html:
//
//   default: width 126px, height 37px
//   voice:   width 210px, height 44px
//   easing:  cubic-bezier(0.34,1.56,0.64,1) = "spring" from tokens
//
// Usage: render as an absolute child of the root screen container
// (outside SafeAreaView so it can sit at the top of the display).
// ══════════════════════════════════════════════

export interface DynamicIslandProps {
  isVoiceActive: boolean;
}

// Geometry constants matching HTML mock
const DI_WIDTH_DEFAULT  = 126;
const DI_WIDTH_VOICE    = 210;
const DI_HEIGHT_DEFAULT = 37;
const DI_HEIGHT_VOICE   = 44;
const DI_TOP            = 14;    // px from screen top

// CSS: transition: width .4s var(--spring), height .35s var(--spring)
// --spring = cubic-bezier(0.34, 1.56, 0.64, 1)
const SPRING_EASING = Easing.bezier(0.34, 1.56, 0.64, 1);

// Mic icon — inline SVG-equivalent drawn with Views
// Shape: rounded rectangle body + arc stand + vertical stem + horizontal base
const MicIcon = memo(function MicIcon() {
  return (
    <View style={micStyles.wrapper}>
      {/* Capsule body */}
      <View style={micStyles.body} />
      {/* Arc base (simulated with a bottom-bordered View) */}
      <View style={micStyles.arc} />
      {/* Stem */}
      <View style={micStyles.stem} />
      {/* Base line */}
      <View style={micStyles.baseLine} />
    </View>
  );
});

const micStyles = StyleSheet.create({
  wrapper: {
    width:          16,
    height:         20,
    alignItems:     'center',
  },
  body: {
    width:        7,
    height:       10,
    borderRadius: 3.5,
    borderWidth:  1.6,
    borderColor:  tokens.colors.amber,
  },
  arc: {
    width:                   12,
    height:                  6,
    borderLeftWidth:         1.6,
    borderRightWidth:        1.6,
    borderBottomWidth:       1.6,
    borderColor:             tokens.colors.amber,
    borderBottomLeftRadius:  6,
    borderBottomRightRadius: 6,
    marginTop:               1,
  },
  stem: {
    width:           1.6,
    height:          3,
    backgroundColor: tokens.colors.amber,
    marginTop:       0,
  },
  baseLine: {
    width:           8,
    height:          1.6,
    backgroundColor: tokens.colors.amber,
  },
});

// ── DynamicIsland ────────────────────────────────────────────────────────────

const DynamicIsland = memo(function DynamicIsland({
  isVoiceActive,
}: DynamicIslandProps) {
  const width  = useSharedValue(DI_WIDTH_DEFAULT);
  const height = useSharedValue(DI_HEIGHT_DEFAULT);

  useEffect(() => {
    if (isVoiceActive) {
      width.value  = withTiming(DI_WIDTH_VOICE,    { duration: 400, easing: SPRING_EASING });
      height.value = withTiming(DI_HEIGHT_VOICE,   { duration: 350, easing: SPRING_EASING });
    } else {
      width.value  = withTiming(DI_WIDTH_DEFAULT,  { duration: 400, easing: SPRING_EASING });
      height.value = withTiming(DI_HEIGHT_DEFAULT, { duration: 350, easing: SPRING_EASING });
    }
  }, [isVoiceActive, width, height]);

  const islandStyle = useAnimatedStyle(() => ({
    width:  width.value,
    height: height.value,
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={[styles.island, islandStyle]}>
        {isVoiceActive && (
          <View style={styles.content}>
            <MicIcon />
            <WaveformView size="small" />
          </View>
        )}
      </Animated.View>
    </View>
  );
});

export default DynamicIsland;

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position:  'absolute',
    top:       DI_TOP,
    left:      0,
    right:     0,
    alignItems: 'center',
    zIndex:    200,
  },
  island: {
    backgroundColor: tokens.colors.black,
    borderRadius:    20,
    overflow:        'hidden',
    alignItems:      'center',
    justifyContent:  'center',
  },
  content: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           7,
    paddingHorizontal: 12,
  },
});
