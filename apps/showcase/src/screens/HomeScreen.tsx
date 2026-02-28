import React from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, H1, H2, Body, Caption } from '@massapp/ui';
import { ScreenWrapper } from '@massapp/navigation';

interface AppEntry {
  id: string;
  displayName: string;
  description: string;
  icon: string;
  theme: string;
  color: string;
}

const APPS: AppEntry[] = [
  { id: 'sudoku', displayName: '数独', description: '9x9数字パズル', icon: '🔢', theme: 'ocean-blue', color: '#1976D2' },
  { id: 'solitaire', displayName: 'ソリティア', description: 'クロンダイクカードゲーム', icon: '🃏', theme: 'forest-green', color: '#388E3C' },
  { id: 'kanji-quiz', displayName: '漢字クイズ', description: '漢字の読み方クイズ', icon: '漢', theme: 'sakura-pink', color: '#E91E63' },
  { id: 'driving-test-quiz', displayName: '運転免許', description: '学科試験○×クイズ', icon: '🚗', theme: 'midnight-navy', color: '#1A237E' },
  { id: 'nonogram', displayName: 'お絵かきロジック', description: 'ノノグラムパズル', icon: '🎨', theme: 'sunset-purple', color: '#7B1FA2' },
  { id: 'number-puzzle-2048', displayName: '2048', description: '数字スライドパズル', icon: '🔲', theme: 'warm-orange', color: '#E65100' },
  { id: 'reversi', displayName: 'リバーシ', description: 'AI対戦オセロ', icon: '⚫', theme: 'monochrome', color: '#424242' },
  { id: 'minesweeper', displayName: 'マインスイーパー', description: '地雷除去パズル', icon: '💣', theme: 'earth-brown', color: '#5D4037' },
  { id: 'toeic-quiz', displayName: 'TOEIC対策', description: '単語・文法クイズ', icon: '📚', theme: 'neon-cyber', color: '#00BCD4' },
  { id: 'todofuken-quiz', displayName: '都道府県クイズ', description: '47都道府県マスター', icon: '🗾', theme: 'coral-reef', color: '#FF7043' },
  { id: 'spi-quiz', displayName: 'SPI対策', description: '非言語・言語問題', icon: '📊', theme: 'midnight-navy', color: '#1A237E' },
  { id: 'math-puzzle', displayName: '数学パズル', description: '計算チャレンジ', icon: '➕', theme: 'ocean-blue', color: '#1565C0' },
  { id: 'flag-quiz', displayName: '国旗クイズ', description: '世界の国旗当て', icon: '🏁', theme: 'coral-reef', color: '#E64A19' },
  { id: 'english-vocab-quiz', displayName: '英単語クイズ', description: '英単語マスター', icon: '🔤', theme: 'neon-cyber', color: '#0097A7' },
  { id: 'kanji-kentei-quiz', displayName: '漢字検定', description: '漢検対策クイズ', icon: '📝', theme: 'sakura-pink', color: '#C2185B' },
  { id: 'eiken-quiz', displayName: '英検対策', description: '英検クイズ', icon: '🎓', theme: 'mint-fresh', color: '#00897B' },
  { id: 'nandoku-kanji', displayName: '難読漢字', description: '難読漢字チャレンジ', icon: '難', theme: 'earth-brown', color: '#4E342E' },
  { id: 'kakuro', displayName: 'カックロ', description: '加算クロスパズル', icon: '✏️', theme: 'warm-orange', color: '#EF6C00' },
  { id: 'word-search', displayName: 'ワードサーチ', description: 'カタカナ単語探し', icon: '🔍', theme: 'pastel-dream', color: '#7986CB' },
  { id: 'crossword-jp', displayName: 'クロスワード', description: '日本語クロスワード', icon: '📰', theme: 'forest-green', color: '#2E7D32' },
  { id: 'slide-puzzle', displayName: 'スライドパズル', description: '数字スライド', icon: '🧩', theme: 'sunset-purple', color: '#6A1B9A' },
  { id: 'logic-puzzle', displayName: 'ロジックパズル', description: '論理推理ゲーム', icon: '🧠', theme: 'midnight-navy', color: '#283593' },
  { id: 'color-puzzle', displayName: 'カラーパズル', description: '色塗りフラッド', icon: '🎨', theme: 'pastel-dream', color: '#5C6BC0' },
  { id: 'anagram', displayName: 'アナグラム', description: '文字並べ替え', icon: '🔠', theme: 'mint-fresh', color: '#00796B' },
  { id: 'connect-dots', displayName: '点つなぎ', description: 'ナンバーリンク', icon: '✨', theme: 'neon-cyber', color: '#00ACC1' },
  { id: 'fill-puzzle', displayName: 'フィルパズル', description: '数字埋めパズル', icon: '🔢', theme: 'warm-orange', color: '#F57C00' },
  { id: 'maze-puzzle', displayName: '迷路', description: '迷路脱出ゲーム', icon: '🏃', theme: 'forest-green', color: '#1B5E20' },
  { id: 'tower-of-hanoi', displayName: 'ハノイの塔', description: 'ディスク移動パズル', icon: '🗼', theme: 'monochrome', color: '#37474F' },
  { id: 'number-guessing', displayName: '数当てゲーム', description: 'ヒット&ブロー', icon: '🎯', theme: 'coral-reef', color: '#D84315' },
  { id: 'hangman', displayName: 'ハングマン', description: '英単語推測', icon: '💀', theme: 'earth-brown', color: '#3E2723' },
  { id: 'tic-tac-toe', displayName: '三目並べ', description: '○×ゲーム', icon: '⭕', theme: 'ocean-blue', color: '#1976D2' },
  { id: 'connect-four', displayName: '四目並べ', description: '重力付き四目', icon: '🔴', theme: 'sakura-pink', color: '#AD1457' },
  { id: 'gomoku', displayName: '五目並べ', description: '五目ならべAI', icon: '⚪', theme: 'monochrome', color: '#455A64' },
  { id: 'lights-out', displayName: 'ライツアウト', description: 'ライト消灯パズル', icon: '💡', theme: 'neon-cyber', color: '#006064' },
  { id: 'freecell', displayName: 'フリーセル', description: 'フリーセルカード', icon: '♠️', theme: 'forest-green', color: '#33691E' },
  { id: 'spot-the-difference', displayName: '間違い探し', description: '2枚の絵の違い', icon: '👀', theme: 'pastel-dream', color: '#9575CD' },
  { id: 'pipe-puzzle', displayName: 'パイプパズル', description: '配管つなぎ', icon: '🔧', theme: 'earth-brown', color: '#795548' },
  { id: 'tangram', displayName: 'タングラム', description: '図形パズル', icon: '📐', theme: 'sunset-purple', color: '#8E24AA' },
  { id: 'kakuro-hard', displayName: 'カックロ上級', description: '上級加算パズル', icon: '🧮', theme: 'warm-orange', color: '#E65100' },
  { id: 'killer-sudoku', displayName: 'キラー数独', description: 'サム数独', icon: '🔥', theme: 'midnight-navy', color: '#0D47A1' },
  { id: 'emoji-quiz', displayName: '絵文字クイズ', description: '絵文字で連想', icon: '😊', theme: 'pastel-dream', color: '#AB47BC' },
  { id: 'logo-quiz', displayName: 'ロゴクイズ', description: '企業ロゴ当て', icon: '🏢', theme: 'monochrome', color: '#546E7A' },
  { id: 'yojijukugo-quiz', displayName: '四字熟語', description: '四字熟語クイズ', icon: '四', theme: 'sakura-pink', color: '#D81B60' },
  { id: 'kotowaza-quiz', displayName: 'ことわざ', description: 'ことわざクイズ', icon: '📖', theme: 'earth-brown', color: '#6D4C41' },
  { id: 'capital-quiz', displayName: '首都クイズ', description: '世界の首都', icon: '🌍', theme: 'coral-reef', color: '#FF5722' },
  { id: 'history-quiz', displayName: '日本史クイズ', description: '日本史問題集', icon: '⛩️', theme: 'midnight-navy', color: '#1A237E' },
  { id: 'world-history-quiz', displayName: '世界史クイズ', description: '世界史問題集', icon: '🌐', theme: 'ocean-blue', color: '#0D47A1' },
  { id: 'science-quiz', displayName: '理科クイズ', description: '科学の基礎', icon: '🔬', theme: 'mint-fresh', color: '#00695C' },
  { id: 'animal-quiz', displayName: '動物クイズ', description: '動物雑学', icon: '🐾', theme: 'forest-green', color: '#388E3C' },
  { id: 'food-quiz', displayName: '食べ物クイズ', description: '食の雑学', icon: '🍣', theme: 'warm-orange', color: '#FF6F00' },
];

const screenWidth = Dimensions.get('window').width;
const CARD_WIDTH = (screenWidth - 48) / 2;

export function HomeScreen() {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation<any>();

  const renderApp = ({ item }: { item: AppEntry }) => (
    <TouchableOpacity
      style={[
        styles.card,
        {
          width: CARD_WIDTH,
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          marginBottom: spacing.md,
        },
      ]}
      onPress={() =>
        navigation.navigate('AppPreview', {
          appId: item.id,
          displayName: item.displayName,
        })
      }
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.iconArea,
          { backgroundColor: item.color, borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md },
        ]}
      >
        <Body style={styles.icon}>{item.icon}</Body>
      </View>
      <View style={{ padding: spacing.sm }}>
        <H2 style={{ fontSize: 14 }}>{item.displayName}</H2>
        <Caption>{item.description}</Caption>
        <Caption color={item.color}>{item.theme}</Caption>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper showBanner={false}>
      <View style={[styles.container, { padding: spacing.md }]}>
        <View style={{ marginBottom: spacing.md }}>
          <H1 style={{ fontSize: 22 }}>全50アプリカタログ</H1>
          <Body color={colors.textSecondary}>タップしてゲーム画面をプレビュー</Body>
        </View>
        <FlatList
          data={APPS}
          renderItem={renderApp}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: spacing.md }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconArea: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 28,
  },
});
