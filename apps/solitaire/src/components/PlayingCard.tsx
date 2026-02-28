import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '@massapp/ui';
import type { CardType } from '../types';
import { getSuitSymbol, isRedSuit } from '../utils/solitaire';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
export const CARD_WIDTH = Math.floor((SCREEN_WIDTH - 48) / 7 - 4);
export const CARD_HEIGHT = Math.floor(CARD_WIDTH * 1.45);
export const CARD_OVERLAP_FACEDOWN = Math.floor(CARD_HEIGHT * 0.18);
export const CARD_OVERLAP_FACEUP = Math.floor(CARD_HEIGHT * 0.28);

interface PlayingCardProps {
  card?: CardType;
  selected?: boolean;
  empty?: boolean;
  isFoundation?: boolean;
  foundationSuit?: string;
}

export function PlayingCard({
  card,
  selected = false,
  empty = false,
  isFoundation = false,
  foundationSuit,
}: PlayingCardProps) {
  const { colors, spacing } = useTheme();

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
        ) : null}
      </View>
    );
  }

  if (!card) return <View style={[styles.card, { backgroundColor: 'transparent' }]} />;

  if (!card.faceUp) {
    return (
      <View
        style={[
          styles.card,
          styles.cardBack,
          {
            backgroundColor: colors.primary,
            borderColor: selected ? colors.warning : colors.primaryLight,
            borderWidth: selected ? 2 : 1,
          },
        ]}
      >
        <View style={[styles.backPattern, { borderColor: colors.primaryLight }]} />
      </View>
    );
  }

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
  cardBack: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  backPattern: {
    width: CARD_WIDTH - 8,
    height: CARD_HEIGHT - 8,
    borderRadius: 2,
    borderWidth: 1,
  },
  rankTop: {
    position: 'absolute',
    top: 2,
    left: 3,
    fontSize: Math.max(8, CARD_WIDTH * 0.22),
    fontWeight: '700',
    lineHeight: Math.max(10, CARD_WIDTH * 0.26),
  },
  suitCenter: {
    fontSize: Math.max(14, CARD_WIDTH * 0.4),
    lineHeight: Math.max(18, CARD_WIDTH * 0.48),
  },
  rankBottom: {
    position: 'absolute',
    bottom: 2,
    right: 3,
    fontSize: Math.max(8, CARD_WIDTH * 0.22),
    fontWeight: '700',
    lineHeight: Math.max(10, CARD_WIDTH * 0.26),
    transform: [{ rotate: '180deg' }],
  },
  emptySymbol: {
    fontSize: Math.max(16, CARD_WIDTH * 0.4),
    opacity: 0.3,
  },
});
