import * as Notifications from 'expo-notifications';
import type { Subscription } from '../types';
import { getNextBillingDate } from './subscriptionUtils';

/** OS へ通知権限をリクエストし、許可されたか返す */
export async function requestPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * 全サブスクの請求リマインダーをスケジュールし直す
 * - まず既存の全通知をキャンセル
 * - 各サブスクの次回請求日から 3 日前 / 前日 9:00 に通知を登録
 * - iOS の 64 件制限に対応するため近い順に最大 60 件を登録
 */
export async function scheduleSubscriptionReminders(
  subs: Subscription[],
  notify3days: boolean,
  notify1day: boolean,
): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!notify3days && !notify1day) return;

  const now = new Date();

  // (通知日時, サブスク, 何日前) のリストを作成
  const pending: Array<{ date: Date; sub: Subscription; daysBefore: number }> = [];

  for (const sub of subs) {
    if (!sub.isActive) continue;

    const nextBilling = getNextBillingDate(sub);

    const timings: Array<{ daysBefore: number; enabled: boolean }> = [
      { daysBefore: 3, enabled: notify3days },
      { daysBefore: 1, enabled: notify1day },
    ];

    for (const { daysBefore, enabled } of timings) {
      if (!enabled) continue;

      const notifyDate = new Date(nextBilling);
      notifyDate.setDate(notifyDate.getDate() - daysBefore);
      notifyDate.setHours(9, 0, 0, 0);

      // 過去日時はスキップ
      if (notifyDate <= now) continue;

      pending.push({ date: notifyDate, sub, daysBefore });
    }
  }

  // 近い順にソートし iOS 制限（64 件）を考慮して 60 件に絞る
  pending.sort((a, b) => a.date.getTime() - b.date.getTime());
  const toSchedule = pending.slice(0, 60);

  for (const { date, sub, daysBefore } of toSchedule) {
    const body =
      daysBefore === 3
        ? `${sub.name}の請求日まで3日です（¥${sub.amount}）`
        : `${sub.name}の請求日は明日です（¥${sub.amount}）`;

    await Notifications.scheduleNotificationAsync({
      identifier: `sub-${sub.id}-${daysBefore}d`,
      content: {
        title: 'SubRadar',
        body,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date,
      },
    });
  }
}

/** 現在スケジュール済みの通知件数を返す */
export async function getScheduledCount(): Promise<number> {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  return all.length;
}
