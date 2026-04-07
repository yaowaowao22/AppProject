# HomeScreen モックアップ差分チェックリスト

> 比較対象: `prompts/home-mockup.html` (data-screen="home") vs 現行実装
> 作成日: 2026-04-07

---

## セクション順序

| # | モック (`home-mockup.html`) | 現行 `HomeScreen.tsx` | 差分 |
|---|---|---|---|
| 1 | DateRow（青丸 + 曜日 + due件数サブテキスト） | FilterBadge（条件付き） | ❌ DateRow 未使用、FilterBadge はモック外 |
| 2 | インライン hr 区切り（1px border） | HeroCard（3状態インライン） | ❌ 区切り要素なし |
| 3 | ReviewIllust（amber gradient + SVG） | StatsRow | ❌ イラストエリア未実装 |
| 4 | ReviewBody（タイトル/メタ/overdue/ボタン） | ShortcutList（2×2グリッド） | ❌ 順序・レイアウト相違 |
| 5 | section-gap（8px tint区切り） | 週間アクティビティ | ❌ section-gap なし |
| 6 | Stats（3列） | CategoryMasteryBar | ❌ 順序逆転 |
| 7 | sep（1px区切り） | Recently Added | ❌ sep なし、順序逆転 |
| 8 | 週間アクティビティ | —（なし） | — |
| 9 | section-gap | — | — |
| 10 | Recently Added | — | — |
| 11 | sep（margin-top:20px） | — | — |
| 12 | Mastery | — | — |
| 13 | sep | — | — |
| 14 | Shortcuts（リスト形式） | — | — |

---

## コンポーネント別差分

### DateRow（日付ヘッダー）

| 項目 | モック | 現行 (`DateRow.tsx`) |
|---|---|---|
| 配置 | HomeScreen 最上部（ヘッダー直下） | **HomeScreen で未使用**（ファイルは存在） |
| 日付表示 | 青丸46px（数字のみ） | "4月 7日" テキスト |
| 曜日 | "Mon"（英語 uppercase、青色） | 曜日ピル（accent=amber色、日本語1文字） |
| サブテキスト | "8件の復習が待っています"（due件数を含む） | "今日"（固定文字列、due件数なし） |
| 色 | `--blue` (#1A73E8) | `colors.accent`（amber系） |

**変更必要:**
- [ ] `DateRow` を HomeScreen に組み込む（現在未使用）
- [ ] 日付表示を「青丸＋数字」または現行テキスト形式で統一を決定
- [ ] サブテキストに due 件数を動的に渡す（`subtitle={dueCount > 0 ? \`${dueCount}件の復習が待っています\` : '今日'}`）
- [ ] 曜日を英語(Mon/Tue)表示にするか日本語維持か決定

---

### ReviewHero（復習CTA）

| 項目 | モック | 現行 (`HomeScreen.tsx` インライン) |
|---|---|---|
| イラストエリア | あり（高さ140px、amber gradient `#FFF8E1→#FFE082` + SVG散乱） | **なし** |
| ヒーローカード背景 | なし（review-body は白カード） | `colors.card`（角丸カード） |
| 件数表示スタイル | "今日の復習 **8件**"（タイトルテキスト、件数のみbold） | 件数数字 52px フォント（巨大数字スタイル） |
| メタ情報行 | "推定 4分 · Programming, Design"（時間 + カテゴリ） | **なし** |
| Overdue 表示 | 赤テキスト "期限切れ 3件"（独立行） | オレンジ pill（行内）+ ヒントテキスト |
| CTAボタン色 | `--blue` (#1A73E8) | `colors.accent`（amber）/ overdueなら orange |
| ボタンテキスト | "復習を始める" | "今すぐ復習" |
| 全完了状態 | モックに記述なし | ✅アイコン + "本日分完了！" + "追加学習を始める" ボタン |
| 空状態 | モックに記述なし | sparkles icon + "ようこそ！" + URLから追加ボタン |

**変更必要:**
- [ ] `.review-illust` に相当するイラストエリア（amber gradient背景）を追加
- [ ] 件数表示を "今日の復習 **N件**" 形式（タイトルテキスト）に変更
- [ ] 推定時間（件数 × 0.5min など）とカテゴリ名のメタ行を追加
- [ ] overdue 表示を赤テキスト独立行に変更（現行はオレンジ pill）
- [ ] CTAボタン色を blue に統一するか accent 維持か決定
- [ ] ボタンテキスト "今すぐ復習" → "復習を始める" に変更
- [ ] `ReviewCTACard.tsx`（別ファイルに存在）との統合または廃止を決定

---

### StatsRow（統計行）

| 項目 | モック | 現行 (`StatsRow.tsx`) |
|---|---|---|
| 列1 | "12 日連続"（streak） | "連続日数" |
| 列2 | **"38 習得済み"**（masteredCount） | **"今日完了"**（todayCompleted） |
| 列3 | "124 カード"（総数） | "総アイテム" |
| ラベル語順 | 数値 + ラベル（日連続） | ラベルのみ下段 |
| 区切り | `sep`（1px border）の後 | ヒーローカードの後（gap:Spacing.m） |

**変更必要:**
- [ ] 列2: "今日完了" → "習得済み"（masteredCount）に変更するか要確認
  - ⚠️ 意味が根本的に異なる（今日の復習数 vs 習得済み総数）
- [ ] "日連続" → "連続日数" などラベル統一
- [ ] "総アイテム" → "カード" に変更するか確認

---

### WeeklyActivity（週間アクティビティ）

| 項目 | モック | 現行 (`HomeScreen.tsx` インライン) |
|---|---|---|
| セクションラベル | "This Week"（英語 uppercase） | "今週のアクティビティ"（日本語） |
| 曜日ラベル位置 | **上**（ドットより上に表示） | **下**（ドットより下に表示） |
| 曜日ラベル言語 | 英語（Mon/Tue/Wed...） | 日本語（月/火/水...） |
| ドット状態 | done=薄青(#E8F0FE)+check icon / strong=青(#1A73E8)+check icon | intensity(0-3)でopacity変化、accent色（amber） |
| Today ドット | `border:2px solid var(--blue)` + "Today"ラベル | `border:2px solid colors.accent` |
| Today ラベル | "Today"（英語、青色） | 曜日1文字（例"月"、accent色） |
| count表示 | なし（done/undone の2値） | ドット内に数字（9+） |
| 週サマリー行 | あり（"今週 **5/7日** | 42枚 復習済み"） | **なし** |

**変更必要:**
- [ ] 曜日ラベルをドットの**上**に移動（現在は下）
- [ ] ドット色を blue系（done/strong の2値）に変更 or amber intensity維持か決定
- [ ] 週サマリー行（"今週 N/7日 | N枚 復習済み"）を追加

---

### Recently Added（最近追加）

| 項目 | モック | 現行 (`HomeScreen.tsx` インライン) |
|---|---|---|
| セクションラベル | "Recently Added"（英語 uppercase） | "最近追加"（日本語） |
| カード幅 | **220px** | **144px** |
| カードトップ | カテゴリドット（色付き●6px）+ カテゴリ名 | アイコン（link/document、28px 丸） |
| 質問テキスト | 14px、3行クランプ | caption1（小さめ）、3行クランプ |
| フッター | 相対時間（"2時間前"、"昨日"） | カテゴリ名（accent）+ 絶対日付（MM/DD） |
| カード高さ | 自動（コンテンツ依存） | minHeight:120 |

**変更必要:**
- [ ] カード幅: 144px → 220px に拡大
- [ ] カードトップにカテゴリカラードット（色分け）を追加
- [ ] アイコンウィジェットをカテゴリドット形式に変更 or 両立か決定
- [ ] 時間表示を相対形式（"N時間前"、"昨日"）に変更
  - `formatDistanceToNow` などのライブラリ導入が必要

---

### Mastery（カテゴリ習熟度）

| 項目 | モック | 現行 (`CategoryMasteryBar.tsx`) |
|---|---|---|
| セクションラベル | "Mastery"（英語 uppercase） | "カテゴリ別習熟度"（日本語） |
| バー色 | **カテゴリ固有色**（blue/amber/green） | accent（amber）or green（80%以上） |
| バー幅 | 80px（固定幅） | `width: \`${pct}%\`` の相対幅 |
| パーセント表示 | "68%"（数値のみ） | "68% 習熟"（テキスト付き） |
| due バッジ | **なし** | あり（N件期限） |
| masteredCount/itemCount 表示 | **なし** | あり（N/N形式） |
| 行間区切り | `border-top:1px solid var(--tint)` | `StyleSheet.hairlineWidth` |

**変更必要:**
- [ ] バー色をカテゴリ固有色（category index で色を割り当て）に対応するか決定
- [ ] "N% 習熟" → "N%" のみに簡略化するか確認
- [ ] バーを固定幅(80px)にするか相対幅維持か決定

---

### Shortcuts（クイックアクション）

| 項目 | モック | 現行 (`ShortcutList.tsx`) |
|---|---|---|
| レイアウト | **縦リスト形式**（1列、icon+テキスト+chevron） | **2×2 グリッド形式** |
| アイテム数 | 2件のみ | 4件 |
| 項目1 | "URLから学習カードを作成"（サブ: "AIがQ&Aを自動生成します"） | "URLから追加"（サブなし） |
| 項目2 | "手動でカードを作成" | "ライブラリ"（モックにない） |
| 余剰項目 | — | "復習を始める"、"ナレッジマップ"（モックにない） |
| chevron | あり（各行末尾） | **なし** |
| サブテキスト | あり（"AIがQ&Aを自動生成します"） | **なし** |

**変更必要:**
- [ ] レイアウトを2×2グリッド → 縦リスト形式に変更
- [ ] chevron を各行末尾に追加
- [ ] サブテキストを追加（"AIがQ&Aを自動生成します"）
- [ ] 項目を整理：モック準拠なら "URLから追加"・"手動でカード作成" の2件のみ
- [ ] 余剰項目（ライブラリ、ナレッジマップ、復習）の扱いを決定

---

## セクション区切り要素

| 位置 | モック | 現行 | 対応 |
|---|---|---|---|
| DateRow直後 | `height:1px; background:var(--border); margin:0 16px`（インラインhr） | なし | ❌ 追加必要 |
| ReviewBody直後 | `section-gap`（height:8px, background:var(--tint)）| `gap:Spacing.m` のみ | ❌ tint色の太め区切りに変更 |
| Stats直後 | `sep`（height:1px, background:var(--border), margin:0 16px）| なし | ❌ 追加必要 |
| WeeklyActivity直後 | `section-gap` | なし | ❌ 追加必要 |
| Recently Added直後 | `sep`（margin-top:20px） | なし | ❌ 追加必要 |
| Mastery直後 | `sep` | なし | ❌ 追加必要 |

---

## 欠損要素（モックにあって現行にない）

| 要素 | モック | 現行 | 優先度 |
|---|---|---|---|
| `DateRow` の実使用 | ✅ 最上部に配置 | ファイル存在するが HomeScreen 未使用 | 高 |
| ReviewIllust | amber gradient 背景 + SVG イラスト（140px） | なし | 中 |
| 推定時間・カテゴリ表示 | "推定 4分 · Programming, Design" | なし | 中 |
| 週サマリー行 | "今週 5/7日 \| 42枚 復習済み" | なし | 中 |
| カテゴリカラードット（rcard） | 色付き●6px + カテゴリ名 | なし | 中 |
| 相対時間表示 | "2時間前"、"昨日" | なし（絶対日付 MM/DD） | 低 |
| Shortcut サブテキスト | "AIがQ&Aを自動生成します" | なし | 低 |
| Shortcut chevron | 各行末尾 › | なし | 低 |
| section-gap（8px tint）| Stats前・Week後 | なし | 低 |
| sep（1px border） | 複数箇所 | なし | 低 |

---

## 余剰要素（現行にあってモックにない）

| 要素 | 現行 | モック | 判断 |
|---|---|---|---|
| FilterBadge（フィルター解除バッジ）| HomeScreen 最上部 | なし | 機能として維持 or 削除を検討 |
| HeroCard "due"の大数字（52px） | あり | なし（タイトルテキスト形式） | スタイル変更対象 |
| HeroCard "done"/"empty"状態 | あり（完全実装） | モックに記載なし | 維持 |
| weeklyDot 内のカウント数字 | あり（9+） | なし（done/strong の視覚のみ） | 削除 or 維持を確認 |
| CategoryMasteryBar due バッジ | あり（N件期限）| なし | 削除 or 維持を確認 |
| CategoryMasteryBar count（N/N）| あり | なし | 削除 or 維持を確認 |
| ShortcutList "ライブラリ" | あり | なし | 削除 or 維持を確認 |
| ShortcutList "ナレッジマップ" | あり | なし | 削除 or 維持を確認 |
| ReviewCTACard.tsx（未使用） | ファイル存在 | — | HomeScreen と統合 or 削除を検討 |

---

## 色・スタイル対応表

| 用途 | モック | 現行 |
|---|---|---|
| アクセント / CTA | `--blue` (#1A73E8) | `colors.accent`（amber #E8A000系） |
| 成功 / strong dot | `--green` (#1E8E3E) | `colors.success` / `SystemColors.green` |
| overdue / 期限切れ | `--red` (#D93025) | `SystemColors.orange` |
| 週間ドット done | `#E8F0FE`（薄青）| `colors.accent + '55'`（薄amber） |
| 週間ドット strong | `var(--blue)`（濃青） | `colors.accent`（amber） |
| section-gap 背景 | `--tint` (#F8F9FA) | なし（gap のみ） |

> ⚠️ モックは Google Material Design カラー（blue primary）で設計されているが、現行は amber accent 系。ブランドカラー方針の確認が必要。
