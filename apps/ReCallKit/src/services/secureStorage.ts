// ============================================================
// SecureStorage — iOS Keychain / Android Keystore 経由で
// 機微な値 (APIキー等) を保存する汎用ラッパー。
//
// プラットフォームバッキング:
//   iOS     : Keychain Services (kSecAttrAccessibleAfterFirstUnlock)
//   Android : Keystore with AES encryption
//
// プレーン SQLite app_settings とは独立したストレージ。
// アプリアンインストール時に OS 側で自動クリア。
// ============================================================
//
// FIXME: 本ファイルは `expo-secure-store` に依存します。
// package.json に `expo-secure-store: ~15.0.0` を追加済みですが、
// `npm install` (または `npx expo install expo-secure-store`) を
// 実行するまで import が解決されずビルドエラーとなります。
// インストール後は通常どおり使用できます。

import * as SecureStore from 'expo-secure-store';

/**
 * SecureStorage に保存可能なキーのユニオン型。
 * 新しいキーを追加する場合はこのユニオンに追記する。
 */
export type SecureKey = 'groq_api_key' | 'gemini_api_key';

/**
 * キー名前空間プレフィックス。
 * iOS Keychain はアクセスグループ経由で他アプリと共有される可能性があるため、
 * アプリ固有のプレフィックスを付与して衝突を避ける。
 */
const KEY_PREFIX = 'recallkit.';

/**
 * SecureStore への共通オプション。
 *  - keychainService: iOS 専用。同一プレフィックスでグルーピング。
 *  - keychainAccessible: 初回アンロック後はバックグラウンドでも読み書き可能。
 */
const SECURE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainService: 'recallkit.secure',
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

/**
 * 内部用: 外部公開キーを実ストレージキーに変換する。
 */
function toStorageKey(key: SecureKey): string {
  return `${KEY_PREFIX}${key}`;
}

/**
 * セキュアストアに値を保存する。
 *
 * 空文字列が渡された場合は「クリア」と解釈し、
 * 内部的に `deleteSecureValue` を呼び出す。
 * これにより UI 側は「空文字列 = 削除」のセマンティクスを利用できる。
 */
export async function setSecureValue(
  key: SecureKey,
  value: string
): Promise<void> {
  if (value === '') {
    await deleteSecureValue(key);
    return;
  }

  const storageKey = toStorageKey(key);
  try {
    await SecureStore.setItemAsync(storageKey, value, SECURE_OPTIONS);
    console.log(`[secureStorage] set ${storageKey} (len=${value.length})`);
  } catch (err) {
    console.warn(`[secureStorage] set failed for ${storageKey}:`, err);
    throw err;
  }
}

/**
 * セキュアストアから値を取得する。
 *
 * 値が存在しない場合・読み取り中にエラーが発生した場合は
 * 空文字列 `''` を返す。例外は外に投げない。
 * （上位レイヤーで「未設定」と「エラー」を区別する必要がないため）
 */
export async function getSecureValue(key: SecureKey): Promise<string> {
  const storageKey = toStorageKey(key);
  try {
    const value = await SecureStore.getItemAsync(storageKey, SECURE_OPTIONS);
    return value ?? '';
  } catch (err) {
    console.warn(`[secureStorage] get failed for ${storageKey}:`, err);
    return '';
  }
}

/**
 * セキュアストアから値を削除する。
 * 例外は外に投げない（削除は冪等操作として扱う）。
 */
export async function deleteSecureValue(key: SecureKey): Promise<void> {
  const storageKey = toStorageKey(key);
  try {
    await SecureStore.deleteItemAsync(storageKey, SECURE_OPTIONS);
    console.log(`[secureStorage] deleted ${storageKey}`);
  } catch (err) {
    console.warn(`[secureStorage] delete failed for ${storageKey}:`, err);
  }
}
