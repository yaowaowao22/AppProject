import React, { useCallback, useEffect, useRef } from 'react';
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

          {/* ── 角度モード ─────────────────────────────── */}
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
    maxHeight: '70%',
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
    backgroundColor: colors.amberBg,
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
});
