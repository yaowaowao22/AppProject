import React, { useState, useCallback, useEffect, useRef, memo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

import Display from '../../components/calculator/Display';
import { UtilBar } from '../../components/calculator/UtilBar';
import { SciRow } from '../../components/calculator/SciRow';
import VoiceOverlay from '../../components/voice/VoiceOverlay';
import DynamicIsland from '../../components/voice/DynamicIsland';
import VoiceToast from '../../components/voice/VoiceToast';
import Sidebar from '../../components/sidebar/Sidebar';
import SettingsSheet from '../../components/settings/SettingsSheet';

import { useCalculator } from '../../hooks/useCalculator';
import { useWhisper } from '../../hooks/useWhisper';
import { useSidebar } from '../../hooks/useSidebar';
import { useSettingsStore } from '../../store/settingsStore';
import type { AngleUnit } from '../../store/settingsStore';
import tokens from '../../theme/tokens';
import * as Haptics from '../../utils/haptics';

// ══════════════════════════════════════════════
// 無音の演算 — CalculatorScreen
// DESIGN.md §8 CalculatorScreen レイアウト準拠
// ══════════════════════════════════════════════

// ── Angle unit cycling ───────────────────────────────────────────────────────

const ANGLE_CYCLE: AngleUnit[] = ['deg', 'rad', 'grad'];
const ANGLE_LABEL: Record<AngleUnit, string> = {
  deg:  'DEG',
  rad:  'RAD',
  grad: 'GRAD',
};

// ── NumRow button definitions ─────────────────────────────────────────────────

type BtnType = 'fn' | 'num' | 'op' | 'op-eq' | 'mic';

interface NumBtnDef {
  label:     string;
  /** key passed to handleKeyPress (may differ from displayed label) */
  key:       string;
  type:      BtnType;
  /** flex value; default 1 */
  flex?:     number;
  /** use monospace font for label */
  mono?:     boolean;
  /** override label font size */
  fontSize?: number;
}

const NUM_ROWS: NumBtnDef[][] = [
  // Row 1: AC ± % π ÷
  [
    { label: 'AC',  key: 'AC',   type: 'fn'  },
    { label: '±',   key: '±',    type: 'fn'  },
    { label: '%',   key: '%',    type: 'fn'  },
    { label: 'π',   key: 'π',    type: 'fn',  mono: true },
    { label: '÷',   key: '÷',    type: 'op'  },
  ],
  // Row 2: 7 8 9 √x ×
  [
    { label: '7',   key: '7',    type: 'num' },
    { label: '8',   key: '8',    type: 'num' },
    { label: '9',   key: '9',    type: 'num' },
    { label: '√x',  key: 'sqrt', type: 'fn',  mono: true, fontSize: 14 },
    { label: '×',   key: '×',    type: 'op'  },
  ],
  // Row 3: 4 5 6 x² −
  [
    { label: '4',   key: '4',    type: 'num' },
    { label: '5',   key: '5',    type: 'num' },
    { label: '6',   key: '6',    type: 'num' },
    { label: 'x²',  key: 'x²',  type: 'fn',  mono: true, fontSize: 14 },
    { label: '−',   key: '-',    type: 'op'  },  // key '-' for handleKeyPress
  ],
  // Row 4: 1 2 3 log +
  [
    { label: '1',   key: '1',    type: 'num' },
    { label: '2',   key: '2',    type: 'num' },
    { label: '3',   key: '3',    type: 'num' },
    { label: 'log', key: 'log',  type: 'fn',  mono: true, fontSize: 14 },
    { label: '+',   key: '+',    type: 'op'  },
  ],
  // Row 5: 0 (flex 2) · mic =
  [
    { label: '0',   key: '0',    type: 'num', flex: 2 },
    { label: '.',   key: '.',    type: 'num' },
    { label: 'mic', key: 'mic',  type: 'mic' },
    { label: '=',   key: '=',    type: 'op-eq' },
  ],
];

// ── Inline icon components ────────────────────────────────────────────────────

/** Hamburger: 3 horizontal bars, 18×14, stroke color g3 */
const HamburgerIcon = memo(function HamburgerIcon() {
  return (
    <View style={iconStyles.hamburger}>
      <View style={iconStyles.hamburgerLine} />
      <View style={iconStyles.hamburgerLine} />
      <View style={iconStyles.hamburgerLine} />
    </View>
  );
});

/** Gear: ⚙ text glyph, 18px, color g3 */
const GearIcon = memo(function GearIcon() {
  return <Text style={iconStyles.gear}>⚙</Text>;
});

/** Mic icon: View-based (react-native-svg not installed) */
const MicIconKbd = memo(function MicIconKbd({ color }: { color: string }) {
  return (
    <View style={micKbdStyles.wrapper}>
      {/* Capsule body */}
      <View style={[micKbdStyles.body, { borderColor: color }]} />
      {/* Arc base */}
      <View style={[micKbdStyles.arc, { borderColor: color }]} />
      {/* Stem */}
      <View style={[micKbdStyles.stem, { backgroundColor: color }]} />
      {/* Base line */}
      <View style={[micKbdStyles.baseLine, { backgroundColor: color }]} />
    </View>
  );
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function CalculatorScreen() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  // ── Hooks ────────────────────────────────────────────────────────────────
  const { isSecond, handleKeyPress } = useCalculator();

  const {
    voiceState,
    partialText,
    finalText,
    error: voiceError,
    startListening,
    stopListening,
  } = useWhisper();

  // ── VoiceToast 表示テキスト管理 ─────────────────────────────────────────
  const [toastText, setToastText]     = useState('');
  const [toastIsError, setToastIsError] = useState(false);

  const sidebar = useSidebar();

  const angleUnit    = useSettingsStore((s) => s.angleUnit);
  const setAngleUnit = useSettingsStore((s) => s.setAngleUnit);

  // ── VoiceToast: finalText / error 変化時にトースト表示 ─────────────────
  const prevFinalText = useRef('');
  const prevError     = useRef<string | null>(null);

  useEffect(() => {
    if (finalText && finalText !== prevFinalText.current) {
      setToastText(finalText);
      setToastIsError(false);
    }
    prevFinalText.current = finalText;
  }, [finalText]);

  useEffect(() => {
    if (voiceError && voiceError !== prevError.current) {
      setToastText(voiceError);
      setToastIsError(true);
    }
    prevError.current = voiceError;
  }, [voiceError]);

  const handleToastDismiss = useCallback(() => {
    setToastText('');
  }, []);

  // ── Derived state ─────────────────────────────────────────────────────────
  const isVoiceActive =
    voiceState !== 'idle' && voiceState !== 'requesting_permission';

  const voiceStatus: 'listening' | 'processing' | 'applied' =
    voiceState === 'applied'    ? 'applied'    :
    voiceState === 'processing' ? 'processing' :
    'listening';

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleMicPress = useCallback(() => {
    void Haptics.tap();
    if (voiceState === 'listening') {
      stopListening();
    } else if (voiceState === 'idle') {
      void startListening();
    }
  }, [voiceState, startListening, stopListening]);

  const handleAngleCycle = useCallback(() => {
    const idx = ANGLE_CYCLE.indexOf(angleUnit);
    setAngleUnit(ANGLE_CYCLE[(idx + 1) % ANGLE_CYCLE.length]);
  }, [angleUnit, setAngleUnit]);

  const handleOpenSettings = useCallback(() => {
    setSettingsOpen(true);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setSettingsOpen(false);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <SafeAreaView style={styles.safeArea}>

        {/* ── TopBar ──────────────────────────────────────────────────── */}
        <View style={styles.topbar}>
          {/* Left: hamburger + 2ND badge */}
          <View style={styles.topbarLeft}>
            <Pressable
              style={styles.iconBtn}
              onPress={sidebar.open}
              accessibilityLabel="Advanced panel"
              accessibilityRole="button"
            >
              <HamburgerIcon />
            </Pressable>
            {isSecond && (
              <Text style={styles.secondBadge}>2ND</Text>
            )}
          </View>

          {/* Right: angle pill + gear */}
          <View style={styles.topbarRight}>
            <Pressable
              style={styles.anglePill}
              onPress={handleAngleCycle}
              accessibilityLabel={`Angle unit: ${ANGLE_LABEL[angleUnit]}`}
              accessibilityRole="button"
            >
              <Text style={styles.anglePillText}>
                {ANGLE_LABEL[angleUnit]}
              </Text>
            </Pressable>
            <Pressable
              style={styles.iconBtn}
              onPress={handleOpenSettings}
              accessibilityLabel="Settings"
              accessibilityRole="button"
            >
              <GearIcon />
            </Pressable>
          </View>
        </View>

        {/* ── Display + VoiceOverlay ──────────────────────────────────── */}
        <View style={styles.displayWrapper}>
          <Display />
          {/* VoiceOverlay uses StyleSheet.absoluteFillObject internally */}
          <VoiceOverlay
            isVisible={isVoiceActive}
            partialText={partialText}
            status={voiceStatus}
          />
        </View>

        {/* ── Keyboard ─────────────────────────────────────────────────── */}
        <View style={styles.keyboard}>
          {/* Utility micro-row: ( ) EE ANS ⌫ */}
          <UtilBar onKeyPress={handleKeyPress} />

          {/* Sci rows 1 & 2 (SciRow renders both internally) */}
          <SciRow isSecond={isSecond} onKeyPress={handleKeyPress} />

          {/* NumRows × 5 */}
          {NUM_ROWS.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.numRow}>
              {row.map((btn) => {
                const bgColor =
                  btn.type === 'fn'    ? tokens.colors.g3    :
                  btn.type === 'num'   ? tokens.colors.numBg :
                  btn.type === 'op'    ? tokens.colors.amber  :
                  btn.type === 'op-eq' ? tokens.colors.white :
                  /* mic */              tokens.colors.numBg;

                const pressedBg =
                  btn.type === 'op-eq' ? tokens.colors.g1 : tokens.colors.white;

                const defaultTextColor =
                  btn.type === 'op-eq' ? tokens.colors.black : tokens.colors.white;

                const labelFontFamily =
                  btn.mono ? tokens.fontFamily.mono : tokens.fontFamily.ui;

                const labelFontSize =
                  btn.fontSize ??
                  (btn.type === 'num' || btn.type === 'op' || btn.type === 'op-eq'
                    ? 28
                    : 17);

                return (
                  <Pressable
                    key={btn.key + rowIdx}
                    style={({ pressed }) => [
                      styles.numBtn,
                      {
                        flex:            btn.flex ?? 1,
                        backgroundColor: pressed ? pressedBg : bgColor,
                      },
                    ]}
                    onPressIn={() => { void Haptics.tap(); }}
                    onPress={() => {
                      if (btn.type === 'mic') {
                        handleMicPress();
                      } else {
                        handleKeyPress(btn.key);
                      }
                    }}
                    accessibilityLabel={btn.label}
                    accessibilityRole="button"
                  >
                    {({ pressed }) =>
                      btn.type === 'mic' ? (
                        <MicIconKbd
                          color={
                            pressed       ? tokens.colors.black :
                            isVoiceActive ? tokens.colors.amber :
                            tokens.colors.white
                          }
                        />
                      ) : (
                        <Text
                          style={[
                            styles.numLabel,
                            {
                              color:      pressed ? tokens.colors.black : defaultTextColor,
                              fontFamily: labelFontFamily,
                              fontSize:   labelFontSize,
                            },
                          ]}
                        >
                          {btn.label}
                        </Text>
                      )
                    }
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

      </SafeAreaView>

      {/* ── DynamicIsland — absolute at top (self-positioning) ─────────── */}
      <DynamicIsland isVoiceActive={isVoiceActive} />

      {/* ── VoiceToast — 認識テキスト表示（DI の下に出現） ──────────── */}
      <VoiceToast
        text={toastText}
        isError={toastIsError}
        onDismiss={handleToastDismiss}
      />

      {/* ── Sidebar — absolute overlay ──────────────────────────────────── */}
      <Sidebar
        isOpen={sidebar.isOpen}
        onClose={sidebar.close}
        sidebarStyle={sidebar.sidebarStyle}
        overlayStyle={sidebar.overlayStyle}
        panGesture={sidebar.panGesture}
      />

      {/* ── SettingsSheet — absolute overlay ───────────────────────────── */}
      <SettingsSheet
        isVisible={settingsOpen}
        onClose={handleCloseSettings}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: tokens.colors.black,
  },
  safeArea: {
    flex:            1,
    backgroundColor: tokens.colors.black,
  },

  // TopBar: padding 6px top, 16px horizontal, 0 bottom (DESIGN.md spec)
  topbar: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingTop:        6,
    paddingHorizontal: 16,
    paddingBottom:     0,
  },
  topbarLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
  },
  topbarRight: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           12,
  },
  iconBtn: {
    padding:         4,
    alignItems:      'center',
    justifyContent:  'center',
  },

  // 2ND badge: 10px mono amber
  secondBadge: {
    fontFamily:   tokens.fontFamily.mono,
    fontSize:     10,
    fontWeight:   '600',
    color:        tokens.colors.amber,
    letterSpacing: 0.5,
  },

  // Angle pill: 10px 600weight #8E8E93
  anglePill: {
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:      10,
    backgroundColor:   'rgba(142,142,147,0.15)',
    alignItems:        'center',
    justifyContent:    'center',
  },
  anglePillText: {
    fontFamily:  tokens.fontFamily.mono,
    fontSize:    10,
    fontWeight:  '600',
    color:       tokens.colors.g2,
  },

  // Display wrapper fills remaining space; VoiceOverlay is absoluteFill inside
  displayWrapper: {
    flex: 1,
  },

  // Keyboard: stacked rows with 1px gap between all rows
  keyboard: {
    gap: tokens.size.gap,
  },

  // NumRow: horizontal strip with 1px gap
  numRow: {
    flexDirection: 'row',
    gap:           tokens.size.gap,
  },

  // NumBtn: height 62px, centered content
  numBtn: {
    height:          tokens.size.btnNum, // 62
    alignItems:      'center',
    justifyContent:  'center',
  },

  // NumLabel: inline color/fontFamily/fontSize applied per button
  numLabel: {
    fontWeight: '400',
  },
});

// ── Icon styles ───────────────────────────────────────────────────────────────

const iconStyles = StyleSheet.create({
  hamburger: {
    width:          18,
    height:         14,
    justifyContent: 'space-between',
  },
  hamburgerLine: {
    height:          1.6,
    backgroundColor: tokens.colors.g3,
  },
  gear: {
    fontSize: 18,
    color:    tokens.colors.g3,
  },
});

const micKbdStyles = StyleSheet.create({
  wrapper: {
    width:      14,
    height:     18,
    alignItems: 'center',
  },
  body: {
    width:        8,
    height:       11,
    borderRadius: 4,
    borderWidth:  1.6,
  },
  arc: {
    width:                   12,
    height:                  5,
    borderLeftWidth:         1.6,
    borderRightWidth:        1.6,
    borderBottomWidth:       1.6,
    borderBottomLeftRadius:  6,
    borderBottomRightRadius: 6,
    marginTop:               0,
  },
  stem: {
    width:  1.6,
    height: 3,
  },
  baseLine: {
    width:  8,
    height: 1.6,
  },
});
