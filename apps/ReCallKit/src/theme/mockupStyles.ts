// ============================================================
// ReCallKit モックアップ CSS → React Native スタイル変換
// ソース:
//   prompts/home-mockup.html  (Google Calendar UI プロトタイプ)
//   sample.html               (iOS UI Mock)
//   prompts/widget-mockup.html (Flashcard Peek Widget)
//   sidebar.html              (Drawer / Sidebar)
//
// 対応画面:
//   共通 / ナビゲーション / タブバー / カード / ボタン / 入力
//   Home / Library / Review / Quiz / URL Analysis / QA Preview
//   Journal / Settings / Knowledge Map / Widget (S/M/L)
//
// CSS → RN 変換メモ:
//   lineHeight は絶対値 (fontSize × 係数) に変換
//   border-radius: 50% → borderRadius: 9999
//   position absolute; inset:0 → top:0, right:0, bottom:0, left:0
//   CSS gradient → LinearGradient コメントで注記
//   backdrop-filter → BlurView コメントで注記
//   cursor / pointer-events / transition は RN 非対応につき省略
//   gap は RN 0.71+ で対応済み (StyleSheet.create 内で使用可)
// ============================================================

import { StyleSheet } from 'react-native';

// ─── Design Tokens ───────────────────────────────────────────
// home-mockup.html :root — Google Calendar パレット
export const GCalTokens = {
  bg:      '#FFFFFF',
  text1:   '#202124',
  text2:   '#5F6368',
  text3:   '#9AA0A6',
  accent:  '#E8A000',
  blue:    '#1A73E8',
  green:   '#1E8E3E',
  red:     '#D93025',
  orange:  '#F29900',
  border:  '#DADCE0',
  tint:    '#F8F9FA',
  surface: '#FFFFFF',
  pillBlueBg:  '#E8F0FE',
  pillGreenBg: '#E6F4EA',
  pillRedBg:   '#FCE8E6',
  pillAmberBg: '#FEF7E0',
} as const;

// sample.html :root — iOS システムパレット (ライト)
export const IOSTokens = {
  bgPrimary:    '#FFFFFF',
  bgSecondary:  '#F2F2F7',
  bgCard:       '#FFFFFF',
  textPrimary:  '#000000',
  textSecondary:'rgba(60,60,67,0.6)',
  textTertiary: 'rgba(60,60,67,0.3)',
  separator:    'rgba(60,60,67,0.12)',
  accent:       '#E8A000',
  accentLight:  'rgba(232,160,0,0.12)',
  systemGreen:  '#30D158',
  systemRed:    '#FF3B30',
  systemOrange: '#FF9F0A',
  systemBlue:   '#0A84FF',
  systemGray5:  'rgba(142,142,147,0.12)',
  navBg:        'rgba(249,249,249,0.94)',
  navBorder:    'rgba(60,60,67,0.12)',
  tabBg:        'rgba(249,249,249,0.94)',
  tabBorder:    'rgba(60,60,67,0.12)',
  searchBg:     'rgba(142,142,147,0.12)',
  switchBg:     '#E9E9EA',
  againBg:      'rgba(255,59,48,0.15)',
  hardBg:       'rgba(255,159,10,0.15)',
  goodBg:       'rgba(48,209,88,0.15)',
  easyBg:       'rgba(10,132,255,0.15)',
} as const;

// sample.html [data-theme="dark"]
export const IOSTokensDark = {
  bgPrimary:    '#000000',
  bgSecondary:  '#1C1C1E',
  bgCard:       '#1C1C1E',
  textPrimary:  '#FFFFFF',
  textSecondary:'rgba(235,235,245,0.6)',
  textTertiary: 'rgba(235,235,245,0.3)',
  separator:    'rgba(84,84,88,0.65)',
  accent:       '#F5A623',
  accentLight:  'rgba(245,166,35,0.15)',
  systemGreen:  '#30D158',
  systemRed:    '#FF453A',
  systemOrange: '#FF9F0A',
  systemBlue:   '#0A84FF',
  systemGray5:  'rgba(142,142,147,0.24)',
  navBg:        'rgba(30,30,30,0.94)',
  navBorder:    'rgba(84,84,88,0.65)',
  tabBg:        'rgba(30,30,30,0.94)',
  tabBorder:    'rgba(84,84,88,0.65)',
  searchBg:     'rgba(118,118,128,0.24)',
  switchBg:     '#39393D',
  againBg:      'rgba(255,69,58,0.2)',
  hardBg:       'rgba(255,159,10,0.2)',
  goodBg:       'rgba(48,209,88,0.2)',
  easyBg:       'rgba(10,132,255,0.2)',
} as const;

// Rating ボタンカラー参照 (sample.html)
export const RatingColors = {
  again: { bg: 'rgba(255,59,48,0.15)',  text: '#FF3B30' },
  hard:  { bg: 'rgba(255,159,10,0.15)', text: '#FF9F0A' },
  good:  { bg: 'rgba(48,209,88,0.15)',  text: '#30D158' },
  easy:  { bg: 'rgba(10,132,255,0.15)', text: '#0A84FF' },
} as const;

// Pill カラー参照 (home-mockup.html)
export const PillColors = {
  blue:  { bg: '#E8F0FE', text: '#1A73E8' },
  green: { bg: '#E6F4EA', text: '#1E8E3E' },
  red:   { bg: '#FCE8E6', text: '#D93025' },
  amber: { bg: '#FEF7E0', text: '#B06000' },
  gray:  { bg: '#F8F9FA', text: '#5F6368' },
} as const;

// ─── 1. 共通 / Shared Components ─────────────────────────────

// home-mockup.html ナビゲーションバー (.hdr) — Google Calendar スタイル
export const navBarGCal = StyleSheet.create({
  // .hdr
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 16,
    backgroundColor: '#FFFFFF',
    zIndex: 50,
  },
  // .hdr-title
  title: {
    fontSize: 22,
    fontWeight: '400',
    flex: 1,
  },
  // .hdr-back / .hdr-menu
  actionBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  actionBtnPressed: {
    backgroundColor: '#F8F9FA',
  },
});

// sample.html ナビゲーションバー (.nav-bar) — iOS Large Title スタイル
export const navBarIOS = StyleSheet.create({
  // .nav-bar
  container: {
    position: 'absolute',
    top: 54, // status bar height
    left: 0,
    right: 0,
    zIndex: 100,
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(249,249,249,0.94)',
    // backdrop-filter: blur(20px) → BlurView でラップ推奨
  },
  // .nav-title
  title: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.4,
    lineHeight: 37, // 34 × 1.1
  },
  // .nav-row
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // .nav-icon
  icon: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    fontSize: 22,
  },
});

// sample.html タブバー (.tab-bar)
export const tabBar = StyleSheet.create({
  // .tab-bar
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 83,
    backgroundColor: 'rgba(249,249,249,0.94)',
    // backdrop-filter: blur(20px) → BlurView 推奨
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(60,60,67,0.12)',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    paddingTop: 6,
    zIndex: 200,
  },
  // .tab-item
  item: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    minWidth: 60,
  },
  // .tab-icon
  icon: {
    fontSize: 22,
    height: 28,
    lineHeight: 28,
  },
  // .tab-label
  label: {
    fontSize: 10,
    fontWeight: '500',
  },
  // home indicator (bottom safe area)
  homeIndicator: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    width: 134,
    height: 5,
    borderRadius: 3,
    opacity: 0.2,
  },
});

// 共通カード / ボタン / 入力 / リスト / 空状態
export const shared = StyleSheet.create({
  // sample.html .card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  // sample.html .section-header
  sectionHeader: {
    fontSize: 15,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 24,
  },
  // sample.html .tag-chip
  tagChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    fontSize: 12,
    fontWeight: '500',
  },
  tagChipActive: {
    color: '#FFFFFF',
  },
  // sample.html .progress-bar
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    borderRadius: 4,
  },
  // sample.html .btn-primary (iOS スタイル)
  btnPrimary: {
    width: '100%' as any,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // home-mockup.html .btn (Google Calendar スタイル)
  btnGCal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  btnGCalText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  btnGCalLg: {
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  btnGCalLgText: {
    fontSize: 15,
  },
  btnGCalOutline: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  btnGCalDanger: {
    borderWidth: 1,
    borderColor: '#D93025',
    backgroundColor: 'transparent',
  },
  btnGCalDangerText: {
    color: '#D93025',
  },
  // home-mockup.html .pill
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  // home-mockup.html .label-upper
  labelUpper: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  // home-mockup.html .sep
  separator: {
    height: 1,
    marginHorizontal: 16,
  },
  // home-mockup.html .section-gap
  sectionGap: {
    height: 8,
  },
  // home-mockup.html .input-group
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
  },
  inputGroupText: {
    flex: 1,
    fontSize: 15,
    borderWidth: 0,
  },
  // home-mockup.html textarea.input-area
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    lineHeight: 24, // 15 × 1.6
  },
  // home-mockup.html .list-item
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  listItemLast: {
    borderBottomWidth: 0,
  },
  // .list-icon
  listIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
  },
  listTitle: {
    fontSize: 14,
  },
  listSub: {
    fontSize: 12,
    marginTop: 2,
  },
  // home-mockup.html .empty
  emptyState: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 16,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    lineHeight: 20, // 13 × 1.5
    textAlign: 'center',
  },
  // sample.html .segmented-control
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segBtnText: {
    fontSize: 13,
    fontWeight: '500',
  },
  segBtnActive: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  // sample.html .ios-toggle
  iosToggle: {
    width: 51,
    height: 31,
    borderRadius: 16,
  },
  iosToggleKnob: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  // home-mockup.html .card-border
  cardBorder: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
});

// ─── 2. Drawer / Sidebar ──────────────────────────────────────
// home-mockup.html .drawer / sidebar.html
export const drawer = StyleSheet.create({
  // .drawer-overlay
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 200,
  },
  // .drawer
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 280,
    height: '100%' as any,
    backgroundColor: '#FFFFFF',
    zIndex: 201,
    overflow: 'hidden',
    borderRightWidth: 1,
    borderRightColor: '#DADCE0',
  },
  // .drawer-header
  header: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#DADCE0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '500',
  },
  headerSub: {
    fontSize: 12,
    marginTop: 4,
  },
  // .drawer-nav
  nav: {
    paddingVertical: 8,
  },
  // .drawer-item
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
    paddingLeft: 20,
    paddingRight: 20,
    marginRight: 12,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
  },
  itemText: {
    fontSize: 14,
    flex: 1,
  },
  itemActive: {
    backgroundColor: '#E8F0FE',
  },
  itemActiveText: {
    color: '#1A73E8',
    fontWeight: '500',
  },
  // .drawer-item svg
  itemIcon: {
    width: 20,
    height: 20,
  },
  // .drawer-section
  sectionLabel: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    borderTopWidth: 1,
    borderTopColor: '#DADCE0',
    marginTop: 8,
  },
  // .drawer-tag
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  tagText: {
    fontSize: 13,
  },
  // .drawer-tag-dot
  tagDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  // .drawer-tag-count
  tagCount: {
    marginLeft: 'auto' as any,
    fontSize: 11,
  },
});

// ─── 3. Home Screen ───────────────────────────────────────────
// home-mockup.html home specifics + sample.html today screen
export const home = StyleSheet.create({
  // ── Google Calendar スタイル ──
  // .today
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 4,
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 14,
  },
  // .today-circle
  dateCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#1A73E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCircleText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  dateWeekday: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1A73E8',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  dateSub: {
    fontSize: 14,
    marginTop: 1,
  },
  // .review-illust
  // LinearGradient(160deg, '#FFF8E1', '#FFECB3' 40%, '#FFE082') を使用
  reviewIllust: {
    height: 140,
    overflow: 'hidden',
    position: 'relative',
  },
  // .review-body
  reviewBody: {
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '400',
  },
  reviewTitleStrong: {
    fontWeight: '500',
  },
  reviewMeta: {
    fontSize: 13,
    marginVertical: 2,
  },
  overdue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#D93025',
  },
  // .stats
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  statVal: {
    fontSize: 22,
    fontWeight: '500',
  },
  statLbl: {
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    position: 'absolute',
    left: 0,
    top: 4,
    bottom: 4,
    width: 1,
  },
  // .week
  weekSection: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  weekGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  weekDay: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  weekDayLabel: {
    fontSize: 11,
  },
  weekDayLabelToday: {
    color: '#1A73E8',
    fontWeight: '500',
  },
  // .wdot
  weekDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDotDone:     { backgroundColor: '#E8F0FE' },
  weekDotStrong:   { backgroundColor: '#1A73E8' },
  weekDotTodayRing: { borderWidth: 2, borderColor: '#1A73E8' },
  weekDotIcon:     { width: 14, height: 14 },
  // .week-sum
  weekSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#DADCE0',
    fontSize: 13,
  },
  weekSummaryText: {
    fontSize: 13,
  },
  weekSummaryStrong: {
    fontWeight: '500',
  },
  // .recent
  recentSection: {
    paddingTop: 20,
    paddingLeft: 16,
  },
  recentScroll: {
    flexDirection: 'row',
    gap: 10,
  },
  // .rcard
  recentCard: {
    width: 220,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DADCE0',
    borderRadius: 12,
  },
  recentCardLast: {
    marginRight: 16,
  },
  // .rcard-cat
  recentCardCat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  recentCardCatText: {
    fontSize: 11,
    fontWeight: '500',
  },
  recentCardDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  recentCardQuestion: {
    fontSize: 14,
    lineHeight: 21, // 14 × 1.5
  },
  recentCardTime: {
    fontSize: 11,
    marginTop: 10,
  },
  // .mastery
  masterySection: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  masteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F8F9FA',
  },
  masteryRowFirst: {
    borderTopWidth: 0,
  },
  masteryName: {
    flex: 1,
    fontSize: 14,
  },
  masteryBarTrack: {
    width: 80,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: '#F8F9FA',
  },
  masteryBarFill: {
    height: 4,
    borderRadius: 2,
  },
  masteryPct: {
    fontSize: 13,
    minWidth: 32,
    textAlign: 'right',
    fontWeight: '500',
  },
  // .shortcuts
  shortcutsSection: {
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  shortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  shortcutLast: {
    borderBottomWidth: 0,
  },
  shortcutIcon: {
    width: 20,
    height: 20,
  },
  shortcutText: {
    fontSize: 14,
  },
  shortcutSub: {
    fontSize: 12,
  },

  // ── iOS スタイル (sample.html) ──
  // #today .streak-card
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  streakRingWrap: {
    width: 80,
    height: 80,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakRingText: {
    position: 'absolute',
    fontSize: 20,
    fontWeight: '700',
  },
  streakLabel: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 29, // 22 × 1.3
  },
  streakSub: {
    fontSize: 15,
    marginTop: 4,
  },
  // #today .review-list
  reviewList: {
    gap: 8,
    marginTop: 8,
  },
  // #today .review-item
  reviewItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  reviewItemStatusIcon: {
    fontSize: 18,
    width: 22,
    textAlign: 'center',
    marginTop: 1,
  },
  reviewItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24, // 16 × 1.5
  },
  reviewItemTitleDone: {
    textDecorationLine: 'line-through',
  },
  reviewItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  reviewItemMetaText: {
    fontSize: 13,
  },
  reviewItemMetaTag: {
    fontWeight: '500',
  },
});

// ─── 4. Library Screen ────────────────────────────────────────
export const library = StyleSheet.create({
  // home-mockup.html .lib-filters
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  // .filter-chip
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DADCE0',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  filterChipActive: {
    backgroundColor: '#1A73E8',
    borderColor: '#1A73E8',
  },
  filterChipActiveText: {
    color: '#FFFFFF',
  },
  // home-mockup.html .lib-card
  libCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  libCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  libCardTitle: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 21, // 15 × 1.4
  },
  libCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  libCardMetaText: {
    fontSize: 12,
  },
  // sample.html #library .search-bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(142,142,147,0.12)',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  searchIcon: {
    fontSize: 16,
  },
  // sample.html #library .lib-card
  libCardIOS: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  libCardIcon: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
  },
  libCardTitleIOS: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24, // 16 × 1.5
  },
  libCardSub: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  libCardSubText: {
    fontSize: 13,
  },
  libCardSubTag: {
    fontWeight: '500',
  },
  libCardNext: {
    fontSize: 12,
    marginTop: 4,
  },
  dateSection: {
    marginTop: 16,
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
});

// ─── 5. Review Screen ─────────────────────────────────────────
export const review = StyleSheet.create({
  // home-mockup.html .progress-bar-wrap
  progressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: '#DADCE0',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1A73E8',
  },
  progressCount: {
    fontSize: 13,
    minWidth: 40,
    textAlign: 'right',
  },
  // home-mockup.html .flip-container
  flipContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  // .flip-card
  flipCard: {
    width: '100%' as any,
    maxWidth: 360,
    height: 300,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DADCE0',
    backgroundColor: '#FFFFFF',
    paddingVertical: 28,
    paddingHorizontal: 24,
  },
  flipLabel: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  flipText: {
    fontSize: 16,
    lineHeight: 26, // 16 × 1.6
    flex: 1,
  },
  flipHint: {
    textAlign: 'center',
    fontSize: 12,
    paddingTop: 12,
  },
  flipSep: {
    height: 1,
    marginVertical: 14,
  },
  // home-mockup.html .rating-area / .rate-btn (Google Calendar)
  ratingArea: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  rateBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#DADCE0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  rateDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  rateLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  rateSub: {
    fontSize: 10,
  },
  // home-mockup.html .review-complete
  completeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  completeEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  completeTitle: {
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 8,
  },
  completeCount: {
    fontSize: 14,
    marginBottom: 24,
  },
  completeStatsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  completeStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  completeStatText: {
    fontSize: 13,
  },

  // sample.html #review (iOS スタイル)
  // .review-header
  reviewHeaderIOS: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 58,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  // .close-btn
  closeBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    fontSize: 18,
  },
  counter: {
    fontSize: 15,
    fontWeight: '500',
  },
  // .review-progress (iOS: height 3)
  reviewProgressIOS: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  reviewProgressFillIOS: {
    height: 3,
    borderRadius: 2,
  },
  // .flashcard-area
  flashcardArea: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 420,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  // .flashcard
  flashcard: {
    width: '100%' as any,
    maxWidth: 340,
    minHeight: 320,
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  flashcardFrontTitle: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 33, // 22 × 1.5
    marginBottom: 12,
    textAlign: 'center',
  },
  flashcardFrontTag: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 24,
    textAlign: 'center',
  },
  flashcardFrontHint: {
    fontSize: 13,
    textAlign: 'center',
  },
  flashcardBackTitle: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28, // 20 × 1.4
    marginBottom: 12,
  },
  flashcardBackDivider: {
    height: 1,
    marginBottom: 12,
  },
  flashcardBackBody: {
    fontSize: 16,
    lineHeight: 27, // 16 × 1.7
    marginBottom: 16,
  },
  flashcardBackLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flashcardBackLinkText: {
    fontSize: 15,
    color: '#0A84FF',
  },
  // sample.html .rating-buttons (iOS)
  ratingButtonsIOS: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 34,
  },
  ratingBtnIOS: {
    flex: 1,
    borderRadius: 12,
    paddingTop: 12,
    paddingHorizontal: 4,
    paddingBottom: 10,
    alignItems: 'center',
    gap: 3,
  },
  ratingBtnLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  ratingBtnInterval: {
    fontSize: 11,
    opacity: 0.7,
  },
  ratingBtnAgain: { backgroundColor: 'rgba(255,59,48,0.15)' },
  ratingBtnHard:  { backgroundColor: 'rgba(255,159,10,0.15)' },
  ratingBtnGood:  { backgroundColor: 'rgba(48,209,88,0.15)' },
  ratingBtnEasy:  { backgroundColor: 'rgba(10,132,255,0.15)' },
});

// ─── 6. Quiz Screen ───────────────────────────────────────────
// sample.html #quiz
export const quiz = StyleSheet.create({
  header: {
    paddingTop: 58,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  content: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  instruction: {
    fontSize: 15,
    lineHeight: 24, // 15 × 1.6
    marginBottom: 20,
  },
  // .quiz-card
  questionCard: {
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  questionText: {
    fontSize: 17,
    lineHeight: 31, // 17 × 1.8
  },
  // .quiz-blank
  blank: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderBottomWidth: 2,
    borderRadius: 4,
    minWidth: 80,
    fontWeight: '600',
  },
  blankRevealed: {
    // color → accent, backgroundColor → accentLight
  },
  // .quiz-input-wrap / .quiz-input
  inputWrap: {
    marginBottom: 16,
  },
  input: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderRadius: 12,
    fontSize: 17,
  },
  // .quiz-feedback
  feedback: {
    textAlign: 'center',
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    fontSize: 17,
    fontWeight: '600',
  },
  feedbackCorrect: {
    backgroundColor: 'rgba(48,209,88,0.12)',
  },
  feedbackCorrectText: {
    color: '#30D158',
  },
  feedbackIncorrect: {
    backgroundColor: 'rgba(255,59,48,0.12)',
  },
  feedbackIncorrectText: {
    color: '#FF3B30',
  },
  answerInfo: {
    fontSize: 14,
    marginTop: 8,
  },
});

// ─── 7. URL Analysis / Import Screen ─────────────────────────
// home-mockup.html .url-screen-body / .job-card
export const urlAnalysis = StyleSheet.create({
  body: {
    flex: 1,
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  desc: {
    fontSize: 13,
    lineHeight: 21, // 13 × 1.6
    marginTop: 12,
  },
  bottom: {
    padding: 16,
  },
  // .job-card (URL Import List)
  jobCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  jobUrl: {
    fontSize: 12,
  },
  jobActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
});

// ─── 8. QA Preview Screen ────────────────────────────────────
// home-mockup.html .qa-mode-toggle / .qa-item
export const qaPreview = StyleSheet.create({
  modeToggle: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  modeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DADCE0',
    backgroundColor: 'transparent',
  },
  modeBtnText: {
    fontSize: 13,
  },
  modeBtnActive: {
    backgroundColor: '#1A73E8',
    borderColor: '#1A73E8',
  },
  modeBtnActiveText: {
    color: '#FFFFFF',
  },
  cardView: {
    paddingHorizontal: 16,
  },
  qaItem: {
    borderWidth: 1,
    borderColor: '#DADCE0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  qaQuestion: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  qaAnswer: {
    fontSize: 13,
    lineHeight: 21, // 13 × 1.6
  },
  qaBottom: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#DADCE0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});

// ─── 9. Journal Screen ────────────────────────────────────────
// sample.html #journal
export const journal = StyleSheet.create({
  list: {
    gap: 20,
  },
  dateGroup: {
    marginTop: 16,
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  // .journal-entry  (border-left accent line)
  entry: {
    borderLeftWidth: 3,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  entryTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  entryNote: {
    fontSize: 16,
    lineHeight: 27, // 16 × 1.7
  },
  entryTime: {
    fontSize: 12,
    marginTop: 6,
  },
});

// ─── 10. Settings Screen ─────────────────────────────────────
// sample.html #settings
export const settings = StyleSheet.create({
  inner: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  group: {
    marginTop: 24,
  },
  groupLabel: {
    fontSize: 13,
    fontWeight: '400',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  // .settings-list
  list: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  // .settings-item
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
    borderTopWidth: 0.5,
  },
  itemFirst: {
    borderTopWidth: 0,
  },
  itemText: {
    fontSize: 17,
  },
  // .s-value
  itemValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemValueText: {
    fontSize: 17,
  },
  itemChevron: {
    fontSize: 14,
  },
  footer: {
    textAlign: 'center',
    marginTop: 32,
    fontSize: 13,
    lineHeight: 23, // 13 × 1.8
  },
});

// ─── 11. Knowledge Map Screen ─────────────────────────────────
// sample.html #map
export const knowledgeMap = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  footer: {
    textAlign: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 13,
  },
  footerLink: {
    fontWeight: '500',
  },
});

// ─── 12. Widget (Flashcard Peek) ─────────────────────────────
// prompts/widget-mockup.html
export const widget = StyleSheet.create({
  // コンテナ (角丸 22, overflow hidden)
  containerSm: {
    width: 170,
    height: 170,
    borderRadius: 22,
    overflow: 'hidden',
  },
  containerMd: {
    width: 364,
    height: 170,
    borderRadius: 22,
    overflow: 'hidden',
  },
  containerLg: {
    width: 364,
    height: 382,
    borderRadius: 22,
    overflow: 'hidden',
  },
  // ── Small Widget ──
  // .ps — Light
  smallContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  // .ps-dk — Dark: LinearGradient(145deg, '#1A1A2E', '#16213E')
  smallQuestion: {
    fontSize: 13,
    lineHeight: 20, // 13 × 1.55
    color: '#202124',
  },
  smallQuestionDark: {
    color: 'rgba(255,255,255,0.9)',
  },
  smallSep: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 10,
  },
  smallSepDark: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  smallAnswer: {
    fontSize: 11,
    color: '#9AA0A6',
    lineHeight: 17, // 11 × 1.5
    flex: 1,
  },
  smallAnswerDark: {
    color: 'rgba(255,255,255,0.4)',
  },
  // ── Medium Widget ──
  // .pm — Light
  mediumContainer: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },
  mediumQuestion: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 23, // 15 × 1.5
    color: '#202124',
  },
  mediumSep: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 10,
  },
  mediumAnswer: {
    fontSize: 13,
    color: '#9AA0A6',
    lineHeight: 21, // 13 × 1.6
    flex: 1,
  },
  // ── Large Widget ──
  // .pl — Light
  largeContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  largeList: {
    flex: 1,
    overflow: 'hidden',
  },
  largeItem: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  largeItemLast: {
    borderBottomWidth: 0,
  },
  largeItemQuestion: {
    fontSize: 14,
    fontWeight: '500',
    color: '#202124',
    lineHeight: 20, // 14 × 1.4
  },
  largeItemAnswer: {
    fontSize: 12,
    color: '#9AA0A6',
    lineHeight: 18, // 12 × 1.5
    marginTop: 4,
  },
  // .pl-fade — LinearGradient(transparent → '#FFF') でオーバーレイ
  largeFadeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },
});
