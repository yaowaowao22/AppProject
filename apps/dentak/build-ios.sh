#!/usr/bin/env bash
# ============================================================
# build-ios.sh  -- push -> Mac pull -> (prebuild+pod install if needed) -> xcodebuild -> iPhone install
# Usage: bash apps/dentak/build-ios.sh [--force-prebuild]
#   --force-prebuild: regenerate ios/ and re-run pod install
# ============================================================
set -euo pipefail

SSH_KEY="$HOME/.ssh/id_ed25519_mac"
SSH_HOST="mac@macnoMac-mini.local"
SSH_OPTS="-i $SSH_KEY -o IdentitiesOnly=yes -o ServerAliveInterval=60 -o ServerAliveCountMax=30"
MAC_PROJECT="/Users/mac/AppProject/APP/AppProject"
APP_DIR="$MAC_PROJECT/apps/dentak"
IOS_DIR="$APP_DIR/ios"
MAC_BUILD_OUT="/Users/mac/builds/dentak-ssh-build"
DEVICE_ID="2291EDE3-F144-5AE0-BE21-DF702A7E69DB"
REPO_ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
FORCE_PREBUILD=0
[[ "${1:-}" == "--force-prebuild" ]] && FORCE_PREBUILD=1

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

# Determine if prebuild is needed
NEED_PREBUILD=$FORCE_PREBUILD
if [ "$NEED_PREBUILD" -eq 0 ]; then
  # shellcheck disable=SC2086
  IOS_EXISTS=$(ssh $SSH_OPTS "$SSH_HOST" \
    "[ -f '$IOS_DIR/Podfile.lock' ] && echo yes || echo no" 2>/dev/null)
  if [ "$IOS_EXISTS" != "yes" ]; then
    echo "  ios/Podfile.lock not found, will run prebuild"
    NEED_PREBUILD=1
  fi
fi

if [ "$NEED_PREBUILD" -eq 1 ]; then
  echo ""
  echo ">> [3/4-pre] Mac: pnpm install + expo prebuild + pod install..."
  # shellcheck disable=SC2086
  ssh $SSH_OPTS "$SSH_HOST" "bash -s" <<PREBUILD_EOF
set -euo pipefail
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
echo "  pnpm install..."
cd $MAC_PROJECT && pnpm install
echo "  expo prebuild --clean..."
cd $APP_DIR && npx expo prebuild --platform ios --clean --no-install
echo "  pod install..."
cd $APP_DIR/ios && pod install
echo "PREBUILD_DONE"
PREBUILD_EOF
  echo "  prebuild + pod install done"
else
  echo ""
  echo ">> [3/4-pre] ios/Podfile.lock exists -- skipping prebuild/pod install"
fi

echo ""
echo ">> [3/4] Mac: xcodebuild (Release -> $MAC_BUILD_OUT)..."
# shellcheck disable=SC2086
ssh $SSH_OPTS "$SSH_HOST" "bash -s" <<BUILD_EOF
set -euo pipefail
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

security unlock-keychain -p "$MAC_PASS" ~/Library/Keychains/login.keychain-db 2>/dev/null && echo "  keychain unlocked" || echo "  keychain unlock failed (continuing)"

pkill -f xcodebuild 2>/dev/null || true
pkill -f XCBBuildService 2>/dev/null || true
pkill -f ibtoold 2>/dev/null || true
kill -STOP \$(pgrep -x mds_stores 2>/dev/null) 2>/dev/null || true
kill -STOP \$(pgrep -x mediaanalysisd 2>/dev/null) 2>/dev/null || true
sleep 1
find "$MAC_BUILD_OUT/Build/Intermediates.noindex" -name "*.dia" -delete 2>/dev/null || true
rm -rf "$MAC_BUILD_OUT/Build/Intermediates.noindex/XCBuildData" 2>/dev/null || true

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

nohup xcodebuild \\
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
echo ">> [4/4] Mac: install to iPhone..."
# shellcheck disable=SC2086
ssh $SSH_OPTS "$SSH_HOST" "bash -s" <<INSTALL_EOF
set -euo pipefail
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

APP_PATH=\$(find "$MAC_BUILD_OUT" -name "*.app" -path "*/Release-iphoneos/*" 2>/dev/null | head -1)
if [ -z "\$APP_PATH" ]; then
  echo "  .app not found"
  exit 1
fi
echo "  .app: \$APP_PATH"

xcrun devicectl device install app \\
  --device $DEVICE_ID \\
  "\$APP_PATH" 2>&1

echo "INSTALL_DONE"
INSTALL_EOF

echo ""
echo "================================"
echo "  iPhone install complete!"
echo "================================"
