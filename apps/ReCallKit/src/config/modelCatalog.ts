// ============================================================
// AIモデルカタログ
// 追加する場合はこのファイルにエントリを追加するだけでOK
// ============================================================

import type { AnalysisProfile } from './analysisProfile';

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
  /**
   * URL解析時のチャンク/生成パラメータ。
   * 未指定なら DEFAULT_LOCAL_PROFILE にフォールバック。
   * モデルサイズ・量子化精度・長文処理能力を基準に調整する。
   */
  profile?: AnalysisProfile;
  deprecated?: boolean;               // true で新規インストール不可
  deprecationMessage?: string;         // 廃止理由の表示メッセージ
}

export const MODEL_CATALOG: ModelDefinition[] = [
  {
    id: 'qwen3-06b-q4km',
    name: 'ミニ',
    tag: '超軽量・日本語',
    description: '0.4GB・最軽量。Qwen3で日本語対応。iPhone 12以降',
    sizeGB: 0.4,
    sizeBytesEstimate: 397_000_000,
    url: 'https://huggingface.co/unsloth/Qwen3-0.6B-GGUF/resolve/main/Qwen3-0.6B-Q4_K_M.gguf',
    filename: 'Qwen3-0.6B-Q4_K_M.gguf',
    nGpuLayers: 99,
    nCtx: 4096,
    // 0.6Bの超小型。長文処理と一括QA生成が弱いため、チャンクと上限を小さめ。
    profile: { chunkSize: 1_200, maxQaTotal: 30, maxTokensFirst: 2_500, maxTokensChunk: 2_000 },
  },
  {
    id: 'qwen25-1b5-q4km',
    name: 'ライト',
    tag: '軽量・日本語',
    description: '1GB・日本語対応。URL解析向き。iPhone 12以降',
    sizeGB: 1.0,
    sizeBytesEstimate: 1_063_000_000,
    url: 'https://huggingface.co/bartowski/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/Qwen2.5-1.5B-Instruct-Q4_K_M.gguf',
    filename: 'Qwen2.5-1.5B-Q4_K_M.gguf',
    nGpuLayers: 99,
    nCtx: 4096,
    // 1.5B中型。4k contextで標準的なチャンキング。
    profile: { chunkSize: 1_500, maxQaTotal: 40, maxTokensFirst: 3_000, maxTokensChunk: 2_500 },
  },
  {
    id: 'qwen3-4b-q4km',
    name: 'スマート',
    tag: '日本語◎',
    description: '2.5GB・日本語高精度。推論能力が高い。iPhone 14以降',
    sizeGB: 2.5,
    sizeBytesEstimate: 2_500_000_000,
    url: 'https://huggingface.co/unsloth/Qwen3-4B-GGUF/resolve/main/Qwen3-4B-Q4_K_M.gguf',
    filename: 'Qwen3-4B-Q4_K_M.gguf',
    nGpuLayers: 99,
    nCtx: 4096,
    // 4B大型。長めのチャンクと多めのQAに耐える。
    profile: { chunkSize: 1_800, maxQaTotal: 50, maxTokensFirst: 3_000, maxTokensChunk: 3_000 },
  },
  {
    id: 'gemma4-iq2m',
    name: 'スピード',
    tag: '軽量',
    description: '最小サイズ・最速。iPhone 12以降で動作。精度はやや低下',
    sizeGB: 2.3,
    sizeBytesEstimate: 2_459_000_000,
    url: 'https://huggingface.co/unsloth/gemma-4-E2B-it-GGUF/resolve/main/gemma-4-E2B-it-UD-IQ2_M.gguf',
    filename: 'gemma-4-E2B-UD-IQ2_M.gguf',
    nGpuLayers: 99,
    nCtx: 4096,
    // IQ2量子化で精度低下気味。QA数を絞って品質維持。
    profile: { chunkSize: 1_500, maxQaTotal: 40, maxTokensFirst: 3_000, maxTokensChunk: 3_000 },
  },
  {
    id: 'gemma4-q3ks',
    name: 'バランス',
    tag: '推奨',
    description: '高速・省メモリ。iPhone 15 Pro / 16推奨',
    sizeGB: 2.3,
    sizeBytesEstimate: 2_468_000_000,
    url: 'https://huggingface.co/unsloth/gemma-4-E2B-it-GGUF/resolve/main/gemma-4-E2B-it-Q3_K_S.gguf',
    filename: 'gemma-4-E2B-Q3_K_S.gguf',
    nGpuLayers: 99,
    nCtx: 4096,
    // 現行デフォルト。従来の挙動を維持。
    profile: { chunkSize: 1_500, maxQaTotal: 50, maxTokensFirst: 3_000, maxTokensChunk: 3_000 },
  },
  {
    id: 'gemma4-q4km',
    name: 'プレミアム',
    tag: '高精度',
    description: 'より高品質な回答。iPhone 16推奨（要3GB空き）',
    sizeGB: 3.0,
    sizeBytesEstimate: 3_145_000_000,
    url: 'https://huggingface.co/unsloth/gemma-4-E2B-it-GGUF/resolve/main/gemma-4-E2B-it-Q4_K_M.gguf',
    filename: 'gemma-4-E2B-Q4_K_M.gguf',
    nGpuLayers: 99,
    nCtx: 4096,
    // Q4量子化で品質良好。やや長めのチャンクを許容。
    profile: { chunkSize: 1_700, maxQaTotal: 50, maxTokensFirst: 3_000, maxTokensChunk: 3_000 },
  },
];

export const DEFAULT_MODEL_ID = 'gemma4-q3ks';

export function getModelById(id: string): ModelDefinition | undefined {
  return MODEL_CATALOG.find((m) => m.id === id);
}
