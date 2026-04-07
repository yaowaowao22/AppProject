// ============================================================
// ローカルAI（llama.rn + Gemma 4）設定
// Bedrockの代替としてデバイス内でGemma 4を直接実行する
//
// 必要条件:
//   - EAS Build（ネイティブモジュールのため）
//   - iPhone 15 Pro / 16系（8GB RAM）推奨
//   - 初回起動時に ~2.3GB のモデルをダウンロード
// ============================================================

/**
 * true にするとBedrockの代わりにデバイス内Gemma 4（llama.rn）を使う。
 * EAS Buildが必要。iPhone 15 Pro / 16系（8GB RAM）推奨。
 */
export const LOCAL_AI_ENABLED = true;

/** HuggingFaceからのGGUFダウンロードURL（初回起動時に ~2.3GB ダウンロード） */
export const LOCAL_AI_MODEL_URL =
  'https://huggingface.co/unsloth/gemma-4-E2B-it-GGUF/resolve/main/gemma-4-E2B-it-Q3_K_S.gguf';

/** デバイス内保存ファイル名 */
export const LOCAL_AI_MODEL_FILENAME = 'gemma-4-E2B-Q3_K_S.gguf';

/** タイムアウト（ms）。Metal GPU使用時は ~40秒程度 */
export const LOCAL_AI_TIMEOUT_MS = 180_000;

/** テキスト抽出の上限文字数（Lambdaと同値） */
export const LOCAL_AI_MAX_TEXT_LENGTH = 12_000;

/** llama.rn: コンテキストウィンドウ（トークン数） */
export const LOCAL_AI_N_CTX = 4096;

/** llama.rn: Metal GPUレイヤー数（99 = 全レイヤーをGPUに載せる） */
export const LOCAL_AI_N_GPU_LAYERS = 99;
