/**
 * かんたんプッシュ — Cloudflare Workers API
 *
 * Endpoints:
 *   POST /api/register  — デバイスのpush tokenをAPIキーに紐づけ登録
 *   POST /api/send      — APIキー宛にプッシュ通知を送信
 *   GET  /api/status     — APIキーの使用状況を取得
 *
 * KV keys:
 *   device:{apiKey}          → { pushToken, registeredAt }
 *   usage:{apiKey}:{YYYY-MM} → { count }
 *   premium:{apiKey}         → { active: true }
 */

export interface Env {
  PUSH_KV: KVNamespace;
  FREE_MONTHLY_LIMIT: string;
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
    },
  };

  const result = await sendExpoPush(pushMessage);

  if (!result.success) {
    return error(`通知の送信に失敗しました: ${result.error}`, 502);
  }

  // Increment usage
  const usageKey2 = `usage:${body.token}:${monthKey}`;
  const usageRaw = await env.PUSH_KV.get(usageKey2);
  const usage: UsageRecord = usageRaw ? JSON.parse(usageRaw) : { count: 0 };
  usage.count += 1;
  // KV TTL: auto-expire after 60 days (cleanup old months)
  await env.PUSH_KV.put(usageKey2, JSON.stringify(usage), { expirationTtl: 60 * 86400 });

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

// ── Main Router ──────────────────────────────────────────

export default {
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

      // Health check
      if (path === '/' || path === '/health') {
        return json({
          service: 'かんたんプッシュ API',
          version: '1.0.0',
          endpoints: ['POST /api/register', 'POST /api/send', 'GET /api/status'],
        });
      }

      return error('Not Found', 404);
    } catch (e: any) {
      return error(`Internal Server Error: ${e.message}`, 500);
    }
  },
} satisfies ExportedHandler<Env>;
