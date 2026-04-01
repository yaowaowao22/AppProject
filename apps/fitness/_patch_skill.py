import sys

filepath = "C:/Users/ytata/.claude/skills/ios-app-store-submission/SKILL.md"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

original_len = len(content)

# -----------------------------------------------------------------------
# 1. Section 3.1 — バージョニング戦略の追記
# -----------------------------------------------------------------------
old_31 = (
    "> `expo-updates` パッケージが入っているか確認:\n"
    "> ```bash\n"
    "> grep expo-updates package.json\n"
    "> # なければ: pnpm add expo-updates\n"
    "> ```\n\n"
    "### 3.2 eas.json"
)

new_31 = (
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

if old_31 in content:
    content = content.replace(old_31, new_31, 1)
    print("3.1 versioning: OK")
else:
    print("3.1 versioning: NOT FOUND")
    sys.exit(1)

# -----------------------------------------------------------------------
# 2. Section 3.2 — Firebase/プッシュ通知ビルド設定の追記
# -----------------------------------------------------------------------
old_32 = (
    "> ⚠️ `eas.json` の submit フィールドは**空文字列を入れるとバリデーションエラー**になる。\n"
    "> ascAppId が未確定の間は `{}` のままにして、取得後に追加する。\n\n"
    "---\n\n"
    "## 4."
)

new_32 = (
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

if old_32 in content:
    content = content.replace(old_32, new_32, 1)
    print("3.2 firebase: OK")
else:
    print("3.2 firebase: NOT FOUND")
    sys.exit(1)

# -----------------------------------------------------------------------
# 3. Section 5.3 — メタデータ管理の教訓
# -----------------------------------------------------------------------
old_5 = (
    "> App Privacy Labels の「Data Not Collected」は ASC UI で手動設定が必要。\n\n"
    "---"
)

new_5 = (
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

if old_5 in content:
    content = content.replace(old_5, new_5, 1)
    print("5.3 metadata: OK")
else:
    print("5.3 metadata: NOT FOUND")
    sys.exit(1)

# -----------------------------------------------------------------------
# 4. Section 6.0 — スクリーンショット撮影方針
# -----------------------------------------------------------------------
old_6 = "### 6.1 `create_screenshots.py` を作成"

new_6 = (
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

if old_6 in content:
    content = content.replace(old_6, new_6, 1)
    print("6.0 screenshots: OK")
else:
    print("6.0 screenshots: NOT FOUND")
    sys.exit(1)

# -----------------------------------------------------------------------
# 5. Section 12 — トラブルシューティング追記
# -----------------------------------------------------------------------
old_12 = "| Bundle ID が ASC に表示されない | 未登録 | ASC API で `POST /v1/bundleIds` を実行 |"

new_12 = (
    "| Bundle ID が ASC に表示されない | 未登録 | ASC API で `POST /v1/bundleIds` を実行 |\n"
    "| Firebase Pod エラー（dynamic framework 競合） | `useFrameworks` 未設定 | `app.json` plugins に `[\"expo-build-properties\", {\"ios\": {\"useFrameworks\": \"static\"}}]` を追加 |\n"
    "| ネイティブ変更後も App が古い挙動をする | OTA 更新では反映不可 | `eas build` で新ビルドを作成して TestFlight 経由で再確認 |\n"
    "| buildNumber が ASC と競合する | ローカル管理との二重管理 | `eas.json` に `\"appVersionSource\": \"remote\"` を設定して ASC 側で一元管理 |"
)

if old_12 in content:
    content = content.replace(old_12, new_12, 1)
    print("12 troubleshooting: OK")
else:
    print("12 troubleshooting: NOT FOUND")
    sys.exit(1)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Done. {original_len} -> {len(content)} chars (+{len(content)-original_len})")
