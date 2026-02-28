import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useTheme, H2, Body, Caption, ListItem, Divider, EmptyState, Badge, Button } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useLocalStorage } from '@massapp/hooks';
import type { GameResult } from '../types';

function formatDate(isoString: string): string {
  const d = new Date(isoString);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

function getModeLabel(mode: string): string {
  switch (mode) {
    case 'classic':
      return 'クラシック';
    case 'hard':
      return 'ハード';
    case 'timeattack':
      return 'タイムアタック';
    default:
      return mode;
  }
}

function getModeIcon(mode: string): string {
  switch (mode) {
    case 'classic':
      return '🎯';
    case 'hard':
      return '🔥';
    case 'timeattack':
      return '⏱️';
    default:
      return '🎮';
  }
}

export function HistoryScreen() {
  const { colors, spacing } = useTheme();
  const [results, setResults, loading] = useLocalStorage<GameResult[]>('number_guessing_history', []);

  const handleClear = () => {
    setResults([]);
  };

  const renderItem = ({ item }: { item: GameResult }) => {
    const modeLabel = getModeLabel(item.mode);
    const modeIcon = getModeIcon(item.mode);

    if (item.mode === 'timeattack') {
      return (
        <ListItem
          title={`${modeIcon} ${modeLabel} - ${item.timeAttackScore ?? 0}問正解`}
          subtitle={formatDate(item.date)}
          rightContent={
            <View style={styles.rightContent}>
              <Body
                color={colors.primary}
                style={{ fontWeight: 'bold', fontSize: 18 }}
              >
                {item.timeAttackScore ?? 0}問
              </Body>
              <Caption color={colors.textMuted}>60秒</Caption>
            </View>
          }
        />
      );
    }

    return (
      <ListItem
        title={`${modeIcon} ${modeLabel} - 答え: ${item.target}`}
        subtitle={formatDate(item.date)}
        rightContent={
          <View style={styles.rightContent}>
            <Body
              color={colors.primary}
              style={{ fontWeight: 'bold', fontSize: 18 }}
            >
              {item.guessCount}回
            </Body>
            <Caption color={colors.textMuted}>
              1~{item.rangeMax}
            </Caption>
          </View>
        }
      />
    );
  };

  const renderHeader = () => {
    if (results.length === 0) return null;

    const classicResults = results.filter((r) => r.mode === 'classic' && r.won);
    const hardResults = results.filter((r) => r.mode === 'hard' && r.won);
    const timeAttackResults = results.filter((r) => r.mode === 'timeattack');

    const bestClassic =
      classicResults.length > 0
        ? Math.min(...classicResults.map((r) => r.guessCount))
        : null;
    const bestHard =
      hardResults.length > 0
        ? Math.min(...hardResults.map((r) => r.guessCount))
        : null;
    const bestTimeAttack =
      timeAttackResults.length > 0
        ? Math.max(...timeAttackResults.map((r) => r.timeAttackScore ?? 0))
        : null;

    return (
      <View style={{ padding: spacing.lg, paddingBottom: spacing.sm }}>
        <View style={[styles.headerRow, { marginBottom: spacing.md }]}>
          <H2>ゲーム記録</H2>
          <Button title="全消去" onPress={handleClear} variant="ghost" size="sm" />
        </View>
        <View style={[styles.badgeRow, { marginBottom: spacing.sm }]}>
          <Badge label={`全${results.length}回`} />
          {bestClassic !== null && (
            <Badge label={`クラシック最少 ${bestClassic}回`} />
          )}
          {bestHard !== null && (
            <Badge label={`ハード最少 ${bestHard}回`} />
          )}
          {bestTimeAttack !== null && (
            <Badge label={`TA最高 ${bestTimeAttack}問`} />
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={[styles.emptyContainer, { padding: spacing.lg }]}>
          <Body color={colors.textSecondary} style={{ textAlign: 'center' }}>
            読み込み中...
          </Body>
        </View>
      </ScreenWrapper>
    );
  }

  if (results.length === 0) {
    return (
      <ScreenWrapper>
        <View style={[styles.emptyContainer, { padding: spacing.lg }]}>
          <EmptyState
            icon="🎯"
            title="まだ記録がありません"
            subtitle="ゲームをプレイして記録を残しましょう"
          />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ItemSeparatorComponent={() => <Divider />}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
