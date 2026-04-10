import { useState, useCallback } from 'react';
import { Dimensions } from 'react-native';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import type { AnimatedStyle, SharedValue } from 'react-native-reanimated';
import { Gesture } from 'react-native-gesture-handler';
import type { GestureType } from 'react-native-gesture-handler';
import { easing } from '../theme/tokens';

// ══════════════════════════════════════════════
// 無音の演算 — useSidebar
// HTML mock: .sidebar width:72%, transition:.35s ease-out
//            .overlay.open background:rgba(0,0,0,0.6)
//            .swipe-z width:18px (left edge open zone)
// ══════════════════════════════════════════════

const SCREEN_WIDTH = Dimensions.get('window').width;

/** サイドバー幅: 画面幅の 72%（HTML モック .sidebar width:72% 準拠） */
export const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.72;

/** 左端スワイプゾーン幅（HTML モック .swipe-z width:18px 準拠） */
const EDGE_WIDTH = 18;

/** tokens.easing.easeOut を Reanimated Easing に変換 */
const EASE_OUT = Easing.bezier(
  easing.easeOut[0],
  easing.easeOut[1],
  easing.easeOut[2],
  easing.easeOut[3],
);

/** HTML モック .sidebar transition:.35s */
const TIMING_CONFIG = { duration: 350, easing: EASE_OUT } as const;

/** リリース時のスプリング設定（バウンス感 = HTML の spring easing 相当） */
const SPRING_CONFIG = { damping: 20, stiffness: 200, mass: 0.8 } as const;

export interface SidebarHook {
  /** JS スレッド側の開閉状態（条件レンダリング用） */
  isOpen: boolean;
  /** サイドバーの translateX（閉=-SIDEBAR_WIDTH, 開=0） */
  translateX: SharedValue<number>;
  /** オーバーレイの透明度（閉=0, 開=0.6） */
  overlayOpacity: SharedValue<number>;
  open: () => void;
  close: () => void;
  toggle: () => void;
  /** GestureDetector に渡すパンジェスチャー */
  panGesture: GestureType;
  /** Animated.View の style に渡すサイドバー変換スタイル */
  sidebarStyle: AnimatedStyle;
  /** オーバーレイの opacity + pointerEvents スタイル */
  overlayStyle: AnimatedStyle;
}

export function useSidebar(): SidebarHook {
  // ── JS スレッド状態 ──────────────────────────────
  const [isOpen, setIsOpen] = useState(false);

  // ── SharedValue（UI スレッド） ────────────────────
  const translateX      = useSharedValue(-SIDEBAR_WIDTH);
  const overlayOpacity  = useSharedValue(0);
  /** UI スレッドで isOpen を参照するための SharedValue */
  const isOpenShared    = useSharedValue(false);
  /** ジェスチャー開始時の translateX を保存 */
  const savedX          = useSharedValue(-SIDEBAR_WIDTH);
  /** ジェスチャー開始時の X 座標（エッジ判定用） */
  const startX          = useSharedValue(0);

  // ── JS スレッドアクション ─────────────────────────
  const open = useCallback(() => {
    translateX.value     = withTiming(0, TIMING_CONFIG);
    overlayOpacity.value = withTiming(0.6, TIMING_CONFIG);
    isOpenShared.value   = true;
    setIsOpen(true);
  }, [translateX, overlayOpacity, isOpenShared]);

  const close = useCallback(() => {
    translateX.value     = withTiming(-SIDEBAR_WIDTH, TIMING_CONFIG);
    overlayOpacity.value = withTiming(0, TIMING_CONFIG);
    isOpenShared.value   = false;
    setIsOpen(false);
  }, [translateX, overlayOpacity, isOpenShared]);

  const toggle = useCallback(() => {
    if (isOpenShared.value) {
      close();
    } else {
      open();
    }
  }, [isOpenShared, open, close]);

  // ── パンジェスチャー ──────────────────────────────
  const panGesture = Gesture.Pan()
    .onStart((e) => {
      'worklet';
      startX.value = e.x;
      savedX.value = translateX.value;
    })
    .onUpdate((e) => {
      'worklet';
      const fromEdge   = startX.value <= EDGE_WIDTH;
      const sidebarOpen = isOpenShared.value;

      // 閉じている時: 左端 18px からの右スワイプのみ受付
      // 開いている時: どこでも左スワイプを受付
      if (!sidebarOpen && !fromEdge) return;

      const nextX = savedX.value + e.translationX;
      translateX.value     = Math.max(-SIDEBAR_WIDTH, Math.min(0, nextX));
      // translateX に連動して opacity をリアルタイム更新
      overlayOpacity.value = 0.6 * (1 + translateX.value / SIDEBAR_WIDTH);
    })
    .onEnd(() => {
      'worklet';
      const fromEdge    = startX.value <= EDGE_WIDTH;
      const sidebarOpen = isOpenShared.value;

      if (!sidebarOpen && !fromEdge) return;

      // 閾値: -SIDEBAR_WIDTH/2 を超えていれば open、未満なら close
      if (translateX.value > -SIDEBAR_WIDTH / 2) {
        translateX.value     = withSpring(0, SPRING_CONFIG);
        overlayOpacity.value = withSpring(0.6, SPRING_CONFIG);
        isOpenShared.value   = true;
        runOnJS(setIsOpen)(true);
      } else {
        translateX.value     = withSpring(-SIDEBAR_WIDTH, SPRING_CONFIG);
        overlayOpacity.value = withSpring(0, SPRING_CONFIG);
        isOpenShared.value   = false;
        runOnJS(setIsOpen)(false);
      }
    }) as unknown as GestureType;

  // ── アニメーションスタイル ────────────────────────
  const sidebarStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    // RN 0.76 以降: style 上の pointerEvents が有効
    // opacity=0 の時はタッチ貫通、opacity>0 の時は遮蔽
    pointerEvents: overlayOpacity.value > 0 ? 'auto' : 'none',
  }));

  return {
    isOpen,
    translateX,
    overlayOpacity,
    open,
    close,
    toggle,
    panGesture,
    sidebarStyle,
    overlayStyle,
  };
}
