/**
 * theme.ts — THEME_PRESETS 全プリセット構造テスト
 */
import { THEME_PRESETS } from '../theme';
import type { ThemeId, TanrenThemeColors } from '../theme';

// ── 期待される全テーマID（27種）────────────────────────────────────────────────
const ALL_THEME_IDS: ThemeId[] = [
  // ライトテーマ（5種）
  'shirotae', 'hakuji', 'hanagumori', 'seiji', 'usufuji',
  // モノクロテーマ（2種）
  'hakukou', 'tetsuboku',
  // ダークテーマ 既存（8種）
  'tanren', 'tamahagane', 'shuurushi', 'suiran', 'geppaku', 'shiden', 'sumizome', 'kuroshio',
  // ダークテーマ 追加（3種）
  'sakuraen', 'moegi', 'shokou',
  // 墨彩テーマ（6種）
  'bokuen', 'bokusei', 'bokusui', 'hakuen', 'hakusei', 'hakusui',
  // 渋彩テーマ（3種）
  'kaihaku', 'sabiiro', 'kohai',
];

// ── 必須カラーフィールド ────────────────────────────────────────────────────────
const REQUIRED_COLOR_KEYS: Array<keyof TanrenThemeColors> = [
  'background', 'surface1', 'surface2',
  'textPrimary', 'textSecondary', 'textTertiary',
  'accent', 'accentDim',
  'success', 'separator', 'error',
  'onAccent', 'scrim',
  'tabBarBg', 'tabBarBorder',
];

// ── ライトテーマID ─────────────────────────────────────────────────────────────
const LIGHT_THEME_IDS: ThemeId[] = [
  'shirotae', 'hakuji', 'hanagumori', 'seiji', 'usufuji',
  'hakukou', 'hakuen', 'hakusei', 'hakusui', 'kaihaku',
];

describe('THEME_PRESETS', () => {
  test('全テーマIDがプリセットに存在する', () => {
    for (const id of ALL_THEME_IDS) {
      expect(THEME_PRESETS).toHaveProperty(id);
    }
  });

  test('THEME_PRESTSのキー数が期待値と一致する', () => {
    expect(Object.keys(THEME_PRESETS)).toHaveLength(ALL_THEME_IDS.length);
  });

  describe.each(ALL_THEME_IDS)('プリセット: %s', (id) => {
    const preset = THEME_PRESETS[id];

    test('meta.id がキーと一致する', () => {
      expect(preset.meta.id).toBe(id);
    });

    test('meta.name が空でない', () => {
      expect(preset.meta.name.length).toBeGreaterThan(0);
    });

    test('meta.accentLabel が空でない', () => {
      expect(preset.meta.accentLabel.length).toBeGreaterThan(0);
    });

    test.each(REQUIRED_COLOR_KEYS)('colors.%s が文字列', (key) => {
      expect(typeof preset.colors[key]).toBe('string');
      expect(preset.colors[key]!.length).toBeGreaterThan(0);
    });
  });

  describe('isLight フラグ', () => {
    test.each(LIGHT_THEME_IDS)('%s は isLight: true', (id) => {
      expect(THEME_PRESETS[id].meta.isLight).toBe(true);
    });

    const darkThemeIds = ALL_THEME_IDS.filter(id => !LIGHT_THEME_IDS.includes(id));

    test.each(darkThemeIds)('%s は isLight が true でない', (id) => {
      expect(THEME_PRESETS[id].meta.isLight).not.toBe(true);
    });
  });
});
