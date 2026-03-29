# Web UI/UX Design Spec — Excel to PDF Converter

**Layer 2b Output** | Generated from DDP: Still Velocity (静速)
**Date**: 2026-03-29

---

## 0. DDP → Web設計パラメータ変換

### Tension Profile マッピング

```
軸                       値    → Web設計パラメータ
─────────────────────────────────────────────────────────────────
Structure/Flow           2/10  → 厳格な構造。シングルカラム集中型レイアウト
Silence/Expression       2/10  → Type A モノクローム + 単一アクセント色
Precision/Imperfection   1/10  → 均等グリッド / 厳密タイプスケール / 幾何学系フォント
Universal/Personal       1/10  → グローバル標準UI / システムフォント優先
Permanence/Impermanence  2/10  → 安定配色 / 控えめアニメーション（100-400ms）
```

### Layer Dominance

- **KOKKAKU (骨格)**: 構造がすべてを支配する。ドロップゾーンを重力中心とした求心的構成
- **MA (間)**: 余白が信頼を可視化する。余白こそが最重要デザイン要素

### 感情的到達点

> ユーザーが変換後に無意識に感じる「**それは簡単だった**」

---

## 1. Layout

### 1.1 レイアウトパターン

**シングルカラム集中型** — ドロップゾーンを重力中心とした垂直一方向フロー

```
┌─────────────────────────────────────────────┐
│  Header（ロゴ + サービス名）                    │  ← 最小限。48px高
├─────────────────────────────────────────────┤
│                                             │
│                                             │
│         ┌───────────────────────┐           │
│         │                       │           │
│         │    Drop Zone          │           │  ← 重力中心。最大の余白に囲まれる
│         │    (ファイルアップロード)  │           │
│         │                       │           │
│         └───────────────────────┘           │
│                                             │
│         ┌───────────────────────┐           │
│         │  File List Table      │           │  ← ファイル追加後に出現
│         │  (ファイル一覧)         │           │
│         └───────────────────────┘           │
│                                             │
│         [     Convert Button     ]          │  ← 単一のプライマリCTA
│                                             │
│         ┌───────────────────────┐           │
│         │  Download Area        │           │  ← 変換完了後に出現
│         │  (ダウンロード)         │           │
│         └───────────────────────┘           │
│                                             │
├─────────────────────────────────────────────┤
│  Footer（プライバシー + FAQ）                   │
└─────────────────────────────────────────────┘
```

### 1.2 グリッドシステム

```css
/* 12カラムグリッド。コンテンツは中央8カラムに集約 */
.page {
  display: grid;
  grid-template-columns: 1fr minmax(0, 720px) 1fr;
  min-height: 100vh;
}

.content {
  grid-column: 2;
  padding: 0 var(--space-6);
}
```

### 1.3 コンテンツ最大幅

| 要素 | 最大幅 | 理由 |
|------|--------|------|
| ページコンテンツ | 720px | DDPの単一カラム原則。認知負荷最小化 |
| ドロップゾーン | 720px（100%） | 重力中心。可能な限り大きく |
| ファイルテーブル | 720px（100%） | コンテンツ幅に一致 |
| フッターFAQ | 720px | テキスト可読性（1行45-75文字） |

### 1.4 レスポンシブブレイクポイント

| 名前 | 範囲 | 変更点 |
|------|------|--------|
| sm | 360-767px | パディング縮小。ドロップゾーン高さ200px。テーブル横スクロール |
| md | 768-1023px | パディング標準。ドロップゾーン高さ280px |
| lg | 1024px+ | 最大幅720px中央配置。ドロップゾーン高さ320px |

---

## 2. Color System

### 2.1 カラー戦略: Type A モノクローム + 単一アクセント

DDPの指示: 「ほぼモノクロームの静寂。単一のアクセント色のみを許容する。アクセントはアクション・進捗・完了の3状態のみに使用。」

**アクセント色**: `#2563EB` (Blue-600) — 寒色寄り。信頼・安全を暗示。警告色に近づかない節度。

### 2.2 カラートークン（ライトモード）

```css
:root {
  /* ── Background ── */
  --color-bg:               #FAFAFA;   /* 純白より1段落ち着く。グレア低減 */
  --color-surface:          #FFFFFF;   /* カード・テーブル・ドロップゾーン */
  --color-surface-hover:    #F5F5F5;   /* テーブル行ホバー */

  /* ── Text ── */
  --color-text-primary:     #171717;   /* 高コントラスト。WCAG AAA */
  --color-text-secondary:   #737373;   /* メタ情報・補足。AA準拠 */
  --color-text-tertiary:    #A3A3A3;   /* プレースホルダー */

  /* ── Border ── */
  --color-border:           #E5E5E5;   /* 標準ボーダー */
  --color-border-strong:    #D4D4D4;   /* テーブルヘッダー等 */

  /* ── Accent（単一。アクション・進捗・完了のみに使用） ── */
  --color-accent:           #2563EB;   /* Blue-600。プライマリアクション */
  --color-accent-hover:     #1D4ED8;   /* Blue-700 */
  --color-accent-light:     #EFF6FF;   /* Blue-50。進捗バー背景 */
  --color-accent-subtle:    #DBEAFE;   /* Blue-100。ドロップゾーンドラッグ中 */

  /* ── Semantic（機能色） ── */
  --color-success:          #16A34A;   /* Green-600。変換完了 */
  --color-success-light:    #F0FDF4;   /* Green-50 */
  --color-error:            #DC2626;   /* Red-600。変換失敗 */
  --color-error-light:      #FEF2F2;   /* Red-50 */
  --color-warning:          #D97706;   /* Amber-600 */
}
```

### 2.3 カラートークン（ダークモード）

```css
:root[data-theme="dark"] {
  /* ── Background ── */
  --color-bg:               #0A0A0A;   /* Layer 0-1。ソフトブラック */
  --color-surface:          #171717;   /* Layer 2 */
  --color-surface-hover:    #262626;   /* Layer 3 */

  /* ── Text ── */
  --color-text-primary:     rgba(255, 255, 255, 0.87);
  --color-text-secondary:   rgba(255, 255, 255, 0.60);
  --color-text-tertiary:    rgba(255, 255, 255, 0.38);

  /* ── Border ── */
  --color-border:           rgba(255, 255, 255, 0.10);
  --color-border-strong:    rgba(255, 255, 255, 0.16);

  /* ── Accent（彩度20%抑制） ── */
  --color-accent:           #3B82F6;   /* Blue-500 */
  --color-accent-hover:     #60A5FA;   /* Blue-400 */
  --color-accent-light:     rgba(37, 99, 235, 0.12);
  --color-accent-subtle:    rgba(37, 99, 235, 0.08);

  /* ── Semantic ── */
  --color-success:          #22C55E;   /* Green-500 */
  --color-success-light:    rgba(22, 163, 74, 0.12);
  --color-error:            #EF4444;   /* Red-500 */
  --color-error-light:      rgba(220, 38, 38, 0.12);
  --color-warning:          #F59E0B;   /* Amber-500 */
}

/* OS設定追従 */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    /* ダークモード変数を適用 */
  }
}
```

### 2.4 色の使用ルール

| 用途 | トークン | 備考 |
|------|---------|------|
| ページ背景 | `--color-bg` | 常にニュートラル |
| カード・パネル | `--color-surface` | bgとの微差で浮上感 |
| **アクション**（変換ボタン） | `--color-accent` | **唯一の色彩。声を持つ** |
| **進捗**バー | `--color-accent` | アクセントの再利用 |
| **完了**状態 | `--color-success` | 変換成功時のみ |
| エラー状態 | `--color-error` | 色 + アイコン + テキストで伝達 |
| その他すべて | グレースケール | 静寂を維持 |

---

## 3. Typography

### 3.1 フォント選定

DDPの指示: 「機能的で透明な書体。読むことを意識させない文字。数字の可読性を特に重視する。」

```css
:root {
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans JP",
               "Hiragino Sans", "Hiragino Kaku Gothic ProN", Meiryo, sans-serif;
  --font-mono: "SF Mono", "Cascadia Code", "Noto Sans Mono", Consolas, monospace;
}
```

- **本文**: システムフォントスタック（最速ロード。FOUT完全回避）
- **数値表示**: `font-variant-numeric: tabular-nums`（ファイルサイズ・進捗率の整列）
- **ファイル名**: `--font-mono`（等幅で拡張子の識別性を向上）

### 3.2 タイプスケール

| レベル | サイズ | ウェイト | 行間 | 用途 |
|--------|--------|---------|------|------|
| h1 | 24px | 600 | 1.3 | ページタイトル（なし。サービス名のみ） |
| h2 | 18px | 600 | 1.4 | セクション見出し（「変換済みファイル」等） |
| Body | 15px | 400 | 1.7 | 本文・説明テキスト |
| Label | 13px | 500 | 1.5 | テーブルヘッダー・ボタンラベル |
| Caption | 12px | 400 | 1.5 | ファイルサイズ・ステータス・補足情報 |
| Micro | 11px | 400 | 1.4 | フッター注記（最小限に使用） |

### 3.3 タイポグラフィルール

- **ウェイト**: 400（Regular）と 600（SemiBold）の **2種のみ**。DDPの制約原則に従う
- **大文字**: 使用しない。ボタンラベルも文頭大文字のみ（"Convert to PDF"）
- **レタースペーシング**: デフォルト値。調整しない
- **数値**: `tabular-nums` で整列。ファイルサイズは常に単位付き（"2.4 MB"）

---

## 4. Spacing System

### 4.1 スペーシングスケール（4px基準）

```css
:root {
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  24px;
  --space-6:  32px;
  --space-7:  48px;
  --space-8:  64px;
  --space-9:  96px;
  --space-10: 128px;
}
```

### 4.2 空間の呼吸設計

DDPの指示: 「密度の変化: 操作前（開放的）→ 変換中（凝縮）→ 完了後（解放）」

| 状態 | ドロップゾーン上余白 | ドロップゾーン下余白 | 体感 |
|------|-------------------|-------------------|------|
| Empty（初期） | `--space-10` (128px) | `--space-10` (128px) | **開放的**。広大な余白が静かに待つ |
| Files Added（ファイル追加後） | `--space-7` (48px) | `--space-5` (24px) | **凝縮の予兆**。テーブルが現れ余白が収まる |
| Converting（変換中） | `--space-5` (24px) | `--space-4` (16px) | **凝縮**。進捗に注意を集中 |
| Complete（完了） | `--space-5` (24px) | `--space-7` (48px) | **解放**。ダウンロードエリアが浮上 |

### 4.3 角丸

```css
:root {
  --radius-sm:  6px;    /* ボタン・インプット・バッジ */
  --radius-md:  10px;   /* カード・テーブル・ドロップゾーン */
  --radius-lg:  14px;   /* モーダル（使用しない方針だが予約） */
}
```

### 4.4 影

```css
:root {
  --shadow-sm:   0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md:   0 2px 8px rgba(0, 0, 0, 0.06);
  --shadow-drag: 0 4px 16px rgba(0, 0, 0, 0.08);  /* ドラッグ中のドロップゾーン */
}
```

DDPの指示: 「光と影の最小限の階層で奥行きを表現する。表面は滑らかで摩擦のない印象。」
影は控えめに。主にドラッグ操作時のフィードバックとしてのみ強調。

---

## 5. Component Spec

### 5.1 Header

```
┌─────────────────────────────────────────────────┐
│  [Logo]  Excel to PDF                           │
│                                       48px 高    │
└─────────────────────────────────────────────────┘
```

| 項目 | 仕様 |
|------|------|
| 高さ | 48px |
| ロゴ | 20×20px。モノクロームのシンプルなアイコン（ドキュメント → PDF を抽象化） |
| サービス名 | 15px / SemiBold / `--color-text-primary` |
| 背景 | `--color-bg`（ページ背景と同一。境界を消す） |
| ボーダー | なし。または `--color-border` の1px下線（スクロール時のみ表示） |
| 配置 | 左寄せ。右側は空。DDPの「何もない」が信頼を語る |

**ヘッダーはほぼ不可視**。ユーザーの注意をドロップゾーンに集中させるため、存在感を最小化する。

### 5.2 File Upload Area（ドロップゾーン）

**重力中心。このサービスの最重要コンポーネント。**

```
┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐
│                                               │
│                                               │
│              ↑ (アップロードアイコン)             │
│                                               │
│       ファイルをここにドラッグ&ドロップ             │
│       または クリックして選択                     │
│                                               │
│       .xlsx  .xls  .csv                       │
│                                               │
│                                               │
└─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘
```

| 項目 | 仕様 |
|------|------|
| サイズ | 幅100%（max 720px）/ 高さ 320px（lg）、280px（md）、200px（sm） |
| ボーダー | 2px dashed `--color-border`。DDPの「開かれた閾（しきい）」— 堅い壁ではない |
| 角丸 | `--radius-md` (10px) |
| 背景 | `--color-surface` |
| アイコン | 24px。矢印上向き。`--color-text-tertiary`。装飾ではなく記号 |
| メインテキスト | 「ファイルをここにドラッグ&ドロップ」15px / 400 / `--color-text-secondary` |
| サブテキスト | 「または クリックして選択」13px / 400 / `--color-text-tertiary`。リンクスタイルにはしない |
| 対応形式 | 「.xlsx .xls .csv」12px / 400 / `--color-text-tertiary`。控えめに表示 |
| 複数ファイル | 対応。フォルダ選択も可 |

**状態遷移:**

| 状態 | 変化 |
|------|------|
| Default | 上記の静かな待機状態 |
| Hover | ボーダー色 → `--color-border-strong`。200ms ease |
| Drag Over | ボーダー → 2px solid `--color-accent`。背景 → `--color-accent-subtle`。影 → `--shadow-drag`。200ms ease。**受容を表現** |
| Processing | ドロップ直後。アイコンが小さなスピナーに変化（200ms）。ファイル読み込み中 |
| Files Added | ドロップゾーンが縮小（高さ120px）。「ファイルを追加」の簡潔な表示に変化。テーブルが下に出現 |

### 5.3 File List Table（ファイル一覧）

ファイル追加後に出現。DDPの「位置と比率で状態を伝える」原則に従う。

```
┌──────────────────────────────────────────────────────────────┐
│  ファイル名                    サイズ     ステータス     操作    │
├──────────────────────────────────────────────────────────────┤
│  📄 quarterly-report.xlsx     2.4 MB    ✓ 準備完了     [×]   │
│  📄 invoice-2024.xls          890 KB    ✓ 準備完了     [×]   │
│  📄 data-summary.csv          1.1 MB    ⚠ 形式確認     [×]   │
└──────────────────────────────────────────────────────────────┘
   3 ファイル（合計 4.4 MB）
```

| 項目 | 仕様 |
|------|------|
| 外枠 | `--color-border` 1px solid / `--radius-md` |
| ヘッダー行 | 背景 `--color-bg` / テキスト 13px SemiBold `--color-text-secondary` |
| データ行高さ | 48px（タッチターゲット確保） |
| 行ホバー | 背景 → `--color-surface-hover` / 200ms ease |
| ファイル名 | 13px / `--font-mono` / `--color-text-primary` / 1行クランプ（text-overflow: ellipsis） |
| サイズ | 12px / `--font-mono` / `--color-text-secondary` / `tabular-nums` |
| ステータス | アイコン + テキスト。色だけで伝えない（WCAG 1.4.1） |
| 削除ボタン | 20×20px ×アイコン / `--color-text-tertiary` / hover時 `--color-error` / 44×44pxタッチ領域 |
| 集計行 | テーブル下。12px / `--color-text-secondary`。「3 ファイル（合計 4.4 MB）」 |
| 空テーブル | 表示しない。ファイル0件ではドロップゾーンのみ表示 |

**ステータスアイコン:**

| ステータス | アイコン | 色 | テキスト |
|-----------|---------|-----|---------|
| 準備完了 | ✓（チェック） | `--color-success` | 「準備完了」 |
| 形式確認中 | ○（スピナー） | `--color-text-tertiary` | 「確認中...」 |
| 変換中 | ○（スピナー） | `--color-accent` | 「変換中...」 |
| 変換完了 | ✓（チェック） | `--color-success` | 「完了」 |
| エラー | ×（クロス） | `--color-error` | 「変換失敗」 |

### 5.4 Convert Button（変換ボタン）

**単一画面に1つのプライマリCTA。このボタンだけが「声」を持つ。**

```
┌─────────────────────────────────────┐
│         PDF に変換する (3)            │   ← ファイル件数を表示
└─────────────────────────────────────┘
```

| 項目 | 仕様 |
|------|------|
| 幅 | 100%（max 720px） |
| 高さ | 48px |
| 角丸 | `--radius-sm` (6px) |
| 背景 | `--color-accent` |
| テキスト | 15px / SemiBold / #FFFFFF |
| ラベル | 「PDF に変換する (n)」— 動詞 + 対象 + 件数 |

**状態遷移:**

| 状態 | 変化 |
|------|------|
| Disabled（ファイルなし） | 背景 `--color-border` / テキスト `--color-text-tertiary` / cursor: not-allowed |
| Default | `--color-accent` / cursor: pointer |
| Hover | `--color-accent-hover` / 100ms ease |
| Active | scale(0.98) / 100ms ease |
| Converting | ボタンがプログレスバーに変形。背景が左→右へ `--color-accent` で充填 |
| Complete | 背景 → `--color-success` / テキスト → 「✓ 変換完了」/ 300ms ease |

**プログレスバー（変換中状態）:**

```
┌═══════════════════════░░░░░░░░░░░░░┐
│  変換中... 67%            2/3 ファイル │
└════════════════════════════════════─┘
```

| 項目 | 仕様 |
|------|------|
| 構造 | ボタン自体がプログレスバーに変形（追加UIなし） |
| 進捗バー背景 | `--color-accent-light` |
| 進捗バー充填 | `--color-accent` / 左→右 |
| テキスト左 | 「変換中... 67%」13px / `--color-text-primary` |
| テキスト右 | 「2/3 ファイル」12px / `--color-text-secondary` |
| アニメーション | 進捗はスムーズ遷移（200ms ease）。DDPの「進捗が呼吸する」を体現 |

### 5.5 Download Area（ダウンロードエリア）

変換完了後に出現。DDPの「余白が解放され、ダウンロードが浮上する」状態。

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   ✓ 3 ファイルの変換が完了しました                                │
│                                                              │
│   quarterly-report.pdf      2.1 MB     [ダウンロード]          │
│   invoice-2024.pdf          780 KB     [ダウンロード]          │
│   data-summary.pdf          950 KB     [ダウンロード]          │
│                                                              │
│   ┌──────────────────────────────────────────────────┐       │
│   │         すべてダウンロード（ZIP / 3.8 MB）          │       │
│   └──────────────────────────────────────────────────┘       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

| 項目 | 仕様 |
|------|------|
| コンテナ | 背景 `--color-success-light` / ボーダー 1px solid `--color-success` の 20%透過 / `--radius-md` |
| 完了メッセージ | 15px / SemiBold / `--color-text-primary`。✓アイコン付き |
| 個別ファイル行 | 48px高。ファイル名 + サイズ + ダウンロードリンク |
| 個別ダウンロード | テキストリンク。`--color-accent` / underline on hover |
| ZIP一括ダウンロード | **セカンダリボタン**。アウトラインスタイル。幅100% / 48px高 / `--color-accent` ボーダー / ラベルにZIPサイズ表示 |
| 出現アニメーション | opacity 0→1 + translateY(8px→0) / 300ms ease。DDPの「解放」を体現 |

**ダウンロード後:**
- 個別: クリック後にリンクテキストが「✓ ダウンロード済み」に変化（`--color-text-tertiary`）
- ZIP: ボタンテキストが「✓ ダウンロード済み」に変化

### 5.6 Footer

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   よくある質問                                                │
│                                                             │
│   ▸ 対応ファイル形式は？                                       │
│     .xlsx、.xls、.csv に対応しています。                        │
│                                                             │
│   ▸ ファイルはサーバーに保存されますか？                           │
│     いいえ。変換処理はブラウザ上で完結し、                         │
│     ファイルがサーバーに送信されることはありません。                  │
│                                                             │
│   ▸ 一度に何ファイルまで変換できますか？                           │
│     制限はありません。ただし、大量のファイルを処理する場合           │
│     はブラウザのメモリに依存します。                               │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│   © 2026 Excel to PDF Converter                             │
│   プライバシーポリシー ・ 利用規約                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

| 項目 | 仕様 |
|------|------|
| 上マージン | `--space-10` (128px)。メインコンテンツとの十分な距離 |
| 区切り線 | 1px solid `--color-border` |
| FAQ見出し | 18px / SemiBold / `--color-text-primary` |
| FAQ項目 | アコーディオン形式。▸ マーカー付き。13px / `--color-text-primary` |
| FAQ回答 | 13px / `--color-text-secondary` / 行間1.7 |
| 著作権表示 | 12px / `--color-text-tertiary` |
| リンク | 12px / `--color-text-secondary` / underline on hover |
| FAQ項目数 | 3-5件。DDPの「一度だけ静かに伝え、あとは設計で体現する」に従い、セキュリティ説明は1回だけ |

---

## 6. State Design（状態設計）

DDPの核心: 「Empty（開放的）→ Loading（凝縮）→ Complete（解放）→ Error（静寂の中の一声）」

### 6.1 Empty State（初期状態）

```
最大の余白。ドロップゾーンが静かに待つ。

┌─────────────────────────────────────────────┐
│  [Logo]  Excel to PDF                       │
│                                             │
│                                             │
│                                             │
│                                             │
│         ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐           │
│         │                       │           │
│         │    ↑                   │           │
│         │    ファイルをドラッグ     │           │
│         │    &ドロップ            │           │
│         │                       │           │
│         └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘           │
│                                             │
│                                             │
│                                             │
│                                             │
└─────────────────────────────────────────────┘
```

- ドロップゾーンが画面の垂直中央に近い位置に配置
- 変換ボタン・テーブル・ダウンロードエリアは非表示
- ページ全体が「受容」の姿勢

### 6.2 Files Added State（ファイル追加後）

```
余白が収まり、構造が現れる。

┌─────────────────────────────────────────────┐
│  [Logo]  Excel to PDF                       │
│                                             │
│         ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐           │
│         │  ↑ ファイルを追加       │           │  ← 縮小（120px高）
│         └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘           │
│                                             │
│         ┌───────────────────────┐           │
│         │  ファイル一覧テーブル    │           │
│         │  3 ファイル / 4.4 MB   │           │
│         └───────────────────────┘           │
│                                             │
│         [ PDF に変換する (3) ]               │  ← プライマリCTA出現
│                                             │
└─────────────────────────────────────────────┘
```

- ドロップゾーンが縮小アニメーション（300ms ease）
- テーブルが下からフェードイン（200ms ease）
- 変換ボタンが出現

### 6.3 Converting State（変換中）

```
余白が凝縮し、進捗が呼吸する。

┌─────────────────────────────────────────────┐
│  [Logo]  Excel to PDF                       │
│                                             │
│         ┌───────────────────────┐           │
│         │  ファイル一覧テーブル    │           │
│         │  ステータス列が更新     │           │
│         └───────────────────────┘           │
│                                             │
│         ┌═══════════════░░░░░░░░┐           │
│         │ 変換中... 67%  2/3     │           │  ← ボタンがプログレスに変形
│         └══════════════════════─┘           │
│                                             │
└─────────────────────────────────────────────┘
```

- ドロップゾーンが非表示（ファイル追加不可の状態を明示）
- テーブルのステータス列がリアルタイム更新
- 変換ボタンがプログレスバーに変形（300ms ease）
- **ユーザーはこの画面を離れない。単一画面で完結。**

### 6.4 Complete State（完了）

```
余白が解放され、ダウンロードが浮上する。

┌─────────────────────────────────────────────┐
│  [Logo]  Excel to PDF                       │
│                                             │
│         ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐           │
│         │  ↑ 新しいファイルを変換  │           │  ← ドロップゾーン復活（次の変換を受容）
│         └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘           │
│                                             │
│         ┌───────────────────────┐           │
│         │  ✓ 3 ファイル変換完了   │           │
│         │                       │           │
│         │  各ファイル + DLリンク  │           │
│         │                       │           │
│         │  [すべてダウンロード]    │           │
│         └───────────────────────┘           │
│                                             │
└─────────────────────────────────────────────┘
```

- ダウンロードエリアがフェードイン（300ms ease）
- ドロップゾーンが復活（新しい変換を開始可能）
- 変換ボタンは非表示（ダウンロードCTAに切り替わる）

### 6.5 Error State（エラー）

DDPの指示: 「静寂の中の一声。最小限の色変化で伝える。」

- テーブル内の該当行のステータスが `--color-error` + ×アイコン + 「変換失敗」
- テーブル下に1行のエラーメッセージ: 「1 ファイルの変換に失敗しました。ファイル形式を確認してください。」
- エラーメッセージ: 13px / `--color-error` / 背景 `--color-error-light` / パディング `--space-3` / `--radius-sm`
- **モーダルやアラートは使わない**。インラインで静かに伝える
- 成功したファイルは正常にダウンロード可能（部分成功を許容）

---

## 7. Animation & Transition

DDPの指示: 「過剰なアニメーション（速さの演出として逆効果）」を避ける。「速度が静寂として顕れる」。

### 7.1 アニメーション定数

```css
:root {
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-decelerate: cubic-bezier(0, 0, 0.2, 1);
  --duration-fast:   100ms;
  --duration-normal: 200ms;
  --duration-slow:   300ms;
}
```

### 7.2 アニメーション一覧

| トリガー | アニメーション | Duration | Easing |
|---------|-------------|----------|--------|
| ボタンホバー | 背景色変化 | 100ms | standard |
| ボタン押下 | scale(0.98) | 100ms | standard |
| ドラッグオーバー | ボーダー色 + 背景色 + 影 | 200ms | standard |
| テーブル出現 | opacity 0→1 + translateY(8→0) | 200ms | decelerate |
| ドロップゾーン縮小 | height変化 | 300ms | decelerate |
| プログレスバー充填 | width変化 | 200ms | standard |
| ボタン→プログレス変形 | 背景色 + テキスト変化 | 300ms | standard |
| ダウンロードエリア出現 | opacity 0→1 + translateY(8→0) | 300ms | decelerate |
| エラー表示 | opacity 0→1 | 200ms | standard |
| 削除行アニメーション | opacity 1→0 + height→0 | 200ms | standard |

### 7.3 reduced-motion 対応（必須）

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. Accessibility

### 8.1 必須実装チェックリスト

```
□ コントラスト比 4.5:1 以上（通常テキスト）/ 3:1 以上（大テキスト・UI部品）
□ キーボードのみで全機能が操作可能（Tab / Enter / Space / Escape）
□ フォーカスインジケーター: 2px solid --color-accent のアウトライン（常に視認可能）
□ ドロップゾーン: <input type="file"> を内包。キーボード・スクリーンリーダーでアクセス可能
□ ファイル削除ボタン: aria-label="[ファイル名] を削除"
□ プログレスバー: role="progressbar" aria-valuenow aria-valuemin aria-valuemax
□ ステータス更新: role="status" のライブリージョンで変換進捗を通知
□ エラー表示: role="alert" で即座にスクリーンリーダーに通知
□ 色以外の手段で状態を伝達（アイコン + テキスト）
□ 全画像に alt 属性（装飾アイコンは alt=""）
□ セマンティック HTML: <header> <main> <footer> <table> <button>
□ スキップリンク: 「メインコンテンツへ」
□ @media (prefers-reduced-motion: reduce) 対応
□ @media (prefers-color-scheme: dark) 対応
□ ズーム 200% でレイアウト崩壊しない
□ タッチターゲット: 最低 44×44px
```

### 8.2 ドロップゾーンのアクセシビリティ実装

```html
<div
  role="region"
  aria-label="ファイルアップロード"
  tabindex="0"
  class="drop-zone"
>
  <input
    type="file"
    id="file-input"
    multiple
    accept=".xlsx,.xls,.csv"
    class="sr-only"
    aria-describedby="file-hint"
  />
  <label for="file-input">
    <span class="drop-zone__icon" aria-hidden="true">↑</span>
    <span class="drop-zone__text">ファイルをここにドラッグ&ドロップ</span>
    <span class="drop-zone__sub">または クリックして選択</span>
  </label>
  <p id="file-hint" class="drop-zone__hint">.xlsx .xls .csv</p>
</div>
```

---

## 9. frontend_constraints（Layer 3 への制約フラグ）

```yaml
frontend_constraints:
  # フォント上書き: SaaS/ユーティリティツールのためシステムフォント許容
  font_override_allowed: true

  # グリッドブレイク: Structure/Flow = 2（厳格な構造）のため禁止
  grid_breaking_allowed: false

  # アニメーション予算
  animation_budget: "feedback:100-200ms / transition:200-400ms"

  # アクセシビリティフロア
  accessibility_floor: "WCAG 2.2 AA"

  # 追加制約（DDP由来）
  additional:
    - "グラデーション禁止（DDPの視覚的制約）"
    - "グラスモーフィズム禁止（ツールの透明性を曇らせる）"
    - "装飾的イラスト禁止（リアリティを損なう）"
    - "複数ステップウィザード禁止（単一画面で完結）"
    - "色数: モノクローム + 単一アクセント（Blue-600）+ セマンティック3色のみ"
    - "書体ウェイト: 400と600の2種のみ"
    - "影の使用は最小限（ドラッグ操作フィードバック時のみ強調）"
```

---

## 10. Design Token Summary

### CSS Custom Properties 一覧

```css
:root {
  /* ── Color ── */
  --color-bg:               #FAFAFA;
  --color-surface:          #FFFFFF;
  --color-surface-hover:    #F5F5F5;
  --color-text-primary:     #171717;
  --color-text-secondary:   #737373;
  --color-text-tertiary:    #A3A3A3;
  --color-border:           #E5E5E5;
  --color-border-strong:    #D4D4D4;
  --color-accent:           #2563EB;
  --color-accent-hover:     #1D4ED8;
  --color-accent-light:     #EFF6FF;
  --color-accent-subtle:    #DBEAFE;
  --color-success:          #16A34A;
  --color-success-light:    #F0FDF4;
  --color-error:            #DC2626;
  --color-error-light:      #FEF2F2;
  --color-warning:          #D97706;

  /* ── Typography ── */
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans JP",
               "Hiragino Sans", "Hiragino Kaku Gothic ProN", Meiryo, sans-serif;
  --font-mono: "SF Mono", "Cascadia Code", "Noto Sans Mono", Consolas, monospace;

  /* ── Spacing ── */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  24px;
  --space-6:  32px;
  --space-7:  48px;
  --space-8:  64px;
  --space-9:  96px;
  --space-10: 128px;

  /* ── Radius ── */
  --radius-sm:  6px;
  --radius-md:  10px;
  --radius-lg:  14px;

  /* ── Shadow ── */
  --shadow-sm:   0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md:   0 2px 8px rgba(0, 0, 0, 0.06);
  --shadow-drag: 0 4px 16px rgba(0, 0, 0, 0.08);

  /* ── Animation ── */
  --ease-standard:  cubic-bezier(0.4, 0, 0.2, 1);
  --ease-decelerate: cubic-bezier(0, 0, 0.2, 1);
  --duration-fast:   100ms;
  --duration-normal: 200ms;
  --duration-slow:   300ms;
}
```

---

## Pipeline Status

```
ma-no-kozo (Layer 1)  →  web-uiux-design (Layer 2b)  →  frontend-design (Layer 3)
     ✅ DDP完了               ✅ 本仕様完了                  Next
  哲学+方向性              レイアウト・トークン・基準        視覚演出・実装

To proceed: invoke `frontend-design` with this spec + DDP to generate the actual HTML/CSS/JS implementation.
```
