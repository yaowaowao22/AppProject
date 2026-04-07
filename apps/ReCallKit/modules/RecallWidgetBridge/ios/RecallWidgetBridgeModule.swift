import ExpoModulesCore
import WidgetKit

private let appGroupId = "group.com.massapp.recallkit"

public class RecallWidgetBridgeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("RecallWidgetBridge")

    // ウィジェットにデータを書き込み、タイムラインをリロード
    Function("updateWidgetData") { (reviewCount: Int, streak: Int, totalItems: Int) in
      guard let defaults = UserDefaults(suiteName: appGroupId) else { return }
      defaults.set(reviewCount, forKey: "todayReviewCount")
      defaults.set(streak,      forKey: "currentStreak")
      defaults.set(totalItems,  forKey: "totalItems")
      defaults.synchronize()

      WidgetCenter.shared.reloadAllTimelines()
    }

    // Q&Aデータを書き込み、タイムラインをリロード
    Function("updateWidgetQuizData") { (items: [[String: String]]) in
      guard let defaults = UserDefaults(suiteName: appGroupId) else { return }
      let limited = Array(items.prefix(20))
      if let data = try? JSONSerialization.data(withJSONObject: limited),
         let jsonString = String(data: data, encoding: .utf8) {
        defaults.set(jsonString, forKey: "quizItems")
        defaults.synchronize()
      }
      WidgetCenter.shared.reloadAllTimelines()
    }

    // Flashcard Peek ウィジェット用データを書き込み、タイムラインをリロード
    Function("updateFlashcardPeekData") { (items: [[String: Any]]) in
      guard let defaults = UserDefaults(suiteName: appGroupId) else { return }
      let limited = Array(items.prefix(5))
      // id を Int、question/hintAnswer を String として安全に変換
      let sanitized: [[String: Any]] = limited.compactMap { item in
        guard let id = item["id"] as? Int,
              let question = item["question"] as? String,
              let hintAnswer = item["hintAnswer"] as? String
        else { return nil }
        return ["id": id, "question": question, "hintAnswer": hintAnswer]
      }
      if let data = try? JSONSerialization.data(withJSONObject: sanitized),
         let jsonString = String(data: data, encoding: .utf8) {
        defaults.set(jsonString, forKey: "flashcardPeekItems")
        defaults.synchronize()
      }
      WidgetCenter.shared.reloadAllTimelines()
    }
  }
}
