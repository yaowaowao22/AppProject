#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""expo-mobile-builder.md にfitnessアプリのナレッジを統合するパッチスクリプト

適用パッチ:
  B: セクション7「テーマシステム」全体置換（AppThemeColors型・コントラスト調整・フォントスケーリング）
  E: セクション10にruntimeVersionポリシー選択フローチャートを挿入
  A: セクション14「テスト戦略（jest-expo）」末尾追記
  C: セクション15「iOS Widget連携（@bacons/apple-targets）」末尾追記
  D: セクション16「BottomSheet + キーボード回避」末尾追記
  F: セクション17「文字化け対策（Windows/PowerShell環境）」末尾追記

冪等性: 各パッチは対象テキストが既存の場合スキップする。
エラー時: WARNING を出力して継続する（sys.exit() しない）。
"""

SKILL_PATH = 'C:/Users/ytata/.claude/skills/expo-mobile-builder.md'

with open(SKILL_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

original_len = len(content)

# ─────────────────────────────────────────────────────────────
# Section B: セクション7「テーマシステム」全体置換
# ─────────────────────────────────────────────────────────────
OLD_SEC7 = """\
## 7. テーマシステム

### テーマ定義

```typescript
interface AppTheme {
  id: string;
  label: string;
  gradient: [string, string];   // ヒーローカード背景
  accent: string;               // プライマリアクション色
  accentLight: string;          // バッジ・軽いアクセント
}
```

### テーマ適用パターン
- `useThemeColors()` でテーマ依存の色を取得
- グラデーションは `expo-linear-gradient` を使用
- テーマIDは AsyncStorage に永続化
- 基本カラーパレット（spacing, radius, shadows）はテーマ非依存"""

NEW_SEC7 = """\
## 7. テーマシステム

### カラートークン型

```typescript
interface AppThemeColors {
  background: string;  surface1: string;  surface2: string;
  textPrimary: string; textSecondary: string; textTertiary: string;
  accent: string;      accentDim: string;
  onAccent: string;    // accent背景上のテキスト色
  scrim: string;       // モーダルバックドロップ
  tabBarBg: string;    tabBarBorder: string;
  cardBackground?: string;  // ライト=白, ダーク=surface1（自動導出）
  success: string;     separator: string;  error: string;
}
```

### テーマ適用パターン
- `useTheme()` で `colors`, `setTheme`, `contrastSettings`, `fontSettings`, `typography` を取得
- テーマIDは AsyncStorage に永続化（`@app_theme_id`）
- 基本トークン（spacing, radius, shadows）はテーマ非依存

### コントラスト調整スライダー

スライダー値 0–100（中央50=変化なし）で背景明度・アクセント彩度を動的調整。

```typescript
interface ContrastSettings {
  baseLightness: number;    // 0-100, 50=変化なし → 背景/surface明度を ±20%
  accentSaturation: number; // 0-100, 50=変化なし → アクセント彩度を ±30%
}

function applyContrast(colors: AppThemeColors, s: ContrastSettings): AppThemeColors {
  const lDelta = (s.baseLightness - 50) * 0.4;    // -20 〜 +20
  const sDelta = (s.accentSaturation - 50) * 0.6; // -30 〜 +30
  return {
    ...colors,
    background: adjustHexLightness(colors.background, lDelta),
    surface1:   adjustHexLightness(colors.surface1,   lDelta),
    surface2:   adjustHexLightness(colors.surface2,   lDelta),
    accent:     adjustHexSaturation(colors.accent,    sDelta),
  };
}
```

`colors` は `useMemo(() => applyContrast(base, contrastSettings), [themeId, contrastSettings])` で導出。
コントラスト設定も AsyncStorage に永続化（テーマと独立したキー）。

### フォント動的スケーリング

```typescript
interface FontSettings {
  fontSizeScale: number;         // 0-100, 40=1.0x (scale = 0.80 + val * 0.005)
  fontWeightLevel: -1 | 0 | 1;  // -1=細め, 0=標準, +1=太め
  fontFamily: 'system' | 'serif' | 'mono';
}
// fontSizeScale 換算: 0→0.80x, 40→1.00x, 100→1.30x
```

フォント設定は ThemeContext に同居させ、`typography` オブジェクトとして expose する。

### 高コントラストライトテーマ

アクセシビリティ・屋外用途向けに純白背景＋黒テキストの専用プリセットを用意：
- `seppaku` (雪白) — 純白・最高コントラスト
- `geppaku_light` (月白) — クール系高コントラスト
- `shirayuki` (白雪) — ウォーム系高コントラスト

`isLight: true` フラグで `cardBackground` を `#FFFFFF` に自動切替（ThemeContextで処理）。
HIG準拠のテーマ設計はios-uiuxスキルを参照。"""

if 'interface AppThemeColors' not in content:
    if OLD_SEC7 in content:
        content = content.replace(OLD_SEC7, NEW_SEC7)
        print('Section B (sec7): replaced OK')
    else:
        print('WARNING: Section B (sec7): OLD text not found, skipping')
        idx = content.find('## 7.')
        if idx >= 0:
            print(repr(content[idx:idx+200]))
else:
    print('Section B (sec7): already applied, skipping')

# ─────────────────────────────────────────────────────────────
# Section E: セクション10「runtimeVersionポリシー選択フローチャート」挿入
# 挿入位置: appVersionポリシーブロックの後、⚠️ fingerprintの直前
# ─────────────────────────────────────────────────────────────
OLD_SEC10_BLOCK = """\
- ネイティブ変更（新モジュール追加・app.jsonのplugins変更等）→ `version`を上げてから`eas build`

**⚠️ fingerprintポリシーはpnpmモノレポ非推奨：**"""

NEW_SEC10_BLOCK = """\
- ネイティブ変更（新モジュール追加・app.jsonのplugins変更等）→ `version`を上げてから`eas build`

### runtimeVersionポリシー選択フローチャート

選択基準フローチャート（テキストベース）:
  pnpmモノレポ? → YES → appVersionポリシー一択
               → NO  → チームがWindows/Linux混在? → fingerprintリスクあり
appVersionポリシー運用ルール:
  1. JSのみ変更 → eas update（versionそのまま）
  2. ネイティブ変更 → version上げ → eas build
  3. versionを上げずにeas buildしない（OTA配信範囲がずれる）
OTA診断情報の画面表示パターン（Updates.updateId, Updates.runtimeVersion の表示コンポーネント）

**⚠️ fingerprintポリシーはpnpmモノレポ非推奨：**"""

if '### runtimeVersionポリシー選択フローチャート' not in content:
    if OLD_SEC10_BLOCK in content:
        content = content.replace(OLD_SEC10_BLOCK, NEW_SEC10_BLOCK)
        print('Section E (sec10 insert): applied OK')
    else:
        print('WARNING: Section E (sec10 insert): OLD text not found, skipping')
        idx = content.find('appVersionポリシー')
        if idx >= 0:
            print(repr(content[idx:idx+300]))
else:
    print('Section E (sec10 insert): already applied, skipping')

# ─────────────────────────────────────────────────────────────
# Section A: セクション14「テスト戦略（jest-expo）」末尾追記
# ─────────────────────────────────────────────────────────────
SEC14 = """

---

## 14. テスト戦略（jest-expo）

### jest.config.js セットアップ

```js
/** @type {import('jest-expo/jest-preset').JestPreset} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*|@unimodules/.*|@massapp/.*)',
  ],
  moduleNameMapper: {
    '^@massapp/(.*)$': '<rootDir>/../../packages/$1/src/index.ts',  // モノレポ内パッケージ解決
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/docs/**',
  ],
};
```

### モック戦略

ネイティブ依存モジュールは `jest.mock()` で差し替える。プロバイダー階層テストのパターン：

```typescript
const renderLog: string[] = [];
jest.mock('../ThemeContext', () => ({
  TanrenThemeProvider: ({ children }) => {
    renderLog.push('TanrenThemeProvider');
    return children;
  },
  useTheme: () => ({ colors: { background: '#111113' } }),
}));
jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({ children }) => children,
}));
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }) => children,
}));
```

- `jest.isolateModules()` + `jest.resetModules()` で ErrorBoundary テスト（モジュール状態リセット）
- AsyncStorage: `@react-native-async-storage/async-storage/jest/async-storage-mock` を setupFiles に登録
- SecureStore: `jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn() }))`
"""

if '## 14. テスト戦略' not in content:
    content = content.rstrip('\n') + '\n' + SEC14
    print('Section A (sec14): appended OK')
else:
    print('Section A (sec14): already applied, skipping')

# ─────────────────────────────────────────────────────────────
# Section C: セクション15「iOS Widget連携（@bacons/apple-targets）」末尾追記
# ─────────────────────────────────────────────────────────────
SEC15 = """

---

## 15. iOS Widget連携（@bacons/apple-targets）

### セットアップ

```bash
npx expo install @bacons/apple-targets
```

```json
// app.json plugins
["@bacons/apple-targets"],
["@bacons/apple-targets/app-groups", {
  "entitlements": { "com.apple.security.application-groups": ["group.com.example.app"] }
}]
```

### Widget Extension 構成

```
targets/widget/
├── expo-target.config.js   # ターゲット設定（bundleId, deploymentTarget）
├── Info.plist
└── index.swift             # SwiftUI Widget本体
```

```js
// targets/widget/expo-target.config.js
module.exports = {
  type: 'widget',
  name: 'AppWidget',
  bundleIdentifier: 'com.example.app.widget',
  deploymentTarget: '16.0',
  entitlements: {
    'com.apple.security.application-groups': ['group.com.example.app'],
  },
};
```

### App Groups UserDefaultsブリッジ（カスタムExpoモジュール）

メインアプリ→ウィジェットへのデータ渡しはネイティブモジュールで App Group UserDefaultsに書き込む：

```swift
// modules/AppWidgetBridge/ios/AppWidgetBridgeModule.swift
import ExpoModulesCore
import WidgetKit

public class AppWidgetBridgeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("AppWidgetBridge")
    Function("updateWidgetData") { (jsonString: String) in
      let defaults = UserDefaults(suiteName: "group.com.example.app")
      defaults?.set(jsonString, forKey: "widgetData")
      WidgetCenter.shared.reloadAllTimelines()
    }
  }
}
```

```typescript
// src/hooks/useWidgetSync.ts
import { updateWidgetData } from '../modules/AppWidgetBridge';

export function useWidgetSync(data: WidgetData) {
  useEffect(() => {
    updateWidgetData(JSON.stringify(data));
  }, [data]);
}
```

### SwiftUI側でのデータ読み込み

```swift
struct WidgetProvider: TimelineProvider {
  func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
    let defaults = UserDefaults(suiteName: "group.com.example.app")
    let jsonString = defaults?.string(forKey: "widgetData") ?? "{}"
    // JSON → Entry に変換して completion
  }
}
```

**iOS 16/17 互換**: `deploymentTarget: '16.0'` 設定後、iOS 17+ の `.containerBackground` 等は
`if #available(iOS 17.0, *) { }` で条件分岐。ビルドターゲット設定を忘れると実機でクラッシュする。
"""

if '## 15. iOS Widget連携' not in content:
    content = content.rstrip('\n') + '\n' + SEC15
    print('Section C (sec15): appended OK')
else:
    print('Section C (sec15): already applied, skipping')

# ─────────────────────────────────────────────────────────────
# Section D: セクション16「BottomSheet + キーボード回避」末尾追記
# ─────────────────────────────────────────────────────────────
SEC16 = """

---

## 16. BottomSheet + キーボード回避

`@gorhom/bottom-sheet` を使わず、Modal + Animated + KeyboardAvoidingView のシンプル実装が安定する。

### 構造パターン

```typescript
export function BottomSheet({ visible, onClose, children }) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(600)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 600, duration: 220, useNativeDriver: true }),
      ]).start(() => setMounted(false));
    }
  }, [visible]);

  if (!mounted && !visible) return null;

  return (
    <Modal transparent visible={mounted} animationType="none" statusBarTranslucent onRequestClose={onClose}>
      {/* オーバーレイ: KAV の外に出す（背面タップで close） */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.65)', opacity: overlayOpacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      {/* KAV はシートのみ包む。pointerEvents="box-none" でオーバーレイタップを通す */}
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: 'flex-end' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        pointerEvents="box-none"
      >
        <Animated.View style={{ paddingBottom: insets.bottom + 8, transform: [{ translateY }] }}>
          <ScrollView bounces={false} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
```

### キーポイント

| 設定 | 理由 |
|------|------|
| `pointerEvents="box-none"` on KAV | KAV自身のタップを無効化してオーバーレイタップを通す |
| `keyboardShouldPersistTaps="handled"` | キーボード表示中でもボタンを1タップで押せる |
| `behavior="padding"` (iOS) | シートをキーボード分だけ上に押し上げる |
| `paddingBottom: insets.bottom` | SafeArea分の余白（ホームバー対応） |
| オーバーレイをKAV外に配置 | KAV内に入れると `pointerEvents` 競合でタップが通らない |

**PanResponderとScrollViewの競合**: スライダー等を `PanResponder` で実装している場合、
親の `ScrollView` 縦スクロールと干渉する。`onMoveShouldSetPanResponder` で水平方向のみ
`true` を返すよう実装する。
"""

if '## 16. BottomSheet + キーボード回避' not in content:
    content = content.rstrip('\n') + '\n' + SEC16
    print('Section D (sec16): appended OK')
else:
    print('Section D (sec16): already applied, skipping')

# ─────────────────────────────────────────────────────────────
# Section F: セクション17「文字化け対策（Windows/PowerShell環境）」末尾追記
# ─────────────────────────────────────────────────────────────
SEC17 = """

---

## 17. 文字化け対策（Windows/PowerShell環境）

### 原因

PowerShellの `Set-Content` や `Out-File` はデフォルトでUTF-16LEまたはcp932で書き込む。
`sed` 相当の置換操作を経由すると日本語マルチバイト文字が破損し、JSXの閉じクォートや `<` タグが
消失するケースがある。`eas update` 後に実機でクラッシュ・文字化けが起きる。

### 防止策

```powershell
# PowerShell でファイル書き込む場合は必ず -Encoding UTF8 を指定
Set-Content -Path "file.tsx" -Value $content -Encoding UTF8

# より確実な方法
[System.IO.File]::WriteAllText("C:\\\\path\\\\to\\\\file.tsx", $content, [System.Text.Encoding]::UTF8)
```

```bash
# Git Bash/WSL 経由が最も安全（PowerShellを経由しない）
# 環境変数で UTF-8 を強制
export PYTHONIOENCODING=utf-8
export PYTHONUTF8=1
```

**根本対策**: ファイル内容を変更する際は Claude Code の Edit ツールを使う（PowerShellを経由しない）。

### eas update 前のチェック

```bash
# 壊れたファイルを検出（UTF-8として解釈できないバイト列を探す）
python3 -c "
import os
for root, _, files in os.walk('src'):
    for fn in files:
        if fn.endswith(('.tsx', '.ts')):
            path = os.path.join(root, fn)
            with open(path, 'rb') as f:
                raw = f.read()
            try:
                raw.decode('utf-8')
            except UnicodeDecodeError:
                print(f'Corrupt: {path}')
"
```

文字化けが発生した場合は `git show <hash>:path/to/file` で正常なバージョンを取り出して修正。
"""

if '## 17. 文字化け対策' not in content:
    content = content.rstrip('\n') + '\n' + SEC17
    print('Section F (sec17): appended OK')
else:
    print('Section F (sec17): already applied, skipping')

# ─────────────────────────────────────────────────────────────
# 書き込み・サマリー
# ─────────────────────────────────────────────────────────────
with open(SKILL_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

new_len = len(content)
print(f'Done. Before: {original_len} chars, After: {new_len} chars, Diff: {new_len - original_len:+d} chars')
