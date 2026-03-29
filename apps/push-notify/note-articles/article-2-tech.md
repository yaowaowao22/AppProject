# 月額0円でプッシュ通知API自作——Cloudflare Workers全コード公開

**サーバー監視、CI/CD、IoTデバイス——「何かあったらスマホに通知を飛ばしたい」。**

エンジニアなら一度はそう思ったことがあるはずだ。

Slack通知？　チャンネルが埋もれて見逃す。メール通知？　迷惑メールフォルダに消える。本当に大事なアラートは、ポケットの中のスマホを直接震わせてほしい。

しかし、Firebase Cloud Messaging（FCM）のセットアップは煩雑だし、Pushover等の既存サービスは月額課金がかかる。「自分専用の通知API」が欲しいだけなのに、なぜこんなに面倒なのか。

**だから、自分で作った。**

この記事では、私が個人開発アプリ「かんたんプッシュ」で実装したプッシュ通知APIの全設計・全コードを公開する。Cloudflare Workersの無料枠だけで動くので、**月額サーバー代は完全に0円**だ。

この記事を読み終える頃には、あなたも自分だけのプッシュ通知APIを持てる。

---

## この記事で得られるもの

- Cloudflare Workers + KVで構築するREST APIの**完全なTypeScriptソースコード**
- Expo Push Notification Serviceを使ったiOS/Android両対応の通知送信
- `getLastNotificationResponseAsync()`による**タップリスナー二重登録問題の根本解決**パターン
- cURL / Python / Node.jsですぐに使える3言語のサンプルコード
- フリーミアム課金モデルのサーバーサイド実装パターン
- 本番運用で使えるCron Triggerによる自動日次レポート

**想定読者:** サーバー監視やCI/CDの通知を自前で構築したいエンジニア、FCMのセットアップに辟易している開発者、Cloudflare Workersの実践事例を探している方。

---

## 全体の流れ

この記事は4つのStepで構成されている。

> **Step 1:** Cloudflare Workers + KVでREST APIを構築する
> **Step 2:** Expo Push Tokenの取得とデバイス登録（モバイルアプリ側）
> **Step 3:** 通知受信ハンドラの設計パターン（3ソース統合 + 重複排除）
> **Step 4:** APIキー認証とSecureStoreによる安全な保管
> **+ 本番運用Tips:** Cron日次レポート、GitHub Actions連携、OTA更新

---

## 完成形のデモ——ターミナルからスマホに通知を飛ばす

まずは完成形を見てほしい。APIキーさえあれば、ターミナルから1コマンドでスマホに通知が届く。

### cURL

```bash
curl -X POST https://push-api.selectinfo-yaowao.workers.dev/api/send \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_API_KEY",
    "title": "サーバーダウン",
    "message": "Web server is not responding",
    "priority": "high",
    "category": "Server"
  }'
```

### Python

```python
import requests

requests.post(
    "https://push-api.selectinfo-yaowao.workers.dev/api/send",
    json={
        "token": "YOUR_API_KEY",
        "title": "サーバーダウン",
        "message": "Web server is not responding",
        "priority": "high",
        "category": "Server",
    },
)
```

### Node.js

```javascript
fetch("https://push-api.selectinfo-yaowao.workers.dev/api/send", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    token: "YOUR_API_KEY",
    title: "サーバーダウン",
    message: "Web server is not responding",
    priority: "high",
    category: "Server",
  }),
});
```

**レスポンス：**

```json
{
  "success": true,
  "message": "通知を送信しました",
  "usage": { "month": "2026-03", "count": 5, "limit": 10 }
}
```

たったこれだけだ。`token`（APIキー）、`title`、`message`の3つを送れば、スマホが震える。`priority`で4段階の緊急度、`category`でグループ分け、`url`でタップ時の遷移先も指定できる。

GitHub Actions、Pythonスクリプト、Raspberry Pi——HTTPリクエストを送れる環境ならどこからでも使える。

---

## アーキテクチャ全体図

```
┌───────────────────────┐
│  あなたのスクリプト     │  POST /api/send
│  (cURL/Python/Node.js) │──────────────────┐
└───────────────────────┘                  │
                                            ▼
                              ┌──────────────────────────┐
                              │   Cloudflare Workers      │
                              │   (TypeScript)            │
                              │                           │
                              │  ┌──────────────────────┐│
                              │  │  Cloudflare KV        ││
                              │  │  ・デバイス情報        ││
                              │  │  ・使用量カウント      ││
                              │  │  ・課金ステータス      ││
                              │  └──────────────────────┘│
                              └────────────┬─────────────┘
                                           │
                                           ▼
                              ┌──────────────────────────┐
                              │  Expo Push Service        │
                              │  exp.host/--/api/v2/      │
                              │  push/send                │
                              └────────────┬─────────────┘
                                           │
                                     APNs / FCM
                                           │
                                           ▼
                              ┌──────────────────────────┐
                              │  スマホアプリ              │
                              │  (iOS / Android)          │
                              └──────────────────────────┘
```

**技術スタック：**

| レイヤー | 技術 | コスト |
|---------|------|--------|
| バックエンドAPI | Cloudflare Workers (TypeScript) | 無料 |
| データストア | Cloudflare KV | 無料 |
| プッシュ配信 | Expo Push Notification Service | 無料 |
| iOS配信 | Apple Push Notification service (APNs) | 無料 |
| Android配信 | Firebase Cloud Messaging (FCM) | 無料 |
| モバイルアプリ | React Native (Expo SDK) + TypeScript | 無料 |

**全レイヤーが無料枠内で運用可能。** 月額費用は文字通り0円だ。

---

## なぜFirebaseではなくCloudflare Workersなのか

「プッシュ通知ならFirebase Cloud Messaging（FCM）を直接使えばいいのでは？」

もちろん選択肢としてはある。だが、私は以下の理由でCloudflare Workersを選んだ。

### 1. セットアップの複雑さ

FCMを直接使う場合、`google-services.json`（Android）と APNs証明書（iOS）の設定が必要になる。サービスアカウントキーの管理、Firebase Admin SDKの初期化、証明書の更新作業——「APIキー1つで通知を送りたいだけ」の用途には明らかにオーバースペックだ。

一方、**Expo Push Notification Serviceは、ExponentPushTokenさえあればAPNs/FCMへの配信を全自動でやってくれる。** 証明書管理はExpo側で完結する。私たちはHTTP POSTを1回送るだけでいい。

### 2. Cloudflare Workersの圧倒的な無料枠

| リソース | 無料枠 |
|---------|--------|
| リクエスト数 | **10万リクエスト/日** |
| KV読み取り | 10万回/日 |
| KV書き込み | 1,000回/日 |
| KVストレージ | 1 GB |
| コールドスタート | **なし（V8 Isolate）** |

10万リクエスト/日。個人利用はもちろん、小規模チームでも余裕で収まる数字だ。そしてCloudflare Workersには**コールドスタートがない**。AWS Lambdaのように数秒待たされることなく、世界中のエッジロケーションから即座にレスポンスが返る。

### 3. KVのシンプルさ

通知APIに必要なデータは「APIキー → デバイストークン」のマッピングと、月間使用量のカウントだけだ。RDBは不要。Cloudflare KVのキーバリューストアで十分すぎるほど足りる。しかもTTL（有効期限）を設定すれば、古いデータは自動削除される。クリーンアップのバッチ処理も要らない。

---

**ここからは、この通知APIの実装をステップバイステップで解説する。**

有料パートでは以下のすべてを、型定義・import文込みの「コピペで動く」完全なコードで公開する。

- **Step 1:** サーバーAPI全体（ルーティング・バリデーション・KVデータ設計・デプロイ手順）
- **Step 2:** モバイルアプリのトークン取得と登録フロー
- **Step 3:** 通知受信ハンドラの設計パターン——`getLastNotificationResponseAsync()`でタップリスナーの二重登録問題を根本解決した実装の全貌
- **Step 4:** SecureStoreによるAPIキーの二重保存戦略
- **本番Tips:** Cron Trigger日次レポート、GitHub Actions / Raspberry Pi連携、OTA更新

「自分専用の通知APIが欲しい」——そう思ったことがあるなら、この先のコードをそのまま使ってほしい。Cloudflare Workersにデプロイすれば、あなただけのプッシュ通知基盤が今日手に入る。

<!-- ===ここから有料=== -->

---

## Step 1: Cloudflare Workers + KVでREST APIを構築する

### 1-1. プロジェクトのセットアップ

まずCloudflare Workersのプロジェクトを作成する。

```bash
# Wrangler CLI のインストール（未インストールの場合）
npm install -g wrangler

# プロジェクト作成
mkdir push-api && cd push-api
npm init -y
npm install -D wrangler typescript @types/node

# KV Namespace の作成
wrangler kv:namespace create "PUSH_KV"
```

`wrangler kv:namespace create` を実行すると、KV Namespace IDが出力される。これを `wrangler.toml` に記入する。

### 1-2. wrangler.toml

```toml
name = "push-api"
main = "src/index.ts"
compatibility_date = "2025-01-01"

[[kv_namespaces]]
binding = "PUSH_KV"
id = "ここに出力されたKV Namespace IDを貼る"

[vars]
FREE_MONTHLY_LIMIT = "10"

# 毎日 JST 9:00 (UTC 0:00) に日次レポートを送信
[triggers]
crons = ["0 0 * * *"]
```

`FREE_MONTHLY_LIMIT` は環境変数として設定する。無料プランのユーザーが1ヶ月に送信できる通知数だ。この値を変えるだけで制限を調整できる。

`OWNER_API_KEY`（開発者自身のAPIキー）と `ADMIN_SECRET`（管理画面用の認証トークン）はCloudflareのダッシュボードからシークレット環境変数として設定する。`wrangler.toml` には書かない。

```bash
wrangler secret put OWNER_API_KEY
wrangler secret put ADMIN_SECRET
```

### 1-3. 型定義とヘルパー関数

`src/index.ts` の冒頭に、API全体で使う型とヘルパーを定義する。

```typescript
// src/index.ts

interface Env {
  PUSH_KV: KVNamespace;
  FREE_MONTHLY_LIMIT: string;
  OWNER_API_KEY: string;
  ADMIN_SECRET: string;
}

interface DeviceRecord {
  pushToken: string;
  registeredAt: string;
}

interface UsageRecord {
  count: number;
}

interface SendBody {
  token: string;
  title: string;
  message: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  url?: string;
  category?: string;
}

interface RegisterBody {
  token: string;
  pushToken: string;
}

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  sound: string | null;
  priority: 'default' | 'normal' | 'high';
  data: Record<string, any>;
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

// --- ヘルパー関数 ---

function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
    },
  });
}

function error(message: string, status = 400): Response {
  return json({ error: message }, status);
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}
```

CORS設定は `'*'`（全オリジン許可）にしている。APIキー認証でアクセス制御しているので、オリジン制限の必要はない。Webブラウザからの直接呼び出しにも対応できる。

### 1-4. POST /api/register——デバイス登録

アプリが起動すると、Expo Push Tokenとユーザー固有のAPIキーをサーバーに登録する。

```typescript
async function handleRegister(request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as RegisterBody;

  if (!body.token || !body.pushToken) {
    return error('token と pushToken は必須です');
  }

  // Expo Push Token のフォーマットバリデーション
  if (!body.pushToken.startsWith('ExponentPushToken[')) {
    return error('無効なpushTokenです。ExponentPushToken[...] 形式が必要です');
  }

  const record: DeviceRecord = {
    pushToken: body.pushToken,
    registeredAt: new Date().toISOString(),
  };

  // KV に保存: device:{apiKey} → { pushToken, registeredAt }
  await env.PUSH_KV.put(`device:${body.token}`, JSON.stringify(record));

  return json({ success: true, message: 'デバイスが登録されました' });
}
```

KVのキー設計は `device:{apiKey}` というシンプルな構造だ。1ユーザー = 1 APIキー = 1デバイスの1対1マッピングで、複雑なリレーションは必要ない。

### 1-5. POST /api/send——通知送信（APIの中核）

ここがこのAPIの心臓部だ。使用量チェック、優先度マッピング、Expo Push APIへの送信を一気通貫で行う。

```typescript
async function handleSend(request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as SendBody;

  // バリデーション
  if (!body.token || !body.title || !body.message) {
    return error('token, title, message は必須です');
  }

  // デバイス情報の取得
  const deviceRaw = await env.PUSH_KV.get(`device:${body.token}`);
  if (!deviceRaw) {
    return error(
      'このAPIキーに登録されたデバイスがありません。アプリでデバイス登録を行ってください。',
      404
    );
  }
  const device: DeviceRecord = JSON.parse(deviceRaw);

  // --- 使用量チェック ---
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const dayKey = now.toISOString().slice(0, 10);
  const usageKey = `usage:${body.token}:${monthKey}`;
  const dailyKey = `daily:${body.token}:${dayKey}`;
  const premiumKey = `premium:${body.token}`;

  // 現在の使用量を取得
  const usageRaw = await env.PUSH_KV.get(usageKey);
  const usage: UsageRecord = usageRaw ? JSON.parse(usageRaw) : { count: 0 };

  const freeLimit = parseInt(env.FREE_MONTHLY_LIMIT ?? '10', 10);
  const isPremium = await env.PUSH_KV.get(premiumKey);

  if (!isPremium) {
    // 無料プラン: 月次制限
    if (usage.count >= freeLimit) {
      return error(
        `今月の無料送信上限（${freeLimit}通）に達しました。アプリからプレミアムにアップグレードしてください。`,
        429
      );
    }
  } else {
    // プレミアム: 日次制限（安全装置）
    const dailyRaw = await env.PUSH_KV.get(dailyKey);
    const dailyCount = dailyRaw ? JSON.parse(dailyRaw).count : 0;
    if (dailyCount >= 2000) {
      return error('1日の送信上限（2000通）に達しました。明日以降に再度お試しください。', 429);
    }
    // 日次カウント更新（TTL: 2日で自動削除）
    await env.PUSH_KV.put(dailyKey, JSON.stringify({ count: dailyCount + 1 }), {
      expirationTtl: 172800,
    });
  }

  // --- 優先度マッピング ---
  // アプリの4段階 → Expo Push APIの3段階
  const priorityMap: Record<string, 'default' | 'normal' | 'high'> = {
    low: 'normal',
    normal: 'default',
    high: 'high',
    urgent: 'high',
  };

  const pushMessage: ExpoPushMessage = {
    to: device.pushToken,
    title: body.title,
    body: body.message,
    sound: body.priority === 'low' ? null : 'default',
    priority: priorityMap[body.priority ?? 'normal'] ?? 'default',
    data: {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title: body.title,
      message: body.message,
      priority: body.priority ?? 'normal',
      url: body.url,
      category: body.category,
      sentAt: new Date().toISOString(),
    },
  };

  // --- Expo Push API に送信 ---
  const result = await sendExpoPush(pushMessage);
  if (!result.success) {
    return error(`通知の送信に失敗しました: ${result.error}`, 502);
  }

  // 月次使用量を更新（TTL: 60日で自動削除）
  await env.PUSH_KV.put(usageKey, JSON.stringify({ count: usage.count + 1 }), {
    expirationTtl: 5184000,
  });

  return json({
    success: true,
    message: '通知を送信しました',
    usage: {
      month: monthKey,
      count: usage.count + 1,
      limit: isPremium ? null : freeLimit,
    },
  });
}
```

いくつかのポイントを解説する。

**優先度の4段階→3段階マッピング：** アプリのUIでは `low`/`normal`/`high`/`urgent` の4段階を提供しているが、Expo Push APIは `normal`/`default`/`high` の3段階しかサポートしない。そこで `low` → `normal`、`urgent` → `high` にマッピングし、`low` のときはサウンドを無効化（`sound: null`）することで実質的な4段階の挙動を実現している。`urgent` と `high` はExpo側では同じ `'high'` だが、アプリのUI上では赤い警告アイコンで視覚的に差別化している。

**通知IDの生成：** `Date.now().toString(36) + Math.random().toString(36).slice(2, 6)` で、タイムスタンプベースの一意IDを生成する。base36エンコードにより短い文字列になり、タイムスタンプ順でソート可能、かつランダム部分で衝突を回避できる。

**使用量データのTTL：** 月次データは60日（`expirationTtl: 5184000`）、日次データは2日（`expirationTtl: 172800`）で自動削除される。バッチによるクリーンアップ処理は不要だ。

**プレミアムでも日次2,000通の上限：** プレミアムユーザーは月間無制限だが、暴走スクリプト等によるExpo Push APIへの過負荷を防ぐため、日次の安全上限を設けている。

### 1-6. Expo Push APIへの送信関数

```typescript
async function sendExpoPush(
  message: ExpoPushMessage
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: `Expo API error: ${res.status} ${text}` };
    }

    const result = (await res.json()) as {
      data: { status: string; message?: string };
    };

    if (result.data?.status === 'error') {
      return { success: false, error: result.data.message ?? 'Unknown Expo error' };
    }

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message ?? 'Network error' };
  }
}
```

Expo Push APIへのHTTP POSTは驚くほどシンプルだ。`to` にExponentPushTokenを指定し、`title`/`body`/`sound`/`priority`/`data` を送るだけ。APNsやFCMへの振り分けはExpo側が自動的に行う。

レスポンスの `data.status` が `'error'` の場合は、トークンが無効（アプリがアンインストールされた等）の可能性がある。本番では `DeviceNotRegistered` エラーを検知してKVからデバイス情報を削除するロジックを追加するとよい。

### 1-7. GET /api/status——使用量の確認

```typescript
async function handleStatus(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return error('token パラメータは必須です');
  }

  const deviceRaw = await env.PUSH_KV.get(`device:${token}`);
  if (!deviceRaw) {
    return json({ registered: false });
  }

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const usageRaw = await env.PUSH_KV.get(`usage:${token}:${monthKey}`);
  const usage: UsageRecord = usageRaw ? JSON.parse(usageRaw) : { count: 0 };
  const isPremium = await env.PUSH_KV.get(`premium:${token}`);
  const freeLimit = parseInt(env.FREE_MONTHLY_LIMIT ?? '10', 10);

  return json({
    registered: true,
    premium: !!isPremium,
    usage: {
      month: monthKey,
      count: usage.count,
      limit: isPremium ? null : freeLimit,
    },
  });
}
```

### 1-8. POST /api/premium——課金ステータスの同期

モバイルアプリ側でRevenueCat経由の課金が完了すると、サーバーにプレミアムステータスを同期する。

```typescript
async function handlePremium(request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as { token: string };

  if (!body.token) {
    return error('token は必須です');
  }

  const premiumKey = `premium:${body.token}`;
  const alreadyPremium = await env.PUSH_KV.get(premiumKey);

  await env.PUSH_KV.put(premiumKey, JSON.stringify({ active: true }));

  // 新規プレミアム登録時にオーナーに通知
  if (!alreadyPremium && env.OWNER_API_KEY && body.token !== env.OWNER_API_KEY) {
    const ownerDeviceRaw = await env.PUSH_KV.get(`device:${env.OWNER_API_KEY}`);
    if (ownerDeviceRaw) {
      const ownerDevice: DeviceRecord = JSON.parse(ownerDeviceRaw);
      const premiumKeys = await env.PUSH_KV.list({ prefix: 'premium:' });
      await sendExpoPush({
        to: ownerDevice.pushToken,
        title: 'プレミアム新規登録',
        body: `新しい有料ユーザーが登録されました！(合計: ${premiumKeys.keys.length}人)`,
        sound: 'default',
        priority: 'high',
        data: { category: 'kantan-push', sentAt: new Date().toISOString() },
      });
    }
  }

  return json({ success: true, message: 'プレミアムが有効化されました' });
}
```

「**自分のアプリで自分に通知を送る**」パターンに注目してほしい。新しい有料ユーザーが登録されると、開発者自身のスマホにプッシュ通知が届く。Stripeのダッシュボードを開かなくても、ポケットの中で課金イベントをリアルタイムに把握できる。

### 1-9. メインルーター

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS プリフライト
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    // ルーティング
    if (url.pathname === '/api/register' && request.method === 'POST') {
      return handleRegister(request, env);
    }
    if (url.pathname === '/api/send' && request.method === 'POST') {
      return handleSend(request, env);
    }
    if (url.pathname === '/api/status' && request.method === 'GET') {
      return handleStatus(request, env);
    }
    if (url.pathname === '/api/premium' && request.method === 'POST') {
      return handlePremium(request, env);
    }
    if (url.pathname === '/api/premium' && request.method === 'DELETE') {
      return handleDeletePremium(request, env);
    }
    if (url.pathname === '/' || url.pathname === '/health') {
      return json({ status: 'ok', version: '1.0.0' });
    }

    return error('Not Found', 404);
  },

  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    await handleScheduled(env);
  },
};
```

Cloudflare Workersのルーティングは `fetch` ハンドラ内で `URL.pathname` をマッチングするだけ。Expressのようなルーティングライブラリは不要だ。`scheduled` ハンドラはCron Triggerで呼ばれる（後述の日次レポートで使う）。

### 1-10. KVデータ構造のまとめ

```
KVキー                              値                           TTL
──────────────────────────────────────────────────────────────────────
device:{apiKey}                    { pushToken, registeredAt }   なし
usage:{apiKey}:{YYYY-MM}           { count }                     60日
daily:{apiKey}:{YYYY-MM-DD}        { count }                     2日
premium:{apiKey}                   { active: true }              なし
```

4種類のキーパターンで全機能をカバーしている。RDBのテーブル設計と比べると、拍子抜けするほどシンプルだ。

### デプロイ

```bash
wrangler deploy
```

これで `https://push-api.{あなたのサブドメイン}.workers.dev` にAPIが公開される。

---

## Step 2: Expo Push Tokenの取得とデバイス登録

サーバー側のAPIが出来上がったので、次はモバイルアプリ側だ。React Native（Expo SDK）でExpo Push Tokenを取得し、Step 1で構築したAPIにデバイスを登録する。

### 2-1. 必要なパッケージのインストール

```bash
npx expo install expo-notifications expo-device expo-constants
```

### 2-2. registerForPushNotifications()——通知許可とトークン取得

```typescript
// src/utils/pushService.ts

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

const API_BASE = 'https://push-api.your-subdomain.workers.dev';

export async function registerForPushNotifications(): Promise<string | null> {
  // Web環境やネイティブモジュール未対応の場合はスキップ
  if (Platform.OS === 'web' || !Notifications || !Device) {
    console.log('[Push] Web環境またはネイティブモジュール未対応 — スキップ');
    return null;
  }

  // エミュレータではプッシュ通知不可（実機のみ）
  if (!Device.isDevice) {
    console.log('[Push] 実機以外ではプッシュ通知は利用できません');
    return null;
  }

  // 権限確認・リクエスト
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Push] 通知権限が拒否されました');
    return null;
  }

  // Android通知チャンネル設定
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1A237E',
    });
  }

  // Expo Push Token 取得
  const tokenResponse = await Notifications.getExpoPushTokenAsync({
    projectId: 'あなたのEASプロジェクトID',
  });

  return tokenResponse.data;
}
```

**ポイント解説：**

1. **`Device.isDevice` チェック：** Expo GoやiOSシミュレーターではプッシュ通知が動作しない。実機以外では早期リターンしてクラッシュを防ぐ。

2. **権限の2段階チェック：** まず `getPermissionsAsync()` で現在の権限状態を確認し、未許可の場合のみ `requestPermissionsAsync()` でユーザーに許可ダイアログを表示する。これにより、一度拒否したユーザーに何度もダイアログを表示する事態を避けられる。

3. **Android通知チャンネル：** Android 8.0（API 26）以降は通知チャンネルの作成が必須だ。`importance: MAX` に設定することで、ヘッドアップ通知（画面上部にポップアップ）として表示される。

4. **`projectId` の指定：** `getExpoPushTokenAsync` にはEASプロジェクトのIDを指定する。`app.json` の `extra.eas.projectId` に設定済みならConstants経由でも取得できるが、明示的に指定した方が確実だ。

### 2-3. registerDevice()——サーバーへの登録

```typescript
export async function registerDevice(
  apiKey: string,
  pushToken: string
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: apiKey, pushToken }),
    });
    const data = await res.json();
    return data.success === true;
  } catch (e) {
    console.log('[Push] サーバー登録失敗:', e);
    return false;
  }
}
```

APIキーとExpo Push Tokenのペアをサーバーに送信するだけのシンプルな関数だ。サーバー側では `device:{apiKey}` というKVキーにトークンを保存し、送信時に逆引きする。

### 2-4. アプリ起動時の登録フロー

```typescript
// App.tsx 内のコンポーネント

useEffect(() => {
  (async () => {
    const pushToken = await registerForPushNotifications();
    if (pushToken && apiKey) {
      await registerDevice(apiKey, pushToken);
    }
  })();
}, [apiKey]);
```

アプリ起動時に自動で通知許可を取得し、サーバーに登録する。ユーザーの手動操作は一切不要だ。

---

## Step 3: 通知受信ハンドラの設計パターン

ここがこの記事の核心部分だ。プッシュ通知の「受信」は、見た目よりずっと複雑な問題を含んでいる。

### 通知を受信する3つのシナリオ

モバイルアプリが通知を受信するパターンは3つある。

| シナリオ | アプリの状態 | 対処方法 |
|---------|------------|---------|
| ① フォアグラウンド受信 | アプリを開いている | `addNotificationReceivedListener` |
| ② タップで起動 | バックグラウンドまたは終了状態 | `getLastNotificationResponseAsync()` |
| ③ 通知センターから取り込み | バックグラウンドで受信済み | `getPresentedNotificationsAsync()` |

これら3つのソースから漏れなく通知を集約し、重複なく1つの受信箱に統合する——これがStep 3のゴールだ。

### 3-1. setupNotificationHandlers()——フォアグラウンド受信

```typescript
// src/utils/pushService.ts

export function setupNotificationHandlers(
  onReceived: (notification: any) => void,
) {
  if (!Notifications) return { remove: () => {} };

  // フォアグラウンドで通知を表示する設定
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  // フォアグラウンド受信のみリスナー登録
  const receivedSub = Notifications.addNotificationReceivedListener(onReceived);

  return {
    remove: () => {
      receivedSub.remove();
    },
  };
}
```

注目すべきは、**`addNotificationResponseReceivedListener`（タップリスナー）を意図的に登録していない**点だ。ここに今回最も重要な設計判断がある。

### 3-2. なぜタップリスナーを登録しないのか——getLastNotificationResponseAsync()パターン

Expo Notificationsには、通知タップを検知する2つの方法がある。

**方法A: addNotificationResponseReceivedListener（リスナー方式）**

```typescript
// ❌ 今回は使わない方法
Notifications.addNotificationResponseReceivedListener((response) => {
  // ユーザーが通知をタップしたときの処理
  handleNotificationTap(response);
});
```

**方法B: getLastNotificationResponseAsync()（ポーリング方式）**

```typescript
// ✅ 今回採用した方法
const lastResponse = await Notifications.getLastNotificationResponseAsync();
if (lastResponse) {
  handleNotificationTap(lastResponse);
}
```

方法Aには重大な問題がある。**リスナーの登録タイミングとアプリの起動タイミングの競合**だ。

アプリが完全に終了した状態（コールドスタート）でユーザーが通知をタップすると、以下の順序で処理が走る。

```
1. ユーザーが通知をタップ
2. OSがアプリを起動
3. React NativeのJavaScriptバンドルがロード
4. useEffectでリスナーを登録  ← ここ
5. ...タップイベントはもう発火済み（取りこぼし）
```

つまり、**リスナーが登録される前にタップイベントが発火してしまう**。これが「タップリスナーの二重登録問題」の正体だ。対策として複数箇所でリスナーを登録すると、今度はイベントが二重にハンドリングされるという別の問題が起きる。

私自身、最初は方法A（`addNotificationResponseReceivedListener`）で実装した。開発中はHot Reloadのおかげでアプリが常にフォアグラウンドにいるので問題なく動く。ところが実機テストでアプリを完全に終了させてから通知をタップすると、何も起きない。ログを仕込んでも発火した形跡がない。原因がわかるまで3時間かかった。コールドスタートのタイミング競合だと気づいた瞬間、方法Bに全面書き換えした。

`getLastNotificationResponseAsync()` はこの問題を根本的に解決する。

```
1. ユーザーが通知をタップ
2. OSがアプリを起動
3. React NativeのJavaScriptバンドルがロード
4. getLastNotificationResponseAsync() を呼ぶ
5. → OSが保持していた最後のタップレスポンスを取得できる ✅
```

この関数は「OSが保持している最後のタップ応答」を返す。リスナーのタイミングに依存しないので、コールドスタートでも確実にタップ通知をキャッチできる。

**ただし重要な注意点がある。** `getLastNotificationResponseAsync()` は、`addNotificationResponseReceivedListener` が**登録されていない場合にのみ**値を返す。両方を併用すると正しく動作しない。だからこそ、`setupNotificationHandlers` でタップリスナーを意図的に登録しないのだ。

### 3-3. extractNotification()——通知データの正規化

3つのソースから取得した通知データの構造はそれぞれ微妙に異なる。これを1つの統一された型に変換する関数が必要だ。

```typescript
// App.tsx

interface PushNotification {
  id: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  timestamp: string;
  read: boolean;
  url?: string;
  category?: string;
}

function extractNotification(notification: any): PushNotification | null {
  // フォアグラウンド受信とタップ応答で構造が異なるため、両方に対応
  const content =
    notification.request?.content ??
    notification?.notification?.request?.content;

  if (!content) return null;

  const data = content.data;

  return {
    id:
      data?.id ??
      Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    title: data?.title ?? content.title ?? '通知',
    message: data?.message ?? content.body ?? '',
    priority: data?.priority ?? 'normal',
    timestamp: data?.sentAt ?? new Date().toISOString(),
    read: false,
    url: data?.url,
    category: data?.category,
  };
}
```

**設計のポイント：**

- **2つの構造に対応：** フォアグラウンド受信の `notification.request.content` とタップ応答の `notification.notification.request.content` は構造が異なる。`??`（nullish coalescing）で両方にフォールバックする。
- **`data` フィールドを優先：** サーバーから `data` に格納したメタデータ（`title`、`message`、`priority`等）を最優先で使い、フォールバックとして `content.title` / `content.body` を使う。
- **`sentAt` でタイムスタンプを記録：** 「アプリがこの通知を受信した時刻」ではなく「サーバーが送信した時刻」を使う。こうすることで、バックグラウンドで受信して後から開いた場合でも正確な時系列を保てる。

### 3-4. syncPendingNotifications()——3ソース統合の全体フロー

```typescript
// App.tsx

const syncPendingNotifications = useCallback(async () => {
  const newNotifs: PushNotification[] = [];

  // ソース1: タップで起動した通知を取得
  try {
    const lastResponse = await Notifications.getLastNotificationResponseAsync();
    if (lastResponse) {
      const responseId = lastResponse.notification?.request?.identifier;
      if (responseId && responseId !== processedResponseIdRef.current) {
        processedResponseIdRef.current = responseId;
        const notif = extractNotification(lastResponse);
        if (notif) {
          newNotifs.push({ ...notif, read: true }); // タップした → 既読
          // URLがあれば開く
          const url =
            lastResponse.notification?.request?.content?.data?.url;
          if (url) Linking.openURL(url).catch(() => {});
        }
      }
    }
  } catch {}

  // ソース2: 通知センターに残っている通知を取得
  const pending = await Notifications.getPresentedNotificationsAsync();
  for (const notification of pending) {
    const notif = extractNotification(notification);
    if (notif && !newNotifs.some((n) => n.id === notif.id)) {
      newNotifs.push(notif);
    }
  }

  // ソース1,2 で取得した通知を受信箱に追加（重複除外）
  if (newNotifs.length > 0) {
    setNotifications((prev) => {
      const existingIds = new Set(prev.map((n) => n.id));
      const filtered = newNotifs.filter((n) => !existingIds.has(n.id));
      return filtered.length > 0 ? [...filtered, ...prev] : prev;
    });
  }

  // 通知センターをクリア（次回起動時の重複防止）
  await Notifications.dismissAllNotificationsAsync();
}, [setNotifications]);
```

**重複排除の3段階防御：**

1. `processedResponseIdRef` —— `getLastNotificationResponseAsync()` は同じレスポンスを何度も返す可能性がある。`identifier` を保存して同じレスポンスの二重処理を防ぐ。
2. `newNotifs.some((n) => n.id === notif.id)` —— ソース1とソース2で同じ通知を拾った場合の重複排除。
3. `existingIds.has(n.id)` —— 既に受信箱にある通知との重複排除。

**タップ通知のURL遷移：** タップした通知に `url` フィールドがあれば、`Linking.openURL()` でブラウザやアプリ内WebViewに遷移する。これにより「サーバーダウン → 通知タップ → ダッシュボードを開く」というワンタップ対応フローが実現できる。

**`dismissAllNotificationsAsync()` の重要性：** 同期完了後に通知センターをクリアする。これをしないと、次にアプリを起動したときにソース2が同じ通知を再び拾い、受信箱に重複が発生する。

### 3-5. AppStateリスナーで復帰時にも同期

```typescript
useEffect(() => {
  if (apiKeyLoading || notificationsLoading) return;

  // 初回起動時に同期
  syncPendingNotifications();

  // バックグラウンド → フォアグラウンド復帰時にも同期
  const sub = AppState.addEventListener('change', (state) => {
    if (state === 'active') syncPendingNotifications();
  });

  return () => sub.remove();
}, [apiKeyLoading, notificationsLoading, syncPendingNotifications]);
```

ユーザーがアプリをバックグラウンドに回してから戻ってきたとき、その間に届いた通知を自動的に受信箱に取り込む。`AppState` の `'active'` イベントを監視することで、ユーザーが意識することなくシームレスに通知が同期される。

### 3-6. フォアグラウンド受信ハンドラ（ソース3）

```typescript
const handleNotificationReceived = useCallback(
  (notification: any) => {
    const notif = extractNotification(notification);
    if (notif) {
      setNotifications((prev) => {
        if (prev.some((n) => n.id === notif.id)) return prev; // 重複防止
        return [notif, ...prev]; // 新着を先頭に追加
      });
    }
  },
  [setNotifications]
);

// setupNotificationHandlers に渡す
useEffect(() => {
  const handler = setupNotificationHandlers(handleNotificationReceived);
  return () => handler.remove();
}, [handleNotificationReceived]);
```

これがソース3（フォアグラウンド受信）の処理だ。アプリを開いている状態で通知が届くと、`addNotificationReceivedListener` が発火し、受信箱にリアルタイムで追加される。

---

## Step 4: APIキー認証とSecureStore

### 4-1. generateApiKey()——キー生成

```typescript
// src/utils/apiKey.ts

export function generateApiKey(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const segments = [8, 4, 4, 12];
  return segments
    .map((len) =>
      Array.from(
        { length: len },
        () => chars[Math.floor(Math.random() * chars.length)]
      ).join('')
    )
    .join('-');
}
```

**出力例：** `r0701yhs-3ugh-85oh-9iexfyf2gd1t`

UUID風の `8-4-4-12` セグメント形式（合計31文字）。小文字英数字のみでURLセーフ、コピー&ペーストしやすい。`Math.random()` は暗号学的に安全ではないが、APIキーの用途（「誰のデバイスに送るか」の識別子）においては十分だ。

### 4-2. SecureStoreによる安全な保管

```typescript
// src/utils/secureStore.ts

import { Platform } from 'react-native';

const SECURE_KEY = 'push_api_key_secure';

function getSecureStore(): typeof import('expo-secure-store') | null {
  if (Platform.OS === 'web') return null;
  try {
    const mod = require('expo-secure-store');
    if (!mod || typeof mod.getItemAsync !== 'function') return null;
    return mod;
  } catch {
    return null;
  }
}

export async function getSecureApiKey(): Promise<string | null> {
  const store = getSecureStore();
  if (!store) return null;
  try {
    return await store.getItemAsync(SECURE_KEY);
  } catch {
    return null;
  }
}

export async function setSecureApiKey(key: string): Promise<void> {
  const store = getSecureStore();
  if (!store) return;
  try {
    await store.setItemAsync(SECURE_KEY, key);
  } catch {}
}
```

**なぜ `require()` で動的ロードしているのか？** `expo-secure-store` はネイティブモジュールに依存しており、Webビルドではクラッシュする。`import` 文で静的にインポートすると、Webビルド時にエラーになる。`require()` + `try-catch` で動的にロードし、Web環境では `null` を返すことで安全にフォールバックできる。

### 4-3. 二重保存戦略——APIキー初期化フロー

```typescript
// App.tsx 内

useEffect(() => {
  if (apiKeyLoading) return;
  (async () => {
    // 1. AsyncStorageにキーがある → SecureStoreにも保存
    if (apiKey) {
      await setSecureApiKey(apiKey);
      return;
    }
    // 2. SecureStoreから復元を試みる
    const secureKey = await getSecureApiKey();
    if (secureKey) {
      setApiKey(secureKey);
      return;
    }
    // 3. どこにもない → 新規生成
    const newKey = generateApiKey();
    setApiKey(newKey);
    await setSecureApiKey(newKey);
  })();
}, [apiKey, apiKeyLoading, setApiKey]);
```

APIキーは**AsyncStorage**（通常のアクセス用）と**SecureStore**（iOS Keychain / Android Keystore）の2箇所に保存される。

なぜ二重保存するのか？　AsyncStorageはアプリのアンインストールで消失するが、iOSのKeychainはアプリを削除しても残る。再インストール時にSecureStoreからキーを復元できるので、ユーザーは同じAPIキーで引き続き通知を受け取れる。

---

## 本番運用Tips

### Tip 1: 使用量制限のクライアント+サーバー二重チェック

Step 1でサーバー側の使用量チェックを実装したが、クライアント側でも制限を表示する。

```typescript
// Setup画面で使用量を表示
const [usage, setUsage] = useState({ count: 0, limit: 10 });

useEffect(() => {
  fetch(`${API_BASE}/api/status?token=${apiKey}`)
    .then((res) => res.json())
    .then((data) => {
      if (data.usage) setUsage(data.usage);
    })
    .catch(() => {});
}, [apiKey]);

// UI: "今月の送信数: 5 / 10"
```

サーバー側で429エラーを返すだけでなく、クライアント側でも残り回数を表示することで、ユーザーの期待値を適切にコントロールする。

### Tip 2: Cron Triggerによる日次レポート

Cloudflare WorkersのCron Triggerを使えば、毎日定時に自動処理を実行できる。

```typescript
async function handleScheduled(env: Env): Promise<void> {
  // オーナーのデバイスを取得
  const ownerDeviceRaw = await env.PUSH_KV.get(
    `device:${env.OWNER_API_KEY}`
  );
  if (!ownerDeviceRaw) return;
  const ownerDevice: DeviceRecord = JSON.parse(ownerDeviceRaw);

  // プレミアムユーザーの統計を集計
  const premiumKeys = await env.PUSH_KV.list({ prefix: 'premium:' });
  let premiumTotalSent = 0;
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  for (const key of premiumKeys.keys) {
    const apiKey = key.name.replace('premium:', '');
    if (apiKey === env.OWNER_API_KEY) continue; // オーナー自身は除外
    const usageRaw = await env.PUSH_KV.get(`usage:${apiKey}:${monthKey}`);
    if (usageRaw) {
      premiumTotalSent += JSON.parse(usageRaw).count;
    }
  }

  const body = `有料${premiumKeys.keys.length}人 / 今月合計${premiumTotalSent}通`;

  // オーナーにプッシュ通知で日次レポート送信
  await sendExpoPush({
    to: ownerDevice.pushToken,
    title: `日次レポート (${monthKey})`,
    body,
    sound: 'default',
    priority: 'default',
    data: { category: 'kantan-push', sentAt: new Date().toISOString() },
  });
}
```

毎朝9時（JST）にスマホへ「有料5人 / 今月合計127通」のようなサマリーが届く。Google Analyticsや管理画面を開かなくても、アプリの利用状況をリアルタイムに把握できる。

### Tip 3: 応用例——GitHub ActionsやRaspberry Piからの連携

このAPIはHTTP POSTを送れる環境ならどこからでも使える。

**GitHub Actionsでデプロイ完了通知：**

```yaml
# .github/workflows/deploy.yml
- name: Send push notification
  run: |
    curl -X POST ${{ secrets.PUSH_API_URL }}/api/send \
      -H "Content-Type: application/json" \
      -d '{
        "token": "${{ secrets.PUSH_API_KEY }}",
        "title": "デプロイ完了",
        "message": "${{ github.repository }} が ${{ github.ref_name }} にデプロイされました",
        "priority": "normal",
        "category": "Deploy"
      }'
```

**Raspberry Piで温度監視：**

```python
import requests
import subprocess

temp = float(subprocess.getoutput("vcgencmd measure_temp").split("=")[1].replace("'C", ""))

if temp > 70:
    requests.post("https://your-worker.workers.dev/api/send", json={
        "token": "YOUR_API_KEY",
        "title": "🔥 温度警告",
        "message": f"Raspberry Piの温度が{temp}°Cに達しました",
        "priority": "urgent",
        "category": "IoT",
    })
```

### Tip 4: OTA更新でストア審査なしにバグ修正

Expoの `expo-updates` を使えば、JavaScriptバンドルの更新をApp Store/Google Play審査なしで配信できる。

```bash
# OTA更新の発行
eas update --branch production --message "Fix notification handler"
```

通知ハンドラのバグ修正や、UIの微調整はOTAで即座に反映できる。ネイティブコードの変更を伴わない修正であれば、ユーザーがアプリを開いた瞬間に最新版が適用される。

---

## まとめ——このアーキテクチャの月額コストは¥0

この記事で構築した通知APIの運用コストを整理しよう。

| サービス | 無料枠 | 実際の利用量 |
|---------|--------|------------|
| Cloudflare Workers | 10万リクエスト/日 | 数百リクエスト/日 |
| Cloudflare KV | 10万読み取り/日 | 数百回/日 |
| Expo Push Service | 無制限 | 数百通/日 |
| APNs / FCM | 無制限 | 数百通/日 |

**月額サーバー代：¥0。** 個人利用なら無料枠を使い切ることはまずない。

ここまで解説したコードのポイントをまとめると：

1. **Cloudflare Workers + KV** で、コールドスタートなし・グローバルエッジ配信のREST APIを構築した
2. **Expo Push Notification Service** で、APNs/FCMへの配信を抽象化し、証明書管理から解放された
3. **`getLastNotificationResponseAsync()`パターン** で、タップリスナーの二重登録問題を根本的に解決した
4. **3ソース統合 + 3段階重複排除** で、通知の取りこぼしと重複を完全に防止した
5. **TTL付きKVキー** で、使用量データの自動クリーンアップを実現した
6. **Cron Trigger** で、外部ダッシュボード不要の日次レポートを自動化した

コードの全量はTypeScriptで約200行（サーバー側）+ 約150行（クライアント側）。この規模感で、本番運用に耐えるプッシュ通知基盤が手に入る。

「何かあったらスマホに通知を飛ばしたい」——その願いを叶えるのに、月額課金もFirebaseの煩雑なセットアップも要らない。cURL一発で届く、自分だけの通知APIを作ろう。

### 今日できること

1. [Cloudflareアカウント作成](https://dash.cloudflare.com/sign-up)（無料、3分）
2. `wrangler kv:namespace create "PUSH_KV"` でKV Namespaceを作成
3. Step 1のコードを `src/index.ts` にコピペして `wrangler deploy`

ここまでで所要15分。デプロイが終わったら、cURLでAPIを叩いてみてほしい。レスポンスが返ってくる瞬間、「これ、自分のAPIだ」という感覚が得られるはずだ。

---

## この記事を読んだ方へ——関連記事のご案内

**技術だけでなく「収益化」にも興味がある方へ：**
→ 「個人開発アプリを¥300の買い切り課金で収益化するまでの全記録」では、この通知APIを搭載したアプリを実際にApp Storeに公開し、RevenueCat課金でマネタイズするまでの全工程を公開している。フリーミアム設計の思考プロセスと実際の収益数値が気になる方はぜひ。

**このコード、実はAIと一緒に書いた：**
→ 「Claude Codeと2人で1週間でアプリをApp Storeに公開した全工程」では、この記事で紹介したコードの約半分をAI（Claude Code）と共同で書いた開発プロセスを公開している。AIコーディングの実践例として、成功と失敗の両面を正直に記録した。
