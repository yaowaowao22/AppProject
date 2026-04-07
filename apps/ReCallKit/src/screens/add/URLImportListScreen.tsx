// ============================================================
// URLImportListScreen
// URL取り込みジョブ一覧 + バックグラウンド処理
// - スタートボタン押下後に遷移してくる画面
// - pending ジョブを1件ずつ自動処理（analyzeUrlPipeline → DB保存）
// - 全ジョブの進捗を一覧表示（新しい順）
// ============================================================

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useDatabase } from '../../hooks/useDatabase';
import { useTheme } from '../../theme/ThemeContext';
import { TypeScale } from '../../theme/typography';
import { Spacing, Radius, CardShadow } from '../../theme/spacing';
import { analyzeUrlPipeline } from '../../services/urlAnalysisPipeline';
import { LOCAL_AI_ENABLED } from '../../config/localAI';
import { isModelDownloaded, downloadModel } from '../../services/localAnalysisService';
import { getRemainingCount, consumeOne } from '../../utils/analysisLimit';
import {
  listJobs,
  updateJob,
  type UrlImportJob,
} from '../../db/urlJobRepository';
import type { LibraryStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<LibraryStackParamList, 'URLImportList'>;

// ---- 定数 ----
const POLL_INTERVAL_MS = 2000;

// ---- ステータス表示設定 ----
const STATUS_CONFIG = {
  pending:    { label: '待機中',    iconName: 'time-outline'        as const, colorKey: 'labelTertiary' },
  processing: { label: '解析中...',  iconName: 'sync-outline'         as const, colorKey: 'accent'        },
  done:       { label: '完了',      iconName: 'checkmark-circle'     as const, colorKey: 'success'       },
  failed:     { label: '失敗',      iconName: 'alert-circle-outline' as const, colorKey: 'error'         },
};

// ---- カテゴリタグ upsert ----
async function upsertTag(db: import('expo-sqlite').SQLiteDatabase, name: string): Promise<number> {
  await db.runAsync('INSERT OR IGNORE INTO tags (name) VALUES (?)', [name]);
  const row = await db.getFirstAsync<{ id: number }>('SELECT id FROM tags WHERE name = ?', [name]);
  return row!.id;
}

// ---- ジョブ処理本体 ----
async function executeJob(
  db: import('expo-sqlite').SQLiteDatabase,
  job: UrlImportJob,
): Promise<void> {
  await updateJob(db, job.id, { status: 'processing' });

  try {
    const remaining = await getRemainingCount();
    if (remaining <= 0) {
      await updateJob(db, job.id, {
        status: 'failed',
        error_msg: '本日の無料解析回数（3回）を使い切りました',
      });
      return;
    }

    const result = await analyzeUrlPipeline(job.url);
    await consumeOne();

    if (result.qa_pairs.length === 0) {
      await updateJob(db, job.id, {
        status: 'failed',
        error_msg: 'Q&Aを生成できませんでした。URLを確認してください',
      });
      return;
    }

    const catLabel = result.category?.trim() || 'その他';
    const tagId = await upsertTag(db, catLabel);

    let firstItemId: number | null = null;
    for (const qa of result.qa_pairs) {
      const res = await db.runAsync(
        `INSERT INTO items
           (type, title, content, excerpt, source_url, category, created_at, updated_at, archived)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now','localtime'), datetime('now','localtime'), 0)`,
        ['text', qa.question, qa.answer, result.summary, job.url, catLabel],
      );
      const itemId = res.lastInsertRowId;
      if (!firstItemId) firstItemId = itemId;

      await db.runAsync(
        'INSERT OR IGNORE INTO item_tags (item_id, tag_id) VALUES (?, ?)',
        [itemId, tagId],
      );
      await db.runAsync(
        `INSERT INTO reviews
           (item_id, repetitions, easiness_factor, interval_days, next_review_at, quality_history)
         VALUES (?, 0, 2.5, 0, datetime('now','localtime'), '[]')`,
        [itemId],
      );
    }

    await updateJob(db, job.id, {
      status: 'done',
      title: result.title || job.url,
      item_id: firstItemId ?? undefined,
    });
  } catch (err) {
    await updateJob(db, job.id, {
      status: 'failed',
      error_msg: err instanceof Error ? err.message : '解析に失敗しました',
    });
  }
}

// ---- 相対時刻 ----
function relativeTime(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr.replace(' ', 'T')).getTime()) / 1000);
  if (diff < 60)   return `${diff}秒前`;
  if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`;
  return `${Math.floor(diff / 86400)}日前`;
}

// ============================================================
// スケルトンカード
// ============================================================
function SkeletonCard({
  animValue,
  skeletonBg,
  cardBg,
}: {
  animValue: Animated.Value;
  skeletonBg: string;
  cardBg: string;
}) {
  const opacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.9],
  });

  return (
    <View style={[styles.card, { backgroundColor: cardBg }, CardShadow]}>
      <View style={styles.cardHeader}>
        <Animated.View style={[styles.skeletonBadge, { backgroundColor: skeletonBg, opacity }]} />
        <Animated.View style={[styles.skeletonTime,  { backgroundColor: skeletonBg, opacity }]} />
      </View>
      <Animated.View style={[styles.skeletonLineFull,  { backgroundColor: skeletonBg, opacity }]} />
      <Animated.View style={[styles.skeletonLineShort, { backgroundColor: skeletonBg, opacity }]} />
      <Animated.View style={[styles.skeletonUrl,       { backgroundColor: skeletonBg, opacity }]} />
    </View>
  );
}

// ============================================================
// コンポーネント
// ============================================================
export function URLImportListScreen({ navigation }: Props) {
  const { db, isReady } = useDatabase();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [jobs, setJobs] = useState<UrlImportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const processingRef = useRef(false);
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  // ---- モデルダウンロード状態 ----
  const [modelReady, setModelReady] = useState(!LOCAL_AI_ENABLED);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    if (!LOCAL_AI_ENABLED) return;
    (async () => {
      const downloaded = await isModelDownloaded();
      if (downloaded) { setModelReady(true); return; }
      try {
        await downloadModel((p) => setDownloadProgress(p));
        setModelReady(true);
      } catch (err) {
        setDownloadError(err instanceof Error ? err.message : 'ダウンロードに失敗しました');
      }
    })();
  }, []);

  // loading 中のみシマーアニメーションを動かす
  useEffect(() => {
    if (!loading) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [loading, shimmerAnim]);

  // ---- ジョブ一覧を DB から読み込む ----
  const loadJobs = useCallback(async () => {
    if (!db || !isReady) return;
    const rows = await listJobs(db);
    setJobs(rows);
    setLoading(false);
  }, [db, isReady]);

  // フォーカス時に再読み込み
  useFocusEffect(useCallback(() => { loadJobs(); }, [loadJobs]));

  // ---- pending ジョブを1件ずつ処理 ----
  useEffect(() => {
    if (!db || !isReady || processingRef.current || !modelReady) return;
    const pending = jobs.find(j => j.status === 'pending');
    if (!pending) return;

    processingRef.current = true;
    executeJob(db, pending).finally(() => {
      processingRef.current = false;
      loadJobs();
    });
  }, [jobs, db, isReady, loadJobs]);

  // ---- アクティブなジョブがある間はポーリング ----
  useEffect(() => {
    const hasActive = jobs.some(j => j.status === 'pending' || j.status === 'processing');
    if (!hasActive) return;
    const id = setInterval(loadJobs, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [jobs, loadJobs]);

  // ---- 再試行 ----
  const handleRetry = useCallback(async (job: UrlImportJob) => {
    if (!db) return;
    await updateJob(db, job.id, { status: 'pending', error_msg: undefined });
    await loadJobs();
  }, [db, loadJobs]);

  // ---- ジョブカードのレンダリング ----
  const renderJob = useCallback(({ item }: { item: UrlImportJob }) => {
    const cfg = STATUS_CONFIG[item.status];
    const statusColor = item.status === 'done'
      ? colors.success
      : item.status === 'failed'
        ? colors.error
        : item.status === 'processing'
          ? colors.accent
          : colors.labelTertiary;

    return (
      <View style={[styles.card, { backgroundColor: colors.card }, CardShadow]}>
        {/* ヘッダ行 */}
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
            {item.status === 'processing' ? (
              <ActivityIndicator size="small" color={statusColor} style={styles.spinner} />
            ) : (
              <Ionicons name={cfg.iconName} size={14} color={statusColor} />
            )}
            <Text style={[styles.statusLabel, { color: statusColor }]}>{cfg.label}</Text>
          </View>
          <Text style={[styles.timeText, { color: colors.labelTertiary }]}>
            {relativeTime(item.created_at)}
          </Text>
        </View>

        {/* タイトル or URL */}
        <Text
          style={[styles.titleText, { color: colors.label }]}
          numberOfLines={2}
        >
          {item.title ?? item.url}
        </Text>

        {/* URL（タイトルがある場合のみ表示） */}
        {item.title && (
          <Text style={[styles.urlText, { color: colors.labelTertiary }]} numberOfLines={1}>
            {item.url}
          </Text>
        )}

        {/* エラー詳細 */}
        {item.status === 'failed' && item.error_msg && (
          <Text style={[styles.errorText, { color: colors.error }]} numberOfLines={2}>
            {item.error_msg}
          </Text>
        )}

        {/* アクションボタン行 */}
        <View style={styles.cardActions}>
          {item.status === 'done' && item.item_id != null && (
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                { borderColor: colors.accent, backgroundColor: colors.accent + '14', opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={() => navigation.navigate('ItemDetail', { itemId: item.item_id! })}
              accessibilityRole="button"
              accessibilityLabel="ライブラリで見る"
            >
              <Ionicons name="library-outline" size={14} color={colors.accent} />
              <Text style={[styles.actionButtonText, { color: colors.accent }]}>ライブラリで見る</Text>
            </Pressable>
          )}
          {item.status === 'failed' && (
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                { borderColor: colors.error, backgroundColor: colors.error + '14', opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={() => handleRetry(item)}
              accessibilityRole="button"
              accessibilityLabel="再試行"
            >
              <Ionicons name="refresh-outline" size={14} color={colors.error} />
              <Text style={[styles.actionButtonText, { color: colors.error }]}>再試行</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }, [colors, navigation, handleRetry]);

  // ---- モデルダウンロード UI ----
  if (LOCAL_AI_ENABLED && !modelReady) {
    const pct = Math.round(downloadProgress * 100);
    const mb  = Math.round(downloadProgress * 2355); // ~2.3GB
    return (
      <View style={[styles.center, { backgroundColor: colors.backgroundGrouped }]}>
        <View style={[styles.downloadCard, { backgroundColor: colors.card }]}>
          <Ionicons name="hardware-chip-outline" size={40} color={colors.accent} />
          <Text style={[styles.downloadTitle, { color: colors.label }]}>
            AIモデルを準備中
          </Text>
          <Text style={[styles.downloadSub, { color: colors.labelSecondary }]}>
            初回のみ約2.3GBをダウンロードします{'\n'}Wi-Fi接続を推奨します
          </Text>

          {downloadError ? (
            <Text style={[styles.downloadErrorText, { color: colors.error }]}>
              {downloadError}
            </Text>
          ) : (
            <>
              {/* プログレスバー */}
              <View style={[styles.progressTrack, { backgroundColor: colors.labelTertiary + '33' }]}>
                <View
                  style={[
                    styles.progressFill,
                    { backgroundColor: colors.accent, width: `${pct}%` },
                  ]}
                />
              </View>
              <Text style={[styles.downloadPercent, { color: colors.labelSecondary }]}>
                {pct}% — {mb} MB / 2,355 MB
              </Text>
              {pct === 0 && (
                <ActivityIndicator size="small" color={colors.accent} style={{ marginTop: Spacing.s }} />
              )}
            </>
          )}
        </View>
      </View>
    );
  }

  // ---- スケルトンローディング ----
  if (loading) {
    const skeletonBg = colors.labelTertiary;
    return (
      <View style={[styles.list, { flex: 1, backgroundColor: colors.backgroundGrouped }]}>
        {[0, 1, 2].map((i) => (
          <SkeletonCard
            key={i}
            animValue={shimmerAnim}
            skeletonBg={skeletonBg}
            cardBg={colors.card}
          />
        ))}
      </View>
    );
  }

  if (jobs.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.backgroundGrouped }]}>
        <Ionicons name="cloud-download-outline" size={48} color={colors.labelTertiary} />
        <Text style={[styles.emptyTitle, { color: colors.label }]}>取り込み履歴なし</Text>
        <Text style={[styles.emptySubtitle, { color: colors.labelSecondary }]}>
          URL解析画面からURLを取り込むとここに表示されます
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.backgroundGrouped }}
      contentContainerStyle={[
        styles.list,
        { paddingBottom: Math.max(insets.bottom, Spacing.xl) },
      ]}
      data={jobs}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderJob}
      showsVerticalScrollIndicator={false}
    />
  );
}

// ============================================================
// スタイル
// ============================================================
const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.m,
    paddingHorizontal: Spacing.xl,
  },
  list: {
    padding: Spacing.m,
    gap: Spacing.m,
  },

  // ---- カード ----
  card: {
    borderRadius: Radius.m,
    padding: Spacing.m,
    gap: Spacing.s,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Radius.xs,
    paddingHorizontal: Spacing.s,
    paddingVertical: 3,
  },
  spinner: {
    width: 14,
    height: 14,
  },
  statusLabel: {
    ...TypeScale.caption2,
    fontWeight: '600',
  },
  timeText: {
    ...TypeScale.caption2,
  },
  titleText: {
    ...TypeScale.subheadline,
    fontWeight: '500',
  },
  urlText: {
    ...TypeScale.caption1,
  },
  errorText: {
    ...TypeScale.caption1,
    lineHeight: 16,
  },
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.s,
    marginTop: Spacing.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.m,
    paddingVertical: 6,
  },
  actionButtonText: {
    ...TypeScale.caption1,
    fontWeight: '600',
  },

  // ---- スケルトン ----
  skeletonBadge: {
    width: 72,
    height: 22,
    borderRadius: Radius.xs,
  },
  skeletonTime: {
    width: 44,
    height: 13,
    borderRadius: Radius.xs,
  },
  skeletonLineFull: {
    height: 16,
    borderRadius: Radius.xs,
  },
  skeletonLineShort: {
    height: 16,
    borderRadius: Radius.xs,
    width: '60%',
  },
  skeletonUrl: {
    height: 12,
    borderRadius: Radius.xs,
    width: '45%',
  },

  // ---- ダウンロード ----
  downloadCard: {
    width: '100%',
    borderRadius: Radius.l,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.m,
  },
  downloadTitle: {
    ...TypeScale.headline,
    fontWeight: '700',
    textAlign: 'center',
  },
  downloadSub: {
    ...TypeScale.subheadline,
    textAlign: 'center',
    lineHeight: 22,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  downloadPercent: {
    ...TypeScale.caption1,
  },
  downloadErrorText: {
    ...TypeScale.caption1,
    textAlign: 'center',
    lineHeight: 18,
  },

  // ---- 空状態 ----
  emptyTitle: {
    ...TypeScale.headline,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...TypeScale.subheadline,
    textAlign: 'center',
    lineHeight: 22,
  },
});
