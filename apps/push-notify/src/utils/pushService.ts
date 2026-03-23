import { Platform } from 'react-native';
import { API_BASE } from '../config';

let Notifications: typeof import('expo-notifications') | null = null;
let Device: typeof import('expo-device') | null = null;

if (Platform.OS !== 'web') {
  try {
    Notifications = require('expo-notifications');
    Device = require('expo-device');
  } catch {
    // not available (web or Expo Go without native modules)
  }
}

/**
 * プッシュ通知の権限を要求し、Expo Push Token を取得する
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web' || !Notifications || !Device) {
    console.log('[Push] Web環境またはネイティブモジュール未対応 — スキップ');
    return null;
  }

  if (!Device.isDevice) {
    console.log('[Push] 実機以外ではプッシュ通知は利用できません');
    return null;
  }

  // 権限確認・リクエスト
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Push] 通知権限が拒否されました');
    return null;
  }

  // Android通知チャンネル設定
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1A237E',
    });
  }

  // Expo Push Token 取得
  const tokenResponse = await Notifications.getExpoPushTokenAsync({
    projectId: '6bb9b696-be28-40e8-a06b-dda93652e07c',
  });

  return tokenResponse.data;
}

/**
 * サーバーにデバイスを登録
 */
export async function registerDevice(apiKey: string, pushToken: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: apiKey, pushToken }),
    });
    const data = await res.json();
    return data.success === true;
  } catch (e) {
    console.log('[Push] サーバー登録失敗:', e);
    return false;
  }
}

/**
 * 通知センターに残っているプッシュ通知を取得
 */
export async function getPendingNotifications(): Promise<any[]> {
  if (!Notifications) return [];
  try {
    return await Notifications.getPresentedNotificationsAsync();
  } catch {
    return [];
  }
}

/**
 * 通知センターの通知をすべてクリア
 */
export async function dismissAllNotifications(): Promise<void> {
  if (!Notifications) return;
  try {
    await Notifications.dismissAllNotificationsAsync();
  } catch {}
}

/**
 * タップで起動した通知レスポンスを取得
 * addNotificationResponseReceivedListener を登録していない場合のみ値が返る
 */
export async function getLastNotificationResponse(): Promise<any | null> {
  if (!Notifications) return null;
  try {
    return await Notifications.getLastNotificationResponseAsync();
  } catch {
    return null;
  }
}

/**
 * Expo Notifications のリスナーを設定
 */
export function setupNotificationHandlers(
  onReceived: (notification: any) => void,
) {
  if (!Notifications) return { remove: () => {} };

  // フォアグラウンドで通知を表示する設定
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  // フォアグラウンド受信のみリスナー登録
  // タップ処理はApp.tsxのuseLastNotificationResponseフックで行う
  const receivedSub = Notifications.addNotificationReceivedListener(onReceived);

  return {
    remove: () => {
      receivedSub.remove();
    },
  };
}
