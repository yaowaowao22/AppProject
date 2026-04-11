#!/usr/bin/env bash
# ============================================================
# fast-js-deploy.sh — Release ビルドで JS のみ変更を高速デプロイ
#
# 原理:
#   既存の .app (Release ビルド済み) に対して main.jsbundle だけを
#   差し替え、.app 全体を再署名して iPhone にインストールする。
#   xcodebuild は全くスキップするため Pods 再コンパイルが発生しない。
#
# 前提条件:
#   - 先に一度 bash build-ios.sh を完走させて .app を作ってある
#   - native コード (app.json / podspec / native module 追加) に変更がない
#
# 使い方:
#   bash fast-js-deploy.sh
#
# ネイティブに変更を加えた場合は bash build-ios.sh に戻すこと。
# ============================================================
set -euo pipefail

SSH_KEY="$HOME/.ssh/id_ed25519_mac"
SSH_HOST="mac@macnoMac-mini.local"
MAC_PROJECT="/Users/mac/AppProject/APP/AppProject"
MAC_RECALLKIT="$MAC_PROJECT/apps/ReCallKit"
MAC_BUILD_OUT="/Users/mac/builds/ReCallKit-ssh-build"
APP_PATH="$MAC_BUILD_OUT/Build/Products/Release-iphoneos/ReCallKit.app"
DEVICE_ID="2291EDE3-F144-5AE0-BE21-DF702A7E69DB"  # iPhone 13
SIGN_IDENTITY="Apple Development: takato umagoe (KTAMR5825A)"
REPO_ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"

# .env.local から MAC_PASS
ENV_FILE="$(dirname "$0")/.env.local"
if [ -f "$ENV_FILE" ]; then
  source "$ENV_FILE"
fi
if [ -z "${MAC_PASS:-}" ]; then
  echo "⚠ MAC_PASS が未設定です。.env.local に MAC_PASS=<password> を追加してください。"
  exit 1
fi

START_SEC=$(date +%s)

echo ""
echo "=================================================="
echo "  ReCallKit Fast JS Deploy (xcodebuild スキップ)"
echo "=================================================="

# ============================================================
# [1/5] git push
# ============================================================
echo ""
echo "▶ [1/5] git push..."
git -C "$REPO_ROOT" push
echo "  ✓ push 完了"

# ============================================================
# [2/5] Mac: git pull + main.jsbundle 再生成 + .app 差し替え
# ============================================================
echo ""
echo "▶ [2/5] Mac: git pull + main.jsbundle 再生成..."
ssh -i "$SSH_KEY" -o IdentitiesOnly=yes "$SSH_HOST" "bash -s" <<PULL_EOF
set -euo pipefail
export PATH="\$HOME/.npm-global/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

cd $MAC_PROJECT
if ! git diff --quiet; then
  echo "  (ローカル変更を stash 中...)"
  git stash push -m "fast-js-deploy auto-stash"
  STASHED=1
else
  STASHED=0
fi
git pull --ff-only 2>&1
if [ "\$STASHED" -eq 1 ]; then
  git stash pop || echo "  ⚠ stash pop failed"
fi

cd $MAC_RECALLKIT

# 既存 .app の存在確認
if [ ! -d "$APP_PATH" ]; then
  echo "  ✗ $APP_PATH が存在しません。先に bash build-ios.sh を実行してください"
  exit 1
fi
echo "  .app: $APP_PATH (\$(stat -f '%Sm' "$APP_PATH"))"

# ── main.jsbundle 再生成 ──
# Expo プロジェクトでは npx react-native bundle は使えない
# (@react-native-community/cli が未依存)。代わりに npx expo export:embed を
# 使う。これは Xcode の script phase "Bundle React Native code and images" が
# 内部で呼ぶコマンドと同じで、Expo SDK が Metro を正しく設定してくれる。
BUNDLE_JS=/tmp/recallkit-main.jsbundle
rm -f "\$BUNDLE_JS"

echo "  → npx expo export:embed (minified)..."
npx expo export:embed \\
  --platform ios \\
  --dev false \\
  --minify true \\
  --entry-file index.ts \\
  --bundle-output "\$BUNDLE_JS" \\
  --assets-dest /tmp/recallkit-assets 2>&1 | tail -15

if [ ! -s "\$BUNDLE_JS" ]; then
  echo "  ✗ expo export:embed が失敗 (空ファイル or 生成されず)"
  exit 1
fi
JS_SIZE=\$(wc -c < "\$BUNDLE_JS")
echo "  → JS bundle: \$JS_SIZE bytes"

# 出力形式の判定: Hermes bytecode なら先頭 8 バイトが 0xC61FBC03C103191F
# (Hermes magic number)。plain JS なら普通の ASCII 文字から始まる。
BUNDLE_MAGIC=\$(head -c 8 "\$BUNDLE_JS" | od -An -tx1 | tr -d ' \\n')
echo "  → bundle magic: \$BUNDLE_MAGIC"
if [[ "\$BUNDLE_MAGIC" == c61fbc03c103191f* ]]; then
  echo "  → 既に Hermes bytecode 形式 (変換不要)"
  IS_HBC=1
else
  echo "  → plain JS 形式 (hermesc 変換が必要)"
  IS_HBC=0
fi

# ── Hermes bytecode 変換 (必要なら) ──
BUNDLE_FINAL=\$BUNDLE_JS
if [ "\$IS_HBC" = "0" ]; then
  HERMESC=""
  for candidate in \\
    node_modules/react-native/sdks/hermesc/osx-bin/hermesc \\
    node_modules/hermes-engine/osx-bin/hermesc \\
    node_modules/react-native/sdks/hermes/osx-bin/hermesc \\
    ios/Pods/hermes-engine/destroot/bin/hermesc \\
  ; do
    if [ -x "\$candidate" ]; then
      HERMESC="\$candidate"
      break
    fi
  done

  if [ -n "\$HERMESC" ]; then
    echo "  → hermesc で bytecode 変換: \$HERMESC"
    "\$HERMESC" -emit-binary -O -out /tmp/recallkit-main.hbc "\$BUNDLE_JS" 2>&1 | tail -5
    if [ -s /tmp/recallkit-main.hbc ]; then
      HBC_SIZE=\$(wc -c < /tmp/recallkit-main.hbc)
      echo "  → HBC bundle: \$HBC_SIZE bytes"
      BUNDLE_FINAL=/tmp/recallkit-main.hbc
    else
      echo "  ⚠ hermesc 変換結果が空、plain JS を使用"
    fi
  else
    echo "  ⚠ hermesc が見つからず plain JS bundle を使用 (Hermes 無効環境?)"
  fi
fi

# ── .app に差し替え ──
cp "\$BUNDLE_FINAL" "$APP_PATH/main.jsbundle"
echo "  ✓ main.jsbundle 差し替え完了"
PULL_EOF
echo "  ✓ [2/5] 完了"

# ============================================================
# [3/5] Mac: .app 全体を再署名
# ============================================================
#
# main.jsbundle を書き換えた時点で CodeResources の hash が壊れるので、
# .app 全体を強制再署名する。既存の entitlements / requirements は保持。
# ============================================================
echo ""
echo "▶ [3/5] Mac: .app 再署名..."
ssh -i "$SSH_KEY" -o IdentitiesOnly=yes "$SSH_HOST" "bash -s" <<SIGN_EOF
set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

# keychain unlock (SSH 経由だと常にロック状態から始まる)
security unlock-keychain -p "$MAC_PASS" ~/Library/Keychains/login.keychain-db 2>/dev/null \\
  && echo "  ✓ keychain unlocked" \\
  || echo "  ⚠ keychain unlock failed (続行)"
security set-keychain-settings -t 36000 ~/Library/Keychains/login.keychain-db 2>/dev/null || true

codesign --force \\
  --sign "$SIGN_IDENTITY" \\
  --preserve-metadata=entitlements,requirements \\
  "$APP_PATH" 2>&1 | tail -5
echo "  ✓ codesign 完了"

# 署名の整合性を検証
if codesign --verify --verbose=2 "$APP_PATH" 2>&1 | tail -5; then
  echo "  ✓ 署名 verify OK"
else
  echo "  ⚠ 署名 verify で問題があったため詳細を表示:"
  codesign --verify --verbose=4 "$APP_PATH" 2>&1 || true
fi
SIGN_EOF
echo "  ✓ [3/5] 完了"

# ============================================================
# [4/5] Mac: iPhone にインストール
# ============================================================
echo ""
echo "▶ [4/5] Mac: iPhone インストール..."
ssh -i "$SSH_KEY" -o IdentitiesOnly=yes "$SSH_HOST" "bash -s" <<INSTALL_EOF
set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

xcrun devicectl device install app \\
  --device $DEVICE_ID \\
  "$APP_PATH" 2>&1 | tail -15
INSTALL_EOF
echo "  ✓ [4/5] 完了"

# ============================================================
# [5/5] 完了時間計測
# ============================================================
END_SEC=$(date +%s)
ELAPSED=$((END_SEC - START_SEC))

echo ""
echo "=================================================="
echo "  ✓ Fast JS Deploy 完了！ (${ELAPSED} 秒)"
echo "=================================================="
