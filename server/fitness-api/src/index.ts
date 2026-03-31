/**
 * FORGE — Cloudflare Workers API
 *
 * Endpoints:
 *   GET  /          — ヘルスチェック
 *   GET  /privacy   — プライバシーポリシー（HTML）
 *   GET  /support   — サポート/FAQ（HTML）
 *   GET  /health    — ステータスチェック
 */

// ── Helpers ──────────────────────────────────────────────

function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  });
}

function error(message: string, status = 400): Response {
  return json({ error: message }, status);
}

// ── Privacy Policy ───────────────────────────────────────

function privacyPolicyHtml(): Response {
  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>プライバシーポリシー — FORGE</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 720px; margin: 0 auto; padding: 24px 16px; line-height: 1.8; color: #333; }
  h1 { font-size: 1.5rem; border-bottom: 2px solid #FF6200; padding-bottom: 8px; }
  h2 { font-size: 1.15rem; margin-top: 2em; }
  p, li { font-size: 0.95rem; }
  .updated { color: #666; font-size: 0.85rem; }
</style>
</head>
<body>
<h1>プライバシーポリシー</h1>
<p class="updated">最終更新日: 2026年4月1日</p>
<p>「FORGE」（以下「本アプリ」）は、ユーザーのプライバシーを尊重し、個人情報の保護に努めます。本ポリシーは、本アプリが収集・使用する情報について説明します。</p>

<h2>1. 収集する情報</h2>
<p>本アプリは、<strong>個人情報を一切収集しません。</strong></p>
<ul>
<li>ユーザーアカウントの作成は不要です。</li>
<li>ワークアウトデータ（エクササイズ記録、自己ベスト、テンプレート等）はすべてデバイス内のローカルストレージに保存され、外部サーバーに送信されることはありません。</li>
<li>ネットワーク通信を利用する機能はありません。</li>
</ul>

<h2>2. Firebase Analytics</h2>
<p>本アプリは、アプリの利用傾向を匿名で把握するためにFirebase Analyticsを使用しています。収集される情報は以下のとおりです。</p>
<ul>
<li>画面遷移イベント</li>
<li>アプリの使用頻度・セッション情報</li>
<li>デバイスの種類・OSバージョン</li>
</ul>
<p>これらの情報は個人を特定するものではなく、アプリの改善のみに使用されます。</p>

<h2>3. 第三者への提供</h2>
<p>本アプリは、以下のサービスを利用しています。</p>
<ul>
<li><strong>Firebase Analytics (Google):</strong> 匿名の利用統計の収集に使用します。</li>
</ul>
<p>上記以外の第三者に情報を提供することはありません。</p>

<h2>4. データの削除</h2>
<p>アプリ内の「設定」画面から、すべてのワークアウトデータをリセット（削除）できます。アプリをアンインストールすると、デバイス上のすべてのデータが削除されます。</p>

<h2>5. お子様のプライバシー</h2>
<p>本アプリは13歳未満のお子様を対象としていません。13歳未満のお子様から意図的に個人情報を収集することはありません。</p>

<h2>6. ポリシーの変更</h2>
<p>本ポリシーは予告なく変更されることがあります。変更後の内容は本ページに掲載します。</p>

<h2>7. お問い合わせ</h2>
<p>プライバシーに関するご質問は、App Store内のアプリサポートページよりお問い合わせください。</p>
</body>
</html>`;
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

// ── Support Page ────────────────────────────────────────

function supportPageHtml(): Response {
  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>サポート — FORGE</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 720px; margin: 0 auto; padding: 24px 16px; line-height: 1.8; color: #333; }
  h1 { font-size: 1.5rem; border-bottom: 2px solid #FF6200; padding-bottom: 8px; }
  h2 { font-size: 1.2rem; margin-top: 2rem; }
  a { color: #FF6200; }
  .faq { background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 12px 0; }
  .faq h3 { margin: 0 0 8px; font-size: 1rem; }
  .faq p { margin: 0; font-size: 0.95rem; }
</style>
</head>
<body>
<h1>FORGE サポート</h1>
<p>FORGEに関するお問い合わせやサポート情報をご案内します。</p>

<h2>よくある質問</h2>

<div class="faq">
  <h3>Q. データはクラウドに保存されますか？</h3>
  <p>いいえ。すべてのワークアウトデータはお使いの端末内にのみ保存されます。サーバーへの送信は行いません。</p>
</div>

<div class="faq">
  <h3>Q. 機種変更時にデータを移行できますか？</h3>
  <p>現在、データのエクスポート・インポート機能は提供しておりません。今後のアップデートで対応予定です。</p>
</div>

<div class="faq">
  <h3>Q. ワークアウトデータを削除したいです</h3>
  <p>アプリ内の「設定」画面にある「データリセット」から、すべてのワークアウトデータを削除できます。この操作は取り消せませんのでご注意ください。</p>
</div>

<div class="faq">
  <h3>Q. エクササイズの種目を追加できますか？</h3>
  <p>現在は45種目のプリセットエクササイズを提供しています。カスタム種目の追加機能は今後のアップデートで検討中です。</p>
</div>

<div class="faq">
  <h3>Q. テーマを変更するにはどうすればいいですか？</h3>
  <p>「設定」画面の「テーマ」セクションから、25種類以上のテーマから選択できます。</p>
</div>

<h2>お問い合わせ</h2>
<p>上記で解決しない場合は、以下のメールアドレスまでお問い合わせください。</p>
<p><strong>y.tata02020202@icloud.com</strong></p>

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

// ── Main Router ──────────────────────────────────────────

export default {
  async fetch(request: Request): Promise<Response> {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
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
          service: 'FORGE API',
          version: '1.0.0',
          status: 'ok',
        });
      }

      return error('Not Found', 404);
    } catch (e: any) {
      return error(`Internal Server Error: ${e.message}`, 500);
    }
  },
} satisfies ExportedHandler;
