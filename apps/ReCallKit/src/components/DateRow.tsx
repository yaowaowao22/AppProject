// ============================================================
// DateRow - 日付行コンポーネント
// 今日の曜日・日付を表示する軽量ヘッダー行
// ============================================================

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { TypeScale } from '../theme/typography';
import { Spacing } from '../theme/spacing';

const WEEKDAYS_JA = ['日', '月', '火', '水', '木', '金', '土'] as const;
const MONTHS_JA = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月',
] as const;

interface DateRowProps {
  /** 表示する日付。省略時は今日 */
  date?: Date;
  /** 右側に表示する補足テキスト */
  subtitle?: string;
}

export function DateRow({ date, subtitle }: DateRowProps) {
  const { colors } = useTheme();

  const { weekday, month, day, isToday } = useMemo(() => {
    const d = date ?? new Date();
    const today = new Date();
    const isSameDay =
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate();
    return {
      weekday: WEEKDAYS_JA[d.getDay()],
      month: MONTHS_JA[d.getMonth()],
      day: d.getDate(),
      isToday: isSameDay,
    };
  }, [date]);

  const sub = subtitle ?? (isToday ? '今日' : undefined);

  return (
    <View style={styles.row} accessibilityRole="text">
      {/* 日付グループ: "4月 7日 (火)" */}
      <View style={styles.dateGroup}>
        <Text style={[styles.monthDay, { color: colors.label }]}>
          {month} {day}日
        </Text>
        <View style={[styles.weekdayPill, { backgroundColor: colors.accent + '1A' }]}>
          <Text style={[styles.weekday, { color: colors.accent }]}>{weekday}</Text>
        </View>
      </View>

      {/* 補足テキスト */}
      {sub != null && (
        <Text style={[styles.subtitle, { color: colors.labelTertiary }]}>{sub}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xs,
  },
  dateGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
  },
  monthDay: {
    ...TypeScale.title3,
    fontWeight: '700' as const,
  },
  weekdayPill: {
    paddingHorizontal: Spacing.s,
    paddingVertical: 2,
    borderRadius: 6,
  },
  weekday: {
    ...TypeScale.footnote,
    fontWeight: '600' as const,
  },
  subtitle: {
    ...TypeScale.footnote,
  },
});
