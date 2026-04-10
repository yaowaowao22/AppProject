#!/usr/bin/env bash
# ============================================================
# build-ios.sh  -- Windows から Mac へ push → pull → Xcode build
# 使い方: bash build-ios.sh
# ============================================================
set -euo pipefail

SSH_KEY="$HOME/.ssh/id_ed25519_mac"
SSH_HOST="mac@192.168.11.10"
MAC_PROJECT="/Users/mac/Desktop/APPProject/APP/AppProject"
IOS_DIR="$MAC_PROJECT/apps/ReCallKit/ios"
SCHEME="ReCallKit"
REPO_ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"

echo ""
echo "▶ [1/3] git push..."
git -C "$REPO_ROOT" push
echo "  ✓ push 完了"

echo ""
echo "▶ [2/3] Mac: git pull..."
ssh -i "$SSH_KEY" -o IdentitiesOnly=yes "$SSH_HOST" \
  "cd $MAC_PROJECT && git pull --ff-only 2>&1"
echo "  ✓ pull 完了"

echo ""
echo "▶ [3/3] Mac: xcodebuild (Debug / iOS Simulator)..."
ssh -i "$SSH_KEY" -o IdentitiesOnly=yes "$SSH_HOST" "bash -s" <<REMOTE_EOF
set -euo pipefail
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/sbin"
cd "$IOS_DIR"

xcodebuild \\
  -workspace ReCallKit.xcworkspace \\
  -scheme $SCHEME \\
  -configuration Debug \\
  -destination 'generic/platform=iOS Simulator' \\
  -allowProvisioningUpdates \\
  build 2>&1 | grep -E "error:|warning:|BUILD|Compiling|Linking|^\\*\\*" | tail -40
REMOTE_EOF

echo ""
echo "================================================"
echo "  BUILD COMPLETE"
echo "================================================"
