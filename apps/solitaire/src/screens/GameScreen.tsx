import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, ScrollView, Text } from 'react-native';
import { useTheme, H2, Body, Button } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useInterstitialAd } from '@massapp/ads';
import { useLocalStorage } from '@massapp/hooks';
import { Ionicons } from '@expo/vector-icons';
import type { GameState, Selection, GameResult, CardType } from '../types';
import {
  createNewGame,
  drawFromStock,
  moveCards,
  checkWin,
  canAutoComplete,
  autoCompleteStep,
  getSuitSymbol,
} from '../utils/solitaire';
import {
  PlayingCard,
  CARD_WIDTH,
  CARD_HEIGHT,
  CARD_OVERLAP_FACEDOWN,
  CARD_OVERLAP_FACEUP,
} from '../components/PlayingCard';

const FOUNDATION_SUITS = ['\u2660', '\u2665', '\u2666', '\u2663'];

export function GameScreen() {
  const { colors, spacing } = useTheme();
  const { trackAction } = useInterstitialAd();

  const [history, setHistory] = useLocalStorage<GameResult[]>('solitaire_history', []);

  const [gameState, setGameState] = useState<GameState>(createNewGame());
  const [selection, setSelection] = useState<Selection | null>(null);
  const [moveCount, setMoveCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isAutoCompleting, setIsAutoCompleting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gameStartedRef = useRef(false);

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning]);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startNewGame = useCallback(() => {
    if (gameStartedRef.current && !gameOver) {
      const result: GameResult = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        moves: moveCount,
        timeSeconds: elapsedSeconds,
        won: false,
      };
      setHistory([result, ...history]);
    }

    setGameState(createNewGame());
    setSelection(null);
    setMoveCount(0);
    setElapsedSeconds(0);
    setIsTimerRunning(false);
    setGameOver(false);
    setIsAutoCompleting(false);
    gameStartedRef.current = false;
  }, [gameOver, moveCount, elapsedSeconds, history, setHistory]);

  const handleWin = useCallback(
    (state: GameState) => {
      setGameOver(true);
      setIsTimerRunning(false);
      setIsAutoCompleting(false);

      const result: GameResult = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        moves: moveCount,
        timeSeconds: elapsedSeconds,
        won: true,
      };
      setHistory([result, ...history]);
      trackAction();

      Alert.alert(
        '\u304a\u3081\u3067\u3068\u3046\u3054\u3056\u3044\u307e\u3059\uff01',
        `\u30af\u30ea\u30a2\uff01\n\u624b\u6570: ${moveCount}\u56de\n\u6642\u9593: ${formatTime(elapsedSeconds)}`,
        [{ text: '\u65b0\u3057\u3044\u30b2\u30fc\u30e0', onPress: startNewGame }]
      );
    },
    [moveCount, elapsedSeconds, history, setHistory, trackAction, startNewGame]
  );

  useEffect(() => {
    if (isAutoCompleting && !gameOver) {
      const timer = setTimeout(() => {
        const nextState = autoCompleteStep(gameState);
        if (nextState) {
          setGameState(nextState);
          setMoveCount((prev) => prev + 1);
          if (checkWin(nextState)) {
            handleWin(nextState);
          }
        } else {
          setIsAutoCompleting(false);
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [gameState, isAutoCompleting, gameOver, handleWin]);

  const ensureTimerStarted = () => {
    if (!gameStartedRef.current) {
      gameStartedRef.current = true;
      setIsTimerRunning(true);
    }
  };

  const handleStockPress = () => {
    if (gameOver || isAutoCompleting) return;
    ensureTimerStarted();
    setSelection(null);
    const newState = drawFromStock(gameState);
    if (newState !== gameState) {
      setGameState(newState);
    }
  };

  const handleWastePress = () => {
    if (gameOver || isAutoCompleting) return;
    if (gameState.waste.length === 0) return;
    ensureTimerStarted();

    if (
      selection &&
      selection.source === 'waste'
    ) {
      setSelection(null);
      return;
    }

    setSelection({
      source: 'waste',
      pileIndex: 0,
      cardIndex: gameState.waste.length - 1,
    });
  };

  const handleFoundationPress = (foundationIndex: number) => {
    if (gameOver || isAutoCompleting) return;
    ensureTimerStarted();

    if (!selection) {
      const pile = gameState.foundations[foundationIndex];
      if (pile.length > 0) {
        setSelection({
          source: 'foundation',
          pileIndex: foundationIndex,
          cardIndex: pile.length - 1,
        });
      }
      return;
    }

    const result = moveCards(gameState, selection, 'foundation', foundationIndex);
    if (result) {
      setGameState(result);
      setMoveCount((prev) => prev + 1);
      setSelection(null);

      if (checkWin(result)) {
        handleWin(result);
        return;
      }

      if (canAutoComplete(result)) {
        setIsAutoCompleting(true);
      }
    } else {
      setSelection(null);
    }
  };

  const handleTableauPress = (colIndex: number, cardIndex: number) => {
    if (gameOver || isAutoCompleting) return;
    ensureTimerStarted();
    const pile = gameState.tableau[colIndex];

    if (!selection) {
      if (cardIndex < 0 || cardIndex >= pile.length) return;
      const card = pile[cardIndex];
      if (!card.faceUp) return;

      setSelection({
        source: 'tableau',
        pileIndex: colIndex,
        cardIndex,
      });
      return;
    }

    if (
      selection.source === 'tableau' &&
      selection.pileIndex === colIndex &&
      selection.cardIndex === cardIndex
    ) {
      setSelection(null);
      return;
    }

    const result = moveCards(gameState, selection, 'tableau', colIndex);
    if (result) {
      setGameState(result);
      setMoveCount((prev) => prev + 1);
      setSelection(null);

      if (canAutoComplete(result)) {
        setIsAutoCompleting(true);
      }
    } else {
      if (cardIndex >= 0 && cardIndex < pile.length && pile[cardIndex].faceUp) {
        setSelection({
          source: 'tableau',
          pileIndex: colIndex,
          cardIndex,
        });
      } else {
        setSelection(null);
      }
    }
  };

  const handleEmptyTableauPress = (colIndex: number) => {
    if (gameOver || isAutoCompleting) return;
    ensureTimerStarted();

    if (!selection) return;

    const result = moveCards(gameState, selection, 'tableau', colIndex);
    if (result) {
      setGameState(result);
      setMoveCount((prev) => prev + 1);
      setSelection(null);

      if (canAutoComplete(result)) {
        setIsAutoCompleting(true);
      }
    } else {
      setSelection(null);
    }
  };

  const isCardSelected = (
    source: 'tableau' | 'waste' | 'foundation',
    pileIndex: number,
    cardIndex: number
  ): boolean => {
    if (!selection) return false;
    if (selection.source !== source) return false;
    if (selection.source === 'tableau') {
      return selection.pileIndex === pileIndex && cardIndex >= selection.cardIndex;
    }
    return selection.pileIndex === pileIndex && selection.cardIndex === cardIndex;
  };

  const renderFoundations = () => (
    <View style={[styles.foundationRow, { gap: 4 }]}>
      {gameState.foundations.map((pile, index) => (
        <TouchableOpacity
          key={`foundation-${index}`}
          onPress={() => handleFoundationPress(index)}
          activeOpacity={0.7}
        >
          {pile.length > 0 ? (
            <PlayingCard
              card={pile[pile.length - 1]}
              selected={isCardSelected('foundation', index, pile.length - 1)}
            />
          ) : (
            <PlayingCard
              empty
              isFoundation
              foundationSuit={FOUNDATION_SUITS[index]}
            />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderStockAndWaste = () => (
    <View style={[styles.stockWasteRow, { gap: 4 }]}>
      <TouchableOpacity onPress={handleStockPress} activeOpacity={0.7}>
        {gameState.stock.length > 0 ? (
          <PlayingCard card={{ suit: 'spades', rank: 'A', faceUp: false, id: 'stock-back' }} />
        ) : (
          <View
            style={[
              styles.recycleButton,
              {
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                borderColor: colors.border,
                borderRadius: 4,
              },
            ]}
          >
            <Ionicons name="refresh" size={20} color={colors.textMuted} />
          </View>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={handleWastePress} activeOpacity={0.7}>
        {gameState.waste.length > 0 ? (
          <PlayingCard
            card={gameState.waste[gameState.waste.length - 1]}
            selected={isCardSelected('waste', 0, gameState.waste.length - 1)}
          />
        ) : (
          <PlayingCard empty />
        )}
      </TouchableOpacity>
      <View style={{ flex: 1 }} />
    </View>
  );

  const renderTableau = () => {
    const maxPileLength = Math.max(1, ...gameState.tableau.map((p) => p.length));
    const maxHeight =
      CARD_HEIGHT +
      Math.max(0, maxPileLength - 1) *
        Math.max(CARD_OVERLAP_FACEDOWN, CARD_OVERLAP_FACEUP);

    return (
      <View style={[styles.tableauRow, { gap: 4 }]}>
        {gameState.tableau.map((pile, colIndex) => (
          <View
            key={`col-${colIndex}`}
            style={[styles.tableauColumn, { height: maxHeight }]}
          >
            {pile.length === 0 ? (
              <TouchableOpacity
                onPress={() => handleEmptyTableauPress(colIndex)}
                activeOpacity={0.7}
              >
                <PlayingCard empty />
              </TouchableOpacity>
            ) : (
              pile.map((card, cardIndex) => {
                const offset = pile
                  .slice(0, cardIndex)
                  .reduce(
                    (acc, c) =>
                      acc + (c.faceUp ? CARD_OVERLAP_FACEUP : CARD_OVERLAP_FACEDOWN),
                    0
                  );
                return (
                  <TouchableOpacity
                    key={card.id}
                    style={[styles.tableauCard, { top: offset }]}
                    onPress={() => handleTableauPress(colIndex, cardIndex)}
                    activeOpacity={0.7}
                  >
                    <PlayingCard
                      card={card}
                      selected={isCardSelected('tableau', colIndex, cardIndex)}
                    />
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.xs }]}>
        <View
          style={[
            styles.header,
            {
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
              marginBottom: spacing.xs,
            },
          ]}
        >
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="swap-horizontal" size={14} color={colors.textSecondary} />
              <Text style={[styles.statText, { color: colors.text }]}>
                {moveCount}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.statText, { color: colors.text }]}>
                {formatTime(elapsedSeconds)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                if (gameStartedRef.current) {
                  Alert.alert(
                    '\u65b0\u3057\u3044\u30b2\u30fc\u30e0',
                    '\u73fe\u5728\u306e\u30b2\u30fc\u30e0\u3092\u7d42\u4e86\u3057\u3066\u65b0\u3057\u3044\u30b2\u30fc\u30e0\u3092\u59cb\u3081\u307e\u3059\u304b\uff1f',
                    [
                      { text: '\u30ad\u30e3\u30f3\u30bb\u30eb', style: 'cancel' },
                      { text: '\u306f\u3044', onPress: startNewGame },
                    ]
                  );
                } else {
                  startNewGame();
                }
              }}
              style={[
                styles.newGameButton,
                { backgroundColor: colors.primary, borderRadius: 4 },
              ]}
            >
              <Ionicons name="add" size={14} color="#FFFFFF" />
              <Text style={styles.newGameText}>{'\u65b0\u898f'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.topRow, { marginBottom: spacing.xs }]}>
          {renderStockAndWaste()}
          <View style={{ width: spacing.sm }} />
          {renderFoundations()}
        </View>

        <ScrollView
          style={styles.tableauContainer}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {renderTableau()}
        </ScrollView>

        {isAutoCompleting && (
          <View style={[styles.autoCompleteOverlay]}>
            <Text style={[styles.autoCompleteText, { color: colors.primary }]}>
              {'\u81ea\u52d5\u5b8c\u4e86\u4e2d...'}
            </Text>
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
  },
  newGameButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 2,
  },
  newGameText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  foundationRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  stockWasteRow: {
    flexDirection: 'row',
  },
  recycleButton: {
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableauContainer: {
    flex: 1,
  },
  tableauRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  tableauColumn: {
    width: CARD_WIDTH,
    position: 'relative',
  },
  tableauCard: {
    position: 'absolute',
    left: 0,
  },
  autoCompleteOverlay: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  autoCompleteText: {
    fontSize: 16,
    fontWeight: '700',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
});
