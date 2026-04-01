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
            } else if entry.reviewCount > 0 {
                // 復習カウントモード
                Text("\(entry.reviewCount)")
                    .font(.system(size: 42, weight: .bold, design: .rounded))
                    .foregroundColor(accent)
                    .minimumScaleFactor(0.6)
                Text("件の復習")
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
            } else {
                // 完了モード
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 34))
                    .foregroundColor(.green)
                Text("今日は完了！")
                    .font(.system(size: 12, weight: .medium))
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
                } else if entry.reviewCount > 0 {
                    Text("\(entry.reviewCount)")
                        .font(.system(size: 46, weight: .bold, design: .rounded))
                        .foregroundColor(accent)
                        .minimumScaleFactor(0.5)
                    Text("件の復習待ち")
                        .font(.system(size: 12))
                        .foregroundColor(.secondary)
                } else {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 36))
                        .foregroundColor(.green)
                    Text("今日の復習完了！")
                        .font(.system(size: 12, weight: .medium))
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

@main
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

// MARK: - Preview（iOS 16 互換 PreviewProvider）

#if DEBUG
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
            .previewDisplayName("Small – 完了")

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
#endif
