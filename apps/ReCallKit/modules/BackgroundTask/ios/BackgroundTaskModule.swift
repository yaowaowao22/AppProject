import ExpoModulesCore
import UIKit

/// UIApplication.beginBackgroundTask をラップし、
/// バックグラウンド移行後も推論処理を継続させるためのモジュール。
///
/// iOS はバックグラウンドタスクが登録されている間、アプリを一時停止しない。
/// システムが許可する時間（通常 30 秒程度）を使い切ると
/// expiration handler が呼ばれ、タスクが自動終了される。
public class BackgroundTaskModule: Module {
  // key (String) → UIBackgroundTaskIdentifier
  // メインスレッドでのみアクセスすること
  private var activeTasks: [String: UIBackgroundTaskIdentifier] = [:]

  public func definition() -> ModuleDefinition {
    Name("BackgroundTask")

    // バックグラウンドタスクを開始する。
    // 戻り値: タスクキー文字列（endBackgroundTask に渡す）
    // 取得失敗時: 空文字列
    AsyncFunction("beginBackgroundTask") { (taskName: String, promise: Promise) in
      DispatchQueue.main.async { [weak self] in
        guard let self else { promise.resolve(""); return }

        var identifier = UIBackgroundTaskIdentifier.invalid
        identifier = UIApplication.shared.beginBackgroundTask(withName: taskName) {
          // Expiration handler: システムが時間切れと判断
          // → タスクを終了してアプリが強制終了されないようにする
          DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            let key = String(identifier.rawValue)
            self.activeTasks.removeValue(forKey: key)
          }
          UIApplication.shared.endBackgroundTask(identifier)
        }

        if identifier == .invalid {
          promise.resolve("")
          return
        }

        let key = String(identifier.rawValue)
        self.activeTasks[key] = identifier
        promise.resolve(key)
      }
    }

    // バックグラウンドタスクを終了する（解析完了時に必ず呼ぶこと）
    Function("endBackgroundTask") { (key: String) in
      DispatchQueue.main.async { [weak self] in
        guard let self else { return }
        guard let identifier = self.activeTasks[key] else { return }
        self.activeTasks.removeValue(forKey: key)
        UIApplication.shared.endBackgroundTask(identifier)
      }
    }

    // 残りバックグラウンド実行時間（秒）を返す。デバッグ・ログ用
    Function("backgroundTimeRemaining") { () -> Double in
      // UIApplication.shared はメインスレッド推奨だが、
      // backgroundTimeRemaining の読み取りは任意スレッドから安全
      return UIApplication.shared.backgroundTimeRemaining
    }
  }
}
