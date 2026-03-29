# TANREN iOS UI/UX レビューレポート

**レビュー日**: 2026-03-30
**対象**: React Native (Expo) 筋トレ記録アプリ「TANREN」
**基準**: Apple Human Interface Guidelines (HIG) / WCAG 2.2 AA / ios-uiux Layer 2a

---

## 総合評価サマリー

| 観点 | 評価 | 重大度 |
|---|---|---|
| 1. ボタンサイズ | **問題あり** | P0 × 2, P1 × 1 |
| 2. タッチターゲット間隔 | **推奨改善** | P1 × 2 |
| 3. タイポグラフィ | **推奨改善** | P1 × 1, P2 × 2 |
| 4. カード角丸・スペーシング | **推奨改善** | P2 × 2 |
| 5. ナビゲーション | **問題あり** | P0 × 1 |
| 6. アクセシビリティ（コントラスト） | **問題あり** | P0 × 2 |
| 7. Liquid Glass 対応 | **将来検討** | P2 |

---

## 1. ボタンサイズ — 問題あり

### BUTTON_HEIGHT 定義の評価

| トークン | 値 | HIG 44pt 基準 | 判定 |
|---|---|---|---|
| `primary` | 60pt | > 44pt | OK |
| `secondary` | 50pt | > 44pt | OK |
| `icon` | 44pt | = 44pt | OK（最小値） |
| `iconSmall` | 32pt | < 44pt | **要注意**（後述） |

### 全画面ボタン使用箇所の実効タッチ領域

| 画面 | 要素 | サイズ | 実効領域 | 判定 |
|---|---|---|---|---|
| **HomeScreen** | CTA「ワークアウト開始」 | h60 × full-width | 60pt | OK |
| | クイックスタートchip | minH44, padV8+padH14 | 44pt | OK |
| | メニュー行 | minH48, padV14 | 48pt+ | OK |
| **WorkoutScreen** | 部位タブ | **h34, minW56** | **34pt** | **NG (P0)** |
| | 種目行 | minH52, padV14 | 52pt | OK |
| | 開始ボタン | h60 | 60pt | OK |
| | ステッパー (±) | 44×44 | 44pt | OK |
| | セット完了ボタン | h60 | 60pt | OK |
| | 終了ボタン | h50 | 50pt | OK |
| **HistoryScreen** | カード（TouchableOpacity） | padV14, minH implicit | 48pt+ | OK |
| | 空状態CTA | h60 | 60pt | OK |
| **ProgressScreen** | PRカード | w140, pad14 | 44pt+ | OK |
| | カレンダー日付セル | **w34 × h34** | **34pt** | **NG (P0)** |
| | カレンダーナビ (‹ ›) | 44×44 | 44pt | OK |
| **SettingsScreen** | 設定行 | h48 | 48pt | OK |
| | テーマ行 | h48 | 48pt | OK |
| **MonthlyReportScreen** | 月ナビ (‹ ›) | 44×44 | 44pt | OK |
| | ランキング行 | h44 | 44pt | OK（最小値） |
| **RMCalculatorScreen** | ステッパー (±) | 44×44 | 44pt | OK |
| | テーブル行 | h44 | 44pt | OK（最小値） |
| **OrderConfirmScreen** | テンプレート保存 | h50 | 50pt | OK |
| | 開始ボタン | h60 | 60pt | OK |
| | 並べ替えハンドル | 44×44 | 44pt | OK |
| **ScreenHeader** | ハンバーガー/戻る | 44×44 | 44pt | OK |
| **BottomSheet** | SheetRow | minH44 | 44pt | OK |
| **CustomDrawerContent** | ナビ項目 | minH44 | 44pt | OK |
| **SwipeableRow** | 削除ボタン | w72 × full-h | 72pt+ | OK |

### iconSmall（32pt）の評価

`BUTTON_HEIGHT.iconSmall = 32` はコード内で直接使用されていない。`ScreenHeader`の戻るボタンはアイコンサイズ32ptだが、タッチ領域は `BUTTON_HEIGHT.icon = 44pt` で確保されている。**問題なし**（ただし命名上の誤解を招くため、コメント推奨）。

### 具体的改善提案

**[P0-BTN-1] WorkoutScreen 部位タブ: 34pt → 44pt**
```
現在: height: 34, minWidth: 56
改善: height: 44, minWidth: 56
（paddingVertical を 5 → 10 に増やすか、height を直接 44 に変更）
```

**[P0-BTN-2] ProgressScreen カレンダー日付セル: 34×34pt → 44×44pt**
```
現在: calDayBtn: { width: 34, height: 34 }
改善: calDayBtn: { width: 44, height: 44, borderRadius: 22 }
※ CELL_W の計算式も合わせて見直し、7列グリッドが収まるよう調整が必要
（calBox の padding を 16→12 にすることで余白を確保可能）
```

**[P1-BTN-3] MonthlyReportScreen ランキング行: h44 → h48**
```
現在: rankRow: { height: 44 }
推奨: rankRow: { height: 48 }
（8pt グリッドへの準拠を兼ねて 44→48 に拡大）
```

---

## 2. タッチターゲット間隔 — 推奨改善

HIG 推奨: タップ可能要素間の距離は最低 8pt 確保。

| 画面 | 要素 | 現在の間隔 | 判定 |
|---|---|---|---|
| WorkoutScreen | 部位タブ間 | gap: 6pt | **要改善 (P1)** |
| WorkoutScreen | ステッパー行内 | gap: 8pt | OK |
| HomeScreen | チップ間 | gap: 8pt | OK |
| CustomDrawerContent | ナビ項目間 | marginBottom: 2pt | **要改善 (P1)** |
| ProgressScreen | バーチャート列間 | gap: 5pt | OK（非タップ対象） |
| OrderConfirmScreen | フッターボタン間 | gap: 8pt | OK |

### 改善提案

**[P1-SPC-1] WorkoutScreen タブ間隔: 6pt → 8pt**
```
tabsContent: { gap: 6 } → gap: 8
```

**[P1-SPC-2] CustomDrawerContent ナビ項目間隔: 2pt → 4pt**
```
navItem: { marginBottom: 2 } → marginBottom: 4
（理想は8ptだが、7項目+設定で画面高さの制約があるため4ptを推奨）
```

---

## 3. タイポグラフィ — 推奨改善

### TYPOGRAPHY vs iOS 標準テキストスタイル

| TANREN トークン | 値 | iOS 対応スタイル | iOS 標準値 | 差分 | 判定 |
|---|---|---|---|---|---|
| `heroNumber` | 58pt | — (カスタム) | — | カスタム用途 | OK |
| `screenTitle` | 26pt | Title 1 | 28pt | −2pt | **P2** |
| `exerciseName` | 20pt | Title 3 | 20pt | 0 | OK |
| `body` | 16pt | Body | 17pt | −1pt | **P2** |
| `bodySmall` | 15pt | Subheadline | 15pt | 0 | OK |
| `caption` | 12pt | Caption 1 | 12pt | 0 | OK |
| `captionSmall` | 10pt | Caption 2 | 11pt | −1pt | **P1** |

### 改善提案

**[P1-TYP-1] captionSmall: 10pt → 11pt**
```
captionSmall: 10 → 11
```
理由: iOSの最小推奨テキストサイズは11pt（Caption 2）。10ptは高解像度ディスプレイでも読みにくい。使用箇所: セクションラベル（ProgressScreen等）、種目タグ（HistoryScreen）、日付表示、単位ラベル。影響範囲が広いため一括で修正推奨。

**[P2-TYP-2] body: 16pt → 17pt（任意）**
iOS標準との一致を優先する場合。現在の16ptでも実用上問題はない。

**[P2-TYP-3] screenTitle: 26pt → 28pt（任意）**
iOS Large Title標準値との一致。ScreenHeaderのタイトルに影響。

---

## 4. カード角丸・スペーシング — 推奨改善

### RADIUS 評価

| トークン | 値 | iOS 推奨範囲 | 判定 |
|---|---|---|---|
| `card` | 13pt | 12-16pt | OK |
| `button` | 16pt | — | OK |
| `btnCTA` | 18pt | — | OK |
| `chip` | 20pt | — | OK（丸み強め） |
| `badge` | 4pt | — | OK |
| `sheet` | 18pt | 12-20pt | OK |

RADIUS は全体的に iOS 標準範囲内で問題なし。

### SPACING 8pt グリッド準拠チェック

| トークン | 値 | 8pt 倍数 | 判定 |
|---|---|---|---|
| `xs` | 4pt | 0.5u | OK |
| `sm` | 8pt | 1u | OK |
| `md` | 16pt | 2u | OK |
| `lg` | 24pt | 3u | OK |
| `xl` | 32pt | 4u | OK |
| `xxl` | 48pt | 6u | OK |
| `contentMargin` | 16pt | 2u | OK |
| `cardPadding` | **14pt** | — | **P2（非8pt倍数）** |
| `cardGap` | 8pt | 1u | OK |
| `sectionGap` | **20pt** | — | **P2（非8pt倍数）** |

### 改善提案

**[P2-SPC-3] cardPadding: 14pt → 16pt**
```
cardPadding: 14 → 16
```
8pt グリッド準拠（2u）。全カードの内部パディングに影響。

**[P2-SPC-4] sectionGap: 20pt → 24pt**
```
sectionGap: 20 → 24
```
8pt グリッド準拠（3u）。セクション間の余白がやや広がるが視覚的呼吸が向上。

---

## 5. ナビゲーション — 問題あり

### 現在の構造

```
Drawer (7画面)
├── Home
├── WorkoutStack (NativeStack)
│   ├── ExerciseSelect
│   ├── OrderConfirm
│   └── ActiveWorkout
├── History
├── Progress
├── MonthlyReport
├── RMCalculator
└── Settings
```

### HIG Tier S ルール #2 違反

> ボトムタブバー（3〜5タブ）をプライマリナビゲーションに採用
> Airbnb がハンバーガー→タブバー移行でタスク完了速度 40% 向上
> 重要機能をハンバーガーに隠してはならない

現在の TANREN は全画面がドロワー（ハンバーガーメニュー）内に配置されており、iOS ユーザーの期待するナビゲーションパターンと乖離している。

### 改善提案

**[P0-NAV-1] ボトムタブバー + ドロワーのハイブリッド構成に変更**

推奨構成:
```
BottomTab (4-5タブ)
├── Home         (barbell icon)
├── WorkoutStack (fitness icon)
├── History      (time icon)
├── Progress     (stats-chart icon)
└── More         (ellipsis.horizontal.circle icon)
    ├── MonthlyReport  (セカンダリ)
    ├── RMCalculator   (セカンダリ)
    └── Settings       (セカンダリ)
```

または:
```
BottomTab (5タブ)
├── Home
├── Workout
├── History
├── Progress
├── Settings
※ MonthlyReport, RMCalculator はドロワーまたは設定画面内からアクセス
```

**実装方針**:
- `@react-navigation/bottom-tabs` を導入
- プライマリ4-5画面をタブに配置
- 低頻度画面（MonthlyReport, RMCalculator）はドロワーまたは「その他」タブ内に収容
- タブアイコンはラインとソリッドの2状態を用意（SF Symbols / Ionicons）
- タブラベルを必ず表示（アイコンのみ禁止）

---

## 6. アクセシビリティ（コントラスト） — 問題あり

### textSecondary コントラスト比計算

**デフォルトテーマ（鍛鉄）での計算:**

```
背景: #111113 → 相対輝度 ≈ 0.012
textSecondary: rgba(245,245,247, 0.45) on #111113
  → 合成色 ≈ #78787A → 相対輝度 ≈ 0.188
コントラスト比 = (0.188 + 0.05) / (0.012 + 0.05) = 3.84:1
```

| テキスト種別 | WCAG AA 要件 | textSecondary (3.84:1) | 判定 |
|---|---|---|---|
| 通常テキスト (<18pt) | 4.5:1 | 3.84:1 | **NG** |
| 大テキスト (≥18pt / ≥14pt Bold) | 3:1 | 3.84:1 | OK |

### textTertiary コントラスト比計算

```
textTertiary: rgba(245,245,247, 0.22) on #111113
  → 合成色 ≈ #434345 → 相対輝度 ≈ 0.055
コントラスト比 = (0.055 + 0.05) / (0.012 + 0.05) = 1.69:1
```

| テキスト種別 | WCAG AA 要件 | textTertiary (1.69:1) | 判定 |
|---|---|---|---|
| 通常テキスト | 4.5:1 | 1.69:1 | **NG** |
| 大テキスト | 3:1 | 1.69:1 | **NG** |

### textSecondary / textTertiary の使用箇所（影響範囲）

| 色 | 主な使用箇所 | 問題の深刻度 |
|---|---|---|
| textSecondary | チップテキスト、設定値、ボリューム単位、カレンダー月名、RM表値 | **高**（日常的に読む情報） |
| textTertiary | セクションラベル、日付、キャプション、器具名、曜日 | **中**（補助情報だが必要） |

### 改善提案

**[P0-A11Y-1] textSecondary 透明度: 0.45 → 0.60**
```
現在: rgba(245,245,247, 0.45) → コントラスト比 3.84:1
改善: rgba(245,245,247, 0.60) → コントラスト比 ≈ 5.2:1 (WCAG AA 達成)
```
全8テーマの `textSecondary` を一括更新。

**[P0-A11Y-2] textTertiary 透明度: 0.22 → 0.38**
```
現在: rgba(245,245,247, 0.22) → コントラスト比 1.69:1
改善: rgba(245,245,247, 0.38) → コントラスト比 ≈ 3.2:1 (大テキスト AA 達成)
```
textTertiary は装飾的・補助的用途が多いため、大テキスト基準（3:1）をターゲット。
通常テキストで使用する箇所がある場合は textSecondary に昇格させること。

---

## 7. Liquid Glass 対応 — 将来検討 (P2)

### 現状

- 全テーマがソリッドな暗色サーフェス（surface1, surface2）で構成
- 透過マテリアルの使用なし
- アプリの設計思想「鍛鉄の間（MA）— 余白と一点の炎」はミニマル・ダーク路線

### iOS 26 (WWDC 2025) Liquid Glass との関係

- Liquid Glass は iOS 26 の最大ビジュアル変更（2013年以来）
- 透過・屈折・動的適応が特徴
- `.ultraThinMaterial` / `ContainerRelativeShape` による実装
- エンゲージメント約15%向上の報告あり

### 推奨

**[P2-LG-1] 段階的な Liquid Glass 準備**

1. **Phase 1（今すぐ）**: 変更不要。現在のソリッドダーク路線はアプリの世界観と一致
2. **Phase 2（iOS 26 リリース後）**: BottomSheet と Drawer の背景に `BlurView` (`expo-blur`) を試験導入
3. **Phase 3（ユーザーフィードバック後）**: カード背景の一部を半透過マテリアルに移行

React Native での Liquid Glass 実装は `expo-blur` の `BlurView` または `@react-native-community/blur` を使用。完全な Liquid Glass 再現はネイティブ実装が必要なため、Expo の対応状況を注視。

---

## 改善優先度リスト

### P0 — 必須修正（App Store 審査・アクセシビリティ基準）

| ID | 項目 | 影響画面 | 修正難易度 |
|---|---|---|---|
| P0-BTN-1 | 部位タブ 34pt → 44pt | WorkoutScreen | 低（height 変更のみ） |
| P0-BTN-2 | カレンダー日付 34×34 → 44×44 | ProgressScreen | 中（グリッド再計算） |
| P0-NAV-1 | ボトムタブバー導入 | 全画面 | **高**（ナビ構造変更） |
| P0-A11Y-1 | textSecondary 0.45 → 0.60 | 全テーマ全画面 | 低（theme.ts 変更のみ） |
| P0-A11Y-2 | textTertiary 0.22 → 0.38 | 全テーマ全画面 | 低（theme.ts 変更のみ） |

### P1 — 強く推奨（UX 品質向上）

| ID | 項目 | 影響画面 | 修正難易度 |
|---|---|---|---|
| P1-BTN-3 | ランキング行 h44 → h48 | MonthlyReportScreen | 低 |
| P1-SPC-1 | タブ間隔 6pt → 8pt | WorkoutScreen | 低 |
| P1-SPC-2 | ドロワーナビ間隔 2pt → 4pt | CustomDrawerContent | 低 |
| P1-TYP-1 | captionSmall 10pt → 11pt | 全画面 | 低（theme.ts 変更のみ） |

### P2 — 推奨（デザイン品質向上）

| ID | 項目 | 影響画面 | 修正難易度 |
|---|---|---|---|
| P2-TYP-2 | body 16pt → 17pt | 全画面 | 低 |
| P2-TYP-3 | screenTitle 26pt → 28pt | ScreenHeader | 低 |
| P2-SPC-3 | cardPadding 14pt → 16pt | 全画面 | 低（微調整必要） |
| P2-SPC-4 | sectionGap 20pt → 24pt | 全画面 | 低 |
| P2-LG-1 | Liquid Glass 段階準備 | BottomSheet, Drawer | 中〜高 |

---

## 追加観察事項

### 良い点

- `SafeAreaView` + `useSafeAreaInsets` で Safe Area Insets を適切に処理
- ScreenHeader の iconBtn が確実に 44×44pt を確保
- `accessibilityRole` / `accessibilityLabel` が主要ボタンに設定済み
- 8pt グリッドシステムの基本構造（xs/sm/md/lg/xl）が確立
- テーマシステムが全8テーマで統一されたカラートークン構造
- BottomSheet のスワイプ閉じ + タップ閉じの両方を提供（HIG 準拠）

### 追加の気になる点（レビュー範囲外だが記載）

1. **Dynamic Type 未対応**: 全フォントサイズが固定 pt。HIG Tier A 推奨の Dynamic Type 対応が未実装
2. **ハードコード色**: `#fff`, `#FFFFFF`, `'rgba(245,245,247,0.3)'` 等がスタイル内に散在。テーマトークンへの統一を推奨
3. **Reduce Motion 未対応**: アニメーション（BottomSheet, SwipeableRow, 数値バンプ）に `AccessibilityInfo.isReduceMotionEnabled` 分岐なし
4. **空状態デザイン**: HistoryScreen の空状態はテキスト+CTA のみ。HIG 推奨のイラスト (200×200px) + 説明 + CTA の3要素構成を検討

---

*レビュー基準: Apple HIG 2025 / WCAG 2.2 AA / ios-uiux Layer 2a スキル §1-§12*
