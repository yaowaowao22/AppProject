import * as ExpoHaptics from 'expo-haptics';

// ══════════════════════════════════════════════
// 無音の演算 — Haptics wrapper
// Global flag until settingsStore is wired up.
// Replace `hapticsEnabled` access with store selector when ready:
//   import { useSettingsStore } from '../store/settingsStore';
//   const enabled = useSettingsStore.getState().haptics;
// ══════════════════════════════════════════════

let hapticsEnabled = true;

/** Toggle haptic feedback globally. Called by SettingsStore when wired. */
export function setHapticsEnabled(value: boolean): void {
  hapticsEnabled = value;
}

/** Light impact — standard button tap. */
export async function tap(): Promise<void> {
  if (!hapticsEnabled) return;
  await ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
}

/** Success notification — after successful calculation or voice parse. */
export async function success(): Promise<void> {
  if (!hapticsEnabled) return;
  await ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success);
}

/** Error notification — on invalid expression or voice recognition failure. */
export async function error(): Promise<void> {
  if (!hapticsEnabled) return;
  await ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Error);
}
