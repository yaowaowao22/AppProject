# 記事2 技術調査素材: かんたんプッシュ — プッシュ通知API・技術実装

## 1. 全体アーキテクチャ

```
┌─────────────────────┐     POST /api/send     ┌──────────────────────┐
│  外部サービス        │ ──────────────────────▶ │  Cloudflare Workers  │
│  (cURL/Python/Node)  │                        │  push-api            │
└─────────────────────┘                        │                      │
                                                │  ┌────────────────┐ │
                                                │  │ Cloudflare KV  │ │
                                                │  │ (PUSH_KV)      │ │
                                                │  └────────────────┘ │
                                                └──────────┬───────────┘
                                                           │
                                                           ▼
                                               ┌──────────────────────┐
                                               │ Expo Push Service    │
                                               │ exp.host/--/api/v2/  │
                                               │ push/send            │
                                               └──────────┬───────────┘
                                                           │
                                                   APNs / FCM
                                                           │
                                                           ▼
                                               ┌──────────────────────┐
                                               │ かんたんプッシュ      │
                                               │ (iOS / Android)      │
                                               └──────────────────────┘
```

**技術スタック:**
- フロントエンド: React Native (Expo SDK) + TypeScript
- バックエンド: Cloudflare Workers (TypeScript)
- データストア: Cloudflare KV
- プッシュ配信: Expo Push Notification Service → APNs / FCM
- 課金: RevenueCat
- 広告: Google AdMob

---

## 2. pushService.ts — プッシュ通知の登録と受信

### 2-1. registerForPushNotifications() — 通知許可とトークン取得

```typescript
// src/utils/pushService.ts

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
    projectId: '6bb9b696-be28-40e8-a06b-dda93652e07c',
  });

  return tokenResponse.data;
}
```

**設計判断メモ（記事で解説するポイント）:**
- `expo-notifications` と `expo-device` は Web 非対応のため、動的 `require()` でロードし Web ビルドではスキップ
- `Device.isDevice` チェックでシミュレーター/エミュレーターを除外
- 権限は2段階: 既存の権限確認 → 未許可なら再リクエスト
- Android は明示的に通知チャンネルを作成（MAX importance）
- `projectId` を指定して Expo Push Token を取得（EAS プロジェクトに紐づく）

### 2-2. registerDevice() — サーバーへのデバイス登録

```typescript
export async function registerDevice(apiKey: string, pushToken: string): Promise<boolean> {
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

**設計判断メモ:**
- APIキーとExpo Push Tokenをペアでサーバーに登録
- サーバー側で `device:{apiKey}` としてKVに保存 → 送信時にトークンを逆引き

### 2-3. setupNotificationHandlers() — フォアグラウンド通知ハンドラ

```typescript
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
  // タップ処理はApp.tsxのuseLastNotificationResponseフックで行う
  const receivedSub = Notifications.addNotificationReceivedListener(onReceived);

  return {
    remove: () => {
      receivedSub.remove();
    },
  };
}
```

**設計判断メモ:**
- `shouldShowAlert: true` でフォアグラウンドでも通知バナーを表示
- **重要設計:** `addNotificationResponseReceivedListener`（タップリスナー）は意図的に未登録 → `getLastNotificationResponseAsync()` で取得するため
- この設計により、タップした通知を確実にキャッチできる（リスナー競合を回避）

---

## 3. 通知受信・同期（App.tsx 内の主要ロジック）

### 3-1. extractNotification() — 通知データの正規化

```typescript
function extractNotification(notification: any): PushNotification | null {
  const content = notification.request?.content ?? notification?.notification?.request?.content;
  if (!content) return null;
  const data = content.data;
  return {
    id: data?.id ?? Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
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

**設計判断メモ:**
- Expo通知は2種類の構造を持つ（直接受信 vs レスポンス経由）→ 両方に対応
- `data` フィールドにサーバーから送信したメタデータ（priority, url, category, sentAt）を格納
- `sentAt` を使うことで「受信箱に追加した時刻」ではなく「実際に送信された時刻」を記録（v1.2.1の修正ポイント）
- IDはサーバー側で `Date.now().toString(36) + ランダム文字列` で生成（衝突回避 + ソート可能）

### 3-2. syncPendingNotifications() — 通知同期の全体フロー

```typescript
const syncPendingNotifications = useCallback(async () => {
  const newNotifs: PushNotification[] = [];

  // 1. タップで起動した通知を取得（リスナー未登録なので確実に取れる）
  try {
    const lastResponse = await getLastNotificationResponse();
    if (lastResponse) {
      const responseId = lastResponse.notification?.request?.identifier;
      if (responseId && responseId !== processedResponseIdRef.current) {
        processedResponseIdRef.current = responseId;
        const notif = extractNotification(lastResponse);
        if (notif) {
          newNotifs.push({ ...notif, read: true });
          // URLがあれば開く
          const url = lastResponse.notification?.request?.content?.data?.url;
          if (url) Linking.openURL(url).catch(() => {});
        }
      }
    }
  } catch {}

  // 2. 通知センターに残っている通知を取得
  const pending = await getPendingNotifications();
  for (const notification of pending) {
    const notif = extractNotification(notification);
    if (notif && !newNotifs.some((n) => n.id === notif.id)) {
      newNotifs.push(notif);
    }
  }

  // 3. 受信箱に追加（重複除外）
  if (newNotifs.length > 0) {
    setNotifications((prev) => {
      const existingIds = new Set(prev.map((n) => n.id));
      const filtered = newNotifs.filter((n) => !existingIds.has(n.id));
      return filtered.length > 0 ? [...filtered, ...prev] : prev;
    });
  }

  // 4. 通知センターをクリア（次回起動時の重複防止）
  dismissAllNotifications();
}, [setNotifications]);
```

**実行タイミング（App.tsx内）:**
```typescript
useEffect(() => {
  if (apiKeyLoading || notificationsLoading) return;
  syncPendingNotifications();
  const sub = AppState.addEventListener('change', (state) => {
    if (state === 'active') syncPendingNotifications();
  });
  return () => sub.remove();
}, [apiKeyLoading, notificationsLoading, syncPendingNotifications]);
```

**設計判断メモ（記事の核心部分）:**
- **3つのソースから通知を集約:** (1) タップで起動した通知、(2) 通知センターの未読通知、(3) フォアグラウンド受信
- `getLastNotificationResponseAsync()` はリスナー未登録時のみ値を返す仕様 → タップリスナーを意図的に登録しないことで確実に取得
- `processedResponseIdRef` で同じレスポンスの二重処理を防止
- タップした通知は `read: true` で追加（ユーザーが見ているので既読扱い）
- `AppState.addEventListener('change', ...)` でバックグラウンド→フォアグラウンド復帰時にも同期
- 最後に `dismissAllNotifications()` で通知センターをクリア → 次回の重複防止

### 3-3. フォアグラウンド受信ハンドラ

```typescript
const handleNotificationReceived = useCallback(
  (notification: any) => {
    const notif = extractNotification(notification);
    if (notif) {
      setNotifications((prev) => {
        if (prev.some((n) => n.id === notif.id)) return prev;
        return [notif, ...prev];
      });
    }
  },
  [setNotifications]
);
```

**設計判断メモ:**
- ID重複チェックで同一通知の二重登録を防止
- 新着通知は配列の先頭に追加（`[notif, ...prev]`）

---

## 4. APIキー生成・セキュアストレージ

### 4-1. generateApiKey() — キー生成ロジック

```typescript
// src/utils/apiKey.ts

export function generateApiKey(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const segments = [8, 4, 4, 12];
  return segments
    .map((len) =>
      Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    )
    .join('-');
}
```

**出力例:** `r0701yhs-3ugh-85oh-9iexfyf2gd1t`

**設計判断メモ:**
- UUID風の `8-4-4-12` セグメント形式（合計28文字 + ハイフン3つ = 31文字）
- 小文字英字 + 数字のみ（36文字種）→ URLセーフ、コピペしやすい
- Math.random() 使用（暗号学的に安全ではないが、APIキー用途では十分）

### 4-2. expo-secure-store — セキュアストレージ

```typescript
// src/utils/secureStore.ts

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

### 4-3. APIキー初期化フロー（App.tsx）

```typescript
// APIキー初期化（App.tsx内 AppInner コンポーネント）
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

**設計判断メモ（記事で解説するポイント）:**
- **二重保存戦略:** AsyncStorage（通常利用）+ expo-secure-store（iOS Keychain / Android Keystore）
- アプリ再インストール時に SecureStore からキーを復元可能（iOSではKeychainが保持される）
- Web環境では SecureStore が使えないため AsyncStorage のみにフォールバック
- キーは初回起動時に自動生成 → ユーザー操作不要

---

## 5. 通知の優先度設計 — PRIORITY_CONFIG

### 5-1. クライアント側の優先度定義

```typescript
// src/types.ts

export type Priority = 'low' | 'normal' | 'high' | 'urgent';

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; icon: string }> = {
  low:    { label: '低',   color: '#78909C', icon: 'remove-circle-outline' },
  normal: { label: '通常', color: '#42A5F5', icon: 'notifications-outline' },
  high:   { label: '高',   color: '#FFA726', icon: 'alert-circle-outline' },
  urgent: { label: '緊急', color: '#EF5350', icon: 'warning-outline' },
};
```

### 5-2. サーバー側の優先度マッピング

```typescript
// server/push-api/src/index.ts (handleSend関数内)

// アプリの4段階 → Expo Push APIの3段階にマッピング
const priorityMap: Record<string, 'default' | 'normal' | 'high'> = {
  low:    'normal',   // 低い優先度 → 通常配信
  normal: 'default',  // 通常 → デフォルト配信
  high:   'high',     // 高い → 優先配信（APNsのinterrupt-level相当）
  urgent: 'high',     // 緊急 → 優先配信 + サウンド
};

// low優先度の場合はサウンドを無効化
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
```

**設計判断メモ:**
- アプリ独自の4段階（low/normal/high/urgent）をExpo Push APIの3段階にマッピング
- `low` は `sound: null` でサイレント配信
- `urgent` と `high` はどちらも `'high'` にマッピングされるが、`urgent` はUI上で赤色表示 + 警告アイコン
- 通知の `data` フィールドに全メタデータを格納 → クライアント側で復元

---

## 6. Cloudflare Workers API — エンドポイント仕様

### 6-1. API一覧

| メソッド | パス | 説明 | 認証 |
|---------|------|------|------|
| `POST` | `/api/register` | デバイスのpush tokenをAPIキーに紐づけ登録 | APIキー |
| `POST` | `/api/send` | APIキー宛にプッシュ通知を送信 | APIキー |
| `GET` | `/api/status` | APIキーの使用状況を取得 | APIキー |
| `POST` | `/api/premium` | プレミアムステータスを有効化 | APIキー |
| `DELETE` | `/api/premium` | プレミアムステータスを解除 | APIキー |
| `GET` | `/api/admin/stats` | 管理者用統計情報 | Bearer token |
| `GET` | `/` or `/health` | ヘルスチェック | なし |
| `GET` | `/privacy` | プライバシーポリシー（HTML） | なし |
| `GET` | `/support` | サポートページ（HTML） | なし |

### 6-2. POST /api/send — 通知送信の完全なリクエスト/レスポンス

**リクエストBody:**
```json
{
  "token": "r0701yhs-3ugh-85oh-9iexfyf2gd1t",  // 必須: APIキー
  "title": "サーバーダウン",                       // 必須: 通知タイトル
  "message": "Web server is not responding",      // 必須: 通知本文
  "priority": "high",                              // 任意: low/normal/high/urgent
  "url": "https://example.com/dashboard",          // 任意: タップ時に開くURL
  "category": "Server"                             // 任意: カテゴリ（グループ分け用）
}
```

**成功レスポンス (200):**
```json
{
  "success": true,
  "message": "通知を送信しました",
  "usage": {
    "month": "2026-03",
    "count": 5,
    "limit": 10
  }
}
```

**エラーレスポンス例:**
```json
// 404 — デバイス未登録
{ "error": "このAPIキーに登録されたデバイスがありません。アプリでデバイス登録を行ってください。" }

// 429 — 送信上限到達（無料プラン）
{ "error": "今月の無料送信上限（10通）に達しました。アプリからプレミアムにアップグレードしてください。" }

// 429 — 送信上限到達（プレミアム・日次上限）
{ "error": "1日の送信上限（2000通）に達しました。明日以降に再度お試しください。" }

// 400 — 必須パラメータ不足
{ "error": "token, title, message は必須です" }

// 502 — Expo Push API送信失敗
{ "error": "通知の送信に失敗しました: Expo API error: 500 ..." }
```

### 6-3. POST /api/register — デバイス登録

```typescript
// サーバー側の処理
async function handleRegister(request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as RegisterBody;

  if (!body.token || !body.pushToken) {
    return error('token と pushToken は必須です');
  }

  // Expo Push Tokenのバリデーション
  if (!body.pushToken.startsWith('ExponentPushToken[')) {
    return error('無効なpushTokenです。ExponentPushToken[...] 形式が必要です');
  }

  const record: DeviceRecord = {
    pushToken: body.pushToken,
    registeredAt: new Date().toISOString(),
  };

  await env.PUSH_KV.put(`device:${body.token}`, JSON.stringify(record));
  return json({ success: true, message: 'デバイスが登録されました' });
}
```

### 6-4. Cloudflare KV データ構造

```
KVキー                              │ 値の構造
────────────────────────────────────┼──────────────────────────────
device:{apiKey}                     │ { pushToken, registeredAt }
usage:{apiKey}:{YYYY-MM}            │ { count }               ← TTL: 60日
daily:{apiKey}:{YYYY-MM-DD}         │ { count }               ← TTL: 2日
premium:{apiKey}                    │ { active: true }
```

**設計判断メモ:**
- KV はキーバリューストアとして最小限のデータ構造
- `usage` と `daily` には自動削除のTTLを設定 → 古いデータのクリーンアップ不要
- 1ユーザー = 1 APIキー = 1デバイスの1対1マッピング

### 6-5. 使用量制限の設計

```
無料プラン:   月10通まで（FREE_MONTHLY_LIMIT環境変数で設定）
プレミアム:   月間無制限、1日2,000通まで
```

```typescript
// 使用量チェックのロジック（handleSend内）
const freeLimit = parseInt(env.FREE_MONTHLY_LIMIT ?? '10', 10);
const isPremium = await env.PUSH_KV.get(premiumKey);

if (!isPremium) {
  // 無料プランの月次制限チェック
  if (usage.count >= freeLimit) {
    return error(`今月の無料送信上限（${freeLimit}通）に達しました...`, 429);
  }
} else {
  // プレミアムの日次制限チェック（2000通/日）
  if (dailyCount >= 2000) {
    return error('1日の送信上限（2000通）に達しました...', 429);
  }
}
```

### 6-6. Expo Push API 送信部分

```typescript
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

async function sendExpoPush(message: ExpoPushMessage): Promise<{ success: boolean; error?: string }> {
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

    const result = (await res.json()) as { data: { status: string; message?: string } };
    if (result.data?.status === 'error') {
      return { success: false, error: result.data.message ?? 'Unknown Expo error' };
    }

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message ?? 'Network error' };
  }
}
```

### 6-7. wrangler.toml 設定

```toml
name = "push-api"
main = "src/index.ts"
compatibility_date = "2025-01-01"

[[kv_namespaces]]
binding = "PUSH_KV"
id = "113de8f8e23d449196058adff27d56cb"

[vars]
FREE_MONTHLY_LIMIT = "10"

# 毎日 JST 9:00 (UTC 0:00) に日次レポートを送信
[triggers]
crons = ["0 0 * * *"]
```

### 6-8. 日次レポート（Cron Trigger）

```typescript
async function handleScheduled(env: Env): Promise<void> {
  // オーナーのデバイスを取得
  const ownerDeviceRaw = await env.PUSH_KV.get(`device:${env.OWNER_API_KEY}`);
  if (!ownerDeviceRaw) return;
  const ownerDevice: DeviceRecord = JSON.parse(ownerDeviceRaw);

  // プレミアムユーザーの統計を集計（オーナー自身は除外）
  const premiumKeys = await env.PUSH_KV.list({ prefix: 'premium:' });
  // ... 集計処理 ...

  const body = `有料${premiumSet.size}人 / 今月合計${premiumTotalSent}通`;

  // オーナーにプッシュ通知で日次レポートを送信
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

**設計判断メモ:**
- Cloudflare Workers の Cron Trigger で毎日 UTC 0:00 (JST 9:00) に自動実行
- オーナーのAPIキーとExcludeリストは環境変数で設定
- 「自分のアプリで自分に通知を送る」パターン → ダッシュボード不要の運用監視

---

## 7. Setup画面のコードサンプル（そのまま記事に掲載可能）

### 7-1. cURL

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

### 7-2. Python

```python
import requests

requests.post("https://push-api.selectinfo-yaowao.workers.dev/api/send", json={
    "token": "YOUR_API_KEY",
    "title": "サーバーダウン",
    "message": "Web server is not responding",
    "priority": "high",
    "category": "Server",
})
```

### 7-3. Node.js (fetch)

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

---

## 8. CORS設定

```typescript
function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
```

- すべてのオリジンからのリクエストを許可（`*`）
- OPTIONSプリフライトに対応
- Web版アプリやブラウザからの直接呼び出しが可能

---

## 9. 課金連携（RevenueCat）

```typescript
// src/utils/purchases.ts
const ENTITLEMENT_ID = 'premium';

export async function checkPremium(): Promise<boolean> {
  if (!initialized) return false;
  try {
    const info: CustomerInfo = await Purchases.getCustomerInfo();
    return info.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch {
    return false;
  }
}
```

**課金→サーバー同期フロー（App.tsx）:**
```typescript
useEffect(() => {
  if (apiKeyLoading || !apiKey) return;
  (async () => {
    await initPurchases();
    const hasPremium = await checkPremium();
    setIsPremium(hasPremium);
    if (hasPremium) {
      // サーバーにプレミアムステータスを同期
      fetch(`${API_BASE}/api/premium`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: apiKey }),
      }).catch(() => {});
    }
  })();
}, [apiKey, apiKeyLoading]);
```

**サーバー側: 新規プレミアム登録時にオーナーに通知**
```typescript
if (!alreadyPremium && env.OWNER_API_KEY && body.token !== env.OWNER_API_KEY) {
  // オーナーのデバイスに通知を送信
  const premiumKeys = await env.PUSH_KV.list({ prefix: 'premium:' });
  const totalPremium = premiumKeys.keys.length;
  await sendExpoPush({
    to: ownerDevice.pushToken,
    title: 'プレミアム新規登録',
    body: `新しい有料ユーザーが登録されました！(合計: ${totalPremium}人)`,
    sound: 'default',
    priority: 'high',
    data: { category: 'kantan-push', sentAt: new Date().toISOString() },
  });
}
```

---

## 10. 記事で使える設計パターンまとめ

### パターン1: 通知の3ソース統合
- フォアグラウンド受信（リスナー）
- バックグラウンド受信（通知センターから取得）
- タップ起動（getLastNotificationResponseAsync）
- → 3つを1つの受信箱に統合、ID重複チェックで一貫性を保証

### パターン2: APIキーの二重保存
- AsyncStorage（高速アクセス）+ SecureStore（永続性、セキュリティ）
- Web/ネイティブの環境差異を吸収するフォールバック設計

### パターン3: サーバーレス + KVの最小構成
- Cloudflare Workers: コールドスタートなし、グローバルエッジ配信
- KV: シンプルなキーバリュー、TTLで自動クリーンアップ
- 月額費用: 無料枠で運用可能（Workers 100,000リクエスト/日、KV 100,000読み取り/日）

### パターン4: 4段階優先度 → 3段階マッピング
- アプリ独自の直感的な4段階（低/通常/高/緊急）
- Expo Push API の3段階にマッピング + UIでの色分け/アイコンで差別化

### パターン5: Cron Trigger による自動レポート
- Cloudflare Workers の Cron で毎日9時に実行
- KV集計 → 自分のアプリにプッシュ通知 → 外部ダッシュボード不要

### パターン6: フリーミアムの使用量管理
- 無料: 月10通（KVで月ごとにカウント、60日TTLで自動削除）
- プレミアム: 無制限（日次2000通の上限あり、2日TTL）
- サーバーとクライアントの両方で制限チェック

---

## 11. プロジェクト基本情報

- アプリ名: かんたんプッシュ
- バンドルID: `com.massapp.pushnotify`
- Expo Project ID: `6bb9b696-be28-40e8-a06b-dda93652e07c`
- API Base URL: `https://push-api.selectinfo-yaowao.workers.dev`
- 現在バージョン: v1.1.0 (app.json) / v1.2.1 (WhatsNew表示)
- EASオーナー: `yaowao`
