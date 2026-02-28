import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '@massapp/ui';
import type { CardType } from '../types';
import { getSuitSymbol, isRedSuit } from '../utils/freecell';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
export const CARD_WIDTH = Math.floor((SCREEN_WIDTH - 56) / 8 - 4);
export const CARD_HEIGHT = Math.floor(CARD_WIDTH * 1.45);
export const CARD_OVERLAP = Math.floor(CARD_HEIGHT * 0.28);

interface PlayingCardProps {
  card?: CardType;
  selected?: boolean;
  empty?: boolean;
  isFoundation?: boolean;
  foundationSuit?: string;
  isFreeCell?: boolean;
}

export function PlayingCard({
  card,
  selected = false,
  empty = false,
  isFoundation = false,
  isFreeCell = false,
  foundationSuit,
}: PlayingCardProps) {
  const { colors } = useTheme();

  if (empty) {
    return (
      <View
        style={[
          styles.card,
          {
            borderColor: colors.border,
            borderWidth: 1,
            borderStyle: 'dashed',
            backgroundColor: 'transparent',
          },
        ]}
      >
        {isFoundation && foundationSuit ? (
          <Text style={[styles.emptySymbol, { color: colors.textMuted }]}>
            {foundationSuit}
          </Text>
        ) : isFreeCell ? (
          <Text style={[styles.emptySymbol, { color: colors.textMuted }]}>
            FC
          </Text>
        ) : null}
      </View>
    );
  }

  if (!card) return <View style={[styles.card, { backgroundColor: 'transparent' }]} />;

  const suitSymbol = getSuitSymbol(card.suit);
  const isRed = isRedSuit(card.suit);
  const textColor = isRed ? '#CC0000' : '#1A1A1A';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: '#FFFFFF',
          borderColor: selected ? colors.warning : '#CCCCCC',
          borderWidth: selected ? 2 : 1,
        },
        selected && {
          shadowColor: colors.warning,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 4,
          elevation: 6,
        },
      ]}
    >
      <Text style={[styles.rankTop, { color: textColor }]}>
        {card.rank}
      </Text>
      <Text style={[styles.suitCenter, { color: textColor }]}>
        {suitSymbol}
      </Text>
      <Text style={[styles.rankBottom, { color: textColor }]}>
        {card.rank}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  rankTop: {
    position: 'absolute',
    top: 1,
    left: 2,
    fontSize: Math.max(7, CARD_WIDTH * 0.2),
    fontWeight: '700',
    lineHeight: Math.max(9, CARD_WIDTH * 0.24),
  },
  suitCenter: {
    fontSize: Math.max(12, CARD_WIDTH * 0.35),
    lineHeight: Math.max(16, CARD_WIDTH * 0.42),
  },
  rankBottom: {
    position: 'absolute',
    bottom: 1,
    right: 2,
    fontSize: Math.max(7, CARD_WIDTH * 0.2),
    fontWeight: '700',
    lineHeight: Math.max(9, CARD_WIDTH * 0.24),
    transform: [{ rotate: '180deg' }],
  },
  emptySymbol: {
    fontSize: Math.max(10, CARD_WIDTH * 0.28),
    opacity: 0.3,
  },
});
