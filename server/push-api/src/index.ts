/**
 * かんたんプッシュ — Cloudflare Workers API
 *
 * Endpoints:
 *   POST /api/register  — デバイスのpush tokenをAPIキーに紐づけ登録
 *   POST /api/send      — APIキー宛にプッシュ通知を送信
 *   GET  /api/status     — APIキーの使用状況を取得
 *   POST /api/premium    — プレミアムステータスを有効化
 *   GET  /api/admin/stats — 管理者用統計情報（Bearer token必須）
 *
 * KV keys:
 *   device:{apiKey}          → { pushToken, registeredAt }
 *   usage:{apiKey}:{YYYY-MM} → { count }
 *   premium:{apiKey}         → { active: true }
 */

export interface Env {
  PUSH_KV: KVNamespace;
  FREE_MONTHLY_LIMIT: string;
  ADMIN_SECRET: string;
  OWNER_API_KEY: string;
  OWNER_EXCLUDE_KEYS: string;
}

interface DeviceRecord {
  pushToken: string;
  registeredAt: string;
}

interface UsageRecord {
  count: number;
}

interface RegisterBody {
  token: string; // API key
  pushToken: string; // Expo Push Token
}

interface SendBody {
  token: string; // API key
  title: string;
  message: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  url?: string;
  category?: string;
}

// ── Helpers ──────────────────────────────────────────────

function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

function error(message: string, status = 400): Response {
  return json({ error: message }, status);
}

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getCurrentDateKey(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

// ── Expo Push API ────────────────────────────────────────

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  priority?: 'default' | 'normal' | 'high';
  sound?: 'default' | null;
  channelId?: string;
}

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

// ── Route Handlers ───────────────────────────────────────

async function handleRegister(request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as RegisterBody;

  if (!body.token || !body.pushToken) {
    return error('token と pushToken は必須です');
  }

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

async function handleSend(request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as SendBody;

  if (!body.token || !body.title || !body.message) {
    return error('token, title, message は必須です');
  }

  // Look up device
  const deviceRaw = await env.PUSH_KV.get(`device:${body.token}`);
  if (!deviceRaw) {
    return error('このAPIキーに登録されたデバイスがありません。アプリでデバイス登録を行ってください。', 404);
  }

  const device: DeviceRecord = JSON.parse(deviceRaw);

  // Check usage limit
  const freeLimit = parseInt(env.FREE_MONTHLY_LIMIT ?? '10', 10);
  const monthKey = getCurrentMonthKey();
  const usageKey = `usage:${body.token}:${monthKey}`;
  const premiumKey = `premium:${body.token}`;

  const isPremium = await env.PUSH_KV.get(premiumKey);
  if (!isPremium) {
    const usageRaw = await env.PUSH_KV.get(usageKey);
    const usage: UsageRecord = usageRaw ? JSON.parse(usageRaw) : { count: 0 };

    if (usage.count >= freeLimit) {
      return error(
        `今月の無料送信上限（${freeLimit}通）に達しました。アプリからプレミアムにアップグレードしてください。`,
        429
      );
    }
  } else {
    // プレミアムでも1日2000通の上限
    const dailyKey = `daily:${body.token}:${getCurrentDateKey()}`;
    const dailyRaw = await env.PUSH_KV.get(dailyKey);
    const dailyCount = dailyRaw ? (JSON.parse(dailyRaw) as UsageRecord).count : 0;

    if (dailyCount >= 2000) {
      return error('1日の送信上限（2000通）に達しました。明日以降に再度お試しください。', 429);
    }
  }

  // Map priority
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

  const result = await sendExpoPush(pushMessage);

  if (!result.success) {
    return error(`通知の送信に失敗しました: ${result.error}`, 502);
  }

  // Increment usage (monthly)
  const usageKey2 = `usage:${body.token}:${monthKey}`;
  const usageRaw = await env.PUSH_KV.get(usageKey2);
  const usage: UsageRecord = usageRaw ? JSON.parse(usageRaw) : { count: 0 };
  usage.count += 1;
  // KV TTL: auto-expire after 60 days (cleanup old months)
  await env.PUSH_KV.put(usageKey2, JSON.stringify(usage), { expirationTtl: 60 * 86400 });

  // Increment daily usage
  const dailyKey = `daily:${body.token}:${getCurrentDateKey()}`;
  const dailyRaw = await env.PUSH_KV.get(dailyKey);
  const daily: UsageRecord = dailyRaw ? JSON.parse(dailyRaw) : { count: 0 };
  daily.count += 1;
  // 2日後に自動削除
  await env.PUSH_KV.put(dailyKey, JSON.stringify(daily), { expirationTtl: 2 * 86400 });

  return json({
    success: true,
    message: '通知を送信しました',
    usage: {
      month: monthKey,
      count: usage.count,
      limit: isPremium ? null : freeLimit,
    },
  });
}

async function handleStatus(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return error('token パラメータは必須です');
  }

  const deviceRaw = await env.PUSH_KV.get(`device:${token}`);
  const isPremium = await env.PUSH_KV.get(`premium:${token}`);
  const monthKey = getCurrentMonthKey();
  const usageRaw = await env.PUSH_KV.get(`usage:${token}:${monthKey}`);
  const usage: UsageRecord = usageRaw ? JSON.parse(usageRaw) : { count: 0 };
  const freeLimit = parseInt(env.FREE_MONTHLY_LIMIT ?? '10', 10);

  return json({
    registered: deviceRaw !== null,
    premium: isPremium !== null,
    usage: {
      month: monthKey,
      count: usage.count,
      limit: isPremium ? null : freeLimit,
    },
  });
}

async function handlePremium(request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as { token?: string };

  if (!body.token) {
    return error('token は必須です');
  }

  // デバイスが登録されているか確認
  const deviceRaw = await env.PUSH_KV.get(`device:${body.token}`);
  if (!deviceRaw) {
    return error('このAPIキーに登録されたデバイスがありません', 404);
  }

  // 新規プレミアムかチェック
  const alreadyPremium = await env.PUSH_KV.get(`premium:${body.token}`);

  await env.PUSH_KV.put(`premium:${body.token}`, JSON.stringify({ active: true }));

  // 新規プレミアムの場合、オーナーに通知
  if (!alreadyPremium && env.OWNER_API_KEY && body.token !== env.OWNER_API_KEY) {
    const ownerDeviceRaw = await env.PUSH_KV.get(`device:${env.OWNER_API_KEY}`);
    if (ownerDeviceRaw) {
      const ownerDevice: DeviceRecord = JSON.parse(ownerDeviceRaw);
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
  }

  return json({ success: true, message: 'プレミアムが有効になりました' });
}

async function handleDeletePremium(request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as { token?: string };

  if (!body.token) {
    return error('token は必須です');
  }

  await env.PUSH_KV.delete(`premium:${body.token}`);

  return json({ success: true, message: 'プレミアムを解除しました' });
}

// ── Admin ────────────────────────────────────────────────

async function handleAdminStats(request: Request, env: Env): Promise<Response> {
  // Bearer token 認証
  const auth = request.headers.get('Authorization');
  if (!env.ADMIN_SECRET || auth !== `Bearer ${env.ADMIN_SECRET}`) {
    return error('Unauthorized', 401);
  }

  const monthKey = getCurrentMonthKey();

  // KV からキーを収集
  const deviceKeys = await env.PUSH_KV.list({ prefix: 'device:' });
  const premiumKeys = await env.PUSH_KV.list({ prefix: 'premium:' });
  const usageKeys = await env.PUSH_KV.list({ prefix: 'usage:' });

  const premiumSet = new Set(premiumKeys.keys.map((k) => k.name.replace('premium:', '')));

  // ユーザーごとの利用状況を収集
  const users = await Promise.all(
    deviceKeys.keys.map(async (k) => {
      const apiKey = k.name.replace('device:', '');
      const deviceRaw = await env.PUSH_KV.get(k.name);
      const device: DeviceRecord | null = deviceRaw ? JSON.parse(deviceRaw) : null;

      // 今月の利用回数
      const usageRaw = await env.PUSH_KV.get(`usage:${apiKey}:${monthKey}`);
      const currentUsage: UsageRecord = usageRaw ? JSON.parse(usageRaw) : { count: 0 };

      // 全月の利用回数を集計
      const userUsageKeys = usageKeys.keys.filter((u) => u.name.startsWith(`usage:${apiKey}:`));
      let totalCount = 0;
      const monthlyBreakdown: Record<string, number> = {};
      await Promise.all(
        userUsageKeys.map(async (u) => {
          const raw = await env.PUSH_KV.get(u.name);
          if (raw) {
            const rec: UsageRecord = JSON.parse(raw);
            const month = u.name.split(':').pop()!;
            monthlyBreakdown[month] = rec.count;
            totalCount += rec.count;
          }
        })
      );

      return {
        apiKey: apiKey.slice(0, 8) + '...',
        apiKeyFull: apiKey,
        registeredAt: device?.registeredAt ?? null,
        isPremium: premiumSet.has(apiKey),
        currentMonth: { month: monthKey, count: currentUsage.count },
        totalSent: totalCount,
        monthlyBreakdown,
      };
    })
  );

  return json({
    summary: {
      totalDevices: deviceKeys.keys.length,
      totalPremium: premiumKeys.keys.length,
      totalNotificationsSent: users.reduce((sum, u) => sum + u.totalSent, 0),
    },
    currentMonth: monthKey,
    users,
  });
}

// ── Privacy Policy ───────────────────────────────────────

function supportPageHtml(): Response {
  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>サポート — かんたんプッシュ</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 720px; margin: 0 auto; padding: 24px 16px; line-height: 1.8; color: #333; }
  h1 { font-size: 1.5rem; border-bottom: 2px solid #0066cc; padding-bottom: 8px; }
  h2 { font-size: 1.2rem; margin-top: 2rem; }
  a { color: #0066cc; }
  .faq { background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 12px 0; }
  .faq h3 { margin: 0 0 8px; font-size: 1rem; }
  .faq p { margin: 0; font-size: 0.95rem; }
</style>
</head>
<body>
<h1>かんたんプッシュ サポート</h1>
<p>かんたんプッシュに関するお問い合わせやサポート情報をご案内します。</p>

<h2>よくある質問</h2>

<div class="faq">
  <h3>Q. APIキーはどこで確認できますか？</h3>
  <p>アプリを起動し「API設定」タブを開くと、自動発行されたAPIキーが表示されます。</p>
</div>

<div class="faq">
  <h3>Q. 通知が届きません</h3>
  <p>1. iOSの「設定」→「通知」→「かんたんプッシュ」で通知が許可されているか確認してください。<br>2. 「API設定」タブの「テスト通知を送信」ボタンで動作を確認できます。</p>
</div>

<div class="faq">
  <h3>Q. プレミアムを購入したのに反映されません</h3>
  <p>「設定」タブの「購入を復元」をタップしてください。購入情報が復元されます。</p>
</div>

<div class="faq">
  <h3>Q. 別の端末でも使えますか？</h3>
  <p>プレミアムの購入は同じApple IDであれば「購入を復元」で別端末でも利用可能です。APIキーは端末ごとに発行されます。</p>
</div>

<h2>お問い合わせ</h2>
<p>上記で解決しない場合は、以下のメールアドレスまでお問い合わせください。</p>
<p>Email: <a href="mailto:y.tata02020202@icloud.com">y.tata02020202@icloud.com</a></p>

<h2>関連リンク</h2>
<ul>
  <li><a href="/privacy">プライバシーポリシー</a></li>
  <li><a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/">利用規約（Apple標準EULA）</a></li>
</ul>

<p style="margin-top: 2rem; font-size: 0.85rem; color: #999;">massapp</p>
</body>
</html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

function privacyPolicyHtml(): Response {
  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>プライバシーポリシー — かんたんプッシュ</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 720px; margin: 0 auto; padding: 24px 16px; line-height: 1.8; color: #333; }
  h1 { font-size: 1.5rem; border-bottom: 2px solid #0066cc; padding-bottom: 8px; }
  h2 { font-size: 1.15rem; margin-top: 2em; }
  p, li { font-size: 0.95rem; }
  .updated { color: #666; font-size: 0.85rem; }
</style>
</head>
<body>
<h1>プライバシーポリシー</h1>
<p class="updated">最終更新日: 2025年3月1日</p>
<p>「かんたんプッシュ」（以下「本アプリ」）は、ユーザーのプライバシーを尊重し、個人情報の保護に努めます。本ポリシーは、本アプリが収集・使用する情報について説明します。</p>

<h2>1. 収集する情報</h2>
<p>本アプリは以下の情報を収集します。</p>
<ul>
<li><strong>プッシュ通知トークン:</strong> プッシュ通知を送信するために、デバイスのExpo Push Tokenを収集します。</li>
<li><strong>APIキー:</strong> アプリ内で生成されるAPIキーを、デバイスの識別と通知の送信先管理に使用します。</li>
<li><strong>利用状況:</strong> 月ごとの通知送信回数を記録します。</li>
</ul>

<h2>2. 情報の利用目的</h2>
<ul>
<li>プッシュ通知の送信</li>
<li>無料プランの利用制限の管理</li>
<li>プレミアムプランの購入状態の管理</li>
</ul>

<h2>3. 情報の保存</h2>
<p>収集した情報はCloudflare Workers KVに保存されます。通知履歴はデバイス上のローカルストレージにのみ保存され、サーバーには送信されません。利用状況データは60日後に自動的に削除されます。</p>

<h2>4. 第三者への提供</h2>
<p>本アプリは、以下のサービスを利用しています。</p>
<ul>
<li><strong>Expo Push Notification Service:</strong> プッシュ通知の配信に使用します。</li>
<li><strong>RevenueCat:</strong> アプリ内課金の処理に使用します。</li>
</ul>
<p>上記以外の第三者に個人情報を提供することはありません。</p>

<h2>5. データの削除</h2>
<p>アプリ内の「設定」からAPIキーのリセットおよび通知履歴の削除が可能です。アプリをアンインストールすると、デバイス上のすべてのデータが削除されます。</p>

<h2>6. お子様のプライバシー</h2>
<p>本アプリは13歳未満のお子様を対象としていません。13歳未満のお子様から意図的に個人情報を収集することはありません。</p>

<h2>7. ポリシーの変更</h2>
<p>本ポリシーは予告なく変更されることがあります。変更後の内容は本ページに掲載します。</p>

<h2>8. お問い合わせ</h2>
<p>プライバシーに関するご質問は、App Store内のアプリサポートページよりお問い合わせください。</p>
</body>
</html>`;
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

// ── Scheduled (Cron) ─────────────────────────────────────

async function handleScheduled(env: Env): Promise<void> {
  if (!env.OWNER_API_KEY) return;

  const ownerDeviceRaw = await env.PUSH_KV.get(`device:${env.OWNER_API_KEY}`);
  if (!ownerDeviceRaw) return;
  const ownerDevice: DeviceRecord = JSON.parse(ownerDeviceRaw);

  const monthKey = getCurrentMonthKey();
  const deviceKeys = await env.PUSH_KV.list({ prefix: 'device:' });
  const premiumKeys = await env.PUSH_KV.list({ prefix: 'premium:' });
  const premiumSet = new Set(premiumKeys.keys.map((k) => k.name.replace('premium:', '')));

  // オーナーの全キーを除外
  const excludeKeys = env.OWNER_EXCLUDE_KEYS ? env.OWNER_EXCLUDE_KEYS.split(',') : [];
  excludeKeys.push(env.OWNER_API_KEY);
  for (const key of excludeKeys) {
    premiumSet.delete(key.trim());
  }
  let premiumTotalSent = 0;
  for (const apiKey of premiumSet) {
    const usageRaw = await env.PUSH_KV.get(`usage:${apiKey}:${monthKey}`);
    const count = usageRaw ? (JSON.parse(usageRaw) as UsageRecord).count : 0;
    premiumTotalSent += count;
  }

  const body = `有料${premiumSet.size}人 / 今月合計${premiumTotalSent}通`;

  await sendExpoPush({
    to: ownerDevice.pushToken,
    title: `日次レポート (${monthKey})`,
    body,
    sound: 'default',
    priority: 'default',
    data: { category: 'kantan-push', sentAt: new Date().toISOString() },
  });
}

// ── Main Router ──────────────────────────────────────────

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(handleScheduled(env));
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (request.method === 'POST' && path === '/api/register') {
        return handleRegister(request, env);
      }
      if (request.method === 'POST' && path === '/api/send') {
        return handleSend(request, env);
      }
      if (request.method === 'GET' && path === '/api/status') {
        return handleStatus(request, env);
      }
      if (request.method === 'POST' && path === '/api/premium') {
        return handlePremium(request, env);
      }
      if (request.method === 'DELETE' && path === '/api/premium') {
        return handleDeletePremium(request, env);
      }
      if (request.method === 'GET' && path === '/api/admin/stats') {
        return handleAdminStats(request, env);
      }
      if (request.method === 'POST' && path === '/api/admin/daily-report') {
        const auth = request.headers.get('Authorization');
        if (!env.ADMIN_SECRET || auth !== `Bearer ${env.ADMIN_SECRET}`) {
          return error('Unauthorized', 401);
        }
        await handleScheduled(env);
        return json({ success: true, message: '日次レポートを送信しました' });
      }

      // Privacy Policy
      if (path === '/privacy') {
        return privacyPolicyHtml();
      }

      // Support Page
      if (path === '/support') {
        return supportPageHtml();
      }

      // Health check
      if (path === '/' || path === '/health') {
        return json({
          service: 'かんたんプッシュ API',
          version: '1.0.0',
          endpoints: ['POST /api/register', 'POST /api/send', 'GET /api/status', 'POST /api/premium', 'GET /api/admin/stats'],
        });
      }

      return error('Not Found', 404);
    } catch (e: any) {
      return error(`Internal Server Error: ${e.message}`, 500);
    }
  },
} satisfies ExportedHandler<Env>;
