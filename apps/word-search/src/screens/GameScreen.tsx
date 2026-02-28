import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  ScrollView,
} from 'react-native';
import { useTheme, H2, H3, Body, Button, Card, Badge, Caption } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useInterstitialAd, useRewardedAd } from '@massapp/ads';
import { useTimer, useLocalStorage } from '@massapp/hooks';
import { Ionicons } from '@expo/vector-icons';
import { WORD_THEMES, WordTheme } from '../data/wordLists';
import {
  generateGrid,
  checkSelection,
  getWordCells,
  formatTime,
  GRID_SIZES,
  GridSize,
  WordSearchGrid,
  PlacedWord,
} from '../utils/wordSearch';

interface GameResult {
  id: string;
  theme: string;
  themeName: string;
  gridSize: number;
  wordsFound: number;
  totalWords: number;
  timeSeconds: number;
  date: string;
}

type GamePhase = 'select' | 'playing' | 'completed';

export function GameScreen() {
  const { colors, spacing } = useTheme();
  const { trackAction } = useInterstitialAd();
  const { seconds, start, stop, reset } = useTimer();

  const [results, setResults] = useLocalStorage<GameResult[]>('wordsearch-results', []);

  const [phase, setPhase] = useState<GamePhase>('select');
  const [selectedTheme, setSelectedTheme] = useState<WordTheme | null>(null);
  const [selectedSize, setSelectedSize] = useState<GridSize>(8);
  const [puzzle, setPuzzle] = useState<WordSearchGrid | null>(null);
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [selectedStart, setSelectedStart] = useState<{ row: number; col: number } | null>(null);
  const [completedTime, setCompletedTime] = useState(0);
  const [hintedWord, setHintedWord] = useState<PlacedWord | null>(null);

  /** All cells belonging to found words, used for persistent highlighting */
  const foundCells = useMemo(() => {
    if (!puzzle) return new Set<string>();
    const cellSet = new Set<string>();
    for (const pw of puzzle.placedWords) {
      if (foundWords.has(pw.word)) {
        for (const c of getWordCells(pw)) {
          cellSet.add(`${c.row}-${c.col}`);
        }
      }
    }
    return cellSet;
  }, [puzzle, foundWords]);

  /** Cells for the hinted word */
  const hintCells = useMemo(() => {
    if (!hintedWord) return new Set<string>();
    const cellSet = new Set<string>();
    for (const c of getWordCells(hintedWord)) {
      cellSet.add(`${c.row}-${c.col}`);
    }
    return cellSet;
  }, [hintedWord]);

  const handleReward = useCallback(() => {
    if (!puzzle) return;
    const unfound = puzzle.placedWords.filter((pw) => !foundWords.has(pw.word));
    if (unfound.length === 0) {
      Alert.alert('ヒント', 'すべての単語が見つかっています');
      return;
    }
    const target = unfound[Math.floor(Math.random() * unfound.length)];
    setHintedWord(target);
    Alert.alert('ヒント', `「${target.word}」がハイライトされました`);
  }, [puzzle, foundWords]);

  const { show: showRewardedAd, loaded: rewardedLoaded } = useRewardedAd(handleReward);

  const handleStartGame = () => {
    if (!selectedTheme) {
      Alert.alert('テーマ選択', 'テーマを選んでください');
      return;
    }
    const newPuzzle = generateGrid(selectedTheme.words, selectedSize);
    setPuzzle(newPuzzle);
    setFoundWords(new Set());
    setSelectedStart(null);
    setHintedWord(null);
    setPhase('playing');
    reset();
    start();
  };

  const handleCellPress = (row: number, col: number) => {
    if (!puzzle) return;

    if (!selectedStart) {
      setSelectedStart({ row, col });
      return;
    }

    // Second tap: check for word match
    const matched = checkSelection(
      selectedStart.row,
      selectedStart.col,
      row,
      col,
      puzzle.placedWords,
      foundWords,
    );

    if (matched) {
      const newFound = new Set(foundWords);
      newFound.add(matched.word);
      setFoundWords(newFound);

      // Clear hint if this word was hinted
      if (hintedWord && hintedWord.word === matched.word) {
        setHintedWord(null);
      }

      // Check completion
      if (newFound.size === puzzle.placedWords.length) {
        stop();
        setCompletedTime(seconds);
        const result: GameResult = {
          id: Date.now().toString(),
          theme: selectedTheme?.id || '',
          themeName: selectedTheme?.name || '',
          gridSize: puzzle.size,
          wordsFound: newFound.size,
          totalWords: puzzle.placedWords.length,
          timeSeconds: seconds,
          date: new Date().toISOString(),
        };
        setResults((prev) => [result, ...(prev || [])]);
        trackAction();
        setPhase('completed');
      }
    }

    setSelectedStart(null);
  };

  const handleHint = () => {
    if (rewardedLoaded) {
      showRewardedAd();
    } else {
      handleReward();
    }
  };

  const handleReset = () => {
    Alert.alert('リセット', '現在のゲームをリセットしますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'リセット',
        style: 'destructive',
        onPress: () => {
          handleStartGame();
        },
      },
    ]);
  };

  const handleBackToSelect = () => {
    stop();
    reset();
    setPhase('select');
    setPuzzle(null);
    setFoundWords(new Set());
    setSelectedStart(null);
    setHintedWord(null);
  };

  // --- Select Phase ---
  if (phase === 'select') {
    return (
      <ScreenWrapper>
        <ScrollView style={[styles.container, { padding: spacing.lg }]}>
          <H2 style={{ marginBottom: spacing.lg }}>テーマを選択</H2>
          {WORD_THEMES.map((theme) => (
            <TouchableOpacity
              key={theme.id}
              onPress={() => setSelectedTheme(theme)}
              activeOpacity={0.7}
            >
              <Card
                style={[
                  styles.optionCard,
                  {
                    marginBottom: spacing.sm,
                    borderColor:
                      selectedTheme?.id === theme.id ? colors.primary : colors.border,
                    borderWidth: selectedTheme?.id === theme.id ? 2 : 1,
                  },
                ]}
              >
                <View style={styles.optionRow}>
                  <Body style={{ fontSize: 24 }}>{theme.icon}</Body>
                  <View style={{ marginLeft: spacing.md, flex: 1 }}>
                    <Body style={{ fontWeight: 'bold' }}>{theme.name}</Body>
                    <Caption style={{ color: colors.textMuted }}>
                      {theme.words.length}語
                    </Caption>
                  </View>
                  {selectedTheme?.id === theme.id && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </View>
              </Card>
            </TouchableOpacity>
          ))}

          <H2 style={{ marginTop: spacing.xl, marginBottom: spacing.lg }}>グリッドサイズ</H2>
          <View style={styles.sizeRow}>
            {GRID_SIZES.map((gs) => (
              <TouchableOpacity
                key={gs.size}
                onPress={() => setSelectedSize(gs.size)}
                activeOpacity={0.7}
                style={{ flex: 1 }}
              >
                <Card
                  style={[
                    styles.sizeCard,
                    {
                      marginHorizontal: spacing.xs,
                      borderColor:
                        selectedSize === gs.size ? colors.primary : colors.border,
                      borderWidth: selectedSize === gs.size ? 2 : 1,
                    },
                  ]}
                >
                  <H3 align="center">{gs.label}</H3>
                  <Caption style={{ textAlign: 'center', color: colors.textMuted }}>
                    {gs.difficulty}
                  </Caption>
                </Card>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ marginTop: spacing.xl, marginBottom: spacing.xl }}>
            <Button title="ゲームスタート" onPress={handleStartGame} size="lg" />
          </View>
        </ScrollView>
      </ScreenWrapper>
    );
  }

  // --- Completed Phase ---
  if (phase === 'completed') {
    return (
      <ScreenWrapper>
        <View style={[styles.container, { padding: spacing.lg, justifyContent: 'center' }]}>
          <View style={styles.completedContent}>
            <Ionicons name="trophy" size={64} color={colors.primary} />
            <H2 style={{ marginTop: spacing.lg, textAlign: 'center' }}>全単語発見！</H2>
            <H3
              style={{
                marginTop: spacing.md,
                textAlign: 'center',
                color: colors.primary,
              }}
            >
              {selectedTheme?.icon} {selectedTheme?.name}
            </H3>
            <View
              style={[
                styles.statsBox,
                {
                  marginTop: spacing.lg,
                  backgroundColor: colors.surface,
                  padding: spacing.lg,
                  borderRadius: 12,
                },
              ]}
            >
              <View style={styles.statItem}>
                <Caption style={{ color: colors.textMuted }}>クリアタイム</Caption>
                <Body style={{ fontWeight: 'bold', fontSize: 20, color: colors.primary }}>
                  {formatTime(completedTime)}
                </Body>
              </View>
              <View style={styles.statItem}>
                <Caption style={{ color: colors.textMuted }}>グリッド</Caption>
                <Body style={{ fontWeight: 'bold', fontSize: 20, color: colors.primary }}>
                  {puzzle?.size}×{puzzle?.size}
                </Body>
              </View>
              <View style={styles.statItem}>
                <Caption style={{ color: colors.textMuted }}>単語数</Caption>
                <Body style={{ fontWeight: 'bold', fontSize: 20, color: colors.primary }}>
                  {puzzle?.placedWords.length}語
                </Body>
              </View>
            </View>
          </View>
          <View style={{ gap: spacing.sm, marginTop: spacing.xl }}>
            <Button title="もう一度プレイ" onPress={handleStartGame} />
            <Button title="テーマ選択に戻る" onPress={handleBackToSelect} variant="outline" />
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  // --- Playing Phase ---
  if (!puzzle) return null;

  const screenWidth = Dimensions.get('window').width;
  const gridPadding = spacing.sm * 2;
  const cellSize = Math.floor((screenWidth - gridPadding - spacing.sm * 2) / puzzle.size);

  return (
    <ScreenWrapper>
      <ScrollView style={[styles.container, { padding: spacing.sm }]}>
        {/* Top bar */}
        <View style={[styles.topBar, { marginBottom: spacing.sm, paddingHorizontal: spacing.xs }]}>
          <TouchableOpacity onPress={handleBackToSelect}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.timerContainer}>
            <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
            <Body style={{ fontWeight: 'bold', marginLeft: 4 }}>{formatTime(seconds)}</Body>
          </View>
          <View style={styles.topBarRight}>
            <Badge
              label={`${foundWords.size}/${puzzle.placedWords.length}`}
            />
          </View>
        </View>

        {/* Grid */}
        <View
          style={[
            styles.gridContainer,
            {
              backgroundColor: colors.surface,
              borderRadius: 8,
              padding: spacing.xs,
              alignSelf: 'center',
            },
          ]}
        >
          {puzzle.grid.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.gridRow}>
              {row.map((char, colIdx) => {
                const cellKey = `${rowIdx}-${colIdx}`;
                const isFound = foundCells.has(cellKey);
                const isHinted = hintCells.has(cellKey);
                const isSelected =
                  selectedStart !== null &&
                  selectedStart.row === rowIdx &&
                  selectedStart.col === colIdx;

                let bgColor = colors.background;
                if (isFound) {
                  bgColor = colors.primary + '30';
                } else if (isHinted) {
                  bgColor = colors.warning + '30';
                }
                if (isSelected) {
                  bgColor = colors.primary + '60';
                }

                return (
                  <TouchableOpacity
                    key={colIdx}
                    onPress={() => handleCellPress(rowIdx, colIdx)}
                    activeOpacity={0.6}
                    style={[
                      styles.cell,
                      {
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: bgColor,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.cellText,
                        {
                          fontSize: cellSize * 0.5,
                          color: isFound ? colors.primary : colors.text,
                          fontWeight: isFound || isSelected ? 'bold' : 'normal',
                        },
                      ]}
                    >
                      {char}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Selection hint */}
        {selectedStart && (
          <Caption
            style={{
              textAlign: 'center',
              marginTop: spacing.xs,
              color: colors.primary,
            }}
          >
            始点を選択中 — 終点のセルをタップしてください
          </Caption>
        )}

        {/* Word list */}
        <View style={{ marginTop: spacing.md, paddingHorizontal: spacing.xs }}>
          <H3 style={{ marginBottom: spacing.sm }}>探す単語</H3>
          <View style={styles.wordListContainer}>
            {puzzle.placedWords.map((pw) => {
              const isWordFound = foundWords.has(pw.word);
              return (
                <View
                  key={pw.word}
                  style={[
                    styles.wordChip,
                    {
                      backgroundColor: isWordFound
                        ? colors.primary + '20'
                        : colors.surface,
                      borderColor: isWordFound ? colors.primary : colors.border,
                      paddingHorizontal: spacing.sm,
                      paddingVertical: spacing.xs,
                      marginRight: spacing.xs,
                      marginBottom: spacing.xs,
                    },
                  ]}
                >
                  <Body
                    style={{
                      textDecorationLine: isWordFound ? 'line-through' : 'none',
                      color: isWordFound ? colors.primary : colors.text,
                      fontWeight: isWordFound ? 'bold' : 'normal',
                      fontSize: 14,
                    }}
                  >
                    {isWordFound ? '✓ ' : ''}
                    {pw.word}
                  </Body>
                </View>
              );
            })}
          </View>
        </View>

        {/* Action buttons */}
        <View style={{ gap: spacing.sm, marginTop: spacing.md, paddingHorizontal: spacing.xs }}>
          <Button
            title="ヒント（広告を見る）"
            onPress={handleHint}
            variant="outline"
          />
          <Button title="リセット" onPress={handleReset} variant="ghost" />
        </View>
        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridContainer: {
    alignItems: 'center',
  },
  gridRow: {
    flexDirection: 'row',
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
  },
  cellText: {
    textAlign: 'center',
  },
  optionCard: {
    padding: 14,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sizeRow: {
    flexDirection: 'row',
  },
  sizeCard: {
    padding: 14,
    alignItems: 'center',
  },
  completedContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  statsBox: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  wordListContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  wordChip: {
    borderRadius: 20,
    borderWidth: 1,
  },
});
