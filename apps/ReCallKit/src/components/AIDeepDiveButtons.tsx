// ============================================================
// AIDeepDiveButtons - ChatGPT・Gemini・Claude ディープリンクボタン
// 回答表示後にプロンプトをクリップボードコピー → 対応AIアプリを開く
// ============================================================

import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { TypeScale } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';

export interface AIDeepDiveButtonsProps {
  question: string; // item.title
  answer: string;   // item.content
}

interface AIService {
  label: string;
  scheme: string;
  webUrl: string;
  color: string;
  bg: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

const AI_SERVICES: AIService[] = [
  {
    label: 'ChatGPT',
    scheme: 'chatgpt://',
    webUrl: 'https://chatgpt.com/',
    color: '#10a37f',
    bg: '#10a37f1A',
    icon: 'sparkles-outline',
  },
  {
    label: 'Gemini',
    scheme: 'googlegemini://',
    webUrl: 'https://gemini.google.com/app',
    color: '#4285F4',
    bg: '#4285F41A',
    icon: 'diamond-outline',
  },
  {
    label: 'Claude',
    scheme: 'claude://',
    webUrl: 'https://claude.ai/new',
    color: '#D97706',
    bg: '#D977061A',
    icon: 'chatbubble-outline',
  },
];

export function AIDeepDiveButtons({ question, answer }: AIDeepDiveButtonsProps) {
  const { colors } = useTheme();

  async function handlePress(service: AIService) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const promptText = `以下の学習内容について、より深く理解するために詳しく解説してください。

【問題】
${question}

【回答】
${answer}`;

    await Clipboard.setStringAsync(promptText);

    Alert.alert('コピー完了', 'プロンプトをコピーしました。AIアプリに貼り付けてください');

    const canOpen = await Linking.canOpenURL(service.scheme);
    const url = canOpen ? service.scheme : service.webUrl;
    await Linking.openURL(url);
  }

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.sectionLabel, { color: colors.labelTertiary }]}>
        AIで深掘り
      </Text>
      <View style={styles.row}>
        {AI_SERVICES.map((service) => (
          <Pressable
            key={service.label}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: service.bg,
                borderColor: service.color,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
            onPress={() => handlePress(service)}
            accessibilityRole="button"
            accessibilityLabel={`${service.label}で深掘り`}
          >
            <Ionicons name={service.icon} size={14} color={service.color} />
            <Text style={[styles.buttonLabel, { color: service.color }]}>
              {service.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.xs,
    paddingHorizontal: Spacing.m,
  },
  sectionLabel: {
    ...TypeScale.footnote,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    minHeight: 44,
    borderRadius: Radius.m,
    borderWidth: 1,
    paddingHorizontal: Spacing.s,
  },
  buttonLabel: {
    ...TypeScale.footnote,
    fontWeight: '600',
  },
});
