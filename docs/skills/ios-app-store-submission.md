# スキル: iOS App Store 審査提出 (massapp モノレポ)

> このスキルを読めば、massapp モノレポ内の **任意の Expo/EAS アプリ**を
> ゼロから App Store 審査提出まで完結できる。
> 実績: push-notify ✅通過済み / TANREN (fitness) 🔄進行中

---

## 0. 事前確認（共通情報）

```
Apple Team ID : PVM8Q8HG54
Apple ID      : y.tata02020202@icloud.com
ASC API Key   : WBL22JQ6B3
ASC Issuer ID : 0bc13228-682d-418b-a53e-d74894424555
P8 Key        : C:/Users/ytata/Downloads/AuthKey_WBL22JQ6B3.p8
Expo Owner    : yaowao
Cloudflare    : selectinfo-yaowao.workers.dev
```

---

## 1. アプリ情報を決める（最初に埋める）

| 変数 | 説明 | 例 |
|------|------|----|
| `APP_SLUG` | Expo slug / monorepo ディレクトリ名 | `fitness` |
| `APP_NAME` | App Store 表示名 | `TANREN` |
| `BUNDLE_ID` | iOS Bundle Identifier | `com.massapp.fitness` |
| `SUBTITLE` | 日本語サブタイトル (30文字以内) | `筋トレ記録を、シンプルに` |
| `CATEGORY` | ASC Primary Category | `HEALTH_AND_FITNESS` |
| `CATEGORY2` | ASC Secondary Category | `LIFESTYLE` |
| `KEYWORDS` | 検索キーワード (100文字以内、カンマ区切り) | `筋トレ,ワークアウト,...` |
| `SKU` | ASC 用ユニーク SKU | `tanren-fitness-2026` |
| `API_SLUG` | Cloudflare Worker 名 | `fitness-api` |
| `REVIEW_NOTES` | 審査担当者向けメモ (英語) | `No login required. Offline only.` |

---

## 2. バックエンド API (Cloudflare Workers) を作る

> 目的: プライバシーポリシー・サポートページをホスティング（審査必須）

### 2.1 ディレクトリ作成

```bash
mkdir -p server/{API_SLUG}/src
```

### 2.2 必要ファイル

**`server/{API_SLUG}/package.json`**
```json
{
  "name": "{API_SLUG}",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20241205.0",
    "typescript": "~5.9.2",
    "wrangler": "^4.14.0"
  }
}
```

**`server/{API_SLUG}/wrangler.toml`**
```toml
name = "{API_SLUG}"
main = "src/index.ts"
compatibility_date = "2025-01-01"
```

**`server/{API_SLUG}/tsconfig.json`**
```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "lib": ["ESNext"],
    "types": ["@cloudflare/workers-types"]
  },
  "include": ["src"]
}
```

**`server/{API_SLUG}/src/index.ts`** — 以下のテンプレートを使い、`{APP_NAME}` を置換する:

```typescript
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/privacy') return privacyHtml();
    if (path === '/support') return supportHtml();
    if (path === '/' || path === '/health') {
      return new Response(JSON.stringify({ service: '{APP_NAME} API', status: 'ok' }),
        { headers: { 'Content-Type': 'application/json' } });
    }
    return new Response('Not Found', { status: 404 });
  },
} satisfies ExportedHandler;

function privacyHtml(): Response {
  // → server/fitness-api/src/index.ts の privacyPolicyHtml() を参考に
  // → アプリ名・データ収集内容・連絡先を修正して使う
}

function supportHtml(): Response {
  // → server/fitness-api/src/index.ts の supportPageHtml() を参考に
  // → FAQ 内容をアプリに合わせて修正
}
```

> 参考: `server/fitness-api/src/index.ts`（そのままコピーしてアプリ名だけ変更でOK）

### 2.3 デプロイ

```bash
cd server/{API_SLUG}
npm install
npx wrangler deploy
# → https://{API_SLUG}.selectinfo-yaowao.workers.dev
```

### 2.4 疎通確認

```bash
curl https://{API_SLUG}.selectinfo-yaowao.workers.dev/health
curl https://{API_SLUG}.selectinfo-yaowao.workers.dev/privacy  # HTML が返れば OK
```

---

## 3. アプリ設定ファイルを更新する

### 3.1 app.json — EAS projectId & expo-updates

```bash
cd apps/{APP_SLUG}
npx eas init --non-interactive --force
# → projectId が自動で app.json に書き込まれる
```

その後 `app.json` に手動で追加:
```jsonc
{
  "expo": {
    // eas init で自動設定される:
    "extra": { "eas": { "projectId": "<自動設定>" } },

    // 手動で追加:
    "updates": { "url": "https://u.expo.dev/<projectId>" },
    "runtimeVersion": { "policy": "appVersion" },
    "plugins": [
      "expo-updates",                                            // ← 追加
      ["expo-build-properties", { "ios": { "useFrameworks": "static" } }]
    ]
  }
}
```

> `expo-updates` パッケージが入っているか確認:
> ```bash
> grep expo-updates package.json
> # なければ: pnpm add expo-updates
> ```

### 3.2 eas.json — production プロファイル強化

```json
{
  "cli": { "version": ">= 16.0.0", "appVersionSource": "remote" },
  "build": {
    "development": {
      "developmentClient": true, "distribution": "internal",
      "ios": { "simulator": true }, "android": { "buildType": "apk" }
    },
    "preview": {
      "distribution": "internal", "channel": "preview",
      "ios": { "simulator": false }, "android": { "buildType": "apk" }
    },
    "production": {
      "autoIncrement": true, "channel": "production",
      "ios": { "image": "latest" }, "android": { "buildType": "app-bundle" }
    }
  },
  "submit": {
    "production": {
      "ios": { "ascAppId": "<ASCでアプリ作成後に設定>" }
    }
  }
}
```

> ⚠️ `eas.json` の submit フィールドは**空文字列を入れるとバリデーションエラー**になる。
> ascAppId が未確定の間は `{}` のままにして、取得後に追加する。

---

## 4. App Store Connect でアプリを作成する（手動 1 回だけ）

> ⚠️ **ASC API は `POST /apps` を許可していない**。この手順だけ手動。

1. https://appstoreconnect.apple.com を開く
2. 「Apps」 → 「+」 → 「新しい App」
3. 入力:
   - プラットフォーム: **iOS**
   - 名前: **`{APP_NAME}`**
   - 主要言語: **日本語**
   - Bundle ID: **`{BUNDLE_ID}`**（登録済みのもの）
   - SKU: **`{SKU}`**
4. 「作成」をクリック
5. URL の数字部分が `ascAppId` → `eas.json` の `submit.production.ios.ascAppId` に設定

> Bundle ID が一覧に出ない場合、下記で事前登録:
> ```python
> # ASC API で Bundle ID 登録
> POST /v1/bundleIds
> { "data": { "type": "bundleIds",
>     "attributes": { "identifier": "{BUNDLE_ID}", "name": "{APP_NAME}", "platform": "IOS" } } }
> ```
> → `setup_asc.py` の上部にある `token()` / `h()` 関数を使って実行

---

## 5. ASC メタデータを設定する（自動化済み）

### 5.1 `setup_asc.py` を作成

`apps/push-notify/setup_asc.py` をコピーして以下を変更:

```python
BUNDLE_ID   = "{BUNDLE_ID}"
APP_NAME    = "{APP_NAME}"
PRIVACY_URL = "https://{API_SLUG}.selectinfo-yaowao.workers.dev/privacy"
SUPPORT_URL = "https://{API_SLUG}.selectinfo-yaowao.workers.dev/support"
```

カテゴリ (`set_categories`):
```python
"primaryCategory":   {"data": {"type": "appCategories", "id": "{CATEGORY}"}},
"secondaryCategory": {"data": {"type": "appCategories", "id": "{CATEGORY2}"}},
```

バージョンローカライズ (`set_version_loc`):
```python
attrs = {
    "description":     "{説明文}",
    "keywords":        "{KEYWORDS}",
    "promotionalText": "{プロモーショナルテキスト}",
    "supportUrl":      SUPPORT_URL,
}
```

レビュー情報 (`set_review_info`):
```python
"notes": "{REVIEW_NOTES}"
```

### 5.2 実行

```bash
cd apps/{APP_SLUG}
python setup_asc.py
```

設定される内容:
- ✅ カテゴリ (Primary / Secondary)
- ✅ サブタイトル・プライバシーポリシーURL
- ✅ 説明文・キーワード・プロモーショナルテキスト・サポートURL
- ✅ レビュー担当者情報・レビューノート
- ✅ 年齢レーティング (4+)

> App Privacy Labels の「Data Not Collected」は ASC UI で手動設定が必要。

---

## 6. スクリーンショットをアップロードする

### 6.1 `create_screenshots.py` を作成

`apps/fitness/create_screenshots.py` をコピーして以下を変更:

```python
BUNDLE_ID = "{BUNDLE_ID}"
```

### 6.2 スクリーンショットを撮影

| 画面 | 推奨内容 |
|------|---------|
| 1枚目 | アプリのメイン画面（一目でわかる機能） |
| 2枚目 | コア機能の操作中の画面 |
| 3枚目 | 統計・実績・データ画面 |
| 4枚目 | 設定・カスタマイズ画面 |

iOS シミュレーターで 6.7" (iPhone 15 Pro Max) をターゲットに撮影。

```bash
mkdir -p apps/{APP_SLUG}/screenshots
# screenshot_1.png ~ screenshot_4.png を配置
```

### 6.3 アップロード（3サイズ自動リサイズ）

```bash
cd apps/{APP_SLUG}
python create_screenshots.py local
# → 6.7" / 6.5" / 5.5" の 3 サイズを自動リサイズして ASC にアップロード
```

> 依存: `pip install Pillow requests PyJWT`

---

## 7. ビルドする

```bash
cd apps/{APP_SLUG}
eas build --platform ios --profile production
```

- 所要時間: 約 15〜30 分
- Distribution Certificate / Provisioning Profile は EAS が自動管理
- 完了後 TestFlight に自動アップロードされる

---

## 8. TestFlight で確認する

1. ASC → TestFlight → 内部テスト → ビルドを選択
2. 実機で動作確認（必須チェック項目）:
   - [ ] 起動〜基本操作が正常
   - [ ] クラッシュなし
   - [ ] プライバシーポリシー画面が開く
   - [ ] 利用規約画面が開く
   - [ ] データが端末内に保存される（オフライン動作）

---

## 9. App Store に提出する

### 9.1 EAS Submit

```bash
cd apps/{APP_SLUG}
eas submit --platform ios --profile production
```

### 9.2 ASC で審査サブミッション

EAS Submit 後、ASC で手動確認:
1. ASC → アプリ → バージョン
2. スクリーンショット・説明文・メタデータが正しいか確認
3. 「審査に提出」をクリック

---

## 10. 全体フロー まとめ

```
新しいアプリを App Store に出すとき:

[自動] 1. eas init --non-interactive --force     # EAS projectId 取得
[自動] 2. app.json に expo-updates 設定追加
[自動] 3. eas.json を production/preview 強化
[自動] 4. server/{API_SLUG}/ を作成・デプロイ    # PP/Support URL
           npx wrangler deploy
[手動] 5. ASC で新規アプリ作成 → ascAppId 取得
[自動] 6. eas.json の ascAppId を更新
[自動] 7. python setup_asc.py                    # メタデータ一括設定
[手動] 8. App Privacy Labels → "Data Not Collected"
[手動] 9. スクリーンショット撮影 → screenshots/ に配置
[自動] 10. python create_screenshots.py local    # SS アップロード
[手動] 11. アイコン確認 (1024×1024, 透過なし)
[自動] 12. eas build --platform ios --profile production
[手動] 13. TestFlight で動作確認
[自動] 14. eas submit --platform ios --profile production
[手動] 15. ASC で「審査に提出」
```

手動ステップは **5 つ**だけ（5, 8, 9, 11, 13, 15）。

---

## 11. 各アプリの実績

| アプリ | Bundle ID | EAS Project ID | ASC App ID | 状態 |
|--------|-----------|----------------|------------|------|
| push-notify | `com.massapp.pushnotify` | `6bb9b696-...` | `6759830379` | ✅ 審査通過 |
| TANREN (fitness) | `com.massapp.fitness` | `136412e9-...` | 未取得 | 🔄 進行中 |

---

## 12. トラブルシューティング

| 症状 | 原因 | 対処 |
|------|------|------|
| `eas init` が失敗 | 非インタラクティブ環境 | `--non-interactive --force` を付ける |
| `eas.json` バリデーションエラー | submit フィールドに空文字 | 空フィールドは削除、`{}` のままにする |
| `setup_asc.py` で App not found | ASC にアプリ未作成 | ステップ 5 で手動作成後に実行 |
| ASC API 403 FORBIDDEN on POST /apps | API CREATE 非対応 | 手動で ASC UI から作成（必須） |
| wrangler deploy 失敗 | ログイン未済 | `wrangler login` を実行 |
| Screenshots upload 失敗 | PIL 未インストール | `pip install Pillow requests PyJWT` |
| Bundle ID が ASC に表示されない | 未登録 | ASC API で `POST /v1/bundleIds` を実行 |

---

## 13. 参考ファイル

| ファイル | 役割 |
|----------|------|
| `server/fitness-api/src/index.ts` | Workers API テンプレート（PP/Support HTML含む） |
| `apps/fitness/setup_asc.py` | ASC メタデータ設定スクリプトのテンプレート |
| `apps/fitness/create_screenshots.py` | SS リサイズ・アップロードスクリプトのテンプレート |
| `apps/push-notify/setup_asc.py` | 初代テンプレート（審査通過済みアプリ） |
| `apps/push-notify/eas.json` | EAS 設定の参照 |
| `apps/push-notify/app.json` | Expo 設定の参照 |
