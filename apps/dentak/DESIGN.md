# 無音の演算 — Whisper Scientific Calculator
## アプリ設計書 v1.0

---

## 0. 概要

| 項目 | 内容 |
|------|------|
| アプリ名 | 無音の演算（仮）/ Whisper Calc |
| プラットフォーム | iOS（優先）/ Android（後続） |
| ベース | Expo SDK 54 + TypeScript |
| 音声認識 | on-device Whisper（whisper.rn / CoreML） |
| デザイン哲学 | KOKKAKU + MA / 白黒ミニマル |

**コンセプト**：数式を「話す」ことで入力できる関数電卓。
Whisper をデバイス上で推論することでオフライン・プライバシー完全保護を実現。
モデルは初回自動ダウンロード（tiny 固定）、設定画面で上位モデルに切替可能。

---

## 1. 技術スタック

### Core
| 役割 | ライブラリ | バージョン目安 |
|------|-----------|---------------|
| フレームワーク | Expo SDK | 54 |
| 言語 | TypeScript | 5.x |
| ナビゲーション | React Navigation 7 | — |
| 状態管理 | Zustand | 5.x |
| 計算エンジン | mathjs | 13.x |

### 音声 / AI
| 役割 | ライブラリ | 備考 |
|------|-----------|------|
| Whisper 推論 | `whisper.rn` | CoreML（iOS A12+）対応 |
| 音声録音 | `expo-av` | Whisper へ PCM 渡し |
| ファイル操作 | `expo-file-system` | モデルファイル DL・管理 |
| バックグラウンドDL | `expo-background-fetch` + `expo-file-system` | モデル取得 |

### ストレージ
| 用途 | ライブラリ |
|------|-----------|
| 設定・履歴 | `@react-native-async-storage/async-storage` |
| ファイルパス管理 | `expo-file-system` (documentDirectory) |

### UI
| 役割 | ライブラリ |
|------|-----------|
| アニメーション | `react-native-reanimated` 3 |
| ジェスチャー | `react-native-gesture-handler` |
| セーフエリア | `react-native-safe-area-context` |
| ハプティクス | `expo-haptics` |
| ネットワーク状態 | `@react-native-community/netinfo` |

---

## 2. ディレクトリ構成

expo-mobile-builder 標準構成に準拠。

```
dentak/                              ← モノレポ内アプリルート
├── App.tsx                          # Provider 階層
├── app.json                         # bundleId, permissions, plugins
├── eas.json
├── package.json
├── index.ts
│
└── src/
    ├── navigation/
    │   └── RootNavigator.tsx        # 単一スタック（設定はSheet）
    │
    ├── screens/
    │   ├── calculator/
    │   │   └── CalculatorScreen.tsx # メイン画面（唯一の画面）
    │   └── onboarding/
    │       └── ModelDownloadScreen.tsx  # 初回モデルDL画面
    │
    ├── components/
    │   ├── calculator/
    │   │   ├── Display.tsx          # 結果・式・履歴表示
    │   │   ├── Keyboard.tsx         # キーボード全体
    │   │   ├── SciRow.tsx           # 科学関数行（2nd 切替）
    │   │   ├── NumRow.tsx           # 数字・演算子行
    │   │   └── UtilBar.tsx          # ⌫ ( ) ANS EE 行
    │   ├── voice/
    │   │   ├── VoiceOverlay.tsx     # 録音中オーバーレイ
    │   │   ├── WaveformView.tsx     # ミニ波形アニメーション
    │   │   └── DynamicIsland.tsx    # Dynamic Island 拡張表示
    │   ├── sidebar/
    │   │   ├── Sidebar.tsx          # 左パネル（タブ式）
    │   │   ├── MemoryPane.tsx
    │   │   ├── ConstantsPane.tsx
    │   │   ├── BasePane.tsx
    │   │   └── HistoryPane.tsx
    │   └── settings/
    │       └── SettingsSheet.tsx    # ボトムシート（設定）
    │
    ├── hooks/
    │   ├── useCalculator.ts         # 計算ロジック全体
    │   ├── useWhisper.ts            # 録音 → 推論 → ストリーミング結果
    │   ├── useModelManager.ts       # モデル状態・DL進捗
    │   ├── useSidebar.ts            # サイドバー開閉・スワイプ
    │   └── useHistory.ts            # 計算履歴
    │
    ├── engine/
    │   ├── calculator.ts            # mathjs ラッパー（計算・角度変換）
    │   ├── expressionParser.ts      # 音声入力テキスト → 数式変換
    │   └── baseConverter.ts         # 進数変換ユーティリティ
    │
    ├── whisper/
    │   ├── WhisperManager.ts        # モデル初期化・推論管理シングルトン
    │   ├── StreamingSession.ts      # リアルタイム推論セッション
    │   ├── modelRegistry.ts         # 利用可能モデル定義・URL一覧
    │   └── voiceParser.ts           # Whisper出力 → 計算式 マッピング
    │
    ├── store/
    │   ├── calculatorStore.ts       # Zustand: 計算状態
    │   ├── settingsStore.ts         # Zustand: 設定永続化
    │   └── modelStore.ts            # Zustand: モデル管理状態
    │
    ├── theme/
    │   └── tokens.ts                # 色・サイズ・フォントトークン
    │
    └── utils/
        ├── haptics.ts               # ハプティクスラッパー
        └── formatNumber.ts          # 数値フォーマット（桁区切り・指数）
```

---

## 3. 画面・ナビゲーション設計

### ナビゲーション構造

タブバーなし。単一画面 + モーダル構成。

```
RootNavigator (NativeStack)
├── [初回のみ] ModelDownloadScreen   # whisper-tiny 自動DL
└── CalculatorScreen                 # メイン（常駐）
    ├── Sidebar                      # 左からスライドイン (Reanimated)
    └── SettingsSheet                # 下からスライドアップ (BottomSheet)
```

### 初回起動フロー

```
起動
 └─ modelStore.tinyReady?
      ├─ false → ModelDownloadScreen
      │            └─ DL完了 → CalculatorScreen
      └─ true  → CalculatorScreen
```

### ModelDownloadScreen

- 起動時に whisper-tiny を自動ダウンロード開始（WiFi推奨表示）
- プログレスバー + ファイルサイズ表示（~39 MB）
- 「モバイル通信で続ける」オプション
- DL完了後に自動遷移（SplashScreen延長）

---

## 4. Whisper モデル管理設計

### モデル定義 (`modelRegistry.ts`)

```typescript
export type WhisperModelSize = 'tiny' | 'base' | 'small' | 'medium';

export interface WhisperModel {
  id:          WhisperModelSize;
  label:       string;
  sizeMB:      number;
  ggmlUrl:     string;          // Hugging Face GGML 形式
  coremlUrl:   string;          // iOS CoreML 最適化版
  localPath:   string;          // documentDirectory 内パス
  accuracy:    'fast' | 'balanced' | 'accurate' | 'best';
  minRAM_MB:   number;
}

export const MODEL_REGISTRY: WhisperModel[] = [
  {
    id:        'tiny',
    label:     'Whisper Tiny（初期）',
    sizeMB:    39,
    ggmlUrl:   'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin',
    coremlUrl: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny-encoder.mlmodelc.zip',
    localPath: 'whisper/ggml-tiny.bin',
    accuracy:  'fast',
    minRAM_MB: 128,
  },
  {
    id:        'base',
    label:     'Whisper Base',
    sizeMB:    74,
    ggmlUrl:   'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin',
    coremlUrl: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base-encoder.mlmodelc.zip',
    localPath: 'whisper/ggml-base.bin',
    accuracy:  'balanced',
    minRAM_MB: 256,
  },
  {
    id:        'small',
    label:     'Whisper Small',
    sizeMB:    244,
    ggmlUrl:   'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin',
    coremlUrl: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small-encoder.mlmodelc.zip',
    localPath: 'whisper/ggml-small.bin',
    accuracy:  'accurate',
    minRAM_MB: 512,
  },
  {
    id:        'medium',
    label:     'Whisper Medium',
    sizeMB:    769,
    ggmlUrl:   'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin',
    coremlUrl: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium-encoder.mlmodelc.zip',
    localPath: 'whisper/ggml-medium.bin',
    accuracy:  'best',
    minRAM_MB: 1024,
  },
];
```

### モデルストア (`modelStore.ts`)

```typescript
interface ModelState {
  activeModelId:   WhisperModelSize;       // 現在使用中
  downloadedModels: WhisperModelSize[];    // DL済みモデル一覧
  downloadProgress: Record<WhisperModelSize, number | null>; // 0-1 or null
  isLoading:       boolean;               // Whisper初期化中

  // Actions
  setActiveModel:  (id: WhisperModelSize) => void;
  startDownload:   (id: WhisperModelSize) => Promise<void>;
  deleteModel:     (id: WhisperModelSize) => Promise<void>;
}
```

### ダウンロード実装方針

```
expo-file-system.createDownloadResumable()
  ├─ onProgress callback → modelStore.downloadProgress 更新
  ├─ 中断対応: resumeData を AsyncStorage に保存
  └─ 完了後:
       ├─ CoreML版 (.zip) → unzip → mlmodelc フォルダ配置
       └─ GGML版 (.bin)   → そのまま保存
```

**保存先**: `FileSystem.documentDirectory + 'whisper/'`  
**iCloud Backup 除外**: `Info.plist` で `NSUbiquitousItemIsExcludedFromBackup = true`

---

## 5. 音声認識エンジン設計（ストリーミング）

### アーキテクチャ

```
マイク入力 (expo-av)
  └─ PCM 16kHz mono float32
       └─ WhisperManager.transcribeRealtime()
            ├─ 3秒チャンク推論
            ├─ onNewSegments callback
            │    └─ 部分テキスト → VoiceOverlay に表示（ストリーミング）
            └─ onEnd callback
                 └─ 最終テキスト → voiceParser.parse()
                      └─ 計算式 → calculatorStore に反映
```

### WhisperManager (`WhisperManager.ts`)

```typescript
class WhisperManager {
  private context: WhisperContext | null = null;

  async initialize(modelPath: string): Promise<void>
  // CoreML 有効化（iOS A12+ 自動検出）

  async startStreaming(options: StreamingOptions): Promise<StreamingSession>
  // whisper.rn の transcribeRealtime() をラップ

  async stop(): Promise<void>
  async release(): Promise<void>
}

interface StreamingOptions {
  language:         'ja' | 'en' | 'auto';
  onPartialResult:  (text: string) => void;   // ストリーミング中間結果
  onFinalResult:    (text: string) => void;   // 確定結果
  onError:          (err: Error)  => void;
  maxDurationSec:   number;                   // デフォルト 30s
}
```

### StreamingSession (`StreamingSession.ts`)

```typescript
// whisper.rn の transcribeRealtime ラッパー
async start(): Promise<void>
stop(): void

// 内部動作:
// 1. Whisper context.transcribeRealtime({ realtimeAudioSec: 3 })
// 2. subscribe({ onTranscribe: ({ isCapturing, segments, totalEnergy }) })
// 3. isCapturing === false → 録音終了 → onFinalResult 発火
// 4. segments 変化 → onPartialResult 発火
```

### 音声入力 → 計算式変換 (`voiceParser.ts`)

自然言語の音声入力を計算式にマッピングする変換テーブル。

```typescript
// 日本語パターン例
const JA_PATTERNS: [RegExp, string][] = [
  [/(\d+)\s*かける\s*(\d+)/,   '$1*$2'],
  [/(\d+)\s*わる\s*(\d+)/,     '$1/$2'],
  [/(\d+)\s*たす\s*(\d+)/,     '$1+$2'],
  [/(\d+)\s*ひく\s*(\d+)/,     '$1-$2'],
  [/(\d+)\s*の\s*(\d+)\s*乗/,  'pow($1,$2)'],
  [/ルート\s*(\d+)/,           'sqrt($1)'],
  [/サイン\s*(\d+)/,           'sin($1)'],
  [/コサイン\s*(\d+)/,         'cos($1)'],
  [/タンジェント\s*(\d+)/,     'tan($1)'],
  [/ログ\s*(\d+)/,             'log10($1)'],
  [/(\d+)\s*の\s*階乗/,        'factorial($1)'],
  [/円周率/,                   'PI'],
  [/ネイピア数/,               'E'],
  [/絶対値\s*([+-]?\d+)/,      'abs($1)'],
  // 英語パターン
  [/square root of (\d+)/i,    'sqrt($1)'],
  [/(\d+) to the power of (\d+)/i, 'pow($1,$2)'],
  [/factorial of (\d+)/i,      'factorial($1)'],
];

export function parseVoiceInput(text: string): ParseResult {
  // 1. パターンマッチング
  // 2. mathjs で検証評価
  // 3. 失敗時は元テキストをそのまま返す（フォールバック）
}

interface ParseResult {
  expression: string;
  result:     number | null;
  confidence: 'high' | 'low';
  rawText:    string;
}
```

---

## 6. 計算エンジン設計 (`engine/calculator.ts`)

### mathjs ラッパー

```typescript
import { create, all } from 'mathjs';

const math = create(all);

export interface CalcState {
  display:    string;       // 表示値
  expression: string;       // 式文字列
  history:    HistoryEntry[];
  memory:     number;
  stack:      number[];     // RPN スタック
  angleUnit:  'deg' | 'rad' | 'grad';
  base:       'DEC' | 'HEX' | 'OCT' | 'BIN';
  isSecond:   boolean;      // 2nd モード
}

// 角度変換を考慮した評価
function evaluate(expr: string, angleUnit: AngleUnit): number {
  // mathjs の config({ angleMode }) を動的切替
  math.config({ angleMode: angleUnit });
  return math.evaluate(expr);
}

// 組み込み関数一覧（mathjs が提供）
// sin, cos, tan, asin, acos, atan
// sinh, cosh, tanh
// log, log2, log10, ln (= log)
// sqrt, cbrt, pow, exp
// abs, floor, ceil, round, sign
// factorial, combinations, permutations
// mod, gcd, lcm
```

### 計算精度

- 内部計算: mathjs の BigNumber モード（精度 64 桁）
- 表示: 最大 14 桁 / 指数表記自動切替（`|x| >= 1e13` or `|x| < 1e-7`）

---

## 7. 状態管理設計 (Zustand)

### calculatorStore

```typescript
interface CalculatorStore {
  // 表示状態
  current:    string;        // 現在入力値
  expression: string;        // 式
  history:    HistoryEntry[];

  // 計算状態
  pendingOp:  string | null; // 待機中演算子
  pendingVal: number | null;
  shouldReset: boolean;
  lastAnswer:  number;

  // 拡張状態
  memory:     number;
  stack:      number[];
  openParens: number;        // 未閉じ括弧カウント

  // Actions
  inputDigit:     (d: string) => void;
  inputDot:       () => void;
  setOperator:    (op: string) => void;
  calculate:      () => void;
  applyFunction:  (fn: string) => void;
  applyVoiceResult: (result: ParseResult) => void;
  clear:          () => void;
  backspace:      () => void;
  toggleSign:     () => void;
  percent:        () => void;
}
```

### settingsStore（AsyncStorage 永続化）

```typescript
interface SettingsStore {
  angleUnit:      'deg' | 'rad' | 'grad';
  decimals:       'auto' | 4 | 8;
  useThousandSep: boolean;
  useExpNotation: boolean;
  haptics:        boolean;
  soundFeedback:  boolean;
  voiceLang:      'ja' | 'en' | 'auto';
  voiceReadback:  boolean;
  activeModelId:  WhisperModelSize;

  // Actions（永続化付き）
  setAngleUnit:   (u: AngleUnit) => void;
  setDecimals:    (d: DecimalMode) => void;
  setActiveModel: (id: WhisperModelSize) => void;
  // ...
}
```

---

## 8. コンポーネント設計

### CalculatorScreen レイアウト

```
<SafeAreaView>
  <TopBar>               ← ☰ ボタン / 2ND バッジ / DEG ピル / ⚙ ボタン
  <Display>              ← 履歴2行 / 式 / 結果（大）
    <VoiceOverlay>       ← 録音中に opacity:1（Reanimated）
  <Keyboard>
    <UtilBar>            ← ( ) EE ANS ⌫（高さ 38pt）
    <SciRow 1>           ← 2nd / sin / cos / tan / log  （高さ 50pt）
    <SciRow 2>           ← x² / √ / xⁿ / ln / π        （高さ 50pt）
    <NumRow × 5>         ← AC±%π÷ / 789√× / 456x²− / 123log+ / 0 . 🎤 =
                                                          （高さ 62pt）
</SafeAreaView>
```

### Sidebar レイアウト

```
<PanGestureHandler>      ← 右スワイプで開く / 左スワイプで閉じる
  <Animated.View>        ← translateX アニメーション
    <DragHandle>
    <TabBar>             ← Memory / Consts / Base / History
    <TabContent>
```

### VoiceOverlay 状態遷移

```
idle
  └─[マイク押下]→ requesting_permission
       ├─[拒否]→ idle + Toast「マイク権限が必要です」
       └─[許可]→ listening
                  └─ Whisper ストリーミング開始
                       ├─[部分結果]→ テキスト表示更新
                       ├─[マイク再押下 / タイムアウト]→ processing
                       │    └─[voiceParser完了]→ applied → idle
                       └─[エラー]→ idle + Toast「認識に失敗しました」
```

---

## 9. パーミッション設計

```typescript
// app.json
{
  "ios": {
    "infoPlist": {
      "NSMicrophoneUsageDescription": "音声入力で計算式を入力するために使用します",
      "NSUbiquitousItemIsExcludedFromBackup": true  // モデルファイル
    }
  },
  "plugins": [
    ["expo-av", { "microphonePermission": "音声で計算式を入力するために使用します" }]
  ]
}
```

**マイクパーミッション**: Just-in-Time（初回マイクボタン押下時）

---

## 10. 設定画面 (`SettingsSheet.tsx`)

ボトムシートとして実装。セクション構成：

```
【角度モード】
  DEG / RAD / GRAD  ← セグメントコントロール

【表示】
  小数点以下桁数:  Auto / 4 / 8
  指数表記:        ON/OFF トグル
  千の位区切り:    ON/OFF トグル

【AIモデル選択】（← 今回の目玉）
  各モデルカード:
  ┌─────────────────────────────────┐
  │ [●] Whisper Tiny  39MB  ⚡ 最速  │  ← 現在使用中
  │      ████████████  ダウンロード済 │
  ├─────────────────────────────────┤
  │ [ ] Whisper Base  74MB  ⚖ バランス│
  │      [ダウンロード]               │
  ├─────────────────────────────────┤
  │ [ ] Whisper Small 244MB 🎯 高精度 │
  │      [ダウンロード]               │
  ├─────────────────────────────────┤
  │ [ ] Whisper Medium 769MB ✨ 最高  │
  │      [ダウンロード]               │
  └─────────────────────────────────┘
  ※ DL中はプログレスバー表示 + キャンセルボタン
  ※ DL済みモデルは削除ボタン表示（ストレージ節約）

【音声入力】
  認識言語:  日本語 / English / 自動
  結果を音読: ON/OFF

【操作】
  ハプティクス:       ON/OFF
  サウンドフィードバック: ON/OFF

【データ】
  計算履歴を消去
  設定をリセット
```

---

## 11. モデルダウンロード UX フロー

```
設定 > AIモデル > [ダウンロード] 押下
  └─ WiFi 確認
       ├─ WiFi接続中   → 確認ダイアログなし → 即時DL開始
       └─ モバイル通信  → 「モバイル通信で約 XXX MB を使用します。続けますか？」
                              └─ 続ける → DL開始

DL中:
  ├─ プログレスバー（0→100%）
  ├─ 速度表示（例: 2.3 MB/s）
  ├─ 残り時間推定
  └─ [一時停止 / キャンセル] ボタン

DL完了:
  ├─ CoreML 展開（zip → mlmodelc）
  ├─ Whisper コンテキスト初期化テスト
  └─ 「[モデル名] を使用中に切替ますか？」ダイアログ

エラー:
  └─ resumeData 保存 → 「次回続きからダウンロード」
```

---

## 12. ストレージ使用量

| ファイル | 場所 | サイズ |
|---------|------|--------|
| whisper/ggml-tiny.bin | documentDirectory | 39 MB |
| whisper/ggml-base.bin | documentDirectory | 74 MB |
| whisper/ggml-small.bin | documentDirectory | 244 MB |
| whisper/ggml-medium.bin | documentDirectory | 769 MB |
| 計算履歴 | AsyncStorage | < 1 MB |
| 設定 | AsyncStorage | < 1 KB |

**最大想定**: 全モデルDL時 約 **1.1 GB**  
**実運用**: tiny（39MB）+ 1モデルで通常は 300MB 以下

---

## 13. ビルド設定

### EAS ビルド (`eas.json`)

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": false }
    },
    "preview": {
      "distribution": "internal",
      "ios": { "buildConfiguration": "Release" }
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

### app.json 主要設定

```json
{
  "expo": {
    "name": "無音の演算",
    "slug": "muon-no-enzan",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "jp.dentak.whisper-calc",
      "buildNumber": "1",
      "infoPlist": {
        "NSMicrophoneUsageDescription": "音声で計算式を入力するために使用します"
      }
    },
    "plugins": [
      "expo-av",
      "expo-file-system",
      "expo-haptics"
    ]
  }
}
```

### whisper.rn の Expo 統合

```json
// package.json
"whisper.rn": "^0.3.x"

// app.json plugins
["whisper.rn", { "coremlModel": false }]
// CoreML モデルは実行時に documentDirectory から動的ロード
```

---

## 14. 実装フェーズ計画

### Phase 1: 計算エンジン + UI基盤（推定 1 週間）
- [ ] Expo プロジェクト初期化
- [ ] Zustand ストア構築（calculatorStore / settingsStore）
- [ ] mathjs 計算エンジン実装
- [ ] CalculatorScreen UI（HTML モックを RN に移植）
- [ ] Keyboard / Display / Sidebar / SettingsSheet 実装
- [ ] Reanimated アニメーション（サイドバースワイプ / 2nd 切替）

### Phase 2: Whisper 統合（推定 1 週間）
- [ ] whisper.rn インストール・初期化
- [ ] ModelDownloadScreen 実装（初回 tiny 自動DL）
- [ ] WhisperManager シングルトン実装
- [ ] StreamingSession 実装（transcribeRealtime）
- [ ] VoiceOverlay アニメーション（波形 / Dynamic Island 拡張）
- [ ] voiceParser 実装（日本語パターンマッピング）

### Phase 3: モデル管理 + 設定（推定 3〜4 日）
- [ ] modelStore 実装（DL進捗 / 切替 / 削除）
- [ ] SettingsSheet の AIモデル選択 UI
- [ ] ダウンロード中断・再開（resumeData）
- [ ] モバイル通信警告ダイアログ
- [ ] 設定の全項目実装・AsyncStorage 永続化

### Phase 4: 品質・仕上げ（推定 3〜4 日）
- [ ] ハプティクス全ボタン実装
- [ ] Dynamic Type 対応
- [ ] VoiceOver 対応（accessibilityLabel）
- [ ] エラーハンドリング全状態
- [ ] 実機テスト（音声認識 / CoreML 動作確認）
- [ ] EAS Preview ビルド

---

## 15. 検証ポイント・リスク

| リスク | 確認方法 | 対策 |
|--------|---------|------|
| whisper.rn と Expo SDK 54 の互換性 | Phase 1 で pod install して確認 | RN Bare workflow へ移行を検討 |
| CoreML 速度（A12 以下は遅い） | 実機で tiny を計測（3秒以内が目標） | tiny のみ CoreML 有効化、他は CPU |
| documentDirectory の大容量ファイル制限 | 実機でフルDL確認 | iCloud 自動バックアップ除外必須 |
| voiceParser の認識精度 | テストケース 50件以上で検証 | 認識できない場合はテキスト入力へフォールバック |
| モデル切替時の初期化時間 | 実機で計測 | ローディング状態 UI 必須 |
| ストリーミングのレイテンシ | 3秒チャンクで主観評価 | チャンク長を設定で調整可能に |

---

## 16. 依存パッケージ一覧

```json
{
  "dependencies": {
    "expo": "~54.0.0",
    "react-native": "0.76.x",
    "typescript": "^5.0.0",
    "@react-navigation/native": "^7.0.0",
    "@react-navigation/native-stack": "^7.0.0",
    "react-native-safe-area-context": "^4.10.0",
    "react-native-gesture-handler": "^2.20.0",
    "react-native-reanimated": "^3.16.0",
    "react-native-screens": "^4.0.0",
    "zustand": "^5.0.0",
    "mathjs": "^13.0.0",
    "whisper.rn": "^0.3.0",
    "expo-av": "~15.0.0",
    "expo-file-system": "~18.0.0",
    "expo-haptics": "~14.0.0",
    "@react-native-async-storage/async-storage": "^2.0.0",
    "@react-native-community/netinfo": "^11.0.0",
    "expo-splash-screen": "~0.29.0",
    "expo-status-bar": "~2.0.0"
  }
}
```

---

*設計書バージョン: 1.0 — 2026-04-11*  
*モック参照: `apps/dentak/whisper-calc-mock.html`*
