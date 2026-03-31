// TANREN デザイントークン
// 設計思想: 鍛鉄の間（MA）— 余白と一点の炎

// ── カラートークン型 ──────────────────────────────────────────────────────────
export interface TanrenThemeColors {
  background:    string;
  surface1:      string;
  surface2:      string;
  textPrimary:   string;
  textSecondary: string;
  textTertiary:  string;
  accent:        string;
  accentDim:     string;
  success:       string;
  separator:     string;
  error:         string;

  // 追加トークン（S-5）
  onAccent:     string;   // accent 背景上のテキスト/アイコン色
  scrim:        string;   // モーダル・ドロワーのバックドロップ色
  tabBarBg:     string;   // ボトムタブバー背景
  tabBarBorder: string;   // タブバー上端ボーダー

  // カード背景（ライト=#FFFFFF, ダーク=surface1） ThemeContextで自動導出
  cardBackground?: string;
}

// ── テーマID型 ────────────────────────────────────────────────────────────────
export type ThemeId =
  // ライトテーマ（5種）
  | 'shirotae'    // 白妙（古金）
  | 'hakuji'      // 白磁（染付藍）
  | 'hanagumori'  // 花曇（薄紅）
  | 'seiji'       // 青磁（翡翠）
  | 'usufuji'     // 薄藤（藤紫）
  // モノクロテーマ（2種）
  | 'hakukou'     // 白鋼（ライトモノクロ）
  | 'tetsuboku'   // 鉄墨（ダークモノクロ）
  // ダークテーマ（既存8種）
  | 'tanren'
  | 'tamahagane'
  | 'shuurushi'
  | 'suiran'
  | 'geppaku'
  | 'shiden'
  | 'sumizome'
  | 'kuroshio'
  // ダークテーマ（追加3種）
  | 'sakuraen'    // 桜煙（ローズ/ピンク）
  | 'moegi'       // 萌黄（ライム/イエローグリーン）
  | 'shokou'      // 曙光（コーラル/サーモン）
  // モノクロ＋アクセントテーマ（墨彩6種）
  | 'bokuen'      // 墨炎（ダークモノクロ＋オレンジ）
  | 'bokusei'     // 墨青（ダークモノクロ＋ブルー）
  | 'bokusui'     // 墨翠（ダークモノクロ＋グリーン）
  | 'hakuen'      // 白炎（ライトモノクロ＋レッド）
  | 'hakusei'     // 白青（ライトモノクロ＋ブルー）
  | 'hakusui'     // 白翠（ライトモノクロ＋グリーン）
  // 渋彩テーマ（低彩度アクセント3種）
  | 'kaihaku'     // 灰白（ライトモノクロ＋灰鼠）
  | 'sabiiro'     // 錆色（ダークモノクロ＋鉄錆）
  | 'kohai';      // 古灰（ダークモノクロ＋灰青）

// ── テーマメタ情報型 ──────────────────────────────────────────────────────────
export interface ThemeMeta {
  id:          ThemeId;
  name:        string;
  subtitle:    string;
  accentLabel: string;
  isLight?:    boolean;  // ライトテーマの場合 true（未指定=false=ダーク）
}

// ── テーマ定義型 ──────────────────────────────────────────────────────────────
export interface TanrenThemeDefinition {
  meta:   ThemeMeta;
  colors: TanrenThemeColors;
}

// ── テーマプリセット ──────────────────────────────────────────────────────────
export const THEME_PRESETS: Record<ThemeId, TanrenThemeDefinition> = {

  // ── ライトテーマ5種 ───────────────────────────────────────────────────────────
  shirotae: {
    meta: { id: 'shirotae', name: '白妙', subtitle: '神に捧げる白布に、鍛錬の対価が金に灯る', accentLabel: '古金', isLight: true },
    colors: {
      background:    '#FAF8F5',
      surface1:      '#F0EDE6',
      surface2:      '#E6E2DA',
      textPrimary:   '#1C1B18',
      textSecondary: '#6B6560',
      textTertiary:  '#938A80',
      accent:        '#946B12',
      accentDim:     'rgba(148,107,18,0.10)',
      success:       '#2D8E4E',
      separator:     'rgba(0,0,0,0.08)',
      error:         '#C53929',
      onAccent:      '#FFFFFF',
      scrim:         'rgba(0,0,0,0.55)',
      tabBarBg:      '#F0EDE6',
      tabBarBorder:  'rgba(0,0,0,0.08)',
    },
  },
  hakuji: {
    meta: { id: 'hakuji', name: '白磁', subtitle: '冷たい肌理に、藍の一筆が凛と走る', accentLabel: '染付藍', isLight: true },
    colors: {
      background:    '#F7F8FB',
      surface1:      '#EEF0F5',
      surface2:      '#E4E7EF',
      textPrimary:   '#171A21',
      textSecondary: '#5C6478',
      textTertiary:  '#838A9E',
      accent:        '#284F8D',
      accentDim:     'rgba(40,79,141,0.10)',
      success:       '#2D8E4E',
      separator:     'rgba(0,0,0,0.08)',
      error:         '#CC3425',
      onAccent:      '#FFFFFF',
      scrim:         'rgba(0,0,0,0.55)',
      tabBarBg:      '#EEF0F5',
      tabBarBorder:  'rgba(0,0,0,0.08)',
    },
  },
  hanagumori: {
    meta: { id: 'hanagumori', name: '花曇', subtitle: '曇天に滲む薄紅が、鍛練のひと時を彩る', accentLabel: '薄紅', isLight: true },
    colors: {
      background:    '#FBF7F8',
      surface1:      '#F2ECEE',
      surface2:      '#E8E1E3',
      textPrimary:   '#1E171A',
      textSecondary: '#74606A',
      textTertiary:  '#988890',
      accent:        '#9F3C5D',
      accentDim:     'rgba(159,60,93,0.10)',
      success:       '#2D8E4E',
      separator:     'rgba(0,0,0,0.08)',
      error:         '#C53929',
      onAccent:      '#FFFFFF',
      scrim:         'rgba(0,0,0,0.55)',
      tabBarBg:      '#F2ECEE',
      tabBarBorder:  'rgba(0,0,0,0.08)',
    },
  },
  seiji: {
    meta: { id: 'seiji', name: '青磁', subtitle: '千年の翠が、鍛える者の力の色となる', accentLabel: '翡翠', isLight: true },
    colors: {
      background:    '#F5F9F6',
      surface1:      '#ECF1ED',
      surface2:      '#E2E9E4',
      textPrimary:   '#151C17',
      textSecondary: '#546D5A',
      textTertiary:  '#567260',  // P1修正: #7D9584(CR≈2.94) → #567260(CR≈4.97, WCAG AA合格)
      accent:        '#286B46',
      accentDim:     'rgba(40,107,70,0.10)',
      success:       '#3D9455',
      separator:     'rgba(0,0,0,0.08)',
      error:         '#CC3425',
      onAccent:      '#FFFFFF',
      scrim:         'rgba(0,0,0,0.55)',
      tabBarBg:      '#ECF1ED',
      tabBarBorder:  'rgba(0,0,0,0.08)',
    },
  },
  usufuji: {
    meta: { id: 'usufuji', name: '薄藤', subtitle: '朝露に霞む藤棚、静謐な紫が意志を帯びる', accentLabel: '藤紫', isLight: true },
    colors: {
      background:    '#F9F7FB',
      surface1:      '#F0EDF4',
      surface2:      '#E6E2ED',
      textPrimary:   '#1A171E',
      textSecondary: '#68607A',
      textTertiary:  '#8D84A0',
      accent:        '#613F94',
      accentDim:     'rgba(97,63,148,0.10)',
      success:       '#2D8E4E',
      separator:     'rgba(0,0,0,0.08)',
      error:         '#C53929',
      onAccent:      '#FFFFFF',
      scrim:         'rgba(0,0,0,0.55)',
      tabBarBg:      '#F0EDF4',
      tabBarBorder:  'rgba(0,0,0,0.08)',
    },
  },

  // ── モノクロテーマ2種 ─────────────────────────────────────────────────────────
  hakukou: {
    meta: { id: 'hakukou', name: '白鋼', subtitle: '白紙に墨の一滴、それだけで十分', accentLabel: '墨鼠', isLight: true },
    colors: {
      background:    '#F2F2F2',
      surface1:      '#E8E8E8',
      surface2:      '#DCDCDC',
      textPrimary:   '#1A1A1A',
      textSecondary: '#6B6B6B',
      textTertiary:  '#999999',
      accent:        '#2D2D2D',
      accentDim:     'rgba(45,45,45,0.10)',
      success:       '#5A5A5A',
      separator:     'rgba(0,0,0,0.10)',
      error:         '#A04040',
      onAccent:      '#FFFFFF',
      scrim:         'rgba(0,0,0,0.55)',
      tabBarBg:      '#E8E8E8',
      tabBarBorder:  'rgba(0,0,0,0.10)',
    },
  },
  tetsuboku: {
    meta: { id: 'tetsuboku', name: '鉄墨', subtitle: '色を捨てた先に、数字だけが残る', accentLabel: '銀鼠' },
    colors: {
      background:    '#121212',
      surface1:      '#1A1A1A',
      surface2:      '#242424',
      textPrimary:   '#E8E8E8',
      textSecondary: 'rgba(232,232,232,0.58)',
      textTertiary:  'rgba(232,232,232,0.36)',
      accent:        '#8B8B8B',
      accentDim:     'rgba(139,139,139,0.12)',
      success:       '#8A8A8A',
      separator:     'rgba(255,255,255,0.07)',
      error:         '#C47070',
      onAccent:      '#121212',
      scrim:         'rgba(0,0,0,0.60)',
      tabBarBg:      '#1A1A1A',
      tabBarBorder:  'rgba(255,255,255,0.07)',
    },
  },

  // ── ダークテーマ（既存8種） ───────────────────────────────────────────────────
  tanren: {
    meta: { id: 'tanren', name: '鍛鉄', subtitle: '灼熱の一点が闇を穿つ', accentLabel: '灼熱橙' },
    colors: {
      background:    '#111113',
      surface1:      '#191919',
      surface2:      '#222224',
      textPrimary:   '#F5F5F7',
      textSecondary: 'rgba(245,245,247,0.60)',  // M-1: 0.45→0.60 (WCAG AA)
      textTertiary:  'rgba(245,245,247,0.38)',  // M-2: 0.22→0.38 (大テキスト AA)
      accent:        '#D4610F',
      accentDim:     'rgba(212,97,15,0.12)',
      success:       '#2DB55D',
      separator:     'rgba(255,255,255,0.07)',
      error:         '#FF453A',
      onAccent:      '#FFFFFF',
      scrim:         'rgba(0,0,0,0.55)',
      tabBarBg:      '#191919',
      tabBarBorder:  'rgba(255,255,255,0.07)',
    },
  },
  tamahagane: {
    meta: { id: 'tamahagane', name: '玉鋼', subtitle: '最高温は最も冷たい色で現れる', accentLabel: '鍛冶青炎' },
    colors: {
      background:    '#0F1219',
      surface1:      '#151A23',
      surface2:      '#1C222D',
      textPrimary:   '#E8ECF2',
      textSecondary: 'rgba(232,236,242,0.60)',  // M-1
      textTertiary:  'rgba(232,236,242,0.38)',  // M-2
      accent:        '#4496C1',
      accentDim:     'rgba(68,150,193,0.12)',
      success:       '#2DB55D',
      separator:     'rgba(180,200,230,0.07)',
      error:         '#FF5252',
      onAccent:      '#FFFFFF',
      scrim:         'rgba(0,0,0,0.55)',
      tabBarBg:      '#151A23',
      tabBarBorder:  'rgba(180,200,230,0.07)',
    },
  },
  shuurushi: {
    meta: { id: 'shuurushi', name: '朱漆', subtitle: '百層の朱が沈黙の深紅を生む', accentLabel: '漆朱' },
    colors: {
      background:    '#141010',
      surface1:      '#1C1616',
      surface2:      '#241E1E',
      textPrimary:   '#F5F0ED',
      textSecondary: 'rgba(245,240,237,0.60)',  // M-1
      textTertiary:  'rgba(245,240,237,0.38)',  // M-2
      accent:        '#B03535',
      accentDim:     'rgba(176,53,53,0.12)',
      success:       '#2DB55D',
      separator:     'rgba(255,220,210,0.07)',
      error:         '#FF8A65',
      onAccent:      '#FFFFFF',
      scrim:         'rgba(0,0,0,0.55)',
      tabBarBg:      '#1C1616',
      tabBarBorder:  'rgba(255,220,210,0.07)',
    },
  },
  suiran: {
    meta: { id: 'suiran', name: '翠嵐', subtitle: '千年の雨が石に苔を着せる', accentLabel: '苔翠' },
    colors: {
      background:    '#0E1210',
      surface1:      '#151A17',
      surface2:      '#1C221E',
      textPrimary:   '#E8F0EA',
      textSecondary: 'rgba(232,240,234,0.60)',  // M-1
      textTertiary:  'rgba(232,240,234,0.38)',  // M-2
      accent:        '#3B915A',
      accentDim:     'rgba(59,145,90,0.12)',
      success:       '#6ECF8A',
      separator:     'rgba(180,230,200,0.07)',
      error:         '#FF453A',
      onAccent:      '#FFFFFF',
      scrim:         'rgba(0,0,0,0.55)',
      tabBarBg:      '#151A17',
      tabBarBorder:  'rgba(180,230,200,0.07)',
    },
  },
  geppaku: {
    meta: { id: 'geppaku', name: '月白', subtitle: '感情を差し挟まない光の色', accentLabel: '月光藍' },
    colors: {
      background:    '#101214',
      surface1:      '#181B1F',
      surface2:      '#1F2327',
      textPrimary:   '#E8ECF4',
      textSecondary: 'rgba(232,236,244,0.60)',  // M-1
      textTertiary:  'rgba(232,236,244,0.38)',  // M-2
      accent:        '#7296E0',
      accentDim:     'rgba(114,150,224,0.12)',
      success:       '#2DB55D',
      separator:     'rgba(190,210,240,0.07)',
      error:         '#FF5252',
      onAccent:      '#FFFFFF',
      scrim:         'rgba(0,0,0,0.55)',
      tabBarBg:      '#181B1F',
      tabBarBorder:  'rgba(190,210,240,0.07)',
    },
  },
  shiden: {
    meta: { id: 'shiden', name: '紫電', subtitle: '一閃が闇の輪郭を露わにする', accentLabel: '雷紫' },
    colors: {
      background:    '#110F15',
      surface1:      '#191620',
      surface2:      '#211E28',
      textPrimary:   '#F0ECF5',
      textSecondary: 'rgba(240,236,245,0.60)',  // M-1
      textTertiary:  'rgba(240,236,245,0.38)',  // M-2
      accent:        '#8F5AE0',
      accentDim:     'rgba(143,90,224,0.12)',
      success:       '#2DB55D',
      separator:     'rgba(200,190,230,0.07)',
      error:         '#FF453A',
      onAccent:      '#FFFFFF',
      scrim:         'rgba(0,0,0,0.55)',
      tabBarBg:      '#191620',
      tabBarBorder:  'rgba(200,190,230,0.07)',
    },
  },
  sumizome: {
    meta: { id: 'sumizome', name: '墨染', subtitle: '一筆は取り消せない、だから全てを込める', accentLabel: '古金' },
    colors: {
      background:    '#121110',
      surface1:      '#1A1918',
      surface2:      '#232120',
      textPrimary:   '#F0EDE8',
      textSecondary: 'rgba(240,237,232,0.60)',  // M-1
      textTertiary:  'rgba(240,237,232,0.38)',  // M-2
      accent:        '#B19443',
      accentDim:     'rgba(177,148,67,0.12)',
      success:       '#6B9E78',
      separator:     'rgba(230,220,200,0.07)',
      error:         '#E8634A',
      onAccent:      '#FFFFFF',
      scrim:         'rgba(0,0,0,0.55)',
      tabBarBg:      '#1A1918',
      tabBarBorder:  'rgba(230,220,200,0.07)',
    },
  },
  kuroshio: {
    meta: { id: 'kuroshio', name: '黒潮', subtitle: '深い場所の力こそ最も大きい', accentLabel: '深潮' },
    colors: {
      background:    '#0D1214',
      surface1:      '#141B1E',
      surface2:      '#1B2326',
      textPrimary:   '#E4EFF2',
      textSecondary: 'rgba(228,239,242,0.60)',  // M-1
      textTertiary:  'rgba(228,239,242,0.38)',  // M-2
      accent:        '#26A48D',
      accentDim:     'rgba(38,164,141,0.12)',
      success:       '#5CC879',
      separator:     'rgba(160,210,220,0.07)',
      error:         '#FF5252',
      onAccent:      '#FFFFFF',
      scrim:         'rgba(0,0,0,0.55)',
      tabBarBg:      '#141B1E',
      tabBarBorder:  'rgba(160,210,220,0.07)',
    },
  },

  // ── ダークテーマ追加3種 ───────────────────────────────────────────────────────
  sakuraen: {
    meta: { id: 'sakuraen', name: '桜煙', subtitle: '散り際にこそ、真の美が宿る', accentLabel: '桜霞' },
    colors: {
      background:    '#130F11',
      surface1:      '#1B161A',
      surface2:      '#231E22',
      textPrimary:   '#F5EFF2',
      textSecondary: 'rgba(245,239,242,0.60)',  // M-1適用済み
      textTertiary:  'rgba(245,239,242,0.38)',  // M-2適用済み
      accent:        '#BB5C79',
      accentDim:     'rgba(187,92,121,0.12)',
      success:       '#2DB55D',
      separator:     'rgba(230,200,215,0.07)',
      error:         '#FF453A',
      onAccent:      '#FFFFFF',
      scrim:         'rgba(0,0,0,0.55)',
      tabBarBg:      '#1B161A',
      tabBarBorder:  'rgba(230,200,215,0.07)',
    },
  },
  moegi: {
    meta: { id: 'moegi', name: '萌黄', subtitle: '新芽は光を透かして燃える', accentLabel: '若芽' },
    colors: {
      background:    '#11130E',
      surface1:      '#181A15',
      surface2:      '#1F221C',
      textPrimary:   '#EFF2E8',
      textSecondary: 'rgba(239,242,232,0.60)',  // M-1適用済み
      textTertiary:  'rgba(239,242,232,0.38)',  // M-2適用済み
      accent:        '#7CA233',
      accentDim:     'rgba(124,162,51,0.12)',
      success:       '#6ECF8A',
      separator:     'rgba(210,230,180,0.07)',
      error:         '#FF453A',
      onAccent:      '#FFFFFF',
      scrim:         'rgba(0,0,0,0.55)',
      tabBarBg:      '#181A15',
      tabBarBorder:  'rgba(210,230,180,0.07)',
    },
  },
  shokou: {
    meta: { id: 'shokou', name: '曙光', subtitle: '夜の果てに最初の色が灯る', accentLabel: '暁珊瑚' },
    colors: {
      background:    '#14100E',
      surface1:      '#1C1715',
      surface2:      '#241F1D',
      textPrimary:   '#F5F0EB',
      textSecondary: 'rgba(245,240,235,0.60)',  // M-1適用済み
      textTertiary:  'rgba(245,240,235,0.38)',  // M-2適用済み
      accent:        '#E0826E',
      accentDim:     'rgba(224,130,110,0.12)',
      success:       '#2DB55D',
      separator:     'rgba(240,215,200,0.07)',
      error:         '#FF8A65',
      onAccent:      '#FFFFFF',
      scrim:         'rgba(0,0,0,0.55)',
      tabBarBg:      '#1C1715',
      tabBarBorder:  'rgba(240,215,200,0.07)',
    },
  },

  // ── 墨彩テーマ（モノクロ＋アクセント6種）────────────────────────────────────

  // ダーク墨彩（3種）
  bokuen: {
    meta: { id: 'bokuen', name: '墨炎', subtitle: '色なき闇に、炉の記憶だけが灯る', accentLabel: '鍛冶焔' },
    colors: {
      background:    '#0F0F0F',
      surface1:      '#171717',
      surface2:      '#212121',
      textPrimary:   '#E8E8E8',
      textSecondary: 'rgba(232,232,232,0.58)',
      textTertiary:  'rgba(232,232,232,0.36)',
      accent:        '#F97316',
      accentDim:     'rgba(249,115,22,0.10)',
      success:       '#2DB55D',
      separator:     'rgba(255,255,255,0.07)',
      error:         '#FF453A',
      onAccent:      '#FFFFFF',
      scrim:         'rgba(0,0,0,0.60)',
      tabBarBg:      '#171717',
      tabBarBorder:  'rgba(255,255,255,0.07)',
    },
  },
  bokusei: {
    meta: { id: 'bokusei', name: '墨青', subtitle: '墨の海に、ひと筋の稲妻が走る', accentLabel: '墨雷' },
    colors: {
      background:    '#0F0F0F',
      surface1:      '#171717',
      surface2:      '#212121',
      textPrimary:   '#E8E8E8',
      textSecondary: 'rgba(232,232,232,0.58)',
      textTertiary:  'rgba(232,232,232,0.36)',
      accent:        '#3B82F6',
      accentDim:     'rgba(59,130,246,0.10)',
      success:       '#2DB55D',
      separator:     'rgba(255,255,255,0.07)',
      error:         '#FF453A',
      onAccent:      '#FFFFFF',
      scrim:         'rgba(0,0,0,0.60)',
      tabBarBg:      '#171717',
      tabBarBorder:  'rgba(255,255,255,0.07)',
    },
  },
  bokusui: {
    meta: { id: 'bokusui', name: '墨翠', subtitle: '枯山水に、一枝の苔だけが生きている', accentLabel: '苔翠' },
    colors: {
      background:    '#0F0F0F',
      surface1:      '#171717',
      surface2:      '#212121',
      textPrimary:   '#E8E8E8',
      textSecondary: 'rgba(232,232,232,0.58)',
      textTertiary:  'rgba(232,232,232,0.36)',
      accent:        '#22C55E',
      accentDim:     'rgba(34,197,94,0.10)',
      success:       '#60A5FA',
      separator:     'rgba(255,255,255,0.07)',
      error:         '#FF453A',
      onAccent:      '#FFFFFF',
      scrim:         'rgba(0,0,0,0.60)',
      tabBarBg:      '#171717',
      tabBarBorder:  'rgba(255,255,255,0.07)',
    },
  },

  // ライト墨彩（3種）
  hakuen: {
    meta: { id: 'hakuen', name: '白炎', subtitle: '白紙の上に、朱のひと滴が落ちる', accentLabel: '朱滴', isLight: true },
    colors: {
      background:    '#F2F2F2',
      surface1:      '#E8E8E8',
      surface2:      '#DCDCDC',
      textPrimary:   '#1A1A1A',
      textSecondary: '#6B6B6B',
      textTertiary:  '#999999',
      accent:        '#DC2626',
      accentDim:     'rgba(220,38,38,0.10)',
      success:       '#2D8E4E',
      separator:     'rgba(0,0,0,0.10)',
      error:         '#B91C1C',
      onAccent:      '#FFFFFF',
      scrim:         'rgba(0,0,0,0.55)',
      tabBarBg:      '#E8E8E8',
      tabBarBorder:  'rgba(0,0,0,0.10)',
    },
  },
  hakusei: {
    meta: { id: 'hakusei', name: '白青', subtitle: '雪原の果てに、空だけが青い', accentLabel: '天藍', isLight: true },
    colors: {
      background:    '#F2F2F2',
      surface1:      '#E8E8E8',
      surface2:      '#DCDCDC',
      textPrimary:   '#1A1A1A',
      textSecondary: '#6B6B6B',
      textTertiary:  '#999999',
      accent:        '#2563EB',
      accentDim:     'rgba(37,99,235,0.10)',
      success:       '#2D8E4E',
      separator:     'rgba(0,0,0,0.10)',
      error:         '#C53929',
      onAccent:      '#FFFFFF',
      scrim:         'rgba(0,0,0,0.55)',
      tabBarBg:      '#E8E8E8',
      tabBarBorder:  'rgba(0,0,0,0.10)',
    },
  },
  hakusui: {
    meta: { id: 'hakusui', name: '白翠', subtitle: '霜降る庭に、笹の葉だけが揺れる', accentLabel: '笹翠', isLight: true },
    colors: {
      background:    '#F2F2F2',
      surface1:      '#E8E8E8',
      surface2:      '#DCDCDC',
      textPrimary:   '#1A1A1A',
      textSecondary: '#6B6B6B',
      textTertiary:  '#999999',
      accent:        '#16A34A',
      accentDim:     'rgba(22,163,74,0.10)',
      success:       '#60A5FA',
      separator:     'rgba(0,0,0,0.10)',
      error:         '#C53929',
      onAccent:      '#FFFFFF',
      scrim:         'rgba(0,0,0,0.55)',
      tabBarBg:      '#E8E8E8',
      tabBarBorder:  'rgba(0,0,0,0.10)',
    },
  },

  // ── 渋彩テーマ（低彩度アクセント3種）────────────────────────────────────────
  // 墨彩系より彩度・明度を大きく抑えた極控えめアクセント

  // ライト渋彩（1種）
  kaihaku: {
    meta: { id: 'kaihaku', name: '灰白', subtitle: '晴れた冬空の余白に、灰のひと刷毛が走る', accentLabel: '灰鼠', isLight: true },
    colors: {
      background:    '#F0F0ED',
      surface1:      '#E5E5E2',
      surface2:      '#D9D9D6',
      textPrimary:   '#1C1C1A',
      textSecondary: '#696966',
      textTertiary:  '#979794',
      accent:        '#6B6358',
      accentDim:     'rgba(107,99,88,0.10)',
      success:       '#5A6A58',
      separator:     'rgba(0,0,0,0.10)',
      error:         '#8A5050',
      onAccent:      '#FFFFFF',
      scrim:         'rgba(0,0,0,0.55)',
      tabBarBg:      '#E5E5E2',
      tabBarBorder:  'rgba(0,0,0,0.10)',
    },
  },

  // ダーク渋彩（2種）
  sabiiro: {
    meta: { id: 'sabiiro', name: '錆色', subtitle: '時を経た鉄が纏う、静かな赤の記憶', accentLabel: '鉄錆' },
    colors: {
      background:    '#0F0D0C',
      surface1:      '#181513',
      surface2:      '#221E1B',
      textPrimary:   '#E6E0DC',
      textSecondary: 'rgba(230,224,220,0.58)',
      textTertiary:  'rgba(230,224,220,0.36)',
      accent:        '#8A5A50',
      accentDim:     'rgba(138,90,80,0.10)',
      success:       '#7A8A78',
      separator:     'rgba(255,255,255,0.07)',
      error:         '#C07070',
      onAccent:      '#FFFFFF',
      scrim:         'rgba(0,0,0,0.60)',
      tabBarBg:      '#181513',
      tabBarBorder:  'rgba(255,255,255,0.07)',
    },
  },
  kohai: {
    meta: { id: 'kohai', name: '古灰', subtitle: '炉の果て、冷えた灰の底に残る蒼の滲み', accentLabel: '灰青' },
    colors: {
      background:    '#0D0F11',
      surface1:      '#151719',
      surface2:      '#1E2022',
      textPrimary:   '#E0E4E6',
      textSecondary: 'rgba(224,228,230,0.58)',
      textTertiary:  'rgba(224,228,230,0.36)',
      accent:        '#566070',
      accentDim:     'rgba(86,96,112,0.10)',
      success:       '#6A7A7A',
      separator:     'rgba(255,255,255,0.07)',
      error:         '#C07070',
      onAccent:      '#FFFFFF',
      scrim:         'rgba(0,0,0,0.60)',
      tabBarBg:      '#151719',
      tabBarBorder:  'rgba(255,255,255,0.07)',
    },
  },
};

// ── デフォルト COLORS（白鋼テーマ、後方互換） ────────────────────────────────
export const COLORS: TanrenThemeColors = THEME_PRESETS.hakukou.colors;

// ── スペーシング（8px グリッド） ────────────────────────────────────────────
export const SPACING = {
  xs:  4,   // 0.5u
  sm:  8,   // 1u  カード間隔
  md:  16,  // 2u  コンテンツマージン・カード内パディング
  lg:  24,  // 3u  セクション間
  xl:  32,  // 4u
  xxl: 48,  // 6u

  // 意味付き
  contentMargin: 16,  // --mg: コンテンツ左右マージン
  cardPadding:   16,  // N-1: 14→16 (8ptグリッド統一)
  cardGap:       8,   // カード間隔
  sectionGap:    24,  // N-2: 20→24 (= SPACING.lg に統一)
  tabGap:        8,   // S-3: WorkoutScreen タブ間隔 (HIG 推奨 8pt)
  navItemGap:    4,   // S-4: Drawer ナビ項目間隔
} as const;

// ── 角丸 ──────────────────────────────────────────────────────────────────────
export const RADIUS = {
  card:   13,  // --r: カード
  button: 16,  // --rbtn: ボタン
  btnCTA: 18,  // 主CTA（ワークアウト開始）
  chip:   20,  // クイックスタートチップ
  badge:  4,   // PRバッジ
  sheet:  18,  // ボトムシート上端
} as const;

// ── タイポグラフィ ──────────────────────────────────────────────────────────
export const TYPOGRAPHY = {
  // サイズ
  heroNumber:   58,  // 重量・レップ数 hero 表示
  screenTitle:  28,  // N-4: 26→28 (iOS Title 1 = 28pt)
  exerciseName: 20,  // 種目名
  body:         17,  // N-3: 16→17 (iOS Body = 17pt)
  bodySmall:    15,
  caption:      12,  // 補足・日付
  captionSmall: 11,  // S-2: 10→11 (iOS Caption 2 最小推奨値)

  // ウェイト
  heavy:    '800' as const,   // heroNumber
  bold:     '700' as const,   // タイトル・種目名
  semiBold: '600' as const,   // body
  regular:  '500' as const,   // caption
} as const;

// ── ボタンサイズ ──────────────────────────────────────────────────────────────
export const BUTTON_HEIGHT = {
  primary:      60,  // 主CTA（btn-p / done-btn）
  secondary:    50,  // 副アクション（btn-g）
  icon:         44,  // stepbtn・back-btn タップターゲット (HIG 最小値)
  // iconSmall: 32,  // S-6: iconDisplay にリネーム（旧値保持コメント）
  iconDisplay:  32,  // S-6: アイコン表示サイズのみ（タップ領域ではない）
  tab:          44,  // S-1: 部位タブ・セグメントコントロール (HIG 44pt)
} as const;

// ── @massapp/ui ThemeConfig 生成ユーティリティ ───────────────────────────────
import type { ThemeConfig } from '@massapp/ui';
import {
  defaultTypography,
  defaultSpacing,
  defaultRadius,
  defaultShadows,
} from '@massapp/ui';

export function createThemeConfig(id: ThemeId, colors: TanrenThemeColors): ThemeConfig {
  const mapped = {
    primary:             colors.accent,
    primaryDark:         colors.accent,
    primaryLight:        colors.accentDim,
    secondary:           colors.surface2,
    secondaryDark:       colors.surface1,
    accent:              colors.accent,
    background:          colors.background,
    backgroundSecondary: colors.surface1,
    surface:             colors.surface1,
    surfaceElevated:     colors.surface2,
    text:                colors.textPrimary,
    textSecondary:       colors.textSecondary,
    textMuted:           colors.textTertiary,
    textOnPrimary:       colors.textPrimary,
    border:              colors.separator,
    divider:             colors.separator,
    error:               colors.error,
    success:             colors.success,
    warning:             '#FFD60A',
    info:                '#64D2FF',
  };
  return {
    name: id,
    colors: { light: mapped, dark: mapped },
    typography: {
      ...defaultTypography,
      fontSize: {
        xs:   TYPOGRAPHY.captionSmall,
        sm:   TYPOGRAPHY.caption,
        md:   TYPOGRAPHY.bodySmall,
        lg:   TYPOGRAPHY.body,
        xl:   TYPOGRAPHY.exerciseName,
        xxl:  TYPOGRAPHY.screenTitle,
        hero: TYPOGRAPHY.heroNumber,
      },
    },
    spacing: defaultSpacing,
    radius: {
      ...defaultRadius,
      sm:  RADIUS.badge,
      md:  RADIUS.card,
      lg:  RADIUS.sheet,
      xl:  RADIUS.btnCTA,
      xxl: RADIUS.chip,
    },
    shadows: defaultShadows,
    overrides: {
      tabBar: { borderTopWidth: 1 },
      card:   { borderRadius: RADIUS.card },
      button: { borderRadius: RADIUS.button },
    },
  };
}

// ── デフォルト theme（後方互換） ──────────────────────────────────────────────
export const theme: ThemeConfig = createThemeConfig('hakukou', COLORS);
