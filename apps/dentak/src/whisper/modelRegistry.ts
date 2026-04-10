import * as FileSystem from 'expo-file-system/legacy';

export type WhisperModelSize = 'tiny' | 'base' | 'small' | 'medium';

export interface WhisperModel {
  id:         WhisperModelSize;
  label:      string;
  sizeMB:     number;
  ggmlUrl:    string;
  coremlUrl:  string;
  localPath:  string;
  accuracy:   'fast' | 'balanced' | 'accurate' | 'best';
  minRAM_MB:  number;
}

export const MODEL_REGISTRY: WhisperModel[] = [
  {
    id:        'tiny',
    label:     'Whisper Tiny（初期）',
    sizeMB:    39,
    ggmlUrl:   'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin',
    coremlUrl: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny-encoder.mlmodelc.zip',
    localPath: 'whisper/ggml-tiny.bin',
    accuracy:  'fast',
    minRAM_MB: 128,
  },
  {
    id:        'base',
    label:     'Whisper Base',
    sizeMB:    74,
    ggmlUrl:   'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin',
    coremlUrl: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base-encoder.mlmodelc.zip',
    localPath: 'whisper/ggml-base.bin',
    accuracy:  'balanced',
    minRAM_MB: 256,
  },
  {
    id:        'small',
    label:     'Whisper Small',
    sizeMB:    244,
    ggmlUrl:   'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin',
    coremlUrl: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small-encoder.mlmodelc.zip',
    localPath: 'whisper/ggml-small.bin',
    accuracy:  'accurate',
    minRAM_MB: 512,
  },
  {
    id:        'medium',
    label:     'Whisper Medium',
    sizeMB:    769,
    ggmlUrl:   'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin',
    coremlUrl: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium-encoder.mlmodelc.zip',
    localPath: 'whisper/ggml-medium.bin',
    accuracy:  'best',
    minRAM_MB: 1024,
  },
];

export function getModel(id: WhisperModelSize): WhisperModel {
  const model = MODEL_REGISTRY.find((m) => m.id === id);
  if (!model) {
    throw new Error(`Unknown model id: ${id}`);
  }
  return model;
}

export function getLocalModelPath(id: WhisperModelSize): string {
  const model = getModel(id);
  const base = FileSystem.documentDirectory ?? '';
  return base + model.localPath;
}
