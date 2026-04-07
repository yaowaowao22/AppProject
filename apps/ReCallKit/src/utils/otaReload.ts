import { DeviceEventEmitter } from 'react-native';

export const OTA_RELOAD_EVENT = 'OTA_RELOAD_REQUESTED';

/** どこからでも呼べるOTA安全reload要求。App.tsxがアンマウント後にreloadAsync()を実行する。 */
export function requestOtaReload() {
  DeviceEventEmitter.emit(OTA_RELOAD_EVENT);
}
