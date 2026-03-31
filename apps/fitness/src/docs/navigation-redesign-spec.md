# TANREN ナビゲーション再設計仕様書

**作成日**: 2026-03-31
**ステータス**: 設計完了 / 実装待ち
**入力**: `navigation-hig-analysis.md`（HIG 分析）、`RootNavigator.tsx`（現行実装）

---

## 1. ナビゲーション構造の最終決定

### 採用: パターン A — Bottom Tab Bar（主）+ Drawer（副）

**構造概要**:
- **Bottom Tab Bar** をプライマリナビゲーションとし、使用頻度の高い 4 画面を配置
- **Drawer** をセカンダリとし、ミニダッシュボード + ユーティリティ画面を格納

**採用根拠**:

| 観点 | 判断 |
|---|---|
| HIG 準拠 | Tab Bar は iPhone の最優先ナビゲーション。HIG 準拠度が最も高い |
| 発見性 | 主要機能が常時可視。現行 Drawer の「隠れたナビ」問題を解消 |
| 既存資産 | `@react-navigation/bottom-tabs@^7.12.0` が package.json に既存（未使用）。即座に利用可能 |
| テーマ | 全 26 テーマに `tabBarBg` / `tabBarBorder` トークンが定義済み。新規トークン追加不要 |
| Drawer 維持 | Drawer はミニダッシュボード（週間統計）のホームとして固有の価値を持つ。セカンダリ機能のハブに再定義 |
| 認知負荷 | Tab Bar（画面間移動）と HistoryScreen 内タブ（画面内ビュー切替）の役割分離が明確 |

---

## 2. 画面遷移フロー図

```
RootDrawer
├── MainTabs (BottomTabNavigator)                ← defaultRoute
│   ├── HomeTab
│   │   └── HomeScreen
│   ├── WorkoutTab
│   │   └── WorkoutStack (NativeStack)
│   │       ├── ExerciseSelect                   ← initialRoute
│   │       ├── OrderConfirm                     ← Tab Bar 非表示
│   │       ├── ActiveWorkout                    ← Tab Bar 非表示
│   │       └── WorkoutComplete (card/bottom)    ← Tab Bar 非表示
│   ├── HistoryTab
│   │   └── HistoryStack (NativeStack)
│   │       ├── HistoryList                      ← initialRoute
│   │       │   └── [画面内タブ: 日別 | 部位別 | 種目別]
│   │       ├── DayDetail
│   │       └── SessionEdit
│   └── ReportTab
│       └── MonthlyReportScreen
├── RMCalculator                                 ← Drawer 専用
├── TemplateManage                               ← Drawer 専用
└── Settings                                     ← Drawer 専用
```

**ポイント**:
- `MainTabs` が Drawer のデフォルト画面。アプリ起動時は `HomeTab` が表示される
- `RMCalculator` / `TemplateManage` / `Settings` は Drawer 内にのみ存在し、Tab Bar に表示されない
- これらの画面では Tab Bar は非表示（Drawer の別画面のため自動的に非表示）

---

## 3. Drawer 内ナビ項目の整理

### 3.1 現行 → 新規 比較

| 現行 Drawer 項目 | 新配置 | 理由 |
|---|---|---|
| ホーム | **Tab Bar** | 最頻使用。Tab Bar 必須 |
| トレーニング | **Tab Bar** | 最頻使用。Tab Bar 必須 |
| 履歴 | **Tab Bar** | 最頻使用。Tab Bar 必須 |
| 月別レポート | **Tab Bar** | 定期的に使用。Tab 4 枠目に配置 |
| RM 計算機 | **Drawer** | ユーティリティ。使用頻度低 |
| テンプレート管理 | **Drawer** | ユーティリティ。使用頻度低 |
| 設定 | **Drawer** | 標準的にセカンダリ配置 |

### 3.2 新 Drawer レイアウト

```
CustomDrawerContent
├── [ステータスバー領域]
├── ミニダッシュボード (今週の統計)          ← 現行どおり維持
│   ├── トレーニング回数
│   ├── ボリューム
│   └── 連続日数
├── ─── ツール ─────────────────
│   ├── RM計算機          (calculator-outline / calculator)
│   └── テンプレート管理   (document-text-outline / document-text)
├── [separator]
└── 設定                   (settings-outline / settings)
```

**変更点**:
- `NAV_ITEMS` 配列から Home / WorkoutStack / HistoryStack / MonthlyReport を**削除**
- 残る 2 項目（RM 計算機・テンプレート管理）に「ツール」セクションヘッダーを追加
- 設定はフッター位置を維持（現行どおり separator の下）

---

## 4. Tab Bar 仕様

### 4.1 タブ構成

| 順序 | name | label | icon (inactive) | icon (active) |
|---|---|---|---|---|
| 1 | `HomeTab` | ホーム | `barbell-outline` | `barbell` |
| 2 | `WorkoutTab` | ワークアウト | `fitness-outline` | `fitness` |
| 3 | `HistoryTab` | 履歴 | `time-outline` | `time` |
| 4 | `ReportTab` | レポート | `calendar-outline` | `calendar` |

### 4.2 スタイル

```typescript
tabBarStyle: {
  backgroundColor: colors.tabBarBg,
  borderTopColor: colors.tabBarBorder,
  borderTopWidth: StyleSheet.hairlineWidth,
}
tabBarActiveTintColor: colors.accent
tabBarInactiveTintColor: colors.textTertiary
```

- アイコンとラベルを併記（HIG 必須）
- ラベルフォントサイズ: 10pt
- アイコンサイズ: 24

### 4.3 Tab Bar の表示/非表示制御

ワークアウト実行中（OrderConfirm 以降）は Tab Bar を非表示にし、ユーザーの集中を妨げない。

```typescript
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';

// WorkoutTab の options で動的に制御
options={({ route }) => {
  const focused = getFocusedRouteNameFromRoute(route) ?? 'ExerciseSelect';
  const hide = ['OrderConfirm', 'ActiveWorkout', 'WorkoutComplete'].includes(focused);
  return {
    tabBarStyle: hide ? { display: 'none' } : {
      backgroundColor: colors.tabBarBg,
      borderTopColor: colors.tabBarBorder,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
  };
}}
```

| WorkoutStack 画面 | Tab Bar | 理由 |
|---|---|---|
| ExerciseSelect | **表示** | 種目選択段階。他タブへの移動を許可 |
| OrderConfirm | **非表示** | フロー途中。離脱を防止 |
| ActiveWorkout | **非表示** | 記録中。誤タップ防止 |
| WorkoutComplete | **非表示** | 完了画面。結果確認に集中 |

---

## 5. 画面内タブ UI の扱い

### 決定: 現行のカスタム実装を維持

HistoryScreen の日別 / 部位別 / 種目別タブは **変更しない**。

**根拠**:
- HIG の Segmented Control パターンとして妥当（同一データの異なるビュー切替）
- 3 セグメントは HIG 推奨範囲（2〜5）内
- Tab Bar（画面間移動）と画面内タブ（ビュー切替）で役割が明確に分離
- 現行実装は `useState` + `TouchableOpacity` によるカスタム UI。ピル型スタイルはモダンで視認性が高い
- iOS ネイティブの `SegmentedControl` への置換はデザインの統一性を損なうため見送り

**テーマトークン**: 画面内タブは `colors.accent`（アクティブ背景）と `colors.surface2`（非アクティブ背景）を使用中。`tabBarBg` / `tabBarBorder` は使用していないため競合なし。

---

## 6. 各画面のヘッダー仕様

### 6.1 ルール

| 条件 | 左ボタン | 動作 |
|---|---|---|
| Tab の初期画面（スタックのルート） | ハンバーガー | `navigation.openDrawer()` |
| Stack 内の子画面 | 戻る | `navigation.goBack()` |
| Drawer 専用画面 | 戻る | `navigation.goBack()`（MainTabs に戻る） |
| WorkoutComplete | なし | モーダル。独自の閉じるボタン |

### 6.2 画面別一覧

| 画面 | 所属 | showHamburger | showBack | タイトル |
|---|---|---|---|---|
| HomeScreen | Tab (HomeTab) | `true` | - | ホーム |
| ExerciseSelectScreen | Tab (WorkoutTab) > Stack | `true` | - | 種目選択 |
| OrderConfirmScreen | Tab (WorkoutTab) > Stack | - | `true` | 順番確認 |
| ActiveWorkoutScreen | Tab (WorkoutTab) > Stack | - | `true` | ※独自ヘッダー |
| WorkoutCompleteScreen | Tab (WorkoutTab) > Stack | - | - | ※独自UI |
| HistoryScreen | Tab (HistoryTab) > Stack | `true` | - | 履歴 |
| DayDetailScreen | Tab (HistoryTab) > Stack | - | `true` | ※日付表示 |
| SessionEditScreen | Tab (HistoryTab) > Stack | - | `true` | ※種目名表示 |
| MonthlyReportScreen | Tab (ReportTab) | `true` | - | 月別レポート |
| RMCalculatorScreen | Drawer 専用 | - | `true` | RM計算機 |
| TemplateManageScreen | Drawer 専用 | - | `true` | テンプレート管理 |
| SettingsScreen | Drawer 専用 | - | `true` | 設定 |

**ヘッダー変更が必要な画面**:
- `RMCalculatorScreen`: `showHamburger` → `showBack` に変更（Drawer 専用画面になるため）
- 他の画面は現行のヘッダー設定を維持

---

## 7. 型定義の設計

### 7.1 新規追加: `MainTabParamList`

```typescript
import type { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  HomeTab:    undefined;
  WorkoutTab: NavigatorScreenParams<WorkoutStackParamList>;
  HistoryTab: NavigatorScreenParams<HistoryStackParamList>;
  ReportTab:  undefined;
};
```

### 7.2 更新: `RootDrawerParamList`

```typescript
export type RootDrawerParamList = {
  MainTabs:       NavigatorScreenParams<MainTabParamList>;
  RMCalculator:   undefined;
  TemplateManage: undefined;
  Settings:       undefined;
};
```

**削除される型メンバー**: `Home`, `WorkoutStack`, `HistoryStack`, `MonthlyReport`
（これらは `MainTabParamList` に移動）

### 7.3 変更なし

```typescript
// そのまま維持
export type WorkoutStackParamList = { /* 現行どおり */ };
export type HistoryStackParamList = { /* 現行どおり */ };
```

### 7.4 ナビゲーション型（各画面で使用）

```typescript
// HomeScreen — Tab 内の画面
type HomeNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'HomeTab'>,
  DrawerNavigationProp<RootDrawerParamList>
>;

// ExerciseSelectScreen — Tab > Stack 内の画面
type ExerciseSelectNavProp = CompositeNavigationProp<
  NativeStackNavigationProp<WorkoutStackParamList, 'ExerciseSelect'>,
  CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList>,
    DrawerNavigationProp<RootDrawerParamList>
  >
>;
```

---

## 8. 主要なナビゲーションパターン

### 8.1 HomeScreen → WorkoutStack（種目選択へ）

```typescript
// 現行
(navigation as any).navigate('WorkoutStack', { screen: 'ExerciseSelect' });

// 新規
navigation.navigate('WorkoutTab', { screen: 'ExerciseSelect' });
```

### 8.2 HomeScreen → ActiveWorkout（クイックスタート）

```typescript
// 現行
(navigation as any).navigate('WorkoutStack', {
  screen: 'ActiveWorkout',
  params: { exerciseIds: [exerciseId] },
});

// 新規
navigation.navigate('WorkoutTab', {
  screen: 'ActiveWorkout',
  params: { exerciseIds: [exerciseId] },
});
```

### 8.3 Drawer から Tab Bar 画面への遷移は不要

Drawer から Home / 履歴等への直接遷移リンクは**配置しない**。ユーザーは Drawer を閉じて Tab Bar を使う。冗長な導線を排除し認知負荷を下げる。

---

## 9. 削除対象

### 9.1 削除するもの

| 対象 | 理由 |
|---|---|
| `NAV_ITEMS` の Home / WorkoutStack / HistoryStack / MonthlyReport エントリ | Tab Bar に移動 |
| `RootDrawerParamList` の `Home` / `WorkoutStack` / `HistoryStack` / `MonthlyReport` | `MainTabParamList` に移動 |
| Drawer.Screen の `Home` / `WorkoutStack` / `HistoryStack` / `MonthlyReport` | Tab.Screen に移動 |
| `WorkoutStack` の `drawerItemPress` リスナー | Drawer 項目ではなくなるため不要 |

### 9.2 維持するもの

| 対象 | 理由 |
|---|---|
| `tabBarBg` / `tabBarBorder` テーマトークン | Bottom Tab Bar のスタイリングに**使用する** |
| HistoryScreen の画面内タブ UI | Segmented Control として HIG 準拠。変更不要 |
| ミニダッシュボード (CustomDrawerContent) | Drawer 固有の価値。そのまま維持 |

---

## 10. 変更対象ファイル一覧

| # | ファイル | 変更種別 | 変更概要 |
|---|---|---|---|
| 1 | `src/navigation/RootNavigator.tsx` | **大幅変更** | `createBottomTabNavigator` 追加。`MainTabNavigator` 関数を新設。Drawer.Screen を MainTabs / RMCalculator / TemplateManage / Settings の 4 つに再編。WorkoutStack / HistoryStack の Navigator 関数は維持。型定義 `MainTabParamList` 追加、`RootDrawerParamList` 更新 |
| 2 | `src/components/CustomDrawerContent.tsx` | **中程度変更** | `NAV_ITEMS` から Tab Bar 移動分の 4 項目を削除。残り 2 項目（RM 計算機・テンプレート）に「ツール」セクションヘッダーを追加。ミニダッシュボード・設定フッターは維持 |
| 3 | `src/screens/HomeScreen.tsx` | **軽微変更** | ナビゲーション型を `DrawerNavigationProp<RootDrawerParamList>` → `CompositeNavigationProp` に変更。`navigate` 呼び出しのターゲットを `WorkoutStack` → `WorkoutTab` に修正 |
| 4 | `src/screens/RMCalculatorScreen.tsx` | **軽微変更** | `ScreenHeader` の `showHamburger` → `showBack` に変更 |
| 5 | `src/screens/MonthlyReportScreen.tsx` | **軽微変更** | ナビゲーション型の更新（Drawer 直下 → Tab 内画面へ変更） |
| 6 | `src/screens/WorkoutScreen.tsx` | **軽微変更** | ナビゲーション型の更新。`as any` キャストの削除が可能に |
| 7 | `src/screens/HistoryScreen.tsx` | **変更なし** | 画面内タブ UI・ナビゲーション型ともに変更不要 |
| 8 | `src/screens/SettingsScreen.tsx` | **変更なし** | 既に `showBack` 使用。Drawer 専用画面のまま |
| 9 | `src/screens/TemplateManageScreen.tsx` | **変更なし** | 既に `showBack` 使用。Drawer 専用画面のまま |
| 10 | `src/theme.ts` | **変更なし** | `tabBarBg` / `tabBarBorder` トークンはそのまま活用 |

---

## 11. 実装時の注意事項

### 11.1 Drawer + Tab Bar の共存

React Navigation v7 で Drawer と Bottom Tabs を共存させる場合、**Drawer が外側、Tab Bar が内側**の入れ子構造にする。Tab Bar は `MainTabs` 画面の中にのみ表示され、Drawer 専用画面（RMCalculator 等）では自動的に非表示になる。

```
NavigationContainer
  └── Drawer.Navigator
       ├── Drawer.Screen name="MainTabs"     → MainTabNavigator (Tab Bar あり)
       ├── Drawer.Screen name="RMCalculator"  → RMCalculatorScreen (Tab Bar なし)
       ├── Drawer.Screen name="TemplateManage" → TemplateManageScreen (Tab Bar なし)
       └── Drawer.Screen name="Settings"      → SettingsScreen (Tab Bar なし)
```

### 11.2 WorkoutStack の Drawer 再選択時リセット

現行の `drawerItemPress` リスナー（Drawer から WorkoutStack 再選択時に ExerciseSelect にリセット）は Drawer 項目削除に伴い不要になる。Tab Bar のタブ再タップ時のリセットは `@react-navigation/bottom-tabs` のデフォルト動作（スタックをリセット）で対応できる。

### 11.3 Drawer のジェスチャー制御

ワークアウト実行中（ActiveWorkout 画面）は Drawer のスワイプジェスチャーを無効化することを推奨。誤操作でワークアウトが中断されるリスクを回避する。

```typescript
// Drawer.Navigator の screenOptions で制御
screenOptions={({ route }) => ({
  swipeEnabled: /* ActiveWorkout でない場合 true */,
})}
```

---

*本仕様書に基づき実装を進めること。不明点があればこのドキュメントを更新して記録する。*
