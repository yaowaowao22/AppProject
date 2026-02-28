import React from 'react';
import { View, StyleSheet, FlatList, Text } from 'react-native';
import { useTheme, H2, EmptyState, ListItem, Divider, Badge } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import type { GameResult } from '../types';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  const h = date.getHours().toString().padStart(2, '0');
  const min = date.getMinutes().toString().padStart(2, '0');
  return `${y}/${m}/${d} ${h}:${min}`;
}

export function HistoryScreen() {
  const { colors, spacing } = useTheme();
  const [history] = useLocalStorage<GameResult[]>('solitaire_history', []);

  const renderItem = ({ item }: { item: GameResult }) => (
    <View>
      <ListItem
        title={item.won ? '\u52dd\u5229' : '\u4e2d\u65ad'}
        subtitle={`${formatDate(item.date)}  |  ${item.moves}\u624b  |  ${formatTime(item.timeSeconds)}`}
        leftIcon={
          <Text style={{ fontSize: 20 }}>{item.won ? '\u{1F3C6}' : '\u{1F4CB}'}</Text>
        }
        rightIcon={
          <Badge
            label={item.won ? '\u30af\u30ea\u30a2' : '\u672a\u30af\u30ea\u30a2'}
            color={item.won ? colors.success : colors.textMuted}
            variant={item.won ? 'filled' : 'outline'}
          />
        }
      />
      <Divider />
    </View>
  );

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.lg }]}>
        <H2 style={{ marginBottom: spacing.lg }}>{'\u30d7\u30ec\u30a4\u8a18\u9332'}</H2>
        {history.length === 0 ? (
          <EmptyState
            icon={'\u{1F3C6}'}
            title={'\u307e\u3060\u8a18\u9332\u304c\u3042\u308a\u307e\u305b\u3093'}
            subtitle={'\u30b2\u30fc\u30e0\u3092\u30d7\u30ec\u30a4\u3057\u3066\u8a18\u9332\u3092\u6b8b\u3057\u307e\u3057\u3087\u3046'}
          />
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
