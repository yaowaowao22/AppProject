// ============================================================
// ToastProvider — アプリ内トーストシステム
//
// 使い方:
//   const { showToast } = useToast();
//   showToast('保存しました', 'success');
//   showToast('取り込みに失敗しました', 'error');
//
// ⚠️ App.tsx の SafeAreaProvider 配下に配置すること（insets 取得のため）
// ============================================================

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TypeScale } from '../theme/typography';
import { Radius, Spacing } from '../theme/spacing';

// ---- 型 ----
export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

// ---- Context ----
const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}

// ---- タイプ別スタイル設定 ----
const TYPE_CONFIG: Record<
  ToastType,
  { iconName: React.ComponentProps<typeof Ionicons>['name']; bg: string }
> = {
  success: { iconName: 'checkmark-circle',  bg: '#30D158' },
  error:   { iconName: 'alert-circle',       bg: '#FF3B30' },
  info:    { iconName: 'information-circle', bg: '#0A84FF' },
  warning: { iconName: 'warning',            bg: '#FF9F0A' },
};

// ---- プロバイダー ----
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<ToastItem | null>(null);
  const queueRef      = useRef<ToastItem[]>([]);
  const showingRef    = useRef(false);
  const timerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const translateY    = useRef(new Animated.Value(80)).current;
  const opacityAnim   = useRef(new Animated.Value(0)).current;

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.parallel([
      Animated.timing(translateY,  { toValue: 80, duration: 220, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0,  duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setCurrent(null);
      showingRef.current = false;
      // 次のキューを処理
      processNext();
    });
  }, [translateY, opacityAnim]); // eslint-disable-line react-hooks/exhaustive-deps

  const processNext = useCallback(() => {
    if (queueRef.current.length === 0) return;
    const item = queueRef.current.shift()!;
    setCurrent(item);
    showingRef.current = true;

    // 入場アニメーション
    translateY.setValue(80);
    opacityAnim.setValue(0);
    Animated.parallel([
      Animated.timing(translateY,  { toValue: 0, duration: 280, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start();

    // 自動消去タイマー
    timerRef.current = setTimeout(dismiss, item.duration);
  }, [translateY, opacityAnim, dismiss]);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration = 3000) => {
      const item: ToastItem = {
        id: `${Date.now()}-${Math.random()}`,
        message,
        type,
        duration,
      };
      queueRef.current.push(item);
      if (!showingRef.current) {
        processNext();
      }
    },
    [processNext],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {current && (
        <ToastOverlay
          item={current}
          translateY={translateY}
          opacityAnim={opacityAnim}
        />
      )}
    </ToastContext.Provider>
  );
}

// ---- トーストUI（insets を取得するため分離） ----
function ToastOverlay({
  item,
  translateY,
  opacityAnim,
}: {
  item: ToastItem;
  translateY: Animated.Value;
  opacityAnim: Animated.Value;
}) {
  const insets = useSafeAreaInsets();
  const cfg = TYPE_CONFIG[item.type];

  return (
    <View
      style={[styles.overlay, { bottom: Math.max(insets.bottom, Spacing.m) + Spacing.xl }]}
      pointerEvents="box-none"
    >
      <Animated.View
        style={[
          styles.toast,
          { backgroundColor: cfg.bg },
          { transform: [{ translateY }], opacity: opacityAnim },
        ]}
        pointerEvents="none"
      >
        <Ionicons name={cfg.iconName} size={18} color="#FFFFFF" />
        <Text style={styles.message} numberOfLines={2}>
          {item.message}
        </Text>
      </Animated.View>
    </View>
  );
}

// ---- スタイル ----
const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: Spacing.m,
    right: Spacing.m,
    zIndex: 9999,
    elevation: 20,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s + 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20,
    shadowRadius: 8,
    elevation: 8,
  },
  message: {
    flex: 1,
    ...TypeScale.subheadline,
    color: '#FFFFFF',
    lineHeight: 20,
  },
});
