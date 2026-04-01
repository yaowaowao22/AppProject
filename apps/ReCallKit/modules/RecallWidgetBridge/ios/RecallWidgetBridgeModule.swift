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
  }
}
