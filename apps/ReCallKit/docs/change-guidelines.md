# ReCallKit — UI変更指針

> 作成日: 2026-03-31
> 出典: ios-uiux-spec.md / design-document.md / colors.ts / spacing.ts / typography.ts

---

## 0. 大原則：設計哲学を守る

**コンセプト: 「静かに積み上がる知識」**
図書館の書架メタファー。派手な演出より、日々の復習が確実に積み上がる実感を提供する。

### MA（間）主軸
- 装飾を足すより余白を活かす
- UIクロム（ナビゲーション・ボタン・バッジ等）は最小限に
- コンテンツ（保存テキスト・ハイライト）を主役にする

### 3設計原則
1. **フリクションゼロ** — 保存も復習も1タップ以内で開始できること
2. **静寂の力** — 余白がコンテンツを際立たせる。装飾を排する
3. **確実な成長実感** — ストリーク・進捗を「控えめに」可視化

---

## 1. カラー制限（厳守）

### アクセントカラーは1色のみ
```
Recall Amber
├── Light: #C47F17
└── Dark:  #F5A623
```
- CTA ボタン、アクティブ状態、ストリーク、進捗バーに使う
- **Amber 以外の色でアクセントを作らない**（indigo, purple, teal は特殊状態のみ可）

### 状態色は iOS システムカラーのみ
| 状態 | 色 | 用途 |
|---|---|---|
| 成功 / 正解 | `systemGreen` (#30D158) | ストリーク達成・Good ボタン |
| 警告 / 期限切れ | `systemOrange` (#FF9F0A) | 復習遅延バッジ |
| エラー / 不正解 | `systemRed` (#FF3B30) | Again ボタン・削除 |
| 情報 / リンク | `systemBlue` (#0A84FF) | 元記事リンク・ヘルプ |

### 色を追加したくなったら
→ **まず余白・タイポグラフィウェイト・不透明度で解決を試みる**
どうしても色が必要な場合のみ、上記システムカラーの透過バリアント（@12〜15%）を検討する。

---

## 2. タイポグラフィ（TypeScale から必ず使う）

```ts
// 正しい使い方
style={TypeScale.headline}  // Semibold, 17pt

// NG: 固定値の直書き
style={{ fontSize: 17, fontWeight: '600' }}
```

### スケール対応表（用途判断の基準）
| スタイル | サイズ | 用途 |
|---|---|---|
| `largeTitle` | 34pt Bold | 画面タイトル（Nav Large Title） |
| `title2` | 22pt Bold | カードタイトル・統計数値 |
| `title3` | 20pt Semibold | セクションヘッダー・重要情報 |
| `headline` | 17pt Semibold | ボタンラベル・強調テキスト |
| `body` / `bodyJA` | 17pt Regular | 本文・保存テキスト |
| `subheadline` | 15pt Regular | メタデータ（日時・タグ） |
| `caption1` | 12pt Regular | タブラベル・バッジ |

### Dynamic Type 対応（必須）
- `allowFontScaling={true}` を全テキストに（省略時はデフォルト true なので削除で OK）
- **固定 pt 指定 (`allowFontScaling={false}`) は禁止**

### 日本語テキスト
- 本文は `TypeScale.bodyJA` を使う（lineHeight: 28 = 1.6倍）
- 英語・数字混じりの短いラベルは `TypeScale.body` で OK

---

## 3. スペーシング（Spacing / Radius から必ず使う）

```ts
// 正しい使い方
padding: Spacing.m   // 16pt
borderRadius: Radius.m  // 12pt (カード)

// NG: マジックナンバー直書き
padding: 16
```

### 用途別スペーシング
| トークン | 値 | 典型的な用途 |
|---|---|---|
| `Spacing.xs` | 4pt | アイコン〜ラベル間 |
| `Spacing.s` | 8pt | カード内要素間 |
| `Spacing.m` | 16pt | **カード左右パディング・標準マージン** |
| `Spacing.l` | 24pt | カード間・セクション内余白 |
| `Spacing.xl` | 32pt | セクション間 |
| `Spacing.xxl` | 48pt | 大セクション間 |

### カード標準仕様
```
角丸: Radius.m (12pt)
パディング: Spacing.m (16pt)
カード間隔: 12pt
背景: colors.backgroundSecondary
ダークモード: border 0.5pt, colors.separator
```

### タップターゲット最小サイズ
全てのインタラクティブ要素は **44×44pt 以上**。
```ts
import { MinTapTarget } from '../theme/spacing';
// MinTapTarget === 44
```

---

## 4. ナビゲーション

### 現行構成（確定）
- サイドバー（ドロワー）ナビゲーション ＋ ハンバーガーボタン
- タブバーは廃止済み（`SidebarLayout.bottomOffset: 0`）

### 遷移パターン
| 遷移タイプ | 用途 |
|---|---|
| Push（スタック） | Item Detail, Settings, URL解析結果 |
| フルスクリーンモーダル | Review, QuizMode |
| ボトムシート | Map ノード詳細 |

### 設定画面
今日（Today）画面の NavBar 右端の `gearshape` アイコンから Push 遷移。
独立画面として追加しない。

---

## 5. コンポーネント変更ルール

### 既存コンポーネント変更時
1. **git commit** で現状をコミットしてから変更開始
2. theme から import する（直書きしない）
3. ライト/ダーク両方を `useTheme()` で対応

```ts
const { colors, isDark } = useTheme();
```

### 新規コンポーネント追加時
- `src/components/` に配置
- Props に `style?: ViewStyle` を受け付け（合成可能に）
- useTheme は内部で呼ぶ（colors を props で渡さない）

### 画面ファイル変更時
- 必ず `git commit` してから作業開始
- スクリーン固有のスタイルは `StyleSheet.create()` で末尾に集約
- `colors.*` を直接 inline style に書かない（可読性のため StyleSheet 経由）

---

## 6. アニメーション

- 控えめに。MA 哲学に従い動きは最小限。
- フリップカード: Y軸回転 Spring（duration: 0.4s, bounce: 0.15）
- 状態更新後のフェード: 0.3s
- ストリークカウントアップ: Spring 0.6s
- **パリパリな高速アニメ・バウンス多用は禁止**

---

## 7. 空状態（Empty State）デザイン

全画面に空状態を用意する。

- イラスト（線画）または SF Symbol 系アイコン（200×200pt）
- タイトル: `TypeScale.title3`、`.label`
- サブテキスト: `TypeScale.body`、`colors.labelSecondary`
- CTA ボタン（必要な場合のみ）: Recall Amber

---

## 8. エラー・ローディング状態

- ローディング: `ActivityIndicator` + `colors.accent`（Amber）
- エラー: `TypeScale.body` でメッセージ + 再試行ボタン
- **スピナーをいつまでも表示しない**（タイムアウト処理必須）

---

## 変更前チェックリスト

- [ ] `git commit` でコミット済み
- [ ] `useTheme()` でカラー参照
- [ ] `TypeScale.*` でフォント指定
- [ ] `Spacing.*` / `Radius.*` でサイズ指定
- [ ] タップターゲット 44pt 以上
- [ ] ダークモード対応確認（isDark 分岐）
- [ ] 余白でコンテンツを際立たせる（MA 哲学）
- [ ] 装飾・アニメーション追加は最小限か

---

## 参照ドキュメント

| ドキュメント | 内容 |
|---|---|
| `docs/ios-uiux-spec.md` | 画面別詳細仕様・コンポーネント詳細 |
| `docs/design-document.md` | 市場分析・機能仕様・アーキテクチャ |
| `docs/architecture.md` | DB設計・パッケージ構成 |
| `docs/design-bedrock-url-analysis.md` | URL解析 × Bedrock 設計・実装ステップ |
| `src/theme/colors.ts` | カラートークン定義 |
| `src/theme/typography.ts` | タイプスケール定義 |
| `src/theme/spacing.ts` | スペーシング・ボーダー半径定義 |
