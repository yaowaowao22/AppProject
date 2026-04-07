// ============================================================
// useNotificationSetup
// DB 初期化完了後に呼び出す通知セットアップ hook
// - 権限リクエスト
// - Android チャンネル設定
// - 保存済み review_time で毎日リマインダーをスケジュール
//
// ⚠️ RootNavigator 内（DatabaseProvider 配下）で使用すること
// ⚠️ isReady=true かつ db が存在する場合のみ実行される
// ============================================================

import { useEffect } from 'react';
import type { SQLiteDatabase } from 'expo-sqlite';
import {
  requestNotificationPermissions,
  scheduleDailyReminder,
  setupNotificationChannel,
} from '../services/notificationService';
import { getSetting } from '../db/settingsRepository';

export function useNotificationSetup(
  db: SQLiteDatabase | null,
  isReady: boolean
): void {
  useEffect(() => {
    if (!isReady || !db) return;

    (async () => {
      try {
        // Android 8.0+ チャンネル設定（iOS では no-op）
        await setupNotificationChannel();

        // 権限リクエスト（denied の場合はスケジュールをスキップ）
        const granted = await requestNotificationPermissions();
        if (!granted) {
          console.log('[Notification] permission denied — skipping schedule');
          return;
        }

        // 通知が有効かどうかを確認（ユーザーが明示的に ON にした場合のみスケジュール）
        const notificationsEnabled = await getSetting(db, 'notifications_enabled');
        if (notificationsEnabled !== 'true') {
          console.log('[Notification] notifications_enabled=false — skipping schedule');
          return;
        }

        // DB から保存済みの通知時刻を取得
        const reviewTime = await getSetting(db, 'review_time');
        await scheduleDailyReminder(reviewTime);
      } catch (e) {
        // 通知の失敗はアプリのクリティカルパスではないため、ログのみ
        console.error('[Notification] setup error:', e);
      }
    })();
  }, [isReady, db]);
}
