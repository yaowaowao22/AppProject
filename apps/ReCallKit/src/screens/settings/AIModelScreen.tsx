// ============================================================
// AIModelScreen
// モデルの選択・インストール・削除UI
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../theme/ThemeContext';
import { TypeScale } from '../../theme/typography';
import { Spacing, Radius, CardShadow } from '../../theme/spacing';
import { MODEL_CATALOG } from '../../config/modelCatalog';
import {
  isModelInstalled,
  installModel,
  deleteModel,
  getActiveModelId,
  setActiveModelId,
  subscribeDownloadState,
  type ModelDownloadState,
} from '../../services/localAnalysisService';
import { getDatabase } from '../../db/connection';
import { getSetting, setSetting, type LlmProvider } from '../../db/settingsRepository';
import { GROQ_MODELS, GROQ_DEFAULT_MODEL_ID, isValidGroqApiKey } from '../../config/groq';
import { LOCAL_AI_ENABLED } from '../../config/localAI';

// ============================================================
// コンポーネント
// ============================================================

export function AIModelScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [installedMap, setInstalledMap] = useState<Record<string, boolean>>({});
  const [activeModelId, setActiveModelIdState] = useState<string>('');
  const [downloadState, setDownloadState] = useState<ModelDownloadState | null>(null);

  // ── LLMプロバイダー設定 ──
  const [provider, setProvider] = useState<LlmProvider>('local');
  const [groqApiKey, setGroqApiKey] = useState<string>('');
  const [groqApiKeyDraft, setGroqApiKeyDraft] = useState<string>('');
  const [groqModel, setGroqModel] = useState<string>(GROQ_DEFAULT_MODEL_ID);
  const [showGroqKey, setShowGroqKey] = useState(false);

  // プロバイダー設定を DB から読み込む
  const loadProviderSettings = useCallback(async () => {
    const db = await getDatabase();
    const rawProvider = (await getSetting(db, 'llm_provider')).trim();
    const resolved: LlmProvider =
      rawProvider === 'local' || rawProvider === 'bedrock' || rawProvider === 'groq'
        ? rawProvider
        : LOCAL_AI_ENABLED
          ? 'local'
          : 'bedrock';
    setProvider(resolved);
    const key = await getSetting(db, 'groq_api_key');
    setGroqApiKey(key);
    setGroqApiKeyDraft(key);
    const model = (await getSetting(db, 'groq_model')).trim();
    setGroqModel(model.length > 0 ? model : GROQ_DEFAULT_MODEL_ID);
  }, []);

  // インストール状態を再読み込み
  const refreshStatus = useCallback(async () => {
    const activeId = await getActiveModelId();
    const statuses = await Promise.all(MODEL_CATALOG.map((m) => isModelInstalled(m.id)));
    setActiveModelIdState(activeId);
    const map: Record<string, boolean> = {};
    MODEL_CATALOG.forEach((m, i) => { map[m.id] = statuses[i]; });
    setInstalledMap(map);
  }, []);

  useEffect(() => {
    refreshStatus();
    loadProviderSettings();
  }, [refreshStatus, loadProviderSettings]);

  // プロバイダー切替
  const handleProviderChange = useCallback(async (next: LlmProvider) => {
    if (next === 'groq' && !isValidGroqApiKey(groqApiKey)) {
      Alert.alert(
        'Groq APIキーが未設定です',
        '下のGroq設定欄にAPIキー（gsk_...）を入力して「キーを保存」を押してから、Groqを選択してください。',
      );
      return;
    }
    const db = await getDatabase();
    await setSetting(db, 'llm_provider', next);
    setProvider(next);
  }, [groqApiKey]);

  // Groq APIキー保存
  const handleSaveGroqKey = useCallback(async () => {
    const trimmed = groqApiKeyDraft.trim();
    if (trimmed.length > 0 && !isValidGroqApiKey(trimmed)) {
      Alert.alert(
        'APIキー形式が不正です',
        'Groq の API キーは "gsk_" で始まる英数字です。コピペミスがないか確認してください。',
      );
      return;
    }
    const db = await getDatabase();
    await setSetting(db, 'groq_api_key', trimmed);
    setGroqApiKey(trimmed);
    Alert.alert('保存しました', trimmed.length > 0 ? 'Groq APIキーを保存しました' : 'Groq APIキーをクリアしました');
  }, [groqApiKeyDraft]);

  // Groq モデル切替
  const handleGroqModelChange = useCallback(async (modelId: string) => {
    const db = await getDatabase();
    await setSetting(db, 'groq_model', modelId);
    setGroqModel(modelId);
  }, []);

  // グローバルダウンロード状態を購読
  useEffect(() => {
    const unsub = subscribeDownloadState((state) => {
      setDownloadState(state);
      if (!state) refreshStatus(); // ダウンロード完了時にステータス更新
    });
    return unsub;
  }, [refreshStatus]);

  // インストールボタン
  const handleInstall = useCallback(async (modelId: string) => {
    if (downloadState && !downloadState.isPaused) {
      Alert.alert('ダウンロード中', '別のモデルをダウンロード中です。完了後に試してください。');
      return;
    }
    try {
      await installModel(modelId);
    } catch (err) {
      // downloadState.error が既にセットされていれば UI 上で表示済み → 何もしない
      // セットされていない場合のみ Alert で表示
      if (!downloadState?.error) {
        const errMsg = err instanceof Error ? err.message : 'インストールに失敗しました';
        Alert.alert('インストールエラー', errMsg);
      }
    }
  }, [downloadState]);

  // 削除ボタン
  const handleDelete = useCallback((modelId: string, modelName: string) => {
    Alert.alert(
      `${modelName}を削除`,
      'モデルファイルをデバイスから削除します。再利用するには再ダウンロードが必要です。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除', style: 'destructive',
          onPress: async () => {
            await deleteModel(modelId);
            await refreshStatus();
          },
        },
      ],
    );
  }, [refreshStatus]);

  // アクティブモデル切り替え
  const handleActivate = useCallback(async (modelId: string) => {
    await setActiveModelId(modelId);
    setActiveModelIdState(modelId);
  }, []);

  const providerOptions: { id: LlmProvider; label: string; desc: string }[] = [
    { id: 'local', label: 'ローカルAI', desc: 'デバイス内で実行（オフライン可・初回DL必要）' },
    { id: 'bedrock', label: 'AWS Bedrock', desc: 'Claude 3 Haiku（Lambda経由）' },
    { id: 'groq', label: 'Groq API', desc: 'Llama 3.3 70B（要APIキー・高速）' },
  ];

  return (
    <ScrollView
      style={{ backgroundColor: colors.backgroundGrouped }}
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + Spacing.xl }]}
    >
      {/* ── プロバイダー選択 ───────────────────────────────── */}
      <Text style={[styles.sectionHeader, { color: colors.labelTertiary }]}>
        解析プロバイダー
      </Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.separator, borderWidth: StyleSheet.hairlineWidth }, CardShadow]}>
        {providerOptions.map((opt, idx) => {
          const isSelected = provider === opt.id;
          return (
            <React.Fragment key={opt.id}>
              <Pressable
                style={({ pressed }) => [
                  styles.providerRow,
                  { opacity: pressed ? 0.6 : 1 },
                ]}
                onPress={() => handleProviderChange(opt.id)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modelName, { color: colors.label }]}>{opt.label}</Text>
                  <Text style={[styles.description, { color: colors.labelSecondary }]}>
                    {opt.desc}
                  </Text>
                </View>
                <Ionicons
                  name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                  size={22}
                  color={isSelected ? colors.accent : colors.labelTertiary}
                />
              </Pressable>
              {idx < providerOptions.length - 1 && (
                <View style={[styles.providerDivider, { backgroundColor: colors.separator }]} />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* ── Groq 詳細設定 (Groq 選択時 または APIキー未設定時に表示) ── */}
      {(provider === 'groq' || groqApiKey.length === 0) && (
        <>
          <Text style={[styles.sectionHeader, { color: colors.labelTertiary }]}>
            Groq 設定
          </Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.separator, borderWidth: StyleSheet.hairlineWidth }, CardShadow]}>
            <Text style={[styles.description, { color: colors.labelSecondary }]}>
              Groq Cloud の API キーを貼り付けてください (console.groq.com で無料作成可)。キーは端末内 SQLite に保存されます。
            </Text>

            <View style={[styles.keyInputWrap, { borderColor: colors.separator, backgroundColor: colors.backgroundGrouped }]}>
              <TextInput
                style={[styles.keyInput, { color: colors.label }]}
                placeholder="gsk_..."
                placeholderTextColor={colors.labelTertiary}
                value={groqApiKeyDraft}
                onChangeText={setGroqApiKeyDraft}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={!showGroqKey}
                spellCheck={false}
              />
              <Pressable
                onPress={() => setShowGroqKey((v) => !v)}
                style={({ pressed }) => [styles.eyeBtn, { opacity: pressed ? 0.5 : 1 }]}
                hitSlop={8}
              >
                <Ionicons
                  name={showGroqKey ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.labelSecondary}
                />
              </Pressable>
            </View>

            <View style={styles.keyButtonRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.btn,
                  { backgroundColor: colors.accent, opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={handleSaveGroqKey}
              >
                <Ionicons name="save-outline" size={15} color="#fff" />
                <Text style={styles.btnTextLight}>キーを保存</Text>
              </Pressable>
            </View>

            {/* モデルピッカー */}
            <Text style={[styles.description, { color: colors.labelSecondary, marginTop: Spacing.xs }]}>
              使用モデル
            </Text>
            <View style={styles.modelSelectWrap}>
              {GROQ_MODELS.map((m) => {
                const isActive = groqModel === m.id;
                return (
                  <Pressable
                    key={m.id}
                    style={({ pressed }) => [
                      styles.groqModelChip,
                      {
                        backgroundColor: isActive ? colors.accent + '14' : colors.backgroundGrouped,
                        borderColor: isActive ? colors.accent : colors.separator,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                    onPress={() => handleGroqModelChange(m.id)}
                  >
                    <Text
                      style={[
                        TypeScale.caption1,
                        { color: isActive ? colors.accent : colors.label, fontWeight: '600' },
                      ]}
                    >
                      {m.name}
                    </Text>
                    <Text style={[TypeScale.caption2, { color: colors.labelSecondary }]}>
                      {m.description}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </>
      )}

      <Text style={[styles.sectionHeader, { color: colors.labelTertiary }]}>
        使用モデル
      </Text>

      {MODEL_CATALOG.map((model, index) => {
        const installed = installedMap[model.id] ?? false;
        const isActive = activeModelId === model.id;
        const isDeprecated = model.deprecated === true;
        const isDownloading = downloadState?.modelId === model.id && !downloadState.isPaused;
        const isPaused = downloadState?.modelId === model.id && downloadState.isPaused;
        const hasError = downloadState?.modelId === model.id && !!downloadState.error;
        const pct = downloadState?.modelId === model.id ? Math.round(downloadState.progress * 100) : 0;
        const mb = downloadState?.modelId === model.id ? downloadState.bytesWrittenMB : 0;
        const totalMB = downloadState?.modelId === model.id ? downloadState.totalMB : Math.round(model.sizeGB * 1000);

        // 廃止 + 未インストール → 非表示
        if (isDeprecated && !installed) return null;

        return (
          <View
            key={model.id}
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: isActive ? colors.accent : colors.separator,
                borderWidth: isActive ? 1.5 : StyleSheet.hairlineWidth,
                opacity: isDeprecated ? 0.6 : 1,
              },
              CardShadow,
            ]}
          >
            {/* ヘッダー行 */}
            <View style={styles.cardHeader}>
              <View style={styles.titleRow}>
                <Text style={[styles.modelName, { color: isDeprecated ? colors.labelTertiary : colors.label }]}>
                  {model.name}
                </Text>
                <View style={[
                  styles.tag,
                  {
                    backgroundColor: isDeprecated
                      ? colors.error + '18'
                      : isActive ? colors.accent + '22' : colors.labelTertiary + '22',
                  },
                ]}>
                  <Text style={[
                    styles.tagText,
                    {
                      color: isDeprecated
                        ? colors.error
                        : isActive ? colors.accent : colors.labelTertiary,
                    },
                  ]}>
                    {isDeprecated ? '提供終了' : isActive ? '使用中' : model.tag}
                  </Text>
                </View>
              </View>
              <Text style={[styles.description, { color: colors.labelSecondary }]}>
                {model.description}
              </Text>
            </View>

            {/* 廃止メッセージ */}
            {isDeprecated && model.deprecationMessage && (
              <View style={[styles.deprecationBanner, { backgroundColor: colors.error + '0C' }]}>
                <Ionicons name="information-circle-outline" size={14} color={colors.error} />
                <Text style={[styles.deprecationText, { color: colors.error }]}>
                  {model.deprecationMessage}
                </Text>
              </View>
            )}

            {/* ダウンロード進捗 */}
            {(isDownloading || isPaused) && (
              <View style={styles.progressSection}>
                <View style={[styles.progressTrack, { backgroundColor: colors.labelTertiary + '33' }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: isPaused ? colors.labelTertiary : colors.accent,
                        width: pct > 0 ? `${pct}%` : '2%',
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.progressText, { color: colors.labelSecondary }]}>
                  {isPaused
                    ? `一時停止中 — ${mb} MB / ${totalMB} MB`
                    : `${mb} MB / ${totalMB} MB ダウンロード中...`}
                </Text>
              </View>
            )}

            {/* エラー表示 */}
            {hasError && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {downloadState?.error}
              </Text>
            )}

            {/* アクションボタン */}
            <View style={styles.actions}>
              {!installed && !isDownloading && !isPaused && !isDeprecated && (
                <Pressable
                  style={({ pressed }) => [
                    styles.btn, styles.btnPrimary,
                    { backgroundColor: colors.accent, opacity: pressed ? 0.7 : 1 },
                  ]}
                  onPress={() => handleInstall(model.id)}
                >
                  <Ionicons name="download-outline" size={15} color="#fff" />
                  <Text style={styles.btnTextLight}>
                    インストール（{model.sizeGB} GB）
                  </Text>
                </Pressable>
              )}

              {(isDownloading || isPaused) && (
                <View style={[styles.btn, { backgroundColor: colors.labelTertiary + '22' }]}>
                  <Ionicons
                    name={isPaused ? 'pause-circle-outline' : 'sync-outline'}
                    size={15}
                    color={colors.labelTertiary}
                  />
                  <Text style={[styles.btnText, { color: colors.labelTertiary }]}>
                    {isPaused ? '一時停止中（アプリを開いたまま再開）' : 'インストール中...'}
                  </Text>
                </View>
              )}

              {installed && !isActive && !isDownloading && !isDeprecated && (
                <Pressable
                  style={({ pressed }) => [
                    styles.btn,
                    { backgroundColor: colors.accent + '14', borderColor: colors.accent, borderWidth: 1, opacity: pressed ? 0.7 : 1 },
                  ]}
                  onPress={() => handleActivate(model.id)}
                >
                  <Ionicons name="checkmark-circle-outline" size={15} color={colors.accent} />
                  <Text style={[styles.btnText, { color: colors.accent }]}>このモデルを使用</Text>
                </Pressable>
              )}

              {installed && (
                <Pressable
                  style={({ pressed }) => [
                    styles.btnIcon, { opacity: pressed ? 0.5 : 1 },
                  ]}
                  onPress={() => handleDelete(model.id, model.name)}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </Pressable>
              )}
            </View>
          </View>
        );
      })}

      <Text style={[styles.footNote, { color: colors.labelTertiary }]}>
        モデルはデバイス内に保存されます。初回インストール時のみWi-Fiが必要です。
      </Text>
    </ScrollView>
  );
}

// ============================================================
// スタイル
// ============================================================
const styles = StyleSheet.create({
  container: {
    paddingTop: Spacing.m,
    paddingHorizontal: Spacing.m,
    gap: Spacing.xs,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '400',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 6,
    paddingHorizontal: Spacing.xs,
  },
  card: {
    borderRadius: Radius.m,
    padding: Spacing.m,
    gap: Spacing.s,
  },
  cardHeader: {
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
  },
  modelName: {
    ...TypeScale.subheadline,
    fontWeight: '600',
  },
  tag: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.s,
    paddingVertical: 2,
  },
  tagText: {
    ...TypeScale.caption2,
    fontWeight: '700',
  },
  description: {
    ...TypeScale.caption1,
    lineHeight: 16,
  },
  progressSection: {
    gap: 4,
  },
  progressTrack: {
    height: 6,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  progressText: {
    ...TypeScale.caption2,
  },
  deprecationBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    borderRadius: Radius.s,
    padding: Spacing.s,
  },
  deprecationText: {
    ...TypeScale.caption2,
    flex: 1,
    lineHeight: 16,
  },
  errorText: {
    ...TypeScale.caption1,
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
    marginTop: Spacing.xs,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: Radius.full,
    paddingVertical: 8,
    paddingHorizontal: Spacing.m,
  },
  btnPrimary: {
    flex: 1,
  },
  btnText: {
    ...TypeScale.caption1,
    fontWeight: '600',
  },
  btnTextLight: {
    ...TypeScale.caption1,
    fontWeight: '600',
    color: '#fff',
  },
  btnIcon: {
    padding: Spacing.s,
  },
  footNote: {
    ...TypeScale.caption2,
    textAlign: 'center',
    paddingHorizontal: Spacing.m,
    marginTop: Spacing.s,
    lineHeight: 16,
  },

  // ── プロバイダー選択 ──
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
    paddingVertical: Spacing.s,
  },
  providerDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 2,
  },

  // ── Groq 設定 ──
  keyInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.s,
    paddingHorizontal: Spacing.s,
    marginTop: Spacing.xs,
  },
  keyInput: {
    flex: 1,
    ...TypeScale.body,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  eyeBtn: {
    padding: 6,
  },
  keyButtonRow: {
    flexDirection: 'row',
    marginTop: Spacing.xs,
  },
  modelSelectWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: 2,
  },
  groqModelChip: {
    borderRadius: Radius.s,
    borderWidth: 1,
    paddingHorizontal: Spacing.s,
    paddingVertical: 6,
    minWidth: 140,
  },
});
