# TANREN スペーシング監査レポート

> 監査日: 2026-03-30
> 対象: src/screens/* / src/components/* / src/navigation/RootNavigator.tsx
> 基準: SPACING定数（8pxグリッド）＋ design-spec.md

---

## 1. 画面ごとの余白値一覧

### 凡例
- ✅ SPACING定数使用 / 8pxグリッド準拠
- ⚠️ ハードコード（値は正しいがSPACING未使用）
- ❌ 8pxグリッド違反 または 画面間不整合

---

### HomeScreen.tsx

| 箇所 | プロパティ | 値 | 状態 |
|------|-----------|-----|------|
| ScrollView content | paddingTop | `SPACING.sm` (8) | ✅ |
| date (スクリーンタイトル相当) | paddingHorizontal | `SPACING.contentMargin` (16) | ✅ |
| date | paddingTop | `SPACING.sm` (8) | ✅ |
| date | marginBottom | `SPACING.sm` (8) | ✅ |
| ctaButton | marginHorizontal | `SPACING.contentMargin` (16) | ✅ |
| ctaButton | marginTop | `SPACING.md` (16) | ✅ |
| ctaButton | marginBottom | `SPACING.sm` (8) | ✅ |
| ctaButton | height | `60` | ⚠️ `BUTTON_HEIGHT.primary`をハードコード |
| sectionLabel | paddingHorizontal | `SPACING.contentMargin` (16) | ✅ |
| sectionLabel | marginTop | `SPACING.md` (16) | ✅ |
| sectionLabel | marginBottom | `10` | ❌ 8pxグリッド外(8か12が正しい) |
| sectionGapTop (本日のメニュー前) | marginTop | `22` | ❌ 8pxグリッド外(20か24が正しい) |
| statsRow | paddingHorizontal | `SPACING.contentMargin` (16) | ✅ |
| statsRow | marginBottom | `SPACING.md` (16) | ✅ |
| statItem | gap | `3` | ❌ 8pxグリッド外(4=xsが正しい) |
| statBorder | paddingLeft | `SPACING.md` (16) | ✅ |
| chips (横スクロール) | paddingHorizontal | `SPACING.contentMargin` (16) | ✅ |
| chips | gap | `7` | ❌ 8pxグリッド外(8=smが正しい) |
| chip | paddingVertical | `9` | ❌ 8pxグリッド外(8か12が正しい) |
| chip | paddingHorizontal | `14` | ⚠️ `SPACING.cardPadding`をハードコード |
| menuList | paddingHorizontal | `SPACING.contentMargin` (16) | ✅ |
| menuRow | paddingVertical | `14` | ⚠️ `SPACING.cardPadding`をハードコード |
| menuRow | minHeight | `52` | ❌ 8pxグリッド外(48が正しい) |
| menuLeft | gap | `3` | ❌ 8pxグリッド外(4=xsが正しい) |
| menuSub | marginTop | `2` | ❌ 8pxグリッド外(4=xsが正しい) |
| chevron | marginLeft | `SPACING.sm` (8) | ✅ |
| bottomPad | height | `20` | ⚠️ `SPACING.sectionGap`をハードコード |

---

### WorkoutScreen.tsx — ExerciseSelectScreen

| 箇所 | プロパティ | 値 | 状態 |
|------|-----------|-----|------|
| tabsWrap | paddingTop | `12` | ❌ 8pxグリッド外(8か16が正しい) |
| tabsWrap | paddingBottom | `8` | ⚠️ `SPACING.sm`をハードコード |
| tabsContent | paddingHorizontal | `SPACING.contentMargin` (16) | ✅ |
| tabsContent | gap | `6` | ❌ 8pxグリッド外(8=smが正しい) |
| tab | height | `34` | ❌ 8pxグリッド外(32か40が正しい) |
| tab | paddingHorizontal | `16` | ⚠️ `SPACING.md`をハードコード |
| exList | paddingHorizontal | `SPACING.contentMargin` (16) | ✅ |
| exListContentWithBtn | paddingBottom | `88` | ⚠️ ハードコード(8*11=88 グリッド準拠) |
| exRow | paddingVertical | `14` | ⚠️ `SPACING.cardPadding`をハードコード |
| exRow | minHeight | `52` | ❌ 8pxグリッド外(48が正しい) |
| exRowLeft | gap | `12` | ❌ 8pxグリッド外(8か16が正しい) |
| exIcon | width/height | `36` | ❌ 8pxグリッド外(32か40が正しい) |
| startWrap | paddingHorizontal | `SPACING.contentMargin` (16) | ✅ |
| startWrap | paddingTop | `12` | ❌ 8pxグリッド外(8か16が正しい) |
| startBtn | height | `BUTTON_HEIGHT.primary` (60) | ✅ |

---

### WorkoutScreen.tsx — ActiveWorkoutScreen

| 箇所 | プロパティ | 値 | 状態 |
|------|-----------|-----|------|
| actHeader | paddingHorizontal | `SPACING.contentMargin` (16) | ✅ |
| actHeader | paddingTop | `SPACING.sm` (8) | ✅ |
| actHeader | paddingBottom | `14` | ⚠️ `SPACING.cardPadding`をハードコード |
| actHeader | gap | `10` | ❌ 8pxグリッド外(8か12が正しい) |
| actHeaderRight | gap | `4` | ⚠️ `SPACING.xs`をハードコード |
| setBadge | borderRadius | `9` | ❌ 8pxグリッド外(半径値だが、8か10が正しい) |
| setBadge | paddingHorizontal | `11` | ❌ 8pxグリッド外(8か12が正しい) |
| setBadge | paddingVertical | `5` | ❌ 8pxグリッド外(4か8が正しい) |
| numCtrl | paddingHorizontal | `SPACING.contentMargin` (16) | ✅ |
| numCtrl | gap | `10` | ❌ 8pxグリッド外(8か12が正しい) |
| numCtrl | paddingBottom | `12` | ❌ 8pxグリッド外(8か16が正しい) |
| numBlock | paddingVertical | `14` | ⚠️ `SPACING.cardPadding`をハードコード |
| numBlock | paddingHorizontal | `10` | ❌ 8pxグリッド外(8か12が正しい) |
| numBlock | gap | `8` | ⚠️ `SPACING.sm`をハードコード |
| numUnit | marginTop | `-4` | ⚠️ `-SPACING.xs`をハードコード |
| stepRow | gap | `8` | ⚠️ `SPACING.sm`をハードコード |
| doneBtn | marginHorizontal | `SPACING.contentMargin` (16) | ✅ |
| doneBtn | marginBottom | `12` | ❌ 8pxグリッド外(8か16が正しい) |
| doneBtn | gap | `8` | ⚠️ `SPACING.sm`をハードコード |
| slog | paddingHorizontal | `SPACING.contentMargin` (16) | ✅ |
| sectionLabel | marginBottom | `8` | ⚠️ `SPACING.sm`をハードコード（他画面は10で不統一） |
| sectionLabelHist | marginTop | `14` | ❌ 8pxグリッド外(12か16が正しい) |
| sectionLabelHist | marginBottom | `10` | ❌ 8pxグリッド外(8か12が正しい) |
| setRow | paddingVertical | `12` | ❌ 8pxグリッド外(8か16が正しい) |
| endBtn | marginHorizontal | `SPACING.contentMargin` (16) | ✅ |
| endBtn | marginTop | `10` | ❌ 8pxグリッド外(8か12が正しい) |
| histSection | paddingHorizontal | `SPACING.contentMargin` (16) | ✅ |
| histSection | marginTop | `8` | ⚠️ `SPACING.sm`をハードコード |
| histBars | gap | `4` | ⚠️ `SPACING.xs`をハードコード |
| histBars | marginBottom | `8` | ⚠️ `SPACING.sm`をハードコード |
| histNote | paddingTop | `8` | ⚠️ `SPACING.sm`をハードコード |
| histNote | gap | `6` | ❌ 8pxグリッド外(8=smが正しい) |
| 末尾の空白 | height | `20` | ⚠️ `SPACING.sectionGap`をハードコード |

---

### HistoryScreen.tsx

| 箇所 | プロパティ | 値 | 状態 |
|------|-----------|-----|------|
| screenTitle | paddingHorizontal | `SPACING.contentMargin` (16) | ✅ |
| screenTitle | paddingTop | `SPACING.sm` (8) | ✅ |
| screenTitle | marginBottom | `SPACING.sectionGap` (20) | ✅ |
| listContent | paddingHorizontal | `SPACING.contentMargin` (16) | ✅ |
| listContent | paddingBottom | `SPACING.xl` (32) | ✅ |
| card | paddingVertical | `14` | ⚠️ `SPACING.cardPadding`をハードコード |
| cardTop | marginBottom | `8` | ⚠️ `SPACING.sm`をハードコード |
| tagsRow | gap | `5` | ❌ 8pxグリッド外(4か8が正しい) |
| tagsRow | marginBottom | `10` | ❌ 8pxグリッド外(8か12が正しい) |
| tag | borderRadius | `5` | ❌ 8pxグリッド外(RADIUS.badge=4が正しい) |
| tag | paddingVertical | `3` | ❌ 8pxグリッド外(4=xsが正しい) |
| tag | paddingHorizontal | `8` | ⚠️ `SPACING.sm`をハードコード |
| statsRow | gap | `16` | ⚠️ `SPACING.md`をハードコード |
| ctaButton | height | `60` | ⚠️ `BUTTON_HEIGHT.primary`をハードコード |
| ctaButton | borderRadius | `18` | ⚠️ `RADIUS.btnCTA`をハードコード |
| ctaButton | paddingHorizontal | `SPACING.xl` (32) | ✅ |

---

### ProgressScreen.tsx

| 箇所 | プロパティ | 値 | 状態 |
|------|-----------|-----|------|
| content | paddingTop | `insets.top + SPACING.md` | ✅ |
| content | paddingBottom | `SPACING.xxl` (48) | ✅ |
| screenTitle | paddingHorizontal | `SPACING.contentMargin` (16) | ✅ |
| screenTitle | marginBottom | `SPACING.sectionGap` (20) | ✅ |
| screenTitle | paddingTop | (なし) | ❌ HistoryScreenと不統一 |
| sectionLabel | paddingHorizontal | `SPACING.contentMargin` (16) | ✅ |
| sectionLabel | marginTop | `SPACING.sectionGap` (20) | ✅ |
| sectionLabel | marginBottom | `10` | ❌ 8pxグリッド外(8か12が正しい) |
| hListContent | paddingHorizontal | `SPACING.contentMargin` (16) | ✅ |
| hListContent | gap | `SPACING.cardGap` (8) | ✅ |
| prCard | padding | `SPACING.cardPadding` (14) | ✅ |
| prExName | marginBottom | `6` | ❌ 8pxグリッド外(4か8が正しい) |
| prDate | marginTop | `4` | ⚠️ `SPACING.xs`をハードコード |
| pvCard | padding | `SPACING.cardPadding` (14) | ✅ |
| pvPart | marginBottom | `6` | ❌ 8pxグリッド外(4か8が正しい) |
| pvDate | marginTop | `5` | ❌ 8pxグリッド外(4か8が正しい) |
| chartBox | padding | `SPACING.cardPadding` (14) | ✅ |
| chartBox | marginHorizontal | `SPACING.contentMargin` (16) | ✅ |
| chartTitle | marginBottom | `14` | ⚠️ `SPACING.cardPadding`をハードコード |
| chartBars | gap | `5` | ❌ 8pxグリッド外(4か8が正しい) |
| chartBars | height | `96` | ⚠️ 12u=96 グリッド準拠だがハードコード |
| barTopVal | marginBottom | `3` | ❌ 8pxグリッド外(4=xsが正しい) |
| barLabel | marginTop | `5` | ❌ 8pxグリッド外(4か8が正しい) |
| streakRow | paddingHorizontal | `SPACING.contentMargin` (16) | ✅ |
| streakRow | paddingTop | `SPACING.xs` (4) | ✅ |
| streakRow | marginTop | `SPACING.sectionGap` (20) | ✅ |
| streakSub | paddingHorizontal | `SPACING.contentMargin` (16) | ✅ |
| streakSub | paddingTop | `4` | ⚠️ `SPACING.xs`をハードコード |
| calBox | padding | `SPACING.md` (16) | ✅ |
| calBox | marginHorizontal | `SPACING.contentMargin` (16) | ✅ |
| calHeader | marginBottom | `10` | ❌ 8pxグリッド外(8か12が正しい) |
| calCell | marginBottom | `2` | ❌ 8pxグリッド外(4か0が正しい) |
| calWeekLabel | paddingVertical | `3` | ❌ 8pxグリッド外(4=xsが正しい) |
| calDayBtn | width/height | `34` | ❌ 8pxグリッド外(32か40が正しい) |
| calDot | marginTop | `2` | ❌ 8pxグリッド外(4=xsが正しい) |
| bottomPad | height | `SPACING.lg` (24) | ✅ |

---

### MonthlyReportScreen.tsx

| 箇所 | プロパティ | 値 | 状態 |
|------|-----------|-----|------|
| content | paddingTop | `SPACING.md` (16) | ✅ |
| content | paddingBottom | `SPACING.xxl` (48) | ✅ |
| monthSelector | marginHorizontal | `SPACING.contentMargin` (16) | ✅ |
| monthSelector | marginBottom | `SPACING.sectionGap` (20) | ✅ |
| sectionLabel | paddingHorizontal | `SPACING.contentMargin` (16) | ✅ |
| sectionLabel | marginTop | `SPACING.sectionGap` (20) | ✅ |
| sectionLabel | marginBottom | `10` | ❌ 8pxグリッド外(8か12が正しい) |
| summaryCard | marginHorizontal | `SPACING.contentMargin` (16) | ✅ |
| summaryItem | paddingVertical | `SPACING.cardPadding` (14) | ✅ |
| summaryItem | paddingHorizontal | `SPACING.cardPadding` (14) | ✅ |
| unitText | marginBottom | `3` | ❌ 8pxグリッド外(4=xsが正しい) |
| summaryLabel | marginTop | `4` | ⚠️ `SPACING.xs`をハードコード |
| bodyPartCard | padding | `SPACING.md` (16) | ✅ |
| bodyPartCard | marginHorizontal | `SPACING.contentMargin` (16) | ✅ |
| bodyPartRow | gap | `SPACING.sm` (8) | ✅ |
| chartBox | padding | `SPACING.cardPadding` (14) | ✅ |
| chartBox | marginHorizontal | `SPACING.contentMargin` (16) | ✅ |
| chartTitle | marginBottom | `14` | ⚠️ `SPACING.cardPadding`をハードコード |
| chartBars | gap | `5` | ❌ 8pxグリッド外(4か8が正しい) |
| barTopVal | marginBottom | `3` | ❌ 8pxグリッド外(4=xsが正しい) |
| barLabel | marginTop | `5` | ❌ 8pxグリッド外(4か8が正しい) |
| rankCard | marginHorizontal | `SPACING.contentMargin` (16) | ✅ |
| rankRow | height | `44` | ✅ (BUTTON_HEIGHT.icon相当) |
| rankRow | paddingHorizontal | `SPACING.md` (16) | ✅ |
| rankRow | gap | `SPACING.sm` (8) | ✅ |
| rankRight | gap | `2` | ❌ 8pxグリッド外(4=xsが正しい) |
| bottomPad | height | `SPACING.lg` (24) | ✅ |

---

### RMCalculatorScreen.tsx

| 箇所 | プロパティ | 値 | 状態 |
|------|-----------|-----|------|
| content | paddingTop | `SPACING.lg` (24) | ✅ |
| heroCard | marginHorizontal | `SPACING.contentMargin` (16) | ✅ |
| heroCard | marginBottom | `SPACING.lg` (24) | ✅ |
| heroCard | paddingVertical | `SPACING.lg` (24) | ✅ |
| heroLabel | marginBottom | `SPACING.xs` (4) | ✅ |
| heroUnit | marginLeft | `SPACING.xs` (4) | ✅ |
| heroUnit | marginBottom | `6` | ❌ 8pxグリッド外(4か8が正しい) |
| heroNote | marginTop | `SPACING.xs` (4) | ✅ |
| inputCard | marginHorizontal | `SPACING.contentMargin` (16) | ✅ |
| inputCard | paddingHorizontal | `SPACING.md` (16) | ✅ |
| inputCard | paddingVertical | `SPACING.md` (16) | ✅ |
| inputCard | marginBottom | `SPACING.md` (16) | ✅ |
| inputGroup | paddingVertical | `SPACING.sm` (8) | ✅ |
| inputLabel | marginBottom | `SPACING.sm` (8) | ✅ |
| stepDisplay | paddingBottom | `2` | ❌ 8pxグリッド外(4=xsが正しい) |
| stepUnit | marginLeft | `SPACING.xs` (4) | ✅ |
| stepUnit | marginBottom | `4` | ⚠️ `SPACING.xs`をハードコード |
| divider | marginVertical | `SPACING.xs` (4) | ✅ |
| sectionLabel | marginHorizontal | `SPACING.contentMargin` (16) | ✅ |
| sectionLabel | marginTop | `SPACING.md` (16) | ✅ |
| sectionLabel | marginBottom | `10` | ❌ 8pxグリッド外(8か12が正しい) |
| tableRow | height | `44` | ✅ |
| tableRow | paddingHorizontal | `SPACING.md` (16) | ✅ |
| tableHeader | height | `40` | ✅ |

---

### SettingsScreen.tsx

| 箇所 | プロパティ | 値 | 状態 |
|------|-----------|-----|------|
| content | paddingBottom | `SPACING.xl` (32) | ✅ |
| content | paddingTop | (なし、トップパディングなし) | ❌ 他Drawer画面と不統一 |
| sectionHeader | paddingHorizontal | `SPACING.contentMargin` (16) | ✅ |
| sectionHeader | marginTop | `SPACING.sectionGap` (20) | ✅ |
| sectionHeader | marginBottom | `10` | ❌ 8pxグリッド外(8か12が正しい) |
| sectionCard | marginHorizontal | `SPACING.contentMargin` (16) | ✅ |
| row | height | `48` | ⚠️ ハードコード(44以上で仕様準拠) |
| row | paddingHorizontal | `SPACING.md` (16) | ✅ |
| rowSeparator | marginLeft | `SPACING.md` (16) | ✅ |

---

### CustomDrawerContent.tsx

| 箇所 | プロパティ | 値 | 状態 |
|------|-----------|-----|------|
| miniDash | paddingTop | `insets.top + SPACING.md` | ✅ |
| miniDash | paddingHorizontal | `SPACING.md` (16) | ✅ |
| miniDash | paddingBottom | `SPACING.md` (16) | ✅ |
| miniDash | marginBottom | `SPACING.sm` (8) | ✅ |
| dashTitle | marginBottom | `SPACING.sm` (8) | ✅ |
| dashItem | gap | `3` | ❌ 8pxグリッド外(4=xsが正しい) |
| dashBorder | paddingLeft | `SPACING.md` (16) | ✅ |
| navList | paddingHorizontal | `SPACING.sm` (8) | ✅ |
| navList | paddingTop | `SPACING.sm` (8) | ✅ |
| navItem | paddingHorizontal | `SPACING.md` (16) | ✅ |
| navItem | marginBottom | `2` | ❌ 8pxグリッド外(4=xsが正しい) |
| navItem | minHeight | `44` | ✅ |
| navIcon | width | `26` | ❌ 8pxグリッド外(24か28が正しい) |
| navLabel | marginLeft | `SPACING.sm` (8) | ✅ |
| footer | paddingHorizontal | `SPACING.sm` (8) | ✅ |
| footer | paddingBottom | `SPACING.md` (16) | ✅ |
| separator | height | `1` | ✅ |
| separator | marginHorizontal | `SPACING.sm` (8) | ✅ |
| separator | marginBottom | `SPACING.sm` (8) | ✅ |

---

### BottomSheet.tsx

| 箇所 | プロパティ | 値 | 状態 |
|------|-----------|-----|------|
| sheet | paddingBottom | `insets.bottom + 8` | ⚠️ `+ SPACING.sm`をハードコード |
| grip | width | `36` | ❌ 8pxグリッド外(32か40が正しい) |
| grip | height | `4` | ⚠️ `SPACING.xs`をハードコード |
| grip | marginTop | `10` | ❌ 8pxグリッド外(8か12が正しい) |
| header | paddingHorizontal | `SPACING.contentMargin` (16) | ✅ |
| header | paddingTop | `14` | ⚠️ `SPACING.cardPadding`をハードコード |
| header | paddingBottom | `12` | ❌ 8pxグリッド外(8か16が正しい) |
| subtitle | marginTop | `3` | ❌ 8pxグリッド外(4=xsが正しい) |
| bodyContent | paddingHorizontal | `SPACING.contentMargin` (16) | ✅ |
| bodyContent | paddingBottom | `8` | ⚠️ `SPACING.sm`をハードコード |
| sheetRow | paddingVertical | `12` | ❌ 8pxグリッド外(8か16が正しい) |
| sheetRow | minHeight | `44` | ✅ |
| prBadge | paddingHorizontal | `5` | ❌ 8pxグリッド外(4か8が正しい) |
| prBadge | paddingVertical | `2` | ❌ 8pxグリッド外(4=xsが正しい) |
| sparkStyles.wrap | paddingTop | `14` | ⚠️ `SPACING.cardPadding`をハードコード |
| sparkStyles.wrap | paddingBottom | `4` | ⚠️ `SPACING.xs`をハードコード |
| sparkStyles.bars | gap | `4` | ⚠️ `SPACING.xs`をハードコード |
| sparkStyles.lbl | marginTop | `4` | ⚠️ `SPACING.xs`をハードコード |

---

### SwipeableRow.tsx

| 箇所 | プロパティ | 値 | 状態 |
|------|-----------|-----|------|
| deleteBtn | width | `72` | ⚠️ ハードコード(9u=72 グリッド準拠) |
| deleteTxt | marginTop | `2` | ❌ 8pxグリッド外(4=xsが正しい) |

---

### RootNavigator.tsx (HamburgerButton)

| 箇所 | プロパティ | 値 | 状態 |
|------|-----------|-----|------|
| HamburgerButton | marginLeft | `16` | ⚠️ `SPACING.contentMargin`をハードコード |
| HamburgerButton | padding | `4` | ⚠️ `SPACING.xs`をハードコード |
| HamburgerButton | minHeight/minWidth | `44` | ✅ (仕様通り) |

---

## 2. 8pxグリッド違反一覧

違反値を数値順で整理。

| 値 | 出現箇所 |
|----|---------|
| `2` | menuSub.marginTop, calCell.marginBottom, deleteTxt.marginTop, rankRight.gap, navItem.marginBottom |
| `3` | statItem.gap, menuLeft.gap, barTopVal.marginBottom, subtitle.marginTop, prBadge.paddingVertical, dashItem.gap, calWeekLabel.paddingVertical, unitText.marginBottom |
| `5` | tagsRow.gap, chartBars.gap (Progress/Monthly), barLabel.marginTop, prBadge.paddingHorizontal, pvDate.marginTop |
| `6` | prExName.marginBottom, pvPart.marginBottom, histNote.gap, heroUnit.marginBottom |
| `7` | chips.gap |
| `9` | chip.paddingVertical, setBadge.borderRadius |
| `10` | sectionLabel.marginBottom (全画面共通で違反), actHeaderRight.gap, numCtrl.gap, calHeader.marginBottom, endBtn.marginTop |
| `11` | setBadge.paddingHorizontal |
| `12` | tabsWrap.paddingTop, startWrap.paddingTop, actHeader.paddingBottom¹, numCtrl.paddingBottom, sheetRow.paddingVertical, header.paddingBottom, doneBtn.marginBottom, setRow.paddingVertical |
| `22` | sectionGapTop.marginTop (Homeのみ、20か24に統一すべき) |
| `26` | navIcon.width |
| `34` | tab.height, calDayBtn.width/height |
| `36` | grip.width |
| `52` | menuRow.minHeight, exRow.minHeight |

¹ 14はcardPadding=14で意味的に正しいが8pxグリッド外の値

---

## 3. 画面間の不統一箇所

### 3-1. sectionLabel.marginBottom (最重要・全画面に影響)

| 画面 | 値 |
|------|-----|
| HomeScreen | `10` (ハードコード) |
| WorkoutScreen (ActiveWorkout) | `8` (ハードコード) |
| HistoryScreen | 該当なし |
| ProgressScreen | `10` (ハードコード) |
| MonthlyReportScreen | `10` (ハードコード) |
| RMCalculatorScreen | `10` (ハードコード) |
| SettingsScreen (sectionHeader) | `10` (ハードコード) |

**全画面で値が異なる（8と10が混在）。8pxグリッドに合わせ `SPACING.sm (8)` に統一すべき。**

### 3-2. sectionLabel.marginTop

| 画面 | 値 |
|------|-----|
| HomeScreen | `SPACING.md` (16) |
| WorkoutScreen (ActiveWorkout) | なし（sectionLabelにmaginTopなし） |
| ProgressScreen | `SPACING.sectionGap` (20) |
| MonthlyReportScreen | `SPACING.sectionGap` (20) |
| RMCalculatorScreen | `SPACING.md` (16) |
| SettingsScreen | `SPACING.sectionGap` (20) |

**HomeとRMCalculatorは16、その他は20で不統一。design-specではsectionGap(20)が指定されており、20に統一すべき。**

### 3-3. screenTitle.paddingTop (スクリーンタイトル直上の余白)

| 画面 | 値 | 方法 |
|------|-----|------|
| HomeScreen (`date`) | `SPACING.sm` (8) | paddingTop |
| HistoryScreen | `SPACING.sm` (8) | paddingTop |
| ProgressScreen | なし | — |
| MonthlyReport / RM / Settings | Drawerヘッダーに依存 | — |

**ProgressScreenのみscreenTitleにpaddingTopがなく、他と不統一。**

### 3-4. content.paddingTop (ScrollView冒頭)

| 画面 | 値 |
|------|-----|
| HomeScreen | `SPACING.sm` (8) |
| MonthlyReportScreen | `SPACING.md` (16) |
| RMCalculatorScreen | `SPACING.lg` (24) |
| ProgressScreen | `insets.top + SPACING.md` |
| SettingsScreen | なし |

**画面ごとに異なる（8/16/24/0）。Drawerルート画面はNavigationヘッダーがあるため一定の一貫性は不要だが、MonthlyReport/RMCalculatorの16と24の差は意図が不明。**

### 3-5. bottomPad.height (末尾余白)

| 画面 | 値 |
|------|-----|
| HomeScreen | `20` (SPACING.sectionGapをハードコード) |
| WorkoutScreen (ActiveWorkout) | `20` (ハードコード) |
| ProgressScreen | `SPACING.lg` (24) |
| MonthlyReportScreen | `SPACING.lg` (24) |

**HomeとWorkoutは20のハードコード、Progress/Monthlyは`SPACING.lg`(24)。値も異なる。**

### 3-6. chartTitle.marginBottom (チャート内タイトル)

| 画面 | 値 |
|------|-----|
| ProgressScreen | `14` (ハードコード) |
| MonthlyReportScreen | `14` (ハードコード) |

**値は同じだがどちらもハードコード。SPACING.cardPadding(14)は8pxグリッド外の値なので、`SPACING.md (16)` に統一すべき。**

### 3-7. chartBars.gap (バーチャートのバー間隔)

| 画面 | 値 |
|------|-----|
| ProgressScreen | `5` (ハードコード) |
| MonthlyReportScreen | `5` (ハードコード) |

**値は一致しているが8pxグリッド外。`SPACING.xs (4)` か `SPACING.sm (8)` に統一すべき。**

---

## 4. SPACING定数を使わずハードコードされている数値一覧

### 定数に対応する値のハードコード（値は正しいが定数未使用）

| 定数 | 値 | ハードコード箇所 |
|------|-----|----------------|
| `SPACING.sm` (8) | `8` | tabsWrap.paddingBottom, tabsContent.gap¹, cardTop.marginBottom, tag.paddingHorizontal, statsRow.gap¹, histBars.marginBottom, histNote.paddingTop, histBars.gap¹, stepRow.gap, doneBtn.gap, bodyContent.paddingBottom, sparkStyles.bars.gap |
| `SPACING.md` (16) | `16` | tab.paddingHorizontal, HamburgerButton.marginLeft |
| `SPACING.xs` (4) | `4` | actHeaderRight.gap, numUnit.marginTop(-4), sparkStyles.fill.height, prDate.marginTop, stepUnit.marginBottom, streakSub.paddingTop, summaryLabel.marginTop, sparkStyles.wrap.paddingBottom, sparkStyles.bars.gap, sparkStyles.lbl.marginTop |
| `SPACING.cardPadding` (14) | `14` | menuRow.paddingVertical, exRow.paddingVertical, actHeader.paddingBottom, numBlock.paddingVertical, chartTitle.marginBottom×2, sparkStyles.wrap.paddingTop, header.paddingTop |
| `SPACING.sectionGap` (20) | `20` | bottomPad.height×2 |
| `SPACING.contentMargin` (16) | `16` | HamburgerButton.marginLeft |
| `BUTTON_HEIGHT.primary` (60) | `60` | ctaButton.height×2 |
| `RADIUS.btnCTA` (18) | `18` | ctaButton.borderRadius (HistoryScreen) |

¹ 値は定数と一致するがグリッド外の意味で使用

### グリッド外のハードコード値（定数に対応するものがない）

| 値 | 箇所 |
|----|-----|
| `2` | menuSub.marginTop, calCell.marginBottom, deleteTxt.marginTop, rankRight.gap, navItem.marginBottom |
| `3` | statItem.gap, menuLeft.gap, barTopVal.marginBottom, subtitle.marginTop, prBadge.paddingVertical, dashItem.gap, calWeekLabel.paddingVertical, unitText.marginBottom |
| `5` | tagsRow.gap, chartBars.gap×2, barLabel.marginTop×2, prBadge.paddingHorizontal, pvDate.marginTop |
| `6` | prExName.marginBottom, pvPart.marginBottom, histNote.gap, heroUnit.marginBottom |
| `7` | chips.gap |
| `9` | chip.paddingVertical, setBadge.borderRadius |
| `10` | 全画面sectionLabel.marginBottom, actHeaderRight.gap, numCtrl.gap, calHeader.marginBottom, endBtn.marginTop |
| `11` | setBadge.paddingHorizontal |
| `12` | tabsWrap.paddingTop, startWrap.paddingTop, numCtrl.paddingBottom, sheetRow.paddingVertical, header.paddingBottom, doneBtn.marginBottom, setRow.paddingVertical, grip.marginTop |
| `22` | sectionGapTop.marginTop |
| `26` | navIcon.width |
| `34` | tab.height, calDayBtn.width/height |
| `36` | grip.width |
| `52` | menuRow.minHeight, exRow.minHeight |

---

## 5. 修正推奨案

### 優先度: 高（全画面に影響）

#### A. sectionLabel.marginBottom を統一
```diff
- marginBottom: 10,
+ marginBottom: SPACING.sm,  // 8
```
**対象**: HomeScreen, ProgressScreen, MonthlyReportScreen, RMCalculatorScreen, SettingsScreen, WorkoutScreen (ActiveWorkout)

#### B. sectionLabel.marginTop を統一
```diff
// HomeScreen, RMCalculatorScreen
- marginTop: SPACING.md,   // 16
+ marginTop: SPACING.sectionGap,  // 20
```
**対象**: HomeScreen, RMCalculatorScreen

#### C. statItem/dashItem/menuLeft の gap を修正
```diff
- gap: 3,
+ gap: SPACING.xs,  // 4
```
**対象**: HomeScreen.statItem, HomeScreen.menuLeft, CustomDrawerContent.dashItem, ProgressScreen.prNumRow/pvNumRow.gap

---

### 優先度: 中（カード・チャートの統一）

#### D. chartTitle.marginBottom を修正
```diff
- marginBottom: 14,
+ marginBottom: SPACING.md,  // 16
```
**対象**: ProgressScreen.chartTitle, MonthlyReportScreen.chartTitle

#### E. chartBars.gap を修正
```diff
- gap: 5,
+ gap: SPACING.xs,  // 4
```
**対象**: ProgressScreen.chartBars, MonthlyReportScreen.chartBars

#### F. barTopVal/barLabel のマージンを修正
```diff
- marginBottom: 3,  // barTopVal
+ marginBottom: SPACING.xs,  // 4
- marginTop: 5,     // barLabel
+ marginTop: SPACING.xs,     // 4
```
**対象**: ProgressScreen, MonthlyReportScreen（共通パターン）

#### G. bottomPad を統一
```diff
// HomeScreen, WorkoutScreen
- height: 20,
+ height: SPACING.sectionGap,  // 20 — 値は同じだが定数化
// ProgressScreen, MonthlyReportScreen
// SPACING.lg (24) を維持 (より大きな余白が適切な場合はそのまま)
```

#### H. ctaButton のハードコードを定数化
```diff
// HistoryScreen
- height: 60,
- borderRadius: 18,
+ height: BUTTON_HEIGHT.primary,
+ borderRadius: RADIUS.btnCTA,
```

---

### 優先度: 低（細部の微調整）

#### I. chips.gap を修正
```diff
- gap: 7,
+ gap: SPACING.sm,  // 8
```

#### J. menuRow/exRow.minHeight を修正
```diff
- minHeight: 52,
+ minHeight: BUTTON_HEIGHT.icon + SPACING.xs,  // 48 (または単純に48)
```

#### K. setBadge パディングを修正
```diff
- paddingHorizontal: 11,
- paddingVertical: 5,
+ paddingHorizontal: SPACING.sm,    // 8 (または12)
+ paddingVertical: SPACING.xs,      // 4
```

#### L. sheetRow.paddingVertical を修正
```diff
- paddingVertical: 12,
+ paddingVertical: SPACING.sm,  // 8  (または SPACING.md=16)
```

#### M. tab.height と calDayBtn.height を修正
```diff
- height: 34,  // tab
+ height: 32,  // SPACING.xl/2 = 32 (iconSmall相当)
- width: 34, height: 34,  // calDayBtn
+ width: 32, height: 32,
```

#### N. navItem.marginBottom を修正
```diff
- marginBottom: 2,
+ marginBottom: SPACING.xs,  // 4
```

#### O. navIcon.width を修正
```diff
- width: 26,
+ width: 24,  // 24 = SPACING.lg=3u (Ioniconsサイズと揃える)
```

---

## 6. サマリー統計

| カテゴリ | 件数 |
|---------|------|
| 8pxグリッド違反（明確） | **42件** |
| SPACING定数未使用（値は正しい） | **38件** |
| 画面間不統一 | **7箇所** |
| 問題なし | 多数 |

### 最も重大な問題

1. **`sectionLabel.marginBottom: 10`** — 全7画面で統一的に違反（値10は8でも12でもない）
2. **`sectionGapTop.marginTop: 22`** — HomeScreenのみ独自の中間値
3. **`chips.gap: 7`** — 1px足りない
4. **`chartBars.gap: 5`** / **`barTopVal.marginBottom: 3`** — ProgressとMonthlyで共通する違反パターン
