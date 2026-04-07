// ============================================================
// DateRow - 日付行コンポーネント
// 青丸（日付数字）+ 曜日ラベル + due件数サブテキスト
// ============================================================

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GoogleCalendarColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

const BLUE = GoogleCalendarColors.blue;

const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

interface DateRowProps {
  /** 表示する日付。省略時は今日 */
  date?: Date;
  /** 今日の復習件数 */
  dueCount: number;
}

export function DateRow({ date, dueCount }: DateRowProps) {
  const { colors } = useTheme();
  const { weekday, day } = useMemo(() => {
    const d = date ?? new Date();
    return {
      weekday: WEEKDAYS_EN[d.getDay()],
      day: d.getDate(),
    };
  }, [date]);

  const subtitle =
    dueCount > 0 ? `${dueCount}件の復習が待っています` : '今日';

  return (
    <View style={styles.row} accessibilityRole="text">
      {/* 青丸 + 日付数字 */}
      <View style={styles.circle}>
        <Text style={styles.dayNumber}>{day}</Text>
      </View>

      {/* 曜日 + サブテキスト */}
      <View style={styles.textGroup}>
        <Text style={styles.weekday}>{weekday.toUpperCase()}</Text>
        <Text style={[styles.subtitle, { color: colors.labelSecondary }]}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 20,
    gap: 14,
  },
  circle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dayNumber: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '500' as const,
    lineHeight: 24,
  },
  textGroup: {
    gap: 2,
  },
  weekday: {
    color: BLUE,
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 18,
    marginTop: 1,
  },
});
