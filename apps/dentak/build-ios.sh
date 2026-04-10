#!/usr/bin/env bash
# ============================================================
# build-ios.sh  -- push → Mac pull → expo prebuild → pod install → xcodebuild → iPhone install
# 使い方: bash apps/dentak/build-ios.sh
# ============================================================
set -euo pipefail

SSH_KEY="$HOME/.ssh/id_ed25519_mac"
SSH_HOST="mac@macnoMac-mini.local"
MAC_PROJECT="/Users/mac/AppProject/APP/AppProject"
APP_DIR="$MAC_PROJECT/apps/dentak"
IOS_DIR="$APP_DIR/ios"
MAC_BUILD_OUT="/Users/mac/builds/dentak-ssh-build"  # ReCallKitと競合しない別パス
DEVICE_ID="2291EDE3-F144-5AE0-BE21-DF702A7E69DB"  # iPhone 13
REPO_ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"

# .env.local からパスワード読み込み（MAC_PASS 環境変数で上書き可）
ENV_FILE="$(dirname "$0")/.env.local"
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
if ! git diff --quiet; then
  echo "  (ローカル変更をstash中...)"
  git stash push -m "build-ios auto-stash"
  STASHED=1
else
  STASHED=0
fi
git pull --ff-only 2>&1
if [ "\$STASHED" -eq 1 ]; then
  git stash pop || echo "  ⚠ stash pop failed"
fi
PULL_EOF
echo "  ✓ pull 完了"

echo ""
echo "▶ [3/5] Mac: pnpm install + expo prebuild --clean + pod install..."
ssh -i "$SSH_KEY" -o IdentitiesOnly=yes "$SSH_HOST" "bash -s" <<PREBUILD_EOF
set -euo pipefail
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

echo "  pnpm install (workspace root)..."
cd $MAC_PROJECT && pnpm install
echo "  expo prebuild --clean..."
cd $APP_DIR && npx expo prebuild --platform ios --clean --no-install
echo "  pod install..."
cd $APP_DIR/ios && pod install
echo "PREBUILD_DONE"
PREBUILD_EOF
echo "  ✓ prebuild + pod install 完了"

echo ""
echo "▶ [4/5] Mac: xcodebuild (Release / real device → $MAC_BUILD_OUT)..."
ssh -i "$SSH_KEY" -o IdentitiesOnly=yes "$SSH_HOST" "bash -s" <<BUILD_EOF
set -euxo pipefail
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

# キーチェーンアンロック（SSH経由のコード署名に必要）
security unlock-keychain -p "$MAC_PASS" ~/Library/Keychains/login.keychain-db 2>/dev/null && echo "  ✓ keychain unlocked" || echo "  ⚠ keychain unlock failed (続行)"

# ロック中のビルドプロセスを事前に終了（build.db競合防止）
pkill -f xcodebuild 2>/dev/null || true
pkill -f XCBBuildService 2>/dev/null || true
sleep 1
rm -f "$MAC_BUILD_OUT/Build/Intermediates.noindex/XCBuildData/build.db" 2>/dev/null || true

echo "  IOS_DIR: $IOS_DIR"
ls "$IOS_DIR" 2>&1 || { echo "  ✗ IOS_DIR does not exist!"; exit 1; }
cd "$IOS_DIR"

# .xcworkspace と スキーム名を動的取得
WORKSPACE=\$(ls -d *.xcworkspace 2>/dev/null | head -1)
if [ -z "\$WORKSPACE" ]; then
  echo "  ✗ .xcworkspace が見つかりません（expo prebuild 失敗の可能性）"
  exit 1
fi
SCHEME=\$(xcodebuild -list -workspace "\$WORKSPACE" 2>/dev/null | awk '/Schemes:/,0' | grep -v 'Schemes:' | grep -v '^\$' | head -1 | xargs)
echo "  workspace: \$WORKSPACE"
echo "  scheme:    \$SCHEME"

xcodebuild \\
  -workspace "\$WORKSPACE" \\
  -scheme "\$SCHEME" \\
  -configuration Release \\
  -destination "generic/platform=iOS" \\
  -derivedDataPath "$MAC_BUILD_OUT" \\
  -allowProvisioningUpdates \\
  DEVELOPMENT_TEAM=PVM8Q8HG54 \\
  CODE_SIGN_STYLE=Automatic \\
  build 2>&1 | xcbeautify 2>&1 || {
    echo "  ✗ xcodebuild FAILED — showing last 50 lines of build log:"
    find "$MAC_BUILD_OUT/Logs/Build" -name "*.xcactivitylog" 2>/dev/null | sort | tail -1 | xargs gunzip -c 2>/dev/null | strings | tail -50
    exit 1
  }

echo "BUILD_DONE"
BUILD_EOF
echo "  ✓ ビルド完了"

echo ""
echo "▶ [5/5] Mac: iPhone にインストール..."
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

echo "INSTALL_DONE"
INSTALL_EOF

echo ""
echo "================================================"
echo "  ✓ iPhone へのインストール完了！"
echo "================================================"
