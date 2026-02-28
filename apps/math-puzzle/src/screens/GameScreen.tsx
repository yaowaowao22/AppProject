import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useTheme, H1, H2, H3, Body, Caption, Button, Card } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useInterstitialAd, useRewardedAd } from '@massapp/ads';
import { useTimer, useLocalStorage } from '@massapp/hooks';
import { Ionicons } from '@expo/vector-icons';
import type { Difficulty, Puzzle, GameResult } from '../types';
import {
  generatePuzzle,
  validateExpression,
  formatTime,
  getDifficultyLabel,
} from '../utils/mathPuzzle';

type GameState = 'select' | 'playing' | 'completed';

const OPERATORS = ['+', '-', '\u00d7', '\u00f7', '(', ')'];

export function GameScreen() {
  const { colors, spacing, radius } = useTheme();
  const { trackAction } = useInterstitialAd();
  const timer = useTimer();

  const [gameState, setGameState] = useState<GameState>('select');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [expression, setExpression] = useState<string>('');
  const [usedNumbers, setUsedNumbers] = useState<boolean[]>([false, false, false, false]);
  const [resultMessage, setResultMessage] = useState<string>('');
  const [resultColor, setResultColor] = useState<string>('');
  const [history, setHistory] = useLocalStorage<GameResult[]>('math_puzzle_history', []);

  const completionHandled = useRef(false);
  const showSolutionRef = useRef<() => void>(() => {});

  const { show: showRewardedAd, loaded: rewardedLoaded } = useRewardedAd(() => {
    showSolutionRef.current();
  });

  const startGame = useCallback(
    (diff: Difficulty) => {
      setDifficulty(diff);
      const newPuzzle = generatePuzzle(diff);
      setPuzzle(newPuzzle);
      setExpression('');
      setUsedNumbers([false, false, false, false]);
      setResultMessage('');
      setResultColor('');
      setGameState('playing');
      completionHandled.current = false;
      timer.reset();
      timer.start();
    },
    [timer],
  );

  const showSolution = useCallback(() => {
    if (!puzzle) return;
    Alert.alert(
      '\u30d2\u30f3\u30c8',
      `\u89e3\u7b54\u4f8b: ${puzzle.solution} = ${puzzle.target}`,
      [{ text: '\u9589\u3058\u308b' }],
    );
  }, [puzzle]);

  useEffect(() => {
    showSolutionRef.current = showSolution;
  }, [showSolution]);

  const handleHint = useCallback(() => {
    if (rewardedLoaded) {
      showRewardedAd();
    } else {
      showSolution();
    }
  }, [rewardedLoaded, showRewardedAd, showSolution]);

  const handleNumberPress = (index: number) => {
    if (gameState !== 'playing' || !puzzle) return;
    if (usedNumbers[index]) return;
    const num = puzzle.numbers[index];
    setExpression((prev) => prev + num.toString());
    setUsedNumbers((prev) => {
      const next = [...prev];
      next[index] = true;
      return next;
    });
    setResultMessage('');
  };

  const handleOperatorPress = (op: string) => {
    if (gameState !== 'playing') return;
    setExpression((prev) => prev + op);
    setResultMessage('');
  };

  const handleClear = () => {
    if (gameState !== 'playing') return;
    setExpression('');
    setUsedNumbers([false, false, false, false]);
    setResultMessage('');
    setResultColor('');
  };

  const handleBackspace = () => {
    if (gameState !== 'playing' || !puzzle || expression.length === 0) return;

    // Find what the last token is
    const lastChar = expression[expression.length - 1];

    // Check if the last part is a multi-digit number
    let removeLen = 1;
    if (/\d/.test(lastChar)) {
      // Find how many digits at the end
      let i = expression.length - 1;
      while (i > 0 && /\d/.test(expression[i - 1])) {
        i--;
      }
      const numStr = expression.slice(i);
      const num = parseInt(numStr, 10);
      removeLen = numStr.length;

      // Un-mark the number from used
      const idx = puzzle.numbers.findIndex(
        (n, ni) => n === num && usedNumbers[ni],
      );
      if (idx !== -1) {
        setUsedNumbers((prev) => {
          const next = [...prev];
          next[idx] = false;
          return next;
        });
      }
    }

    setExpression((prev) => prev.slice(0, prev.length - removeLen));
    setResultMessage('');
  };

  const handleCheck = () => {
    if (gameState !== 'playing' || !puzzle) return;

    const { valid, result, error } = validateExpression(
      expression,
      puzzle.numbers,
      puzzle.target,
    );

    if (error) {
      setResultMessage(error);
      setResultColor(colors.error);
      return;
    }

    if (valid) {
      completionHandled.current = true;
      timer.stop();
      setGameState('completed');
      setResultMessage('\u6b63\u89e3\uff01');
      setResultColor(colors.success);

      const gameResult: GameResult = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        difficulty,
        timeSeconds: timer.seconds,
        solved: true,
        target: puzzle.target,
        expression,
      };
      setHistory([gameResult, ...(history || [])]);
      trackAction();

      Alert.alert(
        '\u30af\u30ea\u30a2\uff01',
        `\u96e3\u6613\u5ea6: ${getDifficultyLabel(difficulty)}\n\u30bf\u30a4\u30e0: ${formatTime(timer.seconds)}\n\u5f0f: ${expression} = ${puzzle.target}`,
        [
          { text: '\u6b21\u306e\u554f\u984c', onPress: () => startGame(difficulty) },
          { text: '\u96e3\u6613\u5ea6\u9078\u629e', onPress: () => setGameState('select') },
        ],
      );
    } else {
      setResultMessage(
        result !== null
          ? `\u7d50\u679c: ${result}\uff08\u76ee\u6a19: ${puzzle.target}\uff09`
          : '\u5f0f\u304c\u6b63\u3057\u304f\u3042\u308a\u307e\u305b\u3093',
      );
      setResultColor(colors.error);
    }
  };

  const handleNewGame = () => {
    if (gameState === 'playing') {
      Alert.alert('\u65b0\u3057\u3044\u554f\u984c', '\u73fe\u5728\u306e\u554f\u984c\u3092\u7d42\u4e86\u3057\u307e\u3059\u304b\uff1f', [
        { text: '\u30ad\u30e3\u30f3\u30bb\u30eb', style: 'cancel' },
        {
          text: '\u7d42\u4e86\u3059\u308b',
          onPress: () => {
            timer.stop();
            setGameState('select');
          },
        },
      ]);
    } else {
      setGameState('select');
    }
  };

  if (gameState === 'select') {
    return (
      <ScreenWrapper>
        <View style={[styles.container, { padding: spacing.xl }]}>
          <View style={styles.selectContainer}>
            <H2 align="center" style={{ marginBottom: spacing.sm }}>
              難易度を選択
            </H2>
            <Caption
              color={colors.textSecondary}
              style={{ textAlign: 'center', marginBottom: spacing.xl }}
            >
              4つの数字と四則演算で目標の数を作ろう
            </Caption>
            <View style={{ gap: spacing.md }}>
              <Button
                title="初級 - 足し算・引き算のみ"
                onPress={() => startGame('easy')}
                size="lg"
              />
              <Button
                title="中級 - 四則演算すべて"
                onPress={() => startGame('medium')}
                size="lg"
                variant="secondary"
              />
              <Button
                title="上級 - 大きい数・全数字使用"
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
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl }}
      >
        {/* Header: difficulty, timer, new game */}
        <View style={[styles.header, { marginBottom: spacing.md }]}>
          <View style={styles.headerLeft}>
            <Caption color={colors.textSecondary}>
              {getDifficultyLabel(difficulty)}
            </Caption>
          </View>
          <View style={styles.headerCenter}>
            <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
            <Body style={{ marginLeft: 4 }}>{formatTime(timer.seconds)}</Body>
          </View>
          <TouchableOpacity onPress={handleNewGame} style={styles.headerRight}>
            <Ionicons name="refresh" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Target number */}
        <Card style={[styles.targetCard, { padding: spacing.lg, marginBottom: spacing.lg }]}>
          <Caption color={colors.textSecondary} style={{ textAlign: 'center' }}>
            目標の数
          </Caption>
          <H1
            align="center"
            style={{ fontSize: 56, color: colors.primary, marginVertical: spacing.sm }}
          >
            {puzzle?.target ?? 0}
          </H1>
        </Card>

        {/* Number tiles */}
        <View style={[styles.numberRow, { marginBottom: spacing.md, gap: spacing.sm }]}>
          {puzzle?.numbers.map((num, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleNumberPress(index)}
              disabled={usedNumbers[index] || gameState !== 'playing'}
              activeOpacity={0.7}
              style={[
                styles.numberTile,
                {
                  backgroundColor: usedNumbers[index]
                    ? colors.border
                    : colors.primary,
                  borderRadius: radius.md,
                  opacity: usedNumbers[index] ? 0.4 : 1,
                },
              ]}
            >
              <H2 style={{ color: usedNumbers[index] ? colors.textMuted : colors.surface }}>
                {num}
              </H2>
            </TouchableOpacity>
          ))}
        </View>

        {/* Expression display */}
        <Card
          style={[
            styles.expressionCard,
            {
              padding: spacing.md,
              marginBottom: spacing.sm,
              minHeight: 60,
              borderColor: resultColor || colors.border,
              borderWidth: resultColor ? 2 : 1,
            },
          ]}
        >
          <H3
            align="center"
            style={{
              color: expression ? colors.text : colors.textMuted,
              fontSize: 24,
            }}
          >
            {expression || '数字と演算子をタップ'}
          </H3>
        </Card>

        {/* Result message */}
        {resultMessage !== '' && (
          <Body
            color={resultColor}
            style={{
              textAlign: 'center',
              marginBottom: spacing.sm,
              fontWeight: '600',
            }}
          >
            {resultMessage}
          </Body>
        )}

        {/* Operator buttons */}
        <View style={[styles.operatorRow, { marginBottom: spacing.md, gap: spacing.xs }]}>
          {OPERATORS.map((op) => (
            <TouchableOpacity
              key={op}
              onPress={() => handleOperatorPress(op)}
              disabled={gameState !== 'playing'}
              activeOpacity={0.7}
              style={[
                styles.operatorButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: radius.sm,
                },
              ]}
            >
              <H3 style={{ color: colors.primary }}>{op}</H3>
            </TouchableOpacity>
          ))}
        </View>

        {/* Action buttons */}
        <View style={[styles.actionRow, { gap: spacing.sm, marginBottom: spacing.md }]}>
          <View style={styles.actionButton}>
            <Button
              title="判定"
              onPress={handleCheck}
              size="lg"
            />
          </View>
          <View style={styles.actionButton}>
            <Button
              title="クリア"
              onPress={handleClear}
              variant="outline"
              size="lg"
            />
          </View>
        </View>

        {/* Backspace and hint */}
        <View style={[styles.actionRow, { gap: spacing.sm }]}>
          <View style={styles.actionButton}>
            <Button
              title="一文字戻す"
              onPress={handleBackspace}
              variant="ghost"
              size="sm"
            />
          </View>
          <View style={styles.actionButton}>
            <Button
              title="ヒント（広告）"
              onPress={handleHint}
              variant="ghost"
              size="sm"
            />
          </View>
          <View style={styles.actionButton}>
            <Button
              title="新しい問題"
              onPress={handleNewGame}
              variant="ghost"
              size="sm"
            />
          </View>
        </View>
      </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  targetCard: {
    alignItems: 'center',
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  numberTile: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expressionCard: {
    justifyContent: 'center',
  },
  operatorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  operatorButton: {
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
  },
});
