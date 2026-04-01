import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Updates from 'expo-updates';
import { useTheme } from '../../theme/ThemeContext';
import { type ThemePreference, THEMES, THEME_CATEGORIES } from '../../theme/themes';
import { TypeScale } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';
import { getDatabase } from '../../db/connection';
import { getAllSettings, setSetting, type AppSettings } from '../../db/settingsRepository';
import { deleteAllData } from '../../db/schema';
import { exportAllDataAsJSON } from '../../services/exportService';

const APP_VERSION = '0.1.0';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

// ============================================================
// SettingsScreen
// ============================================================
export function SettingsScreen() {
  const { colors, themePreference, setThemePreference } = useTheme();
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [tempHour, setTempHour] = useState(8);
  const [tempMinute, setTempMinute] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 初期ロード
  useEffect(() => {
    (async () => {
      const db = await getDatabase();
      const s = await getAllSettings(db);
      setSettings(s);
    })();
  }, []);

  // DB 更新ヘルパー
  const saveSetting = useCallback(
    async (key: keyof AppSettings, value: string) => {
      const db = await getDatabase();
      await setSetting(db, key as Parameters<typeof setSetting>[1], value);
      setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
    },
    []
  );

  // ── 時刻ピッカー ─────────────────────────────────────────
  const openTimePicker = () => {
    if (!settings) return;
    const parts = settings.review_time.split(':');
    setTempHour(parseInt(parts[0] ?? '8', 10));
    setTempMinute(parseInt(parts[1] ?? '0', 10));
    setShowTimePicker(true);
  };

  const confirmTime = async () => {
    const hh = String(tempHour).padStart(2, '0');
    const mm = String(tempMinute).padStart(2, '0');
    await saveSetting('review_time', `${hh}:${mm}`);
    setShowTimePicker(false);
  };

  // ── ステッパー ───────────────────────────────────────────
  const adjustCount = async (delta: number) => {
    if (!settings) return;
    const current = parseInt(settings.daily_review_count, 10);
    const next = Math.min(50, Math.max(1, current + delta));
    await saveSetting('daily_review_count', String(next));
  };

  // ── テーマ切替 ───────────────────────────────────────────
  const handleTheme = async (pref: ThemePreference) => {
    await setThemePreference(pref);
    setShowThemePicker(false);
  };

  // ── 全データ削除 ─────────────────────────────────────────
  const handleDeleteAllData = () => {
    Alert.alert(
      '全データを削除',
      'すべての学習データ（アイテム・タグ・復習履歴）を削除します。この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              '本当に削除しますか？',
              'データを完全に消去します。元に戻せません。',
              [
                { text: 'キャンセル', style: 'cancel' },
                {
                  text: '完全に削除する',
                  style: 'destructive',
                  onPress: async () => {
                    setDeleting(true);
                    try {
                      const db = await getDatabase();
                      await deleteAllData(db);
                    } catch (e) {
                      Alert.alert('削除失敗', String(e));
                    } finally {
                      setDeleting(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  // ── エクスポート ─────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true);
    try {
      const db = await getDatabase();
      await exportAllDataAsJSON(db);
    } catch (e) {
      Alert.alert('エクスポート失敗', String(e));
    } finally {
      setExporting(false);
    }
  };

  // ── 現在のテーマ名を表示用に解決 ─────────────────────────
  const currentThemeName = themePreference === 'system'
    ? 'システム設定に従う'
    : (THEMES[themePreference]?.name ?? themePreference);

  // ── ローディング ─────────────────────────────────────────
  if (!settings) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.backgroundGrouped }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const minuteIndex = MINUTES.indexOf(tempMinute);
  const safeMinuteIndex = minuteIndex >= 0 ? minuteIndex : 0;

  return (
    <>
      <ScrollView
        style={[styles.scroll, { backgroundColor: colors.backgroundGrouped }]}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 復習設定 ─────────────────────────────────────── */}
        <Text style={[styles.sectionHeader, { color: colors.labelTertiary }]}>
          復習設定
        </Text>
        <View style={[styles.section, { backgroundColor: colors.card }]}>

          {/* 復習リマインド時刻 */}
          <TouchableOpacity
            style={styles.row}
            onPress={openTimePicker}
            activeOpacity={0.6}
          >
            <Text style={[styles.rowLabel, { color: colors.label }]}>
              復習リマインド時刻
            </Text>
            <View style={styles.rowRight}>
              <Text style={[styles.rowValue, { color: colors.labelSecondary }]}>
                {settings.review_time}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.labelTertiary} />
            </View>
          </TouchableOpacity>

          <View style={[styles.separator, { backgroundColor: colors.separator }]} />

          {/* 1日の復習件数 */}
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.label }]}>
              1日の復習件数
            </Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={[styles.stepBtn, { borderColor: colors.separator }]}
                onPress={() => adjustCount(-1)}
                activeOpacity={0.6}
              >
                <Ionicons name="remove" size={18} color={colors.accent} />
              </TouchableOpacity>
              <Text style={[styles.stepValue, { color: colors.label }]}>
                {settings.daily_review_count}
              </Text>
              <TouchableOpacity
                style={[styles.stepBtn, { borderColor: colors.separator }]}
                onPress={() => adjustCount(1)}
                activeOpacity={0.6}
              >
                <Ionicons name="add" size={18} color={colors.accent} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── 外観 ─────────────────────────────────────────── */}
        <Text style={[styles.sectionHeader, { color: colors.labelTertiary }]}>
          外観
        </Text>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => setShowThemePicker(true)}
            activeOpacity={0.6}
          >
            <Text style={[styles.rowLabel, { color: colors.label }]}>テーマ</Text>
            <View style={styles.rowRight}>
              <Text style={[styles.rowValue, { color: colors.labelSecondary }]}>
                {currentThemeName}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.labelTertiary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* ── データ ───────────────────────────────────────── */}
        <Text style={[styles.sectionHeader, { color: colors.labelTertiary }]}>
          データ
        </Text>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={styles.row}
            onPress={handleExport}
            activeOpacity={0.6}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator
                size="small"
                color={colors.accent}
                style={{ marginRight: Spacing.s }}
              />
            ) : (
              <Ionicons
                name="share-outline"
                size={20}
                color={colors.accent}
                style={{ marginRight: Spacing.s }}
              />
            )}
            <Text style={[styles.rowLabel, { color: colors.accent }]}>
              データをエクスポート
            </Text>
          </TouchableOpacity>
          <View style={[styles.separator, { backgroundColor: colors.separator }]} />
          <TouchableOpacity
            style={styles.row}
            onPress={handleDeleteAllData}
            activeOpacity={0.6}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator
                size="small"
                color={colors.error}
                style={{ marginRight: Spacing.s }}
              />
            ) : (
              <Ionicons
                name="trash-outline"
                size={20}
                color={colors.error}
                style={{ marginRight: Spacing.s }}
              />
            )}
            <Text style={[styles.rowLabel, { color: colors.error }]}>
              全データを削除
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── アプリ情報 ───────────────────────────────────── */}
        <Text style={[styles.sectionHeader, { color: colors.labelTertiary }]}>
          アプリ情報
        </Text>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.label }]}>バージョン</Text>
            <Text style={[styles.rowValue, { color: colors.labelSecondary }]}>
              {APP_VERSION}
            </Text>
          </View>
          <View style={[styles.separator, { backgroundColor: colors.separator }]} />
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.label }]}>OTA Update</Text>
            <Text style={[styles.rowValue, { color: colors.labelSecondary }]}>
              {Updates.isEmbeddedLaunch ? 'embedded' : Updates.updateId?.slice(0, 8) ?? '-'}
            </Text>
          </View>
          {!Updates.isEmbeddedLaunch && Updates.createdAt && (
            <>
              <View style={[styles.separator, { backgroundColor: colors.separator }]} />
              <View style={styles.row}>
                <Text style={[styles.rowLabel, { color: colors.label }]}>更新日時</Text>
                <Text style={[styles.rowValue, { color: colors.labelSecondary }]}>
                  {Updates.createdAt.toLocaleString('ja-JP')}
                </Text>
              </View>
            </>
          )}
          <View style={[styles.separator, { backgroundColor: colors.separator }]} />
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.label }]}>チャンネル</Text>
            <Text style={[styles.rowValue, { color: colors.labelSecondary }]}>
              {Updates.channel ?? '-'}
            </Text>
          </View>
          <View style={[styles.separator, { backgroundColor: colors.separator }]} />
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.label }]}>Runtime</Text>
            <Text style={[styles.rowValue, { color: colors.labelSecondary }]}>
              {Updates.runtimeVersion ?? '-'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ── 時刻ピッカー Modal ───────────────────────────── */}
      <Modal visible={showTimePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>

            {/* ヘッダー */}
            <View
              style={[styles.modalHeader, { borderBottomColor: colors.separator }]}
            >
              <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                <Text style={[styles.modalCancel, { color: colors.labelSecondary }]}>
                  キャンセル
                </Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.label }]}>
                復習リマインド時刻
              </Text>
              <TouchableOpacity onPress={confirmTime}>
                <Text style={[styles.modalDone, { color: colors.accent }]}>完了</Text>
              </TouchableOpacity>
            </View>

            {/* 時・分 ピッカー */}
            <View style={styles.pickerRow}>
              {/* 時 */}
              <FlatList
                style={styles.pickerColumn}
                data={HOURS}
                keyExtractor={(h) => String(h)}
                showsVerticalScrollIndicator={false}
                getItemLayout={(_, index) => ({
                  length: PICKER_ITEM_HEIGHT,
                  offset: PICKER_ITEM_HEIGHT * index,
                  index,
                })}
                initialScrollIndex={tempHour}
                renderItem={({ item: h }) => (
                  <TouchableOpacity
                    style={[
                      styles.pickerItem,
                      tempHour === h && { backgroundColor: colors.filterBadgeBg },
                    ]}
                    onPress={() => setTempHour(h)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        { color: tempHour === h ? colors.accent : colors.label },
                      ]}
                    >
                      {String(h).padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                )}
              />

              <Text style={[styles.pickerColon, { color: colors.label }]}>:</Text>

              {/* 分 */}
              <FlatList
                style={styles.pickerColumn}
                data={MINUTES}
                keyExtractor={(m) => String(m)}
                showsVerticalScrollIndicator={false}
                getItemLayout={(_, index) => ({
                  length: PICKER_ITEM_HEIGHT,
                  offset: PICKER_ITEM_HEIGHT * index,
                  index,
                })}
                initialScrollIndex={safeMinuteIndex}
                renderItem={({ item: m }) => (
                  <TouchableOpacity
                    style={[
                      styles.pickerItem,
                      tempMinute === m && { backgroundColor: colors.filterBadgeBg },
                    ]}
                    onPress={() => setTempMinute(m)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        { color: tempMinute === m ? colors.accent : colors.label },
                      ]}
                    >
                      {String(m).padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── テーマピッカー Modal ─────────────────────────── */}
      <Modal visible={showThemePicker} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowThemePicker(false)}>
          <Pressable style={[styles.themeSheet, { backgroundColor: colors.backgroundGrouped }]}>

            {/* ヘッダー */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.separator, backgroundColor: colors.card }]}>
              <TouchableOpacity onPress={() => setShowThemePicker(false)}>
                <Text style={[styles.modalCancel, { color: colors.labelSecondary }]}>
                  閉じる
                </Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.label }]}>
                テーマ
              </Text>
              <View style={{ minWidth: 64 }} />
            </View>

            <ScrollView
              style={styles.themeScroll}
              contentContainerStyle={styles.themeScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* システム設定に従う */}
              <Text style={[styles.themeCategoryHeader, { color: colors.labelTertiary }]}>
                自動
              </Text>
              <View style={[styles.section, { backgroundColor: colors.card }]}>
                <Pressable
                  style={styles.themeRow}
                  onPress={() => handleTheme('system')}
                >
                  <View style={[styles.themeSwatchSystem, { borderColor: colors.separator }]}>
                    <View style={[styles.themeSwatchHalf, { backgroundColor: '#FFFFFF' }]} />
                    <View style={[styles.themeSwatchHalf, { backgroundColor: '#000000' }]} />
                  </View>
                  <Text style={[styles.themeRowLabel, { color: colors.label }]}>
                    システム設定に従う
                  </Text>
                  {themePreference === 'system' && (
                    <Ionicons name="checkmark" size={20} color={colors.accent} />
                  )}
                </Pressable>
              </View>

              {/* カテゴリ別テーマ一覧 */}
              {THEME_CATEGORIES.map((cat) => (
                <React.Fragment key={cat.id}>
                  <Text style={[styles.themeCategoryHeader, { color: colors.labelTertiary }]}>
                    {cat.label}
                  </Text>
                  <View style={[styles.section, { backgroundColor: colors.card }]}>
                    {cat.ids.map((tid, i) => {
                      const entry = THEMES[tid];
                      const isSelected = themePreference === tid;
                      return (
                        <React.Fragment key={tid}>
                          {i > 0 && (
                            <View style={[styles.separator, { backgroundColor: colors.separator }]} />
                          )}
                          <Pressable
                            style={styles.themeRow}
                            onPress={() => handleTheme(tid)}
                          >
                            {/* カラースウォッチ */}
                            <View
                              style={[
                                styles.themeSwatch,
                                { backgroundColor: entry.swatchBg, borderColor: colors.separator },
                              ]}
                            >
                              <View
                                style={[
                                  styles.themeSwatchDot,
                                  { backgroundColor: entry.swatchColor },
                                ]}
                              />
                            </View>
                            <Text style={[styles.themeRowLabel, { color: colors.label }]}>
                              {entry.name}
                            </Text>
                            {isSelected && (
                              <Ionicons name="checkmark" size={20} color={colors.accent} />
                            )}
                          </Pressable>
                        </React.Fragment>
                      );
                    })}
                  </View>
                </React.Fragment>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

// ============================================================
// 定数
// ============================================================
const PICKER_ITEM_HEIGHT = 44;

// ============================================================
// スタイル
// ============================================================
const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: Spacing.m,
    paddingHorizontal: Spacing.m,
    gap: Spacing.xs,
  },

  // セクションヘッダー
  sectionHeader: {
    ...TypeScale.subheadline,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.s,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },

  // セクション枠
  section: {
    borderRadius: Radius.m,
    overflow: 'hidden',
  },

  // 行
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
  },
  rowLabel: {
    ...TypeScale.body,
    flex: 1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  rowValue: {
    ...TypeScale.body,
  },

  // セパレーター
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: Spacing.m,
  },

  // ステッパー
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.s,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    ...TypeScale.body,
    minWidth: 32,
    textAlign: 'center',
  },

  // モーダル共通
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalSheet: {
    borderTopLeftRadius: Radius.l,
    borderTopRightRadius: Radius.l,
    paddingBottom: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.m,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: Radius.l,
    borderTopRightRadius: Radius.l,
  },
  modalTitle: {
    ...TypeScale.headline,
  },
  modalCancel: {
    ...TypeScale.body,
    minWidth: 64,
  },
  modalDone: {
    ...TypeScale.headline,
    minWidth: 64,
    textAlign: 'right',
  },

  // ピッカー
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 220,
    paddingHorizontal: Spacing.l,
  },
  pickerColumn: {
    flex: 1,
    maxHeight: 220,
  },
  pickerColon: {
    ...TypeScale.title2,
    paddingHorizontal: Spacing.s,
  },
  pickerItem: {
    height: PICKER_ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.s,
    marginVertical: 2,
  },
  pickerItemText: {
    ...TypeScale.title3,
  },

  // テーマピッカー
  themeSheet: {
    borderTopLeftRadius: Radius.l,
    borderTopRightRadius: Radius.l,
    minHeight: '40%',
    maxHeight: '85%',
  },
  themeScroll: {
    flex: 1,
  },
  themeScrollContent: {
    paddingHorizontal: Spacing.m,
    paddingBottom: Spacing.xl,
    gap: Spacing.xs,
  },
  themeCategoryHeader: {
    ...TypeScale.subheadline,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.s,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    gap: Spacing.s,
  },
  themeRowLabel: {
    ...TypeScale.body,
    flex: 1,
  },
  // カラースウォッチ（丸アイコン + アクセントドット）
  themeSwatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeSwatchDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  // システム設定スウォッチ（白黒 2 分割）
  themeSwatchSystem: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  themeSwatchHalf: {
    flex: 1,
  },
});
