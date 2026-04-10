#!/usr/bin/env bash
# ============================================================
# build-ios.sh  -- push → Mac pull → xcodebuild → iPhone install
# 使い方: bash build-ios.sh
# ============================================================
set -euo pipefail

SSH_KEY="$HOME/.ssh/id_ed25519_mac"
SSH_HOST="mac@macnoMac-mini.local"
MAC_PROJECT="/Users/mac/AppProject/APP/AppProject"
IOS_DIR="/Users/mac/AppProject/APP/AppProject/apps/ReCallKit/ios"
MAC_BUILD_OUT="/Users/mac/builds/ReCallKit-ssh-build"  # Xcode GUIと競合しない別フォルダ
SCHEME="ReCallKit"
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
echo "▶ [1/4] git push..."
git -C "$REPO_ROOT" push
echo "  ✓ push 完了"

echo ""
echo "▶ [2/4] Mac: git pull..."
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
echo "▶ [3/4] Mac: xcodebuild (Release / real device → $MAC_BUILD_OUT)..."
ssh -i "$SSH_KEY" -o IdentitiesOnly=yes "$SSH_HOST" "bash -s" <<BUILD_EOF
set -euo pipefail
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

# キーチェーンアンロック（SSH経由のコード署名に必要）
security unlock-keychain -p "$MAC_PASS" ~/Library/Keychains/login.keychain-db 2>/dev/null && echo "  ✓ keychain unlocked" || echo "  ⚠ keychain unlock failed (続行)"

# ロック中のビルドプロセスを事前に終了（build.db競合防止）
pkill -f xcodebuild 2>/dev/null || true
pkill -f XCBBuildService 2>/dev/null || true
sleep 1
rm -f "$MAC_BUILD_OUT/Build/Intermediates.noindex/XCBuildData/build.db" 2>/dev/null || true

cd "$IOS_DIR"

xcodebuild \\
  -workspace ReCallKit.xcworkspace \\
  -scheme $SCHEME \\
  -configuration Release \\
  -destination "generic/platform=iOS" \\
  -derivedDataPath "$MAC_BUILD_OUT" \\
  -allowProvisioningUpdates \\
  build 2>&1 | xcbeautify --quiet

echo "BUILD_DONE"
BUILD_EOF
echo "  ✓ ビルド完了"

echo ""
echo "▶ [4/4] Mac: iPhone にインストール..."
ssh -i "$SSH_KEY" -o IdentitiesOnly=yes "$SSH_HOST" "bash -s" <<INSTALL_EOF
set -euo pipefail
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

APP_PATH=\$(find "$MAC_BUILD_OUT" -name "ReCallKit.app" -path "*/Release-iphoneos/*" 2>/dev/null | head -1)
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
