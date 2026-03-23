import { Platform } from 'react-native';

const SECURE_KEY = 'push_api_key_secure';

/**
 * expo-secure-store が利用可能かチェック（ネイティブモジュールが必要）
 */
function getSecureStore(): typeof import('expo-secure-store') | null {
  if (Platform.OS === 'web') return null;
  try {
    const mod = require('expo-secure-store');
    // ネイティブモジュールが実際に存在するか確認
    if (!mod || typeof mod.getItemAsync !== 'function') return null;
    return mod;
  } catch {
    return null;
  }
}

/**
 * iOS Keychain / Android Keystore からAPIキーを取得
 */
export async function getSecureApiKey(): Promise<string | null> {
  const store = getSecureStore();
  if (!store) return null;
  try {
    return await store.getItemAsync(SECURE_KEY);
  } catch {
    return null;
  }
}

/**
 * iOS Keychain / Android Keystore にAPIキーを保存
 */
export async function setSecureApiKey(key: string): Promise<void> {
  const store = getSecureStore();
  if (!store) return;
  try {
    await store.setItemAsync(SECURE_KEY, key);
  } catch {
    // native module not available
  }
}
