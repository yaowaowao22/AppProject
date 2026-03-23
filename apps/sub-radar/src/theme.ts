import { presetForestGreen } from '@massapp/ui';
import type { ThemeConfig } from '@massapp/ui';

// push-notify の presetMidnightNavy パターンをベースに
// SubRadar 用のプライマリカラー（緑系）へ変更
export const theme: ThemeConfig = {
  ...presetForestGreen,
  name: 'sub-radar',
  colors: {
    ...presetForestGreen.colors,
    light: {
      ...presetForestGreen.colors.light,
      primary:      '#00897B', // Teal Green（SubRadarブランドカラー）
      primaryDark:  '#00695C',
      primaryLight: '#4DB6AC',
      secondary:    '#2E7D32',
      secondaryDark:'#1B5E20',
      accent:       '#26A69A',
    },
    dark: {
      ...presetForestGreen.colors.dark,
      primary:      '#4DB6AC',
      primaryDark:  '#00897B',
      primaryLight: '#80CBC4',
      secondary:    '#66BB6A',
      secondaryDark:'#388E3C',
      accent:       '#80CBC4',
    },
  },
};
