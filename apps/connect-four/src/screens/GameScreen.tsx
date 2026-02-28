import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import { useTheme, H2, H3, Body, Caption, Button } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useInterstitialAd } from '@massapp/ads';
import { useLocalStorage } from '@massapp/hooks';
import {
  createEmptyBoard,
  dropPiece,
  getDropRow,
  checkWin,
  isBoardFull,
  getAIMove,
  getDifficultyLabel,
  ROWS,
  COLS,
} from '../utils/connectFour';
import type { Board, Difficulty, GameResult, Position } from '../utils/connectFour';

type GameState = 'select' | 'playing' | 'finished';
type Turn = 'player' | 'ai';

const BOARD_COLOR = '#1565C0';
const PLAYER_COLOR = '#E53935';
const AI_COLOR = '#FDD835';
const EMPTY_COLOR = '#E3F2FD';

export function GameScreen() {
  const { colors, spacing } = useTheme();
  const { trackAction } = useInterstitialAd();

  const [gameState, setGameState] = useState<GameState>('select');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [board, setBoard] = useState<Board>(createEmptyBoard());
  const [currentTurn, setCurrentTurn] = useState<Turn>('player');
  const [aiThinking, setAiThinking] = useState(false);
  const [winCells, setWinCells] = useState<Position[] | null>(null);
  const [moveCount, setMoveCount] = useState(0);
  const [playerWins, setPlayerWins] = useState(0);
  const [aiWins, setAiWins] = useState(0);
  const [history, setHistory] = useLocalStorage<GameResult[]>('connect_four_history', []);

  const gameOverHandled = useRef(false);
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropAnimRef = useRef(new Animated.Value(0)).current;
  const [animatingCol, setAnimatingCol] = useState<number | null>(null);
  const [animatingRow, setAnimatingRow] = useState<number | null>(null);
  const [animatingPiece, setAnimatingPiece] = useState<Turn | null>(null);
  const winPulseRef = useRef(new Animated.Value(0)).current;

  const screenWidth = Dimensions.get('window').width;
  const boardPadding = spacing.lg * 2;
  const boardWidth = Math.min(screenWidth - boardPadding, 400);
  const cellSize = Math.floor(boardWidth / COLS);
  const pieceSize = cellSize * 0.78;
  const actualBoardWidth = cellSize * COLS;
  const actualBoardHeight = cellSize * ROWS;

  useEffect(() => {
    return () => {
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (winCells) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(winPulseRef, {
            toValue: 1,
            duration: 600,
            useNativeDriver: false,
          }),
          Animated.timing(winPulseRef, {
            toValue: 0,
            duration: 600,
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      winPulseRef.setValue(0);
    }
  }, [winCells, winPulseRef]);

  const animateDrop = useCallback(
    (col: number, targetRow: number, piece: Turn, callback: () => void) => {
      setAnimatingCol(col);
      setAnimatingRow(targetRow);
      setAnimatingPiece(piece);
      dropAnimRef.setValue(0);

      Animated.timing(dropAnimRef, {
        toValue: 1,
        duration: 200 + targetRow * 50,
        useNativeDriver: false,
      }).start(() => {
        setAnimatingCol(null);
        setAnimatingRow(null);
        setAnimatingPiece(null);
        callback();
      });
    },
    [dropAnimRef],
  );

  const startGameRef = useRef<(diff: Difficulty) => void>(() => {});

  const finishGame = useCallback(
    (finalBoard: Board, won: boolean, draw: boolean) => {
      if (gameOverHandled.current) return;
      gameOverHandled.current = true;
      setGameState('finished');

      if (won) setPlayerWins((p) => p + 1);
      if (!won && !draw) setAiWins((p) => p + 1);

      const result: GameResult = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        difficulty,
        won,
        draw,
        moves: moveCount,
      };
      setHistory([result, ...(history || [])]);
      trackAction();

      const title = draw ? '引き分け' : won ? '勝利！' : '敗北...';
      const message = draw
        ? '盤面が埋まりました。'
        : won
        ? 'おめでとうございます！'
        : '次は頑張りましょう！';

      setTimeout(() => {
        Alert.alert(title, `難易度: ${getDifficultyLabel(difficulty)}\n${message}`, [
          { text: 'もう一度', onPress: () => startGameRef.current(difficulty) },
          { text: '難易度選択', onPress: () => setGameState('select') },
        ]);
      }, 800);
    },
    [difficulty, history, setHistory, trackAction, moveCount],
  );

  const executeAIMove = useCallback(
    (currentBoard: Board) => {
      setAiThinking(true);
      aiTimeoutRef.current = setTimeout(() => {
        const col = getAIMove(currentBoard, difficulty);
        if (col === -1) {
          setAiThinking(false);
          return;
        }
        const targetRow = getDropRow(currentBoard, col);
        if (targetRow === -1) {
          setAiThinking(false);
          return;
        }

        animateDrop(col, targetRow, 'ai', () => {
          const newBoard = dropPiece(currentBoard, col, 'ai')!;
          setBoard(newBoard);
          setMoveCount((m) => m + 1);
          setAiThinking(false);

          const win = checkWin(newBoard);
          if (win) {
            setWinCells(win);
            finishGame(newBoard, false, false);
            return;
          }
          if (isBoardFull(newBoard)) {
            finishGame(newBoard, false, true);
            return;
          }
          setCurrentTurn('player');
        });
      }, 400);
    },
    [difficulty, finishGame, animateDrop],
  );

  const startGame = useCallback(
    (diff: Difficulty) => {
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
      setDifficulty(diff);
      setBoard(createEmptyBoard());
      setCurrentTurn('player');
      setWinCells(null);
      setAiThinking(false);
      setMoveCount(0);
      setAnimatingCol(null);
      setAnimatingRow(null);
      setAnimatingPiece(null);
      setGameState('playing');
      gameOverHandled.current = false;
    },
    [],
  );

  startGameRef.current = startGame;

  const handleColumnPress = useCallback(
    (col: number) => {
      if (gameState !== 'playing' || currentTurn !== 'player' || aiThinking) return;
      if (animatingCol !== null) return;

      const targetRow = getDropRow(board, col);
      if (targetRow === -1) return;

      animateDrop(col, targetRow, 'player', () => {
        const newBoard = dropPiece(board, col, 'player')!;
        setBoard(newBoard);
        setMoveCount((m) => m + 1);

        const win = checkWin(newBoard);
        if (win) {
          setWinCells(win);
          finishGame(newBoard, true, false);
          return;
        }
        if (isBoardFull(newBoard)) {
          finishGame(newBoard, false, true);
          return;
        }

        setCurrentTurn('ai');
        executeAIMove(newBoard);
      });
    },
    [gameState, currentTurn, aiThinking, board, animateDrop, finishGame, executeAIMove, animatingCol],
  );

  const handleNewGame = useCallback(() => {
    if (gameState === 'playing') {
      Alert.alert('新しいゲーム', '現在のゲームを終了しますか？', [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '終了する',
          onPress: () => {
            if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
            setAiThinking(false);
            setGameState('select');
          },
        },
      ]);
    } else {
      setGameState('select');
    }
  }, [gameState]);

  const isWinCell = (row: number, col: number): boolean => {
    if (!winCells) return false;
    return winCells.some(([r, c]) => r === row && c === col);
  };

  const getPieceColor = (cell: 'player' | 'ai'): string => {
    return cell === 'player' ? PLAYER_COLOR : AI_COLOR;
  };

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

  const dropAnimTop = animatingRow !== null
    ? dropAnimRef.interpolate({
        inputRange: [0, 1],
        outputRange: [-cellSize, animatingRow * cellSize],
      })
    : 0;

  return (
    <ScreenWrapper>
      <View style={[styles.container, { padding: spacing.sm }]}>
        {/* Score bar */}
        <View style={[styles.scoreBar, { marginBottom: spacing.sm, paddingHorizontal: spacing.sm }]}>
          <View style={styles.scoreItem}>
            <View style={[styles.pieceIcon, { backgroundColor: PLAYER_COLOR }]} />
            <H3>あなた {playerWins}</H3>
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
                : currentTurn === 'player'
                ? 'あなたの番'
                : 'AIの番'}
            </Body>
          </View>
          <View style={[styles.scoreItem, { flexDirection: 'row-reverse' }]}>
            <View style={[styles.pieceIcon, { backgroundColor: AI_COLOR }]} />
            <H3>{aiWins} AI</H3>
          </View>
        </View>

        {/* Column tap targets (arrows above board) */}
        <View style={[styles.arrowRow, { width: actualBoardWidth, alignSelf: 'center' }]}>
          {Array.from({ length: COLS }).map((_, col) => {
            const canDrop =
              gameState === 'playing' &&
              currentTurn === 'player' &&
              !aiThinking &&
              animatingCol === null &&
              getDropRow(board, col) !== -1;
            return (
              <TouchableOpacity
                key={col}
                onPress={() => handleColumnPress(col)}
                activeOpacity={0.6}
                style={[
                  styles.arrowCell,
                  { width: cellSize, height: cellSize * 0.6 },
                ]}
              >
                {canDrop && (
                  <View
                    style={[
                      styles.arrowPiece,
                      {
                        width: pieceSize * 0.6,
                        height: pieceSize * 0.6,
                        backgroundColor: PLAYER_COLOR,
                        opacity: 0.6,
                      },
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Board */}
        <View
          style={[
            styles.boardContainer,
            {
              width: actualBoardWidth,
              height: actualBoardHeight,
              backgroundColor: BOARD_COLOR,
              alignSelf: 'center',
              borderRadius: 8,
            },
          ]}
        >
          {/* Animated dropping piece */}
          {animatingCol !== null && animatingPiece !== null && (
            <Animated.View
              style={[
                styles.animatingPiece,
                {
                  width: pieceSize,
                  height: pieceSize,
                  borderRadius: pieceSize / 2,
                  backgroundColor: getPieceColor(animatingPiece),
                  left: animatingCol * cellSize + (cellSize - pieceSize) / 2,
                  top: dropAnimTop,
                },
              ]}
            />
          )}

          {board.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.row}>
              {row.map((cell, colIdx) => {
                const isWin = isWinCell(rowIdx, colIdx);
                const isAnimatingHere =
                  animatingCol === colIdx && animatingRow === rowIdx;

                const winBorderColor = winPulseRef.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['rgba(255,255,255,0)', 'rgba(255,255,255,0.9)'],
                });
                const winScale = winPulseRef.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.1],
                });

                return (
                  <TouchableOpacity
                    key={colIdx}
                    onPress={() => handleColumnPress(colIdx)}
                    activeOpacity={0.7}
                    style={[
                      styles.cell,
                      {
                        width: cellSize,
                        height: cellSize,
                      },
                    ]}
                  >
                    {cell === null && !isAnimatingHere && (
                      <View
                        style={[
                          styles.piece,
                          {
                            width: pieceSize,
                            height: pieceSize,
                            backgroundColor: EMPTY_COLOR,
                          },
                        ]}
                      />
                    )}
                    {cell !== null && !isAnimatingHere && (
                      <Animated.View
                        style={[
                          styles.piece,
                          {
                            width: pieceSize,
                            height: pieceSize,
                            backgroundColor: getPieceColor(cell),
                          },
                          isWin && {
                            borderWidth: 3,
                            borderColor: winBorderColor as any,
                            transform: [{ scale: winScale as any }],
                          },
                        ]}
                      />
                    )}
                    {cell === null && isAnimatingHere && (
                      <View
                        style={[
                          styles.piece,
                          {
                            width: pieceSize,
                            height: pieceSize,
                            backgroundColor: EMPTY_COLOR,
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

        {/* Action buttons */}
        <View style={[styles.actionRow, { marginTop: spacing.md, gap: spacing.sm }]}>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  pieceIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  turnIndicator: {
    alignItems: 'center',
    flex: 1,
  },
  arrowRow: {
    flexDirection: 'row',
  },
  arrowCell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowPiece: {
    borderRadius: 999,
  },
  boardContainer: {
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    position: 'relative',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  piece: {
    borderRadius: 999,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  animatingPiece: {
    position: 'absolute',
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
