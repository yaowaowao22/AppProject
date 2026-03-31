import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  saveWorkouts,
  loadWorkouts,
  savePersonalRecords,
  loadPersonalRecords,
  saveTemplates,
  loadTemplates,
  saveAppSettings,
  loadAppSettings,
} from '../utils/storage';
import { STORAGE_KEYS, APP } from '../config';
import type { DailyWorkout, PersonalRecord, WorkoutTemplate, AppSettings } from '../types';

const mockGetItem = AsyncStorage.getItem as jest.Mock;
const mockSetItem = AsyncStorage.setItem as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

// ── フィクスチャ ──────────────────────────────────────────────────────────────

const mockWorkout: DailyWorkout = {
  id: 'w1',
  date: '2026-03-31',
  sessions: [],
  totalVolume: 500,
  duration: 3600,
};

const mockPR: PersonalRecord = {
  exerciseId: 'chest_001',
  maxWeight: 100,
  maxReps: 5,
  maxVolume: 2500,
  achievedAt: '2026-03-31T10:00:00.000Z',
};

const mockTemplate: WorkoutTemplate = {
  id: 't1',
  name: 'Push Day',
  exerciseIds: ['chest_001', 'shoulders_001', 'arms_002'],
  createdAt: '2026-03-31T09:00:00.000Z',
};

const mockSettings: AppSettings = {
  showCalendar: false,
  showQuickStart: true,
};

// ── saveWorkouts / loadWorkouts ───────────────────────────────────────────────

describe('saveWorkouts', () => {
  it('WORKOUTS キーへ JSON シリアライズして保存する', async () => {
    await saveWorkouts([mockWorkout]);
    expect(mockSetItem).toHaveBeenCalledWith(
      STORAGE_KEYS.WORKOUTS,
      JSON.stringify([mockWorkout]),
    );
  });

  it('AsyncStorage がエラーを投げてもリジェクトしない', async () => {
    mockSetItem.mockRejectedValueOnce(new Error('disk full'));
    await expect(saveWorkouts([mockWorkout])).resolves.toBeUndefined();
  });
});

describe('loadWorkouts', () => {
  it('保存済みデータを配列で返す', async () => {
    mockGetItem.mockResolvedValueOnce(JSON.stringify([mockWorkout]));
    const result = await loadWorkouts();
    expect(result).toEqual([mockWorkout]);
  });

  it('データがない場合は空配列を返す', async () => {
    mockGetItem.mockResolvedValueOnce(null);
    const result = await loadWorkouts();
    expect(result).toEqual([]);
  });

  it('不正な JSON でも空配列を返す', async () => {
    mockGetItem.mockResolvedValueOnce('{invalid json');
    const result = await loadWorkouts();
    expect(result).toEqual([]);
  });

  it('AsyncStorage がエラーを投げた場合は空配列を返す', async () => {
    mockGetItem.mockRejectedValueOnce(new Error('storage error'));
    const result = await loadWorkouts();
    expect(result).toEqual([]);
  });
});

// ── savePersonalRecords / loadPersonalRecords ─────────────────────────────────

describe('savePersonalRecords', () => {
  it('PERSONAL_RECORDS キーへ保存する', async () => {
    await savePersonalRecords([mockPR]);
    expect(mockSetItem).toHaveBeenCalledWith(
      STORAGE_KEYS.PERSONAL_RECORDS,
      JSON.stringify([mockPR]),
    );
  });

  it('エラー時もリジェクトしない', async () => {
    mockSetItem.mockRejectedValueOnce(new Error('error'));
    await expect(savePersonalRecords([mockPR])).resolves.toBeUndefined();
  });
});

describe('loadPersonalRecords', () => {
  it('保存済みデータを返す', async () => {
    mockGetItem.mockResolvedValueOnce(JSON.stringify([mockPR]));
    const result = await loadPersonalRecords();
    expect(result).toEqual([mockPR]);
  });

  it('データなしは空配列', async () => {
    mockGetItem.mockResolvedValueOnce(null);
    expect(await loadPersonalRecords()).toEqual([]);
  });

  it('不正 JSON は空配列', async () => {
    mockGetItem.mockResolvedValueOnce('bad');
    expect(await loadPersonalRecords()).toEqual([]);
  });
});

// ── saveTemplates / loadTemplates ─────────────────────────────────────────────

describe('saveTemplates', () => {
  it('TEMPLATES キーへ保存する', async () => {
    await saveTemplates([mockTemplate]);
    expect(mockSetItem).toHaveBeenCalledWith(
      STORAGE_KEYS.TEMPLATES,
      JSON.stringify([mockTemplate]),
    );
  });

  it('エラー時もリジェクトしない', async () => {
    mockSetItem.mockRejectedValueOnce(new Error('error'));
    await expect(saveTemplates([mockTemplate])).resolves.toBeUndefined();
  });
});

describe('loadTemplates', () => {
  it('保存済みテンプレートを返す', async () => {
    mockGetItem.mockResolvedValueOnce(JSON.stringify([mockTemplate]));
    expect(await loadTemplates()).toEqual([mockTemplate]);
  });

  it('データなしは空配列', async () => {
    mockGetItem.mockResolvedValueOnce(null);
    expect(await loadTemplates()).toEqual([]);
  });

  it('不正 JSON は空配列', async () => {
    mockGetItem.mockResolvedValueOnce('???');
    expect(await loadTemplates()).toEqual([]);
  });
});

// ── saveAppSettings / loadAppSettings ────────────────────────────────────────

describe('saveAppSettings', () => {
  it('APP_SETTINGS キーへ保存する', async () => {
    await saveAppSettings(mockSettings);
    expect(mockSetItem).toHaveBeenCalledWith(
      STORAGE_KEYS.APP_SETTINGS,
      JSON.stringify(mockSettings),
    );
  });

  it('エラー時もリジェクトしない', async () => {
    mockSetItem.mockRejectedValueOnce(new Error('error'));
    await expect(saveAppSettings(mockSettings)).resolves.toBeUndefined();
  });
});

describe('loadAppSettings', () => {
  it('保存済み設定を返す', async () => {
    mockGetItem.mockResolvedValueOnce(JSON.stringify(mockSettings));
    const result = await loadAppSettings();
    expect(result.showCalendar).toBe(false);
    expect(result.showQuickStart).toBe(true);
  });

  it('データなしはデフォルト設定を返す', async () => {
    mockGetItem.mockResolvedValueOnce(null);
    const result = await loadAppSettings();
    expect(result).toEqual(APP.DEFAULT_APP_SETTINGS);
  });

  it('部分的なデータはデフォルト値でマイグレーション補完される', async () => {
    const partial = { showCalendar: false }; // showQuickStart が欠損
    mockGetItem.mockResolvedValueOnce(JSON.stringify(partial));
    const result = await loadAppSettings();
    expect(result.showCalendar).toBe(false);
    expect(result.showQuickStart).toBe(APP.DEFAULT_APP_SETTINGS.showQuickStart);
  });

  it('不正 JSON はデフォルト設定を返す', async () => {
    mockGetItem.mockResolvedValueOnce('{{broken');
    const result = await loadAppSettings();
    expect(result).toEqual(APP.DEFAULT_APP_SETTINGS);
  });

  it('AsyncStorage エラーはデフォルト設定を返す', async () => {
    mockGetItem.mockRejectedValueOnce(new Error('error'));
    const result = await loadAppSettings();
    expect(result).toEqual(APP.DEFAULT_APP_SETTINGS);
  });
});
