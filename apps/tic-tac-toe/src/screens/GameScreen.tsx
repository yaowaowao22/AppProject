import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { useTheme, H2, H3, Body, Caption, Button } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useInterstitialAd } from '@massapp/ads';
import { useLocalStorage } from '@massapp/hooks';
import type { Board, Difficulty, GameResult, WinLine } from '../types';
import {
  createEmptyBoard,
  getWinLine,
  isDraw,
  isGameOver,
  placeStone,
  getAIMove,
  getDifficultyLabel,
} from '../utils/tictactoe';

type GameState = 'select' | 'playing' | 'finished';

interface SessionScore {
  wins: number;
  losses: number;
  draws: number;
}

export function GameScreen() {
  const { colors, spacing } = useTheme();
  const { trackAction } = useInterstitialAd();

  const [gameState, setGameState] = useState<GameState>('select');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [board, setBoard] = useState<Board>(createEmptyBoard());
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [aiThinking, setAiThinking] = useState(false);
  const [winLine, setWinLine] = useState<WinLine | null>(null);
  const [sessionScore, setSessionScore] = useState<SessionScore>({ wins: 0, losses: 0, draws: 0 });
  const [history, setHistory] = useLocalStorage<GameResult[]>('tictactoe_history', []);

  const gameOverHandled = useRef(false);
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finishGame = useCallback(
    (finalBoard: Board) => {
      if (gameOverHandled.current) return;
      gameOverHandled.current = true;
      setGameState('finished');

      const playerWinLine = getWinLine(finalBoard, 'player');
      const aiWinLine = getWinLine(finalBoard, 'ai');
      const draw = isDraw(finalBoard);

      if (playerWinLine) {
        setWinLine(playerWinLine);
      } else if (aiWinLine) {
        setWinLine(aiWinLine);
      }

      let result: 'win' | 'loss' | 'draw';
      if (draw) {
        result = 'draw';
        setSessionScore((prev) => ({ ...prev, draws: prev.draws + 1 }));
      } else if (playerWinLine) {
        result = 'win';
        setSessionScore((prev) => ({ ...prev, wins: prev.wins + 1 }));
      } else {
        result = 'loss';
        setSessionScore((prev) => ({ ...prev, losses: prev.losses + 1 }));
      }

      const gameResult: GameResult = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        difficulty,
        result,
      };
      setHistory([gameResult, ...(history || [])]);
      trackAction();

      let title: string;
      let message: string;
      if (draw) {
        title = '引き分け';
        message = '互角の勝負でした！';
      } else if (result === 'win') {
        title = '勝利！';
        message = 'おめでとうございます！';
      } else {
        title = '敗北...';
        message = '次は頑張りましょう！';
      }

      Alert.alert(title, `難易度: ${getDifficultyLabel(difficulty)}\n${message}`, [
        { text: 'もう一度', onPress: () => startNewRound() },
        { text: '難易度選択', onPress: () => resetToSelect() },
      ]);
    },
    [difficulty, history, setHistory, trackAction],
  );

  const executeAIMove = useCallback(
    (currentBoard: Board) => {
      setAiThinking(true);
      aiTimeoutRef.current = setTimeout(() => {
        const move = getAIMove(currentBoard, difficulty);
        const newBoard = placeStone(currentBoard, move, 'ai');
        setBoard(newBoard);
        setAiThinking(false);

        if (isGameOver(newBoard)) {
          finishGame(newBoard);
          return;
        }

        setIsPlayerTurn(true);
      }, 400);
    },
    [difficulty, finishGame],
  );

  const startGame = useCallback(
    (diff: Difficulty) => {
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
      }
      setDifficulty(diff);
      setBoard(createEmptyBoard());
      setIsPlayerTurn(true);
      setAiThinking(false);
      setWinLine(null);
      setGameState('playing');
      gameOverHandled.current = false;
    },
    [],
  );

  const startNewRound = useCallback(() => {
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
    }
    setBoard(createEmptyBoard());
    setIsPlayerTurn(true);
    setAiThinking(false);
    setWinLine(null);
    setGameState('playing');
    gameOverHandled.current = false;
  }, []);

  const resetToSelect = useCallback(() => {
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
    }
    setAiThinking(false);
    setWinLine(null);
    setGameState('select');
    gameOverHandled.current = false;
  }, []);

  const handleCellPress = useCallback(
    (index: number) => {
      if (gameState !== 'playing' || !isPlayerTurn || aiThinking) return;
      if (board[index] !== null) return;

      const newBoard = placeStone(board, index, 'player');
      setBoard(newBoard);

      if (isGameOver(newBoard)) {
        finishGame(newBoard);
        return;
      }

      setIsPlayerTurn(false);
      executeAIMove(newBoard);
    },
    [gameState, isPlayerTurn, aiThinking, board, finishGame, executeAIMove],
  );

  const handleNewGame = useCallback(() => {
    if (gameState === 'playing') {
      Alert.alert('新しいゲーム', '現在のゲームを終了しますか？', [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '終了する',
          onPress: resetToSelect,
        },
      ]);
    } else {
      resetToSelect();
    }
  }, [gameState, resetToSelect]);

  const screenWidth = Dimensions.get('window').width;
  const boardPadding = spacing.lg * 2 + spacing.sm * 2;
  const boardSize = Math.min(screenWidth - boardPadding, 360);
  const cellSize = Math.floor(boardSize / 3);

  const isWinCell = (index: number): boolean => {
    if (!winLine) return false;
    return winLine.includes(index);
  };

  // Difficulty select screen
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
        {/* Score bar */}
        <View style={[styles.scoreBar, { marginBottom: spacing.sm, paddingHorizontal: spacing.sm }]}>
          <View style={styles.scoreItem}>
            <Body style={{ color: '#4A90D9', fontWeight: '700', fontSize: 18 }}>&#9675;</Body>
            <Caption color={colors.textSecondary}>あなた</Caption>
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
                : isPlayerTurn
                ? 'あなたの番'
                : 'AIの番'}
            </Body>
          </View>
          <View style={[styles.scoreItem, { alignItems: 'flex-end' }]}>
            <Body style={{ color: '#E74C3C', fontWeight: '700', fontSize: 18 }}>&#10005;</Body>
            <Caption color={colors.textSecondary}>AI</Caption>
          </View>
        </View>

        {/* Session score */}
        <View style={[styles.sessionScore, { marginBottom: spacing.md, paddingHorizontal: spacing.sm }]}>
          <Caption color={colors.success}>
            {sessionScore.wins}勝
          </Caption>
          <Caption color={colors.error}>
            {sessionScore.losses}敗
          </Caption>
          <Caption color={colors.textSecondary}>
            {sessionScore.draws}分
          </Caption>
        </View>

        {/* Board */}
        <View
          style={[
            styles.boardContainer,
            {
              width: cellSize * 3 + 4,
              height: cellSize * 3 + 4,
              alignSelf: 'center',
              borderRadius: 8,
              borderWidth: 2,
              borderColor: colors.border,
              backgroundColor: colors.surface,
            },
          ]}
        >
          {[0, 1, 2].map((row) => (
            <View key={row} style={styles.row}>
              {[0, 1, 2].map((col) => {
                const index = row * 3 + col;
                const cell = board[index];
                const isWin = isWinCell(index);

                return (
                  <TouchableOpacity
                    key={col}
                    onPress={() => handleCellPress(index)}
                    activeOpacity={0.7}
                    style={[
                      styles.cell,
                      {
                        width: cellSize,
                        height: cellSize,
                        borderColor: colors.border,
                        borderRightWidth: col < 2 ? StyleSheet.hairlineWidth : 0,
                        borderBottomWidth: row < 2 ? StyleSheet.hairlineWidth : 0,
                      },
                      isWin && {
                        backgroundColor: gameState === 'finished' && getWinLine(board, 'player')
                          ? 'rgba(74, 144, 217, 0.15)'
                          : 'rgba(231, 76, 60, 0.15)',
                      },
                    ]}
                  >
                    {cell === 'player' && (
                      <Body
                        style={{
                          fontSize: cellSize * 0.55,
                          lineHeight: cellSize * 0.65,
                          color: '#4A90D9',
                          fontWeight: '300',
                        }}
                      >
                        &#9675;
                      </Body>
                    )}
                    {cell === 'ai' && (
                      <Body
                        style={{
                          fontSize: cellSize * 0.5,
                          lineHeight: cellSize * 0.6,
                          color: '#E74C3C',
                          fontWeight: '700',
                        }}
                      >
                        &#10005;
                      </Body>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={[styles.actionRow, { marginTop: spacing.lg, gap: spacing.sm }]}>
          <Button title="新しいゲーム" onPress={handleNewGame} variant="outline" size="sm" />
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
    alignItems: 'center',
    flex: 1,
  },
  turnIndicator: {
    alignItems: 'center',
    flex: 2,
  },
  sessionScore: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  boardContainer: {
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
