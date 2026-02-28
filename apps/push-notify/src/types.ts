export type Priority = 'low' | 'normal' | 'high' | 'urgent';

export interface PushNotification {
  id: string;
  title: string;
  message: string;
  priority: Priority;
  timestamp: string;
  read: boolean;
  url?: string;
}

export interface UsageInfo {
  monthKey: string; // "2026-02" format
  count: number;
}

export const FREE_LIMIT = 10;

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; icon: string }> = {
  low: { label: '低', color: '#78909C', icon: 'remove-circle-outline' },
  normal: { label: '通常', color: '#42A5F5', icon: 'notifications-outline' },
  high: { label: '高', color: '#FFA726', icon: 'alert-circle-outline' },
  urgent: { label: '緊急', color: '#EF5350', icon: 'warning-outline' },
};
