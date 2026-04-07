// ============================================================
// ローカルAI（Ollama + Gemma 4）設定
// Bedrockの代替としてPC上のOllamaを使う場合に切り替える
//
// iPhone実機から使う場合:
//   LOCAL_AI_HOST を PC の LAN IP に変更する（例: http://192.168.1.10:11434）
//   Ollamaを 0.0.0.0 でリッスンさせる: OLLAMA_HOST=0.0.0.0 ollama serve
// ============================================================

/** true にするとBedrockの代わりにローカルOllamaを使う */
export const LOCAL_AI_ENABLED = false;

/** OllamaサーバーのホストURL */
export const LOCAL_AI_HOST = 'http://localhost:11434';

/** 使用するOllamaモデル名（ollama create で登録した名前） */
export const LOCAL_AI_MODEL = 'gemma4-q3ks';

/** タイムアウト（ms）。CPUでの推論は時間がかかるため長めに設定 */
export const LOCAL_AI_TIMEOUT_MS = 180_000;

/** テキスト抽出の上限文字数（Lambdaと同値） */
export const LOCAL_AI_MAX_TEXT_LENGTH = 12_000;
