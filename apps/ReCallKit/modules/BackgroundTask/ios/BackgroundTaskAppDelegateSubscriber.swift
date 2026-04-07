import ExpoModulesCore
import BackgroundTasks

/// BGTaskScheduler のハンドラを app 起動時に登録する AppDelegate サブスクライバ。
///
/// iOS の制約: BGTaskScheduler のハンドラ登録は applicationDidFinishLaunching の
/// 完了前に行う必要がある。Expo の AppDelegateSubscriber はこのタイミングで呼ばれる。
public class BackgroundTaskAppDelegateSubscriber: ExpoAppDelegateSubscriber {

  public func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    BGTaskScheduler.shared.register(
      forTaskWithIdentifier: kBGProcessingTaskId,
      using: nil
    ) { task in
      guard let processingTask = task as? BGProcessingTask else {
        task.setTaskCompleted(success: false)
        return
      }
      if let module = BackgroundTaskModule.shared {
        module.handleProcessingTask(processingTask)
      } else {
        // JS ブリッジがまだ起動していない場合は失敗扱いで終了
        processingTask.setTaskCompleted(success: false)
      }
    }
    return true
  }
}
