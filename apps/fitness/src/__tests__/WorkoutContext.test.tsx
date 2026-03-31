/**
 * WorkoutContext テスト
 *
 * 対象: WorkoutProvider / useWorkout
 * - 全メソッド（startSession / addSet / completeSession / deleteWorkout /
 *   deleteSessionFromWorkout / saveTemplate / updateTemplate / deleteTemplate /
 *   updateWorkoutConfig / updateSession / resetAll）
 * - 状態管理・永続化（AsyncStorage への読み書き）
 * - PR 判定ロジック
 * - weeklyStats / streakDays 計算
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutProvider, useWorkout } from '../WorkoutContext';
import { STORAGE_KEYS, WORKOUT } from '../config';

// ── ユーティリティ ─────────────────────────────────────────────────────────────

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <WorkoutProvider>{children}</WorkoutProvider>
);

/** AsyncStorage のモック関数をすべてリセットする */
function resetAsyncStorage() {
  (AsyncStorage.getItem as jest.Mock).mockReset().mockResolvedValue(null);
  (AsyncStorage.setItem as jest.Mock).mockReset().mockResolvedValue(undefined);
  (AsyncStorage.clear as jest.Mock).mockReset().mockResolvedValue(undefined);
}

/** YYYY-MM-DD 文字列を返す */
function dateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** today から n 日前の Date を返す（n=0 なら今日） */
function daysAgo(n: number, base: Date): Date {
  const d = new Date(base);
  d.setDate(d.getDate() - n);
  return d;
}

// ── セットアップ ───────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-03-31T10:00:00.000Z'));
  resetAsyncStorage();
});

afterEach(() => {
  jest.useRealTimers();
});

// ═══════════════════════════════════════════════════════════════════════════════
// 1. 初期ロード
// ═══════════════════════════════════════════════════════════════════════════════

describe('初期ロード', () => {
  it('ストレージが空の場合は空の初期状態になる', async () => {
    const { result } = renderHook(() => useWorkout(), { wrapper });

    // useEffect 非同期ロードを待つ
    await act(async () => {});

    expect(result.current.workouts).toEqual([]);
    expect(result.current.personalRecords).toEqual([]);
    expect(result.current.templates).toEqual([]);
    expect(result.current.currentSession).toBeNull();
    expect(result.current.weeklyStats).toEqual({
      workoutCount: 0,
      totalVolume: 0,
      streakDays: 0,
    });
  });

  it('保存済みワークアウトをロードする', async () => {
    const savedWorkouts = [
      {
        id: 'w1',
        date: '2026-03-31',
        sessions: [],
        totalVolume: 500,
        duration: 3600,
      },
    ];
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === STORAGE_KEYS.WORKOUTS) return Promise.resolve(JSON.stringify(savedWorkouts));
      return Promise.resolve(null);
    });

    const { result } = renderHook(() => useWorkout(), { wrapper });
    await act(async () => {});

    expect(result.current.workouts).toHaveLength(1);
    expect(result.current.workouts[0].id).toBe('w1');
  });

  it('保存済み workoutConfig をマージしてロードする', async () => {
    const savedConfig = { weightStep: 5, defaultSets: 3 };
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === STORAGE_KEYS.WORKOUT_CONFIG)
        return Promise.resolve(JSON.stringify(savedConfig));
      return Promise.resolve(null);
    });

    const { result } = renderHook(() => useWorkout(), { wrapper });
    await act(async () => {});

    expect(result.current.workoutConfig.weightStep).toBe(5);
    expect(result.current.workoutConfig.defaultSets).toBe(3);
    // デフォルト値は保持される
    expect(result.current.workoutConfig.defaultWeight).toBe(WORKOUT.DEFAULT_WEIGHT);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. startSession
// ═══════════════════════════════════════════════════════════════════════════════

describe('startSession', () => {
  it('currentSession を作成する', async () => {
    const { result } = renderHook(() => useWorkout(), { wrapper });
    await act(async () => {});

    act(() => {
      result.current.startSession('bench-press');
    });

    expect(result.current.currentSession).not.toBeNull();
    expect(result.current.currentSession?.exerciseId).toBe('bench-press');
    expect(result.current.currentSession?.sets).toEqual([]);
    expect(result.current.currentSession?.startedAt).toBeTruthy();
  });

  it('別の種目を呼ぶとセッションが上書きされる', async () => {
    const { result } = renderHook(() => useWorkout(), { wrapper });
    await act(async () => {});

    act(() => {
      result.current.startSession('bench-press');
    });
    act(() => {
      result.current.startSession('squat');
    });

    expect(result.current.currentSession?.exerciseId).toBe('squat');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. addSet + PR 判定
// ═══════════════════════════════════════════════════════════════════════════════

describe('addSet', () => {
  it('セットが currentSession に追加される', async () => {
    const { result } = renderHook(() => useWorkout(), { wrapper });
    await act(async () => {});

    act(() => {
      result.current.startSession('bench-press');
    });
    act(() => {
      result.current.addSet(100, 8);
    });

    expect(result.current.currentSession?.sets).toHaveLength(1);
    expect(result.current.currentSession?.sets[0].weight).toBe(100);
    expect(result.current.currentSession?.sets[0].reps).toBe(8);
  });

  it('PR なし → isPersonalRecord=true（初PR）', async () => {
    const { result } = renderHook(() => useWorkout(), { wrapper });
    await act(async () => {});

    act(() => result.current.startSession('bench-press'));
    act(() => result.current.addSet(80, 5));

    expect(result.current.currentSession?.sets[0].isPersonalRecord).toBe(true);
  });

  it('既存 PR を超える重量 → isPersonalRecord=true', async () => {
    // 既存 PR を持つ状態を先に作る（completeSession で PR を登録）
    const { result } = renderHook(() => useWorkout(), { wrapper });
    await act(async () => {});

    // 1回目セッションで PR=100 kg を記録
    act(() => result.current.startSession('bench-press'));
    act(() => result.current.addSet(100, 5));
    await act(async () => { await result.current.completeSession(); });

    // 2回目: 101 kg → PR 更新
    act(() => result.current.startSession('bench-press'));
    act(() => result.current.addSet(101, 5));

    const sets = result.current.currentSession?.sets ?? [];
    expect(sets[0].isPersonalRecord).toBe(true);
  });

  it('既存 PR 以下の重量 → isPersonalRecord=false', async () => {
    const { result } = renderHook(() => useWorkout(), { wrapper });
    await act(async () => {});

    // PR=100 kg を記録
    act(() => result.current.startSession('bench-press'));
    act(() => result.current.addSet(100, 5));
    await act(async () => { await result.current.completeSession(); });

    // 2回目: 100 kg（同じ） → PR ではない
    act(() => result.current.startSession('bench-press'));
    act(() => result.current.addSet(100, 5));

    expect(result.current.currentSession?.sets[0].isPersonalRecord).toBe(false);
  });

  it('weight=null → isPersonalRecord=false', async () => {
    const { result } = renderHook(() => useWorkout(), { wrapper });
    await act(async () => {});

    act(() => result.current.startSession('plank'));
    act(() => result.current.addSet(null, 60));

    expect(result.current.currentSession?.sets[0].isPersonalRecord).toBe(false);
  });

  it('複数セットを追加できる', async () => {
    const { result } = renderHook(() => useWorkout(), { wrapper });
    await act(async () => {});

    act(() => result.current.startSession('bench-press'));
    act(() => result.current.addSet(80, 10));
    act(() => result.current.addSet(90, 8));
    act(() => result.current.addSet(100, 5));

    expect(result.current.currentSession?.sets).toHaveLength(3);
  });

  it('currentSession が null のとき addSet を呼んでも何もしない', async () => {
    const { result } = renderHook(() => useWorkout(), { wrapper });
    await act(async () => {});

    // currentSession = null の状態で addSet を呼ぶ
    act(() => result.current.addSet(100, 5));

    // currentSession は null のまま
    expect(result.current.currentSession).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. completeSession
// ═══════════════════════════════════════════════════════════════════════════════

describe('completeSession', () => {
  it('currentSession=null → 何もしない', async () => {
    const { result } = renderHook(() => useWorkout(), { wrapper });
    await act(async () => {});

    await act(async () => { await result.current.completeSession(); });

    expect(result.current.workouts).toHaveLength(0);
  });

  it('sets が空 → currentSession をクリアして終了', async () => {
    const { result } = renderHook(() => useWorkout(), { wrapper });
    await act(async () => {});

    act(() => result.current.startSession('bench-press'));
    await act(async () => { await result.current.completeSession(); });

    expect(result.current.currentSession).toBeNull();
    expect(result.current.workouts).toHaveLength(0);
  });

  it('新規 DailyWorkout を作成し volume を計算する', async () => {
    const { result } = renderHook(() => useWorkout(), { wrapper });
    await act(async () => {});

    act(() => result.current.startSession('bench-press'));
    act(() => result.current.addSet(100, 5)); // 500
    act(() => result.current.addSet(80, 8));  // 640
    await act(async () => { await result.current.completeSession(); });

    expect(result.current.workouts).toHaveLength(1);
    expect(result.current.workouts[0].totalVolume).toBe(1140); // 500+640
    expect(result.current.workouts[0].date).toBe('2026-03-31');
    expect(result.current.currentSession).toBeNull();
  });

  it('weight=null や reps=null のセットは volume 計算から除外される', async () => {
    const { result } = renderHook(() => useWorkout(), { wrapper });
    await act(async () => {});

    act(() => result.current.startSession('plank'));
    act(() => result.current.addSet(null, 60)); // 除外
    act(() => result.current.addSet(100, 5));   // 500
    await act(async () => { await result.current.completeSession(); });

    expect(result.current.workouts[0].totalVolume).toBe(500);
  });

  it('同日に2回目のセッションを完了するとマージされる', async () => {
    const { result } = renderHook(() => useWorkout(), { wrapper });
    await act(async () => {});

    // 1回目
    act(() => result.current.startSession('bench-press'));
    act(() => result.current.addSet(100, 5)); // 500
    await act(async () => { await result.current.completeSession(); });

    // 2回目（同日）
    act(() => result.current.startSession('squat'));
    act(() => result.current.addSet(120, 5)); // 600
    await act(async () => { await result.current.completeSession(); });

    expect(result.current.workouts).toHaveLength(1);
    expect(result.current.workouts[0].sessions).toHaveLength(2);
    expect(result.current.workouts[0].totalVolume).toBe(1100); // 500+600
  });

  it('PR を新規作成する', async () => {
    const { result } = renderHook(() => useWorkout(), { wrapper });
    await act(async () => {});

    act(() => result.current.startSession('bench-press'));
    act(() => result.current.addSet(100, 8));
    act(() => result.current.addSet(120, 5));
    await act(async () => { await result.current.completeSession(); });

    const pr = result.current.personalRecords.find(r => r.exerciseId === 'bench-press');
    expect(pr).toBeDefined();
    expect(pr?.maxWeight).toBe(120);
    expect(pr?.maxReps).toBe(8);
    expect(pr?.maxVolume).toBe(100 * 8 + 120 * 5); // 800+600=1400
  });

  it('既存 PR を更新する（最大値を保持）', async () => {
    const { result } = renderHook(() => useWorkout(), { wrapper });
    await act(async () => {});

    // 1回目: maxWeight=100, maxReps=10
    act(() => result.current.startSession('bench-press'));
    act(() => result.current.addSet(100, 10));
    await act(async () => { await result.current.completeSession(); });

    // 2回目: maxWeight=110, maxReps=5（reps は前回が上回る）
    act(() => result.current.startSession('bench-press'));
    act(() => result.current.addSet(110, 5));
    await act(async () => { await result.current.completeSession(); });

    const pr = result.current.personalRecords.find(r => r.exerciseId === 'bench-press');
    expect(pr?.maxWeight).toBe(110); // 更新
    expect(pr?.maxReps).toBe(10);    // 前回の方が多い
  });

  it('completeSession 後に AsyncStorage.setItem が呼ばれる', async () => {
    const { result } = renderHook(() => useWorkout(), { wrapper });
    await act(async () => {});

    act(() => result.current.startSession('bench-press'));
    act(() => result.current.addSet(100, 5));
    await act(async () => { await result.current.completeSession(); });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEYS.WORKOUTS,
      expect.any(String),
    );
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEYS.PERSONAL_RECORDS,
      expect.any(String),
    );
  });

  it('completeSession 後に weeklyStats が更新される', async () => {
    const { result } = renderHook(() => useWorkout(), { wrapper });
    await act(async () => {});

    act(() => result.current.startSession('bench-press'));
    act(() => result.current.addSet(100, 5));
    await act(async () => { await result.current.completeSession(); });

    expect(result.current.weeklyStats.workoutCount).toBe(1);
    expect(result.current.weeklyStats.totalVolume).toBe(500);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. deleteWorkout
// ═══════════════════════════════════════════════════════════════════════════════

describe('deleteWorkout', () => {
  it('指定 id のワークアウトを削除する', async () => {
    const { result } = renderHook(() => useWorkout(), { wrapper });
    await act(async () => {});

    // セッション完了で workout を作成
    act(() => result.current.startSession('bench-press'));
    act(() => result.current.addSet(100, 5));
    await act(async () => { await result.current.completeSession(); });

    const id = result.current.workouts[0].id;

    await act(async () => { await result.current.deleteWorkout(id); });

    expect(result.current.workouts).toHaveLength(0);
  });

  it('削除後に weeklyStats が再計算される', async () => {
    const { result } = renderHook(() => useWorkout(), { wrapper });
    await act(async () => {});

    act(() => result.current.startSession('bench-press'));
    act(() => result.current.addSet(100, 5));
    await act(async () => { await result.current.completeSession(); });

    const id = result.current.workouts[0].id;
    await act(async () => { await result.current.deleteWorkout(id); });

    expect(result.current.weeklyStats.workoutCount).toBe(0);
    expect(result.current.weeklyStats.totalVolume).toBe(0);
  });

  it('存在しない id を渡しても他ワークアウトは残る', async () => {
    const { result } = renderHook(() => useWorkout(), { wrapper });
    await act(async () => {});

    act(() => result.current.startSession('bench-press'));
    act(() => result.current.addSet(100, 5));
    await act(async () => { await result.current.completeSession(); });

    await act(async () => { await result.current.deleteWorkout('non-existent'); });

    expect(result.current.workouts).toHaveLength(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. deleteSessionFromWorkout
// ═══════════════════════════════════════════════════════════════════════════════

describe('deleteSessionFromWorkout', () => {
  it('セッションを削除後 totalVolume が再計算される', async () => {
    const { result } = renderHook(() => useWorkout(), { wrapper });
    await act(async () => {});

    // bench-press + squat を同日に記録
    act(() => result.current.startSession('bench-press'));
    act(() => result.current.addSet(100, 5)); // 500
    await act(async () => { await result.current.completeSession(); });

    act(() => result.current.startSession('squat'));
    act(() => result.current.addSet(120, 5)); // 600
    await act(async () => { await result.current.completeSession(); });

    const workout = result.current.workouts[0];
    expect(workout.totalVolume).toBe(1100);

    await act(async () => {
      await result.current.deleteSessionFromWorkout(workout.id, 'bench-press');
    });

    expect(result.current.workouts[0].sessions).toHaveLength(1);
    expect(result.current.workouts[0].totalVolume).toBe(600);
  });

  it('最後のセッションを削除するとワークアウトごと消える', async () => {
    const { result } = renderHook(() => useWorkout(), { wrapper });
    await act(async () => {});

    act(() => result.current.startSession('bench-press'));
    act(() => result.current.addSet(100, 5));
    await act(async () => { await result.current.completeSession(); });

    const workout = result.current.workouts[0];

    await act(async () => {
      await result.current.deleteSessionFromWorkout(workout.id, 'bench-press');
    });

    expect(result.current.workouts).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. テンプレート管理（saveTemplate / updateTemplate / deleteTemplate）
// ═══════════════════════════════════════════════════════════════════════════════

describe('saveTemplate', () => {
  it('テンプレートを追加できる', async () => {
    const { result } = renderHook(() => useWorkout(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.saveTemplate('胸の日', ['bench-press', 'dumbbell-fly']);
    });

    expect(result.current.templates).toHaveLength(1);
    expect(result.current.templates[0].name).toBe('胸の日');
    expect(result.current.templates[0].exerciseIds).toEqual(['bench-press', 'dumbbell-fly']);
  });

  it('saveTemplate 後に AsyncStorage.setItem が呼ばれる', async () => {
    const { result } = renderHook(() => useWorkout(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.saveTemplate('脚の日', ['squat', 'leg-press']);
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEYS.TEMPLATES,
      expect.any(String),
    );
  });
});

describe('updateTemplate', () => {
  it('既存テンプレートを更新できる', async () => {
    const { result } = renderHook(() => useWorkout(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.saveTemplate('胸の日', ['bench-press']);
    });
    const id = result.current.templates[0].id;

    await act(async () => {
      await result.current.updateTemplate(id, '胸・肩の日', ['bench-press', 'overhead-press']);
    });

    expect(result.current.templates[0].name).toBe('胸・肩の日');
    expect(result.current.templates[0].exerciseIds).toEqual(['bench-press', 'overhead-press']);
  });
});

describe('deleteTemplate', () => {
  it('テンプレートを削除できる', async () => {
    const { result } = renderHook(() => useWorkout(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.saveTemplate('胸の日', ['bench-press']);
    });
    const id = result.current.templates[0].id;

    await act(async () => {
      await result.current.deleteTemplate(id);
    });

    expect(result.current.templates).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 8. updateWorkoutConfig
// ═══════════════════════════════════════════════════════════════════════════════

describe('updateWorkoutConfig', () => {
  it('部分的に設定を更新できる', async () => {
    const { result } = renderHook(() => useWorkout(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.updateWorkoutConfig({ weightStep: 5 });
    });

    expect(result.current.workoutConfig.weightStep).toBe(5);
    // 他の設定はデフォルト値を保持
    expect(result.current.workoutConfig.defaultSets).toBe(WORKOUT.DEFAULT_SETS);
  });

  it('AsyncStorage に保存される', async () => {
    const { result } = renderHook(() => useWorkout(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.updateWorkoutConfig({ defaultReps: 12 });
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEYS.WORKOUT_CONFIG,
      expect.stringContaining('"defaultReps":12'),
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 9. updateSession
// ═══════════════════════════════════════════════════════════════════════════════

describe('updateSession', () => {
  it('セッション内のセットを更新し totalVolume を再計算する', async () => {
    const { result } = renderHook(() => useWorkout(), { wrapper });
    await act(async () => {});

    act(() => result.current.startSession('bench-press'));
    act(() => result.current.addSet(100, 5)); // 500
    await act(async () => { await result.current.completeSession(); });

    const workout = result.current.workouts[0];
    const originalSession = workout.sessions[0];

    // セットを 200kg×3 に差し替えた更新セッション
    const updatedSession = {
      ...originalSession,
      sets: [
        { ...originalSession.sets[0], weight: 200, reps: 3 }, // 600
      ],
    };

    await act(async () => {
      await result.current.updateSession(workout.id, updatedSession);
    });

    expect(result.current.workouts[0].totalVolume).toBe(600);
    expect(result.current.workouts[0].sessions[0].sets[0].weight).toBe(200);
  });

  it('存在しない workoutId では何も変わらない', async () => {
    const { result } = renderHook(() => useWorkout(), { wrapper });
    await act(async () => {});

    act(() => result.current.startSession('bench-press'));
    act(() => result.current.addSet(100, 5));
    await act(async () => { await result.current.completeSession(); });

    const originalVolume = result.current.workouts[0].totalVolume;
    const dummySession = result.current.workouts[0].sessions[0];

    await act(async () => {
      await result.current.updateSession('non-existent', dummySession);
    });

    expect(result.current.workouts[0].totalVolume).toBe(originalVolume);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 10. resetAll
// ═══════════════════════════════════════════════════════════════════════════════

describe('resetAll', () => {
  it('全状態をリセットし AsyncStorage.clear を呼ぶ', async () => {
    const { result } = renderHook(() => useWorkout(), { wrapper });
    await act(async () => {});

    // データを作成しておく
    act(() => result.current.startSession('bench-press'));
    act(() => result.current.addSet(100, 5));
    await act(async () => { await result.current.completeSession(); });
    await act(async () => {
      await result.current.saveTemplate('胸の日', ['bench-press']);
    });

    await act(async () => { await result.current.resetAll(); });

    expect(result.current.workouts).toEqual([]);
    expect(result.current.personalRecords).toEqual([]);
    expect(result.current.templates).toEqual([]);
    expect(result.current.currentSession).toBeNull();
    expect(result.current.weeklyStats).toEqual({
      workoutCount: 0,
      totalVolume: 0,
      streakDays: 0,
    });
    expect(result.current.workoutConfig).toEqual({
      weightStep: WORKOUT.WEIGHT_STEP,
      defaultSets: WORKOUT.DEFAULT_SETS,
      defaultWeight: WORKOUT.DEFAULT_WEIGHT,
      defaultReps: WORKOUT.DEFAULT_REPS,
    });
    expect(AsyncStorage.clear).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 11. weeklyStats / streakDays 計算
// ═══════════════════════════════════════════════════════════════════════════════

describe('weeklyStats', () => {
  it('7日以内のワークアウトのみカウントする', async () => {
    // 今日=2026-03-31: 8日前=2026-03-23（範囲外）
    const today = new Date('2026-03-31T10:00:00.000Z');

    const withinRange = {
      id: 'w1',
      date: dateStr(daysAgo(6, today)), // 2026-03-25
      sessions: [],
      totalVolume: 200,
      duration: 0,
    };
    const outOfRange = {
      id: 'w2',
      date: dateStr(daysAgo(7, today)), // 2026-03-24（境界外: since は今日-6）
      sessions: [],
      totalVolume: 300,
      duration: 0,
    };

    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === STORAGE_KEYS.WORKOUTS)
        return Promise.resolve(JSON.stringify([withinRange, outOfRange]));
      return Promise.resolve(null);
    });

    const { result } = renderHook(() => useWorkout(), { wrapper });
    await act(async () => {});

    // sinceStr = today-6 = 2026-03-25, 境界内: w1 のみ
    expect(result.current.weeklyStats.workoutCount).toBe(1);
    expect(result.current.weeklyStats.totalVolume).toBe(200);
  });

  it('今日から連続するワークアウトで streakDays を計算する', async () => {
    const today = new Date('2026-03-31T10:00:00.000Z');

    const workouts = [
      { id: 'w3', date: dateStr(daysAgo(0, today)), sessions: [], totalVolume: 0, duration: 0 }, // 今日
      { id: 'w4', date: dateStr(daysAgo(1, today)), sessions: [], totalVolume: 0, duration: 0 }, // 昨日
      { id: 'w5', date: dateStr(daysAgo(2, today)), sessions: [], totalVolume: 0, duration: 0 }, // 一昨日
      // 3日前は空（連続が途切れる）
      { id: 'w6', date: dateStr(daysAgo(4, today)), sessions: [], totalVolume: 0, duration: 0 },
    ];

    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === STORAGE_KEYS.WORKOUTS)
        return Promise.resolve(JSON.stringify(workouts));
      return Promise.resolve(null);
    });

    const { result } = renderHook(() => useWorkout(), { wrapper });
    await act(async () => {});

    expect(result.current.weeklyStats.streakDays).toBe(3); // 今日・昨日・一昨日
  });

  it('今日ワークアウトなし → streakDays=0', async () => {
    const today = new Date('2026-03-31T10:00:00.000Z');

    const workouts = [
      // 今日は記録なし、昨日以前だけ
      { id: 'w7', date: dateStr(daysAgo(1, today)), sessions: [], totalVolume: 0, duration: 0 },
    ];

    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === STORAGE_KEYS.WORKOUTS)
        return Promise.resolve(JSON.stringify(workouts));
      return Promise.resolve(null);
    });

    const { result } = renderHook(() => useWorkout(), { wrapper });
    await act(async () => {});

    expect(result.current.weeklyStats.streakDays).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 12. PR 計算の境界値テスト
// ═══════════════════════════════════════════════════════════════════════════════

describe('PR 計算の境界値', () => {
  it('自重種目（weight=null）はセッション完了後も maxWeight=null を維持する', async () => {
    const { result } = renderHook(() => useWorkout(), { wrapper });
    await act(async () => {});

    act(() => result.current.startSession('pull-up'));
    act(() => result.current.addSet(null, 10));
    act(() => result.current.addSet(null, 12));
    await act(async () => { await result.current.completeSession(); });

    const pr = result.current.personalRecords.find(r => r.exerciseId === 'pull-up');
    expect(pr?.maxWeight).toBeNull();
    expect(pr?.maxReps).toBe(12);
    expect(pr?.maxVolume).toBe(0); // weight=null → volume=0
  });

  it('maxVolume は1セッション内の合計ボリューム', async () => {
    const { result } = renderHook(() => useWorkout(), { wrapper });
    await act(async () => {});

    act(() => result.current.startSession('bench-press'));
    act(() => result.current.addSet(100, 5)); // 500
    act(() => result.current.addSet(80, 8));  // 640
    await act(async () => { await result.current.completeSession(); });

    // 2回目: より少ない volume
    act(() => result.current.startSession('bench-press'));
    act(() => result.current.addSet(50, 3)); // 150
    await act(async () => { await result.current.completeSession(); });

    const pr = result.current.personalRecords.find(r => r.exerciseId === 'bench-press');
    // maxVolume は max(1140, 150) = 1140
    expect(pr?.maxVolume).toBe(1140);
  });
});
