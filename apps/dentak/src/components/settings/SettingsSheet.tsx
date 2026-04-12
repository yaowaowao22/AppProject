import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useShallow } from 'zustand/react/shallow';
import { useSettingsStore } from '../../store/settingsStore';
import type { AngleUnit, DecimalMode, VoiceLang } from '../../store/settingsStore';
import { useModelStore } from '../../store/modelStore';
import { useModelManager } from '../../hooks/useModelManager';
import type { AvailableModel } from '../../hooks/useModelManager';
import { colors } from '../../theme/tokens';
import {
  KEY_CATALOG,
  ALL_KEY_IDS,
  resolveKey,
  PRESET_LABELS,
  PRESETS,
} from '../../config/keyLayouts';
import type { PresetName, KeyLayout, LayoutRow } from '../../config/keyLayouts';

// ── Constants ────────────────────────────────────────────────────────────────

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_DURATION = 400;
const EASING_OUT = Easing.bezier(0.16, 1, 0.30, 1);

// ── Props ─────────────────────────────────────────────────────────────────────

interface SettingsSheetProps {
  isVisible: boolean;
  onClose: () => void;
}

// ── Animated Toggle ───────────────────────────────────────────────────────────

interface ToggleProps {
  value: boolean;
  onToggle: () => void;
}

const Toggle: React.FC<ToggleProps> = ({ value, onToggle }) => {
  const thumbX = useSharedValue(value ? 18 : 0);

  useEffect(() => {
    thumbX.value = withTiming(value ? 18 : 0, { duration: 250, easing: EASING_OUT });
  }, [value, thumbX]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value }],
  }));

  return (
    <TouchableOpacity
      onPress={onToggle}
      style={[styles.toggle, value && styles.toggleOn]}
      activeOpacity={0.85}
    >
      <Animated.View style={[styles.toggleThumb, thumbStyle]} />
    </TouchableOpacity>
  );
};

// ── Segment Control ───────────────────────────────────────────────────────────

interface SegmentOption<T extends string | number> {
  label: string;
  value: T;
}

interface SegmentControlProps<T extends string | number> {
  options: SegmentOption<T>[];
  selected: T;
  onSelect: (v: T) => void;
}

function SegmentControl<T extends string | number>({
  options,
  selected,
  onSelect,
}: SegmentControlProps<T>) {
  return (
    <View style={styles.segCtrl}>
      {options.map((opt) => {
        const active = opt.value === selected;
        return (
          <TouchableOpacity
            key={String(opt.value)}
            onPress={() => onSelect(opt.value)}
            style={[styles.segOpt, active && styles.segOptOn]}
            activeOpacity={0.75}
          >
            <Text style={[styles.segOptText, active && styles.segOptTextOn]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Setting Row ───────────────────────────────────────────────────────────────

interface SettingRowProps {
  label: string;
  sub?: string;
  right: React.ReactNode;
  noBorder?: boolean;
}

const SettingRow: React.FC<SettingRowProps> = ({ label, sub, right, noBorder }) => (
  <View style={[styles.settingRow, noBorder && styles.settingRowNoBorder]}>
    <View style={styles.settingRowLeft}>
      <Text style={styles.settingLabel}>{label}</Text>
      {sub ? <Text style={styles.settingSub}>{sub}</Text> : null}
    </View>
    {right}
  </View>
);

// ── Section Header ────────────────────────────────────────────────────────────

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <Text style={styles.ssHead}>{title}</Text>
);

// ── Model Row ─────────────────────────────────────────────────────────────────

const ACCURACY_LABEL: Record<string, string> = {
  fast:     '高速',
  balanced: 'バランス',
  accurate: '高精度',
  best:     '最高精度',
};

interface ModelRowProps {
  model:      AvailableModel;
  isActive:   boolean;
  onDownload: () => void;
  onDelete:   () => void;
  onSwitch:   () => void;
  noBorder?:  boolean;
}

const ModelRow: React.FC<ModelRowProps> = ({
  model, isActive, onDownload, onDelete, onSwitch, noBorder,
}) => {
  let actionArea: React.ReactNode;

  if (model.progress !== null) {
    // ダウンロード中
    actionArea = (
      <Text style={styles.modelProgress}>
        {Math.round(model.progress * 100)}%
      </Text>
    );
  } else if (model.isDownloaded) {
    // DL済み
    actionArea = (
      <View style={styles.modelActions}>
        {isActive ? (
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>使用中</Text>
          </View>
        ) : (
          <TouchableOpacity onPress={onSwitch} style={styles.modelBtn} activeOpacity={0.75}>
            <Text style={styles.modelBtnText}>切替</Text>
          </TouchableOpacity>
        )}
        {model.id !== 'tiny' && (
          <TouchableOpacity
            onPress={onDelete}
            style={[styles.modelBtn, styles.modelBtnDanger]}
            activeOpacity={0.75}
          >
            <Text style={[styles.modelBtnText, styles.modelBtnDangerText]}>削除</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  } else {
    // 未ダウンロード
    actionArea = (
      <TouchableOpacity
        onPress={onDownload}
        style={[styles.modelBtn, styles.modelBtnDownload]}
        activeOpacity={0.75}
      >
        <Text style={styles.modelBtnDownloadText}>{model.sizeMB}MB</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.modelRow, noBorder && styles.settingRowNoBorder]}>
      <View style={styles.modelRowLeft}>
        <Text style={styles.settingLabel}>{model.label}</Text>
        <Text style={styles.settingSub}>
          {ACCURACY_LABEL[model.accuracy]}・RAM {model.minRAM_MB}MB
        </Text>
        {model.progress !== null && (
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.round(model.progress * 100)}%` as `${number}%` },
              ]}
            />
          </View>
        )}
      </View>
      {actionArea}
    </View>
  );
};

// ── Angle sub text ────────────────────────────────────────────────────────────

function angleSubText(unit: AngleUnit): string {
  switch (unit) {
    case 'deg':  return 'sin(90) = 1.0 のとき DEG';
    case 'rad':  return 'sin(π/2) = 1.0 のとき RAD';
    case 'grad': return 'sin(100) = 1.0 のとき GRAD';
  }
}

// ── Layout Preview (mini keyboard visualization) ─────────────────────────────

const LayoutPreview: React.FC<{ layout: KeyLayout; label: string }> = ({ layout, label }) => {
  const typeColor: Record<string, string> = {
    fn: '#3A3A3C',
    num: '#1C1C1E',
    op: '#FF9500',
    'op-eq': '#fff',
    mic: '#1C1C1E',
    util: '#3A3A3C',
  };

  return (
    <View style={layoutStyles.previewContainer}>
      <Text style={layoutStyles.previewLabel}>{label}</Text>
      <View style={layoutStyles.previewGrid}>
        {layout.map((row, ri) => (
          <View key={ri} style={layoutStyles.previewRow}>
            {row.map((cell, ci) => {
              const def = resolveKey(cell.keyId);
              const bg = def ? (typeColor[def.type] ?? '#1C1C1E') : '#1C1C1E';
              const textColor = def?.type === 'op-eq' ? '#000' : '#fff';
              return (
                <View
                  key={`${ri}-${ci}`}
                  style={[
                    layoutStyles.previewCell,
                    { flex: cell.flex ?? 1, backgroundColor: bg },
                  ]}
                >
                  <Text
                    style={[layoutStyles.previewCellText, { color: textColor }]}
                    numberOfLines={1}
                  >
                    {def?.label ?? '?'}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
};

// ── Key Picker Modal ─────────────────────────────────────────────────────────

interface KeyPickerProps {
  visible:  boolean;
  onSelect: (keyId: string) => void;
  onClose:  () => void;
  currentKeyId: string;
}

/** グリッド型のキー選択パネル */
const KeyPicker: React.FC<KeyPickerProps> = ({ visible, onSelect, onClose, currentKeyId }) => {
  if (!visible) return null;

  // カテゴリ分け
  const categories: { title: string; ids: string[] }[] = [
    { title: '数字', ids: ['0','1','2','3','4','5','6','7','8','9','.'] },
    { title: '演算子', ids: ['+','-','×','÷','='] },
    { title: '機能', ids: ['AC','±','%','π','e','sqrt','x²','x³','log','ln','sin','cos','tan','asin','acos','atan','xⁿ','eˣ','10^x','cbrt','n!','1/x'] },
    { title: 'ユーティリティ', ids: ['(',')', 'EE','ANS','⌫','mic'] },
  ];

  return (
    <View style={pickerStyles.overlay}>
      <View style={pickerStyles.container}>
        <View style={pickerStyles.header}>
          <Text style={pickerStyles.title}>キーを選択</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}>
            <Text style={pickerStyles.close}>✕</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={pickerStyles.scroll} showsVerticalScrollIndicator={false}>
          {categories.map((cat) => (
            <View key={cat.title}>
              <Text style={pickerStyles.catTitle}>{cat.title}</Text>
              <View style={pickerStyles.grid}>
                {cat.ids.map((id) => {
                  const def = resolveKey(id);
                  if (!def) return null;
                  const isSelected = id === currentKeyId;
                  return (
                    <TouchableOpacity
                      key={id}
                      style={[
                        pickerStyles.keyBtn,
                        isSelected && pickerStyles.keyBtnSelected,
                      ]}
                      onPress={() => onSelect(id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        pickerStyles.keyBtnText,
                        isSelected && pickerStyles.keyBtnTextSelected,
                      ]}>
                        {def.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
          <View style={{ height: 16 }} />
        </ScrollView>
      </View>
    </View>
  );
};

// ── Layout Editor ────────────────────────────────────────────────────────────

const LayoutEditor: React.FC = () => {
  const numLayout    = useSettingsStore((s) => s.numLayout);
  const utilLayout   = useSettingsStore((s) => s.utilLayout);
  const setNumKey    = useSettingsStore((s) => s.setNumKey);
  const setUtilKey   = useSettingsStore((s) => s.setUtilKey);
  const applyPreset  = useSettingsStore((s) => s.applyPreset);

  // キー選択状態
  const [pickerVisible, setPickerVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<{
    area: 'num' | 'util';
    row: number;
    col: number;
    currentKeyId: string;
  } | null>(null);

  const handleCellPress = (area: 'num' | 'util', row: number, col: number, currentKeyId: string) => {
    setEditTarget({ area, row, col, currentKeyId });
    setPickerVisible(true);
  };

  const handleKeySelect = (keyId: string) => {
    if (!editTarget) return;
    if (editTarget.area === 'num') {
      setNumKey(editTarget.row, editTarget.col, keyId);
    } else {
      setUtilKey(editTarget.col, keyId);
    }
    setPickerVisible(false);
    setEditTarget(null);
  };

  const handlePickerClose = () => {
    setPickerVisible(false);
    setEditTarget(null);
  };

  const typeColor: Record<string, string> = {
    fn: '#3A3A3C',
    num: '#2C2C2E',
    op: '#FF9500',
    'op-eq': '#fff',
    mic: '#2C2C2E',
    util: '#3A3A3C',
  };

  return (
    <View>
      {/* プリセット選択 */}
      <View style={layoutEditorStyles.presetRow}>
        {(Object.keys(PRESETS) as PresetName[]).map((name) => (
          <TouchableOpacity
            key={name}
            style={layoutEditorStyles.presetBtn}
            onPress={() => applyPreset(name)}
            activeOpacity={0.7}
          >
            <Text style={layoutEditorStyles.presetBtnText}>
              {PRESET_LABELS[name]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={layoutEditorStyles.hint}>
        タップしてキーを変更
      </Text>

      {/* UtilBar エディタ */}
      <Text style={layoutEditorStyles.areaLabel}>ユーティリティバー</Text>
      <View style={layoutEditorStyles.editorRow}>
        {utilLayout.map((cell, ci) => {
          const def = resolveKey(cell.keyId);
          const bg = def ? (typeColor[def.type] ?? '#2C2C2E') : '#2C2C2E';
          const textColor = def?.type === 'op-eq' ? '#000' : '#fff';
          return (
            <TouchableOpacity
              key={`u-${ci}`}
              style={[layoutEditorStyles.editorCell, { flex: cell.flex ?? 1, backgroundColor: bg }]}
              onPress={() => handleCellPress('util', 0, ci, cell.keyId)}
              activeOpacity={0.7}
            >
              <Text style={[layoutEditorStyles.editorCellText, { color: textColor }]} numberOfLines={1}>
                {def?.label ?? '?'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* NumGrid エディタ */}
      <Text style={[layoutEditorStyles.areaLabel, { marginTop: 10 }]}>メインキーパッド</Text>
      {numLayout.map((row, ri) => (
        <View key={ri} style={layoutEditorStyles.editorRow}>
          {row.map((cell, ci) => {
            const def = resolveKey(cell.keyId);
            const bg = def ? (typeColor[def.type] ?? '#2C2C2E') : '#2C2C2E';
            const textColor = def?.type === 'op-eq' ? '#000' : '#fff';
            return (
              <TouchableOpacity
                key={`n-${ri}-${ci}`}
                style={[layoutEditorStyles.editorCell, { flex: cell.flex ?? 1, backgroundColor: bg }]}
                onPress={() => handleCellPress('num', ri, ci, cell.keyId)}
                activeOpacity={0.7}
              >
                <Text style={[layoutEditorStyles.editorCellText, { color: textColor }]} numberOfLines={1}>
                  {def?.label ?? '?'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      {/* Key Picker */}
      <KeyPicker
        visible={pickerVisible}
        currentKeyId={editTarget?.currentKeyId ?? ''}
        onSelect={handleKeySelect}
        onClose={handlePickerClose}
      />
    </View>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const ANGLE_OPTIONS: SegmentOption<AngleUnit>[] = [
  { label: 'DEG', value: 'deg' },
  { label: 'RAD', value: 'rad' },
  { label: 'GRAD', value: 'grad' },
];

const DECIMAL_OPTIONS: SegmentOption<DecimalMode>[] = [
  { label: 'Auto', value: 'auto' },
  { label: '4', value: 4 },
  { label: '8', value: 8 },
];

const VOICE_LANG_OPTIONS: SegmentOption<VoiceLang>[] = [
  { label: '日本語', value: 'ja' },
  { label: 'English', value: 'en' },
  { label: '自動', value: 'auto' },
];

const SettingsSheet: React.FC<SettingsSheetProps> = ({ isVisible, onClose }) => {
  // ── Store ──────────────────────────────────────────────────────────────────
  const {
    angleUnit, decimals, useExpNotation, useThousandSep,
    voiceLang, voiceReadback, haptics, soundFeedback,
    setAngleUnit, setDecimals, setUseExpNotation, setUseThousandSep,
    setVoiceLang, setVoiceReadback, setHaptics, setSoundFeedback,
  } = useSettingsStore(
    useShallow((s) => ({
      angleUnit:       s.angleUnit,
      decimals:        s.decimals,
      useExpNotation:  s.useExpNotation,
      useThousandSep:  s.useThousandSep,
      voiceLang:       s.voiceLang,
      voiceReadback:   s.voiceReadback,
      haptics:         s.haptics,
      soundFeedback:   s.soundFeedback,
      setAngleUnit:    s.setAngleUnit,
      setDecimals:     s.setDecimals,
      setUseExpNotation: s.setUseExpNotation,
      setUseThousandSep: s.setUseThousandSep,
      setVoiceLang:    s.setVoiceLang,
      setVoiceReadback: s.setVoiceReadback,
      setHaptics:      s.setHaptics,
      setSoundFeedback: s.setSoundFeedback,
    })),
  );

  // ── Model management ───────────────────────────────────────────────────────
  const { availableModels, downloadModel, deleteModel, switchModel } = useModelManager();
  const activeModelId = useModelStore((s) => s.activeModelId);

  // ── Sheet animation ────────────────────────────────────────────────────────
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const overlayOpacity = useSharedValue(0);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const handleClose = useCallback(() => {
    overlayOpacity.value = withTiming(0, { duration: SHEET_DURATION, easing: EASING_OUT });
    translateY.value = withTiming(
      SCREEN_HEIGHT,
      { duration: SHEET_DURATION, easing: EASING_OUT },
      (finished) => { if (finished) runOnJS(onClose)(); },
    );
  }, [onClose, overlayOpacity, translateY]);

  // 初回マウント時は isVisible=false でも handleClose() を呼ばない
  const hasMountedRef = useRef(false);
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    if (isVisible) {
      translateY.value = withTiming(0, { duration: SHEET_DURATION, easing: EASING_OUT });
      overlayOpacity.value = withTiming(1, { duration: SHEET_DURATION, easing: EASING_OUT });
    } else {
      handleClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  if (!isVisible && translateY.value >= SCREEN_HEIGHT) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      {/* Overlay */}
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={handleClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, sheetStyle]}>
        {/* Drag handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.sheetHead}>
          <Text style={styles.sheetTitle}>設定</Text>
          <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}>
            <Text style={styles.sheetDone}>完了</Text>
          </TouchableOpacity>
        </View>

        {/* Scrollable content */}
        <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>

          {/* ── キーレイアウト ──────────────────────── */}
          <SectionHeader title="キーレイアウト" />
          <View style={styles.layoutEditorSection}>
            <LayoutEditor />
          </View>

          {/* ── 角度モード ─────────────────────────── */}
          <SectionHeader title="角度モード" />
          <SettingRow
            label="単位"
            sub={angleSubText(angleUnit)}
            right={
              <SegmentControl
                options={ANGLE_OPTIONS}
                selected={angleUnit}
                onSelect={setAngleUnit}
              />
            }
          />

          {/* ── 表示 ─────────────────────────────────── */}
          <SectionHeader title="表示" />
          <SettingRow
            label="小数点以下桁数"
            sub={decimals === 'auto' ? '自動' : `${decimals} 桁`}
            right={
              <SegmentControl
                options={DECIMAL_OPTIONS}
                selected={decimals}
                onSelect={setDecimals}
              />
            }
          />
          <SettingRow
            label="指数表記"
            sub="大きな数を 1.2×10⁸ 形式で表示"
            right={
              <Toggle
                value={useExpNotation}
                onToggle={() => setUseExpNotation(!useExpNotation)}
              />
            }
          />
          <SettingRow
            label="千の位区切り"
            sub="1,000,000 形式"
            right={
              <Toggle
                value={useThousandSep}
                onToggle={() => setUseThousandSep(!useThousandSep)}
              />
            }
          />

          {/* ── 音声入力 (Whisper) ────────────────────── */}
          <SectionHeader title="音声入力 (Whisper)" />
          <SettingRow
            label="認識言語"
            right={
              <SegmentControl
                options={VOICE_LANG_OPTIONS}
                selected={voiceLang}
                onSelect={setVoiceLang}
              />
            }
          />
          <SettingRow
            label="認識結果を音読"
            right={
              <Toggle
                value={voiceReadback}
                onToggle={() => setVoiceReadback(!voiceReadback)}
              />
            }
          />

          {/* ── 音声モデル ────────────────────────────── */}
          <SectionHeader title="音声モデル (Whisper)" />
          {availableModels.map((model, idx) => (
            <ModelRow
              key={model.id}
              model={model}
              isActive={model.id === activeModelId}
              onDownload={() => { void downloadModel(model.id); }}
              onDelete={() => { void deleteModel(model.id); }}
              onSwitch={() => { void switchModel(model.id); }}
              noBorder={idx === availableModels.length - 1}
            />
          ))}

          {/* ── 操作 ─────────────────────────────────── */}
          <SectionHeader title="操作" />
          <SettingRow
            label="ハプティクス"
            right={
              <Toggle
                value={haptics}
                onToggle={() => setHaptics(!haptics)}
              />
            }
          />
          <SettingRow
            label="サウンドフィードバック"
            noBorder
            right={
              <Toggle
                value={soundFeedback}
                onToggle={() => setSoundFeedback(!soundFeedback)}
              />
            }
          />

          {/* Bottom padding */}
          <View style={{ height: 20 }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
};

export default SettingsSheet;

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Sheet ──────────────────────────────────────────────────────────────────
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 50,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '85%',
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 60,
    flexDirection: 'column',
  },

  // ── Handle & header ────────────────────────────────────────────────────────
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.g1,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    flexShrink: 0,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.g0,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.black,
  },
  sheetDone: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.black,
  },
  sheetScroll: {
    flex: 1,
  },

  // ── Section header ─────────────────────────────────────────────────────────
  ssHead: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.g2,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    paddingTop: 14,
    paddingBottom: 6,
    paddingHorizontal: 20,
  },

  // ── Setting row ────────────────────────────────────────────────────────────
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.g0,
  },
  settingRowNoBorder: {
    borderBottomWidth: 0,
  },
  settingRowLeft: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 13,
    color: colors.black,
  },
  settingSub: {
    fontSize: 11,
    color: colors.g2,
    marginTop: 2,
  },

  // ── Toggle ─────────────────────────────────────────────────────────────────
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.g1,
    justifyContent: 'center',
  },
  toggleOn: {
    backgroundColor: colors.black,
  },
  toggleThumb: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.white,
  },

  // ── Segment control ────────────────────────────────────────────────────────
  segCtrl: {
    flexDirection: 'row',
    backgroundColor: colors.g0,
    borderRadius: 7,
    padding: 2,
    gap: 2,
  },
  segOpt: {
    height: 26,
    paddingHorizontal: 10,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segOptOn: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  segOptText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.g2,
  },
  segOptTextOn: {
    color: colors.black,
  },

  // ── Model row ──────────────────────────────────────────────────────────────
  modelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.g0,
  },
  modelRowLeft: {
    flex: 1,
    marginRight: 8,
  },
  modelActions: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  modelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.g1,
    alignItems: 'center',
  },
  modelBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.black,
  },
  modelBtnDanger: {
    borderColor: '#FF3B30',
  },
  modelBtnDangerText: {
    color: '#FF3B30',
  },
  modelBtnDownload: {
    borderColor: colors.amber,
    paddingHorizontal: 12,
  },
  modelBtnDownloadText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.amber,
  },
  activeBadge: {
    backgroundColor: 'rgba(255,149,0,0.10)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.amber,
  },
  modelProgress: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.amber,
    minWidth: 36,
    textAlign: 'right',
  },
  progressTrack: {
    height: 3,
    backgroundColor: colors.g0,
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    backgroundColor: colors.amber,
    borderRadius: 2,
  },

  // ── Layout editor section ──────────────────────────────────────────────────
  layoutEditorSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});

// ── Layout Preview Styles ────────────────────────────────────────────────────

const layoutStyles = StyleSheet.create({
  previewContainer: {
    marginBottom: 8,
  },
  previewLabel: {
    fontSize: 11,
    color: colors.g2,
    marginBottom: 4,
  },
  previewGrid: {
    gap: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    overflow: 'hidden',
    padding: 2,
  },
  previewRow: {
    flexDirection: 'row',
    gap: 1,
  },
  previewCell: {
    height: 22,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCellText: {
    fontSize: 8,
    fontWeight: '500',
  },
});

// ── Layout Editor Styles ─────────────────────────────────────────────────────

const layoutEditorStyles = StyleSheet.create({
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.g0,
    alignItems: 'center',
  },
  presetBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.black,
  },
  hint: {
    fontSize: 11,
    color: colors.g2,
    marginBottom: 8,
    textAlign: 'center',
  },
  areaLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.g2,
    letterSpacing: 0.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  editorRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 2,
  },
  editorCell: {
    height: 36,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  editorCellText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

// ── Key Picker Styles ────────────────────────────────────────────────────────

const pickerStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  container: {
    width: '88%',
    maxHeight: '70%',
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.g0,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.black,
  },
  close: {
    fontSize: 18,
    color: colors.g2,
    fontWeight: '300',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  catTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.g2,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 10,
    marginBottom: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  keyBtn: {
    minWidth: 48,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.g0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyBtnSelected: {
    backgroundColor: colors.black,
  },
  keyBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.black,
  },
  keyBtnTextSelected: {
    color: colors.white,
  },
});
