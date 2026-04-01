import WidgetKit
import SwiftUI

private let appGroupId = "group.com.massapp.recallkit"
private let deepLinkReview = "recallkit://review"

// MARK: - Timeline Entry

struct ReviewEntry: TimelineEntry {
    let date: Date
    let reviewCount: Int
    let streak: Int
    let totalItems: Int
}

// MARK: - Timeline Provider

struct ReviewProvider: TimelineProvider {
    func placeholder(in context: Context) -> ReviewEntry {
        ReviewEntry(date: Date(), reviewCount: 5, streak: 7, totalItems: 42)
    }

    func getSnapshot(in context: Context, completion: @escaping (ReviewEntry) -> Void) {
        completion(loadEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<ReviewEntry>) -> Void) {
        let entry = loadEntry()
        // 1時間後に再取得
        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: Date()) ?? Date()
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }

    private func loadEntry() -> ReviewEntry {
        let defaults = UserDefaults(suiteName: appGroupId)
        return ReviewEntry(
            date: Date(),
            reviewCount: defaults?.integer(forKey: "todayReviewCount") ?? 0,
            streak: defaults?.integer(forKey: "currentStreak") ?? 0,
            totalItems: defaults?.integer(forKey: "totalItems") ?? 0
        )
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

            // メイン数値 or 完了状態
            if entry.reviewCount > 0 {
                Text("\(entry.reviewCount)")
                    .font(.system(size: 42, weight: .bold, design: .rounded))
                    .foregroundColor(accent)
                    .minimumScaleFactor(0.6)
                Text("件の復習")
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
            } else {
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
            // 左カラム: 復習カウント
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

                if entry.reviewCount > 0 {
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

// MARK: - Widget Configuration

@main
struct ReCallWidget: Widget {
    let kind: String = "ReCallWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: ReviewProvider()) { entry in
            ReCallWidgetEntryView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("ReCallKit 復習")
        .description("今日の復習件数とストリークを確認できます")
        .supportedFamilies([.systemSmall, .systemMedium])
        .contentMarginsDisabled()
    }
}

// MARK: - Preview

#Preview(as: .systemSmall) {
    ReCallWidget()
} timeline: {
    ReviewEntry(date: .now, reviewCount: 8, streak: 14, totalItems: 56)
    ReviewEntry(date: .now, reviewCount: 0, streak: 14, totalItems: 56)
}
