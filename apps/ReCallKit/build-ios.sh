#!/usr/bin/env bash
# ============================================================
# build-ios.sh v2  -- push → Mac pull → install deps → clean → build → install
#
# 動作モード:
#   bash build-ios.sh                # フルクリーンビルド (native module追加後の標準)
#   FAST=1 bash build-ios.sh         # クリーン省略・prebuild省略 (JSのみ変更時)
#   SKIP_INSTALL=1 bash build-ios.sh # 依存解決省略 (package.json変更なし時)
#
# v2 変更点:
#   - [3/6] pnpm install + expo prebuild --clean + pod install を追加
#   - [4/6] DerivedData wipe + xcodebuild clean を追加
#   - FAST=1 / SKIP_INSTALL=1 オプション追加
#
#   expo-secure-store 等のネイティブモジュールを追加した場合は
#   必ずフルクリーン (オプション無し) でビルドすること。
# ============================================================
set -euo pipefail

SSH_KEY="$HOME/.ssh/id_ed25519_mac"
SSH_HOST="mac@macnoMac-mini.local"
MAC_PROJECT="/Users/mac/AppProject/APP/AppProject"
MAC_RECALLKIT="$MAC_PROJECT/apps/ReCallKit"
IOS_DIR="$MAC_RECALLKIT/ios"
MAC_BUILD_OUT="/Users/mac/builds/ReCallKit-ssh-build"
SCHEME="ReCallKit"
DEVICE_ID="2291EDE3-F144-5AE0-BE21-DF702A7E69DB"  # iPhone 13
REPO_ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"

# ── オプション (env var で制御) ──
FAST="${FAST:-0}"
SKIP_INSTALL="${SKIP_INSTALL:-0}"

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
echo "==============================================="
echo "  ReCallKit iOS Build  (FAST=$FAST SKIP_INSTALL=$SKIP_INSTALL)"
echo "==============================================="

echo ""
echo "▶ [1/6] git push..."
git -C "$REPO_ROOT" push
echo "  ✓ push 完了"

echo ""
echo "▶ [2/6] Mac: git pull..."
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

# ============================================================
# [3/6] 依存解決 (pnpm install + expo prebuild + pod install)
# ============================================================
if [ "$SKIP_INSTALL" = "1" ]; then
  echo ""
  echo "▶ [3/6] SKIP: 依存解決省略 (SKIP_INSTALL=1)"
else
  echo ""
  echo "▶ [3/6] Mac: pnpm install + expo prebuild + pod install..."
  ssh -i "$SSH_KEY" -o IdentitiesOnly=yes "$SSH_HOST" "bash -s" <<INSTALL_EOF
set -euo pipefail
export PATH="\$HOME/.npm-global/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

# 1. pnpm install (monorepo root)
cd $MAC_PROJECT
echo "  → pnpm install (workspace root)..."
pnpm install 2>&1 | tail -10

# 2. Expo prebuild — ios/ を package.json に合わせて再生成
#    FAST=1 では prebuild スキップ (ios/ に変更が無いと想定)
cd $MAC_RECALLKIT
if [ "$FAST" = "1" ]; then
  echo "  → expo prebuild SKIP (FAST=1)"
else
  echo "  → npx expo prebuild --platform ios --clean ..."
  # --clean で ios/ を一度破棄 → package.json から再生成
  # --no-install で pod install はここでは走らせず、次のステップで明示実行
  npx expo prebuild --platform ios --clean --no-install 2>&1 | tail -15
fi

# 3. pod install
#    FAST=1 でも package.json が変わっていた場合は必要なので常時実行
cd $IOS_DIR
if [ ! -f "Podfile" ]; then
  echo "  ✗ Podfile が見つかりません (prebuild 失敗？)"
  exit 1
fi
echo "  → pod install..."
pod install 2>&1 | tail -10

echo "INSTALL_DONE"
INSTALL_EOF
  echo "  ✓ 依存解決完了"
fi

# ============================================================
# [4/6] クリーン (derived data + xcodebuild clean)
# ============================================================
if [ "$FAST" = "1" ]; then
  echo ""
  echo "▶ [4/6] SKIP: クリーン省略 (FAST=1)"
else
  echo ""
  echo "▶ [4/6] Mac: DerivedData + xcodebuild clean..."
  ssh -i "$SSH_KEY" -o IdentitiesOnly=yes "$SSH_HOST" "bash -s" <<CLEAN_EOF
set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

# Xcode DerivedData からプロジェクト分だけ削除 (他プロジェクトに影響しない)
find ~/Library/Developer/Xcode/DerivedData -maxdepth 1 -type d -name "ReCallKit-*" \
  -exec rm -rf {} + 2>/dev/null || true
echo "  → DerivedData 削除完了"

# カスタムビルド出力ディレクトリも削除
rm -rf "$MAC_BUILD_OUT" 2>/dev/null || true
echo "  → $MAC_BUILD_OUT 削除完了"

# xcodebuild clean (念のため)
cd "$IOS_DIR"
xcodebuild clean \\
  -workspace ReCallKit.xcworkspace \\
  -scheme $SCHEME \\
  -configuration Release 2>&1 | tail -5 || true

echo "CLEAN_DONE"
CLEAN_EOF
  echo "  ✓ クリーン完了"
fi

# ============================================================
# [5/6] xcodebuild (Release / real device)
# ============================================================
echo ""
echo "▶ [5/6] Mac: xcodebuild (Release / real device → $MAC_BUILD_OUT)..."
ssh -i "$SSH_KEY" -o IdentitiesOnly=yes "$SSH_HOST" "bash -s" <<BUILD_EOF
set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

# キーチェーンアンロック (SSH経由の code signing に必要)
security unlock-keychain -p "$MAC_PASS" ~/Library/Keychains/login.keychain-db 2>/dev/null \
  && echo "  ✓ keychain unlocked" \
  || echo "  ⚠ keychain unlock failed (続行)"

# ロック中のビルドプロセスを事前に終了 (build.db競合防止)
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

# ============================================================
# [6/6] iPhone にインストール
# ============================================================
echo ""
echo "▶ [6/6] Mac: iPhone にインストール..."
ssh -i "$SSH_KEY" -o IdentitiesOnly=yes "$SSH_HOST" "bash -s" <<INSTALL_DEVICE_EOF
set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

APP_PATH=\$(find "$MAC_BUILD_OUT" -name "ReCallKit.app" -path "*/Release-iphoneos/*" 2>/dev/null | head -1)
if [ -z "\$APP_PATH" ]; then
  echo "  ✗ .app ファイルが見つかりません"
  exit 1
fi
echo "  .app: \$APP_PATH"

xcrun devicectl device install app \\
  --device $DEVICE_ID \\
  "\$APP_PATH" 2>&1

echo "INSTALL_DEVICE_DONE"
INSTALL_DEVICE_EOF

echo ""
echo "================================================"
echo "  ✓ iPhone へのインストール完了！"
echo "================================================"
