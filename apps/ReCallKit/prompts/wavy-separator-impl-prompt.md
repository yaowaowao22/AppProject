# ReCallKit — 波線セパレーター＋週間チェックボックスの実装

以下の仕様をReCallKitプロジェクト（React Native + Expo + TypeScript）に反映してください。
プロジェクトパス: `C:\Users\ytata\AppProject\baseProject\apps\ReCallKit`

---

## 1. 波線セパレーター（WavySeparator）

全画面のセクション区切りを、直線の`<View>`から**SVGの波破線**に置き換える。

### 見た目の仕様

```
SVG波破線: ゆるやかな正弦波、画面幅いっぱい
- 波の間隔: 約145px（画面幅に3波）
- 波の振幅: 上下±8px（高さ20px）
- 線色: separator色（ライト: rgba(60,60,67,0.12) / ダーク: rgba(84,84,88,0.65)）
- 線幅: 1.5px
- 破線パターン: stroke-dasharray="3 4"（3px描画、4px隙間）
- stroke-linecap: round
- 左右余白: 6px
```

### SVGパス（そのまま使える）

```tsx
const WAVE_PATH = "M0 10 C55 18, 100 18, 145 10 S240 2, 285 10 S380 18, 430 10";
```

### コンポーネント

```tsx
// src/components/WavySeparator.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';

interface WavySeparatorProps {
  style?: object;
}

export function WavySeparator({ style }: WavySeparatorProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <Svg viewBox="0 0 430 20" style={styles.svg} preserveAspectRatio="none">
        <Path
          d="M0 10 C55 18, 100 18, 145 10 S240 2, 285 10 S380 18, 430 10"
          stroke={colors.separator}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeDasharray="3 4"
          fill="none"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 20,
    marginHorizontal: 6,
    overflow: 'visible',
  },
  svg: {
    width: '100%',
    height: 20,
  },
});
```

### 適用箇所

以下の全画面でセクション区切り（`<View style={{ height: 1, backgroundColor: colors.separator }}>`やそれに類する直線）をすべて `<WavySeparator />` に置き換える:

- HomeScreen: 復習カードとWeeklyセクションの間、Weeklyとカルーセルの間、Masteryセクション前後
- LibraryScreen: フィルタ下部
- ReviewScreen: カードのQuestion/Answer区切り（flip-sep）
- ItemDetailScreen: セクション間
- SettingsScreen: グループ間
- JournalScreen: 日付グループ間
- HistoryScreen: 統計と履歴リストの間

**直線borderは区切り以外の用途（リストアイテム間のborder-bottom、カード枠線、入力欄の枠線など）ではそのまま残す。**

### グレーのベタ帯（section-gap）の廃止

現在セクション間に `backgroundGrouped` 色で塗られた8px高のベタ帯がある:

```tsx
// こういうやつ ← 全廃止
<View style={{ height: 8, backgroundColor: colors.backgroundGrouped }} />
// または
<View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.separator }} />
// または
contentContainerStyle={{ backgroundColor: colors.backgroundGrouped }} で生まれるグレー帯
```

これらを**すべて `<WavySeparator />` に置き換える**。グレーのベタ塗り帯はアプリ内に一切残さない。

検索対象キーワード:
- `backgroundGrouped`
- `separator` を `backgroundColor` に使っている箇所
- `height: 8` や `height: 1` でセクション区切りに使われている `<View>`
- `SectionList` の `SectionSeparatorComponent` や `ItemSeparatorComponent`

---

## 2. 週間チェックボックス（WeeklyTracker）

HomeScreenの週間ヒートマップを、丸ドットから**角丸チェックボックス**に変更する。

### 見た目の仕様

```
7つのチェックボックスが横一列
- サイズ: 34×34px
- 角丸: 8px
- 曜日ラベル: 1文字（M T W T F S S）、10px、tertiaryカラー
- 今日のラベル: accent色、weight 500

状態:
- strong（10件以上復習）: accent色で塗り潰し + 白チェックマーク
- done（復習あり）: accent色枠 + accent薄い背景(#E8F0FE) + accent色チェックマーク
- missed（未復習）: #E5E7EB枠 + #FAFAFA背景 + 空
- today（今日、まだ未復習）: accent色の破線枠 + 空
```

### チェックボックスの下

波線セパレーターは入れない。チェックボックスの直下に `5/7日 | 42枚 復習済み` をテキストで左右配置。

```tsx
<View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 6 }}>
  <Text style={{ fontSize: 12, color: colors.labelTertiary }}>5/7日</Text>
  <Text style={{ fontSize: 12, color: colors.labelTertiary }}>42枚 復習済み</Text>
</View>
```

---

## 3. 注意点

- `react-native-svg` は既にプロジェクトに入っている（StreakRing等で使用中）
- テーマ対応: `colors.separator` でライト/ダーク両対応
- `preserveAspectRatio="none"` で画面幅に合わせてSVGが伸縮する
- SVGのviewBoxは固定 `0 0 430 20`、実際の幅はView側で `width: '100%'` にして自動調整

---

## HTMLモックアップ（参照用）

完成済みモックアップ: `prompts/home-mockup.html` をブラウザで開いて見た目を確認できる。
