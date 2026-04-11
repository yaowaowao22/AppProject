// ============================================================
// Groq URL解析サービス
//
// データフロー:
//   App → fetchAndExtractText(URL) → splitTextIntoChunks
//       → Groq Chat Completions API (JSON mode) → QAPair[]
//
// 特徴:
//   - BYOK (ユーザーが設定画面で gsk_... キーを入力)
//   - OpenAI互換 response_format: { type: 'json_object' } で JSON 強制
//   - local と同じチャンク分割 / 重複排除 / レジューム無し (速いので不要)
//   - deep-dive には使わない (runLocalCompletion 経路は独立)
// ============================================================

import { getDatabase } from '../db/connection';
import { getSetting } from '../db/settingsRepository';
import {
  GROQ_API_ENDPOINT,
  GROQ_DEFAULT_MODEL_ID,
  GROQ_TIMEOUT_MS,
  getGroqProfile,
} from '../config/groq';
import type { AnalysisProfile } from '../config/analysisProfile';
import { fetchAndExtractText } from './htmlExtractorService';
import {
  deduplicateQaPairs,
  parseAnalysisResult,
  parseChunkQaPairs,
  splitTextIntoChunks,
} from './localAnalysisService';
import type { AnalysisResult, QAPair } from '../types/analysis';

// ============================================================
// 設定読み込み
// ============================================================

async function loadGroqConfig(): Promise<{
  apiKey: string;
  model: string;
  profile: AnalysisProfile;
}> {
  const db = await getDatabase();
  const apiKey = (await getSetting(db, 'groq_api_key')).trim();
  const modelRaw = (await getSetting(db, 'groq_model')).trim();
  const model = modelRaw.length > 0 ? modelRaw : GROQ_DEFAULT_MODEL_ID;

  if (apiKey.length === 0) {
    throw new Error(
      'Groq APIキーが未設定です。設定 → AIモデル → Groq APIキー からキーを入力してください',
    );
  }
  const profile = getGroqProfile(model);
  return { apiKey, model, profile };
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
- このセクションから必ず10個以上のQ&Aを生成すること
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
- このセクションから必ず10個以上のQ&Aを生成すること
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
// Groq API 呼び出し
// ============================================================

interface GroqChoice {
  message: { content: string };
}
interface GroqChatResponse {
  choices: GroqChoice[];
  error?: { message: string };
}

async function callGroq(
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
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.3,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
        stream: false,
      }),
    });

    if (!res.ok) {
      let errMsg = `Groq API エラー (HTTP ${res.status})`;
      try {
        const errBody = (await res.json()) as { error?: { message?: string } };
        if (errBody.error?.message) {
          errMsg = `Groq API: ${errBody.error.message}`;
        }
      } catch {
        /* body パース失敗は無視 */
      }
      // 認証系エラーを明示化
      if (res.status === 401) {
        throw new Error('Groq APIキーが無効です。設定画面でキーを再確認してください');
      }
      if (res.status === 429) {
        throw new Error('Groq APIレート上限に達しました。少し待って再試行してください');
      }
      throw new Error(errMsg);
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
  const { apiKey, model, profile } = await loadGroqConfig();
  console.log(
    `[groqAnalysis] 開始: ${url} (model=${model} profile: chunkSize=${profile.chunkSize} maxQa=${profile.maxQaTotal} maxTokFirst=${profile.maxTokensFirst} maxTokChunk=${profile.maxTokensChunk})`,
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
      await callGroq(apiKey, model, SYSTEM_PROMPT, firstMessage, profile.maxTokensFirst),
    );
  } catch (err) {
    console.warn('[groqAnalysis] 第1チャンクパース失敗、1回リトライします:', err);
    baseResult = parseAnalysisResult(
      await callGroq(apiKey, model, SYSTEM_PROMPT, firstMessage, profile.maxTokensFirst),
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
      const chunkRaw = await callGroq(
        apiKey,
        model,
        SYSTEM_PROMPT,
        userMessage,
        profile.maxTokensChunk,
      );
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
  // Bedrock 版と同じく fetched_text は含めない (local のレジューム専用)
  return finalResult;
}
