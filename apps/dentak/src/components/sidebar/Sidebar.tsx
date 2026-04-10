import React, { useState, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Animated from 'react-native-reanimated';
import type { AnimatedStyle } from 'react-native-reanimated';
import { GestureDetector } from 'react-native-gesture-handler';
import type { GestureType } from 'react-native-gesture-handler';
import { colors, fontFamily } from '../../theme/tokens';
import { SIDEBAR_WIDTH } from '../../hooks/useSidebar';
import MemoryPane from './MemoryPane';
import ConstantsPane from './ConstantsPane';
import BasePane from './BasePane';
import HistoryPane from './HistoryPane';

// ══════════════════════════════════════════════
// 無音の演算 — Sidebar
// HTML mock: .sidebar width:72%, .overlay rgba(0,0,0,0.6)
// DESIGN.md §8: PanGestureHandler + Animated.View translateX
// ══════════════════════════════════════════════

type Tab = 'mem' | 'const' | 'base' | 'hist';

export interface SidebarProps {
  /** JS スレッド側の開閉状態（条件レンダリング用） */
  isOpen: boolean;
  /** 閉じるコールバック */
  onClose: () => void;
  /** useSidebar().sidebarStyle — translateX アニメーション */
  sidebarStyle: AnimatedStyle;
  /** useSidebar().overlayStyle — opacity + pointerEvents アニメーション */
  overlayStyle: AnimatedStyle;
  /** useSidebar().panGesture — GestureDetector に渡すパンジェスチャー */
  panGesture: GestureType;
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'mem',   label: 'Memory'  },
  { id: 'const', label: 'Consts'  },
  { id: 'base',  label: 'Base'    },
  { id: 'hist',  label: 'History' },
];

const Sidebar = memo<SidebarProps>(
  ({ isOpen, onClose, sidebarStyle, overlayStyle, panGesture }) => {
    const [activeTab, setActiveTab] = useState<Tab>('mem');

    return (
      <>
        {/* ── オーバーレイ: 外タップで閉じる ────────────────── */}
        <Animated.View
          style={[StyleSheet.absoluteFillObject, styles.overlay, overlayStyle]}
          pointerEvents={isOpen ? 'auto' : 'none'}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            onPress={onClose}
            activeOpacity={1}
          />
        </Animated.View>

        {/* ── サイドバーパネル ──────────────────────────────── */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.sidebar, sidebarStyle]}>
            {/* ドラッグハンドル */}
            <View style={styles.dragHandle} />

            {/* ヘッダー */}
            <View style={styles.header}>
              <Text style={styles.titleText}>Advanced</Text>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                activeOpacity={0.7}
                accessibilityLabel="サイドバーを閉じる"
              >
                <Text style={styles.closeIcon}>×</Text>
              </TouchableOpacity>
            </View>

            {/* タブバー */}
            <View style={styles.tabBar}>
              {TABS.map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.tab,
                    activeTab === tab.id && styles.tabActive,
                  ]}
                  onPress={() => setActiveTab(tab.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === tab.id && styles.tabTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ペイン内容 */}
            <ScrollView
              style={styles.scroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {activeTab === 'mem'   && <MemoryPane />}
              {activeTab === 'const' && <ConstantsPane />}
              {activeTab === 'base'  && <BasePane />}
              {activeTab === 'hist'  && <HistoryPane onClose={onClose} />}
            </ScrollView>
          </Animated.View>
        </GestureDetector>
      </>
    );
  },
);

Sidebar.displayName = 'Sidebar';

export default Sidebar;

const styles = StyleSheet.create({
  overlay: {
    zIndex: 30,
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: colors.white,
    zIndex: 40,
    flexDirection: 'column',
  },
  dragHandle: {
    width: 32,
    height: 3,
    backgroundColor: colors.g1,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    flexShrink: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.g1,
    flexShrink: 0,
  },
  titleText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.black,
    letterSpacing: -0.2,
    fontFamily: fontFamily.ui,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.g0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 16,
    color: colors.g2,
    fontFamily: fontFamily.ui,
    lineHeight: 20,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.g1,
    flexShrink: 0,
  },
  tab: {
    flex: 1,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.black,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.g2,
    fontFamily: fontFamily.ui,
  },
  tabTextActive: {
    color: colors.black,
  },
  scroll: {
    flex: 1,
  },
});
