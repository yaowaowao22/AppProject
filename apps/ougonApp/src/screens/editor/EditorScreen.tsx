import React, { useRef, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Canvas,
  useImage,
  Vertices,
  ImageShader,
  Image as SkiaImage,
} from '@shopify/react-native-skia';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import Feather from '@expo/vector-icons/Feather';

import BeforeAfterToggle from '../../components/BeforeAfterToggle';
import PhiGrid from '../../components/PhiGrid';
import type { CorrectionChip } from '../../components/PhiGrid';
import ScoreBadge from '../../components/ScoreBadge';
import AdjustmentSlider from '../../components/AdjustmentSlider';
import { useGoldenRatio } from './useGoldenRatio';
import { useSkiaWarp } from './useSkiaWarp';
import { useHistory } from '../../hooks/useHistory';
import { saveToGallery, saveThumbnail, shareImage } from '../../utils/imageExport';
import type { FaceLandmarks, PhiDeviations } from '../../types/face';

// ─────────────────────────────────────
// Constants
// ─────────────────────────────────────
const VIEWPORT_HEIGHT = 320;

const EMPTY_DEVIATION = {
  label: '',
  actual: 0,
  target: 0,
  deltaPixels: 0,
  score: 0,
} as const;

const EMPTY_DEVIATIONS: PhiDeviations = {
  faceAspect: { ...EMPTY_DEVIATION },
  eyeToFace: { ...EMPTY_DEVIATION },
  noseToMouth: { ...EMPTY_DEVIATION },
  noseRatio: { ...EMPTY_DEVIATION },
  faceToEye: { ...EMPTY_DEVIATION },
  totalScore: 0,
};

// ─────────────────────────────────────
// Route types
// ─────────────────────────────────────
type EditorParams = {
  imageUri: string;
  landmarks: FaceLandmarks | null;
};

type EditorRouteProp = RouteProp<{ Editor: EditorParams }, 'Editor'>;

// ─────────────────────────────────────
// Helpers
// ─────────────────────────────────────
function clampAdjust(v: number): number {
  return Math.max(-20, Math.min(20, Math.round(v)));
}

function formatDelta(delta: number): string {
  return `${delta > 0 ? '+' : ''}${delta}px`;
}

// ─────────────────────────────────────
// Component
// ─────────────────────────────────────
export default function EditorScreen() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const navigation = useNavigation();
  const route = useRoute<EditorRouteProp>();

  const imageUri = route.params?.imageUri ?? '';
  const landmarks = route.params?.landmarks ?? null;

  // ── State ──
  const [toggle, setToggle] = useState<'before' | 'after'>('after');

  // Canvas ref for snapshot (any: SkiaDomView type varies by Skia version)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);

  // ── Skia image ──
  const skiaImage = useImage(imageUri);

  // ── Golden ratio ──
  const { deviations } = useGoldenRatio(landmarks, screenWidth, VIEWPORT_HEIGHT);

  // ── Warp mesh & sliders ──
  const {
    warpMesh,
    intensity,
    setIntensity,
    partAdjustments,
    setPartAdjustment,
    resetAll,
  } = useSkiaWarp(deviations, screenWidth, VIEWPORT_HEIGHT);

  // ── History ──
  const { addRecord } = useHistory();

  // ── Correction chips (derived from deviations) ──
  const correctionChips = useMemo<CorrectionChip[]>(() => {
    if (!deviations) return [];
    const chips: CorrectionChip[] = [];

    const eyeDelta = Math.round(deviations.eyeToFace.deltaPixels);
    if (Math.abs(eyeDelta) > 0) {
      chips.push({
        label: `目 ${formatDelta(eyeDelta)} →`,
        value: '',
        position: { x: screenWidth * 0.04, y: VIEWPORT_HEIGHT * 0.30 },
      });
    }

    const noseDelta = Math.round(deviations.noseToMouth.deltaPixels);
    if (Math.abs(noseDelta) > 0) {
      chips.push({
        label: `← 鼻 ${formatDelta(noseDelta)}`,
        value: '',
        position: { x: screenWidth * 0.55, y: VIEWPORT_HEIGHT * 0.55 },
      });
    }

    const mouthDelta = Math.round(deviations.noseRatio.deltaPixels);
    if (Math.abs(mouthDelta) > 0) {
      chips.push({
        label: `口 ${formatDelta(mouthDelta)} ↑`,
        value: '',
        position: { x: screenWidth * 0.28, y: VIEWPORT_HEIGHT * 0.75 },
      });
    }

    return chips;
  }, [deviations, screenWidth]);

  // ── isGold per part slider (slider is at the φ-optimal delta position) ──
  const eyeSpacingGold = deviations
    ? partAdjustments.eyeSpacing === clampAdjust(deviations.eyeToFace.deltaPixels)
    : false;
  const jawLineGold = deviations
    ? partAdjustments.jawLine === clampAdjust(deviations.faceAspect.deltaPixels)
    : false;
  const noseWidthGold = deviations
    ? partAdjustments.noseWidth === clampAdjust(deviations.noseToMouth.deltaPixels)
    : false;
  const mouthPositionGold = deviations
    ? partAdjustments.mouthPosition === clampAdjust(deviations.noseRatio.deltaPixels)
    : false;

  // ─────────────────────────────────────
  // Canvas snapshot → file
  // ⚠️ makeImageSnapshot() is only valid when Canvas is mounted and rendered ("After" mode)
  // ─────────────────────────────────────
  const captureToFile = useCallback(async (dir: string): Promise<string | null> => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const snapshot = canvasRef.current?.makeImageSnapshot();
    if (!snapshot) return null;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const base64: string = snapshot.encodeToBase64();
    const path = `${dir}ougon_${Date.now()}.png`;
    await FileSystem.writeAsStringAsync(path, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return path;
  }, []);

  // ─────────────────────────────────────
  // Save to camera roll + history
  // ─────────────────────────────────────
  const handleSave = useCallback(async () => {
    // snapshot requires After mode canvas
    if (toggle !== 'after') {
      Alert.alert('ヒント', 'After モードで保存してください。');
      return;
    }
    try {
      const docDir = FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? '';
      const processedPath = await captureToFile(docDir);
      if (!processedPath) {
        Alert.alert('エラー', 'スナップショットの取得に失敗しました。');
        return;
      }

      const id = Date.now().toString(36);
      const [thumbPath] = await Promise.all([
        saveThumbnail(processedPath, id),
        saveToGallery(processedPath),
      ]);

      await addRecord({
        label: '加工結果',
        thumbnailPath: thumbPath,
        processedPath,
        score: deviations?.totalScore ?? 0,
        intensity,
        deviations: deviations ?? EMPTY_DEVIATIONS,
      });

      Alert.alert('保存完了', 'カメラロールに保存しました。');
    } catch (err) {
      console.error('[EditorScreen] save error:', err);
      Alert.alert('エラー', '保存に失敗しました。');
    }
  }, [toggle, captureToFile, deviations, intensity, addRecord]);

  // ─────────────────────────────────────
  // Share
  // ─────────────────────────────────────
  const handleShare = useCallback(async () => {
    try {
      let targetUri = imageUri;

      if (toggle === 'after' && canvasRef.current) {
        const cacheDir = FileSystem.cacheDirectory ?? '';
        const tmpPath = await captureToFile(cacheDir);
        if (tmpPath) targetUri = tmpPath;
      }

      await shareImage(targetUri);
    } catch (err) {
      console.error('[EditorScreen] share error:', err);
      Alert.alert('エラー', 'シェアに失敗しました。');
    }
  }, [toggle, imageUri, captureToFile]);

  // ─────────────────────────────────────
  // Viewport: Before / After
  // ─────────────────────────────────────
  const renderViewport = () => {
    if (toggle === 'before') {
      return (
        <Image
          source={{ uri: imageUri }}
          style={StyleSheet.absoluteFill}
          resizeMode="contain"
        />
      );
    }

    // After: Skia Canvas + PhiGrid overlay + ScoreBadge
    return (
      <>
        {/* ⚠️ Vertices + ImageShader: mesh warp in viewport coordinate space
            sourcePoints = UV into image shader rect (0..screenWidth × 0..VIEWPORT_HEIGHT)
            destPoints   = screen position of each warped vertex              */}
        <Canvas
          ref={canvasRef}
          style={{ width: screenWidth, height: VIEWPORT_HEIGHT }}
        >
          {skiaImage && warpMesh ? (
            <Vertices
              vertices={warpMesh.destPoints}
              textures={warpMesh.sourcePoints}
              indices={warpMesh.indices}
              mode="triangles"
            >
              {/* fit="fill" maps image to viewport rect so UVs in [0,W]×[0,H] sample correctly */}
              <ImageShader
                image={skiaImage}
                fit="fill"
                rect={{ x: 0, y: 0, width: screenWidth, height: VIEWPORT_HEIGHT }}
              />
            </Vertices>
          ) : skiaImage ? (
            // Fallback: no warp (deviations not yet computed)
            <SkiaImage
              image={skiaImage}
              x={0}
              y={0}
              width={screenWidth}
              height={VIEWPORT_HEIGHT}
              fit="contain"
            />
          ) : null}
        </Canvas>

        {/* φ grid overlay + correction chips */}
        <PhiGrid
          width={screenWidth}
          height={VIEWPORT_HEIGHT}
          visible
          corrections={correctionChips}
        />

        {/* φ score badge */}
        <ScoreBadge score={deviations?.totalScore ?? 0} />
      </>
    );
  };

  // ─────────────────────────────────────
  // Render
  // ─────────────────────────────────────
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* 1. NavBar */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Feather name="chevron-left" size={22} color="#111111" />
        </TouchableOpacity>

        <Text style={styles.navTitle}>加工結果</Text>

        <TouchableOpacity
          style={styles.navBtn}
          onPress={handleShare}
          activeOpacity={0.7}
        >
          <Feather name="share-2" size={20} color="#111111" />
        </TouchableOpacity>
      </View>

      {/* 2. Before/After Toggle (marginTop 8 — marginHorizontal 34 is built into component) */}
      <View style={styles.toggleWrap}>
        <BeforeAfterToggle value={toggle} onChange={setToggle} />
      </View>

      {/* 3. Image Viewport — 320px fixed height, #E8E8E8 background */}
      <View style={styles.viewport}>
        {renderViewport()}
      </View>

      {/* 4. Sliders Panel — flex 1, scrollable */}
      <ScrollView
        style={styles.slidersPanel}
        contentContainerStyle={styles.slidersPanelContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Master intensity slider */}
        <AdjustmentSlider
          label="補正強度"
          value={intensity}
          min={0}
          max={100}
          unit="%"
          isIntensity
          isGold
          onChange={setIntensity}
        />

        {/* Section title */}
        <Text style={styles.sectionTitle}>部位別調整</Text>

        {/* Part sliders — ±20px each, isGold when at φ-optimal delta */}
        <AdjustmentSlider
          label="目の間隔"
          value={partAdjustments.eyeSpacing}
          min={-20}
          max={20}
          unit=" px"
          isGold={eyeSpacingGold}
          onChange={(v) => setPartAdjustment('eyeSpacing', v)}
        />
        <AdjustmentSlider
          label="顎のライン"
          value={partAdjustments.jawLine}
          min={-20}
          max={20}
          unit=" px"
          isGold={jawLineGold}
          onChange={(v) => setPartAdjustment('jawLine', v)}
        />
        <AdjustmentSlider
          label="鼻の幅"
          value={partAdjustments.noseWidth}
          min={-20}
          max={20}
          unit=" px"
          isGold={noseWidthGold}
          onChange={(v) => setPartAdjustment('noseWidth', v)}
        />
        <AdjustmentSlider
          label="口の位置"
          value={partAdjustments.mouthPosition}
          min={-20}
          max={20}
          unit=" px"
          isGold={mouthPositionGold}
          onChange={(v) => setPartAdjustment('mouthPosition', v)}
        />
      </ScrollView>

      {/* 5. Action Row */}
      <View style={[styles.actionRow, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {/* Save button — flex 1, btn-primary style */}
        <TouchableOpacity style={styles.btnPrimary} onPress={handleSave} activeOpacity={0.8}>
          <Feather name="download" size={16} color="#FFFFFF" />
          <Text style={styles.btnPrimaryText}>保存</Text>
        </TouchableOpacity>

        {/* Share icon button — 52×52 circle */}
        <TouchableOpacity style={styles.btnIcon} onPress={handleShare} activeOpacity={0.8}>
          <Feather name="share-2" size={18} color="#111111" />
        </TouchableOpacity>

        {/* Reset icon button — 52×52 circle */}
        <TouchableOpacity style={styles.btnIcon} onPress={resetAll} activeOpacity={0.8}>
          <Feather name="rotate-ccw" size={18} color="#111111" />
        </TouchableOpacity>
      </View>

    </View>
  );
}

// ─────────────────────────────────────
// Styles
// ─────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // NavBar — mock: padding 12 16 8 16, height ~58px
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    flexShrink: 0,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
    color: '#111111',
  },
  navBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Toggle wrapper — adds marginTop: 8 (marginHorizontal 34 is inside BeforeAfterToggle)
  toggleWrap: {
    marginTop: 8,
  },

  // Image Viewport — 320px fixed height, #E8E8E8 bg, marginTop 8
  viewport: {
    width: '100%',
    height: VIEWPORT_HEIGHT,
    backgroundColor: '#E8E8E8',
    overflow: 'hidden',
    flexShrink: 0,
    marginTop: 8,
  },

  // Sliders Panel
  slidersPanel: {
    flex: 1,
  },
  slidersPanelContent: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 12,
  },

  // Section title — 部位別調整
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: '#AAAAAA',
    marginTop: 4,
    marginBottom: 4,
  },

  // Action Row
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingHorizontal: 16,
    paddingTop: 8,
    flexShrink: 0,
  },

  // Save button (btn-primary)
  btnPrimary: {
    flex: 1,
    height: 52,
    backgroundColor: '#111111',
    borderRadius: 26, // pill
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnPrimaryText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
    color: '#FFFFFF',
  },

  // Icon buttons (share / reset) — 52×52 circle
  btnIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D8D8D8',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
