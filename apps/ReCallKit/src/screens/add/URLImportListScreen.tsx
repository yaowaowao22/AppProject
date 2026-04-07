// ============================================================
// URLImportListScreen
// URL取り込みジョブ一覧 + バックグラウンド処理
// - スタートボタン押下後に遷移してくる画面
// - pending ジョブを1件ずつ自動処理（analyzeUrlPipeline → DB保存）
// - 全ジョブの進捗を一覧表示（新しい順）
// ============================================================

import React, { useState, useCallback, useEffect, useRef, useReducer } from 'react';
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
import {
  subscribeDownloadState,
  type ModelDownloadState,
} from '../../services/localAnalysisService';
import {
  listJobs,
  updateJob,
  deleteJob,
  recoverStaleJobs,
  type UrlImportJob,
} from '../../db/urlJobRepository';
import type { LibraryStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<LibraryStackParamList, 'URLImportList'>;

// ---- チャンク進捗（モジュールレベル: 画面遷移しても消えない） ----
type ChunkProgress = { jobId: number; current: number; total: number } | null;
let _chunkProgress: ChunkProgress = null;
const _chunkProgressListeners = new Set<() => void>();
function setActiveChunkProgress(p: ChunkProgress) {
  _chunkProgress = p;
  _chunkProgressListeners.forEach(fn => fn());
}

// ---- 定数 ----
const POLL_INTERVAL_MS = 2000;

// ---- ステータス表示設定 ----
const STATUS_CONFIG = {
  pending:    { label: '待機中',    iconName: 'time-outline'        as const, colorKey: 'labelTertiary' },
  processing: { label: '解析中...',  iconName: 'sync-outline'         as const, colorKey: 'accent'        },
  done:       { label: '完了',      iconName: 'checkmark-circle'     as const, colorKey: 'success'       },
  failed:     { label: '失敗',      iconName: 'alert-circle-outline' as const, colorKey: 'error'         },
};

// ---- エラー種別 ----
type ErrorType = 'no_qa' | 'config' | 'network' | 'general';

function classifyError(msg: string | null): ErrorType {
  if (!msg) return 'general';
  if (msg.includes('Q&Aを生成')) return 'no_qa';
  if (msg.includes('AWS設定') || msg.includes('設定が未完了') || msg.includes('未完了')) return 'config';
  if (
    msg.toLowerCase().includes('network') ||
    msg.includes('fetch') ||
    msg.includes('接続') ||
    msg.includes('ブロック') ||
    msg.includes('HTTP 403') ||
    msg.includes('HTTP 429') ||
    msg.includes('HTTP 5') ||
    msg.includes('ページの読み込みがタイムアウト')
  ) return 'network';
  return 'general';
}

type RecoveryAction = 'retry' | 'delete' | 'change_url' | 'open_settings';

interface ErrorRecoveryConfig {
  hint: string;
  actions: Array<{ label: string; icon: string; action: RecoveryAction; secondary?: boolean }>;
}

const ERROR_RECOVERY: Record<ErrorType, ErrorRecoveryConfig> = {
  no_qa: {
    hint: 'このURLからQ&Aを抽出できませんでした。別のURLをお試しください。',
    actions: [
      { label: 'URLを変更して試す', icon: 'link-outline', action: 'change_url' },
      { label: '削除', icon: 'trash-outline', action: 'delete', secondary: true },
    ],
  },
  config: {
    hint: 'AWS設定が未完了です。設定画面で接続情報を確認してください。',
    actions: [
      { label: '設定を開く', icon: 'settings-outline', action: 'open_settings' },
    ],
  },
  network: {
    hint: 'ネットワーク接続を確認してから再試行してください。',
    actions: [
      { label: '再試行', icon: 'refresh-outline', action: 'retry' },
    ],
  },
  general: {
    hint: '',
    actions: [
      { label: '再試行', icon: 'refresh-outline', action: 'retry' },
    ],
  },
};

// ---- ジョブ処理本体（解析→result_json保存のみ。DB保存はQAPreviewScreen側で行う） ----
async function executeJob(
  db: import('expo-sqlite').SQLiteDatabase,
  job: UrlImportJob,
  onChunkProgress?: (current: number, total: number) => void,
): Promise<void> {
  await updateJob(db, job.id, { status: 'processing' });

  try {
    const result = await analyzeUrlPipeline(job.url, onChunkProgress);

    if (result.qa_pairs.length === 0) {
      await updateJob(db, job.id, {
        status: 'failed',
        error_msg: 'Q&Aを生成できませんでした。URLを確認してください',
      });
      return;
    }

    // 解析結果をJSON保存。アイテムのDB保存はQAPreviewScreenで行う
    await updateJob(db, job.id, {
      status: 'done',
      title: result.title || job.url,
      result_json: JSON.stringify(result),
    });
  } catch (err) {
    let error_msg = '解析中にエラーが発生しました';
    if (err instanceof Error) {
      error_msg = err.message;
    } else if (typeof err === 'string' && err.length > 0) {
      error_msg = err;
    } else if (err != null) {
      // llama.rn 等のネイティブモジュールが非Errorオブジェクトをthrowするケース
      try { error_msg = JSON.stringify(err); } catch { /* ignore */ }
    }
    await updateJob(db, job.id, { status: 'failed', error_msg });
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
  borderColor,
}: {
  animValue: Animated.Value;
  skeletonBg: string;
  cardBg: string;
  borderColor: string;
}) {
  const opacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.9],
  });

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor }, CardShadow]}>
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
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  const processingRef = useRef(false);

  // モジュールレベルのチャンク進捗を購読（画面遷移後に戻っても最新値を読める）
  useEffect(() => {
    _chunkProgressListeners.add(forceUpdate);
    return () => { _chunkProgressListeners.delete(forceUpdate); };
  }, [forceUpdate]);
  const chunkProgress = _chunkProgress;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  // ---- モデルダウンロード状態（グローバル購読） ----
  const [modelDownload, setModelDownload] = useState<ModelDownloadState | null>(null);
  const modelReady = !LOCAL_AI_ENABLED || !modelDownload;

  useEffect(() => {
    if (!LOCAL_AI_ENABLED) return;
    const unsub = subscribeDownloadState(setModelDownload);
    return unsub;
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

  // マウント時に processing のまま残ったジョブを異常終了扱いに復旧
  const recoveredRef = useRef(false);
  useEffect(() => {
    if (!db || !isReady || recoveredRef.current) return;
    recoveredRef.current = true;
    recoverStaleJobs(db).then(n => {
      if (n > 0) console.warn(`[URLImportList] ${n}件の中断ジョブを異常終了に復旧`);
      loadJobs();
    });
  }, [db, isReady, loadJobs]);

  // フォーカス時に再読み込み
  useFocusEffect(useCallback(() => { loadJobs(); }, [loadJobs]));

  // ---- pending ジョブを1件ずつ処理 ----
  useEffect(() => {
    if (!db || !isReady || processingRef.current || !modelReady) return;
    const pending = jobs.find(j => j.status === 'pending');
    if (!pending) return;

    processingRef.current = true;
    executeJob(db, pending, (current, total) => {
      setActiveChunkProgress({ jobId: pending.id, current, total });
    }).finally(() => {
      processingRef.current = false;
      setActiveChunkProgress(null);
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

  // ---- 削除 ----
  const handleDelete = useCallback(async (job: UrlImportJob) => {
    if (!db) return;
    await deleteJob(db, job.id);
    await loadJobs();
  }, [db, loadJobs]);

  // ---- エラー種別アクション実行 ----
  const handleRecoveryAction = useCallback((job: UrlImportJob, action: RecoveryAction) => {
    switch (action) {
      case 'retry':
        handleRetry(job);
        break;
      case 'delete':
        handleDelete(job);
        break;
      case 'change_url':
        navigation.navigate('URLAnalysis', { initialUrl: job.url });
        break;
      case 'open_settings':
        navigation.getParent()?.navigate('Settings');
        break;
    }
  }, [handleRetry, handleDelete, navigation]);

  // ---- ジョブカードのレンダリング ----
  const renderJob = useCallback(({ item }: { item: UrlImportJob }) => {
    const cfg = STATUS_CONFIG[item.status];
    const progress = item.status === 'processing' && chunkProgress?.jobId === item.id
      ? chunkProgress
      : null;
    const statusColor = item.status === 'done'
      ? colors.success
      : item.status === 'failed'
        ? colors.error
        : item.status === 'processing'
          ? colors.accent
          : colors.labelTertiary;

    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.separator }, CardShadow]}>
        {/* ヘッダ行 */}
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
            {item.status === 'processing' ? (
              <ActivityIndicator size="small" color={statusColor} style={styles.spinner} />
            ) : (
              <Ionicons name={cfg.iconName} size={14} color={statusColor} />
            )}
            <Text style={[styles.statusLabel, { color: statusColor }]}>
              {item.status === 'processing' && progress?.current === -1 ? 'フェッチ中...' : cfg.label}
            </Text>
          </View>
          <View style={styles.cardHeaderRight}>
            <Text style={[styles.timeText, { color: colors.labelTertiary }]}>
              {relativeTime(item.created_at)}
            </Text>
            <Pressable
              onPress={() => handleDelete(item)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="削除"
            >
              <Ionicons name="trash-outline" size={14} color={colors.labelTertiary} />
            </Pressable>
          </View>
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

        {/* 解析中プログレスバー（フェッチ中=current:-1 のときは非表示） */}
        {progress && progress.current >= 0 && (
          <View style={styles.chunkProgressWrap}>
            <View style={[styles.progressTrack, { backgroundColor: statusColor + '33', flex: 1 }]}>
              <View style={[
                styles.progressFill,
                {
                  backgroundColor: statusColor,
                  width: `${Math.round(((progress.current + 1) / progress.total) * 100)}%`,
                },
              ]} />
            </View>
            <Text style={[styles.chunkLabel, { color: statusColor }]}>
              {progress.current + 1} / {progress.total}
            </Text>
          </View>
        )}

        {/* エラー詳細（種別ヒント + 原文メッセージ） */}
        {item.status === 'failed' && (() => {
          const errType = classifyError(item.error_msg);
          const recovery = ERROR_RECOVERY[errType];
          return (
            <>
              {recovery.hint ? (
                <Text style={[styles.errorHint, { color: colors.error + 'CC' }]}>
                  {recovery.hint}
                </Text>
              ) : item.error_msg ? (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {item.error_msg}
                </Text>
              ) : null}
            </>
          );
        })()}

        {/* アクションボタン行 */}
        <View style={styles.cardActions}>
          {item.status === 'done' && item.result_json != null && (
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                { borderColor: colors.separator, backgroundColor: 'transparent', opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={() => {
                const result = JSON.parse(item.result_json!);
                navigation.navigate('QAPreview', {
                  url: item.url,
                  title: result.title ?? item.url,
                  summary: result.summary ?? '',
                  qa_pairs: result.qa_pairs,
                  category: result.category ?? 'その他',
                });
              }}
              accessibilityRole="button"
              accessibilityLabel="プレビュー"
            >
              <Ionicons name="eye-outline" size={14} color={colors.label} />
              <Text style={[styles.actionButtonText, { color: colors.label }]}>プレビュー</Text>
            </Pressable>
          )}
          {/* 旧フロー互換: item_idのみある場合はライブラリで見るを表示 */}
          {item.status === 'done' && item.result_json == null && item.item_id != null && (
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
          {item.status === 'failed' && (() => {
            const errType = classifyError(item.error_msg);
            const { actions } = ERROR_RECOVERY[errType];
            return actions.map(({ label, icon, action, secondary }) => {
              const btnColor = secondary ? colors.labelSecondary : colors.error;
              return (
                <Pressable
                  key={action}
                  style={({ pressed }) => [
                    styles.actionButton,
                    { borderColor: btnColor, backgroundColor: btnColor + '14', opacity: pressed ? 0.7 : 1 },
                  ]}
                  onPress={() => handleRecoveryAction(item, action)}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                >
                  <Ionicons name={icon as any} size={14} color={btnColor} />
                  <Text style={[styles.actionButtonText, { color: btnColor }]}>{label}</Text>
                </Pressable>
              );
            });
          })()}
        </View>
      </View>
    );
  }, [colors, navigation, chunkProgress, handleRetry, handleRecoveryAction]);

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
            borderColor={colors.separator}
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
          URLを解析して知識カードを作りましょう
        </Text>
        <Pressable
          style={[styles.ctaButton, { backgroundColor: colors.accent }]}
          onPress={() => navigation.navigate('URLAnalysis', {})}
        >
          <Text style={styles.ctaButtonText}>URLを解析する</Text>
        </Pressable>
      </View>
    );
  }

  // ---- モデルダウンロードカード（タスク一覧の先頭に表示） ----
  const renderModelCard = () => {
    if (!LOCAL_AI_ENABLED || !modelDownload) return null;
    const pct = Math.round(modelDownload.progress * 100);
    const isPaused = modelDownload.isPaused;
    const statusColor = modelDownload.error
      ? colors.error
      : isPaused ? colors.labelTertiary : colors.accent;

    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.separator }, CardShadow]}>
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
            {!isPaused && !modelDownload.error
              ? <ActivityIndicator size="small" color={statusColor} style={styles.spinner} />
              : <Ionicons name={modelDownload.error ? 'alert-circle-outline' : 'pause-circle-outline'} size={14} color={statusColor} />
            }
            <Text style={[styles.statusLabel, { color: statusColor }]}>
              {modelDownload.error ? 'エラー' : isPaused ? '一時停止' : 'インストール中'}
            </Text>
          </View>
          <Text style={[styles.timeText, { color: colors.labelTertiary }]}>AIモデル</Text>
        </View>

        <Text style={[styles.titleText, { color: colors.label }]}>
          {modelDownload.modelName}
        </Text>

        {modelDownload.error ? (
          <Text style={[styles.errorText, { color: colors.error }]}>{modelDownload.error}</Text>
        ) : (
          <>
            <View style={[styles.progressTrack, { backgroundColor: colors.labelTertiary + '33' }]}>
              <View style={[styles.progressFill, { backgroundColor: statusColor, width: pct > 0 ? `${pct}%` : '2%' }]} />
            </View>
            <Text style={[styles.urlText, { color: colors.labelTertiary }]}>
              {isPaused
                ? `一時停止中 — ${modelDownload.bytesWrittenMB} / ${modelDownload.totalMB} MB`
                : `${modelDownload.bytesWrittenMB} / ${modelDownload.totalMB} MB`}
            </Text>
          </>
        )}
      </View>
    );
  };

  return (
    <FlatList
      style={{ backgroundColor: colors.backgroundGrouped }}
      contentContainerStyle={[
        styles.list,
        { paddingBottom: Math.max(insets.bottom, Spacing.xl) },
      ]}
      ListHeaderComponent={renderModelCard}
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
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.m,
    gap: Spacing.s,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
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
  errorHint: {
    ...TypeScale.caption1,
    lineHeight: 16,
    fontStyle: 'italic' as const,
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

  // ---- 解析中プログレスバー ----
  chunkProgressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
    marginTop: 2,
  },
  chunkLabel: {
    ...TypeScale.caption2,
    fontWeight: '600',
    minWidth: 32,
    textAlign: 'right',
  },

  // ---- インストールカード進捗バー ----
  progressTrack: {
    height: 4,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginTop: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.full,
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
  ctaButton: {
    marginTop: Spacing.s,
    paddingHorizontal: Spacing.l,
    paddingVertical: 10,
    borderRadius: Radius.full,
    alignSelf: 'center',
  },
  ctaButtonText: {
    ...TypeScale.subheadline,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
