# TANREN ライトテーマ配色設計書

**作成日**: 2026-03-30
**対象**: TanrenThemeColors（11トークン）× 5テーマ
**基準**: WCAG 2.2 AA/AAA、Apple HIG、既存ダーク8テーマとの世界観統一

---

## 設計方針

### 背景色
- 純白(#FFFFFF)を避け、各テーマの世界観に沿ったわずかな色味を持たせた白系
- 相対輝度 L ≈ 0.936〜0.941 の範囲（読みやすさと白すぎない品格の両立）

### サーフェス階層
- surface1: background より L値 0.07〜0.09 低い（セクション背景・グループ化）
- surface2: background より L値 0.14〜0.18 低い（カード・入力フィールド背景）
- 3段階の明度差でカード階層を視覚的に表現

### テキスト色
- textPrimary: 各テーマの色味を帯びた暗色（≥ 7:1 AAA 厳守）
- textSecondary: 中間濃度の色付きグレー（≥ 4.5:1 AA 厳守）
- textTertiary: 補助テキスト用（≥ 3:1 大テキスト AA 厳守）
- ダークテーマの rgba 透明度方式ではなく、ライトテーマでは HEX 固定値を使用（背景色が明るいため合成結果が安定）

### セパレーター
- 全テーマ共通: `rgba(0,0,0,0.08)`（ダーク系、ライト背景に自然に溶け込む）

### アクセント配分
- 5テーマで暖色系2・寒色系2・自然色系1のバランス

---

## ThemeId 追加値一覧

```typescript
export type ThemeId =
  // 既存ダーク8テーマ
  | 'tanren' | 'tamahagane' | 'shuurushi' | 'suiran'
  | 'geppaku' | 'shiden' | 'sumizome' | 'kuroshio'
  // 新規ライト5テーマ
  | 'shirotae'    // 白妙
  | 'hakuji'      // 白磁
  | 'hanagumori'  // 花曇
  | 'seiji'       // 青磁
  | 'usufuji';    // 薄藤
```

---

## テーマ 1: 白妙 (Shirotae)

### Meta

| key | value |
|---|---|
| id | `shirotae` |
| name | 白妙 |
| subtitle | 神に捧げる白布に、鍛錬の対価が金に灯る |
| accentLabel | 古金 |

### コンセプト

万葉の時代から神事に用いられた白妙の布。純白でありながら絹糸の温もりを残すその色は、修練の場に静謐な品格をもたらす。鍛え抜いた成果は古金色のアクセントとして控えめに、しかし確かに輝く。

### 配色定義

| トークン | 値 | 説明 |
|---|---|---|
| background | `#FAF8F5` | 絹糸の温もりを持つ白 |
| surface1 | `#F0EDE6` | 生成りの一段目 |
| surface2 | `#E6E2DA` | 生成りの二段目 |
| textPrimary | `#1C1B18` | 墨色（暖みのある黒） |
| textSecondary | `#6B6560` | 煤色 |
| textTertiary | `#938A80` | 薄鼠 |
| accent | `#A87A15` | 古金（いぶし金） |
| accentDim | `rgba(168,122,21,0.10)` | 古金の残光 |
| success | `#2D8E4E` | 常盤緑 |
| separator | `rgba(0,0,0,0.08)` | 墨線 |
| error | `#C53929` | 丹色 |

### コントラスト比

| 組み合わせ | 比率 | 基準 | 判定 |
|---|---|---|---|
| textPrimary × background | **16.25:1** | ≥ 7:1 (AAA) | PASS |
| textSecondary × background | **5.42:1** | ≥ 4.5:1 (AA) | PASS |
| textTertiary × background | **3.20:1** | ≥ 3:1 (大テキスト AA) | PASS |
| accent × background | **3.63:1** | ≥ 3:1 (UI コンポーネント) | PASS |

---

## テーマ 2: 白磁 (Hakuji)

### Meta

| key | value |
|---|---|
| id | `hakuji` |
| name | 白磁 |
| subtitle | 冷たい肌理に、藍の一筆が凛と走る |
| accentLabel | 染付藍 |

### コンセプト

有田・伊万里の白磁。焼成によって生まれる冷ややかな白肌は、一切の装飾を排した強さを持つ。そこに染付の藍を一筋引くことで、研ぎ澄まされた集中と規律を表現する。

### 配色定義

| トークン | 値 | 説明 |
|---|---|---|
| background | `#F7F8FB` | 磁器肌の冷白 |
| surface1 | `#EEF0F5` | 影青の一段目 |
| surface2 | `#E4E7EF` | 影青の二段目 |
| textPrimary | `#171A21` | 紺黒 |
| textSecondary | `#5C6478` | 鉛色 |
| textTertiary | `#838A9E` | 銀鼠 |
| accent | `#2D5AA0` | 染付藍 |
| accentDim | `rgba(45,90,160,0.10)` | 藍の滲み |
| success | `#2D8E4E` | 常盤緑 |
| separator | `rgba(0,0,0,0.08)` | 墨線 |
| error | `#CC3425` | 紅殻 |

### コントラスト比

| 組み合わせ | 比率 | 基準 | 判定 |
|---|---|---|---|
| textPrimary × background | **16.39:1** | ≥ 7:1 (AAA) | PASS |
| textSecondary × background | **5.57:1** | ≥ 4.5:1 (AA) | PASS |
| textTertiary × background | **3.24:1** | ≥ 3:1 (大テキスト AA) | PASS |
| accent × background | **6.42:1** | ≥ 3:1 (UI コンポーネント) | PASS |

---

## テーマ 3: 花曇 (Hanagumori)

### Meta

| key | value |
|---|---|
| id | `hanagumori` |
| name | 花曇 |
| subtitle | 曇天に滲む薄紅が、鍛練のひと時を彩る |
| accentLabel | 薄紅 |

### コンセプト

桜の季節の曇り空——花曇。灰白の空にかすかに紅が差すその景色は、厳しさの中にある一瞬の華やぎを象徴する。鍛錬の日々に寄り添う、柔らかくも芯のある色調。

### 配色定義

| トークン | 値 | 説明 |
|---|---|---|
| background | `#FBF7F8` | 花曇の空色 |
| surface1 | `#F2ECEE` | 桜鼠の一段目 |
| surface2 | `#E8E1E3` | 桜鼠の二段目 |
| textPrimary | `#1E171A` | 紫黒 |
| textSecondary | `#74606A` | 葡萄鼠 |
| textTertiary | `#988890` | 薄梅鼠 |
| accent | `#B5446A` | 薄紅（うすくれない） |
| accentDim | `rgba(181,68,106,0.10)` | 紅の余韻 |
| success | `#2D8E4E` | 常盤緑 |
| separator | `rgba(0,0,0,0.08)` | 墨線 |
| error | `#C53929` | 丹色 |

### コントラスト比

| 組み合わせ | 比率 | 基準 | 判定 |
|---|---|---|---|
| textPrimary × background | **16.57:1** | ≥ 7:1 (AAA) | PASS |
| textSecondary × background | **5.45:1** | ≥ 4.5:1 (AA) | PASS |
| textTertiary × background | **3.16:1** | ≥ 3:1 (大テキスト AA) | PASS |
| accent × background | **4.94:1** | ≥ 3:1 (UI コンポーネント) | PASS |

---

## テーマ 4: 青磁 (Seiji)

### Meta

| key | value |
|---|---|
| id | `seiji` |
| name | 青磁 |
| subtitle | 千年の翠が、鍛える者の力の色となる |
| accentLabel | 翡翠 |

### コンセプト

宋代の青磁、日本では鍋島青磁。玉のような肌合いに秘められた翠色は、自然の力強さと静けさを併せ持つ。筋肉に宿る生命力そのものを映し出すテーマ。

### 配色定義

| トークン | 値 | 説明 |
|---|---|---|
| background | `#F5F9F6` | 青磁肌の白翠 |
| surface1 | `#ECF1ED` | 若竹の一段目 |
| surface2 | `#E2E9E4` | 若竹の二段目 |
| textPrimary | `#151C17` | 深緑黒 |
| textSecondary | `#546D5A` | 苔色 |
| textTertiary | `#7D9584` | 老竹色 |
| accent | `#2E7A50` | 翡翠（常盤の深み） |
| accentDim | `rgba(46,122,80,0.10)` | 翠の影 |
| success | `#3D9455` | 萌黄 |
| separator | `rgba(0,0,0,0.08)` | 墨線 |
| error | `#CC3425` | 紅殻 |

### コントラスト比

| 組み合わせ | 比率 | 基準 | 判定 |
|---|---|---|---|
| textPrimary × background | **16.33:1** | ≥ 7:1 (AAA) | PASS |
| textSecondary × background | **5.32:1** | ≥ 4.5:1 (AA) | PASS |
| textTertiary × background | **3.04:1** | ≥ 3:1 (大テキスト AA) | PASS |
| accent × background | **4.92:1** | ≥ 3:1 (UI コンポーネント) | PASS |

---

## テーマ 5: 薄藤 (Usufuji)

### Meta

| key | value |
|---|---|
| id | `usufuji` |
| name | 薄藤 |
| subtitle | 朝露に霞む藤棚、静謐な紫が意志を帯びる |
| accentLabel | 藤紫 |

### コンセプト

朝靄の中に浮かぶ藤の花房。薄紫の光は神秘的でありながら、垂れ下がる花穂のように力強い。内なる意志と外への表現、その間に生まれる緊張感を配色に宿す。

### 配色定義

| トークン | 値 | 説明 |
|---|---|---|
| background | `#F9F7FB` | 藤霞の白紫 |
| surface1 | `#F0EDF4` | 藤鼠の一段目 |
| surface2 | `#E6E2ED` | 藤鼠の二段目 |
| textPrimary | `#1A171E` | 紫黒 |
| textSecondary | `#68607A` | 二藍 |
| textTertiary | `#8D84A0` | 薄色 |
| accent | `#6E48A8` | 藤紫 |
| accentDim | `rgba(110,72,168,0.10)` | 紫の淡光 |
| success | `#2D8E4E` | 常盤緑 |
| separator | `rgba(0,0,0,0.08)` | 墨線 |
| error | `#C53929` | 丹色 |

### コントラスト比

| 組み合わせ | 比率 | 基準 | 判定 |
|---|---|---|---|
| textPrimary × background | **16.64:1** | ≥ 7:1 (AAA) | PASS |
| textSecondary × background | **5.57:1** | ≥ 4.5:1 (AA) | PASS |
| textTertiary × background | **3.32:1** | ≥ 3:1 (大テキスト AA) | PASS |
| accent × background | **6.25:1** | ≥ 3:1 (UI コンポーネント) | PASS |

---

## テーマ横断比較

### アクセント色系統

| テーマ | アクセント | 系統 | HEX |
|---|---|---|---|
| 白妙 | 古金 | 暖色系（金/琥珀） | `#A87A15` |
| 白磁 | 染付藍 | 寒色系（青） | `#2D5AA0` |
| 花曇 | 薄紅 | 暖色系（ピンク/ローズ） | `#B5446A` |
| 青磁 | 翡翠 | 自然色系（緑） | `#2E7A50` |
| 薄藤 | 藤紫 | 寒色系（紫） | `#6E48A8` |

### コントラスト比一覧

| テーマ | textPrimary | textSecondary | textTertiary | accent |
|---|---|---|---|---|
| 白妙 | 16.25:1 AAA | 5.42:1 AA | 3.20:1 | 3.63:1 |
| 白磁 | 16.39:1 AAA | 5.57:1 AA | 3.24:1 | 6.42:1 |
| 花曇 | 16.57:1 AAA | 5.45:1 AA | 3.16:1 | 4.94:1 |
| 青磁 | 16.33:1 AAA | 5.32:1 AA | 3.04:1 | 4.92:1 |
| 薄藤 | 16.64:1 AAA | 5.57:1 AA | 3.32:1 | 6.25:1 |

### 背景色の明度比較

| テーマ | background | 相対輝度 L | 色味 |
|---|---|---|---|
| 白妙 | `#FAF8F5` | 0.9405 | 温白（黄味） |
| 白磁 | `#F7F8FB` | 0.9387 | 冷白（青味） |
| 花曇 | `#FBF7F8` | 0.9381 | 桜白（紅味） |
| 青磁 | `#F5F9F6` | 0.9382 | 翠白（緑味） |
| 薄藤 | `#F9F7FB` | 0.9363 | 藤白（紫味） |

---

## ダークテーマとの対応関係

| ライトテーマ | 色系統の近いダークテーマ | 共通する世界観 |
|---|---|---|
| 白妙（古金） | 墨染（古金） | 金/琥珀のアクセント |
| 白磁（藍） | 玉鋼（鍛冶青） | 青系のクール＆精密 |
| 花曇（薄紅） | 朱漆（漆朱） | 赤/紅系の華やぎ |
| 青磁（翡翠） | 翠嵐（苔翠） | 緑系の生命力 |
| 薄藤（藤紫） | 紫電（雷紫） | 紫系の意志 |

---

## 実装時の注意事項

### ライトテーマ固有の変更点

1. **textSecondary / textTertiary の形式**
   - ダークテーマ: `rgba(R,G,B, 0.45)` / `rgba(R,G,B, 0.22)` — 透明度方式
   - ライトテーマ: HEX固定値 — 背景が明るいため rgba 透明度では合成結果が不安定になりやすい

2. **separator の方向**
   - ダークテーマ: `rgba(255,255,255, 0.07)` — 白系
   - ライトテーマ: `rgba(0,0,0, 0.08)` — 黒系

3. **accentDim の透明度**
   - ダークテーマ: opacity 0.12（暗い背景で微かに光る）
   - ライトテーマ: opacity 0.10（明るい背景では控えめに）

4. **createThemeConfig の textOnPrimary**
   - 現在 `colors.textPrimary` をそのまま使用しているが、ライトテーマではアクセントボタン上のテキストは白 `#FFFFFF` にすべき場合がある
   - テーマごとに accent の明度を確認し、accent が暗い場合は textOnPrimary を白に設定

### iOS レビュー (P0-A11Y) との関係

ダークテーマの `textSecondary` 透明度 0.45→0.60、`textTertiary` 0.22→0.38 の修正はダークテーマにのみ適用。ライトテーマは上記 HEX 固定値で最初から WCAG 基準を達成済み。
