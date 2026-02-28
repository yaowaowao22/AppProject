import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRoute } from '@react-navigation/native';
import {
  ThemeProvider,
  useTheme,
  H1,
  H2,
  Body,
  Caption,
  Card,
  Badge,
  Divider,
  presetOceanBlue,
  presetForestGreen,
  presetSakuraPink,
  presetMidnightNavy,
  presetSunsetPurple,
  presetWarmOrange,
  presetMonochrome,
  presetEarthBrown,
  presetNeonCyber,
  presetCoralReef,
  presetPastelDream,
  presetMintFresh,
} from '@massapp/ui';
import { AdProvider, AD_CONFIG_GAME } from '@massapp/ads';
import { ScreenWrapper } from '@massapp/navigation';
import type { ThemeConfig } from '@massapp/ui';

// Import each app's GameScreen for preview
import { GameScreen as SudokuGame } from '../../../sudoku/src/screens/GameScreen';
import { GameScreen as SolitaireGame } from '../../../solitaire/src/screens/GameScreen';
import { GameScreen as KanjiGame } from '../../../kanji-quiz/src/screens/GameScreen';
import { GameScreen as DrivingGame } from '../../../driving-test-quiz/src/screens/GameScreen';
import { GameScreen as NonogramGame } from '../../../nonogram/src/screens/GameScreen';
import { GameScreen as Game2048 } from '../../../number-puzzle-2048/src/screens/GameScreen';
import { GameScreen as ReversiGame } from '../../../reversi/src/screens/GameScreen';
import { GameScreen as MinesweeperGame } from '../../../minesweeper/src/screens/GameScreen';
import { GameScreen as ToeicGame } from '../../../toeic-quiz/src/screens/GameScreen';
import { GameScreen as TodofukenGame } from '../../../todofuken-quiz/src/screens/GameScreen';
import { GameScreen as SpiGame } from '../../../spi-quiz/src/screens/GameScreen';
import { GameScreen as MathGame } from '../../../math-puzzle/src/screens/GameScreen';
import { GameScreen as FlagGame } from '../../../flag-quiz/src/screens/GameScreen';
import { GameScreen as EnglishVocabGame } from '../../../english-vocab-quiz/src/screens/GameScreen';
import { GameScreen as KanjiKenteiGame } from '../../../kanji-kentei-quiz/src/screens/GameScreen';
import { GameScreen as EikenGame } from '../../../eiken-quiz/src/screens/GameScreen';
import { GameScreen as NandokuGame } from '../../../nandoku-kanji/src/screens/GameScreen';
import { GameScreen as KakuroGame } from '../../../kakuro/src/screens/GameScreen';
import { GameScreen as WordSearchGame } from '../../../word-search/src/screens/GameScreen';
import { GameScreen as CrosswordGame } from '../../../crossword-jp/src/screens/GameScreen';
import { GameScreen as SlideGame } from '../../../slide-puzzle/src/screens/GameScreen';
import { GameScreen as LogicGame } from '../../../logic-puzzle/src/screens/GameScreen';
import { GameScreen as ColorGame } from '../../../color-puzzle/src/screens/GameScreen';
import { GameScreen as AnagramGame } from '../../../anagram/src/screens/GameScreen';
import { GameScreen as ConnectDotsGame } from '../../../connect-dots/src/screens/GameScreen';
import { GameScreen as FillGame } from '../../../fill-puzzle/src/screens/GameScreen';
import { GameScreen as MazeGame } from '../../../maze-puzzle/src/screens/GameScreen';
import { GameScreen as HanoiGame } from '../../../tower-of-hanoi/src/screens/GameScreen';
import { GameScreen as NumberGuessingGame } from '../../../number-guessing/src/screens/GameScreen';
import { GameScreen as HangmanGame } from '../../../hangman/src/screens/GameScreen';
import { GameScreen as TicTacToeGame } from '../../../tic-tac-toe/src/screens/GameScreen';
import { GameScreen as ConnectFourGame } from '../../../connect-four/src/screens/GameScreen';
import { GameScreen as GomokuGame } from '../../../gomoku/src/screens/GameScreen';
import { GameScreen as LightsOutGame } from '../../../lights-out/src/screens/GameScreen';
import { GameScreen as FreecellGame } from '../../../freecell/src/screens/GameScreen';
import { GameScreen as SpotDiffGame } from '../../../spot-the-difference/src/screens/GameScreen';
import { GameScreen as PipeGame } from '../../../pipe-puzzle/src/screens/GameScreen';
import { GameScreen as TangramGame } from '../../../tangram/src/screens/GameScreen';
import { GameScreen as KakuroHardGame } from '../../../kakuro-hard/src/screens/GameScreen';
import { GameScreen as KillerSudokuGame } from '../../../killer-sudoku/src/screens/GameScreen';
import { GameScreen as EmojiGame } from '../../../emoji-quiz/src/screens/GameScreen';
import { GameScreen as LogoGame } from '../../../logo-quiz/src/screens/GameScreen';
import { GameScreen as YojijukugoGame } from '../../../yojijukugo-quiz/src/screens/GameScreen';
import { GameScreen as KotowazaGame } from '../../../kotowaza-quiz/src/screens/GameScreen';
import { GameScreen as CapitalGame } from '../../../capital-quiz/src/screens/GameScreen';
import { GameScreen as HistoryGame } from '../../../history-quiz/src/screens/GameScreen';
import { GameScreen as WorldHistoryGame } from '../../../world-history-quiz/src/screens/GameScreen';
import { GameScreen as ScienceGame } from '../../../science-quiz/src/screens/GameScreen';
import { GameScreen as AnimalGame } from '../../../animal-quiz/src/screens/GameScreen';
import { GameScreen as FoodGame } from '../../../food-quiz/src/screens/GameScreen';

const dummyAdConfig = {
  unitIds: {
    banner: { android: 'ca-app-pub-3940256099942544/6300978111', ios: 'ca-app-pub-3940256099942544/2934735716' },
    interstitial: { android: 'ca-app-pub-3940256099942544/1033173712', ios: 'ca-app-pub-3940256099942544/4411468910' },
    rewarded: { android: 'ca-app-pub-3940256099942544/5224354917', ios: 'ca-app-pub-3940256099942544/1712485313' },
  },
  adsDisabled: true,
  ...AD_CONFIG_GAME,
  interstitialFrequency: AD_CONFIG_GAME.interstitialFrequency!,
  interstitialInitialDelay: AD_CONFIG_GAME.interstitialInitialDelay!,
  showBanner: false,
};

interface AppConfig {
  theme: ThemeConfig;
  GameComponent: React.ComponentType<any>;
  screens: string[];
}

const APP_MAP: Record<string, AppConfig> = {
  sudoku: {
    theme: { ...presetOceanBlue, name: 'sudoku' },
    GameComponent: SudokuGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  solitaire: {
    theme: { ...presetForestGreen, name: 'solitaire' },
    GameComponent: SolitaireGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  'kanji-quiz': {
    theme: { ...presetSakuraPink, name: 'kanji-quiz' },
    GameComponent: KanjiGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  'driving-test-quiz': {
    theme: { ...presetMidnightNavy, name: 'driving-test-quiz' },
    GameComponent: DrivingGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  nonogram: {
    theme: { ...presetSunsetPurple, name: 'nonogram' },
    GameComponent: NonogramGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  'number-puzzle-2048': {
    theme: { ...presetWarmOrange, name: 'number-puzzle-2048' },
    GameComponent: Game2048,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  reversi: {
    theme: { ...presetMonochrome, name: 'reversi' },
    GameComponent: ReversiGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  minesweeper: {
    theme: { ...presetEarthBrown, name: 'minesweeper' },
    GameComponent: MinesweeperGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  'toeic-quiz': {
    theme: { ...presetNeonCyber, name: 'toeic-quiz' },
    GameComponent: ToeicGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  'todofuken-quiz': {
    theme: { ...presetCoralReef, name: 'todofuken-quiz' },
    GameComponent: TodofukenGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  'spi-quiz': {
    theme: { ...presetMidnightNavy, name: 'spi-quiz' },
    GameComponent: SpiGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  'math-puzzle': {
    theme: { ...presetOceanBlue, name: 'math-puzzle' },
    GameComponent: MathGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  'flag-quiz': {
    theme: { ...presetCoralReef, name: 'flag-quiz' },
    GameComponent: FlagGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  'english-vocab-quiz': {
    theme: { ...presetNeonCyber, name: 'english-vocab-quiz' },
    GameComponent: EnglishVocabGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  'kanji-kentei-quiz': {
    theme: { ...presetSakuraPink, name: 'kanji-kentei-quiz' },
    GameComponent: KanjiKenteiGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  'eiken-quiz': {
    theme: { ...presetMintFresh, name: 'eiken-quiz' },
    GameComponent: EikenGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  'nandoku-kanji': {
    theme: { ...presetEarthBrown, name: 'nandoku-kanji' },
    GameComponent: NandokuGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  kakuro: {
    theme: { ...presetWarmOrange, name: 'kakuro' },
    GameComponent: KakuroGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  'word-search': {
    theme: { ...presetPastelDream, name: 'word-search' },
    GameComponent: WordSearchGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  'crossword-jp': {
    theme: { ...presetForestGreen, name: 'crossword-jp' },
    GameComponent: CrosswordGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  'slide-puzzle': {
    theme: { ...presetSunsetPurple, name: 'slide-puzzle' },
    GameComponent: SlideGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  'logic-puzzle': {
    theme: { ...presetMidnightNavy, name: 'logic-puzzle' },
    GameComponent: LogicGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  'color-puzzle': {
    theme: { ...presetPastelDream, name: 'color-puzzle' },
    GameComponent: ColorGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  anagram: {
    theme: { ...presetMintFresh, name: 'anagram' },
    GameComponent: AnagramGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  'connect-dots': {
    theme: { ...presetNeonCyber, name: 'connect-dots' },
    GameComponent: ConnectDotsGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  'fill-puzzle': {
    theme: { ...presetWarmOrange, name: 'fill-puzzle' },
    GameComponent: FillGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  'maze-puzzle': {
    theme: { ...presetForestGreen, name: 'maze-puzzle' },
    GameComponent: MazeGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  'tower-of-hanoi': {
    theme: { ...presetMonochrome, name: 'tower-of-hanoi' },
    GameComponent: HanoiGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  'number-guessing': {
    theme: { ...presetCoralReef, name: 'number-guessing' },
    GameComponent: NumberGuessingGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  hangman: {
    theme: { ...presetEarthBrown, name: 'hangman' },
    GameComponent: HangmanGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  'tic-tac-toe': {
    theme: { ...presetOceanBlue, name: 'tic-tac-toe' },
    GameComponent: TicTacToeGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  'connect-four': {
    theme: { ...presetSakuraPink, name: 'connect-four' },
    GameComponent: ConnectFourGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  gomoku: {
    theme: { ...presetMonochrome, name: 'gomoku' },
    GameComponent: GomokuGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  'lights-out': {
    theme: { ...presetNeonCyber, name: 'lights-out' },
    GameComponent: LightsOutGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  freecell: {
    theme: { ...presetForestGreen, name: 'freecell' },
    GameComponent: FreecellGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  'spot-the-difference': {
    theme: { ...presetPastelDream, name: 'spot-the-difference' },
    GameComponent: SpotDiffGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  'pipe-puzzle': {
    theme: { ...presetEarthBrown, name: 'pipe-puzzle' },
    GameComponent: PipeGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  tangram: {
    theme: { ...presetSunsetPurple, name: 'tangram' },
    GameComponent: TangramGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  'kakuro-hard': {
    theme: { ...presetWarmOrange, name: 'kakuro-hard' },
    GameComponent: KakuroHardGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  'killer-sudoku': {
    theme: { ...presetMidnightNavy, name: 'killer-sudoku' },
    GameComponent: KillerSudokuGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  'emoji-quiz': {
    theme: { ...presetPastelDream, name: 'emoji-quiz' },
    GameComponent: EmojiGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  'logo-quiz': {
    theme: { ...presetMonochrome, name: 'logo-quiz' },
    GameComponent: LogoGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  'yojijukugo-quiz': {
    theme: { ...presetSakuraPink, name: 'yojijukugo-quiz' },
    GameComponent: YojijukugoGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  'kotowaza-quiz': {
    theme: { ...presetEarthBrown, name: 'kotowaza-quiz' },
    GameComponent: KotowazaGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  'capital-quiz': {
    theme: { ...presetCoralReef, name: 'capital-quiz' },
    GameComponent: CapitalGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  'history-quiz': {
    theme: { ...presetMidnightNavy, name: 'history-quiz' },
    GameComponent: HistoryGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  'world-history-quiz': {
    theme: { ...presetOceanBlue, name: 'world-history-quiz' },
    GameComponent: WorldHistoryGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  'science-quiz': {
    theme: { ...presetMintFresh, name: 'science-quiz' },
    GameComponent: ScienceGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  'animal-quiz': {
    theme: { ...presetForestGreen, name: 'animal-quiz' },
    GameComponent: AnimalGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
  'food-quiz': {
    theme: { ...presetWarmOrange, name: 'food-quiz' },
    GameComponent: FoodGame,
    screens: ['TitleScreen', 'GameScreen', 'HistoryScreen', 'SettingsScreen'],
  },
};

export function AppPreviewScreen() {
  const route = useRoute<any>();
  const { colors, spacing } = useTheme();
  const appId: string = route.params?.appId ?? '';
  const config = APP_MAP[appId];

  if (!config) {
    return (
      <ScreenWrapper showBanner={false}>
        <View style={styles.center}>
          <H1>アプリが見つかりません</H1>
          <Body color={colors.textSecondary}>{appId}</Body>
        </View>
      </ScreenWrapper>
    );
  }

  const { theme, GameComponent, screens } = config;

  return (
    <ThemeProvider theme={theme}>
      <AdProvider config={dummyAdConfig}>
        <View style={[styles.container, { backgroundColor: theme.colors.light.background }]}>
          <View style={[styles.infoBar, { padding: spacing.sm, backgroundColor: theme.colors.light.surface }]}>
            <View style={styles.infoRow}>
              <Badge label={appId} />
              <Caption color={theme.colors.light.textSecondary}>
                画面: {screens.join(' / ')}
              </Caption>
            </View>
          </View>
          <View style={styles.preview}>
            <GameComponent />
          </View>
        </View>
      </AdProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBar: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  preview: {
    flex: 1,
  },
});
