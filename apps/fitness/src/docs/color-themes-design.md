# TANREN 配色テーマバリアント設計書

> 策定日: 2026-03-30
> 基盤: 鍛鉄の間（Tantetsu no Ma）デザイン哲学

---

## 設計原則

すべてのテーマは「鍛鉄の間」の美学的制約を共有する:

1. **暗黒基底**: background は常に明度10%以下の深い闇
2. **3段階の面**: background → surface1 → surface2 で面の明度差のみで奥行きを表現
3. **3箇所制約**: アクセント色は画面あたり3箇所以内
4. **コントラスト遵守**: textPrimary は WCAG AA (4.5:1) 以上、textSecondary は大テキスト AA (3:1) 以上
5. **色温度の一貫性**: 各テーマ内で背景・テキスト・アクセントの色温度が統一された世界観を持つ

---

## テーマ一覧

| # | 名称 | key | アクセント | 色温度 |
|---|------|-----|-----------|--------|
| 0 | 鍛鉄（デフォルト） | `tanren` | 灼熱オレンジ #FF6200 | 中性〜暖色 |
| 1 | 玉鋼 | `tamahagane` | 鍛冶青炎 #4DABDB | 寒色 |
| 2 | 朱漆 | `shuurushi` | 漆朱 #C83C3C | 暖色 |
| 3 | 翠嵐 | `suiran` | 苔翠 #43A566 | 寒色〜中性 |
| 4 | 月白 | `geppaku` | 月光藍 #82AAFF | 寒色 |
| 5 | 紫電 | `shiden` | 雷紫 #A366FF | 寒色〜中性 |
| 6 | 墨染 | `sumizome` | 古金 #C9A84C | 暖色 |
| 7 | 黒潮 | `kuroshio` | 深潮 #2BBAA0 | 寒色 |

---

## 0. 鍛鉄（tanren）— デフォルト・リファレンス

> 鍛冶場に足を踏み入れるとき、最初に感じるのは闇の重さである。
> 炉の奥で鉄が赤く脈打つ——闇があるからこそ見える灼熱の一点。

| トークン | 値 | 備考 |
|----------|-----|------|
| `background` | `#111113` | 鍛冶場の闇 |
| `surface1` | `#191919` | カード背景 |
| `surface2` | `#222224` | 入力・バー |
| `textPrimary` | `#F5F5F7` | 対bg比 17.1:1 |
| `textSecondary` | `rgba(245,245,247,0.45)` | 実効≈#78787A 対bg比 3.9:1 |
| `textTertiary` | `rgba(245,245,247,0.22)` | ラベル・プレースホルダー |
| `accent` | `#FF6200` | 灼熱オレンジ |
| `accentDim` | `rgba(255,98,0,0.12)` | ハイライト背景 |
| `success` | `#2DB55D` | セット完了 |
| `separator` | `rgba(255,255,255,0.07)` | 区切り線 |
| `error` | `#FF453A` | 破壊的アクション |

---

## 1. 玉鋼（tamahagane）— 鍛冶の青炎

> 砂鉄と炭が出会う瞬間、炉は青白い炎で満たされる。
> その温度は千四百度——鉄が鋼に変わる境界の色である。
> 最も高い温度は、最も冷たい色で現れる。

| トークン | 値 | 備考 |
|----------|-----|------|
| `background` | `#0F1219` | 青黒い鋼の表面 |
| `surface1` | `#151A23` | 焼入れ後の暗鉄 |
| `surface2` | `#1C222D` | 研ぎ出した刃文 |
| `textPrimary` | `#E8ECF2` | 冷たい白 / 対bg比 15.8:1 |
| `textSecondary` | `rgba(232,236,242,0.45)` | 実効≈#707580 対bg比 3.8:1 |
| `textTertiary` | `rgba(232,236,242,0.22)` | — |
| `accent` | `#4DABDB` | 青炎——最高温の色 |
| `accentDim` | `rgba(77,171,219,0.12)` | — |
| `success` | `#2DB55D` | — |
| `separator` | `rgba(180,200,230,0.07)` | 青味を帯びた裂け目 |
| `error` | `#FF5252` | — |

**世界観**: 玉鋼は日本刀の素材——砂鉄から三日三晩かけて鍛え上げられる。このテーマは「極限の熱が冷たい色で現れる」逆説を表現する。背景はブルースチールの深い藍黒、アクセントは鍛冶場で最も高温の領域に現れる青白い炎。

---

## 2. 朱漆（shuurushi）— 百塗の深紅

> 漆器の朱は、一度塗りでは生まれない。
> 百回の薄塗りと研磨の果てに、光を吸い込む深紅が立ち上がる。
> 表面は静かに沈黙し、その奥に百層の意志が眠る。

| トークン | 値 | 備考 |
|----------|-----|------|
| `background` | `#141010` | 漆の下地——漆黒の暖 |
| `surface1` | `#1C1616` | 木地に漆を重ねた層 |
| `surface2` | `#241E1E` | 中塗りの赤味を帯びた闇 |
| `textPrimary` | `#F5F0ED` | 和紙のような暖白 / 対bg比 15.4:1 |
| `textSecondary` | `rgba(245,240,237,0.45)` | 実効≈#7D7573 対bg比 3.6:1 |
| `textTertiary` | `rgba(245,240,237,0.22)` | — |
| `accent` | `#C83C3C` | 朱漆——深い漆の赤 |
| `accentDim` | `rgba(200,60,60,0.12)` | — |
| `success` | `#2DB55D` | — |
| `separator` | `rgba(255,220,210,0.07)` | 暖色の区切り |
| `error` | `#FF8A65` | 橙寄りに分離（accent赤との混同回避） |

**世界観**: 輪島塗の朱は百回の塗り重ねで生まれる。このテーマは「見えない層の集積が深みになる」を体現する。背景は漆器の黒い木地の暖かみ、アクセントは百層の朱漆が放つ深い紅。error色は意図的に橙方向へずらし、accent赤との視覚的混同を防ぐ。

---

## 3. 翠嵐（suiran）— 苔むす石庭

> 千年の雨が石に苔を着せる。
> 苔は石を侵すのではなく、石に寄り添い、共に老いる。
> その緑は主張ではなく、時間そのものの色である。

| トークン | 値 | 備考 |
|----------|-----|------|
| `background` | `#0E1210` | 雨上がりの石庭の闇 |
| `surface1` | `#151A17` | 苔の下の湿った石 |
| `surface2` | `#1C221E` | 木漏れ日が届かない地面 |
| `textPrimary` | `#E8F0EA` | 露を含んだ白 / 対bg比 16.2:1 |
| `textSecondary` | `rgba(232,240,234,0.45)` | 実効≈#717A73 対bg比 3.7:1 |
| `textTertiary` | `rgba(232,240,234,0.22)` | — |
| `accent` | `#43A566` | 苔翠——百年の苔の色 |
| `accentDim` | `rgba(67,165,102,0.12)` | — |
| `success` | `#6ECF8A` | accentより明るい達成の緑 |
| `separator` | `rgba(180,230,200,0.07)` | 翠の気配 |
| `error` | `#FF453A` | — |

**世界観**: 京都・西芳寺の苔庭のように、このテーマは「静かに積み重なる時間」を表す。背景は雨に濡れた石庭の深い緑黒、アクセントは何百年もかけて石を覆う苔の翠。success色はaccentより明るくし、「達成」と「導き」の視覚的分離を確保。

---

## 4. 月白（geppaku）— 凍てつく月明かり

> 冬の満月は、庭の砂利に青い影を落とす。
> その光は何も温めず、何も隠さず、ただ在るものを照らす。
> 月白とは、感情を差し挟まない光の色である。

| トークン | 値 | 備考 |
|----------|-----|------|
| `background` | `#101214` | 月夜の闇——冷たく深い |
| `surface1` | `#181B1F` | 月光が届かない影 |
| `surface2` | `#1F2327` | 庇の下の薄明かり |
| `textPrimary` | `#E8ECF4` | 月に照らされた白 / 対bg比 15.6:1 |
| `textSecondary` | `rgba(232,236,244,0.45)` | 実効≈#727680 対bg比 3.8:1 |
| `textTertiary` | `rgba(232,236,244,0.22)` | — |
| `accent` | `#82AAFF` | 月光藍——冬の月の色 |
| `accentDim` | `rgba(130,170,255,0.12)` | — |
| `success` | `#2DB55D` | — |
| `separator` | `rgba(190,210,240,0.07)` | 月光の線 |
| `error` | `#FF5252` | — |

**世界観**: 月白（げっぱく）は日本の伝統色で、月の光のような極めて淡い青白。このテーマは「客観的で冷徹な光」を表現する。感情のない光が、トレーニングデータをありのまま照らし出す。鍛鉄の「炎」とは対極の、「月光」による可視化。

---

## 5. 紫電（shiden）— 一閃の雷光

> 雷は予告しない。
> 闇を裂き、一瞬だけ世界の輪郭を露わにして消える。
> その紫は空と地の間に走る、最も短い橋である。

| トークン | 値 | 備考 |
|----------|-----|------|
| `background` | `#110F15` | 雷雲の腹——紫を含む闇 |
| `surface1` | `#191620` | 稲光の前の静寂 |
| `surface2` | `#211E28` | 遠雷に照らされた雲 |
| `textPrimary` | `#F0ECF5` | 雷光に浮かぶ白 / 対bg比 16.0:1 |
| `textSecondary` | `rgba(240,236,245,0.45)` | 実効≈#7B7880 対bg比 3.7:1 |
| `textTertiary` | `rgba(240,236,245,0.22)` | — |
| `accent` | `#A366FF` | 雷紫——紫電一閃 |
| `accentDim` | `rgba(163,102,255,0.12)` | — |
| `success` | `#2DB55D` | — |
| `separator` | `rgba(200,190,230,0.07)` | 紫の余韻 |
| `error` | `#FF453A` | — |

**世界観**: 紫電は「紫色の稲妻」——刀の切っ先が閃く様にも喩えられる。このテーマは「一瞬の集中」を視覚化する。背景は紫を帯びた深い闇、アクセントは闇を裂く鮮烈な紫。鍛鉄の「持続する炎」に対し、紫電は「瞬間の閃き」を表す。

---

## 6. 墨染（sumizome）— 一筆の覚悟

> 墨を磨る。水に墨を溶かすのではない。石に墨を問うのである。
> 一筆は取り消せない。だからこそ、一筆に全てを込める。
> 金は飾りではなく、署名である。

| トークン | 値 | 備考 |
|----------|-----|------|
| `background` | `#121110` | 硯の黒——暖かい純黒 |
| `surface1` | `#1A1918` | 墨を含んだ和紙 |
| `surface2` | `#232120` | 乾きかけの墨痕 |
| `textPrimary` | `#F0EDE8` | 生成りの和紙 / 対bg比 15.7:1 |
| `textSecondary` | `rgba(240,237,232,0.45)` | 実効≈#7C7A76 対bg比 3.7:1 |
| `textTertiary` | `rgba(240,237,232,0.22)` | — |
| `accent` | `#C9A84C` | 古金——風雪を経た金箔 |
| `accentDim` | `rgba(201,168,76,0.12)` | — |
| `success` | `#6B9E78` | 落ち着いた翠（暖色調に調和） |
| `separator` | `rgba(230,220,200,0.07)` | 和紙の繊維 |
| `error` | `#E8634A` | 朱墨の警告 |

**世界観**: 書道の「一筆入魂」——取り消せない一筆に全てを込める精神。背景は墨を磨り終えた硯のような暖かい黒、アクセントは寺院の金箔が歳月で渋みを帯びた古金。鍛鉄の「灼熱」に対し、墨染は「静謐な気品」を表す。success/errorも暖色パレットに合わせて調整。

---

## 7. 黒潮（kuroshio）— 見えざる大河

> 黒潮は海の中を流れる、もう一つの河である。
> 目には見えないが、その力は島の気候をも変える。
> 深い場所にある力こそ、最も大きな力である。

| トークン | 値 | 備考 |
|----------|-----|------|
| `background` | `#0D1214` | 深海の闇——碧を含む黒 |
| `surface1` | `#141B1E` | 海溝の暗がり |
| `surface2` | `#1B2326` | 水面下の微光 |
| `textPrimary` | `#E4EFF2` | 波間の白 / 対bg比 16.4:1 |
| `textSecondary` | `rgba(228,239,242,0.45)` | 実効≈#6D787B 対bg比 3.7:1 |
| `textTertiary` | `rgba(228,239,242,0.22)` | — |
| `accent` | `#2BBAA0` | 深潮——黒潮が運ぶ碧 |
| `accentDim` | `rgba(43,186,160,0.12)` | — |
| `success` | `#5CC879` | 明るい緑（accent碧との分離） |
| `separator` | `rgba(160,210,220,0.07)` | 深海の裂け目 |
| `error` | `#FF5252` | — |

**世界観**: 黒潮（くろしお）は日本列島に沿って流れる暖流。名は「黒く見える」ことに由来する。このテーマは「目に見えない深い力」を表す。背景は深海の碧を帯びた黒、アクセントは黒潮が運ぶ南洋の碧。鍛鉄の「火の力」に対し、黒潮は「水の力」を表す。

---

## テーマ間差別化ポイント比較表

### 色温度・情緒マッピング

| テーマ | 色温度 | 元素 | 情緒 | ユースケース適性 |
|--------|--------|------|------|-----------------|
| 鍛鉄 | 中性暖 | 火 | 力強さ・覚悟 | 汎用デフォルト |
| 玉鋼 | 寒色 | 鋼 | 精密・冷徹 | データ志向ユーザー |
| 朱漆 | 暖色 | 漆 | 深み・伝統 | 和の美意識を好むユーザー |
| 翠嵐 | 寒中性 | 苔 | 静謐・持続 | 瞑想的トレーニング |
| 月白 | 寒色 | 月 | 客観・澄明 | ミニマリスト |
| 紫電 | 寒中性 | 雷 | 瞬発・集中 | 高強度トレーニング |
| 墨染 | 暖色 | 墨 | 気品・不可逆 | 落ち着いた雰囲気を好むユーザー |
| 黒潮 | 寒色 | 水 | 深淵・持久 | 持久系トレーニング |

### 背景色の色相分布

```
            暖 ←─────────────────────→ 寒

朱漆(#141010)  墨染(#121110)  鍛鉄(#111113)  紫電(#110F15)
                                │
                         月白(#101214)  黒潮(#0D1214)
                                │
                         翠嵐(#0E1210)  玉鋼(#0F1219)
```

### アクセント色の色相環配置

```
              #FF6200 鍛鉄 (橙)
             ╱                  ╲
    #C9A84C 墨染                  #C83C3C 朱漆 (赤)
      (金)  │                      │
            │                      │
    #43A566 翠嵐                  #A366FF 紫電 (紫)
      (緑)  │                      │
            ╲                  ╱
      #2BBAA0 黒潮 ── #4DABDB 玉鋼 ── #82AAFF 月白
        (碧)          (青)           (藍)
```

> 色相環上でほぼ均等に分散しており、どの2テーマを並べても明確に区別できる。

### コントラスト比一覧

| テーマ | textPrimary対bg | textSecondary対bg* | accent対bg |
|--------|----------------|-------------------|------------|
| 鍛鉄 | 17.1:1 | 3.9:1 | 5.2:1 |
| 玉鋼 | 15.8:1 | 3.8:1 | 5.8:1 |
| 朱漆 | 15.4:1 | 3.6:1 | 4.1:1 |
| 翠嵐 | 16.2:1 | 3.7:1 | 4.6:1 |
| 月白 | 15.6:1 | 3.8:1 | 5.3:1 |
| 紫電 | 16.0:1 | 3.7:1 | 4.8:1 |
| 墨染 | 15.7:1 | 3.7:1 | 5.4:1 |
| 黒潮 | 16.4:1 | 3.7:1 | 5.6:1 |

*textSecondary: 0.45 opacity の実効値。大テキスト AA (3:1) を全テーマで満たす。

---

## ThemeConfig型への組み込み方針

### 構造設計

```typescript
// src/theme.ts に追加する構造

// ── テーマID型 ──────────────────────────────────
export type ThemeId =
  | 'tanren'      // 鍛鉄（デフォルト）
  | 'tamahagane'  // 玉鋼
  | 'shuurushi'   // 朱漆
  | 'suiran'      // 翠嵐
  | 'geppaku'     // 月白
  | 'shiden'      // 紫電
  | 'sumizome'    // 墨染
  | 'kuroshio';   // 黒潮

// ── テーマカラー定義型 ──────────────────────────
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
}

// ── テーマメタデータ型 ──────────────────────────
export interface TanrenThemeMeta {
  id:          ThemeId;
  name:        string;          // 日本語名
  subtitle:    string;          // 哲学的一行コンセプト
  accentLabel: string;          // アクセント色の和名
}

// ── 各テーマ定義 ────────────────────────────────
export interface TanrenThemeDefinition {
  meta:   TanrenThemeMeta;
  colors: TanrenThemeColors;
}
```

### テーマレジストリ

```typescript
// src/themes/index.ts

import type { TanrenThemeDefinition, ThemeId } from '../theme';

export const THEME_REGISTRY: Record<ThemeId, TanrenThemeDefinition> = {
  tanren: {
    meta: {
      id: 'tanren',
      name: '鍛鉄',
      subtitle: '灼熱の一点が闇を穿つ',
      accentLabel: '灼熱橙',
    },
    colors: {
      background:    '#111113',
      surface1:      '#191919',
      surface2:      '#222224',
      textPrimary:   '#F5F5F7',
      textSecondary: 'rgba(245,245,247,0.45)',
      textTertiary:  'rgba(245,245,247,0.22)',
      accent:        '#FF6200',
      accentDim:     'rgba(255,98,0,0.12)',
      success:       '#2DB55D',
      separator:     'rgba(255,255,255,0.07)',
      error:         '#FF453A',
    },
  },

  tamahagane: {
    meta: {
      id: 'tamahagane',
      name: '玉鋼',
      subtitle: '最高温は最も冷たい色で現れる',
      accentLabel: '鍛冶青炎',
    },
    colors: {
      background:    '#0F1219',
      surface1:      '#151A23',
      surface2:      '#1C222D',
      textPrimary:   '#E8ECF2',
      textSecondary: 'rgba(232,236,242,0.45)',
      textTertiary:  'rgba(232,236,242,0.22)',
      accent:        '#4DABDB',
      accentDim:     'rgba(77,171,219,0.12)',
      success:       '#2DB55D',
      separator:     'rgba(180,200,230,0.07)',
      error:         '#FF5252',
    },
  },

  shuurushi: {
    meta: {
      id: 'shuurushi',
      name: '朱漆',
      subtitle: '百層の朱が沈黙の深紅を生む',
      accentLabel: '漆朱',
    },
    colors: {
      background:    '#141010',
      surface1:      '#1C1616',
      surface2:      '#241E1E',
      textPrimary:   '#F5F0ED',
      textSecondary: 'rgba(245,240,237,0.45)',
      textTertiary:  'rgba(245,240,237,0.22)',
      accent:        '#C83C3C',
      accentDim:     'rgba(200,60,60,0.12)',
      success:       '#2DB55D',
      separator:     'rgba(255,220,210,0.07)',
      error:         '#FF8A65',
    },
  },

  suiran: {
    meta: {
      id: 'suiran',
      name: '翠嵐',
      subtitle: '千年の雨が石に苔を着せる',
      accentLabel: '苔翠',
    },
    colors: {
      background:    '#0E1210',
      surface1:      '#151A17',
      surface2:      '#1C221E',
      textPrimary:   '#E8F0EA',
      textSecondary: 'rgba(232,240,234,0.45)',
      textTertiary:  'rgba(232,240,234,0.22)',
      accent:        '#43A566',
      accentDim:     'rgba(67,165,102,0.12)',
      success:       '#6ECF8A',
      separator:     'rgba(180,230,200,0.07)',
      error:         '#FF453A',
    },
  },

  geppaku: {
    meta: {
      id: 'geppaku',
      name: '月白',
      subtitle: '感情を差し挟まない光の色',
      accentLabel: '月光藍',
    },
    colors: {
      background:    '#101214',
      surface1:      '#181B1F',
      surface2:      '#1F2327',
      textPrimary:   '#E8ECF4',
      textSecondary: 'rgba(232,236,244,0.45)',
      textTertiary:  'rgba(232,236,244,0.22)',
      accent:        '#82AAFF',
      accentDim:     'rgba(130,170,255,0.12)',
      success:       '#2DB55D',
      separator:     'rgba(190,210,240,0.07)',
      error:         '#FF5252',
    },
  },

  shiden: {
    meta: {
      id: 'shiden',
      name: '紫電',
      subtitle: '一閃が闇の輪郭を露わにする',
      accentLabel: '雷紫',
    },
    colors: {
      background:    '#110F15',
      surface1:      '#191620',
      surface2:      '#211E28',
      textPrimary:   '#F0ECF5',
      textSecondary: 'rgba(240,236,245,0.45)',
      textTertiary:  'rgba(240,236,245,0.22)',
      accent:        '#A366FF',
      accentDim:     'rgba(163,102,255,0.12)',
      success:       '#2DB55D',
      separator:     'rgba(200,190,230,0.07)',
      error:         '#FF453A',
    },
  },

  sumizome: {
    meta: {
      id: 'sumizome',
      name: '墨染',
      subtitle: '一筆は取り消せない、だから全てを込める',
      accentLabel: '古金',
    },
    colors: {
      background:    '#121110',
      surface1:      '#1A1918',
      surface2:      '#232120',
      textPrimary:   '#F0EDE8',
      textSecondary: 'rgba(240,237,232,0.45)',
      textTertiary:  'rgba(240,237,232,0.22)',
      accent:        '#C9A84C',
      accentDim:     'rgba(201,168,76,0.12)',
      success:       '#6B9E78',
      separator:     'rgba(230,220,200,0.07)',
      error:         '#E8634A',
    },
  },

  kuroshio: {
    meta: {
      id: 'kuroshio',
      name: '黒潮',
      subtitle: '深い場所の力こそ最も大きい',
      accentLabel: '深潮',
    },
    colors: {
      background:    '#0D1214',
      surface1:      '#141B1E',
      surface2:      '#1B2326',
      textPrimary:   '#E4EFF2',
      textSecondary: 'rgba(228,239,242,0.45)',
      textTertiary:  'rgba(228,239,242,0.22)',
      accent:        '#2BBAA0',
      accentDim:     'rgba(43,186,160,0.12)',
      success:       '#5CC879',
      separator:     'rgba(160,210,220,0.07)',
      error:         '#FF5252',
    },
  },
};
```

### ThemeConfig変換ユーティリティ

```typescript
// src/themes/createThemeConfig.ts

import type { ThemeConfig } from '@massapp/ui';
import {
  defaultTypography,
  defaultSpacing,
  defaultRadius,
  defaultShadows,
} from '@massapp/ui';
import type { TanrenThemeColors, ThemeId } from '../theme';
import { TYPOGRAPHY, RADIUS } from '../theme';
import { THEME_REGISTRY } from './index';

/**
 * TanrenThemeColors → @massapp/ui ThemeConfig への変換
 * 全テーマで共通のマッピングロジックを使用する
 */
function colorsToThemeConfig(
  id: ThemeId,
  colors: TanrenThemeColors
): ThemeConfig {
  const mapped = {
    primary:             colors.accent,
    primaryDark:         colors.accent,     // テーマごとに暗色版を派生可
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
    colors: { light: mapped, dark: mapped },  // 常時ダークモード
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

/**
 * テーマIDから ThemeConfig を生成
 */
export function getThemeConfig(id: ThemeId): ThemeConfig {
  const def = THEME_REGISTRY[id];
  return colorsToThemeConfig(id, def.colors);
}
```

### 設定画面での使用イメージ

```typescript
// SettingsScreen でのテーマ選択UI
// テーマプレビューは accent色の円 + テーマ名で表現

const themeOptions = Object.values(THEME_REGISTRY).map(t => ({
  id:       t.meta.id,
  name:     t.meta.name,
  subtitle: t.meta.subtitle,
  accent:   t.colors.accent,
  bg:       t.colors.background,
}));
```

---

## 実装ステップ

1. **型定義**: `TanrenThemeColors`, `ThemeId`, `TanrenThemeMeta` を `src/theme.ts` に追加
2. **テーマレジストリ**: `src/themes/index.ts` に全テーマカラー定義を配置
3. **変換ユーティリティ**: `src/themes/createThemeConfig.ts` で `ThemeConfig` への変換関数を実装
4. **永続化**: AsyncStorage にテーマIDを保存し、アプリ起動時に復元
5. **設定画面**: テーマ選択UIを追加（accent色ドット + テーマ名のリスト）
6. **既存COLORS参照の置換**: `COLORS.xxx` の直接参照を、テーマContextから取得する形に段階的に移行
