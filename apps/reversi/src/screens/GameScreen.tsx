import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { useTheme, H2, H3, Body, Caption, Button } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useInterstitialAd, useRewardedAd } from '@massapp/ads';
import { useLocalStorage } from '@massapp/hooks';
import type { Board, Difficulty, GameResult, Position } from '../types';
import {
  createInitialBoard,
  getValidMoves,
  applyMove,
  countStones,
  isGameOver,
  getWinner,
  getDifficultyLabel,
} from '../utils/reversi';
import { getAIMove, getBestMove } from '../utils/ai';

type GameState = 'select' | 'playing' | 'finished';
type Turn = 'black' | 'white';

export function GameScreen() {
  const { colors, spacing } = useTheme();
  const { trackAction } = useInterstitialAd();

  const [gameState, setGameState] = useState<GameState>('select');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [board, setBoard] = useState<Board>(createInitialBoard());
  const [currentTurn, setCurrentTurn] = useState<Turn>('black');
  const [aiThinking, setAiThinking] = useState(false);
  const [lastMove, setLastMove] = useState<Position | null>(null);
  const [hintMove, setHintMove] = useState<Position | null>(null);
  const [history, setHistory] = useLocalStorage<GameResult[]>('reversi_history', []);

  const gameOverHandled = useRef(false);
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { show: showRewardedAd, loaded: rewardedLoaded } = useRewardedAd({
    onReward: () => {
      showHint();
    },
  });

  const playerColor: Turn = 'black';
  const aiColor: Turn = 'white';

  const validMoves = gameState === 'playing' ? getValidMoves(board, currentTurn) : [];
  const stones = countStones(board);

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
    (finalBoard: Board) => {
      if (gameOverHandled.current) return;
      gameOverHandled.current = true;
      setGameState('finished');

      const finalStones = countStones(finalBoard);
      const winner = getWinner(finalBoard);
      const won = winner === playerColor;
      const draw = winner === 'draw';

      const result: GameResult = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        difficulty,
        playerScore: finalStones.black,
        aiScore: finalStones.white,
        won,
        draw,
      };
      setHistory([result, ...(history || [])]);
      trackAction();

      let title: string;
      let message: string;
      if (draw) {
        title = '引き分け';
        message = `黒 ${finalStones.black} - ${finalStones.white} 白`;
      } else if (won) {
        title = '勝利！';
        message = `黒 ${finalStones.black} - ${finalStones.white} 白\nおめでとうございます！`;
      } else {
        title = '敗北...';
        message = `黒 ${finalStones.black} - ${finalStones.white} 白\n次は頑張りましょう！`;
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
        if (move) {
          const [r, c] = move;
          const newBoard = applyMove(currentBoard, r, c, aiColor);
          setBoard(newBoard);
          setLastMove(move);
          setAiThinking(false);

          if (isGameOver(newBoard)) {
            finishGame(newBoard);
            return;
          }

          const playerMoves = getValidMoves(newBoard, playerColor);
          if (playerMoves.length === 0) {
            executeAIMove(newBoard);
          } else {
            setCurrentTurn(playerColor);
          }
        } else {
          setAiThinking(false);
          const playerMoves = getValidMoves(currentBoard, playerColor);
          if (playerMoves.length === 0) {
            finishGame(currentBoard);
          } else {
            setCurrentTurn(playerColor);
          }
        }
      }, 500);
    },
    [difficulty, finishGame],
  );

  useEffect(() => {
    return () => {
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
      }
    };
  }, []);

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
      setGameState('playing');
      gameOverHandled.current = false;
    },
    [],
  );

  const handleCellPress = useCallback(
    (row: number, col: number) => {
      if (gameState !== 'playing' || currentTurn !== playerColor || aiThinking) return;

      const isValid = validMoves.some(([r, c]) => r === row && c === col);
      if (!isValid) return;

      setHintMove(null);
      const newBoard = applyMove(board, row, col, playerColor);
      setBoard(newBoard);
      setLastMove([row, col]);

      if (isGameOver(newBoard)) {
        finishGame(newBoard);
        return;
      }

      const aiMoves = getValidMoves(newBoard, aiColor);
      if (aiMoves.length > 0) {
        setCurrentTurn(aiColor);
        executeAIMove(newBoard);
      } else {
        const nextPlayerMoves = getValidMoves(newBoard, playerColor);
        if (nextPlayerMoves.length === 0) {
          finishGame(newBoard);
        }
      }
    },
    [gameState, currentTurn, aiThinking, board, validMoves, finishGame, executeAIMove],
  );

  const handlePass = useCallback(() => {
    if (gameState !== 'playing' || currentTurn !== playerColor || aiThinking) return;
    if (validMoves.length > 0) {
      Alert.alert('パスできません', '置ける場所があります。');
      return;
    }

    const aiMoves = getValidMoves(board, aiColor);
    if (aiMoves.length === 0) {
      finishGame(board);
      return;
    }

    setCurrentTurn(aiColor);
    executeAIMove(board);
  }, [gameState, currentTurn, aiThinking, validMoves, board, finishGame, executeAIMove]);

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
  const boardPadding = spacing.lg * 2;
  const boardSize = Math.min(screenWidth - boardPadding, 400);
  const cellSize = Math.floor(boardSize / 8);
  const stoneSize = cellSize * 0.8;

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
            styles.boardContainer,
            {
              backgroundColor: '#2E7D32',
              alignSelf: 'center',
              borderRadius: 4,
            },
          ]}
        >
          {board.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.row}>
              {row.map((cell, colIdx) => {
                const isLastMove =
                  lastMove !== null && lastMove[0] === rowIdx && lastMove[1] === colIdx;
                const isValidMoveCell =
                  currentTurn === playerColor &&
                  !aiThinking &&
                  gameState === 'playing' &&
                  validMoves.some(([r, c]) => r === rowIdx && c === colIdx);
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
                        borderColor: '#1B5E20',
                        borderWidth: StyleSheet.hairlineWidth,
                      },
                      isLastMove && {
                        backgroundColor: '#4CAF50',
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
                            backgroundColor: '#000',
                          },
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
                            backgroundColor: '#fff',
                          },
                        ]}
                      />
                    )}
                    {cell === null && isHint && (
                      <View
                        style={[
                          styles.hintDot,
                          {
                            width: stoneSize * 0.7,
                            height: stoneSize * 0.7,
                            backgroundColor: 'rgba(255, 235, 59, 0.6)',
                            borderWidth: 2,
                            borderColor: 'rgba(255, 235, 59, 0.9)',
                          },
                        ]}
                      />
                    )}
                    {cell === null && isValidMoveCell && !isHint && (
                      <View
                        style={[
                          styles.validDot,
                          {
                            width: stoneSize * 0.25,
                            height: stoneSize * 0.25,
                            backgroundColor: 'rgba(255, 255, 255, 0.5)',
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
            title="パス"
            onPress={handlePass}
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
  boardContainer: {
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
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
  validDot: {
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
