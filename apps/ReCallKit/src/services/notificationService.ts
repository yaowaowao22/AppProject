// ============================================================
// ReCallKit notificationService
// ローカル復習リマインダーの権限取得・スケジュール・キャンセル
// ============================================================

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Android 通知チャンネル ID
const ANDROID_CHANNEL_ID = 'review-reminder';

// スケジュール済み通知の識別子（固定値で上書き可能にする）
const REMINDER_IDENTIFIER = 'daily-review-reminder';

// ============================================================
// Android チャンネル初期化（Android 8.0+ 必須）
// iOS では no-op
// ============================================================
export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: '復習リマインダー',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
  });
}

// ============================================================
// 通知権限をリクエスト
// 戻り値: granted = true / denied = false
// ============================================================
export async function requestNotificationPermissions(): Promise<boolean> {
  // ⚠️ iOS シミュレーターでは常に granted が返る（実機で再検証必須）
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  const granted = status === 'granted';
  console.log(`[Notification] permissions: ${status}`);
  return granted;
}

// ============================================================
// 毎日リマインダーをスケジュール
// review_time: "HH:MM" 形式（例: "08:00"）
// ⚠️ 既存のリマインダーを先にキャンセルしてから登録する
// ============================================================
export async function scheduleDailyReminder(reviewTime: string): Promise<void> {
  // 既存をキャンセル（同一 identifier で上書き登録してもキャンセル漏れを防ぐ）
  await cancelDailyReminder();

  const [hourStr, minuteStr] = reviewTime.split(':');
  const hour = parseInt(hourStr ?? '8', 10);
  const minute = parseInt(minuteStr ?? '0', 10);

  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_IDENTIFIER,
    content: {
      title: '復習の時間です',
      body: 'ReCallKit を開いて今日の復習をはじめましょう',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  console.log(`[Notification] daily reminder scheduled at ${hour}:${String(minute).padStart(2, '0')}`);
}

// ============================================================
// リマインダーをキャンセル
// ============================================================
export async function cancelDailyReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(REMINDER_IDENTIFIER);
  console.log('[Notification] daily reminder cancelled');
}

// ============================================================
// 現在スケジュール済みかどうかを確認（デバッグ・可視化用）
// ============================================================
export async function isDailyReminderScheduled(): Promise<boolean> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const found = scheduled.some((n) => n.identifier === REMINDER_IDENTIFIER);
  console.log(`[Notification] scheduled reminders: ${scheduled.length}, found: ${found}`);
  return found;
}
