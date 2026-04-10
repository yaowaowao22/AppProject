# Ratio — 黄金比フェイスエディター 設計書

> φ = 1.618 を照射し、顔を黄金比へと変形させる鏡。  
> **保守費 $0/月** を技術選定の最優先制約とする。

---

## 0. 保守費ゼロ設計の原則

| 禁止事項 | 理由 |
|---------|------|
| バックエンドサーバー（EC2/Cloud Run等） | 月額固定費が発生 |
| 有料AI API（OpenAI Vision等） | トークン従量課金 |
| RDB / NoSQLクラウドDB | ストレージ課金 |
| CDN / S3 画像ホスティング | 転送量課金 |

**解法**: 全処理をデバイス内で完結させる（on-device AI + local storage）。  
クラウドに触れるのは EAS Build（ビルドのみ）と App Store 配信のみ。

---

## 1. アプリ概要

| 項目 | 内容 |
|-----|------|
| アプリ名 | Ratio |
| 対象 | iOS（iPhone専用、iPad非対応） |
| 機能 | 顔・動物顔の写真を黄金比に合わせて画像加工して返す |
| 保存先 | ローカルのみ（カメラロール + App内ストレージ） |
| ネットワーク | 不要（完全オフライン動作） |
| 収益化 | 将来的にAdMob / RevenueCat（スキル対応済み）— 初期は無料 |

---

## 2. システムアーキテクチャ

```
┌─────────────────────────────────────────────┐
│                 iPhone (on-device)           │
│                                              │
│  ┌──────────────┐    ┌────────────────────┐ │
│  │  UI Layer    │    │   Processing Layer │ │
│  │  React Native│───▶│                    │ │
│  │  + Skia      │    │  expo-face-detector│ │
│  │              │◀───│  (ML Kit, 顔検出)  │ │
│  └──────────────┘    │                    │ │
│         │            │  react-native-skia │ │
│         │            │  (画像変形・描画)  │ │
│         │            └────────────────────┘ │
│         │                                   │
│         ▼                                   │
│  ┌──────────────┐    ┌────────────────────┐ │
│  │ Storage Layer│    │  Output Layer      │ │
│  │  AsyncStorage│    │  expo-image-       │ │
│  │  (履歴metadata)│  │  manipulator       │ │
│  │  FileSystem  │    │  (PNG書き出し)     │ │
│  │  (画像キャッシュ)│  │  expo-media-library│ │
│  └──────────────┘    │  (カメラロール保存)│ │
│                      └────────────────────┘ │
└─────────────────────────────────────────────┘

外部接続: なし（ビルド時のみ EAS Cloud）
```

---

## 3. 技術スタック

### Core

| ライブラリ | バージョン目安 | 役割 | 保守費 |
|-----------|-------------|------|------|
| Expo SDK | 52+ | ベース、managed workflow | $0 |
| React Native | 0.76+ | UIフレームワーク | $0 |
| TypeScript | 5.x | 型安全 | $0 |

### 顔検出・画像処理（保守費ゼロの核心）

| ライブラリ | 役割 | 保守費 | 選定理由 |
|-----------|------|------|--------|
| `expo-face-detector` | 顔ランドマーク検出（目/鼻/口/輪郭座標取得） | $0 | Google ML Kit オンデバイス、ネット不要 |
| `@shopify/react-native-skia` | 画像ワープ変形・φグリッド描画 | $0 | GPU描画、ピクセル操作、Skia Meshで顔変形 |
| `expo-image-manipulator` | 最終画像の圧縮・PNG出力 | $0 | Expo公式、managed対応 |
| `expo-media-library` | カメラロールへの保存 | $0 | Expo公式 |
| `expo-image-picker` | ライブラリ/カメラからの画像取得 | $0 | Expo公式 |
| `expo-camera` | カメラ撮影 | $0 | Expo公式 |

### ストレージ

| ライブラリ | 役割 | 保守費 |
|-----------|------|------|
| `@react-native-async-storage/async-storage` | 履歴メタデータ（スコア・日時・強度） | $0 |
| `expo-file-system` | 加工済み画像のアプリ内キャッシュ | $0 |

### ナビゲーション・UI

| ライブラリ | 役割 |
|-----------|------|
| `@react-navigation/native` | スタック + タブナビゲーション |
| `@react-navigation/bottom-tabs` | タブバー |
| `@react-navigation/native-stack` | 画面遷移 |

### ビルド・配信

| ツール | 役割 | 保守費 |
|-------|------|------|
| EAS Build | iOS IPAビルド | $0（Free tier: 30回/月） |
| EAS Submit | App Store提出自動化 | $0 |
| App Store | 配信 | $99/年（Apple Developer必須） |

---

## 4. ディレクトリ構成

```
src/
├── navigation/
│   ├── RootNavigator.tsx        # タブ + スタック統合
│   └── types.ts                 # 画面パラメータ型
│
├── screens/
│   ├── upload/
│   │   └── UploadScreen.tsx     # 写真選択・カメラ起動
│   ├── editor/
│   │   ├── EditorScreen.tsx     # Before/After + スライダー
│   │   ├── useGoldenRatio.ts    # φ計算フック
│   │   ├── useFaceDetect.ts     # expo-face-detector ラッパー
│   │   └── useSkiaWarp.ts       # Skia変形ロジック
│   └── history/
│       └── HistoryScreen.tsx    # 加工履歴一覧
│
├── components/
│   ├── PhiGrid.tsx              # φグリッドオーバーレイ（Skia）
│   ├── BeforeAfterToggle.tsx    # Before/After切り替え
│   ├── AdjustmentSlider.tsx     # 補正強度スライダー
│   └── ScoreBadge.tsx           # φ適合度バッジ
│
├── hooks/
│   └── useHistory.ts            # AsyncStorage履歴管理
│
├── utils/
│   ├── goldenRatio.ts           # φ計算ユーティリティ
│   ├── faceMapper.ts            # ランドマーク → 補正量変換
│   └── imageExport.ts           # PNG書き出しヘルパー
│
└── types/
    ├── face.ts                  # FaceLandmark型定義
    └── history.ts               # HistoryRecord型定義
```

---

## 5. データフロー（完全オンデバイス）

```
[ユーザー操作]
     │
     ▼
expo-image-picker / expo-camera
     │  uri (local file path)
     ▼
expo-face-detector.detectFacesAsync(uri)
     │  FaceDetectionResult {
     │    leftEyePosition, rightEyePosition,
     │    noseBasePosition, bottomMouthPosition,
     │    leftEarPosition, rightEarPosition, ...
     │  }
     ▼
goldenRatio.ts: calcDeviations(landmarks)
     │  PhiDeviations {
     │    eyeSpacing: { actual: 1.45, target: 1.618, delta: +6px },
     │    faceHeight: { actual: 1.71, target: 1.618, delta: -5px },
     │    ...
     │    score: 83  // 0–100 適合度
     │  }
     ▼
useSkiaWarp.ts: buildWarpMesh(image, deviations, intensity)
     │  Skia Mesh (ControlPoints変形マトリクス)
     │  ※ intensity スライダー値 0–100% を乗算
     ▼
PhiGrid + SkiaCanvas → リアルタイムプレビュー（After）
     │
     ▼ [保存ボタン]
expo-image-manipulator.manipulateAsync(skiaSnapshot)
     │  PNG buffer
     ▼
expo-media-library.saveToLibraryAsync(pngUri)  ← カメラロール保存
     │
     ▼
AsyncStorage: 履歴レコード追記
     {
       id, date, thumbnail, score, intensity,
       deviations, originalUri, processedUri
     }
```

---

## 6. 黄金比計算仕様

### 検出する顔ランドマーク（expo-face-detector 提供）

| ランドマーク | 用途 |
|-----------|------|
| `leftEyePosition` / `rightEyePosition` | 目の間隔比率 |
| `noseBasePosition` | 鼻の幅・位置 |
| `bottomMouthPosition` | 口の位置 |
| `leftEarPosition` / `rightEarPosition` | 顔幅 |
| `leftCheekPosition` / `rightCheekPosition` | 顔の輪郭幅 |

### φ比率チェック項目

```typescript
// utils/goldenRatio.ts

const PHI = 1.618033988749895;

type PhiCheck = {
  label: string;
  actual: number;   // 実測比率
  target: number;   // φ目標値
  delta: number;    // 補正量 (px)
  score: number;    // 0–100
};

function calcDeviations(landmarks: FaceLandmarks): PhiDeviations {
  const faceWidth = dist(landmarks.leftEar, landmarks.rightEar);
  const faceHeight = dist(topOfHead, landmarks.bottomMouth);
  const eyeWidth = dist(landmarks.leftEye, landmarks.rightEye);
  const noseWidth = calcNoseWidth(landmarks);
  const mouthWidth = calcMouthWidth(landmarks);

  return {
    // 1. 顔の縦横比 (目標: φ)
    faceAspect: check(faceHeight / faceWidth, PHI),
    // 2. 目幅 / 顔幅 (目標: 1/φ² = 0.382)
    eyeToFace: check(eyeWidth / faceWidth, 1 / (PHI * PHI)),
    // 3. 鼻幅 / 口幅 (目標: 1/φ)
    noseToMouth: check(noseWidth / mouthWidth, 1 / PHI),
    // 4. 眉間〜鼻先 / 鼻先〜顎 (目標: φ)
    noseRatio: check(browToNose / noseToJaw, PHI),
    // 5. 顔幅 / 目幅 (目標: φ×φ = φ²)
    faceToEye: check(faceWidth / eyeWidth, PHI * PHI),
  };
}
```

### Skia Mesh Warp（画像変形）

```typescript
// hooks/useSkiaWarp.ts
import { Skia, ImageShader, Vertices } from '@shopify/react-native-skia';

// 顔の制御点をφターゲットに向けて移動させるメッシュを生成
// intensity: 0.0–1.0 (スライダー値)
function buildWarpMesh(
  deviations: PhiDeviations,
  intensity: number
): WarpMesh {
  // 元画像の制御点グリッド（例: 8×10）
  const sourcePoints = buildGrid(imageW, imageH, 8, 10);

  // 顔ランドマーク周辺の制御点を補正量 × intensity だけ移動
  const destPoints = sourcePoints.map(pt => {
    const correction = calcCorrection(pt, deviations, intensity);
    return { x: pt.x + correction.dx, y: pt.y + correction.dy };
  });

  return { sourcePoints, destPoints };
}
```

---

## 7. 画面仕様

### Screen 1: Upload

| 要素 | 仕様 |
|-----|------|
| 画像入力 | `expo-image-picker`（ライブラリ） / `expo-camera`（撮影） |
| 対応形式 | JPEG / PNG / HEIC |
| 最大サイズ | 10MB（それ以上はリサイズして処理） |
| エラー | 顔検出失敗時「顔が検出できませんでした」アラート |

### Screen 2: Editor（メイン画面）

| 要素 | 仕様 |
|-----|------|
| Before/After | セグメントコントロール切り替え |
| φグリッド | 61.8% / 38.2% の格子線（Skia描画） |
| 補正チップ | 各部位の補正量を画像上に表示（例: 「目 +2px」） |
| スコアバッジ | 右下固定、0–100% φ適合度 |
| 補正強度マスター | 全体強度 0–100%（ゴールドスライダー） |
| 部位別スライダー | 目の間隔 / 顎ライン / 鼻幅 / 口の位置（各 ±20px 範囲） |
| 保存 | `expo-media-library` でカメラロールへ保存 |
| シェア | `expo-sharing` でネイティブ共有シート |
| リセット | 強度を0に戻す（元画像に戻る） |

### Screen 3: History

| 要素 | 仕様 |
|-----|------|
| データ | AsyncStorage から読み込み |
| サムネイル | `expo-file-system` キャッシュから表示 |
| 表示項目 | サムネイル / 名前(日時) / 加工強度 / φ適合スコア |
| 削除 | スワイプで削除（AsyncStorage + FileSystem 両方削除） |

---

## 8. 型定義

```typescript
// types/face.ts
export interface FaceLandmarks {
  leftEyePosition: Point;
  rightEyePosition: Point;
  noseBasePosition: Point;
  bottomMouthPosition: Point;
  leftEarPosition: Point;
  rightEarPosition: Point;
  leftCheekPosition: Point;
  rightCheekPosition: Point;
}

export interface PhiDeviation {
  label: string;
  actual: number;
  target: number;
  deltaPixels: number;
  score: number;   // 0–100
}

export interface PhiDeviations {
  faceAspect: PhiDeviation;
  eyeToFace: PhiDeviation;
  noseToMouth: PhiDeviation;
  noseRatio: PhiDeviation;
  faceToEye: PhiDeviation;
  totalScore: number;   // 0–100 (加重平均)
}

// types/history.ts
export interface HistoryRecord {
  id: string;
  createdAt: string;       // ISO8601
  label: string;           // 「自撮り」など
  thumbnailPath: string;   // FileSystem local path
  processedPath: string;   // FileSystem local path
  score: number;           // 0–100
  intensity: number;       // 0–100
  deviations: PhiDeviations;
}
```

---

## 9. ナビゲーション構成

```
RootNavigator (BottomTabs)
├── 加工タブ (EditorStack)
│   ├── UploadScreen        ← 初期画面
│   └── EditorScreen        ← 加工・結果
└── 履歴タブ (HistoryStack)
    ├── HistoryScreen        ← 一覧
    └── HistoryDetailScreen  ← 再編集（Before/After閲覧）
```

---

## 10. Provider 階層

```tsx
// App.tsx
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootNavigator />
    </GestureHandlerRootView>
  );
}
// ※ 認証・課金・テーマ不要 → Provider は最小構成
```

---

## 11. 実装フェーズ

### Phase 1 — MVP（最速リリース）

| # | タスク | ライブラリ |
|---|------|-----------|
| 1 | プロジェクト初期化（Expo managed + TS） | `create-expo-app` |
| 2 | 画像選択・カメラ起動 | `expo-image-picker` |
| 3 | 顔ランドマーク検出 | `expo-face-detector` |
| 4 | φ計算ユーティリティ実装 | 純粋TypeScript |
| 5 | Skia キャンバスでφグリッド描画 | `react-native-skia` |
| 6 | Before/After 切り替え（グリッドON/OFF） | — |
| 7 | スコアバッジ表示 | — |
| 8 | PNG保存（カメラロール） | `expo-media-library` |
| 9 | 履歴（AsyncStorage） | `async-storage` |

**Phase 1の加工**: グリッドオーバーレイ合成のみ（ピクセル変形なし）。  
ユーザーは「黄金比の線と自分の顔がどう違うか」を視覚的に確認できる。

### Phase 2 — 実ピクセル変形（本命）

| # | タスク | ライブラリ |
|---|------|-----------|
| 1 | Skia Mesh Vertices で制御点グリッド構築 | `react-native-skia` |
| 2 | ランドマーク → 制御点変位量の計算 | 純粋TypeScript |
| 3 | マスタースライダー（強度）リアルタイム反映 | — |
| 4 | 部位別スライダー（個別補正量） | — |
| 5 | 変形後画像のスナップショット書き出し | `react-native-skia` |

### Phase 3 — 品質向上

- 顔検出失敗時のフォールバックUI
- 動物顔対応（ML Kit は動物顔には非対応 → Phase 3で別ライブラリ検討）
- 共有機能（`expo-sharing`）
- オンボーディング画面

---

## 12. コスト分析

### 月額ランニングコスト

| 項目 | 費用 |
|-----|-----|
| サーバー | $0（不使用） |
| データベース | $0（ローカルのみ） |
| AI API | $0（on-device ML Kit） |
| CDN / Storage | $0（端末内ストレージ） |
| プッシュ通知 | $0（不使用） |
| EAS Build | $0（Free: 月30ビルド） |
| **合計** | **$0/月** |

### 初期コスト（単発）

| 項目 | 費用 |
|-----|-----|
| Apple Developer Program | $99/年 |
| **合計** | **$99/年（= $8.25/月相当）** |

### 将来の収益化オプション（保守費増加なし）

| 手段 | 追加保守費 |
|-----|----------|
| AdMob リワード広告 | $0（SDK組み込み、課金なし） |
| RevenueCat サブスク | $0（Free tier〜月$500まで無料） |

---

## 13. 制約・リスク

| リスク | 内容 | 対策 |
|------|------|------|
| ⚠️ 顔検出精度 | expo-face-detector（ML Kit）はランドマーク数が限定的（≠468点フルメッシュ） | Phase 2でTensorFlow.js + MediaPipeへ移行検討 |
| ⚠️ 動物顔非対応 | ML KitはHuman Faceのみ対応 | Phase 3: on-device TFLiteモデル（YOLOv8-face等）を同梱 |
| ⚠️ Skia Mesh学習コスト | Vertices APIはドキュメントが薄い | Skia公式C++ドキュメントを参照しながら実装 |
| ⚠️ 処理時間 | Mesh変形は大画像で重くなる可能性 | 処理前に1080px以下にリサイズ |
| ⚠️ EAS Free Buildの上限 | 月30ビルドまで | 開発中はLocal Build（`npx expo run:ios`）を優先 |

---

## 14. package.json（主要依存）

```json
{
  "dependencies": {
    "expo": "~52.0.0",
    "react": "18.3.2",
    "react-native": "0.76.5",
    "expo-face-detector": "~13.0.0",
    "expo-image-picker": "~15.0.0",
    "expo-image-manipulator": "~13.0.0",
    "expo-media-library": "~16.0.0",
    "expo-file-system": "~17.0.0",
    "expo-sharing": "~12.0.0",
    "expo-camera": "~15.0.0",
    "@shopify/react-native-skia": "~1.5.0",
    "@react-navigation/native": "^6.1.0",
    "@react-navigation/native-stack": "^6.9.0",
    "@react-navigation/bottom-tabs": "^6.5.0",
    "@react-native-async-storage/async-storage": "~2.0.0",
    "react-native-gesture-handler": "~2.20.0",
    "react-native-safe-area-context": "^4.12.0",
    "react-native-screens": "^4.4.0"
  }
}
```

---

## 15. eas.json

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": true }
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "ascAppId": "TBD",
        "appleTeamId": "TBD"
      }
    }
  }
}
```

---

*Design: Ratio Silence (比の静寂) — ma-no-kozo DDP準拠*  
*KOKKAKU primary / MA secondary — Tschichold × Ive × Hara × Rams*
