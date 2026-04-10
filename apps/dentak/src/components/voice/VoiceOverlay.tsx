import React, { memo, useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

import WaveformView from './WaveformView';
import tokens from '../../theme/tokens';

// ══════════════════════════════════════════════
// 無音の演算 — VoiceOverlay
// Fullscreen overlay displayed during voice recording.
// Matches .voice-overlay from whisper-calc-mock.html.
//
// States:
//   listening  → WHISPER LISTENING  (waveform animates)
//   processing → WHISPER PROCESSING (static waveform)
//   applied    → APPLIED            (brief flash before hide)
// ══════════════════════════════════════════════

export interface VoiceOverlayProps {
  isVisible:   boolean;
  partialText: string;
  status:      'listening' | 'processing' | 'applied';
}

const STATUS_LABELS: Record<VoiceOverlayProps['status'], string> = {
  listening:  'WHISPER LISTENING',
  processing: 'WHISPER PROCESSING',
  applied:    'APPLIED',
};

const VoiceOverlay = memo(function VoiceOverlay({
  isVisible,
  partialText,
  status,
}: VoiceOverlayProps) {
  const opacity = useSharedValue(0);

  // Fade in / out over 300ms — mirrors .voice-overlay { transition: opacity .3s }
  useEffect(() => {
    opacity.value = withTiming(isVisible ? 1 : 0, { duration: 300 });
  }, [isVisible, opacity]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      pointerEvents={isVisible ? 'auto' : 'none'}
      style={[StyleSheet.absoluteFillObject, styles.overlay, overlayStyle]}
    >
      {/* Prompt label */}
      <Text style={styles.prompt}>話しかけてください</Text>

      {/* Waveform — isVisible のときだけ描画（18本の無限アニメーションを抑制） */}
      {isVisible && <WaveformView size="large" />}

      {/* Partial transcription text — shown while Whisper streams results */}
      {partialText.length > 0 && (
        <Text style={styles.partialText} numberOfLines={2}>
          {partialText}
        </Text>
      )}

      {/* Status indicator */}
      <Text style={styles.statusText}>{STATUS_LABELS[status]}</Text>
    </Animated.View>
  );
});

export default VoiceOverlay;

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: tokens.colors.black,
    flexDirection:   'column',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             18,
  },
  prompt: {
    fontSize: 12,
    color:    tokens.colors.g2,   // #8E8E93
  },
  partialText: {
    fontFamily:      tokens.fontFamily.mono,
    fontSize:        14,
    color:           tokens.colors.white,
    textAlign:       'center',
    paddingHorizontal: 24,
  },
  statusText: {
    fontFamily:    tokens.fontFamily.mono,
    fontSize:      10,
    color:         tokens.colors.amber,   // #FF9500
    letterSpacing: 1.2,
  },
});
