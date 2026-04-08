# ReCallKit UI Refresh — Implementation Spec

HTMLモックアップ (`prompts/home-mockup.html`) で確定したデザイン変更をReact Nativeプロジェクトに反映する。

---

## 1. カラーパレット変更

現在のGoogle系カラーからIndigo硬質系に変更。

```
// Before (Google Calendar)        // After (Indigo Pro)
--text-1: #202124                  --text-1: #171717
--text-2: #5F6368                  --text-2: #525252
--text-3: #9AA0A6                  --text-3: #A3A3A3
--blue:   #1A73E8                  --accent: #6366F1 (Indigo)
--green:  #1E8E3E                  --green:  #059669
--red:    #D93025                  --red:    #DC2626
--orange: #F29900                  --orange: #D97706
--border: #DADCE0                  --border: #E5E5E5
--bg:     #FFFFFF                  --bg:     #FAFAFA
--tint:   #F8F9FA                  --tint:   #F5F5F5
```

### 反映箇所
- `src/theme/colors.ts` のライトモードカラー定義
- `src/theme/themes.ts` の全テーマエントリ

---

## 2. フォント変更

```
// Before                          // After
Google Sans                        Inter (+ Noto Sans JP)
```

### 反映箇所
- `src/theme/typography.ts` の fontFamily
- Inter はシステムフォントとして `-apple-system` にフォールバック可能（iOS SF ProはInterに近い）
- letter-spacing: -0.011em をデフォルトに追加

---

## 3. カード形状: 2px角丸 + オフセット影

全てのカード型UI要素に適用:

```typescript
// src/theme/spacing.ts の CardShadow を変更
export const CardStyle = {
  borderRadius: 2,
  borderWidth: 1,
  borderColor: colors.separator, // #E5E5E5
  // オフセット影 (右下にずれたソリッド影)
  shadowColor: colors.separator,
  shadowOffset: { width: 3, height: 3 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 0, // Androidでは box-shadow が使えないため別途対応
};
```

### 適用対象

| コンポーネント | ファイル |
|---|---|
| ReviewCard (フラッシュカード表裏) | `src/components/ReviewCard.tsx` |
| Recently Addedカルーセルのカード | `src/screens/home/HomeScreen.tsx` |
| Library画面のアイテムカード | `src/screens/library/LibraryScreen.tsx` |
| QAPreviewのカード | `src/screens/add/QAPreviewScreen.tsx` |
| ReviewSelectのグループカード | `src/screens/review/ReviewSelectScreen.tsx` |
| ItemDetail内のinfo/metaカード | `src/screens/library/ItemDetailScreen.tsx` |
| URL Import Listのジョブカード | `src/screens/add/URLImportListScreen.tsx` |
| Rating buttons | `src/components/RatingButtons.tsx` |
| InputGroup / TextArea | 全input系 |

### Android対応
React Native の `elevation` はソリッドオフセット影を表現できないため、Android用には `react-native-shadow-2` またはSVG背景で対応する:

```typescript
// Android fallback
import { Platform } from 'react-native';

const cardShadowStyle = Platform.select({
  ios: {
    shadowColor: colors.separator,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  android: {
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderRightColor: colors.separator,
    borderBottomColor: colors.separator,
  },
});
```

---

## 4. セパレーター: 1本線 左→右フェード

全セクション区切りを変更。

### Before
- グレーベタ帯 (`height: 8, backgroundColor: backgroundGrouped`)
- 直線 (`height: 1, backgroundColor: separator`)

### After
- 1本の線が左から始まり、40%地点で透明にフェードアウト

```typescript
// src/components/FadeSeparator.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';

export function FadeSeparator({ style }: { style?: object }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={[colors.separator, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        locations={[0.4, 1]}
        style={styles.line}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 1,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  line: {
    height: 1,
    width: '100%',
  },
});
```

### 適用箇所

以下を全て `<FadeSeparator />` に置き換え:

- グレーベタ帯 (`backgroundGrouped` でheight 8px) → 全廃
- 直線セパレーター (`separator` でheight 1px) → FadeSeparatorに
- `SectionList` の `SectionSeparatorComponent` → FadeSeparatorに
- ReviewCardのQuestion/Answer区切り → FadeSeparatorに

### 検索対象キーワード
- `backgroundGrouped` をbackgroundColorに使っている箇所
- `height: 1` や `height: 8` でセクション区切り用の `<View>`
- `separator` をbackgroundColorに使っている箇所
- `SectionSeparatorComponent`
- `ItemSeparatorComponent`

### 変えないもの
- リストアイテム間のborder-bottom（カード枠線、入力欄の枠線など）はそのまま

---

## 5. ホーム画面の並び順変更

現在のホーム画面は This Week が一番上に来ている。以下の順に変更:

### After（上から順）
1. **今日の復習** — タイトル + 件数 + 推定時間 + カテゴリ + 期限切れ表示 + 復習開始ボタン
2. **FadeSeparator**
3. **This Week** — 7つのチェックボックス + `5/7日 | 42枚 復習済み`
4. **FadeSeparator**
5. **Recently Added** — 横スクロールカルーセル（2px角丸 + オフセット影）
6. **FadeSeparator**
7. **Mastery** — カテゴリ別プログレスバー
8. **FadeSeparator**
9. **ショートカット** — URLから追加 / 手動で作成

### 反映箇所
- `src/screens/home/HomeScreen.tsx` のJSX並び順を変更

---

## 6. 週間チェックボックス

ドットからチェックボックスに変更（前回specと同じ）。

```
サイズ: 34×34px, 角丸: 8px
曜日ラベル: 1文字 (M T W T F S S), 10px
状態:
  strong: accent塗り + 白チェック
  done: accent枠 + 薄い背景 + accentチェック
  missed: #E5E7EB枠 + #FAFAFA背景
  today: accent破線枠
```

---

## 7. 削除した要素

以下はHTMLモックアップで削除済み。本番からも削除:

- Stats行（12日連続 / 38習得済み / 124カード） — ドロワーに統計が既にある
- Today行（7 / Mon / 8件の復習が待っています） — 復習カードのタイトルと重複
- FABボタン — ショートカットセクションで代替
- ヒーローイラスト — 非表示（将来的に復活の可能性あり）
- カード装飾SVG — 不採用

---

## 8. ヘッダー

```
// Before                          // After
font-size: 22px                    font-size: 15px
font-weight: 400                   font-weight: 600
                                   letter-spacing: -0.02em
```

---

## 9. ボタン

```
// Before (pill)                   // After (sharp)
border-radius: 20px                border-radius: 2px (+ offset shadow)
padding: 10px 24px                 padding: 9px 18px
background: blue                   background: #171717 (text-1, ほぼ黒)
font-size: 14px                    font-size: 13px, weight 600
```

### Primary button (復習開始など)
- 背景: `var(--text-1)` (#171717)
- 文字: #FFFFFF
- 角丸: 2px（カードと統一してもいい）
- `box-shadow: 3px 3px 0 var(--border)` はボタンにはつけない（カードのみ）

---

## HTMLモックアップ

確定済みモックアップ: `prompts/home-mockup.html`
ブラウザで開いて見た目を確認できる。
