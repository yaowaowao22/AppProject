#!/usr/bin/env bash
# ============================================================
# build-ios.sh  -- push → Mac pull → (prebuild+pod install if needed) → xcodebuild → iPhone install
# 使い方: bash apps/dentak/build-ios.sh [--force-prebuild]
#   --force-prebuild: ios/ を再生成して pod install もやり直す
# ============================================================
set -euo pipefail

SSH_KEY="$HOME/.ssh/id_ed25519_mac"
SSH_HOST="mac@macnoMac-mini.local"
SSH_OPTS="-i $HOME/.ssh/id_ed25519_mac -o IdentitiesOnly=yes -o ServerAliveInterval=60 -o ServerAliveCountMax=30"
MAC_PROJECT="/Users/mac/AppProject/APP/AppProject"
APP_DIR="$MAC_PROJECT/apps/dentak"
IOS_DIR="$APP_DIR/ios"
MAC_BUILD_OUT="/Users/mac/builds/dentak-ssh-build"
DEVICE_ID="2291EDE3-F144-5AE0-BE21-DF702A7E69DB"  # iPhone 13
REPO_ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
FORCE_PREBUILD=0
[[ "${1:-}" == "--force-prebuild" ]] && FORCE_PREBUILD=1

# .env.local からパスワード読み込み
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
ssh $SSH_OPTS "$SSH_HOST" "bash -s" <<PULL_EOF
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

# ── prebuild が必要かどうかを判定 ──────────────────────────────
# ios/Podfile.lock が存在すれば pod install 済みとみなしスキップ
# --force-prebuild フラグまたは ios/ が存在しない場合は実行
NEED_PREBUILD=$FORCE_PREBUILD
if [ "$NEED_PREBUILD" -eq 0 ]; then
  IOS_EXISTS=$(ssh $SSH_OPTS "$SSH_HOST" \
    "[ -f '$IOS_DIR/Podfile.lock' ] && echo yes || echo no" 2>/dev/null)
  if [ "$IOS_EXISTS" != "yes" ]; then
    echo "  ios/Podfile.lock が存在しないため prebuild を実行します"
    NEED_PREBUILD=1
  fi
fi

if [ "$NEED_PREBUILD" -eq 1 ]; then
  echo ""
  echo "▶ [3/4-pre] Mac: pnpm install + expo prebuild + pod install..."
  ssh $SSH_OPTS "$SSH_HOST" "bash -s" <<PREBUILD_EOF
set -euo pipefail
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

echo "  pnpm install (workspace root)..."
cd $MAC_PROJECT && pnpm install
echo "  expo prebuild (--clean)..."
cd $APP_DIR && npx expo prebuild --platform ios --clean --no-install
echo "  pod install..."
cd $APP_DIR/ios && pod install
echo "PREBUILD_DONE"
PREBUILD_EOF
  echo "  ✓ prebuild + pod install 完了"
else
  echo ""
  echo "▶ [3/4-pre] ios/Podfile.lock 確認済み — prebuild/pod install スキップ"
fi

echo ""
echo "▶ [3/4] Mac: xcodebuild (Release / real device → $MAC_BUILD_OUT)..."
ssh $SSH_OPTS "$SSH_HOST" "bash -s" <<BUILD_EOF
set -euo pipefail
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

# キーチェーンアンロック
security unlock-keychain -p "$MAC_PASS" ~/Library/Keychains/login.keychain-db 2>/dev/null && echo "  ✓ keychain unlocked" || echo "  ⚠ keychain unlock failed (続行)"

# ビルドプロセス・ibtooldを事前終了（OOMkill防止）
pkill -f xcodebuild 2>/dev/null || true
pkill -f XCBBuildService 2>/dev/null || true
pkill -f ibtoold 2>/dev/null || true
sleep 1
# 前回のOOMkillで壊れた中間ファイルを削除
rm -rf "$MAC_BUILD_OUT/Build/Intermediates.noindex" 2>/dev/null || true

# メモリ解放
echo "$MAC_PASS" | sudo -S purge 2>/dev/null && echo "  ✓ memory purged" || true

cd "$IOS_DIR"

WORKSPACE=\$(ls -d *.xcworkspace 2>/dev/null | head -1)
if [ -z "\$WORKSPACE" ]; then
  echo "  ✗ .xcworkspace が見つかりません"
  exit 1
fi
SCHEME=\$(xcodebuild -list -workspace "\$WORKSPACE" 2>/dev/null | awk '/Schemes:/,0' | grep -v 'Schemes:' | grep -v '^\$' | head -1 | xargs)
echo "  workspace: \$WORKSPACE  scheme: \$SCHEME"
echo "  free memory: \$(vm_stat | grep 'Pages free' | awk '{print int(\$3)*4/1024}') MB"

BUILD_LOG=/tmp/dentak_xcode.log
set +e
xcodebuild \\
  -workspace "\$WORKSPACE" \\
  -scheme "\$SCHEME" \\
  -configuration Release \\
  -destination "generic/platform=iOS" \\
  -derivedDataPath "$MAC_BUILD_OUT" \\
  -allowProvisioningUpdates \\
  -jobs 2 \\
  DEVELOPMENT_TEAM=PVM8Q8HG54 \\
  CODE_SIGN_STYLE=Automatic \\
  build 2>&1 | xcbeautify --quiet 2>&1 | tee \$BUILD_LOG
BUILD_EXIT=\${PIPESTATUS[0]}
set -e

if [ \$BUILD_EXIT -ne 0 ]; then
  echo "  ✗ xcodebuild FAILED (exit \$BUILD_EXIT)"
  grep -E "❌|error:|Build FAILED" \$BUILD_LOG 2>/dev/null | head -30 || tail -30 \$BUILD_LOG
  exit 1
fi
echo "BUILD_DONE"
BUILD_EOF
echo "  ✓ ビルド完了"

echo ""
echo "▶ [4/4] Mac: iPhone にインストール..."
ssh $SSH_OPTS "$SSH_HOST" "bash -s" <<INSTALL_EOF
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
