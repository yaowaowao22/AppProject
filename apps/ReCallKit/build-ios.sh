#!/usr/bin/env bash
# ============================================================
# build-ios.sh v3  -- スマート検出ビルド
#   push → Mac pull → pnpm install → 検出 → 条件付きクリーン → build → install
#
# v3 の目玉: ネイティブモジュール変更の自動検出
#   scripts/detect-native-change.py が以下から SHA-256 ハッシュを計算:
#     - node_modules/*/expo-module.config.json を持つ全パッケージの name@version
#     - app.json の expo.plugins / ios / android 設定
#     - react-native.config.js の内容
#   前回成功ビルド時のハッシュと比較して、変化していたら自動でフルクリーン。
#   変化なしなら prebuild/pod install/clean を全スキップして高速ビルド。
#
# デフォルト挙動:
#   bash build-ios.sh
#     → 検出器に従う (ネイティブ変化あり=clean / 無し=fast)
#
# env var オプション (escape hatch):
#   FORCE_CLEAN=1     検出を無視して強制フルクリーン (トラブルシュート時)
#   FORCE_FAST=1      検出を無視して強制高速 (自分で確認済みで急ぐ時)
#   VERBOSE=1         検出器の内訳を stderr に出力
# ============================================================
set -euo pipefail

SSH_KEY="$HOME/.ssh/id_ed25519_mac"
SSH_HOST="mac@macnoMac-mini.local"
MAC_PROJECT="/Users/mac/AppProject/APP/AppProject"
MAC_RECALLKIT="$MAC_PROJECT/apps/ReCallKit"
IOS_DIR="$MAC_RECALLKIT/ios"
MAC_BUILD_OUT="/Users/mac/builds/ReCallKit-ssh-build"
MAC_HASH_FILE="$MAC_RECALLKIT/.build-cache/native-hash"
SCHEME="ReCallKit"
DEVICE_ID="2291EDE3-F144-5AE0-BE21-DF702A7E69DB"  # iPhone 13
REPO_ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"

# ── オプション ──
FORCE_CLEAN="${FORCE_CLEAN:-0}"
FORCE_FAST="${FORCE_FAST:-0}"
VERBOSE="${VERBOSE:-0}"

# .env.local からパスワード読み込み
ENV_FILE="$(dirname "$0")/.env.local"
if [ -f "$ENV_FILE" ]; then
  source "$ENV_FILE"
fi
if [ -z "${MAC_PASS:-}" ]; then
  echo "⚠ MAC_PASS が未設定です。.env.local に MAC_PASS=<password> を追加してください。"
  exit 1
fi

# env 整合性チェック
if [ "$FORCE_CLEAN" = "1" ] && [ "$FORCE_FAST" = "1" ]; then
  echo "⚠ FORCE_CLEAN と FORCE_FAST の同時指定は矛盾します。どちらか一方にしてください。"
  exit 1
fi

echo ""
echo "==============================================="
echo "  ReCallKit iOS Build  (FORCE_CLEAN=$FORCE_CLEAN FORCE_FAST=$FORCE_FAST)"
echo "==============================================="

# ============================================================
# [1/5] git push
# ============================================================
echo ""
echo "▶ [1/5] git push..."
git -C "$REPO_ROOT" push
echo "  ✓ push 完了"

# ============================================================
# [2/5] Mac: git pull
# ============================================================
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

# ============================================================
# [3/5] Mac: pnpm install + ネイティブ変化検出 + 条件付きクリーン
# ============================================================
echo ""
echo "▶ [3/5] Mac: pnpm install + ネイティブ変化検出..."
ssh -i "$SSH_KEY" -o IdentitiesOnly=yes "$SSH_HOST" "bash -s" <<INSTALL_EOF
set -euo pipefail
export PATH="\$HOME/.npm-global/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
# ⚠️ 必須: CocoaPods 1.16.x は String#unicode_normalize を呼ぶため LANG が
#    未設定だと Encoding::CompatibilityError で pod install が失敗する
#    (dentak/ougonApp の build-ios.sh にも同じ export が入っている)
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

# ── 1. pnpm install (monorepo root) ──
# package.json 変更を反映。lockfile 一致なら早期終了するため idempotent で高速。
cd $MAC_PROJECT
echo "  → pnpm install (workspace root)..."
pnpm install 2>&1 | tail -5

# ── 2. ネイティブ変化検出 ──
cd $MAC_RECALLKIT

# 検出器のスクリプトが存在するか (v3 新規追加)
if [ ! -f scripts/detect-native-change.py ]; then
  echo "  ⚠ scripts/detect-native-change.py が見つかりません。git pull は成功した？"
  echo "  → 安全側で NEED_CLEAN=1 として処理を続行"
  NEED_CLEAN=1
  CURRENT_HASH="unavailable"
else
  VERBOSE_FLAG=""
  if [ "$VERBOSE" = "1" ]; then VERBOSE_FLAG="--verbose"; fi

  CURRENT_HASH=\$(python3 scripts/detect-native-change.py \$VERBOSE_FLAG 2>/tmp/recallkit_detect.log) || {
    echo "  ⚠ 検出器が失敗 (log: /tmp/recallkit_detect.log):"
    cat /tmp/recallkit_detect.log || true
    echo "  → 安全側で NEED_CLEAN=1 として処理を続行"
    NEED_CLEAN=1
    CURRENT_HASH="detect_failed"
  }
  if [ "$VERBOSE" = "1" ]; then cat /tmp/recallkit_detect.log >&2 || true; fi

  # 前回ハッシュ読み込み
  if [ -f "$MAC_HASH_FILE" ]; then
    OLD_HASH=\$(cat "$MAC_HASH_FILE")
  else
    OLD_HASH=""
  fi

  # 判定
  if [ "$FORCE_CLEAN" = "1" ]; then
    echo "  → FORCE_CLEAN=1: 強制フルクリーン"
    NEED_CLEAN=1
  elif [ "$FORCE_FAST" = "1" ]; then
    echo "  → FORCE_FAST=1: 強制高速ビルド (clean/prebuild/pod install 省略)"
    NEED_CLEAN=0
  elif [ -z "\$OLD_HASH" ]; then
    echo "  → 初回ビルド (hash キャッシュ無し) → フルクリーン"
    NEED_CLEAN=1
  elif [ "\$CURRENT_HASH" = "\$OLD_HASH" ]; then
    echo "  ✓ ネイティブ変化なし (hash=\${CURRENT_HASH:0:12}...) → 高速ビルド"
    NEED_CLEAN=0
  else
    echo "  ⚠ ネイティブ変化検出 (\${OLD_HASH:0:12}... → \${CURRENT_HASH:0:12}...)"
    echo "    → フルクリーンビルドが必要"
    NEED_CLEAN=1
  fi
fi

# ── 3. 条件付き: expo prebuild + pod install ──
if [ "\$NEED_CLEAN" = "1" ]; then
  cd $MAC_RECALLKIT
  echo "  → npx expo prebuild --platform ios --clean ..."
  npx expo prebuild --platform ios --clean --no-install 2>&1 | tail -10

  cd $IOS_DIR
  if [ ! -f Podfile ]; then
    echo "  ✗ Podfile が見つかりません (prebuild 失敗？)"
    exit 1
  fi
  echo "  → pod install..."
  pod install 2>&1 | tail -5
else
  echo "  (prebuild/pod install スキップ)"
fi

# ── 4. 条件付き: DerivedData wipe + xcodebuild clean ──
if [ "\$NEED_CLEAN" = "1" ]; then
  echo "  → DerivedData wipe..."
  find ~/Library/Developer/Xcode/DerivedData -maxdepth 1 -type d -name "ReCallKit-*" \\
    -exec rm -rf {} + 2>/dev/null || true
  rm -rf "$MAC_BUILD_OUT" 2>/dev/null || true

  cd "$IOS_DIR"
  echo "  → xcodebuild clean..."
  xcodebuild clean \\
    -workspace ReCallKit.xcworkspace \\
    -scheme $SCHEME \\
    -configuration Release 2>&1 | tail -3 || true
else
  echo "  (DerivedData/xcodebuild clean スキップ)"
fi

# 決定結果を Windows 側に伝えるため最後に echo (行頭 RESULT_ で識別)
echo "RESULT_HASH=\$CURRENT_HASH"
echo "RESULT_NEED_CLEAN=\$NEED_CLEAN"
INSTALL_EOF
echo "  ✓ [3/5] 完了"

# ============================================================
# [4/5] Mac: xcodebuild (Release / real device) — OOM 対策有り
#
# Mac mini (Intel) は llama.rn 等の C++ 重量ビルドで簡単に OOM する。
# 以下のガード: -jobs 1 / COMPILER_INDEX_STORE_ENABLE=NO /
# GCC_GENERATE_DEBUGGING_SYMBOLS=NO / CLANG_ENABLE_EXPLICIT_MODULES=NO
# + Spotlight/mediaanalysisd STOP + sudo purge
# ============================================================
echo ""
echo "▶ [4/5] Mac: xcodebuild (Release / real device → $MAC_BUILD_OUT)..."
ssh -i "$SSH_KEY" -o IdentitiesOnly=yes "$SSH_HOST" "bash -s" <<BUILD_EOF
set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

# キーチェーンアンロック
security unlock-keychain -p "$MAC_PASS" ~/Library/Keychains/login.keychain-db 2>/dev/null \\
  && echo "  ✓ keychain unlocked" \\
  || echo "  ⚠ keychain unlock failed (続行)"
security set-keychain-settings -t 36000 ~/Library/Keychains/login.keychain-db 2>/dev/null || true

# 競合ビルドプロセス停止 (graceful: SIGTERM)
#
# ⚠️ ここで build.db や .dia を消してはいけない:
#   build.db は xcodebuild の incremental build state DB で、削除すると
#   前回ビルド状態が失われて全 target の依存再評価が走り、毎回擬似フル
#   リビルド状態になる (ReactCodegen の C++ が全部再コンパイル)。
#   dentak の build-ios.sh は削除しないため incremental 1 分で終わる。
#   ReCallKit も同じ挙動にするためこの 2 行は意図的に残さない。
pkill -f xcodebuild 2>/dev/null || true
pkill -f SWBBuildService 2>/dev/null || true
pkill -f XCBBuildService 2>/dev/null || true
pkill -f ibtoold 2>/dev/null || true
sleep 2

# ── メモリ確保: Spotlight と Media インデクサを一時停止 + purge ──
kill -STOP \$(pgrep -x mds_stores 2>/dev/null) 2>/dev/null || true
kill -STOP \$(pgrep -x mediaanalysisd 2>/dev/null) 2>/dev/null || true
echo "$MAC_PASS" | sudo -S purge 2>/dev/null && echo "  ✓ memory purged" || echo "  ⚠ purge skipped"
FREE_MB=\$(vm_stat | grep 'Pages free' | awk '{print int(\$3)*4/1024}')
echo "  free memory: \${FREE_MB} MB"

cd "$IOS_DIR"

BUILD_LOG=/tmp/recallkit_xcode.log
: > \$BUILD_LOG

# xcodebuild — OOM-safe flags
# -jobs 1                             : 並列コンパイル無効 (メモリ圧迫防止)
# COMPILER_INDEX_STORE_ENABLE=NO       : インデックス生成スキップ
# GCC_GENERATE_DEBUGGING_SYMBOLS=NO    : dSYM 生成スキップ
# CLANG_ENABLE_EXPLICIT_MODULES=NO     : explicit modules 無効化 (メモリ節約)
set +e
xcodebuild \\
  -workspace ReCallKit.xcworkspace \\
  -scheme $SCHEME \\
  -configuration Release \\
  -destination "generic/platform=iOS" \\
  -derivedDataPath "$MAC_BUILD_OUT" \\
  -allowProvisioningUpdates \\
  -jobs 1 \\
  DEVELOPMENT_TEAM=PVM8Q8HG54 \\
  CODE_SIGN_STYLE=Automatic \\
  COMPILER_INDEX_STORE_ENABLE=NO \\
  GCC_GENERATE_DEBUGGING_SYMBOLS=NO \\
  CLANG_ENABLE_EXPLICIT_MODULES=NO \\
  build >> \$BUILD_LOG 2>&1 &
XCODE_PID=\$!
echo "  xcodebuild started (pid \$XCODE_PID)"

# Alive check: 60 秒ごとに free memory と最終行を表示
while kill -0 \$XCODE_PID 2>/dev/null; do
  sleep 60
  FREE=\$(vm_stat | grep 'Pages free' | awk '{print int(\$3)*4/1024}')
  LAST=\$(tail -1 \$BUILD_LOG 2>/dev/null | cut -c1-100)
  echo "  [alive] free:\${FREE}MB  \$LAST"
done

wait \$XCODE_PID
BUILD_EXIT=\$?
set -e

# Spotlight/Media インデクサを再開
kill -CONT \$(pgrep -x mds_stores 2>/dev/null) 2>/dev/null || true
kill -CONT \$(pgrep -x mediaanalysisd 2>/dev/null) 2>/dev/null || true

if [ \$BUILD_EXIT -ne 0 ]; then
  echo "  ✗ xcodebuild FAILED (exit \$BUILD_EXIT) — last 40 lines:"
  tail -40 \$BUILD_LOG
  exit 1
fi
echo "  ✓ BUILD SUCCEEDED"
echo "BUILD_DONE"
BUILD_EOF
echo "  ✓ ビルド完了"

# ============================================================
# [5/5] Mac: iPhone にインストール + ハッシュキャッシュ更新
# ============================================================
echo ""
echo "▶ [5/5] Mac: iPhone にインストール + ハッシュ更新..."
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

# 成功したので現在のハッシュをキャッシュに書き込む
# (ここに到達している = xcodebuild 成功 + devicectl 成功)
cd $MAC_RECALLKIT
mkdir -p .build-cache
if [ -f scripts/detect-native-change.py ]; then
  python3 scripts/detect-native-change.py > "$MAC_HASH_FILE" 2>/dev/null || {
    echo "  ⚠ ハッシュ再計算失敗 (次回ビルドは念のため clean されます)"
    rm -f "$MAC_HASH_FILE"
  }
  if [ -f "$MAC_HASH_FILE" ]; then
    echo "  ✓ ハッシュ更新: \$(cat $MAC_HASH_FILE)"
  fi
fi

echo "INSTALL_DEVICE_DONE"
INSTALL_DEVICE_EOF

echo ""
echo "================================================"
echo "  ✓ iPhone へのインストール完了！"
echo "================================================"
