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
import {
  GEMINI_MODELS,
  GEMINI_DEFAULT_MODEL_ID,
  isValidGeminiApiKey,
} from '../../config/gemini';
import { LOCAL_AI_ENABLED } from '../../config/localAI';
import { getSecureValue, setSecureValue } from '../../services/secureStorage';

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
  // Groq
  const [groqUseByok, setGroqUseByok] = useState<boolean>(false);  // false=Lambda proxy
  const [groqApiKey, setGroqApiKey] = useState<string>('');         // SecureStoreから読み込み
  const [groqApiKeyDraft, setGroqApiKeyDraft] = useState<string>('');
  const [groqModel, setGroqModel] = useState<string>(GROQ_DEFAULT_MODEL_ID);
  const [showGroqKey, setShowGroqKey] = useState(false);
  // Gemini
  const [geminiUseByok, setGeminiUseByok] = useState<boolean>(false);
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [geminiApiKeyDraft, setGeminiApiKeyDraft] = useState<string>('');
  const [geminiModel, setGeminiModel] = useState<string>(GEMINI_DEFAULT_MODEL_ID);
  const [showGeminiKey, setShowGeminiKey] = useState(false);

  // プロバイダー設定を DB + SecureStore から読み込む
  const loadProviderSettings = useCallback(async () => {
    const db = await getDatabase();
    const rawProvider = (await getSetting(db, 'llm_provider')).trim();
    const resolved: LlmProvider =
      rawProvider === 'local' ||
      rawProvider === 'bedrock' ||
      rawProvider === 'groq' ||
      rawProvider === 'gemini'
        ? rawProvider
        : LOCAL_AI_ENABLED
          ? 'local'
          : 'bedrock';
    setProvider(resolved);

    // ── Groq ──
    const groqByokRaw = (await getSetting(db, 'groq_use_byok')).trim().toLowerCase();
    setGroqUseByok(groqByokRaw === 'true');
    const groqKey = await getSecureValue('groq_api_key');
    setGroqApiKey(groqKey);
    setGroqApiKeyDraft(groqKey);
    const gModel = (await getSetting(db, 'groq_model')).trim();
    setGroqModel(gModel.length > 0 ? gModel : GROQ_DEFAULT_MODEL_ID);

    // ── Gemini ──
    const geminiByokRaw = (await getSetting(db, 'gemini_use_byok')).trim().toLowerCase();
    setGeminiUseByok(geminiByokRaw === 'true');
    const geminiKey = await getSecureValue('gemini_api_key');
    setGeminiApiKey(geminiKey);
    setGeminiApiKeyDraft(geminiKey);
    const geModel = (await getSetting(db, 'gemini_model')).trim();
    setGeminiModel(geModel.length > 0 ? geModel : GEMINI_DEFAULT_MODEL_ID);
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
  // Lambda proxy モード (default) なら キー不要で即切替可能。
  // BYOK モード時だけ SecureStore に有効なキーが入っているか検証。
  const handleProviderChange = useCallback(async (next: LlmProvider) => {
    if (next === 'groq' && groqUseByok && !isValidGroqApiKey(groqApiKey)) {
      Alert.alert(
        '自前の Groq APIキーが未設定です',
        '上級者モードでは自前の gsk_ キーが必須です。キーを保存するか、上級者モードをOFFにして Lambda 経由に戻してください。',
      );
      return;
    }
    if (next === 'gemini' && geminiUseByok && !isValidGeminiApiKey(geminiApiKey)) {
      Alert.alert(
        '自前の Gemini APIキーが未設定です',
        '上級者モードでは自前の AIza... キーが必須です。キーを保存するか、上級者モードをOFFにして Lambda 経由に戻してください。',
      );
      return;
    }
    const db = await getDatabase();
    await setSetting(db, 'llm_provider', next);
    setProvider(next);
  }, [groqUseByok, groqApiKey, geminiUseByok, geminiApiKey]);

  // ── Groq ハンドラ ──
  const handleToggleGroqByok = useCallback(async (next: boolean) => {
    const db = await getDatabase();
    await setSetting(db, 'groq_use_byok', next ? 'true' : 'false');
    setGroqUseByok(next);
    if (next && groqApiKey.length === 0) {
      Alert.alert(
        '自前キーを入力してください',
        '上級者モードをONにしました。下の入力欄に Groq の自前キー (gsk_...) を入力して保存してください。',
      );
    }
  }, [groqApiKey]);

  const handleSaveGroqKey = useCallback(async () => {
    const trimmed = groqApiKeyDraft.trim();
    if (trimmed.length > 0 && !isValidGroqApiKey(trimmed)) {
      Alert.alert(
        'APIキー形式が不正です',
        'Groq の API キーは "gsk_" で始まる英数字です。コピペミスがないか確認してください。',
      );
      return;
    }
    await setSecureValue('groq_api_key', trimmed);
    setGroqApiKey(trimmed);
    Alert.alert(
      '保存しました',
      trimmed.length > 0
        ? 'Groq APIキーを SecureStore に保存しました (Keychain/Keystore 暗号化)'
        : 'Groq APIキーをクリアしました',
    );
  }, [groqApiKeyDraft]);

  const handleGroqModelChange = useCallback(async (modelId: string) => {
    const db = await getDatabase();
    await setSetting(db, 'groq_model', modelId);
    setGroqModel(modelId);
  }, []);

  // ── Gemini ハンドラ ──
  const handleToggleGeminiByok = useCallback(async (next: boolean) => {
    const db = await getDatabase();
    await setSetting(db, 'gemini_use_byok', next ? 'true' : 'false');
    setGeminiUseByok(next);
    if (next && geminiApiKey.length === 0) {
      Alert.alert(
        '自前キーを入力してください',
        '上級者モードをONにしました。下の入力欄に Gemini の自前キー (AIza...) を入力して保存してください。',
      );
    }
  }, [geminiApiKey]);

  const handleSaveGeminiKey = useCallback(async () => {
    const trimmed = geminiApiKeyDraft.trim();
    if (trimmed.length > 0 && !isValidGeminiApiKey(trimmed)) {
      Alert.alert(
        'APIキー形式が不正です',
        'Gemini の API キーは "AIza" で始まる英数字です。Google AI Studio で発行できます。',
      );
      return;
    }
    await setSecureValue('gemini_api_key', trimmed);
    setGeminiApiKey(trimmed);
    Alert.alert(
      '保存しました',
      trimmed.length > 0
        ? 'Gemini APIキーを SecureStore に保存しました (Keychain/Keystore 暗号化)'
        : 'Gemini APIキーをクリアしました',
    );
  }, [geminiApiKeyDraft]);

  const handleGeminiModelChange = useCallback(async (modelId: string) => {
    const db = await getDatabase();
    await setSetting(db, 'gemini_model', modelId);
    setGeminiModel(modelId);
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
    { id: 'groq', label: 'Groq API', desc: 'Llama 3.1 8B（Lambda経由・設定不要）' },
    { id: 'gemini', label: 'Gemini API', desc: 'Gemini 1.5 Flash 8B（Lambda経由・設定不要）' },
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

      {/* ── Groq 詳細設定 (Groq 選択時のみ表示) ── */}
      {provider === 'groq' && (
        <>
          <Text style={[styles.sectionHeader, { color: colors.labelTertiary }]}>
            Groq 設定
          </Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.separator, borderWidth: StyleSheet.hairlineWidth }, CardShadow]}>
            {/* 現在の動作モード表示 */}
            <View style={styles.groqStatusRow}>
              <Ionicons
                name={groqUseByok ? 'key-outline' : 'shield-checkmark-outline'}
                size={16}
                color={groqUseByok ? colors.accent : '#30D158'}
              />
              <Text style={[styles.description, { color: colors.label, fontWeight: '600' }]}>
                {groqUseByok ? '上級者モード: 自前のAPIキー使用中' : 'Lambda経由で動作中 (キー設定不要)'}
              </Text>
            </View>
            <Text style={[styles.description, { color: colors.labelSecondary }]}>
              {groqUseByok
                ? 'デバイス内 SecureStore (Keychain/Keystore) に保存された自前の Groq APIキーで直接呼び出します。'
                : 'サーバー側 Lambda が Groq APIキーを保持し、透過プロキシします。アプリ配布物にキーは含まれません。'}
            </Text>

            {/* 上級者モード トグル */}
            <Pressable
              style={({ pressed }) => [styles.advancedToggleRow, { opacity: pressed ? 0.6 : 1 }]}
              onPress={() => handleToggleGroqByok(!groqUseByok)}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.description, { color: colors.label, fontWeight: '600' }]}>
                  上級者モード: 自前のキーを使う
                </Text>
                <Text style={[styles.description, { color: colors.labelSecondary }]}>
                  自分の Groq Dev Tier キーで直接呼び出したい場合のみON
                </Text>
              </View>
              <Ionicons
                name={groqUseByok ? 'toggle' : 'toggle-outline'}
                size={32}
                color={groqUseByok ? colors.accent : colors.labelTertiary}
              />
            </Pressable>

            {/* BYOKキー入力 (上級者モード時のみ表示) */}
            {groqUseByok && (
              <>
                <Text style={[styles.description, { color: colors.labelSecondary, marginTop: Spacing.xs }]}>
                  Groq APIキー (console.groq.com で発行)
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
                    <Ionicons name="lock-closed-outline" size={15} color="#fff" />
                    <Text style={styles.btnTextLight}>キーを SecureStore に保存</Text>
                  </Pressable>
                </View>
              </>
            )}

            {/* モデル表示 (現在1モデルのみ。将来複数モデル時のピッカー) */}
            {GROQ_MODELS.length > 1 && (
              <>
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
              </>
            )}
          </View>
        </>
      )}

      {/* ── Gemini 詳細設定 (Gemini 選択時のみ表示) ── */}
      {provider === 'gemini' && (
        <>
          <Text style={[styles.sectionHeader, { color: colors.labelTertiary }]}>
            Gemini 設定
          </Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.separator, borderWidth: StyleSheet.hairlineWidth }, CardShadow]}>
            {/* 現在の動作モード表示 */}
            <View style={styles.groqStatusRow}>
              <Ionicons
                name={geminiUseByok ? 'key-outline' : 'shield-checkmark-outline'}
                size={16}
                color={geminiUseByok ? colors.accent : '#30D158'}
              />
              <Text style={[styles.description, { color: colors.label, fontWeight: '600' }]}>
                {geminiUseByok ? '上級者モード: 自前のAPIキー使用中' : 'Lambda経由で動作中 (キー設定不要)'}
              </Text>
            </View>
            <Text style={[styles.description, { color: colors.labelSecondary }]}>
              {geminiUseByok
                ? 'デバイス内 SecureStore (Keychain/Keystore) に保存された自前の Gemini APIキーで直接呼び出します。'
                : 'サーバー側 Lambda が Gemini APIキーを保持し、透過プロキシします。アプリ配布物にキーは含まれません。'}
            </Text>

            {/* 上級者モード トグル */}
            <Pressable
              style={({ pressed }) => [styles.advancedToggleRow, { opacity: pressed ? 0.6 : 1 }]}
              onPress={() => handleToggleGeminiByok(!geminiUseByok)}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.description, { color: colors.label, fontWeight: '600' }]}>
                  上級者モード: 自前のキーを使う
                </Text>
                <Text style={[styles.description, { color: colors.labelSecondary }]}>
                  自分の Google AI Studio キー (AIza...) で直接呼び出したい場合のみON
                </Text>
              </View>
              <Ionicons
                name={geminiUseByok ? 'toggle' : 'toggle-outline'}
                size={32}
                color={geminiUseByok ? colors.accent : colors.labelTertiary}
              />
            </Pressable>

            {/* BYOKキー入力 (上級者モード時のみ表示) */}
            {geminiUseByok && (
              <>
                <Text style={[styles.description, { color: colors.labelSecondary, marginTop: Spacing.xs }]}>
                  Gemini APIキー (aistudio.google.com で発行)
                </Text>
                <View style={[styles.keyInputWrap, { borderColor: colors.separator, backgroundColor: colors.backgroundGrouped }]}>
                  <TextInput
                    style={[styles.keyInput, { color: colors.label }]}
                    placeholder="AIza..."
                    placeholderTextColor={colors.labelTertiary}
                    value={geminiApiKeyDraft}
                    onChangeText={setGeminiApiKeyDraft}
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry={!showGeminiKey}
                    spellCheck={false}
                  />
                  <Pressable
                    onPress={() => setShowGeminiKey((v) => !v)}
                    style={({ pressed }) => [styles.eyeBtn, { opacity: pressed ? 0.5 : 1 }]}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={showGeminiKey ? 'eye-off-outline' : 'eye-outline'}
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
                    onPress={handleSaveGeminiKey}
                  >
                    <Ionicons name="lock-closed-outline" size={15} color="#fff" />
                    <Text style={styles.btnTextLight}>キーを SecureStore に保存</Text>
                  </Pressable>
                </View>
              </>
            )}

            {/* モデル切替 (複数モデルの場合) */}
            {GEMINI_MODELS.length > 1 && (
              <>
                <Text style={[styles.description, { color: colors.labelSecondary, marginTop: Spacing.xs }]}>
                  使用モデル
                </Text>
                <View style={styles.modelSelectWrap}>
                  {GEMINI_MODELS.map((m) => {
                    const isActive = geminiModel === m.id;
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
                        onPress={() => handleGeminiModelChange(m.id)}
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
              </>
            )}
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
  groqStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 2,
  },
  advancedToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
    paddingVertical: Spacing.s,
    marginTop: Spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.2)',
  },
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
