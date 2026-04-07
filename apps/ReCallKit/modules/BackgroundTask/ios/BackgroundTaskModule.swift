import ExpoModulesCore
import BackgroundTasks
import UIKit

let kBGProcessingTaskId = "com.massapp.recallkit.analysis"

/// UIApplication.beginBackgroundTask + BGProcessingTask をラップするモジュール。
///
/// 動作フロー:
///   1. analyzeUrlLocal 開始 → beginBackgroundTask() で即時バックグラウンド時間を確保
///   2. ~30秒後に expiration handler 発火 → BGProcessingTask をスケジュール
///   3. iOS が条件を満たしたとき BGProcessingTask を実行
///      → onProcessingTaskFired イベントを JS に送信
///   4. JS が解析を再実行し、完了後 completeProcessingTask() を呼ぶ
public class BackgroundTaskModule: Module {

  /// AppDelegateSubscriber から handleProcessingTask を呼べるようにする弱参照シングルトン
  static weak var shared: BackgroundTaskModule?

  /// UIBackgroundTask の管理（key → identifier）
  private var activeBGTasks: [String: UIBackgroundTaskIdentifier] = [:]

  /// 現在実行中の BGProcessingTask（completeProcessingTask で終了する）
  private var activeProcessingTask: BGProcessingTask?

  public func definition() -> ModuleDefinition {
    Name("BackgroundTask")

    // JS 側が addListener で購読するイベント
    Events("onProcessingTaskFired")

    OnCreate {
      BackgroundTaskModule.shared = self
    }

    // ── beginBackgroundTask ──────────────────────────────────────
    // iOS にバックグラウンド実行時間を要求する。
    // 時間切れ（expiration）時は BGProcessingTask を自動スケジュールする。
    // 戻り値: タスクキー文字列（endBackgroundTask に渡す）
    AsyncFunction("beginBackgroundTask") { (taskName: String, promise: Promise) in
      DispatchQueue.main.async { [weak self] in
        guard let self else { promise.resolve(""); return }

        var identifier = UIBackgroundTaskIdentifier.invalid
        identifier = UIApplication.shared.beginBackgroundTask(withName: taskName) { [weak self] in
          // Expiration handler: 許可時間を使い切った
          // → BGProcessingTask で続きを依頼してから終了
          self?.scheduleBGProcessingTask()
          let key = String(identifier.rawValue)
          self?.activeBGTasks.removeValue(forKey: key)
          UIApplication.shared.endBackgroundTask(identifier)
        }

        if identifier == .invalid {
          promise.resolve("")
          return
        }

        let key = String(identifier.rawValue)
        self.activeBGTasks[key] = identifier
        promise.resolve(key)
      }
    }

    // ── endBackgroundTask ────────────────────────────────────────
    // 解析完了時に呼ぶ（finally で必ず呼ぶこと）
    Function("endBackgroundTask") { (key: String) in
      DispatchQueue.main.async { [weak self] in
        guard let self,
              let identifier = self.activeBGTasks[key] else { return }
        self.activeBGTasks.removeValue(forKey: key)
        UIApplication.shared.endBackgroundTask(identifier)
      }
    }

    // ── completeProcessingTask ───────────────────────────────────
    // BGProcessingTask が発火して JS 側の処理が完了したら呼ぶ
    Function("completeProcessingTask") { (success: Bool) in
      DispatchQueue.main.async { [weak self] in
        self?.activeProcessingTask?.setTaskCompleted(success: success)
        self?.activeProcessingTask = nil
      }
    }

    // ── backgroundTimeRemaining ──────────────────────────────────
    // デバッグ・ログ用：残りバックグラウンド実行時間（秒）
    Function("backgroundTimeRemaining") { () -> Double in
      return UIApplication.shared.backgroundTimeRemaining
    }
  }

  // ── BGProcessingTask ハンドラ（AppDelegateSubscriber から呼ばれる） ──
  func handleProcessingTask(_ task: BGProcessingTask) {
    activeProcessingTask = task

    // iOS が時間切れと判断したとき → 失敗扱いで終了
    task.expirationHandler = { [weak self] in
      task.setTaskCompleted(success: false)
      self?.activeProcessingTask = nil
    }

    // JS 側のリスナー（URLImportListScreen 等）に通知
    sendEvent("onProcessingTaskFired", [:])
  }

  // ── BGProcessingTask スケジュール ──
  private func scheduleBGProcessingTask() {
    let request = BGProcessingTaskRequest(identifier: kBGProcessingTaskId)
    request.requiresNetworkConnectivity = true   // フェッチが必要
    request.requiresExternalPower = false        // 充電不要（解析は省電力でも動く）

    do {
      try BGTaskScheduler.shared.submit(request)
      print("[BackgroundTask] BGProcessingTask をスケジュールしました")
    } catch {
      print("[BackgroundTask] BGProcessingTask スケジュール失敗: \(error)")
    }
  }
}
