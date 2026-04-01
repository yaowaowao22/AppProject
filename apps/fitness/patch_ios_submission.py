#!/usr/bin/env python3
"""
patch_ios_submission.py
ios-app-store-submission/SKILL.md への包括的パッチスクリプト

適用パッチ:
  3.1  バージョニング戦略の追記
  3.2  Firebase/プッシュ通知ビルド設定の追記
  5.3  メタデータ管理の教訓
  6.0  スクリーンショット撮影方針
  12   トラブルシューティング行追加
  K    提出前チェックリスト拡充（セクション8末尾）
  L    審査リジェクト対処パターン（セクション12末尾）

冪等性: 適用済みの場合はスキップ
エラー時: WARNING を出力して続行（sys.exit しない）
"""

SKILL_PATH = 'C:/Users/ytata/.claude/skills/ios-app-store-submission/SKILL.md'

with open(SKILL_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

original_len = len(content)


# =======================================================================
# Patch 3.1 — バージョニング戦略の追記
# =======================================================================
_MARKER_31 = "#### バージョニング戦略（App Store 提出フロー視点）"
_OLD_31 = (
    "> `expo-updates` パッケージが入っているか確認:\n"
    "> ```bash\n"
    "> grep expo-updates package.json\n"
    "> # なければ: pnpm add expo-updates\n"
    "> ```\n\n"
    "### 3.2 eas.json"
)
_NEW_31 = (
    "> `expo-updates` パッケージが入っているか確認:\n"
    "> ```bash\n"
    "> grep expo-updates package.json\n"
    "> # なければ: pnpm add expo-updates\n"
    "> ```\n\n"
    "#### バージョニング戦略（App Store 提出フロー視点）\n\n"
    "`runtimeVersion` ポリシーは **`\"appVersion\"`** を推奨。`version` の変更 = 新ビルド必須、という明確なルールになる。\n\n"
    "**バージョンバンプ判断基準（fitness 0.1.0→0.2.0 の実績）:**\n\n"
    "| 変更種別 | 対応 |\n"
    "|---------|------|\n"
    "| ネイティブコード変更（新規ライブラリ、Firebase 追加等） | `version` を上げて **`eas build`** 必須 |\n"
    "| JS/TS のみの変更 | バージョン変更不要、`eas update --channel production` で OTA 配信可 |\n"
    "| App Store へ再提出が必要な変更 | マイナーバンプ（例: 0.1.0 → 0.2.0） |\n\n"
    "`eas.json` に `\"appVersionSource\": \"remote\"` を設定すると ASC 側でビルド番号（buildNumber）を管理できるため、ローカルとの競合を防げる。\n\n"
    "> ⚠️ Firebase やネイティブプラグイン追加後は OTA 更新では反映されない。必ず `eas build` を再実行すること。\n\n"
    "### 3.2 eas.json"
)

if _MARKER_31 in content:
    print("3.1 versioning: SKIP (already applied)")
elif _OLD_31 in content:
    content = content.replace(_OLD_31, _NEW_31, 1)
    print("3.1 versioning: OK")
else:
    print("WARNING: 3.1 versioning: anchor not found, skipping")


# =======================================================================
# Patch 3.2 — Firebase/プッシュ通知ビルド設定の追記
# =======================================================================
_MARKER_32 = "#### Firebase / プッシュ通知を使うアプリのビルド設定"
_OLD_32 = (
    "> ⚠️ `eas.json` の submit フィールドは**空文字列を入れるとバリデーションエラー**になる。\n"
    "> ascAppId が未確定の間は `{}` のままにして、取得後に追加する。\n\n"
    "---\n\n"
    "## 4."
)
_NEW_32 = (
    "> ⚠️ `eas.json` の submit フィールドは**空文字列を入れるとバリデーションエラー**になる。\n"
    "> ascAppId が未確定の間は `{}` のままにして、取得後に追加する。\n\n"
    "#### Firebase / プッシュ通知を使うアプリのビルド設定\n\n"
    "Firebase を統合する場合、`app.json` に **`expo-build-properties`** プラグインが必須。\n\n"
    "```jsonc\n"
    "// app.json plugins\n"
    "[\"expo-build-properties\", { \"ios\": { \"useFrameworks\": \"static\" } }]\n"
    "```\n\n"
    "- `useFrameworks: \"static\"` がないと Firebase の dynamic framework と競合してビルドエラーになる\n"
    "- EAS managed workflow では Podfile を直接編集しなくてよい（プラグインが自動修正）\n"
    "- `GoogleService-Info.plist` は `apps/{APP_SLUG}/` 直下に配置し、`app.json` の `plugins` で参照\n"
    "- 証明書・プロビジョニングは EAS が自動管理（`eas build` 実行時に対話形式で設定）\n\n"
    "> 詳細な EAS 設定は `expo-mobile-builder` スキルに委譲。ここでは App Store 提出に影響する設定のみ記載。\n\n"
    "---\n\n"
    "## 4."
)

if _MARKER_32 in content:
    print("3.2 firebase: SKIP (already applied)")
elif _OLD_32 in content:
    content = content.replace(_OLD_32, _NEW_32, 1)
    print("3.2 firebase: OK")
else:
    print("WARNING: 3.2 firebase: anchor not found, skipping")


# =======================================================================
# Patch 5.3 — メタデータ管理の教訓
# =======================================================================
_MARKER_53 = "### 5.3 メタデータ管理の教訓（fitness アプリ実績）"
_OLD_53 = (
    "> App Privacy Labels の「Data Not Collected」は ASC UI で手動設定が必要。\n\n"
    "---"
)
_NEW_53 = (
    "> App Privacy Labels の「Data Not Collected」は ASC UI で手動設定が必要。\n\n"
    "### 5.3 メタデータ管理の教訓（fitness アプリ実績）\n\n"
    "**ローカライズ対応:**\n"
    "- `setup_asc.py` は **日本語（ja）** と **英語（en-US）** の両ロケールを設定すること\n"
    "- ASC の主要言語を「日本語」にしていても、英語ロケールが空だと審査で指摘されるケースがある\n"
    "- 説明文・キーワード・プロモーショナルテキストはロケールごとに個別設定が必要\n\n"
    "**URL 設定の注意点:**\n"
    "- `privacyPolicyUrl` は **App Info レベル**（バージョン非依存）で設定する必要がある\n"
    "- `supportUrl` は バージョンローカライズの `attrs` に含める\n"
    "- URL は `https://` で始まること（審査要件）。Workers の URL をそのまま使えば問題なし\n\n"
    "**キーワード制限:**\n"
    "- 100文字制限（カンマ・スペースを含む）を超えると API エラーになる\n"
    "- 事前に `len(keywords_string) <= 100` を確認してから実行すること\n\n"
    "---"
)

if _MARKER_53 in content:
    print("5.3 metadata: SKIP (already applied)")
elif _OLD_53 in content:
    content = content.replace(_OLD_53, _NEW_53, 1)
    print("5.3 metadata: OK")
else:
    print("WARNING: 5.3 metadata: anchor not found, skipping")


# =======================================================================
# Patch 6.0 — スクリーンショット撮影方針
# =======================================================================
_MARKER_60 = "### 6.0 スクリーンショット撮影方針"
_OLD_60 = "### 6.1 `create_screenshots.py` を作成"
_NEW_60 = (
    "### 6.0 スクリーンショット撮影方針\n\n"
    "| 手法 | 向いているケース |\n"
    "|------|---------------|\n"
    "| **シミュレーター手動撮影** | 1〜2アプリ、変更頻度低い場合（現在の推奨） |\n"
    "| **Maestro** | E2Eフローで自動撮影したい場合（導入コスト低め） |\n"
    "| **fastlane snapshot** | 多言語・多サイズを完全自動化したい場合（導入コスト高め） |\n\n"
    "**必要サイズ一覧:**\n\n"
    "| サイズ | 解像度 | 対象デバイス |\n"
    "|--------|--------|------------|\n"
    "| 6.7\" | 1290×2796 | iPhone 15 Pro Max 等（必須） |\n"
    "| 6.5\" | 1242×2688 | iPhone 11 Pro Max 等（必須） |\n"
    "| 5.5\" | 1242×2208 | iPhone 8 Plus 等（必須） |\n\n"
    "> `create_screenshots.py` は Pillow でリサイズするため、**元画像は必ず 6.7\" 解像度で撮影**すること。\n"
    "> Xcode シミュレーターで iPhone 15 Pro Max を選択 → `Cmd + S` で保存。\n\n"
    "### 6.1 `create_screenshots.py` を作成"
)

if _MARKER_60 in content:
    print("6.0 screenshots: SKIP (already applied)")
elif _OLD_60 in content:
    content = content.replace(_OLD_60, _NEW_60, 1)
    print("6.0 screenshots: OK")
else:
    print("WARNING: 6.0 screenshots: anchor not found, skipping")


# =======================================================================
# Patch 12 — トラブルシューティング行追加
# =======================================================================
_MARKER_12 = "| Firebase Pod エラー（dynamic framework 競合）"
_OLD_12 = "| Bundle ID が ASC に表示されない | 未登録 | ASC API で `POST /v1/bundleIds` を実行 |"
_NEW_12 = (
    "| Bundle ID が ASC に表示されない | 未登録 | ASC API で `POST /v1/bundleIds` を実行 |\n"
    "| Firebase Pod エラー（dynamic framework 競合） | `useFrameworks` 未設定 | `app.json` plugins に `[\"expo-build-properties\", {\"ios\": {\"useFrameworks\": \"static\"}}]` を追加 |\n"
    "| ネイティブ変更後も App が古い挙動をする | OTA 更新では反映不可 | `eas build` で新ビルドを作成して TestFlight 経由で再確認 |\n"
    "| buildNumber が ASC と競合する | ローカル管理との二重管理 | `eas.json` に `\"appVersionSource\": \"remote\"` を設定して ASC 側で一元管理 |"
)

if _MARKER_12 in content:
    print("12 troubleshooting: SKIP (already applied)")
elif _OLD_12 in content:
    content = content.replace(_OLD_12, _NEW_12, 1)
    print("12 troubleshooting: OK")
else:
    print("WARNING: 12 troubleshooting: anchor not found, skipping")


# =======================================================================
# Patch K — 提出前チェックリスト拡充（セクション8末尾）
# =======================================================================
_MARKER_K = "### 提出前チェックリスト"
_OLD_K = (
    "   - [ ] データが端末内に保存される（オフライン動作）\n\n"
    "---\n\n"
    "## 9. App Store に提出する"
)
_NEW_K = (
    "   - [ ] データが端末内に保存される（オフライン動作）\n\n"
    "### 提出前チェックリスト\n\n"
    "**メタデータチェック:**\n"
    "- [ ] アプリ名が15文字以内（推奨）/ 30文字以内（必須上限）\n"
    "- [ ] サブタイトルが30文字以内\n"
    "- [ ] キーワードが100文字以内\n"
    "- [ ] 説明文に他社アプリ名・OS名の比較表現がない\n"
    "- [ ] プライバシーポリシーURLが正常にアクセス可能\n"
    "- [ ] サポートURLが正常にアクセス可能\n\n"
    "**スクリーンショットチェック:**\n"
    '- [ ] 6.7" サイズのSSが最低1枚（必須）\n'
    '- [ ] 6.5" / 5.5" のSSが揃っている\n'
    "- [ ] 全SSでUIが崩れていない\n\n"
    "**技術チェック:**\n"
    "- [ ] アイコン1024×1024px、透過なし、角丸なし\n"
    "- [ ] ビルドバージョンが前回提出より大きい（autoIncrementで自動）\n"
    "- [ ] NSCameraUsageDescription等の使用しないpermissionを削除済み\n"
    "- [ ] Bitcode設定（SDK 49以降: 不要）\n\n"
    "**審査情報チェック:**\n"
    "- [ ] ReviewNotesが英語で記載済み\n"
    "- [ ] デモアカウントが必要な場合は認証情報を記載\n"
    "- [ ] 年齢レーティングが正しい（4+ / 12+ / 17+）\n\n"
    "---\n\n"
    "## 9. App Store に提出する"
)

if _MARKER_K in content:
    print("K pre-submission checklist: SKIP (already applied)")
elif _OLD_K in content:
    content = content.replace(_OLD_K, _NEW_K, 1)
    print("K pre-submission checklist: OK")
else:
    print("WARNING: K pre-submission checklist: anchor not found, skipping")


# =======================================================================
# Patch L — 審査リジェクト対処パターン（セクション12末尾）
# ※ Patch 12 適用後に buildNumber 行がアンカーになる
# =======================================================================
_MARKER_L = "| Guideline 2.1 - App Completeness |"
_OLD_L = (
    "| buildNumber が ASC と競合する | ローカル管理との二重管理 | "
    "`eas.json` に `\"appVersionSource\": \"remote\"` を設定して ASC 側で一元管理 |"
)
_NEW_L = (
    "| buildNumber が ASC と競合する | ローカル管理との二重管理 | "
    "`eas.json` に `\"appVersionSource\": \"remote\"` を設定して ASC 側で一元管理 |\n"
    "| Guideline 2.1 - App Completeness | ログイン画面でクラッシュ | デモ用認証情報をReviewNotesに記載 |\n"
    "| Guideline 4.0 - Design: Copycat | UI が他アプリと酷似と判定 | スクリーンショットとレビューノートでオリジナリティを説明 |\n"
    "| ITMS-90683: Missing Purpose String | Info.plistのUsage Description欠落 | app.jsonのios.infoPlistに対象のUsage Descriptionを追加 |\n"
    '| Binary rejected: Invalid Swift version | Xcodeバージョン不一致 | eas.json の ios.image を "latest" に設定 |'
)

if _MARKER_L in content:
    print("L rejection patterns: SKIP (already applied)")
elif _OLD_L in content:
    content = content.replace(_OLD_L, _NEW_L, 1)
    print("L rejection patterns: OK")
else:
    print("WARNING: L rejection patterns: anchor not found, skipping")


# =======================================================================
# Write back
# =======================================================================
with open(SKILL_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

new_len = len(content)
print(f"\nDone. {original_len} → {new_len} chars (+{new_len - original_len})")
