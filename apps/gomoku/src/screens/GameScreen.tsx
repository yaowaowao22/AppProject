import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { useTheme, H2, H3, Body, Caption, Button } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useInterstitialAd, useRewardedAd } from '@massapp/ads';
import { useLocalStorage } from '@massapp/hooks';
import type { Board, Difficulty, GameResult, Position } from '../types';
import {
  BOARD_SIZE,
  createInitialBoard,
  placeStone,
  isValidMove,
  checkWin,
  isBoardFull,
  countStones,
  getAIMove,
  getBestMove,
  getDifficultyLabel,
} from '../utils/gomoku';

type GameState = 'select' | 'playing' | 'finished';

interface HistoryEntry {
  board: Board;
  lastMove: Position | null;
}

export function GameScreen() {
  const { colors, spacing } = useTheme();
  const { trackAction } = useInterstitialAd();

  const [gameState, setGameState] = useState<GameState>('select');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [board, setBoard] = useState<Board>(createInitialBoard());
  const [currentTurn, setCurrentTurn] = useState<'black' | 'white'>('black');
  const [aiThinking, setAiThinking] = useState(false);
  const [lastMove, setLastMove] = useState<Position | null>(null);
  const [hintMove, setHintMove] = useState<Position | null>(null);
  const [moveHistory, setMoveHistory] = useState<HistoryEntry[]>([]);
  const [history, setHistory] = useLocalStorage<GameResult[]>('gomoku_history', []);

  const gameOverHandled = useRef(false);
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const playerColor: 'black' | 'white' = 'black';
  const aiColor: 'black' | 'white' = 'white';

  const stones = countStones(board);

  const { show: showRewardedAd, loaded: rewardedLoaded } = useRewardedAd({
    onReward: () => {
      showHint();
    },
  });

  const showHint = useCallback(() => {
    if (gameState !== 'playing' || currentTurn !== playerColor) return;
    const best = getBestMove(board, playerColor);
    if (best) {
      setHintMove(best);
    }
  }, [board, gameState, currentTurn]);

  const handleHint = useCallback(() => {
    if (rewardedLoaded) {
      showRewardedAd();
    } else {
      showHint();
    }
  }, [rewardedLoaded, showRewardedAd, showHint]);

  const finishGame = useCallback(
    (finalBoard: Board, winner: 'black' | 'white' | 'draw') => {
      if (gameOverHandled.current) return;
      gameOverHandled.current = true;
      setGameState('finished');

      const finalStones = countStones(finalBoard);
      const won = winner === playerColor;
      const draw = winner === 'draw';

      const result: GameResult = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        difficulty,
        playerStones: finalStones.black,
        aiStones: finalStones.white,
        won,
        draw,
        totalMoves: finalStones.black + finalStones.white,
      };
      setHistory([result, ...(history || [])]);
      trackAction();

      let title: string;
      let message: string;
      if (draw) {
        title = '引き分け';
        message = `${finalStones.black + finalStones.white}手で引き分けです。`;
      } else if (won) {
        title = '勝利！';
        message = `おめでとうございます！\n${finalStones.black + finalStones.white}手で勝利しました。`;
      } else {
        title = '敗北...';
        message = `残念！\n${finalStones.black + finalStones.white}手で敗北しました。\n次は頑張りましょう！`;
      }

      Alert.alert(title, `難易度: ${getDifficultyLabel(difficulty)}\n${message}`, [
        { text: '新しいゲーム', onPress: () => setGameState('select') },
      ]);
    },
    [difficulty, history, setHistory, trackAction],
  );

  const executeAIMove = useCallback(
    (currentBoard: Board) => {
      setAiThinking(true);
      aiTimeoutRef.current = setTimeout(() => {
        const move = getAIMove(currentBoard, aiColor, difficulty);
        const [r, c] = move;
        const newBoard = placeStone(currentBoard, r, c, aiColor);
        setBoard(newBoard);
        setLastMove(move);
        setMoveHistory((prev) => [...prev, { board: currentBoard, lastMove: lastMove }]);
        setAiThinking(false);

        if (checkWin(newBoard, r, c)) {
          finishGame(newBoard, aiColor);
          return;
        }

        if (isBoardFull(newBoard)) {
          finishGame(newBoard, 'draw');
          return;
        }

        setCurrentTurn(playerColor);
      }, 400);
    },
    [difficulty, finishGame, lastMove],
  );

  const startGame = useCallback(
    (diff: Difficulty) => {
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
      }
      setDifficulty(diff);
      const newBoard = createInitialBoard();
      setBoard(newBoard);
      setCurrentTurn('black');
      setLastMove(null);
      setHintMove(null);
      setAiThinking(false);
      setMoveHistory([]);
      setGameState('playing');
      gameOverHandled.current = false;
    },
    [],
  );

  const handleCellPress = useCallback(
    (row: number, col: number) => {
      if (gameState !== 'playing' || currentTurn !== playerColor || aiThinking) return;
      if (!isValidMove(board, row, col)) return;

      setHintMove(null);
      setMoveHistory((prev) => [...prev, { board, lastMove }]);

      const newBoard = placeStone(board, row, col, playerColor);
      setBoard(newBoard);
      setLastMove([row, col]);

      if (checkWin(newBoard, row, col)) {
        finishGame(newBoard, playerColor);
        return;
      }

      if (isBoardFull(newBoard)) {
        finishGame(newBoard, 'draw');
        return;
      }

      setCurrentTurn(aiColor);
      executeAIMove(newBoard);
    },
    [gameState, currentTurn, aiThinking, board, lastMove, finishGame, executeAIMove],
  );

  const handleUndo = useCallback(() => {
    if (gameState !== 'playing' || aiThinking) return;
    // Undo both player and AI moves (2 entries)
    if (moveHistory.length < 2) return;

    const prevEntry = moveHistory[moveHistory.length - 2];
    setBoard(prevEntry.board);
    setLastMove(prevEntry.lastMove);
    setMoveHistory((prev) => prev.slice(0, -2));
    setCurrentTurn(playerColor);
    setHintMove(null);
  }, [gameState, aiThinking, moveHistory]);

  const handleNewGame = useCallback(() => {
    if (gameState === 'playing') {
      Alert.alert('新しいゲーム', '現在のゲームを終了しますか？', [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '終了する',
          onPress: () => {
            if (aiTimeoutRef.current) {
              clearTimeout(aiTimeoutRef.current);
            }
            setAiThinking(false);
            setGameState('select');
          },
        },
      ]);
    } else {
      setGameState('select');
    }
  }, [gameState]);

  const screenWidth = Dimensions.get('window').width;
  const boardPadding = spacing.md * 2;
  const boardAreaSize = Math.min(screenWidth - boardPadding, 400);
  const cellSize = Math.floor(boardAreaSize / BOARD_SIZE);
  const actualBoardSize = cellSize * (BOARD_SIZE - 1);
  const stoneSize = cellSize * 0.82;
  const halfCell = cellSize / 2;

  if (gameState === 'select') {
    return (
      <ScreenWrapper>
        <View style={[styles.container, { padding: spacing.xl }]}>
          <View style={styles.selectContainer}>
            <H2 align="center" style={{ marginBottom: spacing.xl }}>
              難易度を選択
            </H2>
            <View style={{ gap: spacing.md }}>
              <Button title="初級（Easy）" onPress={() => startGame('easy')} size="lg" />
              <Button
                title="中級（Medium）"
                onPress={() => startGame('medium')}
                size="lg"
                variant="secondary"
              />
              <Button
                title="上級（Hard）"
                onPress={() => startGame('hard')}
                size="lg"
                variant="outline"
              />
            </View>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.sm }]}>
        <View style={[styles.scoreBar, { marginBottom: spacing.sm, paddingHorizontal: spacing.sm }]}>
          <View style={styles.scoreItem}>
            <View style={[styles.stoneIcon, { backgroundColor: '#000' }]} />
            <H3>{stones.black}</H3>
          </View>
          <View style={styles.turnIndicator}>
            <Caption color={colors.textSecondary}>
              {getDifficultyLabel(difficulty)}
            </Caption>
            <Body
              style={{
                fontWeight: '600',
                color: aiThinking ? colors.warning : colors.text,
              }}
            >
              {aiThinking
                ? 'AI思考中...'
                : gameState === 'finished'
                ? 'ゲーム終了'
                : currentTurn === playerColor
                ? 'あなたの番'
                : 'AIの番'}
            </Body>
          </View>
          <View style={[styles.scoreItem, { flexDirection: 'row-reverse' }]}>
            <View style={[styles.stoneIcon, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#999' }]} />
            <H3>{stones.white}</H3>
          </View>
        </View>

        <View
          style={[
            styles.boardOuter,
            {
              width: cellSize * BOARD_SIZE,
              height: cellSize * BOARD_SIZE,
              backgroundColor: '#DEB887',
              alignSelf: 'center',
              borderRadius: 4,
            },
          ]}
        >
          {/* Grid lines */}
          <View style={[styles.gridContainer, { left: halfCell, top: halfCell, width: actualBoardSize, height: actualBoardSize }]}>
            {Array.from({ length: BOARD_SIZE }).map((_, i) => (
              <React.Fragment key={`lines-${i}`}>
                {/* Horizontal line */}
                <View
                  style={{
                    position: 'absolute',
                    top: i * cellSize,
                    left: 0,
                    right: 0,
                    height: StyleSheet.hairlineWidth,
                    backgroundColor: '#5D4037',
                  }}
                />
                {/* Vertical line */}
                <View
                  style={{
                    position: 'absolute',
                    left: i * cellSize,
                    top: 0,
                    bottom: 0,
                    width: StyleSheet.hairlineWidth,
                    backgroundColor: '#5D4037',
                  }}
                />
              </React.Fragment>
            ))}
            {/* Star points (hoshi) for 13x13 */}
            {[[3, 3], [3, 9], [6, 6], [9, 3], [9, 9]].map(([sr, sc]) => (
              <View
                key={`star-${sr}-${sc}`}
                style={{
                  position: 'absolute',
                  left: sc * cellSize - 3,
                  top: sr * cellSize - 3,
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: '#5D4037',
                }}
              />
            ))}
          </View>

          {/* Touchable intersections */}
          {Array.from({ length: BOARD_SIZE }).map((_, rowIdx) => (
            <View key={rowIdx} style={styles.row}>
              {Array.from({ length: BOARD_SIZE }).map((_, colIdx) => {
                const cell = board[rowIdx][colIdx];
                const isLastMove =
                  lastMove !== null && lastMove[0] === rowIdx && lastMove[1] === colIdx;
                const isHint =
                  hintMove !== null && hintMove[0] === rowIdx && hintMove[1] === colIdx;

                return (
                  <TouchableOpacity
                    key={colIdx}
                    onPress={() => handleCellPress(rowIdx, colIdx)}
                    activeOpacity={0.7}
                    style={[
                      styles.cell,
                      {
                        width: cellSize,
                        height: cellSize,
                      },
                    ]}
                  >
                    {cell === 'black' && (
                      <View
                        style={[
                          styles.stone,
                          {
                            width: stoneSize,
                            height: stoneSize,
                            backgroundColor: '#1a1a1a',
                          },
                          isLastMove && styles.lastMoveHighlight,
                        ]}
                      />
                    )}
                    {cell === 'white' && (
                      <View
                        style={[
                          styles.stone,
                          {
                            width: stoneSize,
                            height: stoneSize,
                            backgroundColor: '#f5f5f5',
                            borderWidth: 1,
                            borderColor: '#bbb',
                          },
                          isLastMove && styles.lastMoveHighlight,
                        ]}
                      />
                    )}
                    {cell !== null && isLastMove && (
                      <View
                        style={[
                          styles.lastMoveDot,
                          {
                            width: stoneSize * 0.3,
                            height: stoneSize * 0.3,
                            backgroundColor: cell === 'black' ? '#fff' : '#000',
                          },
                        ]}
                      />
                    )}
                    {cell === null && isHint && (
                      <View
                        style={[
                          styles.hintDot,
                          {
                            width: stoneSize * 0.6,
                            height: stoneSize * 0.6,
                            backgroundColor: 'rgba(255, 235, 59, 0.6)',
                            borderWidth: 2,
                            borderColor: 'rgba(255, 235, 59, 0.9)',
                          },
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        <View style={[styles.actionRow, { marginTop: spacing.md, gap: spacing.sm }]}>
          <Button
            title="ヒント"
            onPress={handleHint}
            variant="outline"
            size="sm"
          />
          <Button
            title="一手戻す"
            onPress={handleUndo}
            variant="outline"
            size="sm"
          />
          <Button title="新しいゲーム" onPress={handleNewGame} variant="ghost" size="sm" />
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  selectContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  scoreBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  stoneIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  turnIndicator: {
    alignItems: 'center',
    flex: 1,
  },
  boardOuter: {
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    position: 'relative',
  },
  gridContainer: {
    position: 'absolute',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  stone: {
    borderRadius: 999,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  lastMoveHighlight: {
    elevation: 5,
    shadowOpacity: 0.5,
  },
  lastMoveDot: {
    position: 'absolute',
    borderRadius: 999,
  },
  hintDot: {
    borderRadius: 999,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
