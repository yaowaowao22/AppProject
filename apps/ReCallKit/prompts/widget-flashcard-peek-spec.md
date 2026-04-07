# Widget: Flashcard Peek — Implementation Spec

## Concept
次の復習カードをiOSホーム画面に常時表示。問題と穴埋めヒントだけが目に飛び込む。パッシブ復習効果を最大化する。

## Design Principle
- 表示するのはQ(質問)とA(穴埋めヒント)のみ
- バッジ・アプリ名・CTA・カテゴリカラー・Overdue表示は一切なし
- 装飾はセパレーターライン(1px)のみ

## Layout

### Small (170×170pt)

```
┌──────────────────┐
│ Question         │ 13px, #202124, 3行clamp
│ (max 3 lines)    │
│──────────────────│ 1px #F3F4F6, margin 10px 0
│ ______は______上で│ 11px, #9AA0A6, 3行clamp
│ レンダリングされ  │
│ ______が送信...   │
└──────────────────┘
```

- Padding: 16px all
- Background: #FFFFFF
- Dark: gradient(145deg, #1A1A2E, #16213E)
  - Q: rgba(255,255,255,.9)
  - Sep: rgba(255,255,255,.08)
  - A: rgba(255,255,255,.4)

### Medium (364×170pt)

```
┌────────────────────────────────────┐
│ Question text here                 │ 15px, weight 500, #202124, 2行clamp
│ (max 2 lines)                      │
│────────────────────────────────────│ 1px #F3F4F6, margin 10px 0
│ ______は______上でのみレンダリング  │ 13px, #9AA0A6, 3行clamp
│ され、クライアントに______が送信    │
│ されない。データフェッチを...       │
└────────────────────────────────────┘
```

- Padding: 18px 20px

### Large (364×382pt)

```
┌────────────────────────────────────┐
│ Question 1                         │ 14px, weight 500, 1行clamp
│ ______は______上でのみ...          │ 12px, #9AA0A6, 2行clamp
│────────────────────────────────────│ 1px #F3F4F6
│ Question 2                         │
│ 空間的に______に配置された...       │
│────────────────────────────────────│
│ Question 3                         │
│ ______はユーザーに最も近い...       │
│────────────────────────────────────│
│ Question 4                         │
│ useCallbackは______のメモ化...      │
│────────────────────────────────────│
│ Question 5 (faded)                 │ opacity: 0.4
│ 親______のサイズに応じた...         │
│          ▽ fade gradient           │
└────────────────────────────────────┘
```

- Item padding: 14px 18px
- Bottom fade: 40px gradient(transparent → #FFF)
- 最大5件表示、5件目はフェードアウト

## Hint Generation

答えのキーワードを`______`に置換する穴埋め形式:

```typescript
function generateHint(answer: string): string {
  const parts = answer.split(/[、。,.]/).filter(Boolean);
  return parts.slice(0, 2)
    .map(p => {
      const words = p.trim().split(/\s+/);
      words.pop();
      return [...words, '______'].join(' ');
    })
    .join('、');
}
```

## Data Source

```typescript
interface WidgetData {
  question: string;   // items.title
  answer: string;     // items.content → generateHint() で穴埋め化
}
```

### Query
```sql
SELECT i.title, i.content
FROM items i
JOIN reviews r ON r.item_id = i.id
WHERE r.next_review_at <= date('now', '+1 day')
  AND i.archived = 0
ORDER BY r.next_review_at ASC
LIMIT 5  -- Large用。Small/Mediumは1件のみ使用
```

## Deep Link

```
recallkit://review?itemId={id}
```

## Timeline

- 復習完了時: `WidgetCenter.shared.reloadAllTimelines()` で即時更新
- 15分間隔: TimelineProvider で次のカードに自動切替
- 日付変更時: due items再計算

```swift
struct FlashcardPeekEntry: TimelineEntry {
    let date: Date
    let items: [PeekItem]  // max 5
    let isEmpty: Bool
}

struct PeekItem {
    let id: Int
    let question: String
    let hintAnswer: String  // 穴埋め済み
}
```

## Existing Infrastructure

- Widget Bridge: `modules/RecallWidgetBridge/`
- Hook: `useWidgetData.ts`
- Data flow: App → RecallWidgetBridgeModule → UserDefaults (App Group) → iOS Widget

## File Structure

```
ios/RecallKitWidget/
  FlashcardPeekWidget.swift       # Widget + TimelineProvider
  FlashcardPeekEntry.swift        # Entry model
  FlashcardPeekSmallView.swift    # Small
  FlashcardPeekMediumView.swift   # Medium
  FlashcardPeekLargeView.swift    # Large
  WidgetDataReader.swift          # App Group UserDefaults読み取り
```

## Design Tokens

```swift
// Light
static let bg = Color.white
static let textQ = Color(hex: "202124")
static let textA = Color(hex: "9AA0A6")
static let separator = Color(hex: "F3F4F6")

// Dark
static let darkBg1 = Color(hex: "1A1A2E")
static let darkBg2 = Color(hex: "16213E")
static let darkTextQ = Color.white.opacity(0.9)
static let darkSep = Color.white.opacity(0.08)
static let darkTextA = Color.white.opacity(0.4)

// Typography
static let qSmall: Font = .system(size: 13)
static let qMedium: Font = .system(size: 15, weight: .medium)
static let qLarge: Font = .system(size: 14, weight: .medium)
static let aSmall: Font = .system(size: 11)
static let aMedium: Font = .system(size: 13)
static let aLarge: Font = .system(size: 12)

// Layout
static let smallPad: CGFloat = 16
static let mediumPad: EdgeInsets = .init(top: 18, leading: 20, bottom: 18, trailing: 20)
static let largePad: EdgeInsets = .init(top: 14, leading: 18, bottom: 14, trailing: 18)
static let separatorHeight: CGFloat = 1
static let fadeHeight: CGFloat = 40
```
