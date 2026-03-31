import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { TypeScale } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';
import { getDatabase } from '../../db/connection';
import { getAllSettings, setSetting, type AppSettings } from '../../db/settingsRepository';
import { exportAllDataAsJSON } from '../../services/exportService';

const APP_VERSION = '0.1.0';

type ThemePref = 'system' | 'light' | 'dark';

const THEME_OPTIONS: { value: ThemePref; label: string }[] = [
  { value: 'system', label: 'システム設定に従う' },
  { value: 'light', label: 'ライト' },
  { value: 'dark', label: 'ダーク' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

// ============================================================
// SettingsScreen
// ============================================================
export function SettingsScreen() {
  const { colors, themePreference, setThemePreference } = useTheme();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempHour, setTempHour] = useState(8);
  const [tempMinute, setTempMinute] = useState(0);
  const [exporting, setExporting] = useState(false);

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
  const handleTheme = async (pref: ThemePref) => {
    await setThemePreference(pref);
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
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.backgroundGrouped }]}
      contentContainerStyle={styles.content}
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
        {THEME_OPTIONS.map((opt, i) => (
          <React.Fragment key={opt.value}>
            {i > 0 && (
              <View style={[styles.separator, { backgroundColor: colors.separator }]} />
            )}
            <TouchableOpacity
              style={styles.row}
              onPress={() => handleTheme(opt.value)}
              activeOpacity={0.6}
            >
              <Text style={[styles.rowLabel, { color: colors.label }]}>
                {opt.label}
              </Text>
              {themePreference === opt.value && (
                <Ionicons name="checkmark" size={20} color={colors.accent} />
              )}
            </TouchableOpacity>
          </React.Fragment>
        ))}
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
      </View>

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
    </ScrollView>
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
    paddingBottom: Spacing.xxl,
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

  // モーダル
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
});
