# ReCallKit — サイドバーのみナビゲーション設計仕様書

> 作成日: 2026-03-31
> Layer: 2a（ios-uiux）| DDP: "Marginal Silence"（余白の沈黙）
> 出力先: docs/sidebar-only-nav-spec.md
> 前提: docs/navigation-design-decision.md のタブバー+Library統合フィルタUI方針を破棄し、サイドバーのみ方式に変更

---

## 0. エグゼクティブサマリー

### 設計変更の要旨

ボトムタブバー（5タブ）を廃止し、**左ドロワーサイドバーを唯一のプライマリナビゲーション**とする。サイドバーは画面遷移（Today / Library / Review / Map / Journal）とコンテンツフィルタリング（Smart Filters / Tags / Collections）の両機能を統合的に担う。

### 変更動機

- **コンテンツ領域の最大化**: タブバー領域（83pt）を解放し、知識コンテンツに全画面高さを提供
- **ナビゲーション階層の統合**: 画面遷移とフィルタ操作を1つのUIに集約し、認知負荷を低減
- **DDP "Marginal Silence" の徹底**: サイドバーが「知識の背骨」として機能する設計をフル適用
- **差別化**: Readwise / Anki 等の競合がタブバーを採用する中、独自のナビゲーション体験を提供

### HIG逸脱の認識

| HIG推奨 | 本設計の判断 | リスク緩和策 |
|---------|------------|------------|
| ボトムタブバー（3〜5タブ）をプライマリナビゲーションに採用 | サイドバーのみ | 常時表示のナビゲーションヘッダー + 明確なサイドバートリガー |
| 重要機能をハンバーガーに隠してはならない | サイドバーに全機能を集約 | サイドバートリガーを視覚的に目立たせ、オンボーディングで操作を教育 |
| エッジスワイプ = iOS標準「戻る」ジェスチャー | iPhone: エッジスワイプはiOS標準「戻る」を維持 | サイドバー開閉はヘッダーボタンのみ（エッジスワイプ競合回避） |

### DDP Tension Profile → 設計パラメータ変換

```
軸                      値    iOS設計への影響
────────────────────────────────────────────────────
Structure/Flow          2     厳格な構造 → サイドバー内のセクション階層を厳密に設計
Silence/Expression      1     最大抑制 → サイドバーは黒子。装飾ゼロ、色数制限
Precision/Imperfection  2     数学的精度 → 8ptグリッド厳守、ピクセル単位の間隔設計
Universal/Personal      5     均衡 → 標準的ナビパターン + ユーザー個人の知識体系を反映
Permanence/Impermanence 2     安定 → サイドバーは不動の構造体。控えめなアニメーション
```

Layer Dominance:
- **Primary: KOKKAKU（骨格）** → サイドバーはアプリの骨格そのもの。ナビゲーション秩序の定義者
- **Secondary: MA（間）** → 項目間の余白が各項目にアイデンティティを付与

---

## 1. ナビゲーションアーキテクチャ

### 1.1 構造変更

```
【変更前】
  Root (NativeStack)
  └── DrawerNavigator (補完的サイドバー)
      └── MainTabs (BottomTabs) ← プライマリナビゲーション
          ├── HomeTab (今日)
          ├── LibraryTab (ライブラリ)
          ├── ReviewTab (復習)
          ├── MapTab (マップ)
          └── SettingsTab (設定)

【変更後】
  Root (NativeStack)
  ├── Onboarding
  └── DrawerNavigator ← 唯一のプライマリナビゲーション
      ├── [Screen] Today        ← HomeStack
      ├── [Screen] Library      ← LibraryStack
      ├── [Screen] Review       ← ReviewStack
      ├── [Screen] Map          ← MapStack
      ├── [Screen] Journal      ← JournalStack
      └── [Screen] Settings     ← SettingsStack
```

### 1.2 画面遷移フロー

```
サイドバー（左ドロワー）
 │
 ├── 🟠 Today ──────────────────── メイン画面
 │    ├── → Review Session（フルスクリーンモーダル）
 │    │     └── 難易度選択 → 次カード → 完了サマリー
 │    └── → Quiz Mode（フルスクリーンモーダル）
 │          └── 穴埋めクイズ → 結果サマリー
 │
 ├── 📚 Library ────────────────── プッシュ遷移
 │    ├── → Item Detail
 │    │     └── 編集 / タグ管理 / 削除
 │    └── → Add Item
 │
 ├── 🔄 Review ─────────────────── フルスクリーンモーダル
 │    └── → Quiz
 │
 ├── 🗺 Map ────────────────────── インライン
 │    └── → Item Detail（ボトムシート .medium）
 │
 ├── 📓 Journal ────────────────── プッシュ遷移
 │    └── → Entry Detail
 │
 ├── ── Smart Filters ──
 │    ├── 今日の復習 → Today画面（フィルタ適用）
 │    ├── 期限切れ   → Today画面（フィルタ適用）
 │    └── 最近追加   → Library画面（フィルタ適用）
 │
 ├── ── Tags ──
 │    └── #タグ名 → Library画面（タグフィルタ適用）
 │
 ├── ── Collections ──
 │    └── コレクション → Library画面（コレクションフィルタ適用）
 │
 └── ⚙ Settings ────────────────── プッシュ遷移
```

### 1.3 型定義（変更後）

```typescript
// ============================================================
// ReCallKit ナビゲーション型定義（サイドバーのみ方式）
// 構造:
//   Root (NativeStack)
//   └── DrawerNavigator (唯一のプライマリナビゲーション)
//       ├── TodayScreen     → HomeStack
//       ├── LibraryScreen   → LibraryStack
//       ├── ReviewScreen    → ReviewStack
//       ├── MapScreen       → MapStack
//       ├── JournalScreen   → JournalStack
//       └── SettingsScreen  → SettingsStack
// ============================================================

// ---- Root ----
type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;  // → DrawerNavigator
};

// ---- Drawer（プライマリナビゲーション）----
type DrawerParamList = {
  TodayStack: NavigatorScreenParams<HomeStackParamList>;
  LibraryStack: NavigatorScreenParams<LibraryStackParamList>;
  ReviewStack: NavigatorScreenParams<ReviewStackParamList>;
  MapStack: NavigatorScreenParams<MapStackParamList>;
  JournalStack: NavigatorScreenParams<JournalStackParamList>;
  SettingsStack: undefined;
};

// 各Stack ParamListは既存を維持
```

---

## 2. サイドバーレイアウト仕様

### 2.1 全体構造ワイヤーフレーム

```
┌──────────────────────────────┐
│ [Safe Area Top: 59pt]        │
│                              │
│  ReCallKit              ✕    │  ← Header（アプリ名 + 閉じるボタン）
│                              │
│ ─────────────────────────── │  ← 余白による区切り（罫線なし）
│                              │
│  ● 今日                  3   │  ← Screen Navigation セクション
│    ライブラリ                │    アクティブ項目: Recall Amber
│    復習                      │    非アクティブ: secondaryLabel
│    マップ                    │
│    ジャーナル                │
│                              │
│ ─────── 24pt gap ─────────  │  ← セクション間の呼吸
│                              │
│  SMART FILTERS               │  ← Smart Filters セクション
│    今日の復習            5   │
│    期限切れ              2   │
│    最近追加                  │
│                              │
│ ─────── 24pt gap ─────────  │
│                              │
│  TAGS                        │  ← Tags セクション
│    ◦ フロントエンド      8   │
│    ◦ DB                  5   │
│    ◦ 心理学              3   │
│                              │
│ ─────── 24pt gap ─────────  │
│                              │
│  COLLECTIONS                 │  ← Collections セクション
│    📁 仕事で使う技術    15   │
│    📁 教養              8   │
│    📁 読書メモ          6   │
│                              │
│          (scroll)            │
│                              │
│ ─────────────────────────── │
│  42 cards · 68% mastered     │  ← Footer（統計情報）
│  ⚙ 設定                     │  ← Settings リンク
└──────────────────────────────┘
  width: 280pt
```

### 2.2 セクション構成

| # | セクション | 役割 | 項目タイプ |
|---|-----------|------|-----------|
| 1 | **Header** | アプリ名表示 + 閉じるボタン | 固定 |
| 2 | **Screen Navigation** | 画面遷移（タブバーの代替） | 固定5項目 |
| 3 | **Smart Filters** | コンテキスト依存のクイックフィルタ | 固定3項目 |
| 4 | **Tags** | ユーザーのタグ一覧 | 動的（DB連動） |
| 5 | **Collections** | ユーザーのコレクション一覧 | 動的（DB連動） |
| 6 | **Footer** | 統計情報 + 設定リンク | 固定 |

### 2.3 Screen Navigation セクション詳細

タブバーの5タブを置き換える最上位ナビゲーション。セクションヘッダーは不要（サイドバー最上位であり自明）。

| # | ラベル | アイコン（SF Symbol） | Ionicons代替 | 説明 |
|---|--------|---------------------|-------------|------|
| 1 | **今日** | `calendar.day.timeline.left` | `calendar-outline` / `calendar` | 今日の復習・ストリーク |
| 2 | **ライブラリ** | `books.vertical` | `library-outline` / `library` | 保存アイテム一覧 |
| 3 | **復習** | `arrow.trianglehead.2.clockwise` | `repeat-outline` / `repeat` | 復習セッション |
| 4 | **マップ** | `point.3.connected.trianglepath.dotted` | `map-outline` / `map` | ナレッジマップ |
| 5 | **ジャーナル** | `book.closed` | `journal-outline` / `journal` | 学びジャーナル |

**状態表現:**

| 状態 | テキスト | アイコン | 背景 |
|------|---------|---------|------|
| **アクティブ** | Recall Amber + Semibold(600) | Recall Amber（ソリッド） | `rgba(accent, 0.12)` 角丸8pt |
| **非アクティブ** | `secondaryLabel` + Regular(400) | `secondaryLabel`（アウトライン） | transparent |
| **プレス** | 変化なし | 変化なし | `systemGray5` 角丸8pt |

**バッジ表示:**
- 「今日」のみ、未完了の復習件数をカウントバッジで表示
- バッジ色: Recall Amber背景 + 白テキスト
- 件数0の場合は非表示

### 2.4 Smart Filters / Tags / Collections セクション

既存 `DrawerContent.tsx` の実装を継承。変更点なし。

### 2.5 Footer セクション（変更あり）

タブバー廃止に伴い、**Settings へのアクセスをFooterに追加**。

```
┌──────────────────────────────┐
│  42 cards · 68% mastered     │  ← 統計行（既存）
│ ─────────────────────────── │  ← hairline separator
│  ⚙ 設定                     │  ← 設定リンク（新規追加）
└──────────────────────────────┘
```

| 要素 | 仕様 |
|------|------|
| **統計行** | 高さ 48pt。テキスト: `tertiaryLabel` 12pt Regular。中央揃え |
| **区切り線** | `StyleSheet.hairlineWidth`。色: `separator` |
| **設定リンク** | 高さ 48pt。アイコン: `settings-outline` 20pt + ラベル「設定」15pt。色: `secondaryLabel`。左パディング 24pt |
| **Safe Area Bottom** | `insets.bottom` を考慮（Home Indicator領域） |

---

## 3. レイアウト数値仕様

### 3.1 サイドバー全体

| プロパティ | 値 | 備考 |
|-----------|-----|------|
| **幅** | 280pt | 既存 `SidebarLayout.width` 維持 |
| **高さ** | `screenHeight` (フルハイト) | タブバー廃止により `bottomOffset` 不要 |
| **背景色 (Light)** | `#EAEAEF` (solid) / `rgba(234,234,239,0.92)` (translucent) | 既存 `SidebarColors` |
| **背景色 (Dark)** | `#161618` (solid) / `rgba(22,22,24,0.92)` (translucent) | 既存 `SidebarColors` |
| **位置** | left | 左ドロワー |
| **タイプ** | front (overlay) | メインコンテンツの上に重なる |
| **オーバーレイ (Light)** | `rgba(0,0,0,0.30)` | 既存維持 |
| **オーバーレイ (Dark)** | `rgba(0,0,0,0.50)` | 既存維持 |

### 3.2 ヘッダー

| プロパティ | 値 |
|-----------|-----|
| **paddingTop** | `insets.top + 12pt` |
| **paddingBottom** | 12pt |
| **paddingLeft** | 24pt |
| **paddingRight** | 16pt |
| **タイトルフォント** | 17pt Semibold(600) |
| **閉じるボタン** | 36×36pt タッチ領域、アイコン22pt |

### 3.3 Screen Navigation 項目

| プロパティ | 値 | 備考 |
|-----------|-----|------|
| **項目高さ** | 48pt | 既存 `SidebarLayout.itemHeight` |
| **左パディング（非アクティブ）** | 24pt | `itemPaddingLeft` |
| **右パディング** | 16pt | `itemPaddingH` |
| **アイコンサイズ** | 20pt | `iconSize` |
| **アイコン-ラベル間隔** | 12pt | `itemGap` |
| **ラベルフォント** | 15pt Regular / Semibold(active) | |
| **カウントフォント** | 13pt Regular `tabular-nums` | |
| **アクティブ背景角丸** | 8pt | `Radius.s` |
| **アクティブ背景マージン** | 左右 8pt | `Spacing.s` |

### 3.4 セクション間隔

| 間隔 | 値 | DDP原則 |
|------|-----|---------|
| Header → Screen Navigation | 0pt | 直結（最上位セクション） |
| Screen Navigation → Smart Filters | **24pt** | 呼吸の切れ目 |
| Smart Filters → Tags | **24pt** | セクション境界 |
| Tags → Collections | **24pt** | セクション境界 |
| 最終セクション → スクロール底部 | **24pt** | 余白確保 |

### 3.5 セクションヘッダー

| プロパティ | 値 |
|-----------|-----|
| **高さ** | 32pt |
| **左右パディング** | 24pt |
| **フォント** | 12pt Semibold(600) |
| **文字間隔** | 0.8pt |
| **テキスト変換** | uppercase（英語セクション名） |
| **色** | `tertiaryLabel` |

**注意:** Screen Navigation セクションにはヘッダーを付けない（サイドバーの最上位であり自明）。

---

## 4. サイドバー開閉設計

### 4.1 トリガー（開く）

| 方法 | 仕様 | プラットフォーム |
|------|------|----------------|
| **ヘッダーボタン** | ナビゲーションバー左端のアイコンボタン | iPhone / iPad |
| **エッジスワイプ（Android）** | 左端30pxからの右スワイプ | Android のみ |

**iPhoneではエッジスワイプによるサイドバー開閉を無効化する。** 左端エッジスワイプはiOS標準の「前画面に戻る」ジェスチャーに予約する。

### 4.2 ヘッダーボタン仕様

```
┌──────────────────────────────────────┐
│  ☰  Today            (Large Title)   │
│                                      │
```

| プロパティ | 値 |
|-----------|-----|
| **アイコン** | Ionicons `menu-outline`（3本線）|
| **サイズ** | 24pt アイコン / 44×44pt タッチ領域 |
| **配置** | ナビゲーションバー左端 `headerLeft` |
| **色** | `label`（テーマ追従） |

**HIG逸脱への緩和:**
- ハンバーガーアイコンをApple純正では使わないが、ReCallKitでは知識体系の構造的ナビゲーション（タグ・コレクション）を含むため、単なるメニューではなく「知識の背骨へのアクセス」として正当化
- アイコンの視覚的な目立ちを確保（`label`色、24pt）

### 4.3 トリガー（閉じる）

| 方法 | 仕様 |
|------|------|
| **閉じるボタン（✕）** | サイドバーヘッダー右端 |
| **オーバーレイタップ** | 右側のメインコンテンツ暗幕領域をタップ |
| **項目選択** | ナビゲーション項目タップ後に自動で閉じる |

### 4.4 アニメーション

DDP `animation_character: restrained` に準拠。

| 動作 | 時間 | イージング | 備考 |
|------|------|----------|------|
| **開く** | 280ms | `cubic-bezier(0.32, 0.72, 0, 1)` | 非対称spring。素早く立ち上がり、滑らかに着地 |
| **閉じる** | 240ms | `ease-in` | 開くより短く。去り際は静かに |
| **オーバーレイ** | 同期 | `linear` | サイドバーと同時にフェードイン/アウト |

**Reduce Motion対応（必須）:**
```
reduceMotion ON → アニメーション無効。即座に表示/非表示。
```

### 4.5 ハプティクス

DDP `haptic_direction` に準拠: 最小限。

| イベント | フィードバック |
|---------|-------------|
| サイドバーを開く | `UIImpactFeedbackGenerator(.light)` |
| 項目選択 | `UISelectionFeedbackGenerator` |
| サイドバーを閉じる | なし（沈黙） |

---

## 5. メインコンテンツ領域の変更

### 5.1 タブバー廃止による変更

| 変更点 | 変更前 | 変更後 |
|--------|--------|--------|
| **コンテンツ下端** | タブバー上端（`screenHeight - 83pt`） | Safe Area下端（`screenHeight - insets.bottom`） |
| **利用可能高さ増加** | — | +49pt（タブバー本体分） |
| **ナビゲーションバー左端** | なし（タブで遷移） | ☰ ハンバーガーアイコン（サイドバートリガー） |

### 5.2 各画面のナビゲーションバー仕様

全画面共通: `headerLeft` にサイドバートリガーボタンを配置。

| 画面 | Large Title | headerLeft | headerRight |
|------|------------|-----------|-------------|
| **Today** | "今日" | ☰ サイドバー | なし |
| **Library** | "ライブラリ" | ☰ サイドバー | 🔍 検索 + ➕ 追加 |
| **Review** | "復習" | ☰ サイドバー | なし |
| **Map** | "マップ" | ☰ サイドバー | なし |
| **Journal** | "ジャーナル" | ☰ サイドバー | ➕ 新規 |
| **Settings** | "設定" | ← 戻る | なし |

**注意:** Settings はサイドバーからプッシュ遷移するため、`headerLeft` は標準の「戻る」ボタン（エッジスワイプでも戻れる）。

### 5.3 フィルタ適用時のヘッダー表示

サイドバーからSmart Filter / Tag / Collectionを選択した場合、メインコンテンツのナビゲーションバー下にフィルタバッジを表示。

```
┌──────────────────────────────────────┐
│  ☰  ライブラリ        (Large Title)  │
│  [✕ #フロントエンド]                 │  ← フィルタバッジ（タップで解除）
│──────────────────────────────────────│
│  （フィルタ適用済みのアイテム一覧）   │
```

| プロパティ | 値 |
|-----------|-----|
| **バッジ高さ** | 28pt |
| **バッジ角丸** | 6pt |
| **バッジ背景** | `filterBadgeBg`（`rgba(accent, 0.12)`） |
| **バッジテキスト** | `filterBadgeText`（Recall Amber） |
| **バッジフォント** | 12pt Regular |
| **✕ アイコン** | 10pt `close-circle` |

---

## 6. デバイス別対応

### 6.1 iPhone（Compact Width）

```
┌──────────────────────────────────────┐
│ ☰ Today               (Large Title) │
│──────────────────────────────────────│
│                                      │
│  （メインコンテンツ: フル画面）       │
│  （タブバーなし = 49pt 追加）         │
│                                      │
│──────────────────────────────────────│
│ [Home Indicator]                     │
└──────────────────────────────────────┘

  ↓ ☰ タップ

┌────────────────┬─────────────────────┐
│  Sidebar       │  ░░ (overlay) ░░░░░ │
│  280pt         │  ░░░░░░░░░░░░░░░░░░ │
│                │  ░░░░░░░░░░░░░░░░░░ │
│  ● 今日    3   │  ░░ Main Content ░░ │
│    ライブラリ  │  ░░ (dimmed)   ░░░░ │
│    復習        │  ░░░░░░░░░░░░░░░░░░ │
│    マップ      │  ░░░░░░░░░░░░░░░░░░ │
│    ジャーナル  │  ░░░░░░░░░░░░░░░░░░ │
│                │  ░░░░░░░░░░░░░░░░░░ │
│  SMART FILTERS │  ░░░░░░░░░░░░░░░░░░ │
│    ...         │  ░░░░░░░░░░░░░░░░░░ │
│                │                     │
│  TAGS          │                     │
│    ...         │                     │
│                │                     │
│ ─────────────  │                     │
│ 42 cards · 68% │                     │
│ ⚙ 設定        │                     │
└────────────────┴─────────────────────┘
```

- ドロワータイプ: `front`（メインコンテンツの上にオーバーレイ）
- サイドバー高さ: **フルスクリーン**（タブバー分のオフセット不要）
- エッジスワイプ: **無効**（iOS「戻る」と競合回避）

### 6.2 iPad（Regular Width — Phase 2）

```
┌─────────────┬──────────────────────────────────┐
│  Sidebar     │  Main Content                    │
│  (280pt)     │                                  │
│  常時表示    │  ┌─────────────────────────────┐ │
│              │  │                             │ │
│  ● 今日  3  │  │  Today                      │ │
│    ライブラリ│  │                             │ │
│    復習      │  │  ストリーク・復習カード     │ │
│    マップ    │  │                             │ │
│    ジャーナル│  │                             │ │
│              │  │                             │ │
│  SMART FILTERS│ │                             │ │
│    ...       │  │                             │ │
│              │  │                             │ │
│  TAGS        │  │                             │ │
│    ...       │  │                             │ │
│              │  │                             │ │
│  COLLECTIONS │  │                             │ │
│    ...       │  │                             │ │
│              │  └─────────────────────────────┘ │
│ ─────────── │                                  │
│ ⚙ 設定      │                                  │
└─────────────┴──────────────────────────────────┘
```

- サイドバー: **常時表示**（トグル不要）
- DDP "Marginal Silence" をフル適用（背骨としての存在感）
- メインコンテンツ: `screenWidth - 280pt`

### 6.3 デバイス対応まとめ

| デバイス | Size Class | サイドバー形態 | 開閉方式 |
|---------|-----------|--------------|---------|
| **iPhone** | Compact | 左ドロワー（overlay） | ☰ ボタン |
| **iPad Portrait** | Compact | 左ドロワー（overlay） | ☰ ボタン |
| **iPad Landscape** | Regular | 常時表示（persistent） | 不要 |
| **iPad Split View** | Compact/Regular | 幅に応じて自動切替 | 自動 |

---

## 7. アクセシビリティ

### 7.1 VoiceOver

| 要素 | accessibilityRole | accessibilityLabel | accessibilityHint |
|------|-------------------|-------------------|-------------------|
| サイドバートリガー（☰） | `button` | "サイドバーを開く" | "ダブルタップでナビゲーションメニューを表示します" |
| 閉じるボタン（✕） | `button` | "サイドバーを閉じる" | — |
| Screen Navigation 項目 | `menuitem` | "{ラベル}" | "ダブルタップで{ラベル}画面に移動します" |
| Smart Filter 項目 | `menuitem` | "{ラベル}、{N}件" | "ダブルタップでフィルタを適用します" |
| Tag 項目 | `menuitem` | "タグ {名前}、{N}件" | — |
| Collection 項目 | `menuitem` | "コレクション {名前}、{N}件" | — |
| Settings リンク | `menuitem` | "設定" | — |
| サイドバー全体 | `menu` | "ナビゲーションメニュー" | — |

### 7.2 アクティブ状態の通知

```
accessibilityState={{ selected: isActive }}
// VoiceOver: "今日、選択中、メニュー項目"
```

### 7.3 Dynamic Type

- 全テキスト: `allowFontScaling={true}`
- 項目高さ: テキストサイズに応じて最小48pt → 自動拡張
- セクションヘッダー: 12pt → Dynamic Type `caption1` 相当

### 7.4 Reduce Motion

- サイドバー開閉アニメーション: 無効化（即座に表示/非表示）
- 項目選択時のハイライトアニメーション: 無効化

### 7.5 コントラスト比

| テキスト | Light Mode | Dark Mode | WCAG AA |
|---------|-----------|-----------|---------|
| アクティブラベル (#C47F17 on #EAEAEF) | 3.8:1 | — | 大テキスト3:1 ✅ |
| アクティブラベル (#F5A623 on #161618) | — | 6.2:1 | 通常4.5:1 ✅ |
| 非アクティブラベル (secondaryLabel) | 4.6:1 | 4.6:1 | 通常4.5:1 ✅ |
| セクションヘッダー (tertiaryLabel) | 2.6:1 | 2.6:1 | 装飾的テキスト ⚠️ |

**注意:** Light Modeのアクティブラベル（#C47F17）は通常テキスト基準(4.5:1)を満たさない。フォントサイズ15pt + Semibold(600)により「大テキスト」基準(3:1)を適用。

---

## 8. オンボーディング考慮

### 8.1 サイドバー操作の教育

タブバーがないため、初回起動時にサイドバーの存在と操作方法をユーザーに教育する必要がある。

| ステップ | 内容 |
|---------|------|
| **オンボーディング完了後** | サイドバーを自動で一度開き、0.8秒後に自動で閉じる。ハンバーガーアイコンにパルスアニメーション（3回）を表示 |
| **Coach Mark** | ハンバーガーアイコン付近にツールチップ「メニューから画面を切り替えできます」を表示。タップで消去 |
| **初回Smart Filter使用時** | フィルタ適用のフィードバック（バッジ表示 + 短い説明） |

### 8.2 デフォルト画面

アプリ起動時のデフォルト画面は **Today（今日）**。最後に選択した画面を `AsyncStorage` に保存し、次回起動時に復元する。

---

## 9. 実装変更箇所

### 9.1 削除するファイル/コンポーネント

| ファイル | 理由 |
|---------|------|
| `src/navigation/MainTabs.tsx` | ボトムタブナビゲーター全体を廃止 |

### 9.2 変更するファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/navigation/DrawerNavigator.tsx` | MainTabs を個別Stack画面に置き換え。`drawerStyle.height` をフルスクリーンに変更 |
| `src/components/DrawerContent.tsx` | Screen Navigation セクション追加。Footer に Settings リンク追加 |
| `src/navigation/types.ts` | `DrawerParamList` を個別Stack参照に変更。`MainTabParamList` 削除 |
| `src/navigation/RootNavigator.tsx` | MainTabs への参照を削除 |
| `src/theme/spacing.ts` | `SidebarLayout.bottomOffset` を 0 に変更（または削除） |
| `src/components/HeaderHamburger.tsx` | 全画面の `headerLeft` で使用するサイドバートリガーコンポーネント |
| `src/screens/*/` | 各画面の `headerLeft` にハンバーガーボタンを追加 |
| `package.json` | `@react-navigation/bottom-tabs` 依存を削除（オプション） |

### 9.3 新規ファイル

| ファイル | 内容 |
|---------|------|
| （なし — 既存ファイルの変更で対応可能） | |

---

## 10. iOS Design Spec（Layer 3 引き渡し用）

```yaml
ios_design_spec:
  navigation:
    type: drawer_sidebar_only
    sidebar_width: 280pt
    sidebar_position: left
    sidebar_type: front_overlay
    screens:
      - id: today
        icon: "calendar-outline"
        icon_active: "calendar"
        label: "今日"
      - id: library
        icon: "library-outline"
        icon_active: "library"
        label: "ライブラリ"
      - id: review
        icon: "repeat-outline"
        icon_active: "repeat"
        label: "復習"
      - id: map
        icon: "map-outline"
        icon_active: "map"
        label: "マップ"
      - id: journal
        icon: "journal-outline"
        icon_active: "journal"
        label: "ジャーナル"

  components:
    sidebar_item:
      height: 48pt
      padding_left: 24pt
      padding_right: 16pt
      icon_size: 20pt
      icon_label_gap: 12pt
      active_bg_radius: 8pt
      active_bg_margin_h: 8pt
    section_header:
      height: 32pt
      padding_h: 24pt
      font: "12pt Semibold uppercase"
      color: tertiaryLabel
    footer:
      height: 96pt  # stats(48pt) + separator + settings(48pt)
      stats_font: "12pt Regular"
      stats_color: tertiaryLabel

  colors:
    primary: "Recall Amber (Light: #C47F17 / Dark: #F5A623)"
    active_background: "rgba(accent, 0.12/0.15)"
    sidebar_bg_light: "#EAEAEF"
    sidebar_bg_dark: "#161618"
    overlay_light: "rgba(0,0,0,0.30)"
    overlay_dark: "rgba(0,0,0,0.50)"
    semantic_mapping:
      success: systemGreen
      warning: systemOrange
      error: systemRed
      info: systemBlue
    dark_mode: auto

  typography:
    system: SF_Pro
    sidebar_title: "17pt Semibold"
    screen_nav_label: "15pt Regular / Semibold(active)"
    section_header: "12pt Semibold uppercase tracking:0.8"
    item_label: "15pt Regular / Semibold(active)"
    count_badge: "13pt Regular tabular-nums"
    footer_stats: "12pt Regular"
    settings_label: "15pt Regular"

  animation:
    sidebar_open:
      duration: 280ms
      easing: "cubic-bezier(0.32, 0.72, 0, 1)"
    sidebar_close:
      duration: 240ms
      easing: "ease-in"
    reduce_motion: required

  accessibility:
    wcag_version: "2.2"
    level: AA
    voiceover: required
    dynamic_type: required
    contrast_normal: "4.5:1"
    contrast_large: "3:1"
    reduce_motion: required

  frontend_design_zones:
    - zone: splash_screen
      constraints: "全画面自由・ただし3秒以内に遷移"
    - zone: onboarding_hero
      constraints: "ページ上部50%まで・ナビゲーション要素に干渉しない"
    - zone: empty_state_illustration
      constraints: "200x200px領域内・装飾的要素のみ"
    - zone: sidebar_footer_stats
      constraints: "統計情報領域のみ・48pt高さ内"
```

---

## 11. DDP "Marginal Silence" 適用マッピング

| DDP哲学 | サイドバーのみ方式での適用 |
|---------|------------------------|
| **余白が主役** | Screen Navigation 項目間の 48pt 行高さが、各画面への入口に「間」を与える。セクション間 24pt の呼吸が構造を可視化する |
| **骨格の不可視性** | セクション区切りは余白の変化のみ。罫線・背景色分けなし。8ptグリッドの整数倍がすべてを統治 |
| **光のスリット** | Recall Amber のアクティブ表示が力を持つのは、他のすべてが `secondaryLabel` の沈黙を保つからこそ |
| **空の器** | 初回起動時は Screen Navigation の5項目 + 空の Tags/Collections。ユーザーの知識蓄積に伴い充実 |
| **知識の背骨** | サイドバーがタブバーの代替となることで、知識体系のナビゲーションがアプリの中心構造に昇格 |
| **2ウェイトのタイポグラフィ** | Regular（項目）+ Semibold（セクションヘッダー・アクティブ項目）の2段階のみ |

---

## 12. 既存設計文書との関係

| ドキュメント | 本仕様との関係 |
|------------|-------------|
| `docs/navigation-design-decision.md` | **上書き**。タブバー+Library統合フィルタUI方針を破棄し、サイドバーのみ方式に変更 |
| `docs/ios-uiux-spec.md` §5 | **上書き**。ナビゲーションアーキテクチャ節のタブバー構成を本仕様で置換 |
| `docs/ddp-sidebar.md` | **継承・拡張**。DDP哲学はそのまま適用。サイドバーの役割が「補完」から「主役」に昇格 |
| `docs/design-document.md` | **要更新**。ナビゲーション関連セクションの改訂が必要 |

---

## 参照ドキュメント

- `docs/ddp-sidebar.md` — DDP "Marginal Silence"（余白の沈黙）
- `docs/ios-uiux-spec.md` — iOS UI/UXデザイン仕様書
- `docs/navigation-design-decision.md` — 旧ナビゲーション設計決定書
- `sidebar.html` — サイドバーデザインリファレンス（HTMLプロトタイプ）
- `src/components/DrawerContent.tsx` — 現在のサイドバー実装
- `src/navigation/DrawerNavigator.tsx` — 現在のドロワー設定
- [Apple HIG — Sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars)
- [Apple HIG — Navigation](https://developer.apple.com/design/human-interface-guidelines/navigation)
