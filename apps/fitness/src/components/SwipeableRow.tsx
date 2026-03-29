import React, { useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '../theme';
import type { TanrenThemeColors } from '../theme';
import { useTheme } from '../ThemeContext';

interface Props {
  children: React.ReactNode;
  onDelete: () => void;
}

const BUTTON_W = 72;
const { width: SCREEN_W } = Dimensions.get('window');

export function SwipeableRow({ children, onDelete }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const translateX = useRef(new Animated.Value(0)).current;
  const offsetRef  = useRef(0);

  const snap = (to: number) => {
    offsetRef.current = to;
    Animated.timing(translateX, {
      toValue: to,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 4 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2,
      onMoveShouldSetPanResponderCapture: (_, g) =>
        Math.abs(g.dx) > 15 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderMove: (_, g) => {
        const next = offsetRef.current + g.dx;
        translateX.setValue(Math.max(Math.min(next, 0), -SCREEN_W));
      },
      onPanResponderRelease: (_, g) => {
        const next = offsetRef.current + g.dx;
        if (g.vx < -0.5 || next < -BUTTON_W * 0.4) {
          snap(-BUTTON_W);
        } else {
          snap(0);
        }
      },
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => { snap(0); onDelete(); }}
        style={styles.deleteBtn}
        accessibilityRole="button"
        accessibilityLabel="削除"
      >
        <Ionicons name="trash-outline" size={20} color={colors.onAccent} />
        <Text style={styles.deleteTxt}>削除</Text>
      </TouchableOpacity>
      <Animated.View
        style={[styles.content, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

function makeStyles(c: TanrenThemeColors) {
  return StyleSheet.create({
    wrap: {
      overflow: 'hidden',
    },
    deleteBtn: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      right: 0,
      width: BUTTON_W,
      backgroundColor: c.error,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    deleteTxt: {
      fontSize: 10,
      fontWeight: TYPOGRAPHY.semiBold,
      color: c.onAccent,
      marginTop: 2,
    },
    content: {
      backgroundColor: c.background,
    },
  });
}
