import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { useTheme, H1, H2, Body, Caption, Button, Card } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';
import { useInterstitialAd, useRewardedAd } from '@massapp/ads';
import { useLocalStorage } from '@massapp/hooks';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORIES, getRandomWord } from '../data/words';
import type { WordCategory } from '../data/words';

const MAX_WRONG = 7;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const KATAKANA_ROWS: string[][] = [
  ['ア', 'イ', 'ウ', 'エ', 'オ'],
  ['カ', 'キ', 'ク', 'ケ', 'コ'],
  ['サ', 'シ', 'ス', 'セ', 'ソ'],
  ['タ', 'チ', 'ツ', 'テ', 'ト'],
  ['ナ', 'ニ', 'ヌ', 'ネ', 'ノ'],
  ['ハ', 'ヒ', 'フ', 'ヘ', 'ホ'],
  ['マ', 'ミ', 'ム', 'メ', 'モ'],
  ['ヤ', '', 'ユ', '', 'ヨ'],
  ['ラ', 'リ', 'ル', 'レ', 'ロ'],
  ['ワ', '', 'ヲ', '', 'ン'],
  ['ガ', 'ギ', 'グ', 'ゲ', 'ゴ'],
  ['ザ', 'ジ', 'ズ', 'ゼ', 'ゾ'],
  ['ダ', 'ヂ', 'ヅ', 'デ', 'ド'],
  ['バ', 'ビ', 'ブ', 'ベ', 'ボ'],
  ['パ', 'ピ', 'プ', 'ペ', 'ポ'],
  ['ャ', '', 'ュ', '', 'ョ'],
  ['ッ', '', 'ー', '', ''],
];

export interface GameResult {
  id: string;
  date: string;
  word: string;
  category: string;
  won: boolean;
  wrongGuesses: number;
}

type GamePhase = 'select' | 'playing' | 'finished';

export function GameScreen() {
  const { colors, spacing } = useTheme();
  const { trackAction } = useInterstitialAd();
  const [results, setResults] = useLocalStorage<GameResult[]>('hangman_results', []);

  const [phase, setPhase] = useState<GamePhase>('select');
  const [selectedCategory, setSelectedCategory] = useState<WordCategory | undefined>(undefined);
  const [currentWord, setCurrentWord] = useState('');
  const [currentHint, setCurrentHint] = useState('');
  const [currentCategory, setCurrentCategory] = useState('');
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [wrongCount, setWrongCount] = useState(0);
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const [gameWon, setGameWon] = useState(false);

  const { show: showRewardedAd, loaded: rewardedLoaded } = useRewardedAd(() => {
    if (currentWord.length > 0) {
      const hiddenIndices: number[] = [];
      for (let i = 0; i < currentWord.length; i++) {
        if (!guessedLetters.has(currentWord[i]) && !revealedIndices.has(i)) {
          hiddenIndices.push(i);
        }
      }
      if (hiddenIndices.length > 0) {
        const randomIdx = hiddenIndices[Math.floor(Math.random() * hiddenIndices.length)];
        setRevealedIndices((prev) => new Set(prev).add(randomIdx));
      }
    }
  });

  const startGame = useCallback(
    (category?: WordCategory) => {
      const entry = getRandomWord(category);
      setCurrentWord(entry.word);
      setCurrentHint(entry.hint);
      setCurrentCategory(entry.category);
      setGuessedLetters(new Set());
      setWrongCount(0);
      setRevealedIndices(new Set());
      setGameWon(false);
      setPhase('playing');
    },
    []
  );

  const displayWord = useMemo(() => {
    if (!currentWord) return [];
    return currentWord.split('').map((char, idx) => {
      if (guessedLetters.has(char) || revealedIndices.has(idx)) {
        return char;
      }
      return '_';
    });
  }, [currentWord, guessedLetters, revealedIndices]);

  const handleGuess = useCallback(
    (letter: string) => {
      if (guessedLetters.has(letter) || phase !== 'playing') return;

      const newGuessed = new Set(guessedLetters);
      newGuessed.add(letter);
      setGuessedLetters(newGuessed);

      if (!currentWord.includes(letter)) {
        const newWrongCount = wrongCount + 1;
        setWrongCount(newWrongCount);

        if (newWrongCount >= MAX_WRONG) {
          const result: GameResult = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            word: currentWord,
            category: currentCategory,
            won: false,
            wrongGuesses: newWrongCount,
          };
          setResults([result, ...results]);
          trackAction();
          setGameWon(false);
          setPhase('finished');
        }
      } else {
        const allRevealed = currentWord.split('').every(
          (char, idx) => newGuessed.has(char) || revealedIndices.has(idx)
        );
        if (allRevealed) {
          const result: GameResult = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            word: currentWord,
            category: currentCategory,
            won: true,
            wrongGuesses: wrongCount,
          };
          setResults([result, ...results]);
          trackAction();
          setGameWon(true);
          setPhase('finished');
        }
      }
    },
    [guessedLetters, currentWord, wrongCount, phase, currentCategory, results, setResults, trackAction, revealedIndices]
  );

  const handleHint = useCallback(() => {
    if (rewardedLoaded) {
      showRewardedAd();
    } else {
      Alert.alert('ヒント', '広告の準備ができていません。しばらくお待ちください。');
    }
  }, [rewardedLoaded, showRewardedAd]);

  const handleRetry = useCallback(() => {
    setPhase('select');
  }, []);

  const handlePlayAgain = useCallback(() => {
    startGame(selectedCategory);
  }, [startGame, selectedCategory]);

  const renderHangman = (count: number) => {
    const partColor = colors.text;
    const frameColor = colors.textSecondary;
    return (
      <View style={styles.hangmanContainer}>
        {/* Top bar */}
        {count >= 3 && (
          <View
            style={[
              styles.hangmanTop,
              { backgroundColor: frameColor },
            ]}
          />
        )}
        <View style={styles.hangmanBody}>
          {/* Pole */}
          {count >= 2 && (
            <View
              style={[
                styles.hangmanPole,
                { backgroundColor: frameColor },
              ]}
            />
          )}
          {/* Person area */}
          <View style={styles.hangmanPersonArea}>
            {/* Rope */}
            {count >= 4 && (
              <View
                style={[
                  styles.hangmanRope,
                  { backgroundColor: frameColor },
                ]}
              />
            )}
            {/* Head */}
            {count >= 5 && (
              <View
                style={[
                  styles.hangmanHead,
                  { borderColor: partColor },
                ]}
              />
            )}
            {/* Body */}
            {count >= 6 && (
              <View
                style={[
                  styles.hangmanBodyLine,
                  { backgroundColor: partColor },
                ]}
              />
            )}
            {/* Legs */}
            {count >= 7 && (
              <View style={styles.hangmanLegs}>
                <View
                  style={[
                    styles.hangmanLegLeft,
                    { backgroundColor: partColor },
                  ]}
                />
                <View
                  style={[
                    styles.hangmanLegRight,
                    { backgroundColor: partColor },
                  ]}
                />
              </View>
            )}
          </View>
        </View>
        {/* Base */}
        {count >= 1 && (
          <View
            style={[
              styles.hangmanBase,
              { backgroundColor: frameColor },
            ]}
          />
        )}
      </View>
    );
  };

  const renderCategorySelect = () => (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
    >
      <H2 style={{ marginBottom: spacing.sm }}>カテゴリを選択</H2>
      <Caption
        style={{ marginBottom: spacing.xl, color: colors.textSecondary }}
      >
        好きなカテゴリを選んでゲームを始めましょう
      </Caption>

      <View style={{ gap: spacing.sm }}>
        <TouchableOpacity
          onPress={() => {
            setSelectedCategory(undefined);
            startGame(undefined);
          }}
          style={[
            styles.categoryButton,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
          activeOpacity={0.7}
        >
          <Ionicons name="shuffle" size={24} color={colors.primary} />
          <Body style={{ marginLeft: spacing.sm, fontWeight: 'bold' }}>
            ランダム
          </Body>
        </TouchableOpacity>

        {CATEGORIES.map((cat) => {
          const iconMap: Record<WordCategory, string> = {
            '動物': 'paw',
            '食べ物': 'restaurant',
            '国名': 'globe',
            'スポーツ': 'football',
            '映画': 'film',
            '音楽': 'musical-notes',
            '乗り物': 'car',
          };
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => {
                setSelectedCategory(cat);
                startGame(cat);
              }}
              style={[
                styles.categoryButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <Ionicons
                name={iconMap[cat] as any}
                size={24}
                color={colors.primary}
              />
              <Body style={{ marginLeft: spacing.sm, fontWeight: 'bold' }}>
                {cat}
              </Body>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );

  const renderPlaying = () => {
    const keyWidth = Math.floor((SCREEN_WIDTH - spacing.lg * 2 - 4 * 6) / 5);

    const hiddenCount = currentWord.split('').filter(
      (char, idx) => !guessedLetters.has(char) && !revealedIndices.has(idx)
    ).length;

    return (
      <ScrollView
        style={styles.flex}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
      >
        {/* Header */}
        <View style={[styles.headerRow, { marginBottom: spacing.sm }]}>
          <View style={styles.categoryBadge}>
            <Caption style={{ color: colors.primary, fontWeight: 'bold' }}>
              {currentCategory}
            </Caption>
          </View>
          <Body color={colors.textSecondary}>
            ミス: {wrongCount} / {MAX_WRONG}
          </Body>
        </View>

        {/* Hangman drawing */}
        <Card style={[styles.hangmanCard, { marginBottom: spacing.md }]}>
          {renderHangman(wrongCount)}
        </Card>

        {/* Word display */}
        <View style={[styles.wordContainer, { marginBottom: spacing.md }]}>
          {displayWord.map((char, idx) => (
            <View
              key={idx}
              style={[
                styles.letterSlot,
                {
                  borderBottomColor: char === '_' ? colors.primary : colors.success,
                  minWidth: Math.min(36, (SCREEN_WIDTH - spacing.lg * 2 - currentWord.length * 4) / currentWord.length),
                },
              ]}
            >
              <H2
                style={{
                  color: char === '_' ? 'transparent' : colors.text,
                  fontSize: currentWord.length > 8 ? 18 : 24,
                }}
              >
                {char === '_' ? '＿' : char}
              </H2>
            </View>
          ))}
        </View>

        {/* Hint area */}
        <View
          style={[
            styles.hintRow,
            {
              marginBottom: spacing.md,
              backgroundColor: colors.surface,
              padding: spacing.sm,
              borderRadius: 8,
            },
          ]}
        >
          <Ionicons name="bulb" size={18} color={colors.warning} />
          <Caption
            style={{
              marginLeft: spacing.xs,
              color: colors.textSecondary,
              flex: 1,
            }}
          >
            ヒント: {currentHint}
          </Caption>
        </View>

        {/* Reward hint button */}
        {hiddenCount > 1 && (
          <Button
            title="広告を見て1文字ヒント"
            onPress={handleHint}
            variant="ghost"
            size="sm"
            style={{ marginBottom: spacing.md }}
          />
        )}

        {/* Katakana keyboard */}
        <View style={styles.keyboardContainer}>
          {KATAKANA_ROWS.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.keyboardRow}>
              {row.map((char, charIdx) => {
                if (char === '') {
                  return (
                    <View
                      key={`${rowIdx}-${charIdx}`}
                      style={[styles.keyEmpty, { width: keyWidth, height: keyWidth * 0.85 }]}
                    />
                  );
                }
                const isGuessed = guessedLetters.has(char);
                const isCorrect = isGuessed && currentWord.includes(char);
                const isWrong = isGuessed && !currentWord.includes(char);

                let bgColor = colors.surface;
                let textColor = colors.text;
                let borderColor = colors.border;

                if (isCorrect) {
                  bgColor = colors.success + '33';
                  textColor = colors.success;
                  borderColor = colors.success;
                } else if (isWrong) {
                  bgColor = colors.error + '22';
                  textColor = colors.error + '88';
                  borderColor = colors.error + '44';
                }

                return (
                  <TouchableOpacity
                    key={`${rowIdx}-${charIdx}`}
                    onPress={() => handleGuess(char)}
                    disabled={isGuessed}
                    style={[
                      styles.keyButton,
                      {
                        width: keyWidth,
                        height: keyWidth * 0.85,
                        backgroundColor: bgColor,
                        borderColor: borderColor,
                        opacity: isGuessed ? 0.6 : 1,
                      },
                    ]}
                    activeOpacity={0.6}
                  >
                    <Body
                      style={{
                        color: textColor,
                        fontWeight: 'bold',
                        fontSize: keyWidth > 50 ? 16 : 14,
                      }}
                    >
                      {char}
                    </Body>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderFinished = () => {
    const won = gameWon;
    return (
      <ScrollView
        style={styles.flex}
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: 40,
          alignItems: 'center',
          justifyContent: 'center',
          flexGrow: 1,
        }}
      >
        <Ionicons
          name={won ? 'trophy' : 'sad'}
          size={72}
          color={won ? colors.primary : colors.error}
          style={{ marginBottom: spacing.lg }}
        />

        <H1
          align="center"
          style={{
            marginBottom: spacing.sm,
            color: won ? colors.primary : colors.error,
          }}
        >
          {won ? '正解！' : '残念...'}
        </H1>

        <Body
          color={colors.textSecondary}
          style={{ textAlign: 'center', marginBottom: spacing.lg }}
        >
          {won
            ? `ミス${wrongCount}回で正解しました！`
            : '次は頑張りましょう！'}
        </Body>

        <Card
          style={{
            padding: spacing.xl,
            marginBottom: spacing.xl,
            width: '100%',
            alignItems: 'center',
          }}
        >
          <Caption
            style={{
              marginBottom: spacing.xs,
              color: colors.textSecondary,
            }}
          >
            答え
          </Caption>
          <H1 align="center" style={{ marginBottom: spacing.md }}>
            {currentWord}
          </H1>
          <View style={styles.categoryBadge}>
            <Caption style={{ color: colors.primary, fontWeight: 'bold' }}>
              {currentCategory}
            </Caption>
          </View>
          <Caption
            style={{
              marginTop: spacing.md,
              color: colors.textSecondary,
              textAlign: 'center',
            }}
          >
            {currentHint}
          </Caption>
        </Card>

        <View style={{ gap: spacing.sm, width: '100%' }}>
          <Button title="もう一度遊ぶ" onPress={handlePlayAgain} size="lg" />
          <Button
            title="カテゴリ選択に戻る"
            onPress={handleRetry}
            variant="outline"
            size="lg"
          />
        </View>
      </ScrollView>
    );
  };

  return (
    <ScreenWrapper>
      {phase === 'select' && renderCategorySelect()}
      {phase === 'playing' && renderPlaying()}
      {phase === 'finished' && renderFinished()}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hangmanCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    minHeight: 160,
  },
  hangmanContainer: {
    width: 140,
    height: 140,
    alignItems: 'center',
  },
  hangmanTop: {
    width: 80,
    height: 3,
    alignSelf: 'flex-start',
    marginLeft: 20,
  },
  hangmanBody: {
    flexDirection: 'row',
    flex: 1,
  },
  hangmanPole: {
    width: 3,
    height: '100%',
    marginLeft: 20,
  },
  hangmanPersonArea: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 0,
  },
  hangmanRope: {
    width: 3,
    height: 16,
  },
  hangmanHead: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
  },
  hangmanBodyLine: {
    width: 3,
    height: 30,
  },
  hangmanLegs: {
    flexDirection: 'row',
    width: 36,
    justifyContent: 'space-between',
  },
  hangmanLegLeft: {
    width: 3,
    height: 28,
    transform: [{ rotate: '25deg' }],
    marginLeft: 4,
  },
  hangmanLegRight: {
    width: 3,
    height: 28,
    transform: [{ rotate: '-25deg' }],
    marginRight: 4,
  },
  hangmanBase: {
    width: 80,
    height: 3,
    alignSelf: 'flex-start',
    marginLeft: 0,
  },
  wordContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  letterSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    paddingHorizontal: 4,
    paddingBottom: 2,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  keyboardContainer: {
    gap: 6,
  },
  keyboardRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  keyButton: {
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyEmpty: {
    borderRadius: 6,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
});
