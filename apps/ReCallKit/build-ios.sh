#!/usr/bin/env bash
# ============================================================
# build-ios.sh  -- push → Mac pull → xcodebuild → iPhone install
# 使い方: bash build-ios.sh
# ============================================================
set -euo pipefail

SSH_KEY="$HOME/.ssh/id_ed25519_mac"
SSH_HOST="mac@192.168.11.10"
MAC_PROJECT="/Users/mac/Desktop/APPProject/APP/AppProject"
IOS_DIR="$MAC_PROJECT/apps/ReCallKit/ios"
SCHEME="ReCallKit"
DEVICE_ID="2291EDE3-F144-5AE0-BE21-DF702A7E69DB"  # iPhone 13
REPO_ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"

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
echo "▶ [3/4] Mac: xcodebuild (Debug / real device)..."
ssh -i "$SSH_KEY" -o IdentitiesOnly=yes "$SSH_HOST" "bash -s" <<BUILD_EOF
set -euo pipefail
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
cd "$IOS_DIR"

xcodebuild \\
  -workspace ReCallKit.xcworkspace \\
  -scheme $SCHEME \\
  -configuration Debug \\
  -destination "generic/platform=iOS" \\
  -allowProvisioningUpdates \\
  build 2>&1 | grep -E "error:|warning: |BUILD |Compiling|Linking|^\\*\\*" | tail -40

echo "BUILD_DONE"
BUILD_EOF
echo "  ✓ ビルド完了"

echo ""
echo "▶ [4/4] Mac: iPhone にインストール..."
ssh -i "$SSH_KEY" -o IdentitiesOnly=yes "$SSH_HOST" "bash -s" <<INSTALL_EOF
set -euo pipefail
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

APP_PATH=\$(find ~/Library/Developer/Xcode/DerivedData -name "ReCallKit.app" -path "*/Debug-iphoneos/*" 2>/dev/null | head -1)
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
