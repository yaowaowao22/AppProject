import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUIVariant, UIVariant } from '../UIVariantContext';

// ── バリアントメタ情報 ─────────────────────────────────────────────────────────
const VARIANTS: { id: UIVariant; name: string; desc: string }[] = [
  { id: 'original',  name: 'オリジナル',      desc: 'デフォルトのシンプルUI' },
  { id: 'premium',   name: 'プレミアム',       desc: 'グラスモーフィズム・ダーク' },
  { id: 'minimal',   name: 'ミニマル',         desc: 'クリーンリスト・ライト' },
  { id: 'analytics', name: 'アナリティクス',   desc: 'データ分析重視・ダーク' },
];

// ── ミニプレビューサムネイル ────────────────────────────────────────────────────
function VariantThumbnail({ id }: { id: UIVariant }) {
  if (id === 'original') {
    return (
      <View style={[thumb.wrapper, { backgroundColor: '#F5F5F5' }]}>
        {/* ヘッダー */}
        <View style={[thumb.bar, { width: '55%', backgroundColor: '#333', marginBottom: 5 }]} />
        {/* カードブロック */}
        <View style={[thumb.card, { backgroundColor: '#4DB6AC', borderRadius: 4 }]}>
          <View style={[thumb.barThin, { backgroundColor: 'rgba(255,255,255,0.7)', width: '60%' }]} />
          <View style={[thumb.barThin, { backgroundColor: 'rgba(255,255,255,0.5)', width: '40%', marginTop: 3 }]} />
        </View>
        {/* リスト行 */}
        {[0, 1, 2].map((i) => (
          <View key={i} style={[thumb.listRow, { borderLeftColor: ['#E57373', '#64B5F6', '#81C784'][i] }]}>
            <View style={[thumb.dot, { backgroundColor: ['#E57373', '#64B5F6', '#81C784'][i] }]} />
            <View style={[thumb.barShort, { flex: 1, backgroundColor: '#CCC' }]} />
          </View>
        ))}
      </View>
    );
  }

  if (id === 'premium') {
    return (
      <View style={[thumb.wrapper, { backgroundColor: '#0D0F1E' }]}>
        {/* グラスヒーローカード */}
        <View style={[thumb.card, {
          backgroundColor: 'rgba(255,255,255,0.08)',
          borderWidth: 0.5,
          borderColor: 'rgba(255,255,255,0.15)',
          borderRadius: 5,
        }]}>
          <View style={[thumb.barThin, { backgroundColor: 'rgba(255,255,255,0.4)', width: '40%' }]} />
          <View style={[thumb.bar, { backgroundColor: '#FFFFFF', width: '70%', marginTop: 3 }]} />
          {/* リングチャート風 */}
          <View style={[thumb.ring, { borderColor: '#6B7FFF' }]}>
            <View style={[thumb.ringInner, { borderColor: '#A855F7' }]} />
          </View>
        </View>
        {/* グラスリスト行 */}
        {[0, 1].map((i) => (
          <View key={i} style={[thumb.glassRow, { borderColor: 'rgba(255,255,255,0.08)' }]}>
            <View style={[thumb.dot, { backgroundColor: ['#FF4D8D', '#5B9BFF'][i] }]} />
            <View style={[thumb.barShort, { flex: 1, backgroundColor: 'rgba(255,255,255,0.25)' }]} />
          </View>
        ))}
      </View>
    );
  }

  if (id === 'minimal') {
    return (
      <View style={[thumb.wrapper, { backgroundColor: '#FAFAFA' }]}>
        {/* サマリーバー */}
        <View style={[thumb.summaryBar, { backgroundColor: '#FFF' }]}>
          <View style={[thumb.barShort, { backgroundColor: '#1A1A1A', width: '35%' }]} />
          <View style={[thumb.barShort, { backgroundColor: '#FF6B35', width: '25%' }]} />
        </View>
        {/* タグフィルター */}
        <View style={thumb.tagRow}>
          {['#FF6B35', '#E8E8E8', '#E8E8E8'].map((bg, i) => (
            <View key={i} style={[thumb.tag, { backgroundColor: bg }]} />
          ))}
        </View>
        {/* リスト行 */}
        {[0, 1, 2].map((i) => (
          <View key={i} style={thumb.cleanRow}>
            <View style={[thumb.iconCircle, { backgroundColor: ['#FF4D8D22', '#64B5F622', '#81C78422'][i] }]}>
              <View style={[thumb.dot, { backgroundColor: ['#FF4D8D', '#64B5F6', '#81C784'][i], width: 5, height: 5 }]} />
            </View>
            <View style={[thumb.barShort, { flex: 1, backgroundColor: '#DDD' }]} />
            <View style={[thumb.barShort, { width: 20, backgroundColor: '#999' }]} />
          </View>
        ))}
      </View>
    );
  }

  // analytics
  return (
    <View style={[thumb.wrapper, { backgroundColor: '#0D1117' }]}>
      {/* KPIヘッダー */}
      <View style={thumb.kpiRow}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[thumb.kpiBox, { backgroundColor: '#161B22' }]}>
            <View style={[thumb.barThin, { backgroundColor: '#26C6DA', width: '70%' }]} />
            <View style={[thumb.barThin, { backgroundColor: '#8B949E', width: '50%', marginTop: 2 }]} />
          </View>
        ))}
      </View>
      {/* 横棒グラフ */}
      {[0.8, 0.5, 0.3].map((w, i) => (
        <View key={i} style={thumb.chartRow}>
          <View style={[thumb.barThin, { backgroundColor: '#30363D', flex: 1 }]}>
            <View style={[thumb.chartBar, { width: `${w * 100}%`, backgroundColor: ['#26C6DA', '#4DB6AC', '#4CAF50'][i] }]} />
          </View>
        </View>
      ))}
      {/* グリッドカード */}
      <View style={thumb.gridRow}>
        {[0, 1].map((i) => (
          <View key={i} style={[thumb.gridCard, { backgroundColor: '#161B22', borderColor: '#21262D' }]}>
            <View style={[thumb.barThin, { backgroundColor: '#E6EDF3', width: '80%' }]} />
            <View style={[thumb.barThin, { backgroundColor: '#8B949E', width: '50%', marginTop: 2 }]} />
          </View>
        ))}
      </View>
    </View>
  );
}

// ── メインコンポーネント ───────────────────────────────────────────────────────
export function VariantSwitcher() {
  const { variant, setVariant } = useUIVariant();
  const [visible, setVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const openSheet = () => {
    setVisible(true);
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 90,
        friction: 12,
      }),
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeSheet = (callback?: () => void) => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 400,
        useNativeDriver: true,
        tension: 90,
        friction: 12,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      callback?.();
    });
  };

  const handleSelect = (v: UIVariant) => {
    closeSheet(() => setVariant(v));
  };

  return (
    <>
      {/* ── フローティングボタン ── */}
      <TouchableOpacity
        style={[styles.floatingBtn, { top: insets.top + 10 }]}
        onPress={openSheet}
        activeOpacity={0.8}
      >
        <Text style={styles.switcherIcon}>✦</Text>
      </TouchableOpacity>

      {/* ── ボトムシートモーダル ── */}
      <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
        {/* 背景タップで閉じる */}
        <TouchableWithoutFeedback onPress={() => closeSheet()}>
          <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]} />
        </TouchableWithoutFeedback>

        {/* シート本体 */}
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + 20, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* ハンドルバー */}
          <View style={styles.handle} />

          {/* タイトル */}
          <Text style={styles.sheetTitle}>UIスタイルを選択</Text>

          {/* バリアントカード横スクロール */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardRow}
          >
            {VARIANTS.map((v) => {
              const isActive = variant === v.id;
              return (
                <TouchableOpacity
                  key={v.id}
                  style={[styles.variantCard, isActive && styles.variantCardActive]}
                  onPress={() => handleSelect(v.id)}
                  activeOpacity={0.85}
                >
                  {/* チェックマーク */}
                  {isActive && (
                    <View style={styles.checkBadge}>
                      <Ionicons name="checkmark" size={11} color="#fff" />
                    </View>
                  )}

                  {/* サムネイル */}
                  <VariantThumbnail id={v.id} />

                  {/* バリアント名・説明 */}
                  <Text style={[styles.variantName, isActive && styles.variantNameActive]}>
                    {v.name}
                  </Text>
                  <Text style={styles.variantDesc}>{v.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>
      </Modal>
    </>
  );
}

// ── サムネイル用スタイル定数 ──────────────────────────────────────────────────
const thumb = StyleSheet.create({
  wrapper: {
    width: 100,
    height: 120,
    borderRadius: 8,
    padding: 7,
    overflow: 'hidden',
  },
  bar: {
    height: 7,
    borderRadius: 3,
  },
  barThin: {
    height: 4,
    borderRadius: 2,
  },
  barShort: {
    height: 4,
    borderRadius: 2,
  },
  card: {
    padding: 5,
    borderRadius: 4,
    marginBottom: 4,
    marginTop: 4,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    paddingLeft: 4,
    borderLeftWidth: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  glassRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    padding: 4,
    borderRadius: 4,
    borderWidth: 0.5,
  },
  ring: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 4,
    alignSelf: 'flex-end',
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 3,
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 4,
    borderRadius: 4,
    marginBottom: 4,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 4,
  },
  tag: {
    width: 18,
    height: 8,
    borderRadius: 4,
  },
  cleanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  iconCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 5,
  },
  kpiBox: {
    flex: 1,
    padding: 3,
    borderRadius: 3,
  },
  chartRow: {
    marginBottom: 3,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  chartBar: {
    height: '100%',
    borderRadius: 3,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 4,
  },
  gridCard: {
    flex: 1,
    padding: 4,
    borderRadius: 3,
    borderWidth: 0.5,
  },
});

// ── メインスタイル ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  floatingBtn: {
    position: 'absolute',
    right: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  switcherIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 18,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  cardRow: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12,
  },
  variantCard: {
    alignItems: 'center',
    borderRadius: 12,
    padding: 10,
    backgroundColor: '#2C2C2E',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  variantCardActive: {
    borderColor: '#4DB6AC',
    backgroundColor: '#1A2E2C',
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#4DB6AC',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  variantName: {
    color: '#E5E5EA',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  variantNameActive: {
    color: '#4DB6AC',
  },
  variantDesc: {
    color: '#8E8E93',
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
    maxWidth: 100,
  },
});
