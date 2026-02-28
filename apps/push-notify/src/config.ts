// ── API設定 ──────────────────────────────────────
// 開発時: wrangler dev で起動したローカルサーバー
// 本番時: Cloudflare Workers のデプロイ先URLに変更
//
// デプロイ手順:
//   cd server/push-api
//   pnpm install
//   wrangler kv namespace create PUSH_KV
//   → wrangler.toml の id を更新
//   wrangler deploy
//   → 出力されたURLを API_BASE に設定

export const API_BASE = 'https://push-api.selectinfo-yaowao.workers.dev';

// 開発時はこちらを使用:
// export const API_BASE = 'http://localhost:8787';
