#!/usr/bin/env bash
# ============================================================
# build-ios.sh  -- push → Mac pull → npm/pod install → xcodebuild → iPhone install
# 使い方: bash apps/ougonApp/build-ios.sh
# ============================================================
set -euo pipefail

SSH_KEY="$HOME/.ssh/id_ed25519_mac"
SSH_HOST="mac@macnoMac-mini.local"
MAC_PROJECT="/Users/mac/AppProject/baseProject"
APP_DIR="$MAC_PROJECT/apps/ougonApp"
IOS_DIR="$APP_DIR/ios"
MAC_BUILD_OUT="/Users/mac/builds/ougonApp-build"
BUILD_LOG="/tmp/xcodebuild-ougonApp.log"
DEVICE_ID="2291EDE3-F144-5AE0-BE21-DF702A7E69DB"  # iPhone 13
REPO_ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"

# .env.local からパスワード読み込み
ENV_FILE="$REPO_ROOT/.env.local"
if [ -f "$ENV_FILE" ]; then
  source "$ENV_FILE"
fi
if [ -z "${MAC_PASS:-}" ]; then
  echo "⚠ MAC_PASS が未設定です。.env.local に MAC_PASS=<password> を追加してください。"
  exit 1
fi

echo ""
echo "▶ [1/5] git push..."
git -C "$REPO_ROOT" push
echo "  ✓ push 完了"

echo ""
echo "▶ [2/5] Mac: git pull..."
ssh -i "$SSH_KEY" -o IdentitiesOnly=yes "$SSH_HOST" "bash -s" <<PULL_EOF
cd $MAC_PROJECT
# ougonApp のローカル変更を破棄（expo prebuildが生成する差分を除去）
git checkout -- apps/ougonApp/ 2>/dev/null || true
rm -f apps/ougonApp/package-lock.json 2>/dev/null || true
git pull --ff-only 2>&1
PULL_EOF
echo "  ✓ pull 完了"

echo ""
echo "▶ [3/6] Mac: npm install + expo prebuild + pod install..."
ssh -i "$SSH_KEY" -o IdentitiesOnly=yes "$SSH_HOST" "bash -s" <<DEPS_EOF
set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export LANG=en_US.UTF-8

cd "$APP_DIR"
echo "  npm install..."
npm install --prefer-offline 2>&1 | tail -3

echo "  expo prebuild --platform ios --no-install..."
npx expo prebuild --platform ios --clean --no-install 2>&1 | tail -10

# Podfile.properties.json に ios.deploymentTarget を設定
# (GoogleMLKit/FaceDetection が iOS 15.5+ を要求するため 16.0 に設定)
echo "  setting ios.deploymentTarget=16.0 in Podfile.properties.json..."
python3 -c "
import json, os
fp = os.path.join('$IOS_DIR', 'Podfile.properties.json')
with open(fp, 'r') as f:
    props = json.load(f)
props['ios.deploymentTarget'] = '16.0'
with open(fp, 'w') as f:
    json.dump(props, f, indent=2)
print('  ✓ deploymentTarget set')
"

cd "$IOS_DIR"
echo "  pod install --repo-update..."
pod install --repo-update 2>&1 | tail -5
DEPS_EOF
echo "  ✓ 依存関係インストール完了"

echo ""
echo "▶ [4/6] Mac: xcodebuild build (Release / real device)..."
ssh -i "$SSH_KEY" -o IdentitiesOnly=yes "$SSH_HOST" "bash -s" <<BUILD_EOF
set -euo pipefail
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export LANG=en_US.UTF-8

# キーチェーンアンロック（SSH経由のコード署名に必要）
security unlock-keychain -p "$MAC_PASS" ~/Library/Keychains/login.keychain-db 2>/dev/null && echo "  ✓ keychain unlocked" || echo "  ⚠ keychain unlock failed (続行)"
security set-keychain-settings -t 36000 ~/Library/Keychains/login.keychain-db 2>/dev/null || true

# 競合ビルドプロセスを全停止（OOM防止 + build.db競合防止）
pkill -9 -f xcodebuild 2>/dev/null || true
pkill -9 -f SWBBuildService 2>/dev/null || true
pkill -9 -f ibtoold 2>/dev/null || true
sleep 2

# stale ビルド成果物を削除
rm -rf "$MAC_BUILD_OUT" 2>/dev/null || true
mkdir -p "$MAC_BUILD_OUT"

cd "$IOS_DIR"
WORKSPACE=\$(ls -d *.xcworkspace 2>/dev/null | head -1)
if [ -z "\$WORKSPACE" ]; then
  echo "  ✗ .xcworkspace が見つかりません"
  exit 1
fi
SCHEME=\${WORKSPACE%.xcworkspace}
echo "  workspace: \$WORKSPACE  scheme: \$SCHEME"

# xcodebuild — ログファイルに全出力、フィルタ表示は別途
set +e
xcodebuild \\
  -workspace "\$WORKSPACE" \\
  -scheme "\$SCHEME" \\
  -configuration Release \\
  -destination "generic/platform=iOS" \\
  -derivedDataPath "$MAC_BUILD_OUT" \\
  -allowProvisioningUpdates \\
  -allowProvisioningDeviceRegistration \\
  -jobs 2 \\
  CODE_SIGN_STYLE=Automatic \\
  DEVELOPMENT_TEAM=PVM8Q8HG54 \\
  "OTHER_CODE_SIGN_FLAGS=--keychain ~/Library/Keychains/login.keychain-db" \\
  COMPILER_INDEX_STORE_ENABLE=NO \\
  GCC_GENERATE_DEBUGGING_SYMBOLS=NO \\
  > "$BUILD_LOG" 2>&1
STATUS=\$?
set -e

# ビルド結果のフィルタ表示
grep -E "(error:|warning:.*error|SUCCEEDED|FAILED|BUILD)" "$BUILD_LOG" | tail -20 || true

if [ \$STATUS -ne 0 ]; then
  echo ""
  echo "  ✗ xcodebuild FAILED (exit \$STATUS)"
  echo "  --- last 40 lines of build log ---"
  tail -40 "$BUILD_LOG"
  exit 1
fi
echo "  ✓ BUILD SUCCEEDED"
BUILD_EOF
echo "  ✓ ビルド完了"

echo ""
echo "▶ [5/6] Mac: iPhone にインストール..."
ssh -i "$SSH_KEY" -o IdentitiesOnly=yes "$SSH_HOST" "bash -s" <<INSTALL_EOF
set -euo pipefail
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

APP_PATH=\$(find "$MAC_BUILD_OUT" -name "*.app" -path "*/Release-iphoneos/*" 2>/dev/null | head -1)
if [ -z "\$APP_PATH" ]; then
  echo "  ✗ .app ファイルが見つかりません"
  exit 1
fi
echo "  .app: \$APP_PATH"

xcrun devicectl device install app \\
  --device $DEVICE_ID \\
  "\$APP_PATH" 2>&1

echo "  ✓ INSTALL DONE"
INSTALL_EOF

echo ""
echo "================================================"
echo "  ✓ iPhone へのインストール完了！"
echo "================================================"
