import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RADIUS, SPACING, TYPOGRAPHY } from '../theme';
import type { TanrenThemeColors } from '../theme';
import { useTheme } from '../ThemeContext';

interface Props {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  maxHeight?: number | `${number}%`;
  children: React.ReactNode;
}

export function BottomSheet({ visible, onClose, title, subtitle, maxHeight, children }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const translateY = useRef(new Animated.Value(600)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(false);
  const styles = makeStyles(colors);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 600,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => setMounted(false));
    }
  }, [visible]);

  if (!mounted && !visible) return null;

  return (
    <Modal
      transparent
      visible={mounted}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={StyleSheet.absoluteFill}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* overlay */}
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        </Animated.View>

        {/* sheet */}
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + 8, transform: [{ translateY }] },
            maxHeight !== undefined && { maxHeight },
          ]}
        >
          <View style={styles.grip} />
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Row helper ──────────────────────────────────────────────────────────────

interface SheetRowProps {
  label: string;
  detail?: string;
  value?: string;
  badge?: boolean;
  isLast?: boolean;
  onPress?: () => void;
}

export function SheetRow({ label, detail, value, badge, isLast, onPress }: SheetRowProps) {
  const { colors } = useTheme();
  const s = makeSheetRowStyles(colors);

  const inner = (
    <>
      <View style={s.left}>
        <Text style={s.name}>{label}</Text>
        {!!detail && <Text style={s.detail}>{detail}</Text>}
      </View>
      <View style={s.right}>
        {badge && <View style={s.prBadge}><Text style={s.prText}>PR</Text></View>}
        {!!value && <Text style={s.val}>{value}</Text>}
        {!!onPress && <Text style={s.chevron}>›</Text>}
      </View>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={[s.row, isLast && s.last]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {inner}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[s.row, isLast && s.last]}>
      {inner}
    </View>
  );
}

// ── Spark bar chart helper ───────────────────────────────────────────────────

interface SparkBar { label: string; value: number; isCurrent?: boolean }

export function SparkBars({ bars }: { bars: SparkBar[] }) {
  const { colors } = useTheme();
  const sparkStyles = makeSparkStyles(colors);
  const maxVal = Math.max(...bars.map(b => b.value), 1);
  return (
    <View style={sparkStyles.wrap}>
      <View style={sparkStyles.bars}>
        {bars.map((b, i) => {
          const h = Math.max((b.value / maxVal) * 44, b.value > 0 ? 6 : 3);
          return (
            <View key={i} style={sparkStyles.col}>
              <View
                style={[
                  sparkStyles.fill,
                  { height: h },
                  b.isCurrent ? sparkStyles.fillCurrent : sparkStyles.fillPrev,
                ]}
              />
              <Text style={[sparkStyles.lbl, b.isCurrent && sparkStyles.lblCurrent]}>
                {b.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(colors: TanrenThemeColors) {
  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.65)',
    },
    sheet: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.surface1,
      borderTopLeftRadius: RADIUS.sheet,
      borderTopRightRadius: RADIUS.sheet,
      maxHeight: '76%',
    },
    grip: {
      width: 36,
      height: 4,
      backgroundColor: colors.surface2,
      borderRadius: 2,
      alignSelf: 'center',
      marginTop: 10,
    },
    header: {
      paddingHorizontal: SPACING.contentMargin,
      paddingTop: 14,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.separator,
    },
    title: {
      fontSize: 17,
      fontWeight: TYPOGRAPHY.bold,
      color: colors.textPrimary,
      letterSpacing: -0.3,
    },
    subtitle: {
      fontSize: TYPOGRAPHY.caption,
      color: colors.textTertiary,
      marginTop: 3,
    },
    body: {
      flexShrink: 1,
    },
    bodyContent: {
      paddingHorizontal: SPACING.contentMargin,
      paddingBottom: 8,
    },
  });
}

function makeSheetRowStyles(colors: TanrenThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.separator,
      minHeight: 44,
    },
    last: {
      borderBottomWidth: 0,
    },
    left: {
      flex: 1,
      gap: 2,
    },
    name: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontWeight: TYPOGRAPHY.semiBold,
      color: colors.textPrimary,
    },
    detail: {
      fontSize: 11,
      color: colors.textTertiary,
    },
    right: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    val: {
      fontSize: TYPOGRAPHY.bodySmall,
      fontWeight: TYPOGRAPHY.bold,
      color: colors.textPrimary,
      fontVariant: ['tabular-nums'],
    },
    prBadge: {
      backgroundColor: colors.accentDim,
      borderRadius: RADIUS.badge,
      paddingHorizontal: 5,
      paddingVertical: 2,
    },
    prText: {
      fontSize: 9,
      fontWeight: TYPOGRAPHY.heavy,
      color: colors.accent,
      letterSpacing: 0.3,
    },
    chevron: {
      fontSize: 20,
      color: colors.textTertiary,
      marginLeft: 4,
    },
  });
}

function makeSparkStyles(colors: TanrenThemeColors) {
  return StyleSheet.create({
    wrap: {
      paddingTop: 14,
      paddingBottom: 4,
    },
    bars: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 4,
      height: 60,
    },
    col: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-end',
      height: '100%',
    },
    fill: {
      width: '100%',
      borderTopLeftRadius: 3,
      borderTopRightRadius: 3,
    },
    fillPrev: {
      backgroundColor: colors.surface2,
    },
    fillCurrent: {
      backgroundColor: colors.accent,
    },
    lbl: {
      fontSize: 8,
      color: colors.textTertiary,
      marginTop: 4,
      fontVariant: ['tabular-nums'],
    },
    lblCurrent: {
      color: colors.textPrimary,
      fontWeight: TYPOGRAPHY.semiBold,
    },
  });
}
