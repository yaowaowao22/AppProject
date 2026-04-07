// ============================================================
// AIモデルカタログ
// 追加する場合はこのファイルにエントリを追加するだけでOK
// ============================================================

export interface ModelDefinition {
  id: string;
  name: string;
  tag: string;          // 推奨 / 高精度 など
  description: string;
  sizeGB: number;       // 表示用
  sizeBytesEstimate: number;  // ダウンロード進捗の推定値
  url: string;
  filename: string;
  nGpuLayers: number;
  nCtx: number;
}

export const MODEL_CATALOG: ModelDefinition[] = [
  {
    id: 'gemma4-q3ks',
    name: 'Gemma 4 E2B Q3_K_S',
    tag: '推奨',
    description: '高速・省メモリ。iPhone 15 Pro / 16推奨',
    sizeGB: 2.3,
    sizeBytesEstimate: 2_468_000_000,
    url: 'https://huggingface.co/unsloth/gemma-4-E2B-it-GGUF/resolve/main/gemma-4-E2B-it-Q3_K_S.gguf',
    filename: 'gemma-4-E2B-Q3_K_S.gguf',
    nGpuLayers: 99,
    nCtx: 4096,
  },
  {
    id: 'gemma4-q4km',
    name: 'Gemma 4 E2B Q4_K_M',
    tag: '高精度',
    description: 'より高品質な回答。iPhone 16推奨（要3GB空き）',
    sizeGB: 3.0,
    sizeBytesEstimate: 3_145_000_000,
    url: 'https://huggingface.co/unsloth/gemma-4-E2B-it-GGUF/resolve/main/gemma-4-E2B-it-Q4_K_M.gguf',
    filename: 'gemma-4-E2B-Q4_K_M.gguf',
    nGpuLayers: 99,
    nCtx: 4096,
  },
];

export const DEFAULT_MODEL_ID = 'gemma4-q3ks';

export function getModelById(id: string): ModelDefinition | undefined {
  return MODEL_CATALOG.find((m) => m.id === id);
}
