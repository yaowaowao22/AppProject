// ============================================================
// Gemini URL解析サービス
//
// 2つの呼び出し経路をサポート (groqAnalysisService と同じパターン):
//
//   1. Lambda proxy (デフォルト) — gemini_use_byok='false' の場合
//      App → Cognito IAM → Lambda (recall-kit-gemini-proxy) → Gemini API
//      Lambda がサーバー側で GEMINI_API_KEY (env var) を保持。
//      アプリ配布物にキーが一切含まれない。
//
//   2. BYOK (上級者モード) — gemini_use_byok='true' の場合
//      App → SecureStore (Keychain/Keystore) から AIza... 読み込み → Gemini API 直接
//      ユーザーが自前のキーを使いたいケース向け。
//
// どちらの経路でも:
//   - fetchAndExtractText で HTML 本文抽出
//   - splitTextIntoChunks (profile.chunkSize) でチャンク分割
//   - generationConfig.responseMimeType='application/json' で JSON 強制
//   - parseAnalysisResult / parseChunkQaPairs / deduplicateQaPairs で local と品質揃え
//
// Gemini は Groq 比で TPM が 666 倍 (4M vs 6k) 余裕なので、Groq 版にある
// レート制限対策 (事前間隔制御 + 指数バックオフ retry) は**無効化**している。
// 必要になったら Groq 版と同じパターンで復活可能。
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
  assertWithinDailyLimit,
  incrementTodayUsage,
} from '../db/usageRepository';
import {
  AWS_REGION,
  COGNITO_IDENTITY_POOL_ID,
  GEMINI_LAMBDA_FUNCTION_NAME,
} from '../config/aws';
import {
  GEMINI_API_BASE_URL,
  GEMINI_DAILY_CHAR_LIMIT,
  GEMINI_DEFAULT_MODEL_ID,
  GEMINI_PER_URL_CHAR_LIMIT,
  GEMINI_TIMEOUT_MS,
  computeDynamicQaBudget,
  getGeminiProfile,
} from '../config/gemini';
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

type GeminiMode = 'lambda' | 'byok';

interface GeminiRuntimeConfig {
  mode: GeminiMode;
  /** BYOK モード時のみ使用。Lambda モードでは空文字 */
  apiKey: string;
  model: string;
  profile: AnalysisProfile;
}

async function loadGeminiConfig(): Promise<GeminiRuntimeConfig> {
  const db = await getDatabase();

  const useByokRaw = (await getSetting(db, 'gemini_use_byok')).trim().toLowerCase();
  const mode: GeminiMode = useByokRaw === 'true' ? 'byok' : 'lambda';

  const modelRaw = (await getSetting(db, 'gemini_model')).trim();
  const model = modelRaw.length > 0 ? modelRaw : GEMINI_DEFAULT_MODEL_ID;
  const profile = getGeminiProfile(model);

  if (mode === 'byok') {
    // SecureStore から直接キーを取得 (SQLite には保存されない)
    const apiKey = (await getSecureValue('gemini_api_key')).trim();
    if (apiKey.length === 0) {
      throw new Error(
        '自前のGemini APIキーが未設定です。設定 → AIモデル → Gemini設定 → 上級者モード でキーを入力するか、Lambda経由に切り替えてください',
      );
    }
    return { mode, apiKey, model, profile };
  }

  // Lambda proxy モード: クライアントにキー不要
  return { mode, apiKey: '', model, profile };
}

// ============================================================
// Lambda proxy — Cognito一時認証情報の取得 + キャッシュ
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
// プロンプト生成 (日本語 / localAnalysisService と品質揃え)
//
// Gemini は OpenAI 形式と異なり systemInstruction と contents が分離されている。
// ここでは system 文 と user 文 を個別に組み立てて、buildGeminiRequestBody で
// Gemini の形式に変換する。プロンプトの文言は groqAnalysisService と同一。
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
  targetQaCount: number,
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
- Q&Aペアは **${targetQaCount}個** 作ること（多すぎても少なすぎてもNG）
- 本文の情報密度に合わせて設定されているので、水増ししない・削りすぎない
- 観点リストを活用して ${targetQaCount} 個まで多様な切り口を作ること

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
  targetQaCount: number,
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
- このセクションから **${targetQaCount}個** のQ&Aを生成すること
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
// Gemini API 呼び出し (Lambda / BYOK 両対応)
// ============================================================

/** Gemini API のレスポンス型 (最小限) */
interface GeminiPart {
  text?: string;
}
interface GeminiContent {
  parts?: GeminiPart[];
  role?: string;
}
interface GeminiCandidate {
  content?: GeminiContent;
  finishReason?: string;
}
interface GeminiApiResponse {
  candidates?: GeminiCandidate[];
  error?: { code?: number; message?: string; status?: string };
}

/**
 * Gemini generateContent リクエストボディ (両モード共通)
 *
 * Gemini の API format (OpenAI と異なる):
 *   {
 *     model: "gemini-1.5-flash-8b",   // Lambda proxy が URL 生成に使用
 *     contents: [
 *       { role: "user", parts: [{ text: "..." }] }
 *     ],
 *     systemInstruction: { parts: [{ text: "..." }] },
 *     generationConfig: {
 *       temperature: 0.3,
 *       maxOutputTokens: 1500,
 *       responseMimeType: "application/json"
 *     }
 *   }
 */
function buildGeminiRequestBody(
  model: string,
  systemPrompt: string,
  userMessage: string,
  maxTokens: number,
): unknown {
  return {
    model,
    contents: [
      {
        role: 'user',
        parts: [{ text: userMessage }],
      },
    ],
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: maxTokens,
      responseMimeType: 'application/json',
    },
  };
}

/** Gemini レスポンスから content.parts[0].text を安全に抽出 */
function extractGeminiText(json: GeminiApiResponse): string {
  const candidate = json.candidates?.[0];
  if (!candidate) {
    throw new Error('Gemini APIのレスポンスに candidates がありません');
  }
  const text = candidate.content?.parts?.[0]?.text;
  if (!text || typeof text !== 'string') {
    const reason = candidate.finishReason ?? 'unknown';
    throw new Error(`Gemini APIのレスポンスが空です (finishReason=${reason})`);
  }
  return text;
}

/** エラーステータスを日本語に変換 */
function throwHttpError(status: number, fallback: string): never {
  if (status === 400) {
    throw new Error(`Gemini API リクエスト不正 (HTTP 400): ${fallback}`);
  }
  if (status === 401 || status === 403) {
    throw new Error(
      'Gemini APIキーが無効です (Lambda側の環境変数を確認するか、自前キーを再入力してください)',
    );
  }
  if (status === 413) {
    throw new Error('Gemini APIリクエストが大きすぎます (chunkSize を小さくしてください)');
  }
  if (status === 429) {
    throw new Error('Gemini APIレート上限に達しました。少し待って再試行してください');
  }
  throw new Error(fallback);
}

/** BYOK モード: Gemini に直接 fetch */
async function callGeminiDirect(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userMessage: string,
  maxTokens: number,
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  const url = `${GEMINI_API_BASE_URL}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  // body には 'model' フィールドは不要 (URL に埋め込み済)
  const body = buildGeminiRequestBody(model, systemPrompt, userMessage, maxTokens) as {
    model?: string;
    [k: string]: unknown;
  };
  delete body.model;

  try {
    const res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      let errMsg = `Gemini API エラー (HTTP ${res.status})`;
      try {
        const errBody = (await res.json()) as GeminiApiResponse;
        if (errBody.error?.message) errMsg = `Gemini API: ${errBody.error.message}`;
      } catch {
        /* ignore */
      }
      throwHttpError(res.status, errMsg);
    }

    const json = (await res.json()) as GeminiApiResponse;
    return extractGeminiText(json);
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Gemini API呼び出しがタイムアウトしました（${GEMINI_TIMEOUT_MS / 1000}秒）`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Lambda proxy モード: Cognito → Lambda → Gemini */
async function callGeminiViaLambda(
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
  const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    // Lambda proxy には 'model' フィールドも含めて送る (handler が URL 生成に使う)
    const payload = buildGeminiRequestBody(model, systemPrompt, userMessage, maxTokens);
    const command = new InvokeCommand({
      FunctionName: GEMINI_LAMBDA_FUNCTION_NAME,
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
      throw new Error(body.errorMessage ?? 'Gemini proxy Lambda 実行エラー');
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
      let errMsg = `Gemini proxy エラー (HTTP ${lambdaResp.statusCode})`;
      try {
        const errBody = JSON.parse(lambdaResp.body) as { error?: string };
        if (errBody.error) errMsg = `Gemini proxy: ${errBody.error}`;
      } catch {
        /* ignore */
      }
      throwHttpError(lambdaResp.statusCode, errMsg);
    }

    // lambdaResp.body は Gemini generateContent のレスポンス JSON (文字列化済)
    let geminiJson: GeminiApiResponse;
    try {
      geminiJson = JSON.parse(lambdaResp.body) as GeminiApiResponse;
    } catch {
      throw new Error('Gemini レスポンスのパースに失敗しました');
    }
    return extractGeminiText(geminiJson);
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Gemini proxy Lambdaがタイムアウトしました（${GEMINI_TIMEOUT_MS / 1000}秒）`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/** 統合 callGemini: モードに応じて直接 or Lambda に振り分け */
async function callGemini(
  config: GeminiRuntimeConfig,
  systemPrompt: string,
  userMessage: string,
  maxTokens: number,
): Promise<string> {
  if (config.mode === 'byok') {
    return callGeminiDirect(
      config.apiKey,
      config.model,
      systemPrompt,
      userMessage,
      maxTokens,
    );
  }
  return callGeminiViaLambda(config.model, systemPrompt, userMessage, maxTokens);
}

// ============================================================
// Public API: URL解析
// ============================================================

/**
 * URL → Gemini 経由で AnalysisResult を生成する。
 * local/Bedrock/Groq と同じインターフェース。
 *
 * @param onProgress チャンク進捗コールバック (currentChunk, totalChunks, chunkQaCount, totalQaCount)
 */
export async function analyzeUrlGemini(
  url: string,
  onProgress?: (
    currentChunk: number,
    totalChunks: number,
    chunkQaCount?: number,
    totalQaCount?: number,
  ) => void,
): Promise<AnalysisResult> {
  const config = await loadGeminiConfig();
  const { mode, model, profile } = config;

  // ── フェーズ 0: 日次使用量チェック ──
  // 先に上限確認 (本文取得前に弾くことでユーザー体感を速く)
  const db = await getDatabase();
  await assertWithinDailyLimit(db, GEMINI_DAILY_CHAR_LIMIT);

  console.log(
    `[geminiAnalysis] 開始: ${url} (mode=${mode} model=${model})`,
  );

  // ── フェーズ 1: HTML取得 + URL単位の文字数キャップ ──
  onProgress?.(-1, 0);
  let text = await fetchAndExtractText(url);

  // 1 URL あたりの上限超過時は先頭からトリム (後ろを捨てる)。
  // エラーにしない方針 (ユーザー体験を優先、本文の先頭が最も情報量多いケースが多い)。
  if (text.length > GEMINI_PER_URL_CHAR_LIMIT) {
    console.warn(
      `[geminiAnalysis] 本文が上限 ${GEMINI_PER_URL_CHAR_LIMIT} 文字を超過 (${text.length} 字) → トリム`,
    );
    text = text.slice(0, GEMINI_PER_URL_CHAR_LIMIT);
  }

  // ── フェーズ 1-b: 動的 QA 予算計算 ──
  // 本文文字数から目標 QA 数と maxOutputTokens を決定。
  // これで output コスト (input の 4 倍単価) を抑制する。
  const firstBudget = computeDynamicQaBudget(text.length);
  console.log(
    `[geminiAnalysis] 動的予算: 本文${text.length}字 → 目標${firstBudget.targetQaCount}QA, maxOutputTokens=${firstBudget.maxOutputTokens}`,
  );

  // ── フェーズ 1-c: チャンク分割 ──
  const chunks = splitTextIntoChunks(text, profile.chunkSize);
  console.log(
    `[geminiAnalysis] ${chunks.length}チャンク / ${text.length}文字 / URL: ${url}`,
  );

  // ── フェーズ 2: 第1チャンク (メタ情報 + QA) ──
  onProgress?.(0, chunks.length);
  const firstMessage = buildFirstChunkUserMessage(
    url,
    chunks[0],
    chunks.length,
    firstBudget.targetQaCount,
  );

  let baseResult: AnalysisResult;
  try {
    baseResult = parseAnalysisResult(
      await callGemini(config, SYSTEM_PROMPT, firstMessage, firstBudget.maxOutputTokens),
    );
  } catch (err) {
    console.warn('[geminiAnalysis] 第1チャンクパース失敗、1回リトライします:', err);
    baseResult = parseAnalysisResult(
      await callGemini(config, SYSTEM_PROMPT, firstMessage, firstBudget.maxOutputTokens),
    );
  }

  let allQaPairs: QAPair[] = [...baseResult.qa_pairs];
  console.log(
    `[geminiAnalysis] チャンク1/${chunks.length}: ${allQaPairs.length}件生成（初回）`,
  );
  onProgress?.(0, chunks.length, allQaPairs.length, allQaPairs.length);

  // ── フェーズ 3: 残りチャンク (QAのみ追加生成) ──
  // 継続チャンクも動的予算で小さく呼ぶ
  for (let i = 1; i < chunks.length; i++) {
    if (allQaPairs.length >= profile.maxQaTotal) {
      console.warn(
        `[geminiAnalysis] QA上限(${profile.maxQaTotal})到達 → チャンク${i + 1}/${chunks.length}以降をスキップ`,
      );
      break;
    }
    onProgress?.(i, chunks.length);

    const chunkBudget = computeDynamicQaBudget(chunks[i].length);
    try {
      const existingQuestions = allQaPairs.map((qa) => qa.question);
      const userMessage = buildChunkUserMessage(
        url,
        chunks[i],
        i,
        chunks.length,
        existingQuestions,
        chunkBudget.targetQaCount,
      );
      const chunkRaw = await callGemini(
        config,
        SYSTEM_PROMPT,
        userMessage,
        chunkBudget.maxOutputTokens,
      );
      const chunkPairs = parseChunkQaPairs(chunkRaw);
      if (chunkPairs.length === 0) {
        console.warn(
          `[geminiAnalysis] チャンク${i + 1}/${chunks.length}: QA生成0件（パース失敗の可能性）`,
        );
      } else {
        console.log(
          `[geminiAnalysis] チャンク${i + 1}/${chunks.length}: ${chunkPairs.length}件生成 / 累計${allQaPairs.length + chunkPairs.length}件`,
        );
      }
      allQaPairs.push(...chunkPairs);
      onProgress?.(i, chunks.length, chunkPairs.length, allQaPairs.length);
    } catch (err) {
      console.warn(
        `[geminiAnalysis] チャンク${i + 1}/${chunks.length}の処理に失敗、スキップして継続:`,
        err,
      );
    }
  }

  // ── フェーズ 4: 重複排除 + 最終結果 (多段補填ループは無効化) ──
  // 動的予算で「多すぎず少なすぎず」を実現したので、補填ループは不要。
  // 目標件数を下回っていたら 1 QA 足りないと出るだけでコスト増は避ける。
  const beforeFinalDedup = allQaPairs.length;
  allQaPairs = deduplicateQaPairs(allQaPairs);
  if (beforeFinalDedup !== allQaPairs.length) {
    console.log(
      `[geminiAnalysis] 最終dedup: ${beforeFinalDedup}件 → ${allQaPairs.length}件`,
    );
  }
  if (allQaPairs.length > profile.maxQaTotal) {
    console.log(
      `[geminiAnalysis] 上限キャップ: ${allQaPairs.length}件 → ${profile.maxQaTotal}件`,
    );
    allQaPairs = allQaPairs.slice(0, profile.maxQaTotal);
  }
  console.log(
    `[geminiAnalysis] 解析完了: 全${chunks.length}チャンク → QA合計${allQaPairs.length}件（目標${firstBudget.targetQaCount}件）`,
  );

  // ── フェーズ 5: 使用量記録 (成功時のみ) ──
  // 失敗時は記録しない (ユーザー側の不公平を避ける)。
  try {
    await incrementTodayUsage(db, text.length, 1);
  } catch (err) {
    console.warn('[geminiAnalysis] 使用量記録に失敗:', err);
  }

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
