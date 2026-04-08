import WidgetKit
import SwiftUI

private let appGroupId = "group.com.massapp.recallkit"
private let deepLinkReview = "recallkit://review"

// MARK: - Data Models

struct QuizItem {
    let question: String
    let answer: String
}

// MARK: - Timeline Entry

struct ReviewEntry: TimelineEntry {
    let date: Date
    let reviewCount: Int
    let streak: Int
    let totalItems: Int
    let quizItem: QuizItem?
}

// MARK: - Timeline Provider

struct ReviewProvider: TimelineProvider {
    func placeholder(in context: Context) -> ReviewEntry {
        ReviewEntry(date: Date(), reviewCount: 5, streak: 7, totalItems: 42, quizItem: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (ReviewEntry) -> Void) {
        completion(loadEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<ReviewEntry>) -> Void) {
        let entry = loadEntry()
        // 30分後に再取得（Q&A更新頻度向上）
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date()
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }

    private func loadEntry() -> ReviewEntry {
        let defaults = UserDefaults(suiteName: appGroupId)
        let quizItem = loadRandomQuizItem(from: defaults)
        return ReviewEntry(
            date: Date(),
            reviewCount: defaults?.integer(forKey: "todayReviewCount") ?? 0,
            streak: defaults?.integer(forKey: "currentStreak") ?? 0,
            totalItems: defaults?.integer(forKey: "totalItems") ?? 0,
            quizItem: quizItem
        )
    }

    private func loadRandomQuizItem(from defaults: UserDefaults?) -> QuizItem? {
        guard
            let jsonString = defaults?.string(forKey: "quizItems"),
            let data = jsonString.data(using: .utf8),
            let array = try? JSONSerialization.jsonObject(with: data) as? [[String: String]],
            !array.isEmpty
        else { return nil }

        let item = array.randomElement()
        guard
            let question = item?["question"], !question.isEmpty,
            let answer = item?["answer"]
        else { return nil }

        return QuizItem(question: question, answer: answer)
    }
}

// MARK: - Small Widget View

struct SmallWidgetView: View {
    let entry: ReviewEntry
    private let accent = Color(red: 0.40, green: 0.50, blue: 1.00)

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // ヘッダー
            HStack(spacing: 4) {
                Image(systemName: "brain.head.profile")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(accent)
                Text("ReCallKit")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(.secondary)
            }

            Spacer()

            if let quiz = entry.quizItem {
                // Q&Aモード
                VStack(alignment: .leading, spacing: 6) {
                    HStack(alignment: .top, spacing: 4) {
                        Text("Q")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(accent)
                        Text(quiz.question)
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(.primary)
                            .lineLimit(2)
                    }
                    HStack(alignment: .top, spacing: 4) {
                        Text("A")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(accent)
                        Text(quiz.answer)
                            .font(.system(size: 12, weight: .regular))
                            .foregroundColor(.secondary)
                            .lineLimit(2)
                    }
                }
            } else {
                // 復習カウントモード
                Text("\(entry.reviewCount)")
                    .font(.system(size: 42, weight: .bold, design: .rounded))
                    .foregroundColor(accent)
                    .minimumScaleFactor(0.6)
                Text("件の復習")
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
            }

            Spacer()

            // ストリーク
            if entry.streak > 0 {
                HStack(spacing: 3) {
                    Image(systemName: "flame.fill")
                        .font(.system(size: 11))
                        .foregroundColor(.orange)
                    Text("\(entry.streak)日連続")
                        .font(.system(size: 11))
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }
}

// MARK: - Medium Widget View

struct MediumWidgetView: View {
    let entry: ReviewEntry
    private let accent = Color(red: 0.40, green: 0.50, blue: 1.00)

    var body: some View {
        HStack(spacing: 0) {
            // 左カラム: Q&A または復習カウント
            VStack(alignment: .leading, spacing: 0) {
                HStack(spacing: 4) {
                    Image(systemName: "brain.head.profile")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(accent)
                    Text("ReCallKit")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(.secondary)
                }

                Spacer()

                if let quiz = entry.quizItem {
                    // Q&Aモード
                    VStack(alignment: .leading, spacing: 8) {
                        HStack(alignment: .top, spacing: 5) {
                            Text("Q")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundColor(accent)
                            Text(quiz.question)
                                .font(.system(size: 13, weight: .medium))
                                .foregroundColor(.primary)
                                .lineLimit(3)
                        }
                        HStack(alignment: .top, spacing: 5) {
                            Text("A")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundColor(accent)
                            Text(quiz.answer)
                                .font(.system(size: 12, weight: .regular))
                                .foregroundColor(.secondary)
                                .lineLimit(3)
                        }
                    }
                } else {
                    Text("\(entry.reviewCount)")
                        .font(.system(size: 46, weight: .bold, design: .rounded))
                        .foregroundColor(accent)
                        .minimumScaleFactor(0.5)
                    Text("件の復習待ち")
                        .font(.system(size: 12))
                        .foregroundColor(.secondary)
                }
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)

            // 区切り線
            Rectangle()
                .fill(Color.secondary.opacity(0.2))
                .frame(width: 0.5)
                .padding(.vertical, 16)

            // 右カラム: ストリーク + 総数
            VStack(spacing: 16) {
                VStack(spacing: 3) {
                    HStack(spacing: 4) {
                        Image(systemName: "flame.fill")
                            .foregroundColor(.orange)
                            .font(.system(size: 16))
                        Text("\(entry.streak)")
                            .font(.system(size: 22, weight: .bold, design: .rounded))
                    }
                    Text("連続日数")
                        .font(.system(size: 11))
                        .foregroundColor(.secondary)
                }

                VStack(spacing: 3) {
                    Text("\(entry.totalItems)")
                        .font(.system(size: 22, weight: .bold, design: .rounded))
                        .foregroundColor(accent)
                    Text("総アイテム")
                        .font(.system(size: 11))
                        .foregroundColor(.secondary)
                }
            }
            .frame(width: 90)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Widget Entry View

struct ReCallWidgetEntryView: View {
    var entry: ReviewProvider.Entry
    @Environment(\.widgetFamily) var widgetFamily

    var body: some View {
        switch widgetFamily {
        case .systemMedium:
            MediumWidgetView(entry: entry)
                .widgetURL(URL(string: deepLinkReview))
        default:
            SmallWidgetView(entry: entry)
                .widgetURL(URL(string: deepLinkReview))
        }
    }
}

// MARK: - iOS 16/17 互換ヘルパー

private extension View {
    /// iOS 17+ では containerBackground を適用、iOS 16 ではそのまま返す
    @ViewBuilder
    func widgetBackground() -> some View {
        if #available(iOSApplicationExtension 17.0, *) {
            self.containerBackground(.fill.tertiary, for: .widget)
        } else {
            self
        }
    }
}

// MARK: - Widget Configuration

struct ReCallWidget: Widget {
    let kind: String = "ReCallWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: ReviewProvider()) { entry in
            ReCallWidgetEntryView(entry: entry)
                .widgetBackground()
        }
        .configurationDisplayName("ReCallKit 復習")
        .description("今日の復習件数とストリークを確認できます")
        .supportedFamilies([.systemSmall, .systemMedium])
        .contentMarginsDisabled()
    }
}

// ============================================================
// MARK: - Flashcard Peek Widget
// パッシブ復習: 次の復習カードを穴埋めヒントで常時表示
// ============================================================

// MARK: - Peek Data Models

struct PeekItem {
    let id: Int
    let question: String
    let hintAnswer: String
}

// MARK: - Peek Timeline Entry

struct FlashcardPeekEntry: TimelineEntry {
    let date: Date
    let items: [PeekItem]
    let isEmpty: Bool
}

// MARK: - Peek Design Tokens

private enum PeekTokens {
    // Light
    static let bg = Color.white
    static let textQ = Color(red: 0x20/255, green: 0x21/255, blue: 0x24/255)          // #202124
    static let textA = Color(red: 0x9A/255, green: 0xA0/255, blue: 0xA6/255)          // #9AA0A6
    static let separator = Color(red: 0xF3/255, green: 0xF4/255, blue: 0xF6/255)      // #F3F4F6

    // Dark
    static let darkBg1 = Color(red: 0x1A/255, green: 0x1A/255, blue: 0x2E/255)        // #1A1A2E
    static let darkBg2 = Color(red: 0x16/255, green: 0x21/255, blue: 0x3E/255)        // #16213E
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
    static let mediumPadH: CGFloat = 20
    static let mediumPadV: CGFloat = 18
    static let largePadH: CGFloat = 18
    static let largePadV: CGFloat = 14
    static let separatorHeight: CGFloat = 1
    static let fadeHeight: CGFloat = 40
}

// MARK: - Peek Timeline Provider

struct FlashcardPeekProvider: TimelineProvider {
    func placeholder(in context: Context) -> FlashcardPeekEntry {
        FlashcardPeekEntry(
            date: Date(),
            items: [PeekItem(id: 0, question: "質問がここに表示されます", hintAnswer: "______は______上で...")],
            isEmpty: false
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (FlashcardPeekEntry) -> Void) {
        let allItems = loadAllPeekItems()
        let shuffled = allItems.shuffled()
        completion(FlashcardPeekEntry(
            date: Date(),
            items: Array(shuffled.prefix(5)),
            isEmpty: shuffled.isEmpty
        ))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<FlashcardPeekEntry>) -> Void) {
        let allItems = loadAllPeekItems()
        guard !allItems.isEmpty else {
            let entry = FlashcardPeekEntry(date: Date(), items: [], isEmpty: true)
            let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date()
            completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
            return
        }

        // 15分間隔×8エントリ（2時間分）を生成。毎回シャッフルで異なるQ&Aを表示
        var entries: [FlashcardPeekEntry] = []
        let now = Date()
        for i in 0..<8 {
            let entryDate = Calendar.current.date(byAdding: .minute, value: 15 * i, to: now) ?? now
            let shuffled = allItems.shuffled()
            entries.append(FlashcardPeekEntry(
                date: entryDate,
                items: Array(shuffled.prefix(5)),
                isEmpty: false
            ))
        }

        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 2, to: now) ?? now
        completion(Timeline(entries: entries, policy: .after(nextUpdate)))
    }

    private func loadAllPeekItems() -> [PeekItem] {
        let defaults = UserDefaults(suiteName: appGroupId)
        guard
            let jsonString = defaults?.string(forKey: "flashcardPeekItems"),
            let data = jsonString.data(using: .utf8),
            let array = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]],
            !array.isEmpty
        else { return [] }

        return array.compactMap { dict in
            guard let id = dict["id"] as? Int,
                  let question = dict["question"] as? String,
                  let hintAnswer = dict["hintAnswer"] as? String
            else { return nil }
            return PeekItem(id: id, question: question, hintAnswer: hintAnswer)
        }
    }
}

// MARK: - Peek Small View (170×170pt)

struct FlashcardPeekSmallView: View {
    let entry: FlashcardPeekEntry
    @Environment(\.colorScheme) var colorScheme

    private var isDark: Bool { colorScheme == .dark }
    private var qColor: Color { isDark ? PeekTokens.darkTextQ : PeekTokens.textQ }
    private var aColor: Color { isDark ? PeekTokens.darkTextA : PeekTokens.textA }
    private var sepColor: Color { isDark ? PeekTokens.darkSep : PeekTokens.separator }

    var body: some View {
        if entry.isEmpty {
            emptyView
        } else {
            cardView
        }
    }

    private var cardView: some View {
        let item = entry.items.first!
        return VStack(alignment: .leading, spacing: 0) {
            Text(item.question)
                .font(PeekTokens.qSmall)
                .foregroundColor(qColor)
                .lineLimit(3)

            Rectangle()
                .fill(sepColor)
                .frame(height: PeekTokens.separatorHeight)
                .padding(.vertical, 10)

            Text(item.hintAnswer)
                .font(PeekTokens.aSmall)
                .foregroundColor(aColor)
                .lineLimit(3)
        }
        .padding(PeekTokens.smallPad)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }

    private var emptyView: some View {
        VStack(spacing: 6) {
            Image(systemName: "checkmark.circle")
                .font(.system(size: 28))
                .foregroundColor(.green)
            Text("復習待ちなし")
                .font(.system(size: 12))
                .foregroundColor(aColor)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Peek Medium View (364×170pt)

struct FlashcardPeekMediumView: View {
    let entry: FlashcardPeekEntry
    @Environment(\.colorScheme) var colorScheme

    private var isDark: Bool { colorScheme == .dark }
    private var qColor: Color { isDark ? PeekTokens.darkTextQ : PeekTokens.textQ }
    private var aColor: Color { isDark ? PeekTokens.darkTextA : PeekTokens.textA }
    private var sepColor: Color { isDark ? PeekTokens.darkSep : PeekTokens.separator }

    var body: some View {
        if entry.isEmpty {
            emptyView
        } else {
            cardView
        }
    }

    private var cardView: some View {
        let item = entry.items.first!
        return VStack(alignment: .leading, spacing: 0) {
            Text(item.question)
                .font(PeekTokens.qMedium)
                .foregroundColor(qColor)
                .lineLimit(2)

            Rectangle()
                .fill(sepColor)
                .frame(height: PeekTokens.separatorHeight)
                .padding(.vertical, 10)

            Text(item.hintAnswer)
                .font(PeekTokens.aMedium)
                .foregroundColor(aColor)
                .lineLimit(3)
        }
        .padding(.horizontal, PeekTokens.mediumPadH)
        .padding(.vertical, PeekTokens.mediumPadV)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }

    private var emptyView: some View {
        VStack(spacing: 6) {
            Image(systemName: "checkmark.circle")
                .font(.system(size: 32))
                .foregroundColor(.green)
            Text("復習待ちなし")
                .font(.system(size: 13))
                .foregroundColor(aColor)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Peek Large View (364×382pt)

struct FlashcardPeekLargeView: View {
    let entry: FlashcardPeekEntry
    @Environment(\.colorScheme) var colorScheme

    private var isDark: Bool { colorScheme == .dark }
    private var qColor: Color { isDark ? PeekTokens.darkTextQ : PeekTokens.textQ }
    private var aColor: Color { isDark ? PeekTokens.darkTextA : PeekTokens.textA }
    private var sepColor: Color { isDark ? PeekTokens.darkSep : PeekTokens.separator }
    private var fadeTo: Color { isDark ? PeekTokens.darkBg1 : .white }

    var body: some View {
        if entry.isEmpty {
            emptyView
        } else {
            listView
        }
    }

    private var listView: some View {
        ZStack(alignment: .bottom) {
            VStack(alignment: .leading, spacing: 0) {
                ForEach(Array(entry.items.prefix(5).enumerated()), id: \.element.id) { index, item in
                    VStack(alignment: .leading, spacing: 4) {
                        Text(item.question)
                            .font(PeekTokens.qLarge)
                            .foregroundColor(qColor)
                            .lineLimit(1)
                        Text(item.hintAnswer)
                            .font(PeekTokens.aLarge)
                            .foregroundColor(aColor)
                            .lineLimit(2)
                    }
                    .opacity(index == 4 ? 0.4 : 1.0)
                    .padding(.horizontal, PeekTokens.largePadH)
                    .padding(.vertical, PeekTokens.largePadV)

                    if index < min(entry.items.count, 5) - 1 {
                        Rectangle()
                            .fill(sepColor)
                            .frame(height: PeekTokens.separatorHeight)
                            .padding(.horizontal, PeekTokens.largePadH)
                    }
                }
                Spacer(minLength: 0)
            }

            // 下部フェードグラデーション
            LinearGradient(
                gradient: Gradient(colors: [.clear, fadeTo]),
                startPoint: .top,
                endPoint: .bottom
            )
            .frame(height: PeekTokens.fadeHeight)
            .allowsHitTesting(false)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }

    private var emptyView: some View {
        VStack(spacing: 8) {
            Image(systemName: "checkmark.circle")
                .font(.system(size: 36))
                .foregroundColor(.green)
            Text("復習待ちなし")
                .font(.system(size: 14))
                .foregroundColor(aColor)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Peek Entry View (ファミリー切替)

struct FlashcardPeekEntryView: View {
    var entry: FlashcardPeekProvider.Entry
    @Environment(\.widgetFamily) var widgetFamily
    @Environment(\.colorScheme) var colorScheme

    private var isDark: Bool { colorScheme == .dark }

    var body: some View {
        Group {
            switch widgetFamily {
            case .systemMedium:
                FlashcardPeekMediumView(entry: entry)
            case .systemLarge:
                FlashcardPeekLargeView(entry: entry)
            default:
                FlashcardPeekSmallView(entry: entry)
            }
        }
        .widgetURL(URL(string: entry.isEmpty ? deepLinkReview : "recallkit://review?itemId=\(entry.items.first?.id ?? 0)"))
    }
}

// MARK: - Flashcard Peek Widget Configuration

struct FlashcardPeekWidget: Widget {
    let kind: String = "FlashcardPeekWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: FlashcardPeekProvider()) { entry in
            FlashcardPeekEntryView(entry: entry)
                .peekWidgetBackground()
        }
        .configurationDisplayName("Flashcard Peek")
        .description("次の復習カードを穴埋めヒントで常時表示")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
        .contentMarginsDisabled()
    }
}

/// Flashcard Peek 用背景（ダークモードはグラデーション）
private extension View {
    @ViewBuilder
    func peekWidgetBackground() -> some View {
        if #available(iOSApplicationExtension 17.0, *) {
            self.containerBackground(for: .widget) {
                PeekBackgroundView()
            }
        } else {
            ZStack {
                PeekBackgroundView()
                self
            }
        }
    }
}

private struct PeekBackgroundView: View {
    @Environment(\.colorScheme) var colorScheme
    var body: some View {
        if colorScheme == .dark {
            LinearGradient(
                gradient: Gradient(colors: [PeekTokens.darkBg1, PeekTokens.darkBg2]),
                startPoint: UnitPoint(x: 0, y: 0),
                endPoint: UnitPoint(x: 1, y: 1)
            )
        } else {
            PeekTokens.bg
        }
    }
}

// MARK: - Widget Bundle（既存 + Flashcard Peek）

@main
struct ReCallWidgetBundle: WidgetBundle {
    var body: some Widget {
        ReCallWidget()
        FlashcardPeekWidget()
    }
}

// MARK: - Preview（iOS 16 互換 PreviewProvider）

#if DEBUG

// 既存ウィジェットのプレビュー
struct ReCallWidget_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            ReCallWidgetEntryView(
                entry: ReviewEntry(
                    date: .now,
                    reviewCount: 8,
                    streak: 14,
                    totalItems: 56,
                    quizItem: QuizItem(
                        question: "SFAとCRMの違いは何ですか？",
                        answer: "SFAは営業活動の自動化、CRMは顧客関係全般の管理に特化"
                    )
                )
            )
            .previewContext(WidgetPreviewContext(family: .systemSmall))
            .previewDisplayName("Small – Q&Aあり")

            ReCallWidgetEntryView(
                entry: ReviewEntry(date: .now, reviewCount: 8, streak: 14, totalItems: 56, quizItem: nil)
            )
            .previewContext(WidgetPreviewContext(family: .systemSmall))
            .previewDisplayName("Small – 復習あり")

            ReCallWidgetEntryView(
                entry: ReviewEntry(date: .now, reviewCount: 0, streak: 14, totalItems: 56, quizItem: nil)
            )
            .previewContext(WidgetPreviewContext(family: .systemSmall))
            .previewDisplayName("Small – 0件")

            ReCallWidgetEntryView(
                entry: ReviewEntry(
                    date: .now,
                    reviewCount: 3,
                    streak: 14,
                    totalItems: 56,
                    quizItem: QuizItem(
                        question: "スペースドリピティションとは？",
                        answer: "忘却曲線に基づき最適なタイミングで復習を行う学習法"
                    )
                )
            )
            .previewContext(WidgetPreviewContext(family: .systemMedium))
            .previewDisplayName("Medium – Q&Aあり")
        }
    }
}

// Flashcard Peek ウィジェットのプレビュー
private let previewPeekItems: [PeekItem] = [
    PeekItem(id: 1, question: "Server Componentsとは何ですか？", hintAnswer: "______は______上でのみレンダリング"),
    PeekItem(id: 2, question: "空間的局所性の原則とは？", hintAnswer: "空間的に______に配置された..."),
    PeekItem(id: 3, question: "Suspenseの役割は？", hintAnswer: "______はユーザーに最も近い..."),
    PeekItem(id: 4, question: "useCallbackの用途は？", hintAnswer: "useCallbackは______のメモ化..."),
    PeekItem(id: 5, question: "Flexboxの基本概念は？", hintAnswer: "親______のサイズに応じた..."),
]

struct FlashcardPeek_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            FlashcardPeekEntryView(
                entry: FlashcardPeekEntry(date: .now, items: Array(previewPeekItems.prefix(1)), isEmpty: false)
            )
            .previewContext(WidgetPreviewContext(family: .systemSmall))
            .previewDisplayName("Peek Small")

            FlashcardPeekEntryView(
                entry: FlashcardPeekEntry(date: .now, items: Array(previewPeekItems.prefix(1)), isEmpty: false)
            )
            .previewContext(WidgetPreviewContext(family: .systemMedium))
            .previewDisplayName("Peek Medium")

            FlashcardPeekEntryView(
                entry: FlashcardPeekEntry(date: .now, items: previewPeekItems, isEmpty: false)
            )
            .previewContext(WidgetPreviewContext(family: .systemLarge))
            .previewDisplayName("Peek Large – 5件")

            FlashcardPeekEntryView(
                entry: FlashcardPeekEntry(date: .now, items: [], isEmpty: true)
            )
            .previewContext(WidgetPreviewContext(family: .systemSmall))
            .previewDisplayName("Peek Small – 空")
        }
    }
}

#endif
