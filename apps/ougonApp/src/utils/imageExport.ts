import * as MediaLibrary from 'expo-media-library';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

/**
 * 指定 URI の画像をカメラロールに保存する。
 * パーミッションが未取得の場合はリクエストし、拒否された場合はエラーをスローする。
 * @returns 保存されたアセットの URI
 */
export async function saveToGallery(uri: string): Promise<string> {
  const safeUri = uri ?? '';
  if (!safeUri) throw new Error('saveToGallery: uri が空です');

  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('メディアライブラリへのアクセスが許可されていません');
  }

  await MediaLibrary.saveToLibraryAsync(safeUri);
  return safeUri;
}

/**
 * 指定 URI の画像を 200×200 にリサイズし、documentDirectory/thumbnails/{id}.jpg に保存する。
 * @returns 保存先のローカルパス
 */
export async function saveThumbnail(uri: string, id: string): Promise<string> {
  const safeUri = uri ?? '';
  const safeId = id ?? Date.now().toString();
  if (!safeUri) throw new Error('saveThumbnail: uri が空です');

  const result = await ImageManipulator.manipulateAsync(
    safeUri,
    [{ resize: { width: 200, height: 200 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
  );

  const baseDir = FileSystem.documentDirectory ?? '';
  const thumbDir = `${baseDir}thumbnails`;
  const destPath = `${thumbDir}/${safeId}.jpg`;

  const dirInfo = await FileSystem.getInfoAsync(thumbDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(thumbDir, { intermediates: true });
  }

  await FileSystem.copyAsync({ from: result.uri, to: destPath });
  return destPath;
}

/**
 * ネイティブ共有シートを使って画像を共有する。
 * 共有機能が利用不可のデバイスではエラーをスローする。
 */
export async function shareImage(uri: string): Promise<void> {
  const safeUri = uri ?? '';
  if (!safeUri) throw new Error('shareImage: uri が空です');

  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('共有機能がこのデバイスで利用できません');
  }

  await Sharing.shareAsync(safeUri, {
    mimeType: 'image/png',
    dialogTitle: '画像を共有',
    UTI: 'public.image',
  });
}
