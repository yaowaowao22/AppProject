# TANREN (fitness) iOS審査準備ガイド

> push-notify（審査通過済み）のワークフローをベースに、fitnessアプリのiOS審査提出までの全手順をまとめたドキュメント。
> 最終的にスキル化するための参照資料。

---

## 0. 前提情報

### push-notify（審査通過済み）の構成

| 項目 | 値 |
|------|-----|
| Bundle ID | `com.massapp.pushnotify` |
| EAS Project ID | `6bb9b696-be28-40e8-a06b-dda93652e07c` |
| ASC App ID | `6759830379` |
| Apple Team ID | `PVM8Q8HG54` |
| Owner | `yaowao` |
| Backend | Cloudflare Workers (`push-api.selectinfo-yaowao.workers.dev`) |
| Privacy Policy | `https://push-api.selectinfo-yaowao.workers.dev/privacy` |
| Support URL | `https://push-api.selectinfo-yaowao.workers.dev/support` |
| Terms | Apple Standard EULA |
| Monetization | RevenueCat (¥300 買い切り) |
| AdMob | 設定済み（無効化中） |
| ASC API Key ID | `WBL22JQ6B3` |
| ASC Issuer ID | `0bc13228-682d-418b-a53e-d74894424555` |
| P8 Key Path | `C:/Users/ytata/Downloads/AuthKey_WBL22JQ6B3.p8` |

### fitness（現状）

| 項目 | 値 | 状態 |
|------|-----|------|
| Bundle ID | `com.massapp.fitness` | ✅ 設定済み |
| App Name | TANREN | ✅ 設定済み |
| EAS Project ID | (空) | ❌ 未設定 |
| ASC App ID | (空) | ❌ 未設定 |
| Apple Team ID | (空) | ❌ 未設定 |
| Backend API | なし | ❌ 未作成 |
| Privacy Policy | なし | ❌ 必須 |
| Support URL | なし | ❌ 必須 |
| expo-updates | なし | ❌ 未設定 |
| Submit Config | 空 | ❌ 未設定 |
| Production build config | 基本のみ | ⚠️ 要強化 |
| スクリーンショット | なし | ❌ 未作成 |
| ASCメタデータ | なし | ❌ 未設定 |

---

## 1. EASプロジェクト登録

### 1.1 EAS初期化

```bash
cd apps/fitness
npx eas init
```

- Expoアカウント `yaowao` にプロジェクトが登録される
- `projectId` が発行される → app.jsonに自動反映

### 1.2 app.json 更新内容

```jsonc
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "<発行されたID>"  // eas init で自動設定
      }
    },
    // expo-updates 追加
    "updates": {
      "url": "https://u.expo.dev/<projectId>"
    },
    "runtimeVersion": {
      "policy": "appVersion"
    },
    // plugins に expo-updates 追加
    "plugins": [
      "expo-updates",
      ["expo-build-properties", { "ios": { "useFrameworks": "static" } }]
    ]
  }
}
```

---

## 2. Cloudflare Workers バックエンド (fitness-api)

push-notifyと同じパターンで、最低限のAPIサーバーを作成。

### 2.1 目的

- プライバシーポリシーページのホスティング（審査必須）
- サポートページのホスティング（審査必須）
- ヘルスチェックエンドポイント
- 将来的な機能拡張の基盤（データ同期、統計など）

### 2.2 ディレクトリ構成

```
server/fitness-api/
├── src/
│   └── index.ts          # Worker本体
├── wrangler.toml         # Wrangler設定
├── package.json
└── tsconfig.json
```

### 2.3 エンドポイント

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/` | ヘルスチェック |
| GET | `/privacy` | プライバシーポリシー（HTML） |
| GET | `/support` | サポート/FAQ（HTML） |
| GET | `/health` | ステータスチェック |

### 2.4 デプロイ

```bash
cd server/fitness-api
npx wrangler deploy
```

URL: `https://fitness-api.selectinfo-yaowao.workers.dev`

---

## 3. eas.json 更新

### push-notifyとの差分

```jsonc
{
  "cli": {
    "version": ">= 16.0.0",
    "appVersionSource": "remote"   // ← そのまま（remoteでOK）
  },
  "build": {
    "development": { /* 現状維持 */ },
    "preview": {
      "distribution": "internal",
      "channel": "preview",        // ← 追加
      "ios": { "simulator": false },
      "android": { "buildType": "apk" }
    },
    "production": {
      "autoIncrement": true,
      "channel": "production",     // ← 追加
      "ios": { "image": "latest" },// ← 追加
      "android": { "buildType": "app-bundle" }  // ← 追加
    }
  },
  "submit": {
    "production": {
      "ios": {
        "ascAppId": "<ASCで作成後に取得>"  // ← Apple ID/Team IDは不要（ascAppIdのみ）
      }
    }
  }
}
```

---

## 4. App Store Connect セットアップ

### 4.1 ASC APIで自動化（Pythonスクリプト）

push-notifyの `setup_asc.py` をベースに、fitness用を作成。

**認証情報（共通）:**
```python
KEY_ID = "WBL22JQ6B3"
ISSUER_ID = "0bc13228-682d-418b-a53e-d74894424555"
P8_PATH = "C:/Users/ytata/Downloads/AuthKey_WBL22JQ6B3.p8"
BUNDLE_ID = "com.massapp.fitness"
BASE = "https://api.appstoreconnect.apple.com/v1"
```

### 4.2 メタデータ設定内容

| 項目 | 値 |
|------|-----|
| App Name (日本語) | TANREN |
| Subtitle | 筋トレ記録を、シンプルに |
| Primary Category | HEALTH_AND_FITNESS |
| Secondary Category | LIFESTYLE |
| Privacy Policy URL | `https://fitness-api.selectinfo-yaowao.workers.dev/privacy` |
| Support URL | `https://fitness-api.selectinfo-yaowao.workers.dev/support` |
| Terms | Apple Standard EULA |
| Age Rating | 4+ (全項目NONE) |
| Price | 無料 |

### 4.3 キーワード（100文字以内）

```
筋トレ,ワークアウト,トレーニング記録,筋肉,ジム,フィットネス,PR,自重,ダンベル,ログ
```

### 4.4 説明文

```
TANRENは、日々の筋トレを記録するシンプルなワークアウトアプリです。

■ 主な機能
・部位別のエクササイズ選択（胸・背中・脚・肩・腕・体幹）
・45種目のエクササイズデータベース
・重量×回数のセット記録
・自己ベスト（PR）の自動追跡
・月間レポート・ストリーク表示
・RM計算機
・テンプレートでのクイックスタート
・25種類以上のテーマカスタマイズ

■ 特徴
・完全オフライン対応 — データはすべて端末内に保存
・広告なし、無料
・シンプルで直感的なUI
```

### 4.5 Review情報

```python
review_info = {
    "contactFirstName": "Yuta",
    "contactLastName": "Tata",
    "contactPhone": "+81-XXX-XXXX-XXXX",  # 要設定
    "contactEmail": "y.tata02020202@icloud.com",
    "demoAccountRequired": False,
    "notes": "This app works fully offline. No login required. All data is stored locally on the device."
}
```

---

## 5. スクリーンショット生成・アップロード

### 5.1 必要なサイズ

| デバイス | 解像度 | 必須 |
|----------|--------|------|
| iPhone 6.7" (15 Pro Max) | 1290 x 2796 | ✅ |
| iPhone 6.5" (11 Pro Max) | 1242 x 2688 | ✅ |
| iPhone 5.5" (8 Plus) | 1242 x 2208 | ✅ |

### 5.2 スクリーンショット対象画面

1. **ホーム画面** — 週間統計・クイックスタート
2. **ワークアウト画面** — セット記録中のヒーローナンバー
3. **プログレス画面** — PR・ボリュームチャート・ストリーク
4. **履歴画面** — 過去のワークアウト一覧

### 5.3 自動化スクリプト

push-notifyの `create_55inch_screenshots.py` をベースに、Playwright/HTML テンプレートで生成。

---

## 6. ビルド・提出フロー

### 6.1 Production ビルド

```bash
cd apps/fitness
eas build --platform ios --profile production
```

### 6.2 App Store提出

```bash
eas submit --platform ios --profile production
```

### 6.3 ASC APIでの審査提出（自動化）

```python
# 1. Create review submission
POST /reviewSubmissions
{
    "data": {
        "type": "reviewSubmissions",
        "relationships": {
            "app": { "data": { "type": "apps", "id": APP_ID } }
        }
    }
}

# 2. Add version item
POST /reviewSubmissionItems
{
    "data": {
        "type": "reviewSubmissionItems",
        "relationships": {
            "appStoreVersion": { "data": { "type": "appStoreVersions", "id": VERSION_ID } }
        }
    }
}

# 3. Confirm submission
PATCH /reviewSubmissions/{submission_id}
{
    "data": {
        "type": "reviewSubmissions",
        "id": submission_id,
        "attributes": { "submitted": true }
    }
}
```

---

## 7. 実施チェックリスト

### Phase 1: インフラ整備
- [ ] EASプロジェクト登録 (`eas init`)
- [ ] fitness-api (Cloudflare Workers) 作成
- [ ] プライバシーポリシーページ作成
- [ ] サポートページ作成
- [ ] fitness-api デプロイ

### Phase 2: アプリ設定更新
- [ ] app.json に projectId・expo-updates 設定追加
- [ ] eas.json に submit設定・channel・image 追加
- [ ] expo-updates パッケージインストール確認

### Phase 3: App Store Connect
- [ ] ASCでアプリ作成（Bundle ID登録）
- [ ] setup_asc.py (fitness版) 作成・実行
  - [ ] カテゴリ設定
  - [ ] ローカライズ（日本語）
  - [ ] 説明文・キーワード・プロモーショナルテキスト
  - [ ] レビュー情報
  - [ ] 年齢レーティング
- [ ] スクリーンショット生成
- [ ] スクリーンショットアップロード

### Phase 4: ビルド・提出
- [ ] Production ビルド
- [ ] App Store 提出
- [ ] 審査サブミッション

---

## 8. ASC API 認証パターン（共通）

```python
import jwt, time, requests

def get_token():
    with open(P8_PATH, "r") as f:
        private_key = f.read()
    payload = {
        "iss": ISSUER_ID,
        "iat": int(time.time()),
        "exp": int(time.time()) + 1200,
        "aud": "appstoreconnect-v1"
    }
    token = jwt.encode(payload, private_key, algorithm="ES256", headers={"kid": KEY_ID})
    return token

headers = {
    "Authorization": f"Bearer {get_token()}",
    "Content-Type": "application/json"
}
```

---

## 9. 参考ファイル (push-notify)

| ファイル | 用途 |
|----------|------|
| `apps/push-notify/setup_asc.py` | ASCメタデータ初期設定 |
| `apps/push-notify/setup_asc_v2.py` | マーケティング最適化 |
| `apps/push-notify/create_55inch_screenshots.py` | SS生成+アップロード+審査提出 |
| `apps/push-notify/upload_55_screenshots.py` | SS リサイズ+アップロード |
| `server/push-api/src/index.ts` | Workers API 実装参照 |
