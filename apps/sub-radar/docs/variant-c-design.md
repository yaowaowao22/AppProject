# UIバリアントC 詳細設計書
## アナリティクス重視・データビジュアライゼーション型

> 作成日: 2026-03-23
> コンセプト: Spendee / Emma 風 — データを「見せる」ことで節約意識を高める
> 参照ファイル: `src/screens/DashboardScreen.tsx`（493行）

---

## 1. カラーパレット定義

### 1.1 ダークテーマ基盤

既存テーマ（`presetForestGreen`）のダークモード値をベースに、アナリティクス向けに調整する。

```typescript
// src/ui/variants/analyticsTheme.ts
// useTheme() の colors オブジェクトに追加するオーバーライド値

export const ANALYTICS_COLORS = {
  // ── 背景レイヤー（ダークネイビー系3層）──
  bgDeep:    '#0D1117',   // 最底層: 画面背景
  bgCard:    '#161B22',   // カード背景
  bgElevated:'#1C2128',   // 浮き上がった要素（インナーカード）

  // ── アクセント（現行テーマのティール系を維持・強化）──
  // 現行: primary=#4DB6AC / primaryLight=#80CBC4
  teal:      '#26C6DA',   // ビビッドティール（メインアクセント）
  tealSoft:  '#4DB6AC',   // ソフトティール（既存 primary dark）
  green:     '#66BB6A',   // グリーン（既存 secondary dark）
  greenDim:  '#388E3C',   // ダークグリーン

  // ── グラフ用アクセント（前月比インジケーター）──
  upGreen:   '#4CAF50',   // 増加（コスト上昇 = 悪）→ 警告的に使う
  downTeal:  '#26C6DA',   // 減少（コスト削減 = 良）→ ポジティブ
  neutral:   '#78909C',   // 変化なし

  // ── テキスト ──
  textBright: '#E6EDF3',  // 主要テキスト（高輝度）
  textMid:    '#8B949E',  // 補助テキスト
  textDim:    '#484F58',  // 無効・最低輝度

  // ── ボーダー ──
  borderSubtle: '#21262D', // 薄いセパレーター
  borderAccent: '#30363D', // カード枠

  // ── 警告（未使用サブスク）──
  warnOrange:  '#FF9800',  // 既存 CATEGORY_COLORS['生活'] と同値だが意味が異なる
  warnBg:      '#FF980018', // オレンジ 9% 不透明度
};
```

### 1.2 カテゴリカラー（既存値をそのまま使用）

```typescript
// types.ts:14-20 の CATEGORY_COLORS をそのまま流用
// 変更不要 — ダーク背景に対してすでに十分なコントラストがある

const CATEGORY_COLORS = {
  エンタメ: '#E91E63',  // ピンク
  仕事:    '#2196F3',  // ブルー
  生活:    '#FF9800',  // オレンジ
  学習:    '#9C27B0',  // パープル
  その他:  '#78909C',  // グレー
};
```

---

## 2. ダッシュボードレイアウト設計

### 2.1 全体構造（FlatList ヘッダー + グリッドリスト）

```
┌─────────────────────────────────────────┐
│ [Section A] アナリティクスヘッダー       │
│   - タイトル行 + 前月比インジケーター    │
│   - 3軸サマリー（月額 / 年間 / 件数）   │
├─────────────────────────────────────────┤
│ [Section B] カテゴリ別横棒グラフ         │
│   - 5カテゴリ × 横幅比率バー            │
│   - StyleSheet のみ（外部ライブラリ不要）│
├─────────────────────────────────────────┤
│ [Section C] 請求スケジュール（カレンダー）│
│   - 当月のカレンダーグリッド            │
│   - 請求日にカラードット表示            │
│   - 今日の日付をハイライト             │
├─────────────────────────────────────────┤
│ [Section D] 未使用サブスク警告          │
│   （条件付き表示）                      │
├─────────────────────────────────────────┤
│ [Section E] サブスクグリッドリスト      │
│   - 2カラムグリッド                     │
│   - コンパクトカード × n件             │
└─────────────────────────────────────────┘
                         [FAB +]
```

### 2.2 Section A: アナリティクスヘッダー

```
┌──────────────────────────────────────────┐
│ ダッシュボード          ▼ 12% 先月比     │  ← 前月比バッジ（↑赤/↓青）
│                                          │
│  ¥12,450                                 │  ← 月額（大フォント）
│  年間換算 ¥149,400                       │  ← 年額（小フォント）
│ ─────────────────────────────────────── │
│  月額           年間           件数      │
│ ¥12,450       ¥149,400         8件      │  ← 3軸
└──────────────────────────────────────────┘
```

**前月比の計算ロジック（設計）:**
- `SubscriptionContext` に `previousMonthTotal: number` を追加（フェーズ2）
- 暫定実装: `totalYearly / 12` と `totalMonthly` を比較（同値のため `0%`）
- 実装優先度: 低（設計書では UI のみ定義）

### 2.3 Section B: カテゴリ別横棒グラフ

```
カテゴリ別支出
┌──────────────────────────────────────────┐
│ エンタメ  ██████████████░░░░░  ¥5,200   │
│ 仕事     ██████████░░░░░░░░░  ¥2,800   │
│ 生活     ████████░░░░░░░░░░░  ¥2,100   │
│ 学習     ██████░░░░░░░░░░░░░  ¥1,800   │
│ その他   ██░░░░░░░░░░░░░░░░░    ¥550   │
└──────────────────────────────────────────┘
```

- バーの幅: `(カテゴリ合計 / 最大カテゴリ合計) * (利用可能幅 - ラベル幅 - 金額幅)`
- 外部ライブラリ不要: `View` の `width` を `%` または計算値で指定

### 2.4 Section C: 請求スケジュールカレンダー

```
3月の請求スケジュール
┌────┬────┬────┬────┬────┬────┬────┐
│ 日 │ 月 │ 火 │ 水 │ 木 │ 金 │ 土 │
├────┼────┼────┼────┼────┼────┼────┤
│    │    │    │    │    │    │  1 │
│  2 │  3 │  4 │[5] │  6 │  7 │  8 │  ← [5] = 今日
│  9 │ 10●│ 11 │ 12 │ 13 │ 14 │ 15 │  ← ● = 請求あり
│ 16 │ 17 │ 18 │ 19 │ 20●│ 21 │ 22 │
│ 23 │ 24 │ 25 │ 26 │ 27 │ 28 │ 29 │
│ 30 │ 31●│    │    │    │    │    │
└────┴────┴────┴────┴────┴────┴────┘
```

- 請求日のある日: カラードット（サブスク色）をセルに重ねて表示
- 複数サブスクが同日: 最大3ドットを横並び、それ以上は `+n`
- 今日: 枠に `teal` アクセント

### 2.5 Section D: 未使用サブスク警告（改善版）

```
┌──────────────────────────────────────────┐
│ ⚠  無駄なサブスクの可能性  [3件]        │
├──────────────────────────────────────────┤
│ 🎵 Spotify    ¥980/月  30日以上未使用    │
│ 📺 Hulu       ¥1,026/月  45日以上未使用 │
│ 📚 Kindle     ¥980/月  62日以上未使用    │
│         合計 ¥2,986/月 が無駄な可能性    │
└──────────────────────────────────────────┘
```

- オレンジ左ボーダー + 薄いオレンジ背景
- 「合計金額の強調」によって行動変容を促す（Emma参考）

### 2.6 Section E: 2カラムグリッドカード

```
┌──────────────┐  ┌──────────────┐
│ [●] Netflix  │  │ [●] Spotify  │
│ エンタメ     │  │ エンタメ     │
│ ¥1,490/月   │  │   ¥980/月   │
│ ▐ 残3日    │  │ ▐ 残15日   │
└──────────────┘  └──────────────┘
```

- カード左端: ブランドカラーの細ボーダー（3px）
- アイコン: 円形 + ブランドカラー13%不透明度背景（既存ロジック流用）
- 「残n日」バッジ: days≤1=赤、days≤3=オレンジ、それ以外=ティール

---

## 3. StyleSheet 定義（実装レベル）

### 3.1 AnalyticsHeader スタイル

```typescript
// VariantC 専用スタイル定義（DashboardScreen.tsx:381 以降に追加）
const analyticsStyles = StyleSheet.create({

  // ── Section A: ヘッダー ──────────────────────────────────────────────────
  analyticsHeader: {
    backgroundColor: '#161B22',   // ANALYTICS_COLORS.bgCard
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#21262D',       // ANALYTICS_COLORS.borderSubtle
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E6EDF3',             // ANALYTICS_COLORS.textBright
  },
  // 前月比インジケーター（↑↓）
  momBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  momBadgeUp: {
    backgroundColor: '#F4433618', // 増加 = 悪 → 赤背景
  },
  momBadgeDown: {
    backgroundColor: '#26C6DA18', // 減少 = 良 → ティール背景
  },
  momText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // メイン金額
  mainAmount: {
    fontSize: 38,
    fontWeight: '700',
    color: '#26C6DA',             // ANALYTICS_COLORS.teal（ビビッドアクセント）
    letterSpacing: -1,
  },
  yearlyAmount: {
    fontSize: 13,
    color: '#8B949E',             // ANALYTICS_COLORS.textMid
    marginTop: 2,
    marginBottom: 16,
  },
  // 3軸サマリー行
  kpiRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#21262D',    // ANALYTICS_COLORS.borderSubtle
    paddingTop: 14,
    gap: 0,
  },
  kpiItem: {
    flex: 1,
    alignItems: 'center',
  },
  kpiDivider: {
    width: 1,
    backgroundColor: '#21262D',
  },
  kpiValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E6EDF3',
    marginBottom: 2,
  },
  kpiLabel: {
    fontSize: 11,
    color: '#8B949E',
  },

  // ── Section B: カテゴリ横棒グラフ ──────────────────────────────────────
  chartCard: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B949E',
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  barLabel: {
    width: 52,                    // カテゴリ名の固定幅
    fontSize: 12,
    color: '#8B949E',
    textAlign: 'right',
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#21262D',  // トラック背景
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
    // width は動的に計算（パーセンテージ文字列または数値）
  },
  barAmount: {
    width: 58,                    // 金額の固定幅
    fontSize: 12,
    color: '#E6EDF3',
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },

  // ── Section C: カレンダーヒートマップ ──────────────────────────────────
  calendarCard: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B949E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  calendarTotalBadge: {
    fontSize: 12,
    color: '#26C6DA',
    fontWeight: '600',
  },
  weekDayRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekDayText: {
    fontSize: 10,
    color: '#484F58',             // ANALYTICS_COLORS.textDim
    fontWeight: '500',
  },
  calendarGrid: {
    gap: 2,
  },
  calendarWeekRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 2,
  },
  calendarCell: {
    flex: 1,
    aspectRatio: 1,               // 正方形
    alignItems: 'center',
    justifyContent: 'flex-start', // 数字は上、ドットは下
    paddingTop: 4,
    borderRadius: 6,
  },
  calendarCellToday: {
    borderWidth: 1.5,
    borderColor: '#26C6DA',       // 今日の強調枠
    backgroundColor: '#26C6DA10',
  },
  calendarCellBilling: {
    backgroundColor: '#161B22',   // 請求日セル（通常と同じだがドットで区別）
  },
  calendarDayText: {
    fontSize: 11,
    color: '#8B949E',
  },
  calendarDayTextToday: {
    color: '#26C6DA',
    fontWeight: '700',
  },
  calendarDayTextBilling: {
    color: '#E6EDF3',
    fontWeight: '600',
  },
  calendarDotsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
    flexWrap: 'nowrap',
  },
  calendarDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  calendarMoreText: {
    fontSize: 7,
    color: '#8B949E',
  },

  // ── Section D: 未使用警告（改善版）──────────────────────────────────────
  unusedSection: {
    backgroundColor: '#FF980012', // warnBg: オレンジ 7% 不透明度
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FF980030',
    padding: 14,
    marginBottom: 12,
  },
  unusedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  unusedTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF9800',
    flex: 1,
  },
  unusedCountBadge: {
    backgroundColor: '#FF980030',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unusedCountText: {
    fontSize: 11,
    color: '#FF9800',
    fontWeight: '600',
  },
  unusedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#FF980020',
    gap: 8,
  },
  unusedItemName: {
    flex: 1,
    fontSize: 13,
    color: '#E6EDF3',
  },
  unusedItemAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF9800',
  },
  unusedItemDays: {
    fontSize: 11,
    color: '#8B949E',
  },
  unusedTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#FF980030',
  },
  unusedTotalLabel: {
    fontSize: 12,
    color: '#8B949E',
  },
  unusedTotalAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF9800',
  },

  // ── Section E: 2カラムグリッドリスト ────────────────────────────────────
  gridSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B949E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 4,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  gridCard: {
    flex: 1,
    backgroundColor: '#161B22',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#21262D',
    borderLeftWidth: 3,           // 左ボーダーはカラーで上書き
    // borderLeftColor: item.color  ← 動的に設定
  },
  gridCardInner: {
    gap: 6,
  },
  gridIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  gridIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridServiceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E6EDF3',
    flex: 1,
  },
  gridCategory: {
    fontSize: 10,
    color: '#8B949E',
  },
  gridAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#26C6DA',             // ティールアクセント
  },
  gridAmountUnit: {
    fontSize: 10,
    color: '#8B949E',
  },
  gridDaysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  gridDaysBar: {
    height: 3,
    borderRadius: 2,
    flex: 1,
    backgroundColor: '#21262D',
    overflow: 'hidden',
  },
  gridDaysBarFill: {
    height: '100%',
    borderRadius: 2,
    // width: `${Math.min((30 - days) / 30, 1) * 100}%`
    // backgroundColor: days <= 1 ? '#F44336' : days <= 3 ? '#FF9800' : '#26C6DA'
  },
  gridDaysText: {
    fontSize: 10,
    fontWeight: '600',
    // color: days <= 1 ? '#F44336' : days <= 3 ? '#FF9800' : '#8B949E'
  },
});
```

---

## 4. カテゴリ別横棒グラフの実装（View/StyleSheet）

### 4.1 データ計算ロジック

```typescript
// DashboardScreen.tsx に追加する計算（既存 useMemo の近く）

// カテゴリ別月額合計
const categoryTotals = useMemo(() => {
  const totals: Record<string, number> = {};
  for (const sub of activeSubs) {
    const cat = sub.category ?? 'その他';
    totals[cat] = (totals[cat] ?? 0) + calcMonthlyAmount(sub);
  }
  // 金額降順でソート
  return Object.entries(totals)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amount]) => ({ cat, amount }));
}, [activeSubs]);

const maxCategoryAmount = useMemo(
  () => Math.max(...categoryTotals.map(({ amount }) => amount), 1),
  [categoryTotals],
);
```

### 4.2 CategoryBarChart JSX

```tsx
{/* ── Section B: カテゴリ別横棒グラフ ── */}
{categoryTotals.length > 0 && (
  <View style={analyticsStyles.chartCard}>
    <Body style={analyticsStyles.chartTitle}>カテゴリ別支出</Body>
    {categoryTotals.map(({ cat, amount }) => {
      const fillRatio = amount / maxCategoryAmount;  // 0.0 〜 1.0
      const barColor = CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS] ?? '#78909C';
      return (
        <View key={cat} style={analyticsStyles.barRow}>
          {/* カテゴリ名 */}
          <Caption
            style={analyticsStyles.barLabel}
            numberOfLines={1}
          >
            {cat}
          </Caption>

          {/* バートラック */}
          <View style={analyticsStyles.barTrack}>
            <View
              style={[
                analyticsStyles.barFill,
                {
                  width: `${Math.round(fillRatio * 100)}%`,
                  backgroundColor: barColor,
                },
              ]}
            />
          </View>

          {/* 金額 */}
          <Caption style={analyticsStyles.barAmount}>
            ¥{Math.round(amount).toLocaleString('ja-JP')}
          </Caption>
        </View>
      );
    })}
  </View>
)}
```

**ポイント:**
- `barTrack` が `overflow: 'hidden'` なので、`barFill` の幅が `100%` を超えても安全
- `width: '${percent}%'` は React Native でそのまま使用可能（文字列パーセンテージ）
- 外部ライブラリ不要: 純粋に `View` と `StyleSheet` のみ

---

## 5. 請求スケジュールカレンダーの実装

### 5.1 カレンダーデータ生成ロジック

```typescript
// カレンダー用データ（DashboardScreen.tsx に追加）

const calendarData = useMemo(() => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  // 月初の曜日（0=日, 1=月, ..., 6=土）
  const firstDow = new Date(year, month, 1).getDay();
  // 月の日数
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // 請求日 → サブスク一覧のマップ
  const billingMap: Record<number, Array<{ color: string; name: string }>> = {};
  for (const sub of activeSubs) {
    const day = sub.billingDay;
    if (!billingMap[day]) billingMap[day] = [];
    billingMap[day].push({ color: sub.color, name: sub.name });
  }

  // 6週 × 7日のグリッドを生成
  const weeks: Array<Array<{ day: number | null; subs: Array<{ color: string; name: string }> }>> = [];
  let dayPtr = 1 - firstDow; // 1日の前の空白分を負値でスタート

  for (let w = 0; w < 6; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const day = dayPtr;
      if (day >= 1 && day <= daysInMonth) {
        week.push({ day, subs: billingMap[day] ?? [] });
      } else {
        week.push({ day: null, subs: [] });
      }
      dayPtr++;
    }
    // 全てnullの週はスキップ
    if (week.some((c) => c.day !== null)) {
      weeks.push(week);
    }
  }

  return { weeks, today, monthLabel: `${month + 1}月` };
}, [activeSubs]);
```

### 5.2 CalendarHeatmap JSX

```tsx
{/* ── Section C: 請求スケジュールカレンダー ── */}
<View style={analyticsStyles.calendarCard}>
  {/* ヘッダー */}
  <View style={analyticsStyles.calendarHeader}>
    <Caption style={analyticsStyles.calendarTitle}>
      {calendarData.monthLabel}の請求スケジュール
    </Caption>
    <Caption style={analyticsStyles.calendarTotalBadge}>
      {activeSubs.length}件
    </Caption>
  </View>

  {/* 曜日ヘッダー */}
  <View style={analyticsStyles.weekDayRow}>
    {['日', '月', '火', '水', '木', '金', '土'].map((d) => (
      <View key={d} style={analyticsStyles.weekDayCell}>
        <Caption style={analyticsStyles.weekDayText}>{d}</Caption>
      </View>
    ))}
  </View>

  {/* カレンダーグリッド */}
  <View style={analyticsStyles.calendarGrid}>
    {calendarData.weeks.map((week, wi) => (
      <View key={wi} style={analyticsStyles.calendarWeekRow}>
        {week.map((cell, di) => {
          const isToday = cell.day === calendarData.today;
          const hasBilling = cell.subs.length > 0;
          return (
            <View
              key={di}
              style={[
                analyticsStyles.calendarCell,
                isToday && analyticsStyles.calendarCellToday,
              ]}
            >
              {cell.day !== null && (
                <>
                  <Caption
                    style={[
                      analyticsStyles.calendarDayText,
                      isToday && analyticsStyles.calendarDayTextToday,
                      hasBilling && !isToday && analyticsStyles.calendarDayTextBilling,
                    ]}
                  >
                    {cell.day}
                  </Caption>
                  {hasBilling && (
                    <View style={analyticsStyles.calendarDotsRow}>
                      {cell.subs.slice(0, 3).map((s, si) => (
                        <View
                          key={si}
                          style={[analyticsStyles.calendarDot, { backgroundColor: s.color }]}
                        />
                      ))}
                      {cell.subs.length > 3 && (
                        <Caption style={analyticsStyles.calendarMoreText}>
                          +{cell.subs.length - 3}
                        </Caption>
                      )}
                    </View>
                  )}
                </>
              )}
            </View>
          );
        })}
      </View>
    ))}
  </View>
</View>
```

---

## 6. 未使用サブスク警告の視覚的表示

### 6.1 改善された警告 JSX

```tsx
{/* ── Section D: 未使用サブスク警告（改善版）── */}
{unusedSubs.length > 0 && (
  <View style={analyticsStyles.unusedSection}>
    {/* セクションヘッダー */}
    <View style={analyticsStyles.unusedHeader}>
      <Ionicons name="warning-outline" size={16} color="#FF9800" />
      <Body style={analyticsStyles.unusedTitle}>無駄なサブスクの可能性</Body>
      <View style={analyticsStyles.unusedCountBadge}>
        <Caption style={analyticsStyles.unusedCountText}>
          {unusedSubs.length}件
        </Caption>
      </View>
    </View>

    {/* 各未使用サブスク */}
    {unusedSubs.map((sub) => {
      const monthly = calcMonthlyAmount(sub);
      const daysUnused = sub.lastTappedAt
        ? Math.floor((Date.now() - new Date(sub.lastTappedAt).getTime()) / 86400000)
        : 30;
      return (
        <View key={sub.id} style={analyticsStyles.unusedItem}>
          <View style={[analyticsStyles.gridIconCircle, { backgroundColor: sub.color + '22', width: 28, height: 28, borderRadius: 14 }]}>
            <Ionicons name={(sub.iconName as any) ?? 'card-outline'} size={14} color={sub.color} />
          </View>
          <Caption style={analyticsStyles.unusedItemName} numberOfLines={1}>
            {sub.name}
          </Caption>
          <View style={{ alignItems: 'flex-end' }}>
            <Caption style={analyticsStyles.unusedItemAmount}>
              {formatCurrency(monthly, sub.currency)}/月
            </Caption>
            <Caption style={analyticsStyles.unusedItemDays}>
              {daysUnused}日以上未使用
            </Caption>
          </View>
        </View>
      );
    })}

    {/* 合計コスト強調行 */}
    <View style={analyticsStyles.unusedTotalRow}>
      <Caption style={analyticsStyles.unusedTotalLabel}>
        合計削減可能額
      </Caption>
      <Body style={analyticsStyles.unusedTotalAmount}>
        ¥{Math.round(unusedSubs.reduce((sum, s) => sum + calcMonthlyAmount(s), 0)).toLocaleString('ja-JP')}/月
      </Body>
    </View>
  </View>
)}
```

---

## 7. DashboardScreen.tsx への変更マッピング

### 変更・追加・削除の一覧

| 行番号 | 現行コード | バリアントCでの変更 | 種別 |
|--------|-----------|------------------|------|
| L1-22 | import 群 | `CATEGORY_COLORS` を `types.ts` または定数から import 追加 | 変更 |
| L28-92 | `SwipeableRow` コンポーネント | **削除** — バリアントCではスワイプ削除なし（グリッドカードはタップで詳細遷移） | 削除 |
| L99-110 | `useSubscriptions()` の分割代入 | そのまま維持 | 維持 |
| L113-119 | `upcomingBillings` useMemo | そのまま維持（Section A の「次回請求」インジケーターで使用） | 維持 |
| L122-130 | `unusedSubs` / `activeSubs` useMemo | そのまま維持 | 維持 |
| L132-139 | `handleTap` useCallback | 維持（グリッドカードのタップで `lastTappedAt` 更新） | 維持 |
| L141-233 | `renderSubscriptionItem` | **削除** — グリッドレンダリングに置換（後述） | 削除 |
| L235-335 | `const ListHeader = (<View>...</View>)` | **完全置換** — アナリティクスヘッダー + グラフ + カレンダー + 警告 | 置換 |
| L337-378 | `return` 内の `FlatList` | `numColumns={2}` + `columnWrapperStyle` 追加、`renderItem` を新実装に変更 | 変更 |
| L381-492 | `StyleSheet.create({ ... })` | 既存スタイルを維持しつつ `analyticsStyles` を追加（別定数で定義） | 追加 |

### 7.1 新規追加 useMemo（L130 付近に挿入）

```typescript
// L131 に追加
const categoryTotals = useMemo(() => { /* 上記 4.1 参照 */ }, [activeSubs]);
const maxCategoryAmount = useMemo(() => { /* 上記 4.1 参照 */ }, [categoryTotals]);
const calendarData = useMemo(() => { /* 上記 5.1 参照 */ }, [activeSubs]);
```

### 7.2 ListHeader の置換（L235-335 を完全置換）

```typescript
// 変更前: const ListHeader = (<View>...</View>)   // JSX変数（アンチパターン）
// 変更後: useCallback によるコンポーネント関数

const ListHeader = useCallback(() => (
  <View>
    {/* Section A: アナリティクスヘッダー */}
    {/* Section B: カテゴリ横棒グラフ */}
    {/* Section C: カレンダーヒートマップ */}
    {/* Section D: 未使用警告（条件付き） */}
    <H2 style={analyticsStyles.gridSectionTitle}>すべてのサブスク</H2>
  </View>
), [
  totalMonthly, totalYearly, activeSubs, isPremium,
  categoryTotals, maxCategoryAmount,
  calendarData, unusedSubs, upcomingBillings,
]);
```

### 7.3 renderSubscriptionItem の置換（L141-233 を置換）

```typescript
// 2カラムグリッド用レンダリング（FlatList の numColumns={2} と組み合わせ）
const renderGridItem = ({ item }: { item: Subscription }) => {
  const days = getDaysUntilBilling(item);
  const monthly = calcMonthlyAmount(item);
  const daysBarWidth = `${Math.min(Math.max((30 - days) / 30, 0), 1) * 100}%`;
  const daysColor = days <= 1 ? '#F44336' : days <= 3 ? '#FF9800' : '#26C6DA';

  return (
    <TouchableOpacity
      style={{ flex: 1 }}
      activeOpacity={0.7}
      onPress={() => handleTap(item)}
    >
      <View
        style={[
          analyticsStyles.gridCard,
          { borderLeftColor: item.color },
        ]}
      >
        <View style={analyticsStyles.gridIconRow}>
          <View style={[analyticsStyles.gridIconCircle, { backgroundColor: item.color + '22' }]}>
            <Ionicons name={(item.iconName as any) ?? 'card-outline'} size={16} color={item.color} />
          </View>
          <Caption style={analyticsStyles.gridServiceName} numberOfLines={1}>
            {item.name}
          </Caption>
        </View>
        <Caption style={analyticsStyles.gridCategory}>{item.category}</Caption>
        <Body style={analyticsStyles.gridAmount}>
          {formatCurrency(monthly, item.currency)}
          <Caption style={analyticsStyles.gridAmountUnit}>/月</Caption>
        </Body>
        {/* 残日数バー */}
        <View style={analyticsStyles.gridDaysRow}>
          <View style={analyticsStyles.gridDaysBar}>
            <View
              style={[
                analyticsStyles.gridDaysBarFill,
                { width: daysBarWidth, backgroundColor: daysColor },
              ]}
            />
          </View>
          <Caption style={[analyticsStyles.gridDaysText, { color: daysColor }]}>
            {days === 0 ? '今日' : `残${days}日`}
          </Caption>
        </View>
      </View>
    </TouchableOpacity>
  );
};
```

### 7.4 FlatList の変更（L339-364）

```tsx
// 変更前
<FlatList
  data={activeSubs}
  renderItem={renderSubscriptionItem}
  ListHeaderComponent={ListHeader}
  ...
/>

// 変更後
<FlatList
  data={activeSubs}
  keyExtractor={(item) => item.id}
  numColumns={2}                          // ← 2カラムグリッド
  columnWrapperStyle={{ gap: 10 }}        // ← カラム間のギャップ
  contentContainerStyle={{
    paddingHorizontal: spacing.md,
    paddingBottom: 100 + insets.bottom,
    gap: 0,
  }}
  showsVerticalScrollIndicator={false}
  renderItem={renderGridItem}             // ← 新関数に変更
  ListHeaderComponent={ListHeader}        // ← useCallback 関数に変更
  ListEmptyComponent={...}               // ← 変更なし
/>
```

---

## 8. 実装時の注意点

### 8.1 既存バグの修正機会

バリアントC実装時に同時修正推奨:

| 箇所 | 問題 | 修正方法 |
|------|------|---------|
| L315: `'#FF9800'` | ハードコード警告色 | `ANALYTICS_COLORS.warnOrange` または `colors.warning` に変更 |
| L235: JSX変数 ListHeader | アンチパターン | `useCallback` でラップ（バリアントC実装で自然に解消） |
| L344: マジックナンバー `100` | `paddingBottom` | `spacing.xl * 2` に変更 |

### 8.2 SwipeableRow の扱い

バリアントCでは2カラムグリッドのため `SwipeableRow` を使用しない。
バリアントAへの切り替え時のために `SwipeableRow` は残存させるが、
この機会に `src/components/SwipeableRow.tsx` への分離を推奨する。

### 8.3 FlatList の numColumns 変更時の注意

`numColumns` は動的変更が禁止されている。
バリアント切替時には `key` プロパティを変更してFlatListを再マウントする:

```tsx
<FlatList
  key={variant === 'analytics' ? 'grid-2' : 'list-1'}  // variantで再マウント
  numColumns={variant === 'analytics' ? 2 : 1}
  ...
/>
```

### 8.4 ダークテーマとの統合

バリアントCは「常にダークテーマ」を想定しているが、
既存の `ThemeProvider` / `useTheme` との共存方法:

```typescript
// バリアントC適用時に自動でダークモードを設定する案
// App.tsx の UIVariantProvider 内で ThemeContext を操作
// または: analyticsStyles 内で ANALYTICS_COLORS をハードコード（簡易実装）
```

実装優先度が高い場合は後者（ハードコード）で先行実装し、テーマ統合はフェーズ2とする。

---

## 9. ファイル変更サマリー

```
変更するファイル:
├── src/screens/DashboardScreen.tsx
│   ├── 追加: import CATEGORY_COLORS（types.ts から）
│   ├── 削除: SwipeableRow コンポーネント（L28-92）
│   ├── 追加: categoryTotals / maxCategoryAmount / calendarData useMemo（L131 付近）
│   ├── 削除: renderSubscriptionItem（L141-233）→ renderGridItem に置換
│   ├── 置換: ListHeader JSX変数（L235-335）→ useCallback コンポーネント
│   ├── 変更: FlatList props（L337-378）— numColumns=2 追加
│   └── 追加: analyticsStyles StyleSheet 定数（L493 以降）
│
├── src/types.ts（変更なし — CATEGORY_COLORS を export するだけ）
│
新規作成:
└── src/ui/variants/AnalyticsDashboard.tsx（推奨: 分離実装）
    └── 上記の全バリアントC実装を集約したコンポーネント
```

---

## 10. 実装優先順位

| Priority | タスク | 工数目安 |
|----------|--------|---------|
| P0 | analyticsStyles StyleSheet 定義 | 1h |
| P0 | Section A: アナリティクスヘッダー実装 | 1h |
| P1 | Section B: カテゴリ横棒グラフ実装 | 1.5h |
| P1 | Section E: 2カラムグリッドリスト実装 | 1.5h |
| P2 | Section C: カレンダーヒートマップ実装 | 2h |
| P2 | Section D: 未使用警告改善 | 0.5h |
| P3 | UIVariantContext 統合 + SettingsScreen 切替UI | 2h |
| P3 | SwipeableRow の components/ 分離 | 0.5h |
