/**
 * shareReceiver.ts
 *
 * OS共有シート / ディープリンク経由でURLとテキストを受信し、
 * itemsテーブルへ即時保存するサービス。
 *
 * 対応スキーム:
 *   recallkit://share?url=<encoded-url>
 *   recallkit://share?text=<encoded-text>
 *
 * 将来的なネイティブ Share Extension 対応時は、
 * このファイルの saveSharedItem を再利用してください。
 */

import { Alert, Linking } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { SQLiteDatabase } from 'expo-sqlite';

// ============================================================
// 公開型定義
// ============================================================

export type SharedDataType = 'url' | 'text';

export interface SharedData {
  type: SharedDataType;
  content: string;
}

// ============================================================
// 内部ユーティリティ
// ============================================================

/**
 * recallkit://share?url=... または recallkit://share?text=...
 * を解析して SharedData を返す。該当しない場合は null。
 */
function parseShareUrl(rawUrl: string): SharedData | null {
  if (!rawUrl.startsWith('recallkit://share')) return null;

  try {
    const qIdx = rawUrl.indexOf('?');
    if (qIdx === -1) return null;

    const params = new URLSearchParams(rawUrl.slice(qIdx + 1));

    const sharedUrl = params.get('url');
    if (sharedUrl) return { type: 'url', content: sharedUrl };

    const text = params.get('text');
    if (text) return { type: 'text', content: text };

    return null;
  } catch {
    return null;
  }
}

/** URLからホスト名を取得する（仮タイトル用） */
function extractHostname(url: string): string {
  try {
    return new URL(url).hostname || url.slice(0, 50);
  } catch {
    return url.slice(0, 50);
  }
}

// ============================================================
// 保存ロジック
// ============================================================

/**
 * SharedData を items + reviews テーブルへ保存する。
 *
 * Stage 3 で urlMetadataService.ts が実装されたら、
 * type === 'url' の場合にバックグラウンドでメタデータを取得して
 * title / excerpt を更新する処理をここに追加する。
 *
 * 例:
 *   // enrichUrlItem(db, result.lastInsertRowId, data.content).catch(() => {});
 */
async function saveSharedItem(db: SQLiteDatabase, data: SharedData): Promise<void> {
  let title: string;
  let content: string;
  let sourceUrl: string | null = null;

  if (data.type === 'url') {
    sourceUrl = data.content;
    title = extractHostname(data.content);
    content = data.content;
  } else {
    // テキスト: 先頭30文字をタイトルに
    title = data.content.length > 30
      ? data.content.slice(0, 30) + '…'
      : data.content;
    content = data.content;
  }

  const result = await db.runAsync(
    `INSERT INTO items (type, title, content, source_url, created_at, updated_at, archived)
     VALUES (?, ?, ?, ?, datetime('now','localtime'), datetime('now','localtime'), 0)`,
    [data.type, title, content, sourceUrl]
  );

  // SM-2 復習スケジュールを即座に作成
  await db.runAsync(
    `INSERT INTO reviews (item_id, repetitions, easiness_factor, interval_days, next_review_at, quality_history)
     VALUES (?, 0, 2.5, 0, datetime('now','localtime'), '[]')`,
    [result.lastInsertRowId]
  );
}

// ============================================================
// 公開 API
// ============================================================

/**
 * ディープリンク受信リスナーを初期化する。
 *
 * @param db 初期化済みの SQLiteDatabase
 * @returns クリーンアップ関数（useEffect の return に渡すこと）
 */
export function initShareReceiver(db: SQLiteDatabase): () => void {
  const handle = async (url: string): Promise<void> => {
    const data = parseShareUrl(url);
    if (!data) return;

    try {
      await saveSharedItem(db, data);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const message = data.type === 'url' ? 'URLを保存しました' : 'テキストを保存しました';
      Alert.alert('保存しました', message);
    } catch (err) {
      console.error('[shareReceiver] 保存エラー:', err);
      Alert.alert('エラー', '保存に失敗しました');
    }
  };

  // アプリが共有リンクで起動されたケース（コールドスタート）
  Linking.getInitialURL().then((url) => {
    if (url) {
      handle(url).catch((err) => {
        console.error('[shareReceiver] コールドスタート処理エラー:', err);
      });
    }
  }).catch((err) => {
    console.warn('[shareReceiver] getInitialURL エラー:', err);
  });

  // アプリ起動中に受信したケース（ウォームスタート）
  const subscription = Linking.addEventListener('url', ({ url }) => {
    handle(url).catch((err) => {
      console.error('[shareReceiver] ウォームスタート処理エラー:', err);
    });
  });

  return () => subscription.remove();
}
