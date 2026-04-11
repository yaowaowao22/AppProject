// ============================================================
// Groq URL解析サービス
//
// 2つの呼び出し経路をサポート:
//
//   1. Lambda proxy (デフォルト) — groq_use_byok='false' の場合
//      App → Cognito IAM → Lambda (recall-kit-groq-proxy) → Groq API
//      Lambda がサーバー側で GROQ_API_KEY (env var) を保持。
//      アプリ配布物にキーが一切含まれない。
//
//   2. BYOK (上級者モード) — groq_use_byok='true' の場合
//      App → SecureStore (Keychain/Keystore) から gsk_... 読み込み → Groq API 直接
//      ユーザーが自前の Dev Tier キーを使いたいケース向け。
//
// どちらの経路でも:
//   - fetchAndExtractText で HTML 本文抽出
//   - splitTextIntoChunks (profile.chunkSize) でチャンク分割
//   - OpenAI互換 response_format: { type: 'json_object' } で JSON 強制
//   - parseAnalysisResult / parseChunkQaPairs / deduplicateQaPairs で local と品質揃え
//
// deep-dive (runLocalCompletion 経路) は独立。
// ============================================================

import {
  CognitoIdentityClient,
  GetIdCommand,
  GetCredentialsForIdentityCommand,
} from '@aws-sdk/client-cognito-identity';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

import { getDatabase } from '../db/connection';
import { getSetting } from '../db/settingsRepository';
import {
  AWS_REGION,
  COGNITO_IDENTITY_POOL_ID,
  GROQ_LAMBDA_FUNCTION_NAME,
} from '../config/aws';
import {
  GROQ_API_ENDPOINT,
  GROQ_DEFAULT_MODEL_ID,
  GROQ_TIMEOUT_MS,
  getGroqProfile,
} from '../config/groq';
import type { AnalysisProfile } from '../config/analysisProfile';
import { getSecureValue } from './secureStorage';
import { fetchAndExtractText } from './htmlExtractorService';
import {
  deduplicateQaPairs,
  parseAnalysisResult,
  parseChunkQaPairs,
  splitTextIntoChunks,
} from './localAnalysisService';
import type { AnalysisResult, QAPair } from '../types/analysis';

// ============================================================
// 実行時設定ロード
// ============================================================

type GroqMode = 'lambda' | 'byok';

interface GroqRuntimeConfig {
  mode: GroqMode;
  /** BYOK モード時のみ使用。Lambda モードでは空文字 */
  apiKey: string;
  model: string;
  profile: AnalysisProfile;
}

async function loadGroqConfig(): Promise<GroqRuntimeConfig> {
  const db = await getDatabase();

  const useByokRaw = (await getSetting(db, 'groq_use_byok')).trim().toLowerCase();
  const mode: GroqMode = useByokRaw === 'true' ? 'byok' : 'lambda';

  const modelRaw = (await getSetting(db, 'groq_model')).trim();
  const model = modelRaw.length > 0 ? modelRaw : GROQ_DEFAULT_MODEL_ID;
  const profile = getGroqProfile(model);

  if (mode === 'byok') {
    // SecureStore から直接キーを取得 (SQLite には保存されない)
    const apiKey = (await getSecureValue('groq_api_key')).trim();
    if (apiKey.length === 0) {
      throw new Error(
        '自前のGroq APIキーが未設定です。設定 → AIモデル → Groq設定 → 上級者モード でキーを入力するか、Lambda経由に切り替えてください',
      );
    }
    return { mode, apiKey, model, profile };
  }

  // Lambda proxy モード: クライアントにキー不要
  return { mode, apiKey: '', model, profile };
}

// ============================================================
// Lambda proxy — Cognito一時認証情報の取得 + キャッシュ
// (bedrockAnalysisService と同じパターン・同じキャッシュを共有してもよいが
//  循環依存を避けるためモジュール内にローカルキャッシュを持つ)
// ============================================================

interface CachedCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expiration: Date;
}

let credentialsCache: CachedCredentials | null = null;

async function getTemporaryCredentials(): Promise<CachedCredentials> {
  const now = new Date();
  if (
    credentialsCache !== null &&
    credentialsCache.expiration > new Date(now.getTime() + 60 * 1000)
  ) {
    return credentialsCache;
  }

  const client = new CognitoIdentityClient({ region: AWS_REGION });

  const getIdResponse = await client.send(
    new GetIdCommand({ IdentityPoolId: COGNITO_IDENTITY_POOL_ID }),
  );
  if (!getIdResponse.IdentityId) {
    throw new Error('Cognito Identity IDの取得に失敗しました');
  }

  const credsResponse = await client.send(
    new GetCredentialsForIdentityCommand({ IdentityId: getIdResponse.IdentityId }),
  );
  const creds = credsResponse.Credentials;
  if (!creds?.AccessKeyId || !creds?.SecretKey || !creds?.SessionToken || !creds?.Expiration) {
    throw new Error('Cognito一時認証情報の取得に失敗しました');
  }

  credentialsCache = {
    accessKeyId: creds.AccessKeyId,
    secretAccessKey: creds.SecretKey,
    sessionToken: creds.SessionToken,
    expiration: creds.Expiration,
  };
  return credentialsCache;
}

// ============================================================
// プロンプト生成 (OpenAI chat 形式, 日本語 / localAnalysisService と品質揃え)
// ============================================================

const SYSTEM_PROMPT =
  'あなたは日本語Webページを分析し、学習カード用のJSONを生成するアシスタントです。' +
  '必ず有効なJSONオブジェクトのみを出力してください（説明文・マークダウン禁止）。' +
  '無駄な前置き・列挙表現・水増しは厳禁。核心だけを端的に書いてください。';

/** 学習カードとして価値のある観点リスト。プロンプトに埋め込みモデルを誘導する */
const QA_ANGLES = [
  '定義（これは何か？）',
  '目的・理由（なぜ必要か／何を解決するか）',
  '仕組み・方法（どうやって動くか）',
  '主要な特徴・性質',
  '具体例・事例（数字・固有名詞を含む）',
  '対比・違い（類似概念との区別）',
  '利点・メリット',
  '欠点・制約・注意点',
  '前提条件・依存関係',
  '応用・使いどころ',
  '歴史・背景・発端',
  '関連する人物・組織・プロダクト',
].join('\n- ');

const QA_RULES = `【Q&Aペアの品質基準 — 厳守】
- 答えは1文・30文字以内で完結させること（句点ひとつで終わる）
- 「以下の通りです」「〜があります」「様々な〜」等の前置き・列挙・水増し表現は禁止
- 各Q&Aは異なる観点・異なる切り口にすること。言い換えでの水増し禁止
- 固有名詞・数字・具体例がある場合は答えに入れること（記憶定着の核）
- 曖昧な「〜など」「〜的」で終わる答えは作らないこと
- 本文に書かれていない推測・一般論は禁止
- 日本語で生成すること

【観点リスト（このうち複数の観点からQ&Aを作ること）】
- ${QA_ANGLES}`;

function buildFirstChunkUserMessage(
  url: string,
  text: string,
  totalChunks: number,
): string {
  const chunkNote = totalChunks > 1 ? `（第1部 / 全${totalChunks}部）` : '';
  return `以下はWebページの本文テキスト${chunkNote}です。
このページの内容を分析し、学習カード用のデータをJSON形式で生成してください。

【出力形式】
JSONオブジェクトのみ（説明文・マークダウン不要）:
{
  "title": "ページタイトル（30文字以内）",
  "summary": "2〜3行の要約（主要ポイントを網羅）",
  "qa_pairs": [
    {"question": "問い（?で終わる）", "answer": "答え（1文・30文字以内）"}
  ],
  "category": "技術 or ビジネス or 科学 or 語学 or 一般教養 or その他",
  "tags": [
    {"name": "タグ名（10文字以内）", "description": "このタグが何を意味するか1文で説明"}
  ]
}

【生成数の目標】
- Q&Aペアは **必ず15個以上** 作ること（理想は20個）
- 本文から抽出できる情報をすべて拾う意識で生成すること
- 15個に満たない場合は上の観点リストを順番に適用して追加すること
- この呼び出しで生成しきれない分は後続の追加 call で補完されるため、1 call あたりは 20 個程度を上限目安に

${QA_RULES}

【タグの要件】
- 2〜5個のタグを生成すること
- ページの主要トピック・技術・概念を具体的に表すキーワード
- 各タグに1文（30文字以内）の説明を付けること

【カテゴリ判定基準】
- 技術: プログラミング、AI/ML、クラウド、ソフトウェア開発、エンジニアリング
- ビジネス: 経営、マーケティング、起業、投資、マネジメント
- 科学: 自然科学、医学、物理、化学、生物
- 語学: 英語学習、翻訳、言語習得、外国語
- 一般教養: 歴史、哲学、文化、社会、教育
- その他: 上記に当てはまらない場合

URL: ${url}
本文:
${text}`;
}

function buildChunkUserMessage(
  url: string,
  text: string,
  chunkIndex: number,
  totalChunks: number,
  existingQuestions: string[],
): string {
  const existingList =
    existingQuestions.length > 0
      ? `\n【既に生成済みの質問（これらと同じ・類似の質問は絶対に作らないこと）】\n${existingQuestions
          .map((q, i) => `${i + 1}. ${q}`)
          .join('\n')}\n`
      : '';
  return `以下はWebページの本文テキスト（第${chunkIndex + 1}部 / 全${totalChunks}部）の続きです。
このセクションの内容から学習カード用のQ&AペアをJSONで生成してください。

【出力形式】
JSONオブジェクトのみ（説明文・マークダウン不要）:
{
  "qa_pairs": [
    {"question": "問い（?で終わる）", "answer": "答え（1文・30文字以内）"}
  ]
}

【生成数の目標】
- このセクションから **必ず12個以上** のQ&Aを生成すること（理想は15-18個）
- 既出の質問は絶対に繰り返さないこと

${QA_RULES}
${existingList}
URL: ${url}
本文:
${text}`;
}

/**
 * 補填パス用プロンプト: 本文は渡さず、既出質問リストのみ渡して追加生成させる。
 * 同じ本文のまま N 件追加で欲しいケース（目標未達時のリトライ）に使う。
 */
function buildTopUpUserMessage(
  url: string,
  text: string,
  existingQuestions: string[],
  targetAdditional: number,
): string {
  return `以下のWebページ本文について、既に ${existingQuestions.length} 個のQ&Aを生成済みですが、まだ足りません。
既出の質問とは **完全に異なる観点** で、追加の学習カード用Q&Aを生成してください。

【出力形式】
JSONオブジェクトのみ（説明文・マークダウン不要）:
{
  "qa_pairs": [
    {"question": "問い（?で終わる）", "answer": "答え（1文・30文字以内）"}
  ]
}

【生成数の目標】
- **必ず ${targetAdditional} 個以上** の追加Q&Aを生成すること
- 既出の質問リストと同じ・類似・言い換えの質問は禁止
- 既出で使っていない観点を優先的に使うこと

${QA_RULES}

【既出の質問リスト（これらと同じ・類似・言い換えは絶対に作らないこと）】
${existingQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

URL: ${url}
本文:
${text}`;
}

// ============================================================
// Groq API 呼び出し (Lambda / BYOK 両対応)
// ============================================================

interface GroqChoice {
  message: { content: string };
}
interface GroqChatResponse {
  choices: GroqChoice[];
  error?: { message: string };
}

/** chat completions リクエストボディ (両モード共通) */
function buildChatRequestBody(
  model: string,
  systemPrompt: string,
  userMessage: string,
  maxTokens: number,
): unknown {
  return {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.3,
    max_tokens: maxTokens,
    response_format: { type: 'json_object' },
    stream: false,
  };
}

/** エラーステータスを日本語に変換 */
function throwHttpError(status: number, fallback: string): never {
  if (status === 401) {
    throw new Error('Groq APIキーが無効です (Lambda側の環境変数を確認するか、自前キーを再入力してください)');
  }
  if (status === 413) {
    // Groq Free Tier の TPM 6000 超過時、Groq は 413 を返す (待機しても回復しない)。
    // ユーザーには BYOK (Dev Tier) への切り替えを案内する。
    throw new Error(
      'Groq Free Tier の TPM (トークン/分) 制限を超過しました。\n' +
        '設定 → AIモデル → Groq設定 → 上級者モードで自前のDev TierキーをBYOKすると制限が50倍以上に緩和されます。',
    );
  }
  if (status === 429) {
    throw new Error('Groq APIレート上限に達しました。少し待って再試行してください');
  }
  throw new Error(fallback);
}

/** BYOK モード: Groq に直接 fetch */
async function callGroqDirect(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userMessage: string,
  maxTokens: number,
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

  try {
    const res = await fetch(GROQ_API_ENDPOINT, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(buildChatRequestBody(model, systemPrompt, userMessage, maxTokens)),
    });

    if (!res.ok) {
      let errMsg = `Groq API エラー (HTTP ${res.status})`;
      try {
        const errBody = (await res.json()) as { error?: { message?: string } };
        if (errBody.error?.message) errMsg = `Groq API: ${errBody.error.message}`;
      } catch {
        /* ignore */
      }
      throwHttpError(res.status, errMsg);
    }

    const json = (await res.json()) as GroqChatResponse;
    const content = json.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error('Groq APIのレスポンスが空です');
    }
    return content;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Groq API呼び出しがタイムアウトしました（${GROQ_TIMEOUT_MS / 1000}秒）`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Lambda proxy モード: Cognito → Lambda → Groq */
async function callGroqViaLambda(
  model: string,
  systemPrompt: string,
  userMessage: string,
  maxTokens: number,
): Promise<string> {
  const credentials = await getTemporaryCredentials();

  const lambda = new LambdaClient({
    region: AWS_REGION,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
    },
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

  try {
    const payload = buildChatRequestBody(model, systemPrompt, userMessage, maxTokens);
    const command = new InvokeCommand({
      FunctionName: GROQ_LAMBDA_FUNCTION_NAME,
      Payload: JSON.stringify(payload),
    });
    const response = await lambda.send(command, { abortSignal: controller.signal });

    // Lambda 自体の実行エラー (Unhandled Exception 等)
    if (response.FunctionError) {
      const raw = new TextDecoder().decode(response.Payload);
      let body: { errorMessage?: string };
      try {
        body = JSON.parse(raw) as { errorMessage?: string };
      } catch {
        throw new Error(`Lambdaエラーレスポンスのパースに失敗しました: ${raw.slice(0, 100)}`);
      }
      throw new Error(body.errorMessage ?? 'Groq proxy Lambda 実行エラー');
    }

    // ハンドラーが返す { statusCode, body } をパース
    const raw = new TextDecoder().decode(response.Payload);
    let lambdaResp: { statusCode: number; body: string };
    try {
      lambdaResp = JSON.parse(raw) as { statusCode: number; body: string };
    } catch {
      throw new Error(`Lambdaレスポンスのパースに失敗: ${raw.slice(0, 100)}`);
    }

    if (lambdaResp.statusCode !== 200) {
      // Lambda がエラーボディで返した Groq 側のステータスコードを日本語化
      let errMsg = `Groq proxy エラー (HTTP ${lambdaResp.statusCode})`;
      try {
        const errBody = JSON.parse(lambdaResp.body) as { error?: string };
        if (errBody.error) errMsg = `Groq proxy: ${errBody.error}`;
      } catch {
        /* ignore */
      }
      throwHttpError(lambdaResp.statusCode, errMsg);
    }

    // lambdaResp.body は Groq chat completions のレスポンス JSON (文字列化済)
    let groqJson: GroqChatResponse;
    try {
      groqJson = JSON.parse(lambdaResp.body) as GroqChatResponse;
    } catch {
      throw new Error('Groq レスポンスのパースに失敗しました');
    }
    const content = groqJson.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error('Groq APIのレスポンスが空です');
    }
    return content;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Groq proxy Lambdaがタイムアウトしました（${GROQ_TIMEOUT_MS / 1000}秒）`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============================================================
// レート制限対策 — 2段構え
//
// Groq Free Tier: 30 RPM (requests per minute) = 2 秒/req が上限。
// 多段補填ループで連続 call すると瞬時に 429 を食らう。
//
// [1] 事前間隔制御 (enforceGroqRateLimit):
//     前回 call から GROQ_MIN_CALL_INTERVAL_MS 経過していない場合は sleep。
//     正常系で 429 を発生させない防御策。
//
// [2] 429 検出時の指数バックオフ retry (callGroq のループ):
//     それでも 429 が返った場合は exponential backoff で最大 MAX_RETRIES 回
//     再試行する。並行する他プロセス (別端末等) が Groq を叩いていた場合や
//     サーバー側の一時的な混雑に対応するための「再送処理」。
//
// BYOK Dev Tier でも保守的に同じ扱い (実害は待機時間のみ)。
// ============================================================

/** call 間の最小間隔 (ms)。30 RPM = 2 秒 + 0.5 秒の安全マージン */
const GROQ_MIN_CALL_INTERVAL_MS = 2_500;

/** 429 発生時の retry 最大回数 */
const GROQ_MAX_RETRIES = 4;

/** retry 初回 backoff (ms)。attempt 毎に 2 倍される (5s → 10s → 20s → 40s) */
const GROQ_INITIAL_BACKOFF_MS = 5_000;

/** 最後に Groq API を叩いた epoch ms。プロセス起動時は 0 */
let lastGroqCallAt = 0;

/** 次 call 前に必要なら sleep してレート制限を遵守する */
async function enforceGroqRateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastGroqCallAt;
  const wait = GROQ_MIN_CALL_INTERVAL_MS - elapsed;
  if (wait > 0) {
    console.log(
      `[groqAnalysis] rate limit (pre): 前回 call から ${elapsed}ms → ${wait}ms 待機`,
    );
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  lastGroqCallAt = Date.now();
}

/** エラーが Groq の 429 / レート制限系かどうか判定 */
function isGroqRateLimitError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message;
  // throwHttpError が投げる日本語メッセージ、または Groq 側の英語メッセージを検出
  return (
    msg.includes('レート上限') ||
    msg.includes('429') ||
    /rate[\s_-]?limit/i.test(msg) ||
    /too many requests/i.test(msg)
  );
}

/**
 * 統合 callGroq: 事前間隔制御 + モード振り分け + 429 時の指数バックオフ retry
 *
 * 再試行ポリシー:
 *   attempt 0 → 失敗(429) → 5 秒待機
 *   attempt 1 → 失敗(429) → 10 秒待機
 *   attempt 2 → 失敗(429) → 20 秒待機
 *   attempt 3 → 失敗(429) → 40 秒待機
 *   attempt 4 → 失敗(429) → 諦めて throw
 *
 * 合計最大待機 = 75 秒 (Lambda 55s timeout とは独立、クライアント側での待機)
 */
async function callGroq(
  config: GroqRuntimeConfig,
  systemPrompt: string,
  userMessage: string,
  maxTokens: number,
): Promise<string> {
  let lastErr: unknown = null;

  for (let attempt = 0; attempt <= GROQ_MAX_RETRIES; attempt++) {
    await enforceGroqRateLimit();

    try {
      if (config.mode === 'byok') {
        return await callGroqDirect(
          config.apiKey,
          config.model,
          systemPrompt,
          userMessage,
          maxTokens,
        );
      }
      return await callGroqViaLambda(config.model, systemPrompt, userMessage, maxTokens);
    } catch (err) {
      lastErr = err;

      // 429 以外はリトライしない (認証エラー・サイズオーバー等は retry しても無駄)
      if (!isGroqRateLimitError(err)) {
        throw err;
      }

      // 429: リトライ上限到達なら諦める
      if (attempt >= GROQ_MAX_RETRIES) {
        console.warn(
          `[groqAnalysis] 429 retry 上限到達 (${GROQ_MAX_RETRIES + 1} 回試行失敗)`,
        );
        break;
      }

      // 429: 指数バックオフで待機
      const backoff = GROQ_INITIAL_BACKOFF_MS * Math.pow(2, attempt);
      console.warn(
        `[groqAnalysis] 429 検出 (attempt ${attempt + 1}/${GROQ_MAX_RETRIES + 1}) → ${backoff}ms 待機して再試行`,
      );
      await new Promise((resolve) => setTimeout(resolve, backoff));
    }
  }

  // retry 上限到達。最後のエラーを投げる
  throw lastErr instanceof Error
    ? lastErr
    : new Error('Groq API呼び出しが失敗しました (retry 上限到達)');
}

// ============================================================
// Public API: URL解析
// ============================================================

/**
 * URL → Groq 経由で AnalysisResult を生成する。
 * local/Bedrock と同じインターフェース。
 *
 * @param onProgress チャンク進捗コールバック (currentChunk, totalChunks, chunkQaCount, totalQaCount)
 */
export async function analyzeUrlGroq(
  url: string,
  onProgress?: (
    currentChunk: number,
    totalChunks: number,
    chunkQaCount?: number,
    totalQaCount?: number,
  ) => void,
): Promise<AnalysisResult> {
  const config = await loadGroqConfig();
  const { mode, model, profile } = config;
  console.log(
    `[groqAnalysis] 開始: ${url} (mode=${mode} model=${model} chunkSize=${profile.chunkSize} maxQa=${profile.maxQaTotal} maxTokFirst=${profile.maxTokensFirst} maxTokChunk=${profile.maxTokensChunk})`,
  );

  // ── フェーズ 1: HTML取得 + チャンク分割 (profile.chunkSize) ──
  onProgress?.(-1, 0);
  const text = await fetchAndExtractText(url);
  const chunks = splitTextIntoChunks(text, profile.chunkSize);
  console.log(
    `[groqAnalysis] ${chunks.length}チャンク / ${text.length}文字 / URL: ${url}`,
  );

  // ── フェーズ 2: 第1チャンク (メタ情報 + QA) ──
  onProgress?.(0, chunks.length);
  const firstMessage = buildFirstChunkUserMessage(url, chunks[0], chunks.length);

  let baseResult: AnalysisResult;
  try {
    baseResult = parseAnalysisResult(
      await callGroq(config, SYSTEM_PROMPT, firstMessage, profile.maxTokensFirst),
    );
  } catch (err) {
    console.warn('[groqAnalysis] 第1チャンクパース失敗、1回リトライします:', err);
    baseResult = parseAnalysisResult(
      await callGroq(config, SYSTEM_PROMPT, firstMessage, profile.maxTokensFirst),
    );
  }

  let allQaPairs: QAPair[] = [...baseResult.qa_pairs];
  console.log(
    `[groqAnalysis] チャンク1/${chunks.length}: ${allQaPairs.length}件生成（初回）`,
  );
  onProgress?.(0, chunks.length, allQaPairs.length, allQaPairs.length);

  // ── フェーズ 3: 残りチャンク (QAのみ追加生成) ──
  for (let i = 1; i < chunks.length; i++) {
    if (allQaPairs.length >= profile.maxQaTotal) {
      console.warn(
        `[groqAnalysis] QA上限(${profile.maxQaTotal})到達 → チャンク${i + 1}/${chunks.length}以降をスキップ`,
      );
      break;
    }
    onProgress?.(i, chunks.length);

    try {
      // TPM 6000 制限のため既出質問リストは直近 20 個に制限
      // (質問1個 ~50 tok × 20 = 1000 tok 追加入力)
      const existingQuestions = allQaPairs.slice(-20).map((qa) => qa.question);
      const userMessage = buildChunkUserMessage(
        url,
        chunks[i],
        i,
        chunks.length,
        existingQuestions,
      );
      const chunkRaw = await callGroq(config, SYSTEM_PROMPT, userMessage, profile.maxTokensChunk);
      const chunkPairs = parseChunkQaPairs(chunkRaw);
      if (chunkPairs.length === 0) {
        console.warn(
          `[groqAnalysis] チャンク${i + 1}/${chunks.length}: QA生成0件（パース失敗の可能性）`,
        );
      } else {
        console.log(
          `[groqAnalysis] チャンク${i + 1}/${chunks.length}: ${chunkPairs.length}件生成 / 累計${allQaPairs.length + chunkPairs.length}件`,
        );
      }
      allQaPairs.push(...chunkPairs);
      onProgress?.(i, chunks.length, chunkPairs.length, allQaPairs.length);
    } catch (err) {
      console.warn(
        `[groqAnalysis] チャンク${i + 1}/${chunks.length}の処理に失敗、スキップして継続:`,
        err,
      );
    }
  }

  // ── フェーズ 4-a: 中間重複排除 ──
  const beforeMidDedup = allQaPairs.length;
  allQaPairs = deduplicateQaPairs(allQaPairs);
  if (beforeMidDedup !== allQaPairs.length) {
    console.log(
      `[groqAnalysis] 中間dedup: ${beforeMidDedup}件 → ${allQaPairs.length}件（${beforeMidDedup - allQaPairs.length}件除去）`,
    );
  }

  // ── フェーズ 4-b: 目標未達時の多段補填ループ ──
  // Free Tier TPM 6000 に合わせて 1 call あたり maxTokens=1200 (約 15-17 QA) に
  // 縮小しているので、目標 30 件到達には 2-3 call 必要。
  // 各 call 間は callGroq 内の enforceGroqRateLimit + 429 retry が効く。
  const QA_TARGET_COUNT = 30;
  const MAX_TOP_UP_PASSES = 3;
  const TOP_UP_BATCH_SIZE = 15;

  for (let pass = 0; pass < MAX_TOP_UP_PASSES; pass++) {
    const deficit = QA_TARGET_COUNT - allQaPairs.length;
    if (deficit <= 0) break;
    if (allQaPairs.length >= profile.maxQaTotal) {
      console.log(
        `[groqAnalysis] 補填スキップ: 上限(${profile.maxQaTotal})到達済`,
      );
      break;
    }

    const targetAdditional = Math.max(deficit, TOP_UP_BATCH_SIZE);
    console.log(
      `[groqAnalysis] 補填パス${pass + 1}/${MAX_TOP_UP_PASSES}: 現在${allQaPairs.length}件 / 目標${QA_TARGET_COUNT}件 → 追加${targetAdditional}件要求`,
    );

    try {
      // 補填は最も情報密度の高い第1チャンクを再利用する。
      // 既出質問リストは直近 20 個に制限 (TPM 6000 を超えないため)
      const topUpMessage = buildTopUpUserMessage(
        url,
        chunks[0],
        allQaPairs.slice(-20).map((qa) => qa.question),
        targetAdditional,
      );
      const topUpRaw = await callGroq(
        config,
        SYSTEM_PROMPT,
        topUpMessage,
        profile.maxTokensChunk,
      );
      const topUpPairs = parseChunkQaPairs(topUpRaw);
      console.log(
        `[groqAnalysis] 補填パス${pass + 1}: ${topUpPairs.length}件生成`,
      );
      if (topUpPairs.length === 0) {
        console.warn(
          `[groqAnalysis] 補填パス${pass + 1}: 0件 → ループ打ち切り`,
        );
        break;
      }
      allQaPairs.push(...topUpPairs);

      // 各補填パス後に即座にdedup (次パスの既出リストを正確にするため)
      const beforePassDedup = allQaPairs.length;
      allQaPairs = deduplicateQaPairs(allQaPairs);
      if (beforePassDedup !== allQaPairs.length) {
        console.log(
          `[groqAnalysis] 補填パス${pass + 1}後dedup: ${beforePassDedup}件 → ${allQaPairs.length}件`,
        );
      }
      onProgress?.(chunks.length - 1, chunks.length, topUpPairs.length, allQaPairs.length);
    } catch (err) {
      console.warn(
        `[groqAnalysis] 補填パス${pass + 1}失敗、ループ打ち切り:`,
        err,
      );
      break;
    }
  }

  // ── フェーズ 4-c: 最終重複排除 + 上限キャップ ──
  const beforeFinalDedup = allQaPairs.length;
  allQaPairs = deduplicateQaPairs(allQaPairs);
  if (beforeFinalDedup !== allQaPairs.length) {
    console.log(
      `[groqAnalysis] 最終dedup: ${beforeFinalDedup}件 → ${allQaPairs.length}件`,
    );
  }
  if (allQaPairs.length > profile.maxQaTotal) {
    console.log(
      `[groqAnalysis] 上限キャップ: ${allQaPairs.length}件 → ${profile.maxQaTotal}件`,
    );
    allQaPairs = allQaPairs.slice(0, profile.maxQaTotal);
  }
  console.log(
    `[groqAnalysis] 解析完了: 全${chunks.length}チャンク → QA合計${allQaPairs.length}件（目標${QA_TARGET_COUNT}件）`,
  );

  let finalResult: AnalysisResult = { ...baseResult, qa_pairs: allQaPairs };
  if (finalResult.title === '無題') {
    try {
      finalResult = { ...finalResult, title: new URL(url).hostname };
    } catch {
      /* ignore */
    }
  }
  return finalResult;
}
