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
  '必ず有効なJSONオブジェクトのみを出力してください（説明文・マークダウン禁止）。';

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

【Q&Aペアの要件】
- このセクションから必ず20個以上のQ&Aを生成すること (最低20、できれば30以上)
- 答えは1文・30文字以内で完結させること（句点ひとつで終わる）
- 「以下の通りです」「〜があります」等の前置き・列挙は禁止。核心だけ書く
- 同じ内容・同じ観点の質問を繰り返さないこと。各Q&Aは異なるトピック・異なる切り口にすること
- 日本語で生成すること

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
      ? `\n【生成済みの質問（これらと同じ・類似の質問は生成しないこと）】\n${existingQuestions
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

【Q&Aペアの要件】
- このセクションから必ず15個以上のQ&Aを生成すること
- 答えは1文・30文字以内で完結させること（句点ひとつで終わる）
- 「以下の通りです」「〜があります」等の前置き・列挙は禁止。核心だけ書く
- 既に生成済みの質問と同じ内容・同じ観点の質問は絶対に生成しないこと
- 日本語で生成すること
${existingList}
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
    throw new Error('Groq APIリクエストが大きすぎます (chunkSize を小さくしてください)');
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

/** 統合 callGroq: モードに応じて直接 or Lambda に振り分け */
async function callGroq(
  config: GroqRuntimeConfig,
  systemPrompt: string,
  userMessage: string,
  maxTokens: number,
): Promise<string> {
  if (config.mode === 'byok') {
    return callGroqDirect(config.apiKey, config.model, systemPrompt, userMessage, maxTokens);
  }
  return callGroqViaLambda(config.model, systemPrompt, userMessage, maxTokens);
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
      const existingQuestions = allQaPairs.map((qa) => qa.question);
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

  // ── フェーズ 4: 重複排除 + 最終結果 ──
  const beforeDedup = allQaPairs.length;
  allQaPairs = deduplicateQaPairs(allQaPairs);
  if (beforeDedup !== allQaPairs.length) {
    console.log(
      `[groqAnalysis] 重複排除: ${beforeDedup}件 → ${allQaPairs.length}件（${beforeDedup - allQaPairs.length}件除去）`,
    );
  }
  console.log(
    `[groqAnalysis] 解析完了: 全${chunks.length}チャンク → QA合計${allQaPairs.length}件`,
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
