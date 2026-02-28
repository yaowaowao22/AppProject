import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, ScrollView, Text } from 'react-native';
import { useTheme } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useInterstitialAd, useRewardedAd } from '@massapp/ads';
import { useLocalStorage } from '@massapp/hooks';
import { Ionicons } from '@expo/vector-icons';
import type { FreeCellGameState, FreeCellSelection, GameResult } from '../types';
import {
  createNewGame,
  moveCards,
  checkWin,
  canAutoComplete,
  autoCompleteStep,
  safeAutoCompleteStep,
} from '../utils/freecell';
import {
  PlayingCard,
  CARD_WIDTH,
  CARD_HEIGHT,
  CARD_OVERLAP,
} from '../components/PlayingCard';

const FOUNDATION_SUITS = ['\u2660', '\u2665', '\u2666', '\u2663'];

export function GameScreen() {
  const { colors, spacing } = useTheme();
  const { trackAction } = useInterstitialAd();
  const { show: showRewardedAd, loaded: rewardedLoaded } = useRewardedAd(() => {
    handleUndo();
  });

  const [history, setHistory] = useLocalStorage<GameResult[]>('freecell_history', []);

  const [gameState, setGameState] = useState<FreeCellGameState>(createNewGame());
  const [selection, setSelection] = useState<FreeCellSelection | null>(null);
  const [moveCount, setMoveCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isAutoCompleting, setIsAutoCompleting] = useState(false);
  const [undoStack, setUndoStack] = useState<FreeCellGameState[]>([]);
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
    setUndoStack([]);
    gameStartedRef.current = false;
  }, [gameOver, moveCount, elapsedSeconds, history, setHistory]);

  const handleWin = useCallback(
    (state: FreeCellGameState) => {
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

  // Auto-complete animation
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
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [gameState, isAutoCompleting, gameOver, handleWin]);

  // Safe auto-complete (automatic moves that can't hurt)
  useEffect(() => {
    if (gameOver || isAutoCompleting) return;
    const nextState = safeAutoCompleteStep(gameState);
    if (nextState) {
      const timer = setTimeout(() => {
        setGameState(nextState);
        if (checkWin(nextState)) {
          handleWin(nextState);
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [gameState, gameOver, isAutoCompleting, handleWin]);

  const ensureTimerStarted = () => {
    if (!gameStartedRef.current) {
      gameStartedRef.current = true;
      setIsTimerRunning(true);
    }
  };

  const applyMove = (newState: FreeCellGameState) => {
    setUndoStack((prev) => [...prev, gameState]);
    setGameState(newState);
    setMoveCount((prev) => prev + 1);
    setSelection(null);

    if (checkWin(newState)) {
      handleWin(newState);
      return;
    }

    if (canAutoComplete(newState)) {
      setIsAutoCompleting(true);
    }
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prevState = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setGameState(prevState);
    setMoveCount((prev) => Math.max(0, prev - 1));
    setSelection(null);
  };

  const requestUndo = () => {
    if (undoStack.length === 0) return;
    if (rewardedLoaded) {
      showRewardedAd();
    } else {
      handleUndo();
    }
  };

  const handleFreeCellPress = (cellIndex: number) => {
    if (gameOver || isAutoCompleting) return;
    ensureTimerStarted();

    const card = gameState.freeCells[cellIndex];

    if (!selection) {
      if (card) {
        setSelection({
          source: 'freecell',
          pileIndex: cellIndex,
          cardIndex: 0,
        });
      }
      return;
    }

    // Deselect if tapping same cell
    if (
      selection.source === 'freecell' &&
      selection.pileIndex === cellIndex
    ) {
      setSelection(null);
      return;
    }

    // Try to move to this free cell
    const result = moveCards(gameState, selection, 'freecell', cellIndex);
    if (result) {
      applyMove(result);
    } else {
      // If cell has card, select it instead
      if (card) {
        setSelection({
          source: 'freecell',
          pileIndex: cellIndex,
          cardIndex: 0,
        });
      } else {
        setSelection(null);
      }
    }
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
      applyMove(result);
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
      setSelection({
        source: 'tableau',
        pileIndex: colIndex,
        cardIndex,
      });
      return;
    }

    // Deselect if tapping same card
    if (
      selection.source === 'tableau' &&
      selection.pileIndex === colIndex &&
      selection.cardIndex === cardIndex
    ) {
      setSelection(null);
      return;
    }

    // Try to move to this column (always target the end)
    const result = moveCards(gameState, selection, 'tableau', colIndex);
    if (result) {
      applyMove(result);
    } else {
      // Select the tapped card instead
      if (cardIndex >= 0 && cardIndex < pile.length) {
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
      applyMove(result);
    } else {
      setSelection(null);
    }
  };

  const isCardSelected = (
    source: 'tableau' | 'freecell' | 'foundation',
    pileIndex: number,
    cardIndex: number
  ): boolean => {
    if (!selection) return false;
    if (selection.source !== source) return false;
    if (selection.source === 'tableau') {
      return selection.pileIndex === pileIndex && cardIndex >= selection.cardIndex;
    }
    return selection.pileIndex === pileIndex;
  };

  const renderFreeCells = () => (
    <View style={[styles.cellRow, { gap: 3 }]}>
      {gameState.freeCells.map((card, index) => (
        <TouchableOpacity
          key={`freecell-${index}`}
          onPress={() => handleFreeCellPress(index)}
          activeOpacity={0.7}
        >
          {card ? (
            <PlayingCard
              card={card}
              selected={isCardSelected('freecell', index, 0)}
            />
          ) : (
            <PlayingCard empty isFreeCell />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderFoundations = () => (
    <View style={[styles.cellRow, { gap: 3 }]}>
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

  const renderTableau = () => {
    const maxPileLength = Math.max(1, ...gameState.tableau.map((p) => p.length));
    const maxHeight = CARD_HEIGHT + Math.max(0, maxPileLength - 1) * CARD_OVERLAP;

    return (
      <View style={[styles.tableauRow, { gap: 3 }]}>
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
                const offset = cardIndex * CARD_OVERLAP;
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
              onPress={requestUndo}
              disabled={undoStack.length === 0}
              style={[
                styles.headerButton,
                {
                  backgroundColor: undoStack.length > 0 ? colors.primary : colors.border,
                  borderRadius: 4,
                },
              ]}
            >
              <Ionicons name="arrow-undo" size={14} color="#FFFFFF" />
              <Text style={styles.headerButtonText}>{'\u623b\u3059'}</Text>
            </TouchableOpacity>
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
                styles.headerButton,
                { backgroundColor: colors.primary, borderRadius: 4 },
              ]}
            >
              <Ionicons name="add" size={14} color="#FFFFFF" />
              <Text style={styles.headerButtonText}>{'\u65b0\u898f'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.topRow, { marginBottom: spacing.xs }]}>
          {renderFreeCells()}
          <View style={{ width: spacing.xs }} />
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
          <View style={styles.autoCompleteOverlay}>
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
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 2,
  },
  headerButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cellRow: {
    flexDirection: 'row',
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
