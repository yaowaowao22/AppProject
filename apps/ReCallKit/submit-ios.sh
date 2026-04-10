#!/usr/bin/env bash
# ============================================================
# submit-ios.sh  -- push → Mac pull → eas build --local → eas submit
# 使い方: bash submit-ios.sh
# ============================================================
set -euo pipefail

SSH_KEY="$HOME/.ssh/id_ed25519_mac"
SSH_HOST="mac@macnoMac-mini.local"
MAC_PROJECT="/Users/mac/AppProject/APP/AppProject"
IPA_OUT="/Users/mac/builds/ReCallKit-release.ipa"
REPO_ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"

# .env.local からパスワード読み込み
ENV_FILE="$(dirname "$0")/.env.local"
if [ -f "$ENV_FILE" ]; then
  source "$ENV_FILE"
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
  git stash push -m "submit-ios auto-stash"
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
echo "▶ [3/4] Mac: eas build --local (production iOS)..."
echo "  ※ 初回は Apple ID / 証明書のセットアップが入ります"
ssh -i "$SSH_KEY" -o IdentitiesOnly=yes "$SSH_HOST" "bash -s" <<BUILD_EOF
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
cd "$MAC_PROJECT/apps/ReCallKit"

# キーチェーンアンロック
security unlock-keychain -p "$MAC_PASS" ~/Library/Keychains/login.keychain-db 2>/dev/null && echo "  ✓ keychain unlocked" || true

# 既存IPAを削除
rm -f "$IPA_OUT"

# EAS ローカルビルド (production)
npx eas-cli build \
  --platform ios \
  --profile production \
  --local \
  --output "$IPA_OUT" \
  --non-interactive 2>&1

echo "BUILD_DONE"
BUILD_EOF
echo "  ✓ ビルド完了: $IPA_OUT"

echo ""
echo "▶ [4/4] Mac: eas submit → App Store Connect..."
ssh -i "$SSH_KEY" -o IdentitiesOnly=yes "$SSH_HOST" "bash -s" <<SUBMIT_EOF
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
cd "$MAC_PROJECT/apps/ReCallKit"

npx eas-cli submit \
  --platform ios \
  --path "$IPA_OUT" \
  --non-interactive 2>&1

echo "SUBMIT_DONE"
SUBMIT_EOF

echo ""
echo "================================================"
echo "  ✓ App Store Connect への提出完了！"
echo "================================================"
