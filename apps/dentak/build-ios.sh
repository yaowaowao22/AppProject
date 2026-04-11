#!/usr/bin/env bash
# ============================================================
# build-ios.sh v2  -- push → Mac pull → 検出 → 条件付き clean → xcodebuild → install
#
# v2: scripts/detect-native-change.py でネイティブ変化を自動検出し、
#     変化があれば expo prebuild --clean + pod install、無ければ高速ビルド。
#     旧 --force-prebuild フラグは FORCE_CLEAN=1 環境変数に置換。
#
# Usage:
#   bash apps/dentak/build-ios.sh              # 検出器に従う (default)
#   FORCE_CLEAN=1 bash apps/dentak/build-ios.sh  # 強制 clean
#   FORCE_FAST=1  bash apps/dentak/build-ios.sh  # 強制高速 (緊急時)
# 旧互換: --force-prebuild 引数も受け付ける (FORCE_CLEAN=1 相当)
# ============================================================
set -euo pipefail

SSH_KEY="$HOME/.ssh/id_ed25519_mac"
SSH_HOST="mac@macnoMac-mini.local"
SSH_OPTS="-i $SSH_KEY -o IdentitiesOnly=yes -o ServerAliveInterval=60 -o ServerAliveCountMax=30"
MAC_PROJECT="/Users/mac/AppProject/APP/AppProject"
APP_DIR="$MAC_PROJECT/apps/dentak"
IOS_DIR="$APP_DIR/ios"
MAC_BUILD_OUT="/Users/mac/builds/dentak-ssh-build"
MAC_HASH_FILE="$APP_DIR/.build-cache/native-hash"
DEVICE_ID="2291EDE3-F144-5AE0-BE21-DF702A7E69DB"
REPO_ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"

# ── オプション ──
FORCE_CLEAN="${FORCE_CLEAN:-0}"
FORCE_FAST="${FORCE_FAST:-0}"
# 旧互換: --force-prebuild 引数を FORCE_CLEAN に変換
[[ "${1:-}" == "--force-prebuild" ]] && FORCE_CLEAN=1
if [ "$FORCE_CLEAN" = "1" ] && [ "$FORCE_FAST" = "1" ]; then
  echo "⚠ FORCE_CLEAN と FORCE_FAST の同時指定は矛盾します"
  exit 1
fi

ENV_FILE="$(dirname "$0")/.env.local"
if [ -f "$ENV_FILE" ]; then
  source "$ENV_FILE"
fi
if [ -z "${MAC_PASS:-}" ]; then
  echo "MAC_PASS not set. Add MAC_PASS=<password> to .env.local"
  exit 1
fi

echo ""
echo ">> [1/4] git push..."
git -C "$REPO_ROOT" push
echo "  push done"

echo ""
echo ">> [2/4] Mac: git pull..."
# shellcheck disable=SC2086
ssh $SSH_OPTS "$SSH_HOST" "bash -s" <<PULL_EOF
cd $MAC_PROJECT
git checkout -- apps/dentak/build-ios.sh 2>/dev/null || true
if ! git diff --quiet; then
  echo "(stashing local changes...)"
  git stash push -m "build-ios auto-stash"
  STASHED=1
else
  STASHED=0
fi
git pull --ff-only 2>&1
if [ "\$STASHED" -eq 1 ]; then
  git stash pop || echo "stash pop failed"
fi
PULL_EOF
echo "  pull done"

echo ""
echo ">> [3/5] Mac: pnpm install + ネイティブ変化検出 + 条件付き clean..."
# shellcheck disable=SC2086
ssh $SSH_OPTS "$SSH_HOST" "bash -s" <<DETECT_EOF
set -euo pipefail
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
export PATH="\$HOME/.npm-global/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

# ── 1. pnpm install (always) ──
cd $MAC_PROJECT
echo "  → pnpm install (workspace root)..."
pnpm install 2>&1 | tail -5

# ── 2. ネイティブ変化検出 ──
cd $APP_DIR
if [ ! -f scripts/detect-native-change.py ]; then
  echo "  ⚠ scripts/detect-native-change.py が無い → 安全側で NEED_CLEAN=1"
  NEED_CLEAN=1
  CURRENT_HASH="unavailable"
elif [ ! -f ios/Podfile.lock ]; then
  echo "  → ios/Podfile.lock 無し → 初回または前回失敗 → フルクリーン"
  NEED_CLEAN=1
  CURRENT_HASH=\$(python3 scripts/detect-native-change.py 2>/dev/null || echo "detect_failed")
else
  CURRENT_HASH=\$(python3 scripts/detect-native-change.py 2>/tmp/dentak_detect.log) || {
    echo "  ⚠ 検出器失敗 → NEED_CLEAN=1"
    cat /tmp/dentak_detect.log || true
    NEED_CLEAN=1
    CURRENT_HASH="detect_failed"
  }
  if [ -f "$MAC_HASH_FILE" ]; then
    OLD_HASH=\$(cat "$MAC_HASH_FILE")
  else
    OLD_HASH=""
  fi

  if [ "$FORCE_CLEAN" = "1" ]; then
    echo "  → FORCE_CLEAN=1: 強制フルクリーン"
    NEED_CLEAN=1
  elif [ "$FORCE_FAST" = "1" ]; then
    echo "  → FORCE_FAST=1: 強制高速ビルド"
    NEED_CLEAN=0
  elif [ -z "\$OLD_HASH" ]; then
    echo "  → 初回ビルド (hash キャッシュ無し) → フルクリーン"
    NEED_CLEAN=1
  elif [ "\$CURRENT_HASH" = "\$OLD_HASH" ]; then
    echo "  ✓ ネイティブ変化なし (hash=\${CURRENT_HASH:0:12}...) → 高速ビルド"
    NEED_CLEAN=0
  else
    echo "  ⚠ ネイティブ変化検出 (\${OLD_HASH:0:12}... → \${CURRENT_HASH:0:12}...)"
    echo "    → フルクリーンビルド"
    NEED_CLEAN=1
  fi
fi

# ── 3. 条件付き: expo prebuild + pod install + DerivedData wipe ──
if [ "\$NEED_CLEAN" = "1" ]; then
  cd $APP_DIR
  echo "  → expo prebuild --platform ios --clean ..."
  npx expo prebuild --platform ios --clean --no-install 2>&1 | tail -10

  cd $IOS_DIR
  if [ ! -f Podfile ]; then
    echo "  ✗ Podfile が見つかりません (prebuild 失敗？)"
    exit 1
  fi
  echo "  → pod install..."
  pod install 2>&1 | tail -5

  # DerivedData wipe (stale module map 除去)
  echo "  → DerivedData wipe..."
  find ~/Library/Developer/Xcode/DerivedData -maxdepth 1 -type d -name "dentak-*" \\
    -exec rm -rf {} + 2>/dev/null || true
  rm -rf "$MAC_BUILD_OUT" 2>/dev/null || true
else
  echo "  (prebuild/pod install/DerivedData wipe スキップ)"
fi

echo "RESULT_HASH=\$CURRENT_HASH"
echo "RESULT_NEED_CLEAN=\$NEED_CLEAN"
DETECT_EOF
echo "  ✓ [3/5] 完了"

echo ""
echo ">> [4/5] Mac: xcodebuild (Release -> $MAC_BUILD_OUT)..."
# shellcheck disable=SC2086
ssh $SSH_OPTS "$SSH_HOST" "bash -s" <<BUILD_EOF
set -euo pipefail
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

security unlock-keychain -p "$MAC_PASS" ~/Library/Keychains/login.keychain-db 2>/dev/null && echo "  keychain unlocked" || echo "  keychain unlock failed (continuing)"

pkill -9 -f xcodebuild 2>/dev/null || true
pkill -9 -f SWBBuildService 2>/dev/null || true
pkill -9 -f XCBBuildService 2>/dev/null || true
pkill -9 -f ibtoold 2>/dev/null || true
kill -STOP \$(pgrep -x mds_stores 2>/dev/null) 2>/dev/null || true
kill -STOP \$(pgrep -x mediaanalysisd 2>/dev/null) 2>/dev/null || true
for i in 1 2 3 4 5; do
  pgrep -f xcodebuild >/dev/null 2>&1 || break
  sleep 1
done
find "$MAC_BUILD_OUT/Build/Intermediates.noindex" -name "*.dia" -delete 2>/dev/null || true

echo "$MAC_PASS" | sudo -S purge 2>/dev/null && echo "  memory purged" || true
echo "  free after purge: \$(vm_stat | grep 'Pages free' | awk '{print int(\$3)*4/1024}') MB"

cd "$IOS_DIR"

WORKSPACE=\$(ls -d *.xcworkspace 2>/dev/null | head -1)
if [ -z "\$WORKSPACE" ]; then
  echo "  .xcworkspace not found"
  exit 1
fi
SCHEME=\$(xcodebuild -list -workspace "\$WORKSPACE" 2>/dev/null | awk '/Schemes:/,0' | grep -v 'Schemes:' | grep -v '^\$' | head -1 | xargs)
echo "  workspace: \$WORKSPACE  scheme: \$SCHEME"
echo "  free: \$(vm_stat | grep 'Pages free' | awk '{print int(\$3)*4/1024}') MB"

BUILD_LOG=/tmp/dentak_xcode.log
: > \$BUILD_LOG

xcodebuild \\
  -workspace "\$WORKSPACE" \\
  -scheme "\$SCHEME" \\
  -configuration Release \\
  -destination "generic/platform=iOS" \\
  -derivedDataPath "$MAC_BUILD_OUT" \\
  -allowProvisioningUpdates \\
  -jobs 1 \\
  DEVELOPMENT_TEAM=PVM8Q8HG54 \\
  CODE_SIGN_STYLE=Automatic \\
  CLANG_ENABLE_EXPLICIT_MODULES=NO \\
  COMPILER_INDEX_STORE_ENABLE=NO \\
  build >> \$BUILD_LOG 2>&1 &
XCODE_PID=\$!
echo "  xcodebuild started (pid \$XCODE_PID)"

while kill -0 \$XCODE_PID 2>/dev/null; do
  sleep 30
  FREE=\$(vm_stat | grep 'Pages free' | awk '{print int(\$3)*4/1024}')
  LAST=\$(tail -1 \$BUILD_LOG 2>/dev/null | cut -c1-80)
  echo "  [alive] free:\${FREE}MB  \$LAST"
done

wait \$XCODE_PID
BUILD_EXIT=\$?
echo "  xcodebuild exit: \$BUILD_EXIT"

kill -CONT \$(pgrep -x mds_stores 2>/dev/null) 2>/dev/null || true
kill -CONT \$(pgrep -x mediaanalysisd 2>/dev/null) 2>/dev/null || true

if [ \$BUILD_EXIT -ne 0 ]; then
  echo "  xcodebuild FAILED — last 30 lines:"
  tail -30 \$BUILD_LOG
  exit 1
fi
echo "BUILD_DONE"
BUILD_EOF
echo "  build done"

echo ""
echo ">> [5/5] Mac: install to iPhone + ハッシュ更新..."
# shellcheck disable=SC2086
ssh $SSH_OPTS "$SSH_HOST" "bash -s" <<INSTALL_EOF
set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

APP_PATH=\$(find "$MAC_BUILD_OUT" -name "*.app" -path "*/Release-iphoneos/*" 2>/dev/null | head -1)
if [ -z "\$APP_PATH" ]; then
  echo "  .app not found"
  exit 1
fi
echo "  .app: \$APP_PATH"

xcrun devicectl device install app \\
  --device $DEVICE_ID \\
  "\$APP_PATH" 2>&1

# 成功時にハッシュキャッシュ更新
cd $APP_DIR
mkdir -p .build-cache
if [ -f scripts/detect-native-change.py ]; then
  python3 scripts/detect-native-change.py > "$MAC_HASH_FILE" 2>/dev/null || {
    echo "  ⚠ ハッシュ再計算失敗 (次回は安全側で clean されます)"
    rm -f "$MAC_HASH_FILE"
  }
  if [ -f "$MAC_HASH_FILE" ]; then
    echo "  ✓ ハッシュ更新: \$(cat $MAC_HASH_FILE)"
  fi
fi

echo "INSTALL_DONE"
INSTALL_EOF

echo ""
echo "================================"
echo "  iPhone install complete!"
echo "================================"
