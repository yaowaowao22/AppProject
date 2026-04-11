import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Feather } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useFaceDetect } from '../editor/useFaceDetect';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Upload'>;
};

const TEN_MB = 10 * 1024 * 1024;

export function UploadScreen({ navigation }: Props) {
  const [selectedUri, setSelectedUri] = useState<string | null>(null);
  const { landmarks, imageWidth, imageHeight, loading, error } = useFaceDetect(selectedUri);

  // 顔検出完了後のハンドリング
  useEffect(() => {
    if (!selectedUri || loading) return;

    if (landmarks != null) {
      navigation.navigate('Editor', {
        imageUri: selectedUri,
        landmarks,
        imageWidth,
        imageHeight,
      });
      setSelectedUri(null);
    } else if (error != null) {
      Alert.alert('顔が検出できませんでした');
      setSelectedUri(null);
    }
  }, [loading, landmarks, error, selectedUri, navigation]);

  const handleImage = useCallback(async (uri: string, fileSize?: number) => {
    let finalUri = uri;
    if (fileSize !== undefined && fileSize > TEN_MB) {
      const resized = await manipulateAsync(
        uri,
        [{ resize: { width: 1920 } }],
        { compress: 0.8, format: SaveFormat.JPEG },
      );
      finalUri = resized.uri;
    }
    setSelectedUri(finalUri);
  }, []);

  const pickFromLibrary = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    await handleImage(asset.uri, asset.fileSize ?? undefined);
  }, [handleImage]);

  const takePhoto = useCallback(async () => {
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (result.canceled) return;
    const asset = result.assets[0];
    await handleImage(asset.uri, asset.fileSize ?? undefined);
  }, [handleImage]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* ── NavBar ── */}
      <View style={styles.navBar}>
        {/* 左ダミー（タイトル中央寄せ用） */}
        <View style={styles.navBtnEmpty} />
        <Text style={styles.navTitle}>Ratio</Text>
        <Pressable style={styles.navBtn} hitSlop={8}>
          <Feather name="user" size={18} color="#111111" />
        </Pressable>
      </View>

      {/* ── Upload Zone ── */}
      <Pressable
        style={styles.uploadZone}
        onPress={pickFromLibrary}
        disabled={loading}
      >
        {/* φ 円ヒント（薄いゴールドボーダー） */}
        <View style={styles.phiCircleSm} pointerEvents="none" />
        <View style={styles.phiCircleLg} pointerEvents="none" />

        {/* アイコン */}
        <View style={styles.uploadIconWrap}>
          {loading ? (
            <ActivityIndicator color="#AAAAAA" />
          ) : (
            <Feather name="image" size={32} color="#AAAAAA" />
          )}
        </View>

        {/* テキスト */}
        <View>
          <Text style={styles.uploadTitle}>写真をアップロード</Text>
          <Text style={styles.uploadDesc}>
            {'顔・動物の顔が含まれる画像\n黄金比に合わせて加工します'}
          </Text>
        </View>
      </Pressable>

      {/* ── アクションボタン ── */}
      <View style={styles.uploadActions}>
        <Pressable
          style={[styles.btnPrimary, loading && styles.btnDisabled]}
          onPress={pickFromLibrary}
          disabled={loading}
        >
          <Feather name="upload" size={18} color="#FFFFFF" />
          <Text style={styles.btnPrimaryText}>ライブラリから選択</Text>
        </Pressable>
        <Pressable
          style={[styles.btnSecondary, loading && styles.btnDisabled]}
          onPress={takePhoto}
          disabled={loading}
        >
          <Feather name="camera" size={18} color="#111111" />
          <Text style={styles.btnSecondaryText}>カメラで撮影</Text>
        </Pressable>
      </View>

      {/* ── φ ストリップ ── */}
      <View style={styles.phiStrip}>
        <View style={styles.phiBadge}>
          <Text style={styles.phiBadgeText}>φ 1.618</Text>
        </View>
        <Text style={styles.phiCaption}>
          {'顔の比率を解析して黄金比に\n近づくよう自動加工します'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // ── NavBar
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 21,
    paddingHorizontal: 34,
    paddingBottom: 13,
  },
  navBtnEmpty: {
    width: 34,
    height: 34,
    opacity: 0,
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

  // ── Upload Zone
  uploadZone: {
    flex: 1,
    marginHorizontal: 34,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: '#D8D8D8',
    borderRadius: 20,
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 21,
    // overflow hidden で φ 円を枠内にクリップ
    overflow: 'hidden',
  },
  // φ 円 — 200px（opacity 相当: rgba alpha で制御）
  phiCircleSm: {
    position: 'absolute',
    width: 200,
    height: 200,
    top: '50%',
    left: '50%',
    marginTop: -100,
    marginLeft: -100,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(200,169,110,0.12)',
  },
  // φ 円 — 324px
  phiCircleLg: {
    position: 'absolute',
    width: 324,
    height: 324,
    top: '50%',
    left: '50%',
    marginTop: -162,
    marginLeft: -162,
    borderRadius: 162,
    borderWidth: 1,
    borderColor: 'rgba(200,169,110,0.06)',
  },
  uploadIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
    color: '#111111',
    textAlign: 'center',
    marginBottom: 6,
  },
  uploadDesc: {
    fontSize: 13,
    color: '#AAAAAA',
    lineHeight: 13 * 1.6,
    textAlign: 'center',
  },

  // ── Action Buttons
  uploadActions: {
    flexDirection: 'column',
    gap: 13,
    paddingVertical: 21,
    paddingHorizontal: 34,
  },
  btnPrimary: {
    height: 52,
    backgroundColor: '#111111',
    borderRadius: 100,
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
  btnSecondary: {
    height: 52,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D8D8D8',
    borderRadius: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnSecondaryText: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.2,
    color: '#111111',
  },
  btnDisabled: {
    opacity: 0.5,
  },

  // ── φ Strip
  phiStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 13,
    paddingHorizontal: 34,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  phiBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(200,169,110,0.1)',
    borderRadius: 4,
  },
  phiBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#C8A96E',
  },
  phiCaption: {
    fontSize: 11,
    color: '#AAAAAA',
    lineHeight: 11 * 1.5,
    flexShrink: 1,
  },
});
